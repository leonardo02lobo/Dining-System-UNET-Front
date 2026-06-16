import type { Ingredient } from '../../types/inventory'
import { Table, type ColumnDef } from '../ui/Table'
import { InventoryRowActions } from './InventoryRowActions'

interface InventoryTableProps {
  items: Ingredient[]
  onIncrease: (item: Ingredient) => void
  onDecrease: (item: Ingredient) => void
  onEdit: (item: Ingredient) => void
  onDelete: (item: Ingredient) => void
  onRowClick?: (item: Ingredient) => void
}

const columns: ColumnDef<Ingredient>[] = [
  { key: 'name', header: 'Insumo', sortable: true },
  { key: 'category', header: 'Categoría', sortable: true },
  {
    key: 'quantity',
    header: 'Stock actual',
    sortable: true,
    render: (_, item) => `${item.quantity} ${item.unit}`,
  },
  { key: 'unit', header: 'Unidad', sortable: true },
  { key: 'min_stock', header: 'Stock mínimo', sortable: true },
  { key: 'last_updated', header: 'Última actualización', sortable: true },
]

export function InventoryTable({
  items,
  onIncrease,
  onDecrease,
  onEdit,
  onDelete,
  onRowClick,
}: InventoryTableProps) {
  return (
    <Table<Ingredient>
      columns={columns}
      rows={items}
      keyField="id"
      emptyMessage="No hay insumos que coincidan con los filtros."
      onRowClick={onRowClick}
      actions={(item) => (
        <InventoryRowActions
          item={item}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    />
  )
}
