import type { Sede } from './sede'

export type SessionStatus = 'OPEN' | 'CLOSED'

export interface LunchSession {
  id: number
  date: string
  status: SessionStatus
  opened_at: string | null
  closed_at: string | null
  opened_by_id: number | null
  closed_by_id: number | null
  /**
   * Nombre de quien abrió y de quien cerró. Sin ellos la pantalla solo puede
   * deshabilitar el botón de cerrar sin decir por qué.
   */
  opened_by_name: string | null
  closed_by_name: string | null
  sede_id: number | null
  sede?: Sede | null
  /** Platos planificados para el turno. `null` en sesiones sin planificación. */
  plates_quantity: number | null
  created_at: string
  updated_at: string | null
}

export interface LunchSessionCreate {
  sede_id: number
  date?: string
  /** Platos planificados del turno (opcional). */
  plates_quantity?: number | null
}
