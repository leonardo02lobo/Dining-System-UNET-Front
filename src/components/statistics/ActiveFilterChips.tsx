import { X } from 'lucide-react'

export interface FilterChip {
  label: string
  /** Si se omite, el chip se muestra como informativo (sin botón de quitar). */
  onRemove?: () => void
}

interface ActiveFilterChipsProps {
  chips: FilterChip[]
}

/** Chips de filtros activos, con acción individual de "quitar" cuando aplica. */
export function ActiveFilterChips({ chips }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 py-1 pl-3 pr-2 text-xs font-semibold text-blue-700"
        >
          {chip.label}
          {chip.onRemove && (
            <button
              type="button"
              onClick={chip.onRemove}
              className="rounded-full p-0.5 text-blue-500 transition hover:bg-blue-100 hover:text-blue-700"
              aria-label={`Quitar filtro ${chip.label}`}
            >
              <X size={12} />
            </button>
          )}
        </span>
      ))}
    </div>
  )
}
