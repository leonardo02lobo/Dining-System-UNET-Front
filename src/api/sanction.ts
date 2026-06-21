import { apiClient } from './client'
import type { Sanction, SanctionCreate } from '../types/sanction'

export interface PaginatedSanctions {
  items: Sanction[]
  total: number
}

export const sanctionApi = {
  create:  (data: SanctionCreate)    => apiClient.post<Sanction>('/sanctions/', data),
  revoke:  (id: number)              => apiClient.put<Sanction>(`/sanctions/${id}/revoke`),
  history: (accesoDirectoId: number) => apiClient.get<PaginatedSanctions>(`/sanctions/acceso_directo/${accesoDirectoId}`),
  list:    (params?: { status?: string; acceso_directo_id?: number }) => {
    const p = new URLSearchParams()
    if (params?.status)              p.set('status', params.status)
    if (params?.acceso_directo_id)   p.set('acceso_directo_id', String(params.acceso_directo_id))
    const qs = p.toString()
    return apiClient.get<PaginatedSanctions>(`/sanctions/${qs ? `?${qs}` : ''}`)
  },
}
