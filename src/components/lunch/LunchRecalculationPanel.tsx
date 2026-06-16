import { ArrowRight, Plus, RefreshCw } from 'lucide-react'
import type { RecalculationPreview } from '../../types/lunch'

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

  return (
    <aside className="w-full xl:w-80 xl:flex-shrink-0 xl:sticky xl:top-6">
      <button
        type="button"
        onClick={onAddIngredient}
        className="mb-4 flex h-[45px] w-full items-center justify-center gap-2.5 rounded-[10px] bg-[#03216a] text-[15px] font-bold text-white transition hover:bg-[#021a52]"
      >
        <Plus size={22} />
        Agregar ingrediente
      </button>

      <div className="rounded-[10px] bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-start gap-2">
          <RefreshCw size={28} className="mt-0.5 flex-shrink-0 text-slate-700" />
          <div>
            <h2 className="text-[15px] font-bold text-black">Recalculado automático</h2>
            <p className="mt-1 text-[10px] leading-snug text-black">
              Regla de 3 sobre los ingredientes seleccionados
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2 border-t border-slate-200 pt-3">
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
            <input
              id="desired-plate-count"
              type="number"
              min={1}
              value={desiredPlates}
              onChange={(event) => onDesiredPlatesChange(Math.max(1, Number(event.target.value) || 1))}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-center text-sm font-semibold text-[#03216a] outline-none focus:border-[#03216a] focus:ring-2 focus:ring-[#03216a]/15"
            />
          </div>
        </div>

        {showPreview ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm font-medium text-black">
              <span>{basePlates} platos</span>
              <ArrowRight size={20} className="text-slate-600" />
              <span className="text-[#03216a]">{desiredPlates} platos</span>
            </div>

            {previews.map((row) => (
              <div
                key={row.ingredient_name}
                className="border-b border-slate-200 pb-3 last:border-0"
              >
                <div className="flex items-center justify-between gap-1 text-sm font-medium">
                  <span className="truncate text-black">{row.ingredient_name}</span>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    <span>
                      {row.previous_quantity}
                      {row.unit}
                    </span>
                    <ArrowRight size={16} className="text-slate-500" />
                    <span className="text-[#03216a]">
                      {row.new_quantity}
                      {row.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={onApplyRecalculation}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-[#03216a] text-sm font-bold text-white transition hover:bg-[#021a52]"
            >
              <Plus size={18} />
              Agregar
            </button>
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
