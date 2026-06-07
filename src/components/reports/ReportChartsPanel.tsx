import type { CategoryConsumption, SupplyConsumption } from '../../types/consumptionReport'
import { CategoryConsumptionChart } from './CategoryConsumptionChart'
import { SupplyConsumptionChart } from './SupplyConsumptionChart'

interface ReportChartsPanelProps {
  categoryData: CategoryConsumption[]
  supplyData: SupplyConsumption[]
}

export function ReportChartsPanel({ categoryData, supplyData }: ReportChartsPanelProps) {
  return (
    <aside className="w-full flex-shrink-0 space-y-4 xl:w-[267px]">
      <CategoryConsumptionChart data={categoryData} />
      <SupplyConsumptionChart data={supplyData} />
    </aside>
  )
}
