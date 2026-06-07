import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Ingredient } from '../../types/inventory'

interface InventoryRowActionsProps {
  item: Ingredient
  onIncrease: (item: Ingredient) => void
  onDecrease: (item: Ingredient) => void
  onEdit: (item: Ingredient) => void
  onDelete: (item: Ingredient) => void
}

const actionBtn =
  'rounded p-1 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900'

export function InventoryRowActions({
  item,
  onIncrease,
  onDecrease,
  onEdit,
  onDelete,
}: InventoryRowActionsProps) {
  return (
    <div
      className="flex items-center justify-center gap-2.5"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title="Aumentar stock"
        className={actionBtn}
        onClick={() => onIncrease(item)}
      >
        <Plus size={18} />
      </button>
      <button
        type="button"
        title="Disminuir stock"
        className={actionBtn}
        onClick={() => onDecrease(item)}
      >
        <Minus size={18} />
      </button>
      <button
        type="button"
        title="Editar"
        className={actionBtn}
        onClick={() => onEdit(item)}
      >
        <Pencil size={18} />
      </button>
      <button
        type="button"
        title="Eliminar"
        className={`${actionBtn} hover:bg-red-50 hover:text-red-600`}
        onClick={() => onDelete(item)}
      >
        <Trash2 size={18} />
      </button>
    </div>
  )
}
