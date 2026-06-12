import type { CategoryConsumption, SupplyConsumption } from '../../types/consumptionReport'
import { CategoryConsumptionChart } from './CategoryConsumptionChart'
import { SupplyConsumptionChart } from './SupplyConsumptionChart'

interface ReportChartsPanelProps {
  categoryData: CategoryConsumption[]
  supplyData: SupplyConsumption[]
}

export function ReportChartsPanel({ categoryData, supplyData }: ReportChartsPanelProps) {
  return (
    <section className="grid w-full min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
      <CategoryConsumptionChart data={categoryData} />
      <SupplyConsumptionChart data={supplyData} />
    </section>
  )
}
