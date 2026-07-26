import { RefreshCw } from 'lucide-react'
import type { RecalculationPreview } from '../../types/lunch'
import { formatQuantity } from '../../utils/lunchRecalculation'
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
 *
 * Las tres columnas de cantidad dejan explícita la trazabilidad exigida por la
 * regla de tres: cantidad original → cantidad para los platos base actuales →
 * cantidad recalculada para los platos deseados.
 */
export function LunchRecalculationTable({
  basePlates,
  desiredPlates,
  previews,
}: LunchRecalculationTableProps) {
  const columns: ColumnDef<RecalculationPreview>[] = [
    { key: 'ingredient_name', header: 'Ingrediente', sortable: true },
    {
      key: 'base_quantity',
      header: 'Original',
      sortable: true,
      render: (_, row) => (
        <span className="text-slate-600">
          {formatQuantity(row.base_quantity, row.unit)}
          <span className="ml-1 text-xs text-slate-400">· {row.base_plates} platos</span>
        </span>
      ),
    },
    {
      key: 'previous_quantity',
      header: `Base · ${basePlates} platos`,
      sortable: true,
      render: (_, row) => formatQuantity(row.previous_quantity, row.unit),
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
          {formatQuantity(row.new_quantity, row.unit)}
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

      <p className="text-xs text-slate-500">
        Cantidad nueva = cantidad original × platos deseados ÷ platos base.
      </p>

      <Table<RecalculationPreview>
        columns={columns}
        rows={previews}
        keyField="ingredient_id"
        emptyMessage="Agrega ingredientes para ver el recálculo."
      />
    </div>
  )
}
