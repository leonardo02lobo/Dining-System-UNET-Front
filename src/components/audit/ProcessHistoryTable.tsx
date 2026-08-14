import { Badge } from '../ui/Badge'
import { Table, type ColumnDef } from '../ui/Table'
import type { AuditEntry } from '../../types/audit'
import {
  actionLabel,
  actionVariant,
  entrySummary,
  formatAuditDate,
  resourceWithId,
} from '../../utils/auditLabels'
import { roleLabel } from '../../utils/labels'
import { AuditEntryDetail } from './AuditEntryDetail'

interface ProcessHistoryTableProps {
  rows: AuditEntry[]
  loading: boolean
  emptyMessage: string
  /** La columna de persona se oculta en «Mi Actividad»: ahí la persona es siempre la misma. */
  showActor?: boolean
}

export function ProcessHistoryTable({
  rows,
  loading,
  emptyMessage,
  showActor = true,
}: ProcessHistoryTableProps) {
  const columns: ColumnDef<AuditEntry>[] = [
    {
      key: 'created_at',
      header: 'Fecha y hora',
      width: '11rem',
      render: (_v, row) => (
        <span className="whitespace-nowrap text-slate-700">{formatAuditDate(row.created_at)}</span>
      ),
    },
    ...(showActor
      ? [{
          key: 'actor_name',
          header: 'Persona',
          width: '14rem',
          render: (_v: unknown, row: AuditEntry) => (
            <div className="space-y-0.5">
              <div className="font-medium text-slate-800">{row.actor_name ?? '—'}</div>
              <div className="flex items-center gap-1.5">
                {row.actor_role && (
                  <span className="text-xs text-slate-500">{roleLabel(row.actor_role)}</span>
                )}
                {/* Sin cuenta a la que apuntar no se ofrece enlace a una ficha que ya no
                    existe; el nombre lo conserva la propia entrada. */}
                {row.user_id === null && (
                  <span className="text-xs text-slate-400">· cuenta eliminada</span>
                )}
              </div>
            </div>
          ),
        } satisfies ColumnDef<AuditEntry>]
      : []),
    {
      key: 'action',
      header: 'Acción',
      width: '10rem',
      render: (_v, row) => <Badge variant={actionVariant(row.action)}>{actionLabel(row.action)}</Badge>,
    },
    {
      key: 'resource',
      header: 'Recurso',
      width: '12rem',
      render: (_v, row) => <span className="text-slate-700">{resourceWithId(row)}</span>,
    },
    {
      key: 'details',
      header: 'Resumen',
      render: (_v, row) => <span className="text-slate-700">{entrySummary(row)}</span>,
    },
  ]

  return (
    <Table
      columns={columns}
      rows={rows}
      keyField="id"
      loading={loading}
      emptyMessage={emptyMessage}
      renderExpanded={(row) => <AuditEntryDetail entry={row} />}
      expandLabel={(row) => `${actionLabel(row.action)} de ${resourceWithId(row)}`}
    />
  )
}
