import type { Sanction } from './sanction'

export interface Consumption {
  id: number
  acceso_directo_id: number
  lunch_session_id: number
  registered_by_id: number
  registered_at: string
  is_manual: boolean
  // Datos de la persona expuestos por el backend para listar entrantes (#3/#4).
  is_priority?: boolean
  document_id?: string
  first_name?: string
  last_name?: string
  career?: string | null
  /** Rol de la persona (STUDENT/TEACHER/ADMINISTRATIVE/WORKER). Filtro por rol (#4) y gráficas (#3). */
  user_type?: string | null
  /** Género de la persona (p. ej. "M"/"F"). Gráfica de género (#3). */
  gender?: string | null
}

/** Datos mínimos para dar de alta al vuelo a quien no es acceso directo (Issue 2). */
export interface AccesoDirectoIdentity {
  document_id: string
  first_name: string
  last_name?: string
  email?: string | null
  user_type?: string
  photo_url?: string | null
  career?: string | null
}

export interface ConsumptionCreate {
  acceso_directo_id?: number
  lunch_session_id?: number
  is_manual: boolean
  /** Si la persona no es acceso directo, se envían sus datos para crearla al vuelo. */
  person?: AccesoDirectoIdentity
}

export interface ConsumptionCheckResult {
  acceso_directo_id: number
  has_consumed_today: boolean
  consumption: Consumption | null
  active_sanction: Sanction | null
}

/** Criterios de orden para el listado manual (espejo del backend) */
export type ManualOrderBy = 'document_id' | 'registered_at'
export type OrderDir = 'asc' | 'desc'

/** Registro manual con datos de la persona embebidos para el listado/impresión */
export interface ManualConsumption {
  id: number
  acceso_directo_id: number
  lunch_session_id: number
  date: string            // YYYY-MM-DD
  registered_by_id: number
  registered_at: string
  is_manual: boolean
  document_id: string
  first_name: string
  last_name: string
  user_type: string
  career: string | null
}

export interface ManualConsumptionCreate {
  date: string                  // YYYY-MM-DD (obligatoria)
  acceso_directo_id?: number
  document_id?: string
  /** Si la persona no es acceso directo, se envían sus datos para crearla al vuelo (Issue 2). */
  person?: AccesoDirectoIdentity
}

export interface ManualConsumptionUpdate {
  acceso_directo_id?: number
  date?: string
}

export interface PaginatedManualConsumptions {
  total: number
  items: ManualConsumption[]
}
