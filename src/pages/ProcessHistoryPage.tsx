import { FileDown, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { processHistoryApi, type ProcessHistoryFilters as ApiFilters } from '../api/audit'
import { userApi } from '../api/user'
import {
  EMPTY_FILTERS,
  ProcessHistoryFilters,
  hasActiveFilters,
  type ProcessHistoryFilterState,
} from '../components/audit/ProcessHistoryFilters'
import { ProcessHistoryTable } from '../components/audit/ProcessHistoryTable'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import type { AuditEntry } from '../types/audit'
import type { UserAccount } from '../types/user'
import { downloadBlob } from '../utils/downloadBlob'
import { notify } from '../utils/toast'

const PAGE_SIZE = 50

/** El único filtro que viaja en la URL. Ver `USER_PARAM` abajo. */
const USER_PARAM = 'usuario'

export function toApiFilters(filters: ProcessHistoryFilterState): ApiFilters {
  return {
    user_id: filters.userId !== 'all' ? Number(filters.userId) : undefined,
    action: filters.action !== 'all' ? filters.action : undefined,
    resource: filters.resource !== 'all' ? filters.resource : undefined,
    from_date: filters.fromDate || undefined,
    to_date: filters.toDate || undefined,
    q: filters.query || undefined,
  }
}

export function ProcessHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // La persona viaja en la URL y el resto de filtros en el estado del componente: el
  // enlace a "el historial de esta persona" es el que se comparte y al que se llega desde
  // la lista de usuarios, y es el que tiene que sobrevivir a la vuelta atrás.
  const [filters, setFilters] = useState<ProcessHistoryFilterState>({
    ...EMPTY_FILTERS,
    userId: searchParams.get(USER_PARAM) ?? 'all',
  })
  const [rows, setRows] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<UserAccount[]>([])
  const [actions, setActions] = useState<string[]>([])
  const [resources, setResources] = useState<string[]>([])
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  // Cambiar cualquier filtro devuelve a la primera página: la 3 de un resultado ya no
  // existe en el siguiente.
  useEffect(() => { setPage(0) }, [
    filters.userId, filters.action, filters.resource,
    filters.fromDate, filters.toDate, filters.query,
  ])

  // La URL sigue a la selección, no al revés: así el enlace es compartible sin que el
  // resto de filtros ensucie la barra de direcciones.
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (filters.userId === 'all') next.delete(USER_PARAM)
    else next.set(USER_PARAM, filters.userId)
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [filters.userId, searchParams, setSearchParams])

  useEffect(() => {
    void (async () => {
      try {
        const [userList, catalog] = await Promise.all([
          userApi.list(),
          processHistoryApi.filterCatalog(),
        ])
        setUsers(userList)
        setActions(catalog.actions)
        setResources(catalog.resources)
      } catch (err) {
        // Sin catálogo la pantalla sigue sirviendo: se pierden las opciones de los
        // desplegables, no el historial.
        notify.error(err)
      }
    })()
  }, [])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const data = await processHistoryApi.list(page * PAGE_SIZE, PAGE_SIZE, toApiFilters(filters))
        setRows(data.items)
        setTotal(data.total)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el historial')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, filters, reloadToken])

  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    setExporting(format)
    try {
      const blob = await processHistoryApi.export(format, toApiFilters(filters))
      downloadBlob(blob, `historial-procesos.${format}`)
    } catch (err) {
      notify.error(err)
    } finally {
      setExporting(null)
    }
  }, [filters])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filtered = hasActiveFilters(filters)
  const selectedUser = users.find((user) => String(user.id) === filters.userId)

  return (
    <div>
      <PageHeader
        title="Historial de Procesos"
        subtitle={
          selectedUser
            ? `${total} proceso${total !== 1 ? 's' : ''} de ${selectedUser.name}`
            : `${total} proceso${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`
        }
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReloadToken((token) => token + 1)}
              disabled={loading}
            >
              <RefreshCw size={15} className="mr-1.5" />
              Actualizar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleExport('csv')}
              disabled={exporting !== null}
            >
              <FileDown size={15} className="mr-1.5" />
              {exporting === 'csv' ? 'Exportando…' : 'CSV'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleExport('pdf')}
              disabled={exporting !== null}
            >
              <FileDown size={15} className="mr-1.5" />
              {exporting === 'pdf' ? 'Exportando…' : 'PDF'}
            </Button>
          </>
        }
      />

      <ProcessHistoryFilters
        filters={filters}
        onChange={setFilters}
        actions={actions}
        resources={resources}
        users={users}
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
        emptyMessage={
          filtered
            ? 'No hay procesos registrados para estos filtros. Prueba a limpiarlos.'
            : 'Todavía no hay procesos registrados.'
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
