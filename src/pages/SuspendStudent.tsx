import { useEffect, useRef, useState } from 'react'
import { Search, ScanLine } from 'lucide-react'
import { normalizeCedula } from '../utils/cedula'
import { accesoDirectoApi } from '../api/acceso_directo'
import { externalStudentApi, mapExternalToStudent } from '../api/externalStudent'
import { sanctionApi } from '../api/sanction'
import { notify } from '../utils/toast'
import { SuspendConfirmModal } from '../components/SuspendConfirmModal'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import type { Student } from '../types/user'
import type { Sanction } from '../types/sanction'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:   'Activo',
  REVOKED:  'Revocada',
  EXPIRED:  'Expirada',
}

export function SuspendStudent() {
  const [cedula,        setCedula]        = useState('')
  const [student,       setStudent]       = useState<Student | null>(null)
  const [accesoDirectoId, setAccesoDirectoId] = useState<number | null>(null)
  const [history,       setHistory]       = useState<Sanction[]>([])
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [searched,     setSearched]     = useState(false)
  const [observations, setObservations] = useState('')
  const [obsError,     setObsError]     = useState<string | null>(null)
  const [confirmOpen,  setConfirmOpen]  = useState(false)

  // Sanción activa del acceso directo (si existe)
  const activeSanction = history.find((s) => s.status === 'ACTIVE') ?? null

  const lastKeyAtRef = useRef(0)
  const bufferRef    = useRef('')

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const now = Date.now()
      if (now - lastKeyAtRef.current > 60) bufferRef.current = ''

      if (e.key === 'Enter') {
        const scanned = bufferRef.current.trim()
        if (scanned.length >= 6) {
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

  async function triggerSearch(value: string) {
    const clean = normalizeCedula(value)
    if (!clean) return
    setCedula(clean)
    setLoading(true)
    setError(null)
    setSearched(true)
    setObservations('')
    setObsError(null)
    setStudent(null)
    setAccesoDirectoId(null)
    setHistory([])
    try {
      const ext = await externalStudentApi.lookup(clean)
      setStudent(mapExternalToStudent(ext))
      try {
        const b = await accesoDirectoApi.lookup(clean)
        setAccesoDirectoId(b.id)
        const result = await sanctionApi.history(b.id)
        setHistory(result.items)
      } catch {
        // Student not in internal system — sanctions unavailable
      }
    } catch (err: any) {
      setError(err.message ?? 'Error al consultar el estudiante')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() { void triggerSearch(cedula) }

  async function handleSuspend() {
    if (!student || !accesoDirectoId || !observations.trim()) {
      setObsError('Debes indicar el motivo de la suspensión')
      return
    }
    setObsError(null)
    setSaving(true)
    const today = new Date().toISOString().slice(0, 10)
    const end   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    try {
      const newSanction = await sanctionApi.create({
        acceso_directo_id: accesoDirectoId,
        reason:         observations,
        start_date:     today,
        end_date:       end,
      })
      setHistory((prev) => [newSanction, ...prev])
      setObservations('')
      setConfirmOpen(false)
      notify.success('Acceso directo suspendido correctamente.')
    } catch (err) {
      notify.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleRevoke() {
    if (!activeSanction) return
    setSaving(true)
    try {
      const updated = await sanctionApi.revoke(activeSanction.id)
      setHistory((prev) => prev.map((s) => s.id === updated.id ? updated : s))
      notify.success('Sanción revocada. El acceso directo fue reactivado.')
    } catch (err) {
      notify.error(err)
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void handleSearch()
  }

  const isSuspended = activeSanction !== null

  return (
    <div>
      <PageHeader
        title="Gestión de Acceso Directo"
        subtitle="Consulta y administra el acceso al comedor de un acceso directo"
      />

      <Card variant="outlined" padding="md" className="mb-6">
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

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && searched && !student && !error && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
          No se encontró ningún acceso directo con la cédula <strong>{cedula}</strong>.
        </div>
      )}

      {!loading && student && (
        <Card variant="outlined" padding="lg" className="mb-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                <p className="w-full sm:w-48 text-xs uppercase tracking-wide text-slate-400">Documento</p>
                <Input value={student.cedula} readOnly fullWidth />
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                <p className="w-full sm:w-48 text-xs uppercase tracking-wide text-slate-400">Nombre</p>
                <Input value={student.name} readOnly fullWidth />
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                <p className="w-full sm:w-48 text-xs uppercase tracking-wide text-slate-400">Email</p>
                <Input value={student.email ?? '—'} readOnly fullWidth />
              </div>

              {!isSuspended && (
                <div className="flex flex-col gap-1.5">
                  <label className="select-none text-[13px] font-semibold text-slate-900">
                    Motivo de suspensión <span className="ml-1 text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Indica el motivo de la suspensión..."
                    value={observations}
                    onChange={(e) => { setObservations(e.target.value); setObsError(null) }}
                    className={[
                      'w-full resize-none rounded-md border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4',
                      obsError
                        ? 'border-red-600 focus:border-red-600 focus:ring-red-500/15'
                        : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/15',
                    ].join(' ')}
                  />
                  {obsError && (
                    <span className="text-xs text-red-600" role="alert">{obsError}</span>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                {accesoDirectoId === null ? (
                  <p className="text-xs text-slate-400">Estudiante no registrado en el sistema de comedor.</p>
                ) : isSuspended ? (
                  <Button variant="secondary" onClick={handleRevoke} loading={saving}>
                    Reactivar acceso
                  </Button>
                ) : (
                  <Button variant="danger" onClick={() => setConfirmOpen(true)} loading={saving}>
                    Suspender acceso
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Avatar name={student.name} src={student.avatar_url} shape="square" />
              <Badge variant={isSuspended ? 'danger' : 'success'}>
                {isSuspended ? 'Suspendido' : 'Activo'}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Historial de sanciones */}
      {!loading && student && history.length > 0 && (
        <Card variant="outlined" padding="lg">
          <p className="mb-3 text-sm font-semibold text-slate-700">Historial de Sanciones</p>
          <div className="flex flex-col gap-2">
            {history.map((s) => (
              <div key={s.id} className="flex items-start justify-between rounded-md border border-slate-100 px-4 py-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-slate-800">{s.reason}</span>
                  <span className="text-xs text-slate-400">
                    {s.start_date} → {s.end_date}
                  </span>
                </div>
                <Badge variant={s.status === 'ACTIVE' ? 'danger' : 'neutral'}>
                  {STATUS_LABEL[s.status] ?? s.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {student && (
        <SuspendConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => { await handleSuspend() }}
          student={student}
          observations={observations}
          loading={saving}
        />
      )}
    </div>
  )
}
