import { apiClient } from './client'
import type {
  UserAccount, UserCreatePayload, UserUpdatePayload, Role,
  UserBulkItem, UserBulkResult,
} from '../types/user'

export const userApi = {
  list:   ()                                       => apiClient.get<UserAccount[]>('/users/'),
  create: (data: UserCreatePayload)                => apiClient.post<UserAccount>('/users/', data),
  update: (id: number, data: UserUpdatePayload)    => apiClient.put<UserAccount>(`/users/${id}`, data),
  remove: (id: number)                             => apiClient.delete<void>(`/users/${id}`),
  bulkCreate: (items: UserBulkItem[])              => apiClient.post<UserBulkResult>('/users/bulk', { items }),
}

export const roleApi = {
  list: () => apiClient.get<Role[]>('/roles/'),
}
