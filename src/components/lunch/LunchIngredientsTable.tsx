import { Pencil, Trash2 } from 'lucide-react'
import type { LunchFormIngredient } from '../../types/lunch'

interface LunchIngredientsTableProps {
  items: LunchFormIngredient[]
  plateCount: number
  onEdit: (item: LunchFormIngredient) => void
  onDelete: (item: LunchFormIngredient) => void
}

const actionBtn =
  'rounded p-1 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900'

export function LunchIngredientsTable({
  items,
  plateCount,
  onEdit,
  onDelete,
}: LunchIngredientsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse text-[15px] sm:text-base">
        <thead>
          <tr className="bg-[#d9d9d9]">
            <th className="rounded-tl-[10px] border border-black px-2 py-3 text-center font-medium text-black">
              Ingrediente
            </th>
            <th className="border border-black px-2 py-3 text-center font-medium text-black">
              Categoría
            </th>
            <th className="border border-black px-2 py-3 text-center font-medium text-black">
              <span className="block">Cantidad Calculada</span>
              <span className="text-sm font-normal">
                (para <span className="font-bold text-[#03216a]">{plateCount}</span> platos)
              </span>
            </th>
            <th className="border border-black px-2 py-3 text-center font-medium text-black">
              Stock disponible
            </th>
            <th className="rounded-tr-[10px] border border-black px-2 py-3 text-center font-medium text-black">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="border border-black px-4 py-8 text-center text-slate-500">
                Agrega ingredientes al almuerzo.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.ingredient_id} className="bg-white">
                <td className="border border-black px-2 py-2.5 text-center text-black">
                  {item.ingredient_name}
                </td>
                <td className="border border-black px-2 py-2.5 text-center text-black">
                  {item.category}
                </td>
                <td className="border border-black px-2 py-2.5 text-center text-black">
                  {item.calculated_quantity}
                  {item.unit}
                </td>
                <td className="border border-black px-2 py-2.5 text-center text-black">
                  {item.available_quantity}
                  {item.unit}
                </td>
                <td className="border border-black px-2 py-2">
                  <div className="flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      title="Editar"
                      className={actionBtn}
                      onClick={() => onEdit(item)}
                    >
                      <Pencil size={22} />
                    </button>
                    <button
                      type="button"
                      title="Eliminar"
                      className={`${actionBtn} hover:bg-red-50 hover:text-red-600`}
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
