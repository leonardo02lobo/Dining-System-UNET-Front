import { ArrowRight, Plus, RefreshCw } from 'lucide-react'
import type { RecalculationPreview } from '../../types/lunch'

interface LunchRecalculationPanelProps {
  previousPlates: number
  currentPlates: number
  previews: RecalculationPreview[]
  onAddIngredient: () => void
}

export function LunchRecalculationPanel({
  previousPlates,
  currentPlates,
  previews,
  onAddIngredient,
}: LunchRecalculationPanelProps) {
  const showPreview = previousPlates !== currentPlates && previews.length > 0

  return (
    <aside className="w-full flex-shrink-0 xl:w-[239px]">
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
              Ejemplo de actualización al cambiar la cantidad de platos
            </p>
          </div>
        </div>

        {showPreview ? (
          <div className="mt-4 space-y-3 border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between text-sm font-medium text-black">
              <span>{previousPlates} platos</span>
              <ArrowRight size={20} className="text-slate-600" />
              <span className="text-[#03216a]">{currentPlates} platos</span>
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
          </div>
        ) : (
          <p className="mt-4 text-xs text-slate-500">
            Cambia la cantidad de platos para ver el recálculo de ingredientes.
          </p>
        )}
      </div>
    </aside>
  )
}
