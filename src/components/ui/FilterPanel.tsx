import { ChevronDown, ChevronRight, SlidersHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'

interface FilterPanelProps {
  title?: string
  open?: boolean
  onToggle?: () => void
  children: ReactNode
  className?: string
}

export function FilterPanel({
  title = 'Filtrar por categoría',
  open = true,
  onToggle,
  children,
  className = '',
}: FilterPanelProps) {
  return (
    <aside
      className={`rounded-xl border border-slate-200 bg-slate-50 ${className}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-slate-400" />
          {title}
        </span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      {open && (
        <div className="border-t border-slate-200 px-4 py-3">
          {children}
        </div>
      )}
    </aside>
  )
}
