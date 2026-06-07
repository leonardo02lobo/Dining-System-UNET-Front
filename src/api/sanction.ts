import { apiClient } from './client'
import type { Sanction, SanctionCreate } from '../types/sanction'

export interface PaginatedSanctions {
  items: Sanction[]
  total: number
}

export const sanctionApi = {
  create:  (data: SanctionCreate)    => apiClient.post<Sanction>('/sanctions/', data),
  revoke:  (id: number)              => apiClient.put<Sanction>(`/sanctions/${id}/revoke`),
  history: (beneficiaryId: number)   => apiClient.get<PaginatedSanctions>(`/sanctions/beneficiary/${beneficiaryId}`),
  list:    (params?: { status?: string; beneficiary_id?: number }) => {
    const p = new URLSearchParams()
    if (params?.status)         p.set('status', params.status)
    if (params?.beneficiary_id) p.set('beneficiary_id', String(params.beneficiary_id))
    const qs = p.toString()
    return apiClient.get<PaginatedSanctions>(`/sanctions/${qs ? `?${qs}` : ''}`)
  },
}
