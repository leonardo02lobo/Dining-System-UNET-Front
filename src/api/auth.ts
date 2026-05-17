import { apiClient, tokenStorage } from './client'
import type { LoginCredentials, LoginResponse, User } from '../types/auth'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // OAuth2PasswordRequestForm expects form-urlencoded fields: username, password
    const tokenResponse = await apiClient.postForm<{ access_token: string; refresh_token?: string; token_type?: string }>('/auth/login', {
      username: credentials.username,
      password: credentials.password,
    })

    tokenStorage.set(tokenResponse.access_token)

    // Fetch user profile from backend
    const user = await apiClient.get<User>('/users/me')

    return {
      access_token: tokenResponse.access_token,
      token_type: tokenResponse.token_type ?? 'bearer',
      user,
    }
  },

  logout: async (): Promise<void> => {
    // Backend does not provide logout by default; clear local tokens
    tokenStorage.clear()
  },

  me: (): Promise<User> => apiClient.get<User>('/users/me'),
}
