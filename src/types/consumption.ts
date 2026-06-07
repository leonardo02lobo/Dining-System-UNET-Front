import type { Sanction } from './sanction'

export interface Consumption {
  id: number
  beneficiary_id: number
  lunch_session_id: number
  registered_by_id: number
  registered_at: string
  is_manual: boolean
}

export interface ConsumptionCreate {
  beneficiary_id: number
  lunch_session_id?: number
  is_manual: boolean
}

export interface ConsumptionCheckResult {
  beneficiary_id: number
  has_consumed_today: boolean
  consumption: Consumption | null
  active_sanction: Sanction | null
}
