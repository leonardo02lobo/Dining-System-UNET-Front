export type SanctionStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

export interface Sanction {
  id: number
  beneficiary_id: number
  created_by_id: number
  reason: string
  description?: string
  start_date: string
  end_date: string
  status: SanctionStatus
  notified_user: boolean
  notified_authority: boolean
  created_at: string
  updated_at: string | null
}

export interface SanctionCreate {
  beneficiary_id: number
  reason: string
  description?: string
  start_date: string
  end_date: string
}
