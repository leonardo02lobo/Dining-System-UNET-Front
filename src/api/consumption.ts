import { apiClient } from './client'
import type { Consumption, ConsumptionCreate, ConsumptionCheckResult } from '../types/consumption'

export interface PaginatedConsumptions {
  items: Consumption[]
  total: number
}

export const consumptionApi = {
  register: (data: ConsumptionCreate)    => apiClient.post<Consumption>('/consumptions/', data),
  check:    (beneficiaryId: number)      => apiClient.get<ConsumptionCheckResult>(`/consumptions/check/${beneficiaryId}`),
  list:     (params?: { beneficiary_id?: number; session_id?: number }) => {
    const p = new URLSearchParams()
    if (params?.beneficiary_id) p.set('beneficiary_id', String(params.beneficiary_id))
    if (params?.session_id)     p.set('session_id', String(params.session_id))
    const qs = p.toString()
    return apiClient.get<PaginatedConsumptions>(`/consumptions/${qs ? `?${qs}` : ''}`)
  },
}
