import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, ScanLine, Ban, AlertTriangle, Users, History } from 'lucide-react'
import { studentApi, studentToIdentity } from '../api/student'
import { lunchSessionApi } from '../api/lunchSession'
import { consumptionApi } from '../api/consumption'
import { sanctionApi } from '../api/sanction'
import { normalizeCedula } from '../utils/cedula'
import { errorMessage, CONFLICT } from '../utils/apiErrors'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import type { Student } from '../types/user'
import type { LunchSession } from '../types/lunchSession'
import type { Sanction } from '../types/sanction'
import type { Sede } from '../types/sede'
import { notify } from '../utils/toast'
import { playSound, DUPLICATE_ALERT_SOUND, DUPLICATE_ALERT_DURATION_MS } from '../utils/sound'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Table, type ColumnDef } from '../components/ui/Table'
import { PageHeader } from '../components/ui/PageHeader'
import type { Consumption } from '../types/consumption'
import { StudentResultCard } from '../components/StudentResultCard'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { SedeSelector } from '../components/SedeSelector'

// Única clave persistida en localStorage del proyecto: recuerda la sede elegida
// por el taquillero entre sesiones del navegador (no es información sensible).
const SEDE_STORAGE_KEY = 'selected_sede_id'

// Cantidad de personas recientes mostradas en la ventana emergente (issue #7).
const RECENT_LIMIT = 10
// Intervalo de refresco del contador y de las últimas personas (issues #6/#7):
// mantiene la exactitud entre varios taquilleros de la misma sede.
const SESSION_POLL_MS = 15_000

