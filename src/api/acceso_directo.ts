import { apiClient } from './client'
import type {
  AccesoDirecto,
  AccesoDirectoCreate,
  AccesoDirectoUpdate,
  AccesoDirectoFilters,
  AccesoDirectoVerifyResult,
  PaginatedAccesosDirectos,
} from '../types/acceso_directo'

function buildParams(filters?: AccesoDirectoFilters): string {
  if (!filters) return ''
  const p = new URLSearchParams()
  if (filters.skip !== undefined)  p.set('skip', String(filters.skip))
  if (filters.limit !== undefined) p.set('limit', String(filters.limit))
  if (filters.search)    p.set('search', filters.search)
  if (filters.status)    p.set('status', filters.status)
  if (filters.user_type) p.set('user_type', filters.user_type)
  const str = p.toString()
  return str ? `?${str}` : ''
}

export const accesoDirectoApi = {
  list:   (filters?: AccesoDirectoFilters)               => apiClient.get<PaginatedAccesosDirectos>(`/accesos_directos/${buildParams(filters)}`),
  get:    (id: number)                                    => apiClient.get<AccesoDirecto>(`/accesos_directos/${id}`),
  create: (data: AccesoDirectoCreate)                     => apiClient.post<AccesoDirecto>('/accesos_directos/', data),
  update: (id: number, data: AccesoDirectoUpdate)         => apiClient.put<AccesoDirecto>(`/accesos_directos/${id}`, data),
  remove: (id: number)                                    => apiClient.delete<void>(`/accesos_directos/${id}`),
  lookup: (q: string)                                     => apiClient.get<AccesoDirecto>(`/accesos_directos/lookup?q=${encodeURIComponent(q)}`),
  verify: (document_id: string)                           => apiClient.get<AccesoDirectoVerifyResult>(`/accesos_directos/verify/${encodeURIComponent(document_id)}`),
}
