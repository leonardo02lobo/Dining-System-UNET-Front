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
  status: 'created' | 'error'
  id: number | null
  error: string | null
}

/** Respuesta (HTTP 200) de la importación masiva. */
export interface AccesoDirectoBulkResult {
  total: number
  created: number
  failed: number
  results: AccesoDirectoBulkRowResult[]
}

export interface PaginatedAccesosDirectos {
  items: AccesoDirecto[]
  total: number
}
