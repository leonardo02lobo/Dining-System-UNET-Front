import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import type { Student } from '../types/user'

export function SuspendStudent() {
  const [cedula, setCedula]           = useState('')
  const [student, setStudent]         = useState<Student | null>(null)
  const [loading, setLoading]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [searched, setSearched]       = useState(false)
  const [observations, setObservations] = useState('')
  const [obsError, setObsError]       = useState<string | null>(null)

  async function handleSearch() {
    if (!cedula.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    setObservations('')
    setObsError(null)

    try {
      await new Promise((r) => setTimeout(r, 600))
      setStudent({
        "name": "Leonardo",
        "cedula": "31489733",
        "is_suspended": false,
        "career": "Ing Informatica",
        "user_type": "SUPER ADMIN",
        "avatar_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZ_gxAoOejX4BRTVTVejghk8MTbqJNivs1IQ&s",
      })
    } catch (err: any) {
      setError(err.message ?? 'Error al consultar')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleSuspend() {
    if (!student) return
    if (!student.is_suspended && !observations.trim()) {
      setObsError('Debes indicar el motivo de la suspensión')
      return
    }
    setObsError(null)
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      setStudent((prev) => prev ? { ...prev, is_suspended: !prev.is_suspended } : prev)
      setObservations('')
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void handleSearch()
  }

  return (
    <div>
      <PageHeader
        title="Gestión de Estudiante"
        subtitle="Consulta y administra el acceso al comedor de un estudiante"
      />

      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex items-end gap-3">
          <Input
            id="cedula-suspend"
            label="Cédula o Carnet"
            placeholder="Ej: V-12345678"
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
          No se encontró ningún estudiante con la cédula <strong>{cedula}</strong>.
        </div>
      )}

      {!loading && student && (
        <Card variant="outlined" padding="lg">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar name={student.name} src={student.avatar_url}/>
              <Badge variant={student.is_suspended ? 'danger' : 'success'}>
                {student.is_suspended ? 'Suspendido' : 'Activo'}
              </Badge>
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <div className='flex flex-row gap-14 justify-center items-center'>
                <p className="text-xs uppercase tracking-wide text-slate-400 w-48">Documento</p>
                <Input
                  value={student.cedula}
                  fullWidth
                />
              </div>
              <div className='flex flex-row gap-14 justify-center items-center'>
                <p className="text-xs uppercase tracking-wide text-slate-400 w-48">Nombre</p>
                <Input
                  value={student.name}
                  fullWidth
                />
              </div>
              <div className='flex flex-row gap-14 justify-center items-center'>
                <p className="text-xs uppercase tracking-wide text-slate-400 w-48">Carrera</p>
                <Input
                  value={student.career}
                  fullWidth
                />
              </div>
              <div className='flex flex-row gap-14 justify-center items-center'>
                <p className="text-xs uppercase tracking-wide text-slate-400 w-48">Tipo de Usuario</p>
                <Input
                  value={student.user_type}
                  fullWidth
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="select-none text-[13px] font-semibold text-slate-900">
                  Observaciones
                  {!student.is_suspended && <span className="ml-1 text-red-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    student.is_suspended
                      ? 'Observaciones sobre la reactivación (opcional)...'
                      : 'Indica el motivo de la suspensión...'
                  }
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

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                {student.is_suspended ? (
                  <Button variant="secondary" onClick={handleToggleSuspend} loading={saving}>
                    Reactivar acceso
                  </Button>
                ) : (
                  <Button variant="danger" onClick={handleToggleSuspend} loading={saving}>
                    Suspender acceso
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
