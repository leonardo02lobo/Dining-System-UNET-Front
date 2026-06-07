import { apiClient } from './client'
import type {
  Beneficiary,
  BeneficiaryCreate,
  BeneficiaryUpdate,
  BeneficiaryFilters,
  PaginatedBeneficiaries,
} from '../types/beneficiary'

function buildParams(filters?: BeneficiaryFilters): string {
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

export const beneficiaryApi = {
  list:   (filters?: BeneficiaryFilters)            => apiClient.get<PaginatedBeneficiaries>(`/beneficiaries/${buildParams(filters)}`),
  get:    (id: number)                               => apiClient.get<Beneficiary>(`/beneficiaries/${id}`),
  create: (data: BeneficiaryCreate)                  => apiClient.post<Beneficiary>('/beneficiaries/', data),
  update: (id: number, data: BeneficiaryUpdate)      => apiClient.put<Beneficiary>(`/beneficiaries/${id}`, data),
  remove: (id: number)                               => apiClient.delete<void>(`/beneficiaries/${id}`),
  /** Lookup por cédula o carnet — devuelve el mismo shape que Beneficiary */
  lookup: (q: string)                                => apiClient.get<Beneficiary>(`/beneficiaries/lookup?q=${encodeURIComponent(q)}`),
}
