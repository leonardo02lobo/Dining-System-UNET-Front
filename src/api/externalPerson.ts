import { apiClient } from './client'
import type {
  ExternalPerson,
  ExternalPersonCreate,
  ExternalPersonStatus,
  ExternalPersonType,
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
    person_type?: ExternalPersonType
    status?: ExternalPersonStatus
    skip?: number
    limit?: number
  }) => {
    const p = new URLSearchParams()
    if (params?.search) p.set('search', params.search)
    if (params?.person_type) p.set('person_type', params.person_type)
    if (params?.status) p.set('status', params.status)
    p.set('skip', String(params?.skip ?? 0))
    p.set('limit', String(params?.limit ?? 100))
    return apiClient.get<PaginatedExternalPeople>(`${PATH}/?${p.toString()}`)
  },
  get: (id: number) => apiClient.get<ExternalPerson>(`${PATH}/${id}`),
  create: (data: ExternalPersonCreate) => apiClient.post<ExternalPerson>(`${PATH}/`, data),
  update: (id: number, data: ExternalPersonUpdate) =>
    apiClient.put<ExternalPerson>(`${PATH}/${id}`, data),
  remove: (id: number) => apiClient.delete<void>(`${PATH}/${id}`),
}
