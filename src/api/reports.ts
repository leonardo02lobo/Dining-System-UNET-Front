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
  categoryId?: number
}

function toConsumptionReportParams({ fromDate, toDate, categoryId }: ConsumptionReportRange) {
  const params = new URLSearchParams()
  if (fromDate) params.set('from', fromDate)
  if (toDate) params.set('to', toDate)
  if (categoryId !== undefined) params.set('categoryId', String(categoryId))
  return params
}

export const reportsApi = {
  consumptionReports: (range: ConsumptionReportRange) => {
    const params = toConsumptionReportParams(range)
    return apiClient.get<ConsumptionReportItem[]>(`/consumption-reports/?${params.toString()}`)
  },

  exportConsumptionReportPdf: (range: ConsumptionReportRange) => {
    const params = toConsumptionReportParams(range)
    return apiClient.getBlob(
      `/consumption-reports/export/pdf?${params.toString()}`,
      'application/pdf',
    )
  },

  exportConsumptionReportCsv: (range: ConsumptionReportRange) => {
    const params = toConsumptionReportParams(range)
    return apiClient.getBlob(
      `/consumption-reports/export/csv?${params.toString()}`,
      'text/csv',
    )
  },

  consumption: (filters: ReportFilters) =>
    apiClient.get<ConsumptionReport>(`/reports/consumption?from_date=${filters.from_date}&to_date=${filters.to_date}`),

  sanctions: (filters?: ReportFilters) => {
    const qs = filters ? `?from_date=${filters.from_date}&to_date=${filters.to_date}` : ''
    return apiClient.get<SanctionReport>(`/reports/sanctions${qs}`)
  },
}
