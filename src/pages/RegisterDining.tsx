import { useEffect, useRef, useState } from 'react'
import { Search, ScanLine, Ban } from 'lucide-react'
import { studentApi } from '../api/student'
import { lunchSessionApi } from '../api/lunchSession'
import { consumptionApi } from '../api/consumption'
import { sanctionApi } from '../api/sanction'
import { normalizeCedula } from '../utils/cedula'
import { errorMessage, CONFLICT } from '../utils/apiErrors'
import type { Student } from '../types/user'
import type { LunchSession } from '../types/lunchSession'
import type { Sanction } from '../types/sanction'
import type { Sede } from '../types/sede'
import { notify } from '../utils/toast'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { SedeSelector } from '../components/SedeSelector'

const MIN_SCAN_LENGTH = 6
const MAX_GAP_MS      = 60
// Única clave persistida en localStorage del proyecto: recuerda la sede elegida
// por el taquillero entre sesiones del navegador (no es información sensible).
const SEDE_STORAGE_KEY = 'selected_sede_id'

function readStoredSedeId(): number | null {
  const raw = localStorage.getItem(SEDE_STORAGE_KEY)
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) ? parsed : null
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

  // Suspensión rápida (problemáticas 29 y 30)
  const [activeSanction, setActiveSanction] = useState<Sanction | null>(null)
  const [suspendOpen,    setSuspendOpen]    = useState(false)
  const [suspendReason,  setSuspendReason]  = useState('')
  const [suspendError,   setSuspendError]   = useState<string | null>(null)
  const [suspending,     setSuspending]     = useState(false)

  const lastKeyAtRef = useRef(0)
  const bufferRef    = useRef('')

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
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return

      // Si el foco está en un input/textarea, dejamos que escriban manualmente
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const now     = Date.now()
      const elapsed = now - lastKeyAtRef.current

      if (elapsed > MAX_GAP_MS) bufferRef.current = ''

      if (e.key === 'Enter') {
        const scanned = bufferRef.current.trim()
        if (scanned.length >= MIN_SCAN_LENGTH) {
          setCedula(scanned)
          void triggerSearch(scanned)
        }
        bufferRef.current    = ''
        lastKeyAtRef.current = now
        return
      }

      if (e.key.length === 1) {
        bufferRef.current    += e.key
        lastKeyAtRef.current  = now
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
      })
      notify.success(`Consumo registrado para ${student.name}`)
      setCedula('')
      setStudent(null)
      setSearched(false)
      setActiveSanction(null)
    } catch (err: any) {
      // 403 = sanción activa — el mensaje ya viene limpio del apiClient
      const msg = errorMessage(err, { 409: CONFLICT.consumptionToday }, 'Error al registrar el consumo')
      notify.error(msg)
      setError(msg)
    } finally {
      setSaving(false)
    }
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

  return (
    <div>
      <PageHeader
        title="Registro al Comedor"
        subtitle="Escanea el carnet o búsqueda por cédula para registrar el consumo"
      />

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

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Barra de búsqueda ──────────────────────────────────── */}
      <Card variant="outlined" padding="md" className="mb-6">
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
        <Card variant="outlined" padding="lg">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">

            {/* Campos */}
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                <p className="w-full sm:w-48 text-xs uppercase tracking-wide text-slate-400">Documento</p>
                <Input value={student.cedula}    readOnly fullWidth />
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                <p className="w-full sm:w-48 text-xs uppercase tracking-wide text-slate-400">Nombre</p>
                <Input value={student.name}      readOnly fullWidth />
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                <p className="w-full sm:w-48 text-xs uppercase tracking-wide text-slate-400">Email</p>
                <Input value={student.email ?? '—'} readOnly fullWidth />
              </div>

              {student.is_acceso_directo ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  Usuario con acceso directo
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  Este usuario no tiene acceso directo
                </div>
              )}

              {activeSanction ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Usuario suspendido y no puede registrar consumo.
                  <span className="mt-0.5 block text-xs text-red-600">Motivo: {activeSanction.reason}</span>
                </div>
              ) : student.is_suspended && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Este estudiante está suspendido y no puede registrar consumo.
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                {canSuspend && (
                  <Button
                    variant="danger"
                    leftIcon={<Ban size={15} />}
                    onClick={openSuspend}
                  >
                    Suspender
                  </Button>
                )}
                <Button
                  variant="primary"
                  loading={saving}
                  disabled={isSuspended || registrationBlocked || !student.is_acceso_directo}
                  onClick={handleRegister}
                >
                  Registrar Consumo
                </Button>
              </div>
            </div>

            {/* Avatar + badge */}
            <div className="flex flex-col items-center gap-3">
              <Avatar name={student.name} src={student.avatar_url} shape="square" />
              <Badge variant={isSuspended ? 'danger' : 'success'}>
                {isSuspended ? 'Suspendido' : 'Activo'}
              </Badge>
            </div>
          </div>
        </Card>
      )}

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
    </div>
  )
}
