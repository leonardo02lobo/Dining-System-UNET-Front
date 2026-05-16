export interface LoginCredentials {
  username: string
  password: string
}

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: 'student' | 'staff' | 'admin'
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
