import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { inventoryApi } from '../api/inventory'
import { InventoryFilters } from '../components/inventory/InventoryFilters'
import { InventoryOverviewTable } from '../components/inventory/InventoryOverviewTable'
import { InventorySummaryPanel } from '../components/inventory/InventorySummaryPanel'
import { Button } from '../components/ui/Button'
import { downloadBlob } from '../utils/downloadBlob'
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
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

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

  const handleDownloadPdf = useCallback(async () => {
    if (exporting) return

    setExporting(true)
    setExportError('')

    try {
      const pdf = await inventoryApi.exportInventoryPdf()
      downloadBlob(pdf, 'inventario-general.pdf')
    } catch {
      setExportError('No se pudo generar el PDF del inventario. Intenta de nuevo.')
    } finally {
      setExporting(false)
    }
  }, [exporting])

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-black sm:text-3xl">Inventario</h1>
        <Button
          variant="secondary"
          leftIcon={<Download className="h-4 w-4" />}
          loading={exporting}
          onClick={handleDownloadPdf}
        >
          Descargar PDF
        </Button>
      </div>

      {exportError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {exportError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[7fr_3fr] xl:items-start">
        <div className="min-w-0 space-y-4">
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
