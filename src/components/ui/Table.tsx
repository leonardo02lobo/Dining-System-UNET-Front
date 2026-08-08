import { ArrowUpDown } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Spinner } from './Spinner'

export interface ColumnDef<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (value: unknown, row: T) => ReactNode
  sortable?: boolean
}

export type RowKey = string | number

interface TableProps<T extends object> {
  columns: ColumnDef<T>[]
  rows: T[]
  keyField: keyof T
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  actions?: (row: T) => ReactNode
  /**
   * Claves de las filas marcadas. La columna de selección se renderiza **solo**
   * cuando llegan `selectedKeys` y `onSelectionChange`; sin ellas el componente se
   * comporta exactamente igual que antes, que es lo que permite añadir esto sin
   * tocar a las ocho pantallas que ya lo consumen.
   */
  selectedKeys?: RowKey[]
  /**
   * Nueva selección completa. El estado lo posee el padre: quien consume la
   * selección necesita cruzarla con otros datos de su pantalla, y una copia
   * interna acabaría divergiendo.
   */
  onSelectionChange?: (keys: RowKey[]) => void
  /** Texto accesible de la casilla de una fila. Sin él, cincuenta casillas suenan igual. */
  selectionLabel?: (row: T) => string
}

function getValue<T extends object>(row: T, key: keyof T | string): unknown {
  return (row as Record<string, unknown>)[key as string]
}

export function Table<T extends object>({
  columns,
  rows,
  keyField,
  loading = false,
  emptyMessage = 'No hay datos para mostrar',
  onRowClick,
  actions,
  selectedKeys,
  onSelectionChange,
  selectionLabel,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const headerCheckbox = useRef<HTMLInputElement>(null)

  const selectable = selectedKeys !== undefined && onSelectionChange !== undefined
  const selected = new Set<RowKey>(selectedKeys ?? [])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0
    const av = getValue(a, sortKey)
    const bv = getValue(b, sortKey)
    const cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'es', { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  const visibleKeys = sorted.map((row) => getValue(row, keyField) as RowKey)
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k))
  const someVisibleSelected = visibleKeys.some((k) => selected.has(k))

  // `indeterminate` no es un atributo HTML, solo una propiedad del elemento.
  useEffect(() => {
    if (headerCheckbox.current) {
      headerCheckbox.current.indeterminate = someVisibleSelected && !allVisibleSelected
    }
  }, [someVisibleSelected, allVisibleSelected])

  function toggleAllVisible() {
    if (!onSelectionChange) return
    // El alcance es la página visible a propósito: una acción que marcara filas que
    // nadie ha visto convertiría la revisión en un trámite.
    onSelectionChange(
      allVisibleSelected
        ? (selectedKeys ?? []).filter((k) => !visibleKeys.includes(k))
        : [...new Set([...(selectedKeys ?? []), ...visibleKeys])],
    )
  }

  function toggleRow(key: RowKey) {
    if (!onSelectionChange) return
    onSelectionChange(
      selected.has(key)
        ? (selectedKeys ?? []).filter((k) => k !== key)
        : [...(selectedKeys ?? []), key],
    )
  }

  return (
    <div className="relative w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80">
          <Spinner size="lg" />
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left">
            {selectable && (
              <th className="w-10 px-3 py-2 sm:px-4 sm:py-3">
                <input
                  ref={headerCheckbox}
                  type="checkbox"
                  aria-label="Seleccionar todas las filas visibles"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key as string}
                style={col.width ? { width: col.width } : undefined}
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-3"
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key as string)}
                    className="inline-flex items-center gap-1 hover:text-slate-800"
                  >
                    {col.header}
                    <ArrowUpDown size={12} />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
            {actions && (
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:py-3">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && !loading ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)}
                className="px-4 py-10 text-center text-slate-600"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={String(getValue(row, keyField))}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => {
                  if (!onRowClick) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRowClick(row)
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                className={`border-b border-slate-100 last:border-0 transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-blue-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500' : 'hover:bg-slate-50'
                }`}
              >
                {selectable && (
                  // `stopPropagation` por el mismo motivo que en la columna de
                  // acciones: en una tabla con filas clicables, marcar la casilla
                  // abriría además el detalle de esa fila.
                  <td className="px-3 py-2 sm:px-4 sm:py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={
                        selectionLabel
                          ? `Seleccionar ${selectionLabel(row)}`
                          : 'Seleccionar fila'
                      }
                      checked={selected.has(getValue(row, keyField) as RowKey)}
                      onChange={() => toggleRow(getValue(row, keyField) as RowKey)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key as string} className="px-3 py-2 text-slate-700 sm:px-4 sm:py-3">
                    {col.render
                      ? col.render(getValue(row, col.key), row)
                      : String(getValue(row, col.key) ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className="px-3 py-2 sm:px-4 sm:py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
