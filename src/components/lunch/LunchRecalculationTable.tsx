import { ArrowRight, RefreshCw } from 'lucide-react'
import type { RecalculationPreview } from '../../types/lunch'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Table, type ColumnDef } from '../ui/Table'

interface LunchRecalculationTableProps {
  basePlates: number
  desiredPlates: number
  previews: RecalculationPreview[]
  onDesiredPlatesChange: (value: number) => void
  onApplyRecalculation: () => void
}

/**
 * Recálculo automático presentado como tabla (issue #9), reutilizando el mismo
 * primitivo `ui/Table` que `LunchIngredientsTable` para que ambas se vean iguales.
 * Mantiene su propósito: comparar cantidades base vs. recalculadas.
 */
export function LunchRecalculationTable({
  basePlates,
  desiredPlates,
  previews,
  onDesiredPlatesChange,
  onApplyRecalculation,
}: LunchRecalculationTableProps) {
  const platesChanged = desiredPlates !== basePlates

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

      {/* Platos: inicial vs deseada */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div>
          <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">
            Inicial
          </span>
          <span className="flex h-9 items-center justify-center rounded-md border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900">
            {basePlates}
          </span>
        </div>
        <ArrowRight size={18} className="mb-2 text-slate-500" />
        <div>
          <label
            className="mb-1 block text-[10px] font-semibold uppercase text-slate-500"
            htmlFor="desired-plate-count"
          >
            Deseada
          </label>
          <Input
            id="desired-plate-count"
            type="number"
            min={1}
            value={desiredPlates}
            onChange={(event) =>
              onDesiredPlatesChange(Math.max(1, Number(event.target.value) || 1))
            }
            className="h-9 text-center font-semibold text-blue-700"
          />
        </div>
      </div>

      <Table<RecalculationPreview>
        columns={columns}
        rows={previews}
        keyField="ingredient_name"
        emptyMessage="Agrega ingredientes para ver el recálculo."
      />

      <Button
        type="button"
        onClick={onApplyRecalculation}
        disabled={!platesChanged || previews.length === 0}
        fullWidth
        leftIcon={<RefreshCw size={16} />}
      >
        Aplicar recálculo
      </Button>
    </div>
  )
}
