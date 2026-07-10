import { ArrowRight, Plus, RefreshCw } from 'lucide-react'
import type { RecalculationPreview } from '../../types/lunch'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface LunchRecalculationPanelProps {
  basePlates: number
  desiredPlates: number
  previews: RecalculationPreview[]
  onAddIngredient: () => void
  onDesiredPlatesChange: (value: number) => void
  onApplyRecalculation: () => void
}

export function LunchRecalculationPanel({
  basePlates,
  desiredPlates,
  previews,
  onAddIngredient,
  onDesiredPlatesChange,
  onApplyRecalculation,
}: LunchRecalculationPanelProps) {
  const showPreview = previews.length > 0
  const platesChanged = desiredPlates !== basePlates

  return (
    <aside className="w-full xl:w-80 xl:flex-shrink-0 xl:sticky xl:top-6">
      <Button
        type="button"
        onClick={onAddIngredient}
        fullWidth
        leftIcon={<Plus size={22} />}
        className="mb-4"
      >
        Agregar ingrediente
      </Button>

      <div className="rounded-[10px] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <RefreshCw size={20} className="flex-shrink-0 text-slate-700" />
          <h2 className="text-[15px] font-bold text-black">Recálculo de platos</h2>
        </div>

        {/* Selección de platos: inicial vs deseada */}
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2 border-t border-slate-200 pt-3">
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
            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500" htmlFor="desired-plate-count">
              Deseada
            </label>
            <Input
              id="desired-plate-count"
              type="number"
              min={1}
              value={desiredPlates}
              onChange={(event) => onDesiredPlatesChange(Math.max(1, Number(event.target.value) || 1))}
              className="h-9 text-center font-semibold text-blue-700"
            />
          </div>
        </div>

        {showPreview ? (
          <div className="mt-4">
            {/* Comparativo de dos columnas: base a la izquierda, recálculo a la derecha */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-x-3 border-b border-slate-200 pb-1.5 text-[10px] font-semibold uppercase tracking-wide">
              <span className="text-slate-500">Ingrediente</span>
              <span className="text-right text-slate-500">Base · {basePlates}</span>
              <span className="text-right text-blue-700">Nuevo · {desiredPlates}</span>
            </div>

            {/* Lista compacta con scroll para no ocupar demasiado alto */}
            <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {previews.map((row) => {
                const changed = row.new_quantity !== row.previous_quantity
                return (
                  <div
                    key={row.ingredient_name}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 py-1.5 text-[13px]"
                  >
                    <span className="truncate text-slate-800" title={row.ingredient_name}>
                      {row.ingredient_name}
                    </span>
                    <span className="text-right tabular-nums text-slate-500">
                      {row.previous_quantity}{row.unit}
                    </span>
                    <span
                      className={`text-right font-semibold tabular-nums ${
                        changed ? 'text-blue-700' : 'text-slate-400'
                      }`}
                    >
                      {row.new_quantity}{row.unit}
                    </span>
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              onClick={onApplyRecalculation}
              disabled={!platesChanged}
              fullWidth
              leftIcon={<RefreshCw size={16} />}
              className="mt-3"
            >
              Aplicar recálculo
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500">
            Agrega ingredientes para ver el recálculo.
          </p>
        )}
      </div>
    </aside>
  )
}
