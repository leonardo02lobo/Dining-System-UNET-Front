import { ChevronDown, Filter } from 'lucide-react'
import { useRef, useState } from 'react'
import { SearchInput } from '../ui/SearchInput'

interface InventoryFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  categories: string[]
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export function InventoryFilters({
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
}: InventoryFiltersProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  function handleCategorySelect(category: string) {
    onCategoryChange(selectedCategory === category ? null : category)
    setFilterOpen(false)
  }

  const filterLabel = selectedCategory ?? 'Filtrar por categoría'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <SearchInput
        placeholder="Buscar insumo..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        fullWidth
        className="h-[45px] rounded-[5px] border-black sm:max-w-[392px]"
      />

      <div ref={filterRef} className="relative sm:ml-auto">
        <button
          type="button"
          onClick={() => setFilterOpen((open) => !open)}
          className="inline-flex h-[45px] w-full min-w-[200px] items-center justify-center gap-2.5 rounded-[10px] bg-[#03216a] px-4 text-[15px] font-bold text-white transition hover:bg-[#021a52] sm:w-[240px]"
        >
          <Filter size={22} />
          <span className="truncate">{filterLabel}</span>
          <ChevronDown size={22} className={`transition ${filterOpen ? 'rotate-180' : ''}`} />
        </button>

        {filterOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setFilterOpen(false)}
              aria-hidden="true"
            />
            <ul className="absolute right-0 z-20 mt-1 w-full min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg sm:w-[240px]">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onCategoryChange(null)
                    setFilterOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  Todas las categorías
                </button>
              </li>
              {categories.map((category) => (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(category)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                      selectedCategory === category
                        ? 'bg-blue-50 font-semibold text-[#03216a]'
                        : 'text-slate-600'
                    }`}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
