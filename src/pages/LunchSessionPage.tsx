import { useEffect, useState } from 'react'
import { CalendarCheck, PlayCircle, ShieldAlert, StopCircle } from 'lucide-react'
import { lunchSessionApi } from '../api/lunchSession'
import { useAuth } from '../context/AuthContext'
import { useCan } from '../hooks/useCan'
import { notify } from '../utils/toast'
import { errorMessage, CONFLICT } from '../utils/apiErrors'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import { DatePickerCalendar, type SessionMark } from '../components/ui/DatePickerCalendar'
import { SedeSelector } from '../components/SedeSelector'
import type { LunchSession } from '../types/lunchSession'

/** Mínimo del motivo de un cierre forzado; el servidor lo valida igual (422). */
const MIN_FORCE_REASON = 10

function sedeName(session: LunchSession): string {
  return session.sede?.name ?? `Sede #${session.sede_id ?? '—'}`
}

export function LunchSessionPage() {
  const { user } = useAuth()
  const [openSessions, setOpenSessions] = useState<LunchSession[]>([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [closeTarget,  setCloseTarget]  = useState<LunchSession | null>(null)
  const [forceTarget,  setForceTarget]  = useState<LunchSession | null>(null)
  const [forceReason,  setForceReason]  = useState('')
  const [openModal,    setOpenModal]    = useState(false)
  const [newSedeId,    setNewSedeId]    = useState<number | null>(null)
  // Platos planificados del turno: alimenta "N° de Platos" y "Platos Faltantes"
  // en el registro al comedor. Opcional: vacío = sesión sin planificación.
  const [newPlates,    setNewPlates]    = useState('')
  const [openError,    setOpenError]    = useState<string | null>(null)
  const [sedesReload,  setSedesReload]  = useState(0)
  const [sessionMarks, setSessionMarks] = useState<SessionMark[]>([])
  // Un 403 no es "no hay sesiones". Confundirlos fue lo que hizo que conceder la
  // pantalla pareciera funcionar cuando no lo hacía.
  const [listError, setListError] = useState<'forbidden' | 'error' | null>(null)

  const { can } = useCan()
  const role    = user?.role.name
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN'
  // El permiso de la pantalla concede la operación, igual que en el servidor: es lo
  // que permite que un acceso directo inicie el servicio cuando haga falta.
  const canOpen = can('/comedor/sesion')
  // El historial enseña las sesiones de todas las sedes: exige su propia pantalla y
  // no se cuela con la de sesión, o devolvería el panorama que esta vista retira.
  const canSeeHistory = can('/comedor/historial')

  const isOwner = (s: LunchSession) =>
    s.opened_by_id != null && s.opened_by_id === user?.id
  // Las sesiones sin propietario son anteriores a este control: no hay a quién
  // proteger y sin la excepción quedarían abiertas para siempre.
  const canClose = (s: LunchSession) =>
    can('/comedor/sesion') && (isOwner(s) || (isAdmin && s.opened_by_id == null))
  // `isAdmin` y el rol sobreviven solo donde el servidor también razona por rol: la
  // excepción de las sesiones sin propietario y el cierre forzado (suelo por rol).
  const canForce = (s: LunchSession) => role === 'SUPER_ADMIN' && !canClose(s)

  useEffect(() => {
    void fetchOpenSessions()
    // No se pide lo que se sabe que va a responder 403.
    if (canSeeHistory) void fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeHistory])

  async function fetchHistory() {
    try {
      const result = await lunchSessionApi.list(0, 120)
      setSessionMarks(
        result.items.map((s) => ({ date: s.date, status: s.status }))
      )
    } catch {
      // Non-critical — calendar history is decorative
    }
  }

  async function fetchOpenSessions() {
    setLoading(true)
    try {
      // Llega ya acotado por el servidor: un taquillero recibe solo las suyas.
      // No se vuelve a filtrar aquí para no crear una segunda fuente de verdad.
      const result = await lunchSessionApi.openList()
      setOpenSessions(result.items)
      setListError(null)
    } catch (err: any) {
      setListError(err?.status === 403 ? 'forbidden' : 'error')
      setOpenSessions([])
    } finally {
      setLoading(false)
    }
  }

  function openOpenModal() {
    setNewSedeId(null)
    setNewPlates('')
    setOpenError(null)
    setOpenModal(true)
  }

  async function handleOpen() {
    if (newSedeId == null) {
      setOpenError('Selecciona una sede.')
      return
    }
    const platesRaw = newPlates.trim()
    const plates = platesRaw === '' ? null : Number(platesRaw)
    if (plates != null && (!Number.isInteger(plates) || plates < 0)) {
      setOpenError('El número de platos debe ser un entero positivo.')
      return
    }
    setSaving(true)
    try {
      const s = await lunchSessionApi.open({ sede_id: newSedeId, plates_quantity: plates })
      setOpenModal(false)
      notify.success(`Sesión abierta en ${sedeName(s)}.`)
      await fetchOpenSessions()
      if (canSeeHistory) void fetchHistory()
    } catch (err) {
      setOpenError(errorMessage(err, { 409: CONFLICT.sessionAlreadyOpen }, 'Error al abrir la sesión'))
      // Otra taquilla ganó la carrera: el catálogo de sedes libres ya no vale.
      setSedesReload((n) => n + 1)
      setNewSedeId(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleClose(target: LunchSession) {
    setSaving(true)
    try {
      await lunchSessionApi.close(target.id)
      notify.success(`Sesión de ${sedeName(target)} cerrada.`)
      setCloseTarget(null)
      await fetchOpenSessions()
      if (canSeeHistory) void fetchHistory()
    } catch (err) {
      // El 403 del servidor es la autoridad: si discrepa de lo que pintó la UI,
      // gana él y su mensaje, que ya nombra a quien abrió la sesión.
      notify.error(errorMessage(err, undefined, 'Error al cerrar la sesión'))
      setCloseTarget(null)
      await fetchOpenSessions()
    } finally {
      setSaving(false)
    }
  }

  async function handleForceClose(target: LunchSession) {
    setSaving(true)
    try {
      await lunchSessionApi.forceClose(target.id, forceReason.trim())
      notify.success(`Sesión de ${sedeName(target)} cerrada de forma forzada.`)
      setForceTarget(null)
      setForceReason('')
      await fetchOpenSessions()
      if (canSeeHistory) void fetchHistory()
    } catch (err) {
      notify.error(errorMessage(err, undefined, 'Error al forzar el cierre'))
    } finally {
      setSaving(false)
    }
  }

  function openForceModal(target: LunchSession) {
    setForceReason('')
    setForceTarget(target)
  }

  const forceReasonTooShort = forceReason.trim().length < MIN_FORCE_REASON

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        breadcrumb="Comedor"
        title="Sesión de Servicio de alimentación"
        subtitle="Abre o cierra las sesiones de servicio por sede. Cada sede admite una sola sesión abierta, y la cierra quien la abrió."
      />

      <Modal
        open={closeTarget !== null}
        onClose={() => setCloseTarget(null)}
        title="Cerrar Sesión de Servicio de alimentación"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCloseTarget(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={saving}
              onClick={() => { if (closeTarget) void handleClose(closeTarget) }}
            >
              Confirmar cierre
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas cerrar la sesión de {closeTarget ? sedeName(closeTarget) : 'esta sede'}?
          Los registros ya guardados no se perderán, pero no se podrán agregar nuevos hasta abrir una nueva sesión en esa sede.
        </p>
      </Modal>

      <Modal
        open={forceTarget !== null}
        onClose={() => { if (!saving) setForceTarget(null) }}
        title="Cierre forzado de la sesión"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setForceTarget(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={saving}
              disabled={forceReasonTooShort}
              onClick={() => { if (forceTarget) void handleForceClose(forceTarget) }}
            >
              Forzar cierre
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {forceTarget && (
            <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <p>
                Abierta por{' '}
                <span className="font-semibold text-slate-800">
                  {forceTarget.opened_by_name ?? 'un usuario no registrado'}
                </span>
              </p>
              <p>
                {sedeName(forceTarget)}
                {forceTarget.opened_at &&
                  ` · desde las ${new Date(forceTarget.opened_at).toLocaleTimeString()}`}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="force-reason" className="text-sm font-medium text-slate-700">
              Motivo del cierre forzado
            </label>
            <textarea
              id="force-reason"
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
              placeholder="Ej.: el taquillero terminó su turno sin cerrar la sesión."
              value={forceReason}
              onChange={(e) => setForceReason(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              {forceReason.trim().length}/{MIN_FORCE_REASON} caracteres mínimos
            </p>
          </div>
          <p className="text-xs text-amber-700">
            Esta acción queda registrada en la auditoría del sistema.
          </p>
        </div>
      </Modal>

      <Modal
        open={openModal}
        onClose={() => { if (!saving) setOpenModal(false) }}
        title="Abrir Sesión de Servicio de alimentación"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpenModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={newSedeId == null}
              onClick={handleOpen}
            >
              Abrir Sesión
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {/*
            El servidor es quien sabe qué sedes están libres: con el listado de
            sesiones abiertas acotado por rol, restarlas aquí dejaría al taquillero
            eligiendo una sede ocupada y enterándose solo con el 409.
          */}
          <SedeSelector
            value={newSedeId}
            onChange={setNewSedeId}
            source="openable"
            reloadKey={sedesReload}
          />
          <Input
            id="session-plates"
            type="number"
            min={0}
            label="N° de platos"
            hint="Platos planificados para el turno. Se usa para calcular los platos faltantes."
            placeholder="Opcional"
            value={newPlates}
            onChange={(e) => { setNewPlates(e.target.value); setOpenError(null) }}
            fullWidth
          />
          {openError && (
            <p className="text-xs text-red-600" role="alert">{openError}</p>
          )}
        </div>
      </Modal>

      <Card variant="outlined" padding="lg">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarCheck size={28} className={openSessions.length ? 'text-green-500' : 'text-slate-400'} />
                <span className="text-sm font-semibold text-slate-700">
                  {isAdmin ? 'Sesiones abiertas' : 'Tus sesiones abiertas'}
                </span>
              </div>
              {canOpen && (
                <Button variant="primary" size="sm" onClick={openOpenModal}>
                  <PlayCircle size={16} className="mr-1" />
                  Abrir Sesión
                </Button>
              )}
            </div>

            {listError !== null ? (
              <div className="flex flex-col items-start gap-2">
                <Badge variant="danger">
                  {listError === 'forbidden' ? 'Sin acceso' : 'Error al cargar'}
                </Badge>
                <p className="text-sm text-slate-500">
                  {listError === 'forbidden'
                    ? 'No tienes acceso a las sesiones de servicio. Pide que te concedan la pantalla «Sesión de Servicio de alimentación».'
                    : 'No se pudieron cargar las sesiones. Vuelve a intentarlo.'}
                </p>
              </div>
            ) : openSessions.length === 0 ? (
              <div className="flex flex-col items-start gap-2">
                <Badge variant="warning">
                  {isAdmin ? 'No hay sesiones abiertas' : 'No tienes ninguna sesión abierta'}
                </Badge>
                <p className="text-sm text-slate-500">
                  {isAdmin
                    ? 'Ninguna sede tiene una sesión de servicio de alimentación activa en este momento.'
                    : 'Abre una sesión para empezar a registrar el servicio de alimentación.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {openSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-4 py-3"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Abierta</Badge>
                        <span className="text-sm font-semibold text-slate-800">{sedeName(s)}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Fecha: {s.date}
                        {s.plates_quantity != null && ` · ${s.plates_quantity} platos`}
                        {s.opened_at && ` · Abierta a las ${new Date(s.opened_at).toLocaleTimeString()}`}
                        {s.opened_by_name && ` · por ${s.opened_by_name}`}
                      </span>
                      {!canClose(s) && (
                        <span className="text-xs text-slate-400">
                          Solo {s.opened_by_name ?? 'quien la abrió'} puede cerrar esta sesión.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={saving || !canClose(s)}
                        title={
                          canClose(s)
                            ? undefined
                            : `Solo ${s.opened_by_name ?? 'quien la abrió'} puede cerrar esta sesión`
                        }
                        onClick={() => setCloseTarget(s)}
                      >
                        <StopCircle size={14} className="mr-1" />
                        Cerrar
                      </Button>
                      {canForce(s) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={saving}
                          onClick={() => openForceModal(s)}
                        >
                          <ShieldAlert size={14} className="mr-1" />
                          Cierre forzado
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!canOpen && (
              <p className="text-sm text-slate-500 pt-2 border-t border-slate-100">
                No tienes concedida la pantalla «Sesión de Servicio de alimentación», así que no
                puedes abrir ni cerrar sesiones.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Session history calendar — solo ADMIN+: el endpoint no admite taquilleros */}
      {canSeeHistory ? (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Historial de sesiones
          </h3>
          <div className="flex gap-4 items-start flex-wrap">
            <DatePickerCalendar
              readOnly
              sessionMarks={sessionMarks}
            />
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
                Sesión abierta
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400 inline-block" />
                Sesión cerrada
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-slate-500">
          Solo se muestran las sesiones que abriste.
        </p>
      )}
    </div>
  )
}
