import { useEffect, useRef, useState } from 'react'
import { Search, ScanLine } from 'lucide-react'
import { studentApi } from '../api/student'
import { normalizeCedula } from '../utils/cedula'
import type { Student } from '../types/user'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'

const MIN_SCAN_LENGTH = 6
const MAX_GAP_MS      = 60

export function RegisterDining() {
  const [cedula,     setCedula]     = useState('')
  const [student,    setStudent]    = useState<Student | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [searched,   setSearched]   = useState(false)
  const [success,    setSuccess]    = useState<string | null>(null)

  const lastKeyAtRef = useRef(0)
  const bufferRef    = useRef('')

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
    setSuccess(null)
    setSearched(true)
    setStudent(null)
    try {
      const data = await studentApi.lookup(clean)
      setStudent(data)
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
    if (!student) return
    setSaving(true)
    setError(null)
    try {
      await studentApi.registerDining({
        cedula:           student.cedula,
        date:             new Date().toISOString(),
        registered_by_id: 0,
      })
      setSuccess(`Consumo registrado para ${student.name}`)
      setCedula('')
      setStudent(null)
      setSearched(false)
    } catch (err: any) {
      setError(err.message ?? 'Error al registrar el consumo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Registro al Comedor"
        subtitle="Escanea el carnet o búsqueda por cédula para registrar el consumo"
      />

      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
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

      {!loading && searched && !student && !error && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
          No se encontró ningún estudiante con la cédula <strong>{cedula}</strong>.
        </div>
      )}

      {/* ── Tarjeta del estudiante ─────────────────────────────── */}
      {!loading && student && (
        <Card variant="outlined" padding="lg">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">

            {/* Avatar + badge */}
            <div className="flex flex-col items-center gap-3">
              <Avatar name={student.name} src={student.avatar_url} />
              <Badge variant={student.is_suspended ? 'danger' : 'success'}>
                {student.is_suspended ? 'Suspendido' : 'Activo'}
              </Badge>
            </div>

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
                <p className="w-48 text-xs uppercase tracking-wide text-slate-400">Carrera</p>
                <Input value={student.career}    readOnly fullWidth />
              </div>
              <div className="flex flex-row items-center gap-14">
                <p className="w-48 text-xs uppercase tracking-wide text-slate-400">Tipo de Usuario</p>
                <Input value={student.user_type} readOnly fullWidth />
              </div>

              {student.is_suspended && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Este estudiante está suspendido y no puede registrar consumo.
                </div>
              )}

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <Button
                  variant="primary"
                  loading={saving}
                  disabled={student.is_suspended}
                  onClick={handleRegister}
                >
                  Registrar Consumo
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