function readStoredSedeId(): number | null {
  const raw = localStorage.getItem(SEDE_STORAGE_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

/** Formatea la hora de registro (ISO) como HH:mm local para la ventana de últimos. */
function formatRegisteredTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

export function RegisterDining() {
  const { user } = useAuth()
  const [sedeId,     setSedeId]     = useState<number | null>(readStoredSedeId)
  const [sedes,      setSedes]      = useState<Sede[]>([])
  const [session,    setSession]    = useState<LunchSession | null | undefined>(undefined)
  const [cedula,     setCedula]     = useState('')
  const [student,    setStudent]    = useState<Student | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [searched,   setSearched]   = useState(false)

  // Aviso de consumo duplicado (ya consumió hoy)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  // Cancelador del sonido de alerta en curso (issue #5): permite cortarlo antes de los 10 s.
  const duplicateSoundStop = useRef<(() => void) | null>(null)

  // Contador de registros de la sesión (issue #6) y ventana de últimas personas (issue #7).
  const [sessionCount, setSessionCount] = useState<number | null>(null)
  const [recentEntrants, setRecentEntrants] = useState<Consumption[]>([])
  const [recentOpen, setRecentOpen] = useState(false)

  // Suspensión rápida (problemáticas 29 y 30)
  const [activeSanction, setActiveSanction] = useState<Sanction | null>(null)
  const [suspendOpen,    setSuspendOpen]    = useState(false)
  const [suspendReason,  setSuspendReason]  = useState('')
  const [suspendError,   setSuspendError]   = useState<string | null>(null)
  const [suspending,     setSuspending]     = useState(false)

  // Detiene cualquier alerta de duplicado en curso al desmontar la pantalla.
  useEffect(() => () => duplicateSoundStop.current?.(), [])

  useEffect(() => {
    if (sedeId == null) {
      setSession(null)
      return
    }
    setSession(undefined)
    lunchSessionApi.today(sedeId)
      .then((s) => setSession(s))
      .catch(() => setSession(null))
  }, [sedeId])

  // Carga el total de registros de la sesión (#6) y las últimas personas (#7).
  // Silenciosa: son datos informativos y no deben interrumpir el flujo de registro.
  const loadSessionData = useCallback(async () => {
    if (!session) return
    try {
      const res = await consumptionApi.sessionRecent(session.id, RECENT_LIMIT)
      setSessionCount(res.total)
      setRecentEntrants(res.items)
    } catch {
      /* ignore: contador/últimas son best-effort */
    }
  }, [session])

  // Al cambiar de sede/sesión: recarga o resetea el contador y las últimas personas.
  useEffect(() => {
    if (!session) {
      setSessionCount(null)
      setRecentEntrants([])
      return
    }
    void loadSessionData()
  }, [session, loadSessionData])

  // Polling periódico para reflejar registros de otros taquilleros de la misma sede.
  useEffect(() => {
    if (!session) return
    const id = window.setInterval(() => { void loadSessionData() }, SESSION_POLL_MS)
    return () => window.clearInterval(id)
  }, [session, loadSessionData])

  function handleSedeChange(id: number | null) {
    setSedeId(id)
    if (id != null) {
      localStorage.setItem(SEDE_STORAGE_KEY, String(id))
    } else {
      localStorage.removeItem(SEDE_STORAGE_KEY)
    }
  }

  function handleSedesLoaded(loaded: Sede[]) {
    setSedes(loaded)
    if (sedeId != null && !loaded.some((s) => s.id === sedeId)) {
      // La sede guardada ya no existe o no está activa
      setSedeId(null)
      localStorage.removeItem(SEDE_STORAGE_KEY)
      return
    }
    if (sedeId == null && loaded.length === 1) {
      handleSedeChange(loaded[0].id)
    }
  }

  // ── Scanner USB: captura entrada rápida de teclado ──────────────
  useBarcodeScanner((scanned) => {
    setCedula(scanned)
    void triggerSearch(scanned)
  })

  // ── Búsqueda (manual o por scanner) ─────────────────────────────
  async function triggerSearch(value: string) {
    const clean = normalizeCedula(value)
    if (!clean) return
    setCedula(clean)
    setLoading(true)
    setError(null)
    setSearched(true)
    setStudent(null)
    setActiveSanction(null)
    setDuplicateOpen(false)  // una nueva consulta cierra el aviso de duplicado anterior
    try {
      const data = await studentApi.lookup(clean)
      setStudent(data)
      // Si es acceso directo, consultamos si tiene una suspensión activa
      if (data.acceso_directo_id) {
        try {
          const check = await consumptionApi.check(data.acceso_directo_id)
          setActiveSanction(check.active_sanction)
        } catch {
          // Si la consulta de sanción falla, continuamos sin bloquear la búsqueda
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Error al consultar el estudiante')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() { void triggerSearch(cedula) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  // ── Registrar consumo ────────────────────────────────────────────
  async function handleRegister() {
    if (!student || !session || !user) return
    setSaving(true)
    setError(null)
    try {
      await studentApi.registerDining({
        cedula:           student.cedula,
        date:             new Date().toISOString(),
        registered_by_id: user.id,
        session_id:       session.id,
        is_manual:        false,
        acceso_directo_id: student.acceso_directo_id,
        // Si no es acceso directo, se envían sus datos para el alta al vuelo (Issue 2).
        person:           student.is_acceso_directo ? undefined : studentToIdentity(student),
      })
      notify.success(`Consumo registrado para ${student.name}`)
      // Contador (#6): incremento optimista + refresco de últimas personas (#7).
      setSessionCount((c) => (c == null ? c : c + 1))
      void loadSessionData()
      setCedula('')
      setStudent(null)
      setSearched(false)
      setActiveSanction(null)
    } catch (err: any) {
      if (err?.status === 409) {
        // Consumo duplicado: aviso con los datos del usuario + sonido de alerta ~10 s.
        // Al terminar el sonido el aviso se cierra solo (y limpia para el siguiente).
        setDuplicateOpen(true)
        duplicateSoundStop.current?.() // corta una alerta previa si aún sonaba
        duplicateSoundStop.current = playSound(
          DUPLICATE_ALERT_SOUND,
          0.6,
          closeDuplicate,
          DUPLICATE_ALERT_DURATION_MS,
        )
      } else {
        // 403 = sanción activa — el mensaje ya viene limpio del apiClient
        const msg = errorMessage(err, { 409: CONFLICT.consumptionToday }, 'Error al registrar el consumo')
        notify.error(msg)
        setError(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  // Cierra el aviso de duplicado y limpia para atender al siguiente (flujo de escaneo).
  function closeDuplicate() {
    duplicateSoundStop.current?.() // detiene el sonido si se cierra antes de los 10 s
    duplicateSoundStop.current = null
    setDuplicateOpen(false)
    setCedula('')
    setStudent(null)
    setSearched(false)
    setActiveSanction(null)
  }

  // ── Suspensión rápida desde el registro (problemáticas 29 y 30) ──
  function openSuspend() {
    setSuspendReason('')
    setSuspendError(null)
    setSuspendOpen(true)
  }

  async function handleQuickSuspend() {
    if (!student?.acceso_directo_id) return
    const reason = suspendReason.trim()
    if (reason.length < 3) {
      setSuspendError('Indica el motivo de la suspensión (mínimo 3 caracteres).')
      return
    }
    setSuspending(true)
    setSuspendError(null)
    try {
      const sanction = await sanctionApi.quickCreate({
        acceso_directo_id: student.acceso_directo_id,
        reason,
      })
      setActiveSanction(sanction)
      setSuspendOpen(false)
      notify.success(`${student.name} fue suspendido.`)
    } catch (err: any) {
      const msg = errorMessage(err, { 409: CONFLICT.sanctionActive }, 'Error al suspender al usuario')
      notify.error(msg)
      setSuspendError(msg)
    } finally {
      setSuspending(false)
    }
  }

  const noSedeSelected = sedeId == null
  const sessionLoading = sedeId != null && session === undefined
  const noSession = sedeId != null && session === null
  const registrationBlocked = noSedeSelected || noSession || sessionLoading
  const isSuspended = activeSanction !== null || (student?.is_suspended ?? false)
  const canSuspend = !!student?.is_acceso_directo && activeSanction === null
  const selectedSede = sedes.find((s) => s.id === sedeId) ?? null

  // Atajo de teclado: ArrowDown dispara "Registrar consumo" sin ratón (issue #2).
  // Convive con useBarcodeScanner (que finaliza con Enter) y respeta la navegación
  // por flechas de select/textarea.
  useEffect(() => {
    const canRegister = !!student && !isSuspended && !registrationBlocked && !saving
    if (!canRegister || suspendOpen) return

    function onArrowDownRegister(e: KeyboardEvent) {
      if (e.key !== 'ArrowDown') return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'SELECT' || tag === 'TEXTAREA') return
      e.preventDefault()
      void handleRegister()
    }

    window.addEventListener('keydown', onArrowDownRegister)
    return () => window.removeEventListener('keydown', onArrowDownRegister)
  }, [student, isSuspended, registrationBlocked, saving, suspendOpen])

  // Columnas de la ventana "últimas N personas" (issue #7).
  const recentColumns: ColumnDef<Consumption>[] = [
    { key: 'document_id', header: 'Cédula', render: (_, e) => e.document_id ?? '—' },
    {
      key: 'name',
      header: 'Nombre',
      render: (_, e) => `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || '—',
    },
    { key: 'registered_at', header: 'Hora', render: (_, e) => formatRegisteredTime(e.registered_at) },
  ]

  return (
    <div>
      <PageHeader
        title="Registro al Comedor"
        subtitle="Escanea el carnet o búsqueda por cédula para registrar el consumo"
        actions={
          session ? (
            <div className="flex items-center gap-3">
              {/* Contador de registros de la sede + sesión actual (issue #6). */}
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                <Users size={16} className="text-blue-600" />
                <span>Registros:</span>
                <span className="tabular-nums text-blue-700">{sessionCount ?? '—'}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<History size={14} />}
                onClick={() => { void loadSessionData(); setRecentOpen(true) }}
              >
                Últimos registros
              </Button>
            </div>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Sede y búsqueda de cédula: se ocultan mientras hay un estudiante
          consultado y reaparecen al guardar/limpiar. La sede seleccionada y el
          estado de la sesión se conservan en el estado del componente. */}
      {!student && (
        <>
          <Card variant="outlined" padding="md" className="mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xs flex-1">
                <SedeSelector value={sedeId} onChange={handleSedeChange} onLoaded={handleSedesLoaded} />
              </div>
              {selectedSede && !sessionLoading && (
                <Badge variant={session ? 'success' : 'warning'}>
                  {session ? `Sesión abierta en ${selectedSede.name}` : `Sin sesión activa en ${selectedSede.name}`}
                </Badge>
              )}
            </div>
          </Card>

          {sedes.length === 0 && !sessionLoading && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No hay sedes activas registradas. Contacta a un administrador.
            </div>
          )}

          {sedes.length > 0 && noSedeSelected && (
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Selecciona la sede donde estás registrando para comenzar.
            </div>
          )}

          {noSession && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No hay una sesión de almuerzo activa en esta sede. Un administrador debe abrirla antes de registrar consumos.
            </div>
          )}

          {/* ── Barra de búsqueda ──────────────────────────────────── */}
          <Card variant="outlined" padding="md" className="mb-4">
            <div className="flex items-end gap-3">
              <Input
                id="cedula-register"
                label="Cédula o Carnet"
                placeholder="Escanea el carnet o escribe la cédula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                onKeyDown={handleKeyDown}
                leftIcon={<Search size={16} />}
                fullWidth
                disabled={registrationBlocked}
              />
              <Button
                variant="primary"
                onClick={handleSearch}
                loading={loading}
                disabled={registrationBlocked}
                className="flex-shrink-0"
              >
                Consultar
              </Button>
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <ScanLine size={13} />
              El lector de código de barras enviará el código automáticamente al pasar el carnet.
            </p>
          </Card>
        </>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && searched && !student && !error && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
          No se encontró ningún estudiante con la cédula <strong>{cedula}</strong>.
        </div>
      )}

      {/* ── Tarjeta del estudiante ─────────────────────────────── */}
      {!loading && student && (
        <StudentResultCard
          student={student}
          suspended={isSuspended}
          notice={
            activeSanction ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Usuario suspendido y no puede registrar consumo.
                <span className="mt-0.5 block text-xs text-red-600">Motivo: {activeSanction.reason}</span>
              </div>
            ) : student.is_suspended ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Este estudiante está suspendido y no puede registrar consumo.
              </div>
            ) : null
          }
          actions={
            <>
              {canSuspend && (
                <Button variant="danger" leftIcon={<Ban size={15} />} onClick={openSuspend}>
                  Suspender
                </Button>
              )}
              <Button
                variant="primary"
                loading={saving}
                disabled={isSuspended || registrationBlocked}
                onClick={handleRegister}
              >
                Registrar Consumo
              </Button>
            </>
          }
        />
      )}

      {/* Aviso de consumo duplicado: datos del usuario + sonido de alerta */}
      <Modal
        open={duplicateOpen}
        onClose={closeDuplicate}
        title="Este usuario ya consumió hoy"
        size="lg"
        footer={
          <Button variant="primary" onClick={closeDuplicate}>
            Entendido
          </Button>
        }
      >
        {student && (
          <div className="flex flex-col gap-4">
            {/* Datos completos del usuario */}
            <StudentResultCard student={student} showAccesoDirectoNotice={false} showSuspensionCount={false} bare />

            {/* Aviso "ya comió" a lo ancho, debajo de los datos */}
            <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle size={18} className="flex-shrink-0" />
              <span>
                <strong>Ya registró su consumo hoy.</strong> No se registró un nuevo consumo para
                este usuario.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de suspensión rápida (problemáticas 29 y 30) */}
      <Modal
        open={suspendOpen}
        onClose={() => { if (!suspending) setSuspendOpen(false) }}
        title="Suspender usuario"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setSuspendOpen(false)} disabled={suspending}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={handleQuickSuspend} loading={suspending}>
              Confirmar suspensión
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {student && (
            <p className="text-sm text-slate-600">
              Vas a suspender a <span className="font-semibold text-slate-900">{student.name}</span>{' '}
              (C.I. {student.cedula}). No podrá registrar consumo hasta que se levante la suspensión.
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="suspend-reason" className="text-[13px] font-semibold text-slate-900">
              Motivo de la suspensión <span className="text-red-500">*</span>
            </label>
            <textarea
              id="suspend-reason"
              rows={3}
              autoFocus
              placeholder="Indica el motivo de la suspensión..."
              value={suspendReason}
              onChange={(e) => { setSuspendReason(e.target.value); setSuspendError(null) }}
              className={[
                'w-full resize-none rounded-md border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4',
                suspendError
                  ? 'border-red-600 focus:border-red-600 focus:ring-red-500/15'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/15',
              ].join(' ')}
            />
            {suspendError && (
              <span className="text-xs text-red-600" role="alert">{suspendError}</span>
            )}
          </div>
        </div>
      </Modal>

      {/* Ventana emergente: últimas N personas registradas en la sesión (issue #7) */}
      <Modal
        open={recentOpen}
        onClose={() => setRecentOpen(false)}
        title={`Últimas ${RECENT_LIMIT} personas registradas`}
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setRecentOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <Table<Consumption>
          columns={recentColumns}
          rows={recentEntrants}
          keyField="id"
          emptyMessage="Aún no hay registros en esta sesión."
        />
      </Modal>
    </div>
  )
}
