import { RefreshCw } from 'lucide-react'
import type { RecalculationPreview } from '../../types/lunch'
import { Table, type ColumnDef } from '../ui/Table'

interface LunchRecalculationTableProps {
  basePlates: number
  desiredPlates: number
  previews: RecalculationPreview[]
}

/**
 * Recálculo automático presentado como tabla (issue #9), reutilizando el mismo
 * primitivo `ui/Table` que `LunchIngredientsTable` para que ambas se vean iguales.
 * El recálculo es automático: la columna "Nuevo" se recalcula en vivo cada vez que
 * cambia la cantidad deseada (input ahora en `LunchDetailsForm`), sin botón de aplicar.
 */
export function LunchRecalculationTable({
  basePlates,
  desiredPlates,
  previews,
}: LunchRecalculationTableProps) {
  const columns: ColumnDef<RecalculationPreview>[] = [
    { key: 'ingredient_name', header: 'Ingrediente', sortable: true },
    {
      key: 'previous_quantity',
      header: `Base · ${basePlates} platos`,
      sortable: true,
      render: (_, row) => `${row.previous_quantity} ${row.unit}`,
    },
    {
      key: 'new_quantity',
      header: `Nuevo · ${desiredPlates} platos`,
      sortable: true,
      render: (_, row) => (
        <span
          className={
            row.new_quantity !== row.previous_quantity
              ? 'font-semibold text-blue-700'
              : 'text-slate-500'
          }
        >
          {row.new_quantity} {row.unit}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <RefreshCw size={20} className="flex-shrink-0 text-slate-700" />
        <h2 className="text-[15px] font-bold text-black">Recálculo automático</h2>
      </div>

      <Table<RecalculationPreview>
        columns={columns}
        rows={previews}
        keyField="ingredient_name"
        emptyMessage="Agrega ingredientes para ver el recálculo."
      />
    </div>
  )
}
