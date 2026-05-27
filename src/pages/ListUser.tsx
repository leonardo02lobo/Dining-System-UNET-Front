import { useEffect, useState } from 'react'
import { FileDown, UserPlus } from 'lucide-react'
import { getData } from '../api/user'
import type { Row } from '../types/user'
import { Table, type ColumnDef } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { Pencil, Trash2 } from 'lucide-react'

export function ListUser() {
  const [rows, setRows]               = useState<Row[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [selectedGender, setGender]   = useState('all')
  const [selectedCareer, setCareer]   = useState('all')

  useEffect(() => {
    void (async () => {
      try {
        const data = await getData()
        setRows(data)
      } catch (err: any) {
        setError(err.message ?? 'Error desconocido')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const careerOptions = [
    { value: 'all', label: 'Todas las carreras' },
    ...[...new Set(rows.map((r) => r.career))].sort().map((c) => ({ value: c, label: c })),
  ]

  const genderOptions = [
    { value: 'all',    label: 'Todos' },
    { value: 'male',   label: 'Masculino' },
    { value: 'female', label: 'Femenino' },
  ]

  const filtered = rows.filter((r) => {
    const matchGender = selectedGender === 'all' || r.gender === selectedGender
    const matchCareer = selectedCareer === 'all' || r.career === selectedCareer
    const matchSearch = search === '' ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
    return matchGender && matchCareer && matchSearch
  })

  const columns: ColumnDef<Row>[] = [
    {
      key: 'picture',
      header: 'Foto',
      width: '60px',
      render: (_, row) => <Avatar name={row.name} size="sm" />,
    },
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      render: (_, row) => <span className="font-medium text-slate-800">{row.name}</span>,
    },
    {
      key: 'career',
      header: 'Carrera',
      sortable: true,
    },
    {
      key: 'email',
      header: 'Correo',
      render: (_, row) => <span className="text-slate-500">{row.email}</span>,
    },
    {
      key: 'gender',
      header: 'Estado',
      render: () => <Badge variant="success">Activo</Badge>,
    },
    {
      key: 'gender',
      header: 'Rol',
      render: () => <Badge variant="info">Estudiante</Badge>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Directorio de Usuarios"
        subtitle={`${filtered.length} usuario${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        actions={
          <>
            <Button variant="primary" leftIcon={<UserPlus size={15} />} size="sm">
              Nuevo Usuario
            </Button>
            <Button variant="secondary" leftIcon={<FileDown size={15} />} size="sm">
              Exportar PDF
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput
          placeholder="Buscar por nombre o correo..."
          fullWidth={false}
          className="w-64"
          onSearch={setSearch}
          debounceMs={200}
        />
        <Select
          options={genderOptions}
          value={selectedGender}
          onChange={(e) => setGender(e.target.value)}
          className="w-44"
        />
        <Select
          options={careerOptions}
          value={selectedCareer}
          onChange={(e) => setCareer(e.target.value)}
          className="w-56"
        />
      </div>

      <Table<Row>
        columns={columns}
        rows={filtered}
        keyField="email"
        loading={loading}
        emptyMessage="No hay usuarios para los filtros seleccionados."
        actions={(row) => (
          <>
            <button
              type="button"
              title="Editar"
              className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
              onClick={() => console.log('Editar', row.name)}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              title="Eliminar"
              className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              onClick={() => console.log('Eliminar', row.name)}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />
    </div>
  )
}
