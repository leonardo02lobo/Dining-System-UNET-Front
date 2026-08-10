import { apiClient } from './client'
import type {
  ExternalPerson,
  ExternalPersonCreate,
  ExternalPersonStatus,
  ExternalPersonUpdate,
} from '../types/externalPerson'

export interface PaginatedExternalPeople {
  total: number
  items: ExternalPerson[]
}

const PATH = '/external-people'

export const externalPersonApi = {
  list: (params?: {
    search?: string
    label_id?: number
    status?: ExternalPersonStatus
    skip?: number
    limit?: number
  }) => {
    const p = new URLSearchParams()
    if (params?.search) p.set('search', params.search)
    if (params?.label_id) p.set('label_id', String(params.label_id))
    if (params?.status) p.set('status', params.status)
    p.set('skip', String(params?.skip ?? 0))
    p.set('limit', String(params?.limit ?? 100))
    return apiClient.get<PaginatedExternalPeople>(`${PATH}/?${p.toString()}`)
  },
  get: (id: number) => apiClient.get<ExternalPerson>(`${PATH}/${id}`),
  /**
   * Busca por cédula o carnet desde las pantallas de comedor. El servidor solo
   * devuelve personas activas: quien está de baja responde 404, igual que quien no
   * existe.
   */
  lookup: (q: string) =>
    apiClient.get<ExternalPerson>(`${PATH}/lookup?q=${encodeURIComponent(q)}`),
  create: (data: ExternalPersonCreate) => apiClient.post<ExternalPerson>(`${PATH}/`, data),
  update: (id: number, data: ExternalPersonUpdate) =>
    apiClient.put<ExternalPerson>(`${PATH}/${id}`, data),
  remove: (id: number) => apiClient.delete<void>(`${PATH}/${id}`),
}
