import { useMemo } from 'react'
import type { ConsumptionReportItem } from '../../types/report'
import type { CategoryConsumption, SupplyConsumption } from '../../types/consumptionReport'
import { CategoryConsumptionChart } from './CategoryConsumptionChart'
import { SupplyConsumptionChart } from './SupplyConsumptionChart'

const CATEGORY_COLORS = ['#03216a', '#34c759', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9']

interface ReportChartsPanelProps {
  items: ConsumptionReportItem[]
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

export function ReportChartsPanel({ items }: ReportChartsPanelProps) {
  const categoryData = useMemo(() => toCategoryConsumption(items), [items])
  const supplyData = useMemo(() => toSupplyConsumption(items), [items])

  return (
    <section className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
      <CategoryConsumptionChart data={categoryData} />
      <SupplyConsumptionChart data={supplyData} />
    </section>
  )
}
