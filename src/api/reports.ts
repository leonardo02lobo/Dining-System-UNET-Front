import { apiClient } from './client'
import type { ConsumptionReport, SanctionReport, ReportFilters } from '../types/report'

export const reportsApi = {
  consumption: (filters: ReportFilters) =>
    apiClient.get<ConsumptionReport>(`/reports/consumption?from_date=${filters.from_date}&to_date=${filters.to_date}`),

  sanctions: (filters?: ReportFilters) => {
    const qs = filters ? `?from_date=${filters.from_date}&to_date=${filters.to_date}` : ''
    return apiClient.get<SanctionReport>(`/reports/sanctions${qs}`)
  },
}
