import { apiClient } from './client'
import type { LoginCredentials, LoginResponse, User } from '../types/auth'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const tokenResponse = await apiClient.postForm<{ access_token: string; refresh_token?: string; token_type?: string }>('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    })

    const user = await apiClient.get<User>('/users/me')

    return {
      access_token: tokenResponse.access_token,
      token_type: tokenResponse.token_type ?? 'bearer',
      user,
    }
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  me: (): Promise<User> => apiClient.get<User>('/users/me', { noRefresh: true }),
}
