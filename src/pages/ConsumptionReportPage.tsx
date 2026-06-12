import { useMemo, useState } from 'react'
import { ConsumptionReportTable } from '../components/reports/ConsumptionReportTable'
import { ReportChartsPanel } from '../components/reports/ReportChartsPanel'
import { ReportDateRangeFilters } from '../components/reports/ReportDateRangeFilters'
import { reportsApi } from '../api/reports'
import type { ConsumptionReportItem } from '../types/report'
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
    period: `${formatDisplayDate(item.period.fromDate)} - ${formatDisplayDate(item.period.toDate)}`,
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
  const [items, setItems] = useState<ConsumptionReportItem[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!dateFrom || !dateTo) {
      notify.info('Selecciona la fecha inicial y final.')
      return
    }
    if (dateFrom > dateTo) {
      notify.info('La fecha inicial no puede ser mayor que la final.')
      return
    }

    setLoading(true)
    try {
      const data = await reportsApi.consumptionReports({ fromDate: dateFrom, toDate: dateTo })
      setItems(data)
      notify.success(`Reporte generado con ${data.length} insumo(s).`)
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!items || items.length === 0) {
      notify.info('Genera el reporte primero.')
      return
    }
    notify.success('Descarga simulada — conexión al backend pendiente.')
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
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
        loading={loading}
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
