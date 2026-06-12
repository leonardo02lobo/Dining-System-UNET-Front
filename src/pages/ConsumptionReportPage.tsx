import { useEffect, useMemo, useState } from 'react'
import { ConsumptionReportTable } from '../components/reports/ConsumptionReportTable'
import { ReportChartsPanel } from '../components/reports/ReportChartsPanel'
import { ReportDateRangeFilters } from '../components/reports/ReportDateRangeFilters'
import { reportsApi } from '../api/reports'
import { inventoryApi } from '../api/inventory'
import type { ConsumptionReportItem } from '../types/report'
import type { InventoryCategory } from '../types/inventory'
import type {
  CategoryConsumption,
  ConsumptionReportRow,
  SupplyConsumption,
} from '../types/consumptionReport'
import { notify } from '../utils/toast'

const CATEGORY_COLORS = ['#03216a', '#34c759', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9']

function toIsoDate(daysAgo = 0) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value || 'Sin fecha'

  return date.toLocaleDateString('es-VE')
}

function toReportRow(item: ConsumptionReportItem, index: number): ConsumptionReportRow {
  return {
    id: item.itemId || index,
    supply_name: item.itemName,
    category: item.categoryName,
    consumed_amount: item.quantityConsumed,
    unit: item.unit,
    date_from: formatDisplayDate(item.period.fromDate),
    date_to: formatDisplayDate(item.period.toDate),
  }
}

function toCategoryConsumption(items: ConsumptionReportItem[]): CategoryConsumption[] {
  const totals = new Map<string, number>()
  items.forEach((item) => {
    totals.set(item.categoryName, (totals.get(item.categoryName) ?? 0) + item.quantityConsumed)
  })

  return Array.from(totals.entries()).map(([category, total], index) => ({
    category,
    total,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }))
}

function toSupplyConsumption(items: ConsumptionReportItem[]): SupplyConsumption[] {
  return items.map((item) => ({
    supply_name: item.itemName,
    total: item.quantityConsumed,
    unit: item.unit,
  }))
}

export function ConsumptionReportPage() {
  const [dateFrom, setDateFrom] = useState(toIsoDate(80))
  const [dateTo, setDateTo] = useState(toIsoDate(0))
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [items, setItems] = useState<ConsumptionReportItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingCsv, setDownloadingCsv] = useState(false)

  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true)
      try {
        setCategories(await inventoryApi.listCategories())
      } catch (err) {
        notify.error(err)
      } finally {
        setLoadingCategories(false)
      }
    }

    void loadCategories()
  }, [])

  function hasValidDateRange() {
    if (!dateFrom || !dateTo) {
      notify.info('Selecciona la fecha inicial y final.')
      return false
    }
    if (dateFrom > dateTo) {
      notify.info('La fecha inicial no puede ser mayor que la final.')
      return false
    }

    return true
  }

  async function handleGenerate() {
    if (!hasValidDateRange()) return

    setLoading(true)
    try {
      const data = await reportsApi.consumptionReports({
        fromDate: dateFrom,
        toDate: dateTo,
        categoryId: categoryId ? Number(categoryId) : undefined,
      })
      setItems(data)
      notify.success(`Reporte generado con ${data.length} insumo(s).`)
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  }

  function downloadBlob(file: Blob, filename: string) {
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function handleDownloadPdf() {
    if (!hasValidDateRange()) return

    setDownloadingPdf(true)
    try {
      const pdf = await reportsApi.exportConsumptionReportPdf({
        fromDate: dateFrom,
        toDate: dateTo,
        categoryId: categoryId ? Number(categoryId) : undefined,
      })
      const categorySuffix = categoryId ? `-categoria-${categoryId}` : ''
      downloadBlob(pdf, `reporte-consumo-${dateFrom}-${dateTo}${categorySuffix}.pdf`)
      notify.success('Reporte PDF descargado correctamente.')
    } catch (err) {
      notify.error(err)
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handleDownloadCsv() {
    if (!hasValidDateRange()) return

    setDownloadingCsv(true)
    try {
      const csv = await reportsApi.exportConsumptionReportCsv({
        fromDate: dateFrom,
        toDate: dateTo,
        categoryId: categoryId ? Number(categoryId) : undefined,
      })
      const categorySuffix = categoryId ? `-categoria-${categoryId}` : ''
      downloadBlob(csv, `reporte-consumo-${dateFrom}-${dateTo}${categorySuffix}.csv`)
      notify.success('Reporte CSV descargado correctamente.')
    } catch (err) {
      notify.error(err)
    } finally {
      setDownloadingCsv(false)
    }
  }

  const rows = useMemo(() => (items ?? []).map(toReportRow), [items])
  const categoryData = useMemo(() => toCategoryConsumption(items ?? []), [items])
  const supplyData = useMemo(() => toSupplyConsumption(items ?? []), [items])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-black sm:text-4xl">Reportes de consumo</h1>

      <ReportDateRangeFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        categoryId={categoryId}
        categories={categories}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onCategoryChange={setCategoryId}
        onGenerate={handleGenerate}
        onDownloadPdf={handleDownloadPdf}
        onDownloadCsv={handleDownloadCsv}
        loading={loading}
        downloadingPdf={downloadingPdf}
        downloadingCsv={downloadingCsv}
        loadingCategories={loadingCategories}
      />

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          {items !== null ? (
            <ConsumptionReportTable rows={rows} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Selecciona un rango de fechas y presiona <strong>Generar Reporte</strong>.
            </div>
          )}
        </div>

        {items !== null && rows.length > 0 && (
          <ReportChartsPanel categoryData={categoryData} supplyData={supplyData} />
        )}
      </div>
    </div>
  )
}
