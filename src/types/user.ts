export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'TAQUILLERO'

export interface Role {
  id: number
  name: RoleName
}

export interface UserAccount {
  id: number
  name: string
  email: string
  role_id: number
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface UserCreatePayload {
  name: string
  email: string
  password: string
  role_id: number
}

export interface UserUpdatePayload {
  name?: string
  email?: string
  password?: string
  is_active?: boolean
  role_id?: number
}

/** Estudiante del sistema de comedor */
export interface Student {
  cedula:          string
  name:            string
  email?:          string
  career:          string
  user_type:       string
  is_suspended:    boolean
  avatar_url?:     string
  is_beneficiary:  boolean
  beneficiary_id?: number
}

/** Usuario del sistema (administrador, taquillero, etc.) */
export interface SystemUser {
  id: number
  name: string
  cedula: string
  email: string
  status: 'Activo' | 'Suspendido'
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TAQUILLERO'
  avatar_url?: string
}
