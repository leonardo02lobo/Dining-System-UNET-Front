import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { SearchInput } from '../ui/SearchInput'
import { Select, type SelectOption } from '../ui/Select'
import type { UserAccount } from '../../types/user'
import { actionLabel, resourceLabel } from '../../utils/auditLabels'
import { roleLabel } from '../../utils/labels'

export interface ProcessHistoryFilterState {
  userId: string
  action: string
  resource: string
  fromDate: string
  toDate: string
  query: string
}

export const EMPTY_FILTERS: ProcessHistoryFilterState = {
  userId: 'all',
  action: 'all',
  resource: 'all',
  fromDate: '',
  toDate: '',
  query: '',
}

export function hasActiveFilters(filters: ProcessHistoryFilterState): boolean {
  return (
    filters.userId !== 'all'
    || filters.action !== 'all'
    || filters.resource !== 'all'
    || filters.fromDate !== ''
    || filters.toDate !== ''
    || filters.query !== ''
  )
}

interface ProcessHistoryFiltersProps {
  filters: ProcessHistoryFilterState
  onChange: (filters: ProcessHistoryFilterState) => void
  /** Acciones y recursos que **existen** en el historial, tal como los da el servidor. */
  actions: string[]
  resources: string[]
  /** Cuentas para el selector de persona. Ausente en «Mi Actividad». */
  users?: UserAccount[]
  onClear: () => void
}

export function ProcessHistoryFilters({
  filters,
  onChange,
  actions,
  resources,
  users,
  onClear,
}: ProcessHistoryFiltersProps) {
  function set<K extends keyof ProcessHistoryFilterState>(
    key: K,
    value: ProcessHistoryFilterState[K],
  ) {
    onChange({ ...filters, [key]: value })
  }

  // Las opciones salen del catálogo del servidor, no de una lista escrita a mano: una
  // lista fija queda vieja en cuanto el backend registra un recurso nuevo, y ofrecer una
  // opción sin resultados es peor que no ofrecerla. El rótulo sí es del cliente, y un
  // código sin rótulo conocido se muestra en crudo.
  const actionOptions: SelectOption[] = [
    { value: 'all', label: 'Todas las acciones' },
    ...actions.map((value) => ({ value, label: actionLabel(value) })),
  ]

  const resourceOptions: SelectOption[] = [
    { value: 'all', label: 'Todos los recursos' },
    ...resources.map((value) => ({ value, label: resourceLabel(value) })),
  ]

  const userOptions: SelectOption[] = [
    { value: 'all', label: 'Todas las personas' },
    ...(users ?? []).map((user) => ({
      value: String(user.id),
      label: `${user.name} — ${roleLabel(user.role.name)}`,
    })),
  ]

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      {users && (
        <Select
          label="Persona"
          options={userOptions}
          value={filters.userId}
          onChange={(e) => set('userId', e.target.value)}
          className="w-full sm:w-64"
        />
      )}
      <Select
        label="Acción"
        options={actionOptions}
        value={filters.action}
        onChange={(e) => set('action', e.target.value)}
        className="w-full sm:w-52"
      />
      <Select
        label="Recurso"
        options={resourceOptions}
        value={filters.resource}
        onChange={(e) => set('resource', e.target.value)}
        className="w-full sm:w-52"
      />
      <Input
        id="process-history-from"
        label="Desde"
        type="date"
        value={filters.fromDate}
        onChange={(e) => set('fromDate', e.target.value)}
      />
      <Input
        id="process-history-to"
        label="Hasta"
        type="date"
        value={filters.toDate}
        onChange={(e) => set('toDate', e.target.value)}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="process-history-search" className="text-sm font-medium text-slate-700">
          Buscar
        </label>
        <SearchInput
          id="process-history-search"
          placeholder="Detalle, recurso o persona"
          value={filters.query}
          debounceMs={350}
          onChange={(e) => set('query', e.target.value)}
          className="sm:w-64"
        />
      </div>
      {hasActiveFilters(filters) && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
