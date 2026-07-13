import { apiClient } from './client'
import type { LunchSession, LunchSessionCreate } from '../types/lunchSession'

export interface PaginatedSessions {
  items: LunchSession[]
  total: number
}

export const lunchSessionApi = {
  open: (data: LunchSessionCreate) => apiClient.post<LunchSession>('/lunch-sessions/', data),

  today: async (sedeId?: number): Promise<LunchSession | null> => {
    try {
      const query = sedeId != null ? `?sede_id=${sedeId}` : ''
      return await apiClient.get<LunchSession>(`/lunch-sessions/today${query}`)
    } catch (err: any) {
      if (err?.status === 404) return null
      throw err
    }
  },

  openList: () => apiClient.get<PaginatedSessions>('/lunch-sessions/open'),

  close: (id: number) => apiClient.put<LunchSession>(`/lunch-sessions/${id}/close`),

  list: (skip = 0, limit = 50) =>
    apiClient.get<PaginatedSessions>(`/lunch-sessions/?skip=${skip}&limit=${limit}`),

  /** Historial de sesiones filtrable por rango de fechas (#4). */
  listByRange: (params?: { from_date?: string; to_date?: string; skip?: number; limit?: number }) => {
    const p = new URLSearchParams()
    p.set('skip', String(params?.skip ?? 0))
    p.set('limit', String(params?.limit ?? 100))
    if (params?.from_date) p.set('from_date', params.from_date)
    if (params?.to_date)   p.set('to_date', params.to_date)
    return apiClient.get<PaginatedSessions>(`/lunch-sessions/?${p.toString()}`)
  },
}
