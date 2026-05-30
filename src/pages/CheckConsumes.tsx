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

export function CheckConsumes() {
  const [cedula, setCedula]     = useState('')
  const [student, setStudent]   = useState<Student | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!cedula.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void handleSearch()
  }

  return (
    <div>
      <PageHeader
        title="Consultar Comedor"
        subtitle="Busca un estudiante por su cédula o carnet"
      />

      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex items-end gap-3">
          <Input
            id="cedula"
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
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
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
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex flex-col gap-3 text-sm">
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
              <div className='flex flex-row gap-14 justify-center items-center'>
                <p className="text-xs uppercase tracking-wide text-slate-400 w-48">Estado</p>
                <Badge variant={student.is_suspended ? 'danger' : 'success'}>
                  {student.is_suspended ? 'Suspendido' : 'Activo'}
                </Badge>
              </div>
            </div>
            <Avatar name={student.name} src={student.avatar_url} />
          </div>
        </Card>
      )}
    </div>
  )
}
