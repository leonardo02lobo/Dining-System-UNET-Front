import { apiClient } from './client'
import type { AccessReason, AccessReasonCreate } from '../types/acceso_directo'

export const accessReasonApi = {
  list:   ()                                        => apiClient.get<AccessReason[]>('/access-reasons/'),
  create: (data: AccessReasonCreate)                => apiClient.post<AccessReason>('/access-reasons/', data),
  update: (id: number, data: Partial<AccessReasonCreate>) => apiClient.put<AccessReason>(`/access-reasons/${id}`, data),
  remove: (id: number)                              => apiClient.delete<void>(`/access-reasons/${id}`),
}
