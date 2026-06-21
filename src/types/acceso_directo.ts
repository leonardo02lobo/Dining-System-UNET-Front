export type AccesoDirectoStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'

export type UserType = 'STUDENT' | 'TEACHER' | 'ADMINISTRATIVE' | 'WORKER'

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
  status?: AccesoDirectoStatus
}

export interface AccesoDirectoVerifyResult {
  document_id: string
  first_name: string
  last_name: string
  status: AccesoDirectoStatus
  is_priority: boolean
}

export interface AccesoDirectoFilters {
  skip?: number
  limit?: number
  search?: string
  status?: AccesoDirectoStatus
  user_type?: UserType
}

export type AccesoDirectoLookupResult = AccesoDirecto

export interface PaginatedAccesosDirectos {
  items: AccesoDirecto[]
  total: number
}
