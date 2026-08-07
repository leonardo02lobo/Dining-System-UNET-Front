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
  /**
   * Sexo clasificado en el padrón. El backend lo escribe al crear el acceso directo
   * y lo refresca en el existente cuando llega con valor (nunca lo borra con vacío),
   * con el mismo criterio que `career`.
   */
  gender?: string | null
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

/**
 * Consumo del día devuelto por `check-by-document`. `is_manual` viaja porque el aviso
 * al taquillero debe poder decir "ya lo registraron manualmente" en vez de un genérico
 * "ya comió" (contrato del backend §3).
 */
export interface DayConsumptionRef {
  id: number
  registered_at: string
  is_manual: boolean
  lunch_session_id: number
  sede_name: string | null
}

/**
 * Respuesta de `GET /consumptions/check-by-document`.
 *
 * Persona inexistente ⇒ 200 con `acceso_directo_id: null` y `has_consumed: false`:
 * "no ha comido" es una respuesta válida, no un 404. La consulta no muta nada ni da
 * de alta a nadie.
 */
export interface ConsumptionCheckByDocument {
  document_id: string
  date: string
  acceso_directo_id: number | null
  has_consumed: boolean
  consumption: DayConsumptionRef | null
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

/**
 * Un ingreso del día (`GET /consumptions/day-summary`). Misma forma que el registro
 * manual salvo por lo que la relación completa admite y aquél no: personas externas,
 * que no son acceso directo y no tienen tipo de usuario del padrón. De ahí que
 * `acceso_directo_id` y `user_type` viajen opcionales.
 */
export interface DayConsumption extends Omit<ManualConsumption, 'acceso_directo_id' | 'user_type'> {
  acceso_directo_id?: number | null
  external_person_id?: number | null
  user_type?: string | null
}

export interface PaginatedDayConsumptions {
  total: number
  items: DayConsumption[]
}
