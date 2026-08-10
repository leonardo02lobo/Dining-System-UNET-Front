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

/**
 * De dónde salió la persona que hay en pantalla.
 *
 * Viaja explícito y no se deduce de qué campos vinieron vacíos: "es externa" =
 * `!is_acceso_directo && !career` funciona hasta que alguien registra a una persona
 * externa con carrera, y la ficha, el registro y la suspensión toman tres decisiones
 * distintas sobre lo mismo.
 */
export type PersonKind = 'roster' | 'acceso_directo' | 'external'

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
  person_kind:        PersonKind
  /** Identificador propio de la persona externa; es lo que se envía al registrar. */
  external_person_id?: number
  /** Etiqueta de la persona externa: ocupa el lugar del tipo de usuario en su ficha. */
  external_label?:    string | null
  /** Sexo del padrón ('M'/'F'/null = sin clasificar). Se propaga al alta al vuelo. */
  gender?:         string | null
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
