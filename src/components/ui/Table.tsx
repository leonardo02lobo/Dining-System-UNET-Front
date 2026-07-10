import { ArrowUpDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Spinner } from './Spinner'

export interface ColumnDef<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (value: unknown, row: T) => ReactNode
  sortable?: boolean
}

interface TableProps<T extends object> {
  columns: ColumnDef<T>[]
  rows: T[]
  keyField: keyof T
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  actions?: (row: T) => ReactNode
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
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

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
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-4 py-10 text-center text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={String(getValue(row, keyField))}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-slate-100 last:border-0 transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-slate-50'
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key as string} className="px-3 py-2 text-slate-700 sm:px-4 sm:py-3">
                    {col.render
                      ? col.render(getValue(row, col.key), row)
                      : String(getValue(row, col.key) ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
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
