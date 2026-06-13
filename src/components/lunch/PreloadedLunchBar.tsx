import { ChevronDown, FolderOpen } from 'lucide-react'
import { useRef, useState } from 'react'
import type { PreloadedLunch } from '../../types/lunch'

interface PreloadedLunchBarProps {
  options: PreloadedLunch[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  onLoad: () => void
}

export function PreloadedLunchBar({
  options,
  selectedId,
  onSelect,
  onLoad,
}: PreloadedLunchBarProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.id === selectedId)
  const formatOptionLabel = (option: PreloadedLunch) =>
    `${option.name} (${option.plate_count} platos)`
  const label = selected ? formatOptionLabel(selected) : 'Seleccionar almuerzo guardado'

  return (
    <div className="rounded-[10px] bg-[rgba(217,217,217,0.8)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <p className="text-xl font-medium text-black lg:w-[220px] lg:flex-shrink-0">
          Almuerzo Precargado
        </p>

        <div ref={ref} className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-full max-w-md items-center justify-between rounded-[5px] border border-black bg-white/90 px-3 text-left text-[15px] text-black/60"
          >
            <span className="truncate">{label}</span>
            <ChevronDown size={22} className={`flex-shrink-0 transition ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
              <ul className="absolute left-0 z-20 mt-1 w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {options.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(opt.id)
                        setOpen(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                        selectedId === opt.id ? 'font-semibold text-[#03216a] bg-blue-50' : 'text-slate-700'
                      }`}
                    >
                      {formatOptionLabel(opt)}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onLoad}
          disabled={selectedId === null}
          className="inline-flex h-10 flex-shrink-0 items-center justify-center gap-2.5 rounded-[10px] bg-[#03216a] px-5 text-[15px] font-bold text-white transition hover:bg-[#021a52] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FolderOpen size={22} />
          Cargar almuerzo
        </button>
      </div>
    </div>
  )
}
