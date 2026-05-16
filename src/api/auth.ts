import { apiClient, tokenStorage } from './client'
import type { LoginCredentials, LoginResponse, User } from '../types/auth'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
    tokenStorage.set(response.access_token)
    return response
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post<void>('/auth/logout')
    } finally {
      tokenStorage.clear()
    }
  },

  me: (): Promise<User> => apiClient.get<User>('/auth/me'),
}
