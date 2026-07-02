import { apiClient } from './client'
import type {
  Sanction,
  SanctionCreate,
  SanctionQuickCreate,
  SuspendedAccesoDirecto,
} from '../types/sanction'

export interface PaginatedSanctions {
  items: Sanction[]
  total: number
}

export interface PaginatedSuspended {
  items: SuspendedAccesoDirecto[]
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

  // --- Suspensión rápida y sección de suspendidos (problemáticas 29-31) ---
  quickCreate: (data: SanctionQuickCreate) => apiClient.post<Sanction>('/sanctions/quick', data),

  suspended: (params?: { search?: string }) => {
    const p = new URLSearchParams()
    if (params?.search) p.set('search', params.search)
    const qs = p.toString()
    return apiClient.get<PaginatedSuspended>(`/sanctions/suspended${qs ? `?${qs}` : ''}`)
  },

  /** Levanta la suspensión activa de una persona sin conocer el id de la sanción. */
  lift: (accesoDirectoId: number) => apiClient.put<Sanction>(`/sanctions/acceso_directo/${accesoDirectoId}/lift`),
}
