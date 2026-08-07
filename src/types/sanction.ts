export type SanctionStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

export interface Sanction {
  id: number
  acceso_directo_id: number
  created_by_id: number
  reason: string
  description?: string
  start_date: string
  end_date: string | null
  status: SanctionStatus
  notified_user: boolean
  notified_authority: boolean
  created_at: string
  updated_at: string | null
}

export interface SanctionCreate {
  acceso_directo_id: number
  reason: string
  description?: string
  start_date: string
  end_date: string
}

/**
 * Suspensión rápida desde el registro: persona + motivo (inicia hoy) y, opcionalmente,
 * fecha de fin. `end_date: null` explícito = indefinida; el backend lo acepta y no lo
 * convierte en obligatorio.
 */
export interface SanctionQuickCreate {
  acceso_directo_id: number
  reason: string
  description?: string
  end_date?: string | null
}

/** Persona actualmente suspendida (sanción activa vigente hoy). */
export interface SuspendedAccesoDirecto {
  sanction_id: number
  acceso_directo_id: number
  document_id: string
  first_name: string
  last_name: string
  user_type: string
  career: string | null
  reason: string
  description?: string | null
  start_date: string
  end_date: string | null
  created_at: string
}
