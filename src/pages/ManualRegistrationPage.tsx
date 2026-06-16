import { useEffect, useState } from 'react'
import { Search, Save, RotateCcw } from 'lucide-react'
import { studentApi } from '../api/student'
import { lunchSessionApi } from '../api/lunchSession'
import { normalizeCedula } from '../utils/cedula'
import type { Student } from '../types/user'
import type { LunchSession } from '../types/lunchSession'
import { notify } from '../utils/toast'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN:       'Administrador',
  TAQUILLERO:  'Taquillero',
}

function nowString() {
  return new Date().toLocaleString('es-VE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ManualRegistrationPage() {
  const { user } = useAuth()

  const [session,  setSession]  = useState<LunchSession | null | undefined>(undefined)
  const [cedula,   setCedula]   = useState('')
  const [student,  setStudent]  = useState<Student | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    lunchSessionApi.today()
      .then((s) => setSession(s))
      .catch(() => setSession(null))
  }, [])

  async function handleSearch() {
    const clean = normalizeCedula(cedula)
    if (!clean) return
    setCedula(clean)
    setLoading(true)
    setError(null)
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

  async function handleSave() {
    if (!student || !user || !session) return
    setSaving(true)
    setError(null)
    try {
      await studentApi.registerDining({
        cedula:            student.cedula,
        date:              new Date().toISOString(),
        registered_by_id:  user.id,
        session_id:        session.id,
        is_manual:         true,
        beneficiary_id:    student.beneficiary_id,
      })
      notify.success(`Registro exitoso para ${student.name}`)
      handleClear()
    } catch (err: any) {
      const msg = err?.status === 409
        ? 'Este beneficiario ya registró consumo en la sesión de hoy.'
        : 'Error al registrar el consumo'
      notify.error(msg)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  function handleClear() {
    setCedula('')
    setStudent(null)
    setSearched(false)
    setError(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void handleSearch()
  }

  const isSuspended = student?.is_suspended ?? false
  const noSession = session === null

  return (
    <div>
      <PageHeader
        title="Registro Manual de Estudiantes"
        subtitle="Registra manualmente el consumo de comedor de un estudiante"
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

      <Card variant="outlined" padding="lg" className="mb-6">
        <p className="mb-4 text-sm font-semibold text-blue-600">Datos del Estudiante</p>

        <div className="mb-4 flex items-end gap-3">
          <Input
            id="cedula-manual"
            label="Cédula / Carnet*"
            placeholder="Ingrese número de cédula o carnet"
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
            Buscar
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && searched && !student && !error && (
          <p className="text-sm text-slate-400">
            No se encontró ningún estudiante con la cédula <strong>{cedula}</strong>.
          </p>
        )}

        {!loading && student && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Estado:</span>
              <Badge variant={isSuspended ? 'danger' : 'success'}>
                {isSuspended ? 'Suspendido' : 'Activo'}
              </Badge>
            </div>

            {student.is_beneficiary ? (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                Usuario beneficiario
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                Este usuario no es beneficiario
              </div>
            )}

            {isSuspended && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Este estudiante está suspendido y no puede registrar consumo.
              </div>
            )}

            <div className="flex flex-row items-center gap-14">
              <p className="w-40 text-xs uppercase tracking-wide text-slate-400">Nombre*</p>
              <Input value={student.name} readOnly fullWidth />
            </div>
            <div className="flex flex-row items-center gap-14">
              <p className="w-40 text-xs uppercase tracking-wide text-slate-400">Email*</p>
              <Input value={student.email ?? '—'} readOnly fullWidth />
            </div>
            <div className="flex flex-row items-center gap-14">
              <p className="w-40 text-xs uppercase tracking-wide text-slate-400">Estatus*</p>
              <Input value={isSuspended ? 'SUSPENDIDO' : 'ACTIVO'} readOnly fullWidth />
            </div>
          </div>
        )}
      </Card>

      {!loading && student && (
        <Card variant="outlined" padding="lg" className="mb-6">
          <p className="mb-4 text-sm font-semibold text-blue-600">Datos del Registro</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Fecha de registro"
              value={nowString()}
              readOnly
              fullWidth
            />
            <Input
              label="Registrado por"
              value={user ? `${user.name} (${ROLE_LABEL[user.role.name] ?? user.role.name})` : ''}
              readOnly
              fullWidth
            />
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          variant="primary"
          leftIcon={<Save size={15} />}
          loading={saving}
          disabled={!student || isSuspended || noSession || !student.is_beneficiary}
          onClick={handleSave}
        >
          Guardar Estudiante
        </Button>
        <Button
          variant="secondary"
          leftIcon={<RotateCcw size={15} />}
          onClick={handleClear}
        >
          Limpiar campos
        </Button>
      </div>
    </div>
  )
}
