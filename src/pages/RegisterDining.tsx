import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ScanLine, Ban, AlertTriangle } from 'lucide-react'
import { studentApi, studentToIdentity } from '../api/student'
import { lunchSessionApi } from '../api/lunchSession'
import { consumptionApi } from '../api/consumption'
import { sanctionApi } from '../api/sanction'
import { normalizeCedula } from '../utils/cedula'
import { errorMessage, CONFLICT } from '../utils/apiErrors'
import { userTypeLabel } from '../utils/labels'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import type { Student } from '../types/user'
import type { Consumption } from '../types/consumption'
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
import { StudentResultCard } from '../components/StudentResultCard'
import { Spinner } from '../components/ui/Spinner'
import { SedeSelector } from '../components/SedeSelector'

// Única clave persistida en localStorage del proyecto: recuerda la sede elegida
// por el taquillero entre sesiones del navegador (no es información sensible).
const SEDE_STORAGE_KEY = 'selected_sede_id'

// Cantidad de personas recientes mostradas en la pestaña "Últimos registros" (issue #7).
const RECENT_LIMIT = 10
// Intervalo de refresco del contador y de las últimas personas (issues #6/#7):
// mantiene la exactitud entre varios taquilleros de la misma sede.
const SESSION_POLL_MS = 15_000

type TabKey = 'registro' | 'ultimos'

function readStoredSedeId(): number | null {
  const raw = localStorage.getItem(SEDE_STORAGE_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

/** Formatea la hora de registro (ISO) como HH:mm local para la lista de últimos. */
function formatRegisteredTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

/** Fecha del turno en el formato del sistema anterior: 14-May-2026. */
function formatSessionDate(value?: string): string {
  const date = value ? new Date(`${value}T00:00:00`) : new Date()
  if (Number.isNaN(date.getTime())) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleDateString('es-VE', { month: 'short' }).replace('.', '')
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1)
  return `${day}-${capitalized}-${date.getFullYear()}`
}

/** Campo de solo lectura con la etiqueta encima (fila superior del formulario). */
function StackedField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold text-slate-500">{label}</span>
      {children}
    </div>
  )
}

/** Campo de solo lectura con la etiqueta a la izquierda (ficha de la persona). */
function InlineField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-sm text-slate-600 sm:w-40 sm:flex-shrink-0">{label}</span>
      <input
        readOnly
        value={value}
        className="h-9 w-full min-w-0 rounded-md border border-slate-200 bg-slate-100 px-3 text-sm text-slate-700 outline-none"
      />
    </div>
  )
}

/**
 * Foto de la persona consultada. No se usa `Avatar` porque su tamaño es fijo y
 * mucho mayor (hasta 320px) del que pide este formulario.
 */
function PersonPhoto({ name, src }: { name?: string; src?: string }) {
  return (
    <div
      title={name}
      className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100 text-2xl"
    >
      {src ? (
        <img alt={name ?? 'Usuario'} src={src} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="select-none font-semibold text-slate-400">
          {name ? name[0].toUpperCase() : '?'}
        </span>
      )}
    </div>
  )
}

/** Caja compacta de solo lectura para el contador de consumos del turno. */
function CounterBox({ value }: { value: string }) {
  return (
    <input
      readOnly
      value={value}
      className="h-10 w-full rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-semibold tabular-nums text-slate-700 outline-none"
    />
  )
}

