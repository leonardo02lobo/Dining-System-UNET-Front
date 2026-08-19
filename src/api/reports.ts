import { apiClient } from './client'
import type {
  ConsumptionReport,
  ConsumptionReportItem,
  SanctionReport,
  ReportFilters,
} from '../types/report'

/**
 * Sobre qué fecha se recorta el periodo del reporte de consumo (DEC-03).
 *
 * `movement` es cuándo se descontó el insumo; `service` es para qué día era.
 * Confirmar hoy el menú del viernes las separa, y ninguna de las dos es «la»
 * verdad por sí sola: la primera cuadra con el saldo actual de la despensa, la
 * segunda dice cuánto se cocinó cada día.
 */
export type ConsumptionDateBasis = 'movement' | 'service'

export interface ConsumptionReportRange {
  fromDate: string
  toDate: string
  categoryId?: number
  dateBasis?: ConsumptionDateBasis
}

function toConsumptionReportParams({
  fromDate,
  toDate,
  categoryId,
  dateBasis,
}: ConsumptionReportRange) {
  const params = new URLSearchParams()
  if (fromDate) params.set('from', fromDate)
  if (toDate) params.set('to', toDate)
  if (categoryId !== undefined) params.set('categoryId', String(categoryId))
  if (dateBasis) params.set('dateBasis', dateBasis)
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
