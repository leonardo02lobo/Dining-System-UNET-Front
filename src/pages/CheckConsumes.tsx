import { useEffect, useRef, useState } from 'react'
import { Search, ScanLine } from 'lucide-react'
import { normalizeCedula } from '../utils/cedula'
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
    try {
      await new Promise((r) => setTimeout(r, 600))
      setStudent({
        name: 'Leonardo', cedula: clean, is_suspended: false,
        career: 'Ing Informatica', user_type: 'SUPER ADMIN',
        avatar_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZ_gxAoOejX4BRTVTVejghk8MTbqJNivs1IQ&s',
      })
    } catch (err: any) {
      setError(err.message ?? 'Error al consultar')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() { void triggerSearch(cedula) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
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
