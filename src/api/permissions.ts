import { apiClient } from './client'

export interface Permission {
  route: string
  label: string
  enabled: boolean
}

export const permissionsApi = {
  getByUser: (_userId: number, _userRoleName: string): Promise<Permission[]> =>
    apiClient.get<Permission[]>(`/users/${_userId}/permissions`),

  update: (userId: number, perms: Permission[]): Promise<Permission[]> =>
    apiClient.put<Permission[]>(`/users/${userId}/permissions`, { permissions: perms }),
}
