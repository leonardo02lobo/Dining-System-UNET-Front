export type AccesoDirectoStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'

export type UserType = 'STUDENT' | 'TEACHER' | 'ADMINISTRATIVE' | 'WORKER'

export interface AccessReason {
  id: number
  name: string
  description?: string | null
  created_at: string
  updated_at: string | null
}

export interface AccessReasonCreate {
  name: string
  description?: string
}

export interface AccesoDirecto {
  id: number
  first_name: string
  last_name: string
  document_id: string
  card_code: string | null
  email?: string | null
  gender?: string | null
  user_type: UserType
  career?: string | null
  is_priority: boolean
  photo_url?: string | null
  access_reason_id?: number | null
  access_reason?: AccessReason | null
  status: AccesoDirectoStatus
  created_at: string
  updated_at: string | null
}

export interface AccesoDirectoCreate {
  first_name: string
  last_name: string
  document_id: string
  card_code?: string
  email?: string
  gender?: string
  user_type: UserType
  career?: string
  is_priority?: boolean
  photo_url?: string
  access_reason_id?: number | null
  status?: AccesoDirectoStatus
}

export interface AccesoDirectoUpdate {
  first_name?: string
  last_name?: string
  card_code?: string
  email?: string
  gender?: string
  user_type?: UserType
  career?: string
  is_priority?: boolean
  photo_url?: string | null
  access_reason_id?: number | null
  status?: AccesoDirectoStatus
}

export interface AccesoDirectoVerifyResult {
  document_id: string
  first_name: string
  last_name: string
  status: AccesoDirectoStatus
  is_priority: boolean
  photo_url?: string | null
  access_reason?: AccessReason | null
}

export interface AccesoDirectoFilters {
  skip?: number
  limit?: number
  search?: string
  status?: AccesoDirectoStatus
  user_type?: UserType
  access_reason_id?: number
}

export type AccesoDirectoLookupResult = AccesoDirecto

/** Un registro del payload de importación masiva (`POST /accesos_directos/bulk`). */
export interface AccesoDirectoBulkItem {
  full_name: string
  email: string | null
  career: string | null
  document_id: string
  is_active: boolean
}

/** Cuerpo de la petición de importación masiva. */
export interface AccesoDirectoBulkRequest {
  items: AccesoDirectoBulkItem[]
}

/** Resultado por fila devuelto por el backend en la importación masiva. */
export interface AccesoDirectoBulkRowResult {
  row: number
  document_id: string
  // created   -> alta nueva
  // updated   -> ya existía y se actualizó (algún campo cambió)
  // unchanged -> ya existía idéntico, no se tocó
  // error     -> fila inválida (p. ej. cédula repetida en el archivo)
  status: 'created' | 'updated' | 'unchanged' | 'error'
  id: number | null
  error: string | null
}

/** Respuesta (HTTP 200) de la importación masiva (upsert por cédula). */
export interface AccesoDirectoBulkResult {
  total: number
  created: number
  updated: number
  unchanged: number
  failed: number
  results: AccesoDirectoBulkRowResult[]
}

export interface PaginatedAccesosDirectos {
  items: AccesoDirecto[]
  total: number
}

/** Un ingreso registrado por una persona del módulo de accesos directos. */
export interface AccesoDirectoRecentEntry {
  consumption_id: number
  acceso_directo_id: number
  document_id: string
  first_name: string
  last_name: string
  user_type: UserType | null
  career: string | null
  /** Nombre del motivo de acceso, no su id: la fila se pinta, no se enlaza. */
  access_reason: string | null
  is_priority: boolean
  registered_at: string
  consumption_date: string
  is_manual: boolean
  lunch_session_id: number
  /** Nulos en un registro manual: su sesión no cuelga de ninguna sede. */
  sede_id: number | null
  sede_name: string | null
}

export interface PaginatedRecentEntries {
  /** Cuenta todos los ingresos, no los devueltos: permite rotular "10 de 1.483". */
  total: number
  items: AccesoDirectoRecentEntry[]
}
