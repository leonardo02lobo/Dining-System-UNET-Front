import { useEffect, useState } from 'react'
import { Clock, IdCard, Mail, GraduationCap, UserRound, CalendarDays } from 'lucide-react'
import { studentAccessApi } from '../api/studentAccess'
import type { StudentAccess } from '../types/studentAccess'
import { Table, type ColumnDef } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'

const PAGE_SIZE = 50

const USER_TYPE_LABELS: Record<string, string> = {
  STUDENT:        'Estudiante',
  TEACHER:        'Profesor',
  ADMINISTRATIVE: 'Administrativo',
  WORKER:         'Obrero',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'medium' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function userTypeLabel(t: string): string {
  return USER_TYPE_LABELS[t] ?? t
}

export function StudentAccessPage() {
  const [rows,     setRows]     = useState<StudentAccess[]>([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [search,   setSearch]   = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate,   setToDate]   = useState('')
  const [selected, setSelected] = useState<StudentAccess | null>(null)

  // Resetear página al cambiar filtros
  useEffect(() => { setPage(0) }, [search, fromDate, toDate])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const data = await studentAccessApi.list({
          skip:   page * PAGE_SIZE,
          limit:  PAGE_SIZE,
          search: search || undefined,
          from:   fromDate || undefined,
          to:     toDate   || undefined,
        })
        setRows(data.items)
        setTotal(data.total)
        setError(null)
      } catch (err: any) {
        setError(err.message ?? 'Error al cargar los accesos')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, search, fromDate, toDate])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = search || fromDate || toDate

  const clearFilters = () => {
    setSearch('')
    setFromDate('')
    setToDate('')
  }

  const columns: ColumnDef<StudentAccess>[] = [
    {
      key: 'document_id',
      header: 'Cédula',
      sortable: true,
      render: (_, row) => <span className="font-mono text-slate-800">{row.document_id}</span>,
    },
    {
      key: 'full_name',
      header: 'Nombre',
      sortable: true,
      render: (_, row) => <span className="font-medium text-slate-800">{row.full_name}</span>,
    },
    {
      key: 'registered_at',
      header: 'Hora de ingreso',
      sortable: true,
      render: (_, row) => (
        <span className="whitespace-nowrap text-slate-700">{formatDateTime(row.registered_at)}</span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Acceso Estudiantes"
        subtitle={`${total} acceso${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`}
      />

      {/* Barra de filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Buscar por cédula o nombre…"
            debounceMs={350}
            onSearch={setSearch}
            fullWidth
          />
        </div>
        <Input
          id="access-from-date"
          label="Desde"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input
          id="access-to-date"
          label="Hasta"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      <Table<StudentAccess>
        columns={columns}
        rows={rows}
        keyField="id"
        loading={loading}
        onRowClick={setSelected}
        emptyMessage="No hay accesos registrados para los filtros seleccionados."
      />

      {/* Paginación */}
      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
        >
          ← Anterior
        </Button>
        <span className="text-sm text-slate-500">
          Página {page + 1} de {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1 || loading}
        >
          Siguiente →
        </Button>
      </div>

      {/* Modal de detalle del estudiante */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Detalle del acceso"
        size="md"
      >
        {selected && (
          <div className="flex flex-col items-center gap-5">
            {/* Foto de perfil */}
            <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200">
              {selected.photo_url ? (
                <img
                  alt={selected.full_name}
                  src={selected.photo_url}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="select-none text-4xl font-semibold text-slate-500">
                  {selected.full_name ? selected.full_name[0].toUpperCase() : '?'}
                </span>
              )}
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800">{selected.full_name}</h3>
              <div className="mt-1 flex items-center justify-center gap-2">
                <Badge variant="info">{userTypeLabel(selected.user_type)}</Badge>
                {selected.is_manual && <Badge variant="warning">Registro manual</Badge>}
              </div>
            </div>

            {/* Datos */}
            <dl className="w-full divide-y divide-slate-100 rounded-lg border border-slate-200">
              <DetailRow icon={<IdCard size={16} />} label="Cédula">
                <span className="font-mono">{selected.document_id}</span>
              </DetailRow>
              <DetailRow icon={<Mail size={16} />} label="Correo">
                {selected.email ?? '—'}
              </DetailRow>
              <DetailRow icon={<GraduationCap size={16} />} label="Carrera">
                {selected.career ?? '—'}
              </DetailRow>
              <DetailRow icon={<UserRound size={16} />} label="Tipo">
                {userTypeLabel(selected.user_type)}
              </DetailRow>
              <DetailRow icon={<CalendarDays size={16} />} label="Fecha">
                {new Date(selected.consumption_date).toLocaleDateString('es-VE', { dateStyle: 'long' })}
              </DetailRow>
              <DetailRow icon={<Clock size={16} />} label="Hora de ingreso">
                {formatTime(selected.registered_at)}
              </DetailRow>
            </dl>
          </div>
        )}
      </Modal>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm">
      <span className="flex-shrink-0 text-slate-400">{icon}</span>
      <span className="w-32 flex-shrink-0 text-slate-500">{label}</span>
      <span className="flex-1 text-right font-medium text-slate-800">{children}</span>
    </div>
  )
}
