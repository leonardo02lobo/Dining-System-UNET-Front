import { apiClient } from './client'
import type { Consumption, ConsumptionCreate, ConsumptionCheckResult } from '../types/consumption'

export interface PaginatedConsumptions {
  items: Consumption[]
  total: number
}

export interface GenderStat {
  gender: string
  count: number
}

export interface CareerStat {
  career: string
  count: number
}

export interface DailyStat {
  date: string
  count: number
}

export interface UserConsumptionStats {
  genderStats: GenderStat[]
  careerStats: CareerStat[]
  dailyStats: DailyStat[]
}

export const consumptionApi = {
  register: (data: ConsumptionCreate)    => apiClient.post<Consumption>('/consumptions/', data),
  check:    (accesoDirectoId: number)    => apiClient.get<ConsumptionCheckResult>(`/consumptions/check/${accesoDirectoId}`),
  list:     (params?: { acceso_directo_id?: number; session_id?: number }) => {
    const p = new URLSearchParams()
    if (params?.acceso_directo_id) p.set('acceso_directo_id', String(params.acceso_directo_id))
    if (params?.session_id)     p.set('session_id', String(params.session_id))
    const qs = p.toString()
    return apiClient.get<PaginatedConsumptions>(`/consumptions/${qs ? `?${qs}` : ''}`)
  },
  userStats: (params?: { from?: string; to?: string }) => {
    const p = new URLSearchParams()
    if (params?.from) p.set('from', params.from)
    if (params?.to)   p.set('to', params.to)
    const qs = p.toString()
    return apiClient.get<UserConsumptionStats>(`/consumptions/user-stats${qs ? `?${qs}` : ''}`)
  },
}
