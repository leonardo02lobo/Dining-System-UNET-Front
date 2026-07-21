import { useEffect, useState } from 'react'
import { auditApi } from '../api/audit'
import type { LoginAuditEntry } from '../types/audit'
import { Table, type ColumnDef } from '../components/ui/Table'
import { Badge, type BadgeVariant } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'

const PAGE_SIZE = 50

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-VE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

function parseBrowser(ua: string | null): string {
  if (!ua) return '—'
  if (/Edg\//.test(ua))              return 'Edge'
  if (/Firefox\//.test(ua))          return 'Firefox'
  if (/Chrome\//.test(ua))           return 'Chrome'
  if (/Safari\//.test(ua))           return 'Safari'
  if (/curl|python-requests|axios/.test(ua)) return 'API Client'
  return ua.slice(0, 30) + '…'
}

const ROLE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  SUPER_ADMIN:    { label: 'Super Admin',    variant: 'danger'  },
  ADMIN:          { label: 'Admin',          variant: 'info'    },
  TAQUILLERO:     { label: 'Taquillero',     variant: 'neutral' },
  ACCESO_DIRECTO: { label: 'Acceso Directo', variant: 'success' },
}

const roleOptions = [
  { value: 'all', label: 'Todos los roles' },
  ...Object.entries(ROLE_MAP).map(([value, { label }]) => ({ value, label })),
]

export function LoginAuditPage() {
  const [rows,       setRows]       = useState<LoginAuditEntry[]>([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [fromDate,   setFromDate]   = useState('')
  const [toDate,     setToDate]     = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Resetear página al cambiar filtros
  useEffect(() => { setPage(0) }, [fromDate, toDate, roleFilter])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const data = await auditApi.getLogs(page * PAGE_SIZE, PAGE_SIZE, {
          from_date: fromDate || undefined,
          to_date:   toDate   || undefined,
          role:      roleFilter !== 'all' ? roleFilter : undefined,
        })
        setRows(data.items)
        setTotal(data.total)
        setError(null)
      } catch (err: any) {
        setError(err.message ?? 'Error al cargar los registros')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, fromDate, toDate, roleFilter])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = fromDate || toDate || roleFilter !== 'all'

  const clearFilters = () => {
    setFromDate('')
    setToDate('')
    setRoleFilter('all')
  }

  const columns: ColumnDef<LoginAuditEntry>[] = [
    {
      key: 'user_name',
      header: 'Usuario',
      sortable: true,
      render: (_, row) => <span className="font-medium text-slate-800">{row.user_name}</span>,
    },
    {
      key: 'user_email',
      header: 'Correo',
      render: (_, row) => <span className="text-slate-500">{row.user_email}</span>,
    },
    {
      key: 'user_role',
      header: 'Rol',
      render: (_, row) => {
        const { label, variant } = ROLE_MAP[row.user_role] ?? { label: row.user_role, variant: 'neutral' as BadgeVariant }
        return <Badge variant={variant}>{label}</Badge>
      },
    },
    {
      key: 'ip_address',
      header: 'IP',
      render: (_, row) => (
        <span className="font-mono text-xs text-slate-500">{row.ip_address ?? '—'}</span>
      ),
    },
    {
      key: 'user_agent',
      header: 'Navegador',
      render: (_, row) => (
        <span
          className="text-xs text-slate-500"
          title={row.user_agent ?? ''}
        >
          {parseBrowser(row.user_agent)}
        </span>
      ),
    },
    {
      key: 'logged_at',
      header: 'Fecha y Hora',
      sortable: true,
      render: (_, row) => (
        <span className="whitespace-nowrap text-slate-700">{formatDate(row.logged_at)}</span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Auditoría de Acceso"
        subtitle={`${total} registro${total !== 1 ? 's' : ''} en total`}
      />

      {/* Barra de filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input
          id="audit-from-date"
          label="Desde"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input
          id="audit-to-date"
          label="Hasta"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <Select
          label="Rol"
          options={roleOptions}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-44"
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

      <Table<LoginAuditEntry>
        columns={columns}
        rows={rows}
        keyField="id"
        loading={loading}
        emptyMessage="No hay registros de inicio de sesión para los filtros seleccionados."
      />

      {/* Paginación — siempre visible */}
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
    </div>
  )
}
