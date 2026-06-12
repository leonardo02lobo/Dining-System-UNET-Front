import type { Ingredient } from '../../types/inventory'

interface InventoryOverviewTableProps {
  items: Ingredient[]
}

const COLUMNS = [
  { key: 'name', label: 'Insumo' },
  { key: 'category', label: 'Categoría' },
  { key: 'quantity', label: 'Stock Actual' },
  { key: 'unit', label: 'Unidad' },
  { key: 'min_stock', label: 'Stock mínimo' },
] as const

function cellValue(item: Ingredient, key: (typeof COLUMNS)[number]['key']) {
  return String(item[key])
}

export function InventoryOverviewTable({ items }: InventoryOverviewTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[15px]">
        <thead>
          <tr className="bg-[#d9d9d9]">
            {COLUMNS.map((col, index) => (
              <th
                key={col.key}
                className={`border border-black px-2 py-3 text-center font-normal text-black ${
                  index === 0 ? 'rounded-tl-[10px]' : ''
                } ${index === COLUMNS.length - 1 ? 'rounded-tr-[10px]' : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={COLUMNS.length}
                className="border border-black px-4 py-10 text-center text-slate-500"
              >
                No hay insumos que coincidan con los filtros.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="bg-white">
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className="border border-black px-2 py-2.5 text-center text-black"
                  >
                    {cellValue(item, col.key)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
