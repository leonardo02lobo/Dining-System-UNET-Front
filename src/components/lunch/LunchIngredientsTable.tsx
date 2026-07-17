import { Pencil, Trash2 } from 'lucide-react'
import type { LunchFormIngredient } from '../../types/lunch'
import { Table, type ColumnDef } from '../ui/Table'

interface LunchIngredientsTableProps {
  items: LunchFormIngredient[]
  plateCount: number
  onEdit: (item: LunchFormIngredient) => void
  onDelete: (item: LunchFormIngredient) => void
}

export function LunchIngredientsTable({
  items,
  plateCount,
  onEdit,
  onDelete,
}: LunchIngredientsTableProps) {
  const columns: ColumnDef<LunchFormIngredient>[] = [
    { key: 'ingredient_name', header: 'Ingrediente', sortable: true },
    { key: 'category', header: 'Categoría', sortable: true },
    {
      key: 'calculated_quantity',
      header: `Cantidad calculada (${plateCount} platos)`,
      sortable: true,
      render: (_, item) => `${item.calculated_quantity} ${item.unit}`,
    },
    {
      key: 'available_quantity',
      header: 'Stock disponible',
      sortable: true,
      render: (_, item) => `${item.available_quantity} ${item.unit}`,
    },
  ]

  return (
    <Table<LunchFormIngredient>
      columns={columns}
      rows={items}
      keyField="ingredient_id"
      emptyMessage="Agrega ingredientes al servicio de alimentación."
      actions={(item) => (
        <>
          <button
            type="button"
            title="Editar"
            className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
            onClick={() => onEdit(item)}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            title="Eliminar"
            className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            onClick={() => onDelete(item)}
          >
            <Trash2 size={14} />
          </button>
        </>
      )}
    />
  )
}
