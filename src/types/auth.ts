export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'TAQUILLERO' | 'ACCESO_DIRECTO'

export interface LoginCredentials {
  username: string
  password: string
}

export interface User {
  id: number
  name: string
  email: string
  role_id: number
  role: { id: number; name: RoleName }
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ApiError {
  message: string
  status: number
  details?: Record<string, string[]>
}
