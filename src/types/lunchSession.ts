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
  sede_id: number | null
  sede?: Sede | null
  created_at: string
  updated_at: string | null
}

export interface LunchSessionCreate {
  sede_id: number
  date?: string
}
