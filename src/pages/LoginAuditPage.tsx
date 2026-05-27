import { useEffect, useState } from 'react'
import { auditApi } from '../api/audit'
import type { LoginAuditEntry } from '../types/audit'
import { Table, type ColumnDef } from '../components/ui/Table'
import { Badge, type BadgeVariant } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'

const PAGE_SIZE = 50

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-VE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

const ROLE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  SUPER_ADMIN: { label: 'Super Admin',  variant: 'danger'  },
  ADMIN:       { label: 'Admin',        variant: 'info'    },
  TAQUILLERO:  { label: 'Taquillero',   variant: 'neutral' },
}

export function LoginAuditPage() {
  const [rows, setRows]     = useState<LoginAuditEntry[]>([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    auditApi
      .getLogs(page * PAGE_SIZE, PAGE_SIZE)
      .then((data) => {
        setRows(data.items)
        setTotal(data.total)
      })
      .catch((err: any) => setError(err.message ?? 'Error al cargar los registros'))
      .finally(() => setLoading(false))
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

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
        <span className="font-mono text-xs text-slate-400">{row.ip_address ?? '—'}</span>
      ),
    },
    {
      key: 'user_agent',
      header: 'Dispositivo / Navegador',
      render: (_, row) => (
        <span
          className="block max-w-xs truncate text-xs text-slate-400"
          title={row.user_agent ?? ''}
        >
          {row.user_agent ?? '—'}
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
        emptyMessage="No hay registros de inicio de sesión."
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
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
            disabled={page >= totalPages - 1}
          >
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  )
}
