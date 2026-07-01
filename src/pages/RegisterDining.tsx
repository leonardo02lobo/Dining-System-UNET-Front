import { useEffect, useRef, useState } from 'react'
import { Search, ScanLine, Ban } from 'lucide-react'
import { studentApi } from '../api/student'
import { lunchSessionApi } from '../api/lunchSession'
import { consumptionApi } from '../api/consumption'
import { sanctionApi } from '../api/sanction'
import { normalizeCedula } from '../utils/cedula'
import type { Student } from '../types/user'
import type { LunchSession } from '../types/lunchSession'
import type { Sanction } from '../types/sanction'
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

const MIN_SCAN_LENGTH = 6
const MAX_GAP_MS      = 60

export function RegisterDining() {
  const { user } = useAuth()
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
    lunchSessionApi.today()
      .then((s) => setSession(s))
      .catch(() => setSession(null))
  }, [])

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
      const msg = err?.status === 409
        ? 'Este acceso directo ya registró consumo en la sesión de hoy.'
        : (err?.message ?? 'Error al registrar el consumo')
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
      const msg = err?.status === 409
        ? 'Esta persona ya tiene una suspensión activa.'
        : (err?.message ?? 'Error al suspender al usuario')
      notify.error(msg)
      setSuspendError(msg)
    } finally {
      setSuspending(false)
    }
  }

  const noSession = session === null
  const sessionLoading = session === undefined
  const isSuspended = activeSanction !== null || (student?.is_suspended ?? false)
  const canSuspend = !!student?.is_acceso_directo && activeSanction === null

  return (
    <div>
      <PageHeader
        title="Registro al Comedor"
        subtitle="Escanea el carnet o búsqueda por cédula para registrar el consumo"
      />

      {noSession && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay una sesión de almuerzo activa hoy. Un administrador debe abrir la sesión antes de registrar consumos.
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
            disabled={noSession || sessionLoading}
          />
          <Button
            variant="primary"
            onClick={handleSearch}
            loading={loading}
            disabled={noSession || sessionLoading}
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
              <div className="flex flex-row items-center gap-14">
                <p className="w-48 text-xs uppercase tracking-wide text-slate-400">Documento</p>
                <Input value={student.cedula}    readOnly fullWidth />
              </div>
              <div className="flex flex-row items-center gap-14">
                <p className="w-48 text-xs uppercase tracking-wide text-slate-400">Nombre</p>
                <Input value={student.name}      readOnly fullWidth />
              </div>
              <div className="flex flex-row items-center gap-14">
                <p className="w-48 text-xs uppercase tracking-wide text-slate-400">Email</p>
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
                  disabled={isSuspended || noSession || !student.is_acceso_directo}
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
