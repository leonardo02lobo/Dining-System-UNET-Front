import { apiClient } from './client'
import type { LoginAuditListResponse } from '../types/audit'

export const auditApi = {
    getLogs: (skip = 0, limit = 50): Promise<LoginAuditListResponse> =>
        apiClient.get<LoginAuditListResponse>(`/auth/audit-logs?skip=${skip}&limit=${limit}`),
}
