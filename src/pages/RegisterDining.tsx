import { useCallback, useEffect, useRef, useState } from 'react'
import { ScanLine, Ban, AlertTriangle, UserSearch, Eye } from 'lucide-react'
import { studentApi, studentToIdentity } from '../api/student'
import { lunchSessionApi } from '../api/lunchSession'
import { consumptionApi } from '../api/consumption'
import { sanctionApi } from '../api/sanction'
import { normalizeCedula } from '../utils/cedula'
import { errorMessage, CONFLICT } from '../utils/apiErrors'
import { maxSanctionEndDate, todayISO, validateSanctionEndDate } from '../utils/sanctionDates'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { useCan } from '../hooks/useCan'
import type { Student } from '../types/user'
import type { Consumption, ConsumptionCheckByDocument } from '../types/consumption'
import type { LunchSession } from '../types/lunchSession'
import { notify } from '../utils/toast'
import { playSound, DUPLICATE_ALERT_SOUND, DUPLICATE_ALERT_DURATION_MS } from '../utils/sound'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Table, type ColumnDef } from '../components/ui/Table'
import { StudentResultCard } from '../components/StudentResultCard'
import { PersonDayStatus } from '../components/PersonDayStatus'
import { Spinner } from '../components/ui/Spinner'

// Cantidad de personas recientes mostradas en la pestaña "Últimos registros" (issue #7).
const RECENT_LIMIT = 10
// Intervalo de refresco del contador y de las últimas personas (issues #6/#7):
// mantiene la exactitud entre varios taquilleros de la misma sede.
const SESSION_POLL_MS = 15_000

type TabKey = 'registro' | 'ultimos'

/** Formatea la hora de registro (ISO) como HH:mm local para la lista de últimos. */
function formatRegisteredTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

/** Fecha del turno en el formato del sistema anterior: 14-May-2026. */
function formatSessionDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleDateString('es-VE', { month: 'short' }).replace('.', '')
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1)
  return `${day}-${capitalized}-${date.getFullYear()}`
}

/**
 * Dato de solo lectura del turno. Solo se monta con valor: un recuadro gris vacío
 * ocupa exactamente el mismo alto que uno lleno y no dice nada, y en esta pantalla
 * el alto está contado.
 */
function TurnoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold text-slate-500">{label}</span>
      <div className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-medium tabular-nums text-slate-700">
        {value}
      </div>
    </div>
  )
}

/**
 * Pantalla única de comedor: **toda búsqueda consulta** —quién es la persona, si ya
 * comió hoy y su estado de sanción— y registrar es la acción que se ofrece encima.
 *
 * Antes esto eran dos pantallas. `/comedor/consultar` resolvía lo mismo con llamadas
 * distintas (solo el padrón de estudiantes, y el consumo por `acceso_directo_id`), así
 * que respondía distinto a la misma cédula: una persona externa que sí había comido
 * salía como "no hay registro de consumo asociado". La que sobrevive es esta, que busca
 * en los tres padrones y resuelve el consumo por cédula; lo que se trajo de la otra es
 * **cómo enseña a la persona**: la ficha compartida y las dos afirmaciones de estado.
 *
 * `/comedor/consultar` sigue existiendo como **permiso** —ocho endpoints del backend lo
 * aceptan— y concede el modo de solo consulta de esta misma pantalla.
 */
