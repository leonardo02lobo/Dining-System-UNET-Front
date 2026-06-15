import { apiClient } from './client'
import type { Sede, SedeCreate, SedeUpdate, PaginatedSedes } from '../types/sede'

export const sedesApi = {
  list:       (skip = 0, limit = 100)       => apiClient.get<PaginatedSedes>(`/sedes/?skip=${skip}&limit=${limit}`),
  get:        (id: number)                   => apiClient.get<Sede>(`/sedes/${id}`),
  create:     (data: SedeCreate)             => apiClient.post<Sede>('/sedes/', data),
  update:     (id: number, data: SedeUpdate) => apiClient.put<Sede>(`/sedes/${id}`, data),
  deactivate: (id: number)                   => apiClient.delete<void>(`/sedes/${id}`),
}
