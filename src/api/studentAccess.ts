import { apiClient } from './client'
import type { PaginatedStudentAccess } from '../types/studentAccess'

export interface StudentAccessFilters {
  skip?: number
  limit?: number
  search?: string
  from?: string
  to?: string
}

export const studentAccessApi = {
  list: (filters: StudentAccessFilters = {}): Promise<PaginatedStudentAccess> => {
    const p = new URLSearchParams()
    if (filters.skip !== undefined)  p.set('skip', String(filters.skip))
    if (filters.limit !== undefined) p.set('limit', String(filters.limit))
    if (filters.search) p.set('search', filters.search)
    if (filters.from)   p.set('from', filters.from)
    if (filters.to)     p.set('to', filters.to)
    const qs = p.toString()
    return apiClient.get<PaginatedStudentAccess>(`/consumptions/access${qs ? `?${qs}` : ''}`)
  },
}
