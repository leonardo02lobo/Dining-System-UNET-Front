import { useEffect, useState } from 'react'
import { CalendarCheck, PlayCircle, StopCircle } from 'lucide-react'
import { lunchSessionApi } from '../api/lunchSession'
import { useAuth } from '../context/AuthContext'
import { notify } from '../utils/toast'
import { errorMessage, CONFLICT } from '../utils/apiErrors'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import { DatePickerCalendar, type SessionMark } from '../components/ui/DatePickerCalendar'
import { SedeSelector } from '../components/SedeSelector'
import type { LunchSession } from '../types/lunchSession'

function sedeName(session: LunchSession): string {
  return session.sede?.name ?? `Sede #${session.sede_id ?? '—'}`
}

export function LunchSessionPage() {
  const { user } = useAuth()
  const [openSessions, setOpenSessions] = useState<LunchSession[]>([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [closeTarget,  setCloseTarget]  = useState<LunchSession | null>(null)
  const [openModal,    setOpenModal]    = useState(false)
  const [newSedeId,    setNewSedeId]    = useState<number | null>(null)
  const [openError,    setOpenError]    = useState<string | null>(null)
  const [sessionMarks, setSessionMarks] = useState<SessionMark[]>([])

  const canManage = user?.role.name === 'SUPER_ADMIN' || user?.role.name === 'ADMIN'

  useEffect(() => {
    void fetchOpenSessions()
    void fetchHistory()
  }, [])

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
      const result = await lunchSessionApi.openList()
      setOpenSessions(result.items)
    } catch {
      setOpenSessions([])
    } finally {
      setLoading(false)
    }
  }

  function openOpenModal() {
    setNewSedeId(null)
    setOpenError(null)
    setOpenModal(true)
  }

  async function handleOpen() {
    if (newSedeId == null) {
      setOpenError('Selecciona una sede.')
      return
    }
    setSaving(true)
    try {
      const s = await lunchSessionApi.open({ sede_id: newSedeId })
      setOpenModal(false)
      notify.success(`Sesión abierta en ${sedeName(s)}.`)
      await fetchOpenSessions()
      void fetchHistory()
    } catch (err) {
      setOpenError(errorMessage(err, { 409: CONFLICT.sessionAlreadyOpen }, 'Error al abrir la sesión'))
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
      void fetchHistory()
    } catch (err) {
      notify.error(errorMessage(err, undefined, 'Error al cerrar la sesión'))
    } finally {
      setSaving(false)
    }
  }

  const excludeSedeIds = openSessions.map((s) => s.sede_id).filter((id): id is number => id != null)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader
        breadcrumb="Comedor"
        title="Sesión de Servicio de alimentación"
        subtitle="Abre o cierra las sesiones de servicio por sede. Cooldown de 12h por sede entre cierres y aperturas."
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
          <SedeSelector value={newSedeId} onChange={setNewSedeId} excludeIds={excludeSedeIds} />
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
                <span className="text-sm font-semibold text-slate-700">Sesiones abiertas</span>
              </div>
              {canManage && (
                <Button variant="primary" size="sm" onClick={openOpenModal}>
                  <PlayCircle size={16} className="mr-1" />
                  Abrir Sesión
                </Button>
              )}
            </div>

            {openSessions.length === 0 ? (
              <div className="flex flex-col items-start gap-2">
                <Badge variant="warning">No hay sesiones abiertas</Badge>
                <p className="text-sm text-slate-400">
                  Ninguna sede tiene una sesión de servicio de alimentación activa en este momento.
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
                      <span className="text-xs text-slate-400">
                        Fecha: {s.date}
                        {s.opened_at && ` · Abierta a las ${new Date(s.opened_at).toLocaleTimeString()}`}
                      </span>
                    </div>
                    {canManage && (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={saving}
                        onClick={() => setCloseTarget(s)}
                      >
                        <StopCircle size={14} className="mr-1" />
                        Cerrar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!canManage && (
              <p className="text-sm text-slate-400 pt-2 border-t border-slate-100">
                Solo los administradores pueden abrir o cerrar sesiones.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Session history calendar */}
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
    </div>
  )
}
