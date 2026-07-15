import { useState } from 'react'
import { Search, ScanLine, Ban, RotateCcw } from 'lucide-react'
import { studentApi } from '../api/student'
import { consumptionApi } from '../api/consumption'
import { sanctionApi } from '../api/sanction'
import { normalizeCedula } from '../utils/cedula'
import { errorMessage, CONFLICT } from '../utils/apiErrors'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { notify } from '../utils/toast'
import type { Student } from '../types/user'
import type { Sanction } from '../types/sanction'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { StudentResultCard } from '../components/StudentResultCard'
import { Spinner } from '../components/ui/Spinner'

/**
 * Suspender Usuario. Comparte el flujo de "Registro al Comedor" (escaneo/búsqueda por
 * cédula + ficha compartida `StudentResultCard`), pero la acción principal es
 * **suspender** al usuario indicando un motivo. La interacción con el backend es la misma
 * suspensión rápida del registro al comedor (`sanctionApi.quickCreate`).
 */
export function SuspendStudent() {
  const [cedula,   setCedula]   = useState('')
  const [student,  setStudent]  = useState<Student | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  // Sanción activa y conteo histórico de la persona consultada.
  const [activeSanction,  setActiveSanction]  = useState<Sanction | null>(null)
  const [suspensionCount, setSuspensionCount] = useState<number | null>(null)

  // Modal de suspensión rápida (motivo).
  const [suspendOpen,   setSuspendOpen]   = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendError,  setSuspendError]  = useState<string | null>(null)
  const [suspending,    setSuspending]    = useState(false)

  // Reactivación de la suspensión activa.
  const [lifting, setLifting] = useState(false)

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
    setSuspensionCount(null)
    try {
      const data = await studentApi.lookup(clean)
      setStudent(data)
      // Si es acceso directo, consultamos la sanción activa y el histórico.
      if (data.acceso_directo_id) {
        try {
          const check = await consumptionApi.check(data.acceso_directo_id)
          setActiveSanction(check.active_sanction)
        } catch {
          // Si la consulta de sanción falla, continuamos sin bloquear la búsqueda.
        }
        try {
          const history = await sanctionApi.history(data.acceso_directo_id)
          setSuspensionCount(history.total)
        } catch {
          // El conteo de suspensiones es informativo: si falla, no bloquea la búsqueda.
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

  // ── Suspensión rápida (misma interacción que Registro al Comedor) ──
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
      setSuspensionCount((c) => (c == null ? c : c + 1))
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

  // ── Reactivar la suspensión activa ──────────────────────────────
  async function handleLift() {
    if (!student?.acceso_directo_id) return
    setLifting(true)
    try {
      await sanctionApi.lift(student.acceso_directo_id)
      setActiveSanction(null)
      notify.success(`${student.name} fue reactivado.`)
    } catch (err: any) {
      notify.error(errorMessage(err, {}, 'Error al reactivar al usuario'))
    } finally {
      setLifting(false)
    }
  }

  const isSuspended = activeSanction !== null || (student?.is_suspended ?? false)
  const canSuspend = !!student?.is_acceso_directo && activeSanction === null

  return (
    <div>
      <PageHeader
        title="Suspender Usuario"
        subtitle="Escanea el carnet o busca por cédula para suspender el acceso al comedor"
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* La barra de búsqueda se oculta mientras hay un usuario consultado y
          reaparece al limpiar, igual que en Registro al Comedor. */}
      {!student && (
        <Card variant="outlined" padding="md" className="mb-4">
          <div className="flex items-end gap-3">
            <Input
              id="cedula-suspend"
              label="Cédula o Carnet"
              placeholder="Escanea el carnet o escribe la cédula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              onKeyDown={handleKeyDown}
              leftIcon={<Search size={16} />}
              fullWidth
            />
            <Button
              variant="primary"
              onClick={handleSearch}
              loading={loading}
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

      {/* ── Ficha del usuario + acciones ───────────────────────── */}
      {!loading && student && (
        <StudentResultCard
          student={student}
          suspended={isSuspended}
          suspensionCount={suspensionCount}
          notice={
            activeSanction ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Usuario suspendido.
                <span className="mt-0.5 block text-xs text-red-600">Motivo: {activeSanction.reason}</span>
              </div>
            ) : !student.is_acceso_directo ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Este usuario no tiene acceso directo, por lo que no puede ser suspendido.
              </div>
            ) : null
          }
          actions={
            <>
              <Button variant="ghost" onClick={() => { setStudent(null); setSearched(false); setCedula('') }}>
                Consultar otro
              </Button>
              {activeSanction ? (
                <Button variant="secondary" leftIcon={<RotateCcw size={15} />} loading={lifting} onClick={handleLift}>
                  Reactivar acceso
                </Button>
              ) : (
                <Button variant="danger" leftIcon={<Ban size={15} />} disabled={!canSuspend} onClick={openSuspend}>
                  Suspender
                </Button>
              )}
            </>
          }
        />
      )}

      {/* Modal de suspensión rápida (mismo flujo que Registro al Comedor) */}
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
