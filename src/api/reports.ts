import { apiClient } from './client'
import type {
  ConsumptionReport,
  ConsumptionReportItem,
  SanctionReport,
  ReportFilters,
} from '../types/report'

export interface ConsumptionReportRange {
  fromDate: string
  toDate: string
}

export const reportsApi = {
  consumptionReports: ({ fromDate, toDate }: ConsumptionReportRange) => {
    const params = new URLSearchParams({ from: fromDate, to: toDate })
    return apiClient.get<ConsumptionReportItem[]>(`/consumption-reports/?${params.toString()}`)
  },

  consumption: (filters: ReportFilters) =>
    apiClient.get<ConsumptionReport>(`/reports/consumption?from_date=${filters.from_date}&to_date=${filters.to_date}`),

  sanctions: (filters?: ReportFilters) => {
    const qs = filters ? `?from_date=${filters.from_date}&to_date=${filters.to_date}` : ''
    return apiClient.get<SanctionReport>(`/reports/sanctions${qs}`)
  },
}
