import type { AccesoDirectoIdentity } from './consumption'

export type SanctionStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

/** De qué apartado sale la persona suspendida. */
export type SanctionPersonKind = 'acceso_directo' | 'external'

export interface Sanction {
  id: number
  /** Nulo cuando la suspensión es de una persona externa. */
  acceso_directo_id: number | null
  external_person_id: number | null
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

/**
 * Las tres formas de nombrar a la persona que se suspende. Exactamente una: el
 * backend rechaza con 422 tanto dos como ninguna.
 *
 * `person` es para quien está en el padrón pero todavía no es acceso directo
 * —nunca ha pasado por taquilla—; el servidor lo da de alta al vuelo, igual que
 * al registrar un consumo.
 */
export type SanctionPersonTarget =
  | { acceso_directo_id: number }
  | { external_person_id: number }
  | { person: AccesoDirectoIdentity }

export type SanctionCreate = SanctionPersonTarget & {
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
export type SanctionQuickCreate = SanctionPersonTarget & {
  reason: string
  description?: string
  end_date?: string | null
}

/** Persona actualmente suspendida (sanción activa vigente hoy), de cualquier apartado. */
export interface SuspendedAccesoDirecto {
  sanction_id: number
  person_kind: SanctionPersonKind
  acceso_directo_id: number | null
  external_person_id: number | null
  document_id: string
  first_name: string
  last_name: string
  /** Nulo para la gente externa: no pertenece al padrón universitario. */
  user_type: string | null
  /** Etiqueta con la que se dio de alta a la persona externa; nula para el resto. */
  external_label: string | null
  career: string | null
  reason: string
  description?: string | null
  start_date: string
  end_date: string | null
  created_at: string
}
