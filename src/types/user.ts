// RoleName has a single source of truth in ./auth (includes ACCESO_DIRECTO).
import type { RoleName } from './auth'
export type { RoleName }

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
  is_acceso_directo:  boolean
  acceso_directo_id?: number
}

/** Una fila de la importación masiva de usuarios del sistema (CSV). */
export interface UserBulkItem {
  full_name: string
  cedula:    string
  email:     string | null
  career:    string | null
  is_active: boolean
}

/** Resultado por fila devuelto por el backend en la importación masiva de usuarios. */
export interface UserBulkRowResult {
  row:      number
  cedula:   string
  status:   'created' | 'updated' | 'unchanged' | 'error'
  id:       number | null
  error:    string | null
}

/** Respuesta (HTTP 200) de la importación masiva de usuarios (upsert por cédula). */
export interface UserBulkResult {
  total:     number
  created:   number
  updated:   number
  unchanged: number
  failed:    number
  results:   UserBulkRowResult[]
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