export function RegisterDining() {
  const { user } = useAuth()
  const { can } = useCan()
  // Capacidad, no rol: es el mismo permiso que exige `POST /consumptions/`. Sin él la
  // pantalla sigue sirviendo para consultar, que es para lo que se concede
  // `/comedor/consultar`.
  const canRegister = can('/comedor/registrar')

  /**
   * Sede de la cuenta. Ya no se elige: la asigna un administrador y el servidor la
   * impone en cada operación de taquilla.
   *
   * Aquí sí se pregunta por el rol y no por un permiso, a diferencia del resto de la
   * pantalla: es el mismo criterio "administrador o no" que aplica `is_admin` en el
   * servidor para eximir de la regla de sede. Preguntarlo distinto que él daría una
   * pantalla que se contradice con el 403 que la va a rechazar.
   */
  const isAdmin = user?.role.name === 'SUPER_ADMIN' || user?.role.name === 'ADMIN'
  const sedeMissing = !isAdmin && (user?.sede_id ?? null) == null

  const [tab,        setTab]        = useState<TabKey>('registro')
  // La pestaña "Últimos registros" actúa como un modal a efectos del escáner/atajo:
  // mientras esté activa, un escaneo o ArrowDown/ArrowUp no debe reemplazar/registrar
  // a la persona en pantalla (ver comentarios de `useBarcodeScanner` y el atajo abajo).
  const recentOpen = tab === 'ultimos'
  const [session,    setSession]    = useState<LunchSession | null | undefined>(undefined)
  const [cedula,     setCedula]     = useState('')
  const [student,    setStudent]    = useState<Student | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)

  /**
   * Estado del día y de la sanción, tal como los devuelve `check-by-document`.
   *
   * `null` con persona en pantalla significa **no se pudo comprobar**, y así se dice.
   * Presentar un fallo como "no ha consumido" es la clase de mentira que el operador
   * solo descubre cuando el servidor rechaza el registro.
   */
  const [check, setCheck] = useState<ConsumptionCheckByDocument | null>(null)

  // Motivo por el que no hay persona en pantalla (no encontrada, error de red). Vive
  // aparte del estado de la última acción: uno habla de la persona, el otro de lo que
  // acaba de hacer el operador.
  const [searchError, setSearchError] = useState<string | null>(null)

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
  const [suspendOpen,    setSuspendOpen]    = useState(false)
  const [suspendReason,  setSuspendReason]  = useState('')
  // Fecha de fin de la suspensión. `indefinite` es una casilla propia y no "campo
  // vacío": la suspensión indefinida tiene que ser una elección explícita del
  // operador, no el efecto secundario de no rellenar nada.
  const [suspendEndDate, setSuspendEndDate] = useState('')
  const [suspendIndefinite, setSuspendIndefinite] = useState(false)
  const [suspendDateError, setSuspendDateError] = useState<string | null>(null)
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
    if (sedeMissing) {
      setSession(null)
      return
    }
    setSession(undefined)
    // Sin parámetro: la sede la impone el servidor a partir de la cuenta. Pasarla
    // desde aquí sería volver a dejar que el cliente la eligiera, que es justo lo que
    // permitía registrar media fila en el comedor equivocado.
    lunchSessionApi.today()
      .then((s) => setSession(s))
      .catch(() => setSession(null))
  }, [sedeMissing])

  // Carga el total de registros de la sesión (#6) y las últimas personas (#7).
  // Silenciosa: son datos informativos y no deben interrumpir el flujo de registro.
  //
  // Solo con permiso de registro: `session/{id}/recent` no admite `/comedor/consultar`,
  // así que en modo consulta esto sería un 403 cada 15 segundos.
  const loadSessionData = useCallback(async () => {
    if (!session || !canRegister) return
    try {
      const res = await consumptionApi.sessionRecent(session.id, RECENT_LIMIT)
      setSessionCount(res.total)
      setRecentEntrants(res.items)
    } catch {
      /* ignore: contador/últimas son best-effort */
    }
  }, [session, canRegister])

  // Al cambiar de sede/sesión: recarga o resetea el contador y las últimas personas.
  useEffect(() => {
    if (!session || !canRegister) {
      setSessionCount(null)
      setRecentEntrants([])
      return
    }
    void loadSessionData()
  }, [session, canRegister, loadSessionData])

  // Polling periódico para reflejar registros de otros taquilleros de la misma sede.
  useEffect(() => {
    if (!session || !canRegister) return
    const id = window.setInterval(() => { void loadSessionData() }, SESSION_POLL_MS)
    return () => window.clearInterval(id)
  }, [session, canRegister, loadSessionData])

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

  // ── Consulta (manual o por scanner) ─────────────────────────────
  // NO depende de la sede ni de la sesión: consultar a una persona es válido a
  // cualquier hora, y que el campo estuviera deshabilitado sin sesión abierta es
  // justamente lo que obligaba a existir a una segunda pantalla.
  async function triggerSearch(value: string) {
    const clean = normalizeCedula(value)
    if (!clean) return
    setCedula(clean)
    setLoading(true)
    setSearchError(null)
    setStatusMessage(null)
    setStudent(null)
    setCheck(null)
    setSuspensionCount(null)
    setDuplicateOpen(false)  // una nueva consulta cierra el aviso de duplicado anterior
    try {
      // El estado del día va **en paralelo** con la búsqueda: se resuelve por cédula,
      // así que no depende de que la persona sea acceso directo ni del resultado del
      // lookup. Y trae ya la sanción activa, de modo que una sola llamada responde por
      // las dos cajas de estado.
      //
      // La fecha que se consulta es la **de la sesión**, no la de hoy. El duplicado que
      // el servidor rechaza se mide contra `session.date` (`POST /consumptions/`), así
      // que preguntar por `date.today()` respondía por un día distinto del que aplica:
      // con una sesión que sobrevive a su fecha, la ficha afirmaba "no ha consumido" y
      // el registro devolvía 409 acto seguido. Sin sesión abierta no hay turno contra el
      // que comparar y se omite: el servidor asume hoy, que es lo correcto para una
      // consulta informativa.
      const [lookupResult, checkResult] = await Promise.allSettled([
        studentApi.lookup(clean),
        consumptionApi.checkByDocument(clean, session?.date),
      ])
      if (lookupResult.status === 'rejected') throw lookupResult.reason
      const data = lookupResult.value
      setStudent(data)
      // `null` si falló: `PersonDayStatus` lo dice como "no se pudo comprobar" en vez
      // de afirmar que la persona no ha comido.
      setCheck(checkResult.status === 'fulfilled' ? checkResult.value : null)
      // Conteo histórico de suspensiones (#8). A la gente externa no se la sanciona,
      // así que ni se pregunta. Informativo: si falla, no bloquea la consulta.
      if (data.acceso_directo_id && data.person_kind !== 'external') {
        try {
          const history = await sanctionApi.history(data.acceso_directo_id)
          setSuspensionCount(history.total)
        } catch {
          /* ignore: el conteo es informativo */
        }
      }
    } catch (err: any) {
      // El 404 del padrón de estudiantes decía "no está inscrito en la UNET", pero a
      // estas alturas la búsqueda ya ha mirado en los tres padrones: el mensaje tiene
      // que hablar de la búsqueda que de verdad se hizo.
      setSearchError(
        err?.status === 404
          ? `No se encontró a nadie con la cédula ${clean} en el padrón de estudiantes, en accesos directos ni en gente externa.`
          : err?.message ?? 'Error al consultar a la persona',
      )
    } finally {
      setLoading(false)
    }
  }

  /**
   * Vuelve a preguntar solo por el estado del día, sin rehacer el lookup ni tocar la
   * persona en pantalla. Se usa tras un 409: la ficha ya es correcta, lo que quedó
   * obsoleto es la caja que dice si comió.
   */
  async function refreshDayStatus(documentId: string) {
    try {
      setCheck(await consumptionApi.checkByDocument(normalizeCedula(documentId), session?.date))
    } catch {
      // Se deja el estado anterior: `PersonDayStatus` ya sabe decir "no se pudo
      // comprobar", y un fallo aquí no debe borrar lo que sí se sabe de la persona.
    }
  }

  /** Aviso de duplicado: nombra la fecha del turno cuando no es la de hoy. */
  function duplicateNoticeText(name: string): string {
    return staleSession && session
      ? `${name} ya registró su consumo en esta sesión (${formatSessionDate(session.date)}).`
      : `${name} ya registró su consumo hoy.`
  }

  function handleSearch() { void triggerSearch(cedula) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  /** Limpia la ficha para atender a la siguiente persona (conserva sede y sesión). */
  function clearPerson() {
    setCedula('')
    setStudent(null)
    setCheck(null)
    setSuspensionCount(null)
    setSearchError(null)
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
        // Persona externa: se envía su id, nunca el alta al vuelo, que la duplicaría
        // como acceso directo con la misma cédula.
        external_person_id: student.external_person_id,
        // Si no es acceso directo ni externa, se envían sus datos para el alta al
        // vuelo (Issue 2).
        person:           student.is_acceso_directo || student.person_kind === 'external'
          ? undefined
          : studentToIdentity(student),
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
        //
        // "hoy" solo es cierto mientras la sesión sea del día. Con un turno que sobrevive
        // a su fecha el consumo previo es de otro día, y decir "hoy" mandaba al taquillero
        // a buscar un registro que no existe en la fecha de hoy.
        setStatusMessage({ text: duplicateNoticeText(student.name), tone: 'warn' })
        // La ficha se quedaba afirmando "no ha consumido" detrás del modal que acababa de
        // decir lo contrario. Se vuelve a preguntar por el estado —ahora contra la fecha
        // de la sesión— para que las dos afirmaciones no puedan discrepar.
        void refreshDayStatus(student.cedula)
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
    setSuspendEndDate('')
    setSuspendIndefinite(false)
    setSuspendDateError(null)
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
    // El atributo `max` del campo acota el calendario pero no impide teclear la fecha:
    // sin esta comprobación el formulario dependería del 422 del servidor para un
    // error que puede señalar en el sitio.
    const dateError = validateSanctionEndDate(suspendEndDate, { indefinite: suspendIndefinite })
    if (dateError) {
      setSuspendDateError(dateError)
      return
    }
    setSuspending(true)
    setSuspendError(null)
    setSuspendDateError(null)
    try {
      const sanction = await sanctionApi.quickCreate({
        acceso_directo_id: suspendTarget.acceso_directo_id,
        reason,
        // `null` explícito = indefinida. Omitir la clave dejaría al servidor
        // adivinando lo que el operador eligió a propósito.
        end_date: suspendIndefinite ? null : suspendEndDate,
      })
      // Solo refleja la sanción en la ficha visible si sigue siendo la misma persona.
      // Se escribe sobre el resultado de la comprobación, que es la única fuente que
      // leen las cajas de estado: dos fuentes para el mismo hecho acaban discrepando.
      if (student?.acceso_directo_id === suspendTarget.acceso_directo_id) {
        setCheck((c) => (c ? { ...c, active_sanction: sanction } : c))
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

  const sessionLoading = !sedeMissing && session === undefined
  const noSession = !sedeMissing && session === null
  // Sesión que sobrevivió a su fecha (nadie la cerró al terminar el día).
  //
  // Importa porque el consumo se fecha con `session.date`, no con la fecha real: seguir
  // registrando aquí archiva la comida de hoy bajo el día en que se abrió el turno, y la
  // deja fuera del reporte del día en que de verdad se sirvió. Es un turno que hay que
  // cerrar, no un turno en el que trabajar.
  const staleSession = !!session && session.date !== todayISO()
  // Sede que se rotula: la de la cuenta y, para un administrador sin asignar, la de la
  // sesión que el servidor haya resuelto. Es también con la que se compara el consumo
  // previo para saber si ocurrió en otro municipio.
  const currentSedeName = user?.sede_name ?? session?.sede?.name ?? null
  const activeSanction = check?.active_sanction ?? null
  const isSuspended = activeSanction !== null || (student?.is_suspended ?? false)
  const canSuspend =
    canRegister && !!student?.is_acceso_directo && student.person_kind !== 'external' && activeSanction === null
  // Ya comió: registrar de nuevo no puede salir bien, así que el botón se apaga
  // antes del intento. El modal de duplicado por 409 se conserva igualmente — es la
  // red que atrapa el caso de dos taquillas registrando a la vez, que ninguna
  // consulta previa puede prevenir.
  const alreadyConsumed = check?.has_consumed === true

  // Un solo motivo, el que de verdad manda. Un botón apagado sin explicación obliga al
  // operador a adivinar cuál de las condiciones falla.
  const registerBlockedReason: string | null =
    !canRegister      ? 'Tu permiso sobre esta pantalla es de solo consulta.'
    : sedeMissing     ? 'Tu cuenta no tiene una sede asignada.'
    : sessionLoading  ? 'Comprobando la sesión de la sede…'
    : noSession       ? 'No hay una sesión de servicio abierta en esta sede.'
    : staleSession    ? 'La sesión abierta no es la de hoy.'
    : activeSanction  ? 'La persona tiene una sanción activa.'
    : student?.is_suspended ? 'La persona no está activa en el padrón de la UNET.'
    : alreadyConsumed ? 'La persona ya registró su consumo hoy.'
    : null

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
    const canRegisterNow = !!student && registerBlockedReason === null && !saving
    if (!canRegisterNow || suspendOpen || duplicateOpen || recentOpen) return

    function onArrowRegister(e: KeyboardEvent) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const active = document.activeElement as HTMLElement | null
      if (active?.tagName === 'SELECT' || active?.tagName === 'TEXTAREA') return
      e.preventDefault()
      void handleRegister()
    }

    window.addEventListener('keydown', onArrowRegister)
    return () => window.removeEventListener('keydown', onArrowRegister)
  }, [student, registerBlockedReason, saving, suspendOpen, duplicateOpen, recentOpen])

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
  const blockingNotice: { text: string; tone: 'info' | 'warn' | 'error' } | null =
    sedeMissing
      ? {
          text: 'Tu cuenta no tiene una sede asignada, así que no puedes registrar consumos. Pídele a un administrador que te asigne la sede en la que trabajas. Mientras tanto puedes consultar a cualquier persona.',
          tone: 'warn',
        }
      : noSession
        ? {
            text: 'No hay una sesión de servicio abierta en esta sede. Puedes consultar a cualquier persona; para registrar consumos, un administrador debe abrirla.',
            tone: 'warn',
          }
        : staleSession && session
          ? {
              // Dice la fecha del turno y qué hacer, porque el operador no tiene forma de
              // deducir por qué la pantalla dejó de registrar: la sesión sigue "abierta".
              text: `Esta sesión es del ${formatSessionDate(session.date)}, no de hoy. Los consumos que se registren aquí quedarían archivados en esa fecha y no aparecerían en el reporte de hoy. Ciérrala en «Sesión de Servicio de alimentación» y abre la de hoy antes de seguir.`,
              tone: 'error',
            }
          : null

  const tabs: Array<[TabKey, string]> = canRegister
    ? [['registro', 'CONSULTA Y REGISTRO'], ['ultimos', 'ULTIMOS REGISTROS']]
    : [['registro', 'CONSULTA']]

  return (
    // h-full + overflow-hidden: la pantalla ocupa exactamente el alto disponible
    // y nunca desplaza la página (el turno debe verse completo de un vistazo).
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Título y pestañas en una sola franja para ahorrar alto ──── */}
      <div className="flex flex-shrink-0 flex-wrap items-end justify-between gap-2">
        <h1 className="text-lg font-bold text-slate-800">Comedor: Consulta y Registro</h1>
        <div className="flex gap-1 rounded-t-md bg-[#03216A] px-1 pt-1">
          {tabs.map(([key, label]) => (
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
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            {/* Dos columnas desde `lg`: el turno y la búsqueda a la izquierda, la
                persona a la derecha. La ficha compartida es más alta que la rejilla de
                campos que sustituye, y a lo ancho es donde queda sitio. */}
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(300px,360px)_1fr] lg:overflow-hidden">

              {/* ── Columna izquierda: turno y búsqueda ───────────────── */}
              <div className="flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {/* Rótulo, no selector: el taquillero trabaja donde trabaja. La
                      respuesta era siempre la misma, así que no era una elección — era
                      una configuración en el sitio equivocado, con la posibilidad de
                      equivocarse incluida y sin ningún aviso cuando ocurría. */}
                  {currentSedeName && <TurnoField label="Sede:" value={currentSedeName} />}
                  {/* Fecha y contador solo con turno: sin sesión no hay nada que contar,
                      y un recuadro vacío no es un dato, es un hueco. */}
                  {session && <TurnoField label="Fecha:" value={formatSessionDate(session.date)} />}
                  {session && canRegister && sessionCount != null && (
                    <TurnoField label="Consumos del Turno:" value={String(sessionCount)} />
                  )}
                </div>

                {blockingNotice && (
                  <div
                    className={[
                      'rounded-md border px-3 py-2 text-sm',
                      blockingNotice.tone === 'info'
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : blockingNotice.tone === 'error'
                          ? 'border-red-300 bg-red-50 font-medium text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700',
                    ].join(' ')}
                  >
                    {blockingNotice.text}
                  </div>
                )}

                {!canRegister && (
                  <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <Eye size={16} className="mt-0.5 flex-shrink-0" />
                    <span>
                      Modo consulta: puedes buscar personas y ver su estado, pero no registrar
                      consumos ni suspender.
                    </span>
                  </div>
                )}

                {/* ── Documento ─────────────────────────────────────────
                    Sin `disabled`: consultar no depende de la sede ni de la sesión. */}
                <div className="border-t border-slate-200 pt-3">
                  <label htmlFor="cedula-register" className="text-sm font-semibold text-slate-800">
                    Cedula / Pasaporte / Carnet
                  </label>
                  <div className="mt-1.5 flex items-end gap-2">
                    <Input
                      id="cedula-register"
                      placeholder="Ingrese Carnet o Documento de Identidad."
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      onKeyDown={handleKeyDown}
                      fullWidth
                      className="h-10 border-green-500 focus:border-green-600 focus:ring-green-500/15"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleSearch}
                      loading={loading}
                      className="h-10 flex-shrink-0 border-green-600 text-green-700 hover:bg-green-50"
                    >
                      Buscar
                    </Button>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <ScanLine size={13} />
                    El lector enviará el código automáticamente al pasar el carnet.
                  </p>
                </div>
              </div>

              {/* ── Columna derecha: la persona ───────────────────────── */}
              <div
                ref={cardContainerRef}
                tabIndex={-1}
                aria-live="polite"
                className="flex flex-col gap-3 outline-none lg:min-h-0 lg:overflow-y-auto"
              >
                {loading ? (
                  <div className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    <Spinner size="sm" />
                    Consultando…
                  </div>
                ) : student ? (
                  <>
                    <StudentResultCard
                      student={student}
                      suspended={isSuspended}
                      suspensionCount={suspensionCount}
                      bare
                    />
                    <PersonDayStatus student={student} check={check} currentSedeName={currentSedeName} />
                  </>
                ) : searchError ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {searchError}
                  </div>
                ) : (
                  // Estado vacío: **una** línea. Antes esto era una ficha entera de
                  // marcadores y cinco campos grises en blanco, que ocupaban el alto de
                  // una ficha llena sin decir nada.
                  <div className="flex items-center gap-2.5 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                    <UserSearch size={16} className="flex-shrink-0" />
                    Escanea un carnet o escribe una cédula para ver a la persona.
                  </div>
                )}
              </div>
            </div>

            {/* Resultado de la última acción. Solo con mensaje: la caja llevaba un
                espacio (' ') dentro para reservar alto, es decir, un hueco disfrazado
                de contenido. */}
            {statusMessage && (
              <div
                role="status"
                className={`flex-shrink-0 rounded-md border px-3 py-2 text-sm ${statusTone[statusMessage.tone]}`}
              >
                {statusMessage.text}
              </div>
            )}

            {/* ── Acciones: sitio fijo al pie de la tarjeta ─────────────
                Se deshabilitan, no se desmontan: una botonera que aparece y desaparece
                mueve todo lo que tiene encima justo cuando el operador va a pulsar. */}
            {canRegister && (
              <div className="flex flex-shrink-0 items-center justify-end gap-3 border-t border-slate-100 pt-3">
                {student && registerBlockedReason && (
                  <span className="mr-auto text-xs text-slate-500">{registerBlockedReason}</span>
                )}
                <Button variant="ghost" size="sm" onClick={clearPerson} disabled={!student || saving}>
                  Limpiar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Ban size={15} />}
                  onClick={openSuspend}
                  disabled={!canSuspend || saving}
                >
                  Suspender
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  disabled={!student || registerBlockedReason !== null}
                  title={registerBlockedReason ?? undefined}
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

          <div className="flex flex-col gap-1.5">
            <Input
              id="suspend-end-date"
              type="date"
              label="Fecha de fin"
              value={suspendEndDate}
              min={todayISO()}
              max={maxSanctionEndDate()}
              disabled={suspendIndefinite}
              error={suspendDateError ?? undefined}
              onChange={(e) => { setSuspendEndDate(e.target.value); setSuspendDateError(null) }}
              fullWidth
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={suspendIndefinite}
                onChange={(e) => { setSuspendIndefinite(e.target.checked); setSuspendDateError(null) }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Indefinida
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