export function RegisterDining() {
  const { user } = useAuth()
  const [tab,        setTab]        = useState<TabKey>('registro')
  // La pestaña "Últimos registros" actúa como un modal a efectos del escáner/atajo:
  // mientras esté activa, un escaneo o ArrowDown/ArrowUp no debe reemplazar/registrar
  // a la persona en pantalla (ver comentarios de `useBarcodeScanner` y el atajo abajo).
  const recentOpen = tab === 'ultimos'
  const [sedeId,     setSedeId]     = useState<number | null>(readStoredSedeId)
  const [sedes,      setSedes]      = useState<Sede[]>([])
  const [session,    setSession]    = useState<LunchSession | null | undefined>(undefined)
  const [cedula,     setCedula]     = useState('')
  const [student,    setStudent]    = useState<Student | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)

  // Barra de estado inferior del formulario (campo sin etiqueta del sistema anterior):
  // refleja el resultado de la última acción sin depender solo del toast.
  const [statusMessage, setStatusMessage] = useState<{ text: string; tone: 'ok' | 'warn' | 'error' } | null>(null)

  // Aviso de consumo duplicado (ya consumió hoy)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  // Cancelador del sonido de alerta en curso (issue #5): permite cortarlo antes de los 10 s.
  const duplicateSoundStop = useRef<(() => void) | null>(null)

  // Contador de registros de la sesión (issue #6) y últimas personas (issue #7).
  const [sessionCount, setSessionCount] = useState<number | null>(null)
  const [recentEntrants, setRecentEntrants] = useState<Consumption[]>([])

  // Conteo histórico de suspensiones de la persona consultada (issue #8).
  const [suspensionCount, setSuspensionCount] = useState<number | null>(null)

  // Suspensión rápida (problemáticas 29 y 30)
  const [activeSanction, setActiveSanction] = useState<Sanction | null>(null)
  const [suspendOpen,    setSuspendOpen]    = useState(false)
  const [suspendReason,  setSuspendReason]  = useState('')
  const [suspendError,   setSuspendError]   = useState<string | null>(null)
  const [suspending,     setSuspending]     = useState(false)
  // Persona objetivo congelada al abrir el modal de suspensión: si un escaneo cambia
  // `student` mientras el modal está abierto, la suspensión sigue aplicando a esta persona.
  const [suspendTarget,  setSuspendTarget]  = useState<Student | null>(null)

  // Contenedor de la ficha del estudiante: recibe el foco al consultar y acota el
  // atajo de teclado de registro para que no interfiera con el resto de la app.
  const cardContainerRef = useRef<HTMLDivElement>(null)

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
  // Deshabilitado mientras haya un modal abierto: un escaneo detrás de un modal
  // (duplicado, suspensión o últimos registros) no debe reemplazar la persona en pantalla.
  useBarcodeScanner(
    (scanned) => {
      setCedula(scanned)
      void triggerSearch(scanned)
    },
    { enabled: !duplicateOpen && !suspendOpen && !recentOpen },
  )

  // ── Búsqueda (manual o por scanner) ─────────────────────────────
  async function triggerSearch(value: string) {
    const clean = normalizeCedula(value)
    if (!clean) return
    setCedula(clean)
    setLoading(true)
    setStatusMessage(null)
    setStudent(null)
    setActiveSanction(null)
    setSuspensionCount(null)
    setDuplicateOpen(false)  // una nueva consulta cierra el aviso de duplicado anterior
    try {
      const data = await studentApi.lookup(clean)
      setStudent(data)
      // Si es acceso directo, consultamos si tiene una suspensión activa y su histórico (#8)
      if (data.acceso_directo_id) {
        try {
          const check = await consumptionApi.check(data.acceso_directo_id)
          setActiveSanction(check.active_sanction)
        } catch {
          // Si la consulta de sanción falla, continuamos sin bloquear la búsqueda
        }
        try {
          const history = await sanctionApi.history(data.acceso_directo_id)
          setSuspensionCount(history.total)
        } catch {
          // El conteo de suspensiones es informativo: si falla, no bloquea la búsqueda
        }
      }
    } catch (err: any) {
      const msg = err.message ?? 'Error al consultar el estudiante'
      setStatusMessage({ text: msg, tone: 'error' })
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() { void triggerSearch(cedula) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  /** Limpia la ficha para atender a la siguiente persona (conserva sede y sesión). */
  function clearPerson() {
    setCedula('')
    setStudent(null)
    setActiveSanction(null)
    setSuspensionCount(null)
  }

  // ── Registrar consumo ────────────────────────────────────────────
  async function handleRegister() {
    if (!student || !session || !user) return
    setSaving(true)
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
      setStatusMessage({ text: `Consumo registrado para ${student.name}.`, tone: 'ok' })
      // Contador (#6): incremento optimista + refresco de últimas personas (#7).
      setSessionCount((c) => (c == null ? c : c + 1))
      void loadSessionData()
      clearPerson()
    } catch (err: any) {
      if (err?.status === 409) {
        // Consumo duplicado: aviso con los datos del usuario + sonido de alerta ~10 s.
        // Al terminar el sonido el aviso se cierra solo (y limpia para el siguiente).
        setStatusMessage({ text: `${student.name} ya registró su consumo hoy.`, tone: 'warn' })
        setDuplicateOpen(true)
        duplicateSoundStop.current?.() // corta una alerta previa si aún sonaba
        duplicateSoundStop.current = playSound(
          DUPLICATE_ALERT_SOUND,
          0.6,
          undefined,
          DUPLICATE_ALERT_DURATION_MS,
        )
      } else {
        // 403 = sanción activa — el mensaje ya viene limpio del apiClient.
        // Un solo canal de feedback para este evento: toast (ver UX-009).
        const msg = errorMessage(err, { 409: CONFLICT.consumptionToday }, 'Error al registrar el consumo')
        notify.error(msg)
        setStatusMessage({ text: msg, tone: 'error' })
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
    clearPerson()
  }

  // ── Suspensión rápida desde el registro (problemáticas 29 y 30) ──
  function openSuspend() {
    // Congela la persona objetivo: si un escaneo llega mientras el modal está abierto,
    // la suspensión se sigue aplicando a quien se muestra en el modal, no a `student`.
    setSuspendTarget(student)
    setSuspendReason('')
    setSuspendError(null)
    setSuspendOpen(true)
  }

  async function handleQuickSuspend() {
    if (!suspendTarget?.acceso_directo_id) return
    const reason = suspendReason.trim()
    if (reason.length < 3) {
      setSuspendError('Indica el motivo de la suspensión (mínimo 3 caracteres).')
      return
    }
    setSuspending(true)
    setSuspendError(null)
    try {
      const sanction = await sanctionApi.quickCreate({
        acceso_directo_id: suspendTarget.acceso_directo_id,
        reason,
      })
      // Solo refleja la sanción en la ficha visible si sigue siendo la misma persona.
      if (student?.acceso_directo_id === suspendTarget.acceso_directo_id) {
        setActiveSanction(sanction)
      }
      setSuspendOpen(false)
      // Usa `suspendTarget` (la persona congelada al abrir el modal), no `student`:
      // si llegó un nuevo escaneo mientras la suspensión estaba en curso, `student`
      // ya podría ser otra persona y el mensaje atribuiría la suspensión a quien no es.
      notify.success(`${suspendTarget.name} fue suspendido.`)
      setStatusMessage({ text: `${suspendTarget.name} fue suspendido.`, tone: 'warn' })
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

  // Mueve el foco a la ficha del estudiante al consultarlo: solo para anunciarla a
  // lectores de pantalla (el atajo de flechas de abajo ya no depende de este foco,
  // porque se pierde con cualquier click o modal y dejaba el atajo "muerto" hasta
  // volver a hacer click dentro de la ficha).
  useEffect(() => {
    if (student) cardContainerRef.current?.focus()
  }, [student])

  // Atajo de teclado: ArrowDown/ArrowUp disparan "Registrar consumo" sin ratón (issue #2).
  // Escucha en `window` sin exigir que el foco DOM esté en un elemento en particular:
  // solo se descarta si el foco está en select/textarea (para no interferir con su
  // navegación por flechas) o si hay un modal abierto encima. NO se descarta por foco en
  // un INPUT: el campo de cédula es justo donde el foco queda tras escanear/consultar, y
  // no tiene semántica propia de ArrowUp/ArrowDown.
  useEffect(() => {
    const canRegister = !!student && !isSuspended && !registrationBlocked && !saving
    if (!canRegister || suspendOpen || duplicateOpen || recentOpen) return

    function onArrowRegister(e: KeyboardEvent) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const active = document.activeElement as HTMLElement | null
      if (active?.tagName === 'SELECT' || active?.tagName === 'TEXTAREA') return
      e.preventDefault()
      void handleRegister()
    }

    window.addEventListener('keydown', onArrowRegister)
    return () => window.removeEventListener('keydown', onArrowRegister)
  }, [student, isSuspended, registrationBlocked, saving, suspendOpen, duplicateOpen, recentOpen])

  // Columnas de la pestaña "últimas N personas" (issue #7).
  const recentColumns: ColumnDef<Consumption>[] = [
    { key: 'document_id', header: 'Cédula', render: (_, e) => e.document_id ?? '—' },
    {
      key: 'name',
      header: 'Nombre',
      render: (_, e) => `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || '—',
    },
    { key: 'registered_at', header: 'Hora', render: (_, e) => formatRegisteredTime(e.registered_at) },
  ]

  const statusTone = {
    ok:    'border-green-200 bg-green-50 text-green-700',
    warn:  'border-amber-200 bg-amber-50 text-amber-800',
    error: 'border-red-200 bg-red-50 text-red-700',
  }

  // Un solo aviso de configuración del turno: antes se podían apilar varios y
  // el alto de la pantalla se desbordaba. Se muestra el que realmente bloquea.
  const blockingNotice: { text: string; tone: 'info' | 'warn' } | null =
    sedes.length === 0 && !sessionLoading
      ? { text: 'No hay sedes activas registradas. Contacta a un administrador.', tone: 'warn' }
      : noSedeSelected && sedes.length > 0
        ? { text: 'Selecciona la sede donde estás registrando para comenzar.', tone: 'info' }
        : noSession
          ? {
              text: 'No hay una sesión de servicio activa en esta sede. Un administrador debe abrirla antes de registrar consumos.',
              tone: 'warn',
            }
          : null

  // Ídem para la persona consultada: se muestra únicamente el aviso más grave.
  const personNotice: { text: string; tone: 'danger' | 'warn' } | null = !student
    ? null
    : activeSanction
      ? { text: `Usuario suspendido, no puede registrar consumo. Motivo: ${activeSanction.reason}`, tone: 'danger' }
      : student.is_suspended
        // Sin sanción activa, `is_suspended` viene de `is_active: false` en el
        // padrón: la persona no está inscrita este semestre, no está sancionada.
        ? { text: 'Este estudiante no está activo en el padrón de la UNET y no puede registrar consumo.', tone: 'danger' }
        : !student.is_acceso_directo
          ? {
              text: 'Este usuario no tiene acceso directo. Se registrará su consumo y se dará de alta automáticamente.',
              tone: 'warn',
            }
          : suspensionCount != null && suspensionCount > 0
            ? {
                text: `Esta persona ha sido suspendida ${suspensionCount} ${suspensionCount === 1 ? 'vez' : 'veces'}.`,
                tone: 'warn',
              }
            : null

  return (
    // h-full + overflow-hidden: la pantalla ocupa exactamente el alto disponible
    // y nunca desplaza la página (el turno debe verse completo de un vistazo).
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Título y pestañas en una sola franja para ahorrar alto ──── */}
      <div className="flex flex-shrink-0 flex-wrap items-end justify-between gap-2">
        <h1 className="text-lg font-bold text-slate-800">Registro al Comedor</h1>
        <div className="flex gap-1 rounded-t-md bg-[#03216A] px-1 pt-1">
          {([
            ['registro', 'REGISTRO DE ACCESO AL COMEDOR'],
            ['ultimos',  'ULTIMOS REGISTROS'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key)
                if (key === 'ultimos') void loadSessionData()
              }}
              aria-current={tab === key ? 'page' : undefined}
              className={[
                'rounded-t-md px-4 py-2 text-xs font-semibold tracking-wide transition',
                tab === key
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-100 hover:bg-white/10',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Card
        variant="outlined"
        padding="none"
        className="flex min-h-0 flex-1 flex-col rounded-t-none p-4 sm:p-5"
      >
        {tab === 'ultimos' ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Table<Consumption>
              columns={recentColumns}
              rows={recentEntrants}
              keyField="id"
              emptyMessage="Aún no hay registros en esta sesión."
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {/* Válvula de seguridad: en pantallas muy bajas el contenido se
                desplaza aquí dentro, nunca la página completa. */}
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
              {/* ── Datos del turno: fecha, sede y consumos ──────────── */}
              <div className="grid flex-shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
                <StackedField label="Fecha:">
                  <input
                    readOnly
                    value={formatSessionDate(session?.date)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-slate-100 px-3 text-sm text-slate-700 outline-none"
                  />
                </StackedField>

                <SedeSelector value={sedeId} onChange={handleSedeChange} onLoaded={handleSedesLoaded} label="Sede:" />

                <StackedField label="Consumos del Turno:">
                  <CounterBox value={sessionCount != null ? String(sessionCount) : ''} />
                </StackedField>
              </div>

              {/* Un único aviso a la vez: apilarlos desbordaba el alto útil. */}
              {blockingNotice && (
                <div
                  className={[
                    'flex-shrink-0 rounded-md border px-3 py-2 text-sm',
                    blockingNotice.tone === 'info'
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700',
                  ].join(' ')}
                >
                  {blockingNotice.text}
                </div>
              )}

              {/* ── Documento + acción principal, con la foto a la derecha ── */}
              <div className="flex flex-shrink-0 items-start justify-between gap-4 border-t border-slate-200 pt-4">
                <div className="flex-1">
                  <label htmlFor="cedula-register" className="text-sm font-semibold text-slate-800">
                    Cedula / Pasaporte / Carnet
                  </label>
                  <div className="mt-1.5 flex items-end gap-3">
                    <Input
                      id="cedula-register"
                      placeholder="Ingrese Carnet o Documento de Identidad."
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      onKeyDown={handleKeyDown}
                      fullWidth
                      disabled={registrationBlocked}
                      className="h-10 border-green-500 focus:border-green-600 focus:ring-green-500/15"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleSearch}
                      loading={loading}
                      disabled={registrationBlocked}
                      className="h-10 flex-shrink-0 border-green-600 text-green-700 hover:bg-green-50"
                    >
                      REGISTRA
                    </Button>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <ScanLine size={13} />
                    El lector enviará el código automáticamente al pasar el carnet.
                  </p>
                </div>

                <PersonPhoto name={student?.name} src={student?.avatar_url} />
              </div>

              {/* ── Ficha de la persona, en dos columnas para ahorrar alto ── */}
              <div className="grid flex-shrink-0 grid-cols-1 gap-x-6 gap-y-2 lg:grid-cols-2">
                <InlineField label="Documento" value={student?.cedula ?? ''} />
                <InlineField label="Nombre" value={student?.name ?? ''} />
                <InlineField label="Carrera" value={student?.career || (student ? '—' : '')} />
                <InlineField
                  label="Tipo Usuario"
                  value={student?.user_type ? userTypeLabel(student.user_type) : ''}
                />
                <InlineField
                  label="Estatus del Usuario"
                  value={student ? (isSuspended ? 'Suspendido' : 'Activo') : ''}
                />
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Spinner size="sm" />
                    Consultando…
                  </div>
                )}
              </div>

              {/* Campo sin etiqueta del sistema anterior: resultado de la última acción */}
              <div
                role="status"
                className={[
                  'flex-shrink-0 rounded-md border px-3 py-2 text-sm transition',
                  statusMessage ? statusTone[statusMessage.tone] : 'border-slate-200 bg-slate-100',
                ].join(' ')}
              >
                {statusMessage?.text ?? ' '}
              </div>

              {/* Aviso propio de la persona consultada (uno solo, el más grave) */}
              {personNotice && (
                <div
                  className={[
                    'flex-shrink-0 rounded-md border px-3 py-2 text-sm',
                    personNotice.tone === 'danger'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700',
                  ].join(' ')}
                >
                  {personNotice.text}
                </div>
              )}
            </div>

            {/* ── Acciones: ancladas al pie de la tarjeta ─────────────── */}
            {student && (
              <div className="flex flex-shrink-0 justify-end gap-3 border-t border-slate-100 pt-3">
                <Button variant="ghost" size="sm" onClick={clearPerson} disabled={saving}>
                  Limpiar
                </Button>
                {canSuspend && (
                  <Button variant="danger" size="sm" leftIcon={<Ban size={15} />} onClick={openSuspend} disabled={saving}>
                    Suspender
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  disabled={isSuspended || registrationBlocked}
                  onClick={handleRegister}
                >
                  Registrar Consumo
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

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
          {suspendTarget && (
            <p className="text-sm text-slate-600">
              Vas a suspender a <span className="font-semibold text-slate-900">{suspendTarget.name}</span>{' '}
              (C.I. {suspendTarget.cedula}). No podrá registrar consumo hasta que se levante la suspensión.
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
    </div>
  )
}
