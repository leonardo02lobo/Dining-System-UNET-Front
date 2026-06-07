import type { Ingredient } from '../../types/inventory'
import { InventoryRowActions } from './InventoryRowActions'

interface InventoryTableProps {
  items: Ingredient[]
  onIncrease: (item: Ingredient) => void
  onDecrease: (item: Ingredient) => void
  onEdit: (item: Ingredient) => void
  onDelete: (item: Ingredient) => void
  onRowClick?: (item: Ingredient) => void
}

const COLUMNS = [
  { key: 'name', label: 'Insumo' },
  { key: 'category', label: 'Categoría' },
  { key: 'quantity', label: 'Stock Actual' },
  { key: 'unit', label: 'Unidad' },
  { key: 'min_stock', label: 'Stock mínimo' },
  { key: 'last_updated', label: 'Última actualización' },
] as const

function cellValue(item: Ingredient, key: (typeof COLUMNS)[number]['key']) {
  if (key === 'quantity') return `${item.quantity}${item.unit}`
  return String(item[key])
}

export function InventoryTable({
  items,
  onIncrease,
  onDecrease,
  onEdit,
  onDelete,
  onRowClick,
}: InventoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-[15px]">
        <thead>
          <tr className="bg-[#d9d9d9]">
            {COLUMNS.map((col, i) => (
              <th
                key={col.key}
                className={`border border-black px-2 py-3 text-center font-normal text-black ${
                  i === 0 ? 'rounded-tl-[10px]' : ''
                }`}
              >
                {col.label}
              </th>
            ))}
            <th className="rounded-tr-[10px] border border-black px-2 py-3 text-center font-normal text-black">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMNS.length + 1}
                className="border border-black px-4 py-10 text-center text-slate-500"
              >
                No hay insumos que coincidan con los filtros.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr
                key={item.id}
                className={`bg-white ${onRowClick ? 'cursor-pointer transition hover:bg-blue-50' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className="border border-black px-2 py-2.5 text-center text-black"
                  >
                    {cellValue(item, col.key)}
                  </td>
                ))}
                <td className="border border-black px-2 py-2">
                  <InventoryRowActions
                    item={item}
                    onIncrease={onIncrease}
                    onDecrease={onDecrease}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
