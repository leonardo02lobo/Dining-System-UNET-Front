import type { Ingredient } from '../../types/inventory'
import { Table, type ColumnDef } from '../ui/Table'

interface InventoryOverviewTableProps {
  items: Ingredient[]
}

const columns: ColumnDef<Ingredient>[] = [
  { key: 'name', header: 'Insumo', sortable: true },
  { key: 'category', header: 'Categoría', sortable: true },
  { key: 'quantity', header: 'Stock actual', sortable: true },
  { key: 'unit', header: 'Unidad', sortable: true },
  { key: 'min_stock', header: 'Stock mínimo', sortable: true },
]

export function InventoryOverviewTable({ items }: InventoryOverviewTableProps) {
  return (
    <Table<Ingredient>
      columns={columns}
      rows={items}
      keyField="id"
      emptyMessage="No hay insumos que coincidan con los filtros."
    />
  )
}
