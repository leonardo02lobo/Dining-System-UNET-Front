import type { Sanction } from './sanction'

export interface Consumption {
  id: number
  acceso_directo_id: number
  lunch_session_id: number
  registered_by_id: number
  registered_at: string
  is_manual: boolean
}

export interface ConsumptionCreate {
  acceso_directo_id: number
  lunch_session_id?: number
  is_manual: boolean
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
}

export interface ManualConsumptionUpdate {
  acceso_directo_id?: number
  date?: string
}

export interface PaginatedManualConsumptions {
  total: number
  items: ManualConsumption[]
}
