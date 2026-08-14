import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { processHistoryApi } from '../api/audit'
import {
  EMPTY_FILTERS,
  ProcessHistoryFilters,
  hasActiveFilters,
  type ProcessHistoryFilterState,
} from '../components/audit/ProcessHistoryFilters'
import { ProcessHistoryTable } from '../components/audit/ProcessHistoryTable'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { useAuth } from '../context/AuthContext'
import type { AuditEntry } from '../types/audit'
import { toApiFilters } from './ProcessHistoryPage'

const PAGE_SIZE = 50

/**
 * Mi Actividad — el historial propio.
 *
 * Abierta a cualquier sesión: no está en `ROUTE_ACCESS` y el servidor acota
 * `GET /audit-logs/me` a quien pregunta, así que no hay `user_id` que manipular. No se
 * ofrece selector de persona porque aquí la persona es siempre la misma.
 */
export function MyActivityPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<ProcessHistoryFilterState>(EMPTY_FILTERS)
  const [rows, setRows] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actions, setActions] = useState<string[]>([])
  const [resources, setResources] = useState<string[]>([])
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => { setPage(0) }, [
    filters.action, filters.resource, filters.fromDate, filters.toDate, filters.query,
  ])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const data = await processHistoryApi.listMine(
          page * PAGE_SIZE, PAGE_SIZE, toApiFilters(filters),
        )
        setRows(data.items)
        setTotal(data.total)
        // Las opciones salen de lo que hay en el historial propio: el catálogo general
        // exige el permiso de auditoría, que esta pantalla no pide a nadie.
        setActions([...new Set(data.items.map((entry) => entry.action))].sort())
        setResources([...new Set(data.items.map((entry) => entry.resource))].sort())
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar tu actividad')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filters, reloadToken])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <PageHeader
        title="Mi Actividad"
        subtitle={
          user
            ? `${total} proceso${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''} a nombre de ${user.name}`
            : undefined
        }
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReloadToken((token) => token + 1)}
            disabled={loading}
          >
            <RefreshCw size={15} className="mr-1.5" />
            Actualizar
          </Button>
        }
      />

      <ProcessHistoryFilters
        filters={filters}
        onChange={setFilters}
        actions={actions}
        resources={resources}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      <ProcessHistoryTable
        rows={rows}
        loading={loading}
        showActor={false}
        emptyMessage={
          hasActiveFilters(filters)
            ? 'No hay procesos tuyos para estos filtros. Prueba a limpiarlos.'
            : 'Todavía no hay procesos registrados a tu nombre.'
        }
      />

      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage((current) => Math.max(0, current - 1))}
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
          onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
          disabled={page >= totalPages - 1 || loading}
        >
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
