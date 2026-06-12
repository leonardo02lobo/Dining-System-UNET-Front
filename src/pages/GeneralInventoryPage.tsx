import { useCallback, useEffect, useMemo, useState } from 'react'
import { inventoryApi } from '../api/inventory'
import { InventoryFilters } from '../components/inventory/InventoryFilters'
import { InventoryOverviewTable } from '../components/inventory/InventoryOverviewTable'
import { InventorySummaryPanel } from '../components/inventory/InventorySummaryPanel'
import type { Ingredient, InventoryItem, StockAlert } from '../types/inventory'

function formatDate(date: Date) {
  return date.toLocaleDateString('es-VE')
}

function formatApiDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDate(new Date())

  return formatDate(date)
}

function mapInventoryItem(item: InventoryItem): Ingredient {
  return {
    id: item.id,
    name: item.name,
    category: item.category?.name ?? 'Sin categoría',
    unit: item.unit,
    quantity: item.currentStock,
    min_stock: item.minimumStock,
    last_updated: formatApiDate(item.lastUpdatedAt || item.updatedAt || item.createdAt),
    expiration_date: null,
  }
}

function buildAlerts(items: Ingredient[]): StockAlert[] {
  return items
    .filter((item) => item.quantity < item.min_stock)
    .map((item) => ({
      id: item.id,
      item_name: item.name,
      current_stock: item.quantity,
      min_stock: item.min_stock,
      unit: item.unit,
    }))
}

export function GeneralInventoryPage() {
  const [items, setItems] = useState<Ingredient[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsLoadError, setItemsLoadError] = useState('')

  const loadItems = useCallback(async () => {
    setItemsLoading(true)
    setItemsLoadError('')

    try {
      const data = await inventoryApi.listItems()
      setItems(data.map(mapInventoryItem))
    } catch {
      setItemsLoadError('No se pudieron cargar los insumos del servidor.')
    } finally {
      setItemsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))].sort(),
    [items],
  )

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        search === '' || item.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        selectedCategory === null || item.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [items, search, selectedCategory])

  const alerts = useMemo(() => buildAlerts(items), [items])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-black sm:text-4xl">Inventario</h1>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <InventoryFilters
            search={search}
            onSearchChange={setSearch}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {itemsLoadError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {itemsLoadError}
            </div>
          )}

          {itemsLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Cargando insumos...
            </div>
          ) : (
            <InventoryOverviewTable items={filteredItems} />
          )}
        </div>

        <InventorySummaryPanel items={items} alerts={alerts} />
      </div>
    </div>
  )
}
