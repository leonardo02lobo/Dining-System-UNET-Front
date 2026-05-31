import { apiClient } from './client'
import type { LoginAuditListResponse } from '../types/audit'

export interface AuditFilters {
  from_date?: string
  to_date?: string
  role?: string
}

export const auditApi = {
  getLogs: (skip = 0, limit = 50, filters: AuditFilters = {}): Promise<LoginAuditListResponse> => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
    if (filters.from_date) params.set('from_date', filters.from_date)
    if (filters.to_date)   params.set('to_date', `${filters.to_date}T23:59:59`)
    if (filters.role)      params.set('role', filters.role)
    return apiClient.get<LoginAuditListResponse>(`/auth/audit-logs?${params}`)
  },
}
