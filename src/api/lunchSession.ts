import { apiClient } from './client'
import type { LunchSession, LunchSessionCreate } from '../types/lunchSession'

export interface PaginatedSessions {
  items: LunchSession[]
  total: number
}

export const lunchSessionApi = {
  open:  (data?: LunchSessionCreate) => apiClient.post<LunchSession>('/lunch-sessions/', data ?? {}),

  today: async (): Promise<LunchSession | null> => {
    try {
      return await apiClient.get<LunchSession>('/lunch-sessions/today')
    } catch (err: any) {
      if (err?.status === 404) return null
      throw err
    }
  },

  close: (id: number) => apiClient.put<LunchSession>(`/lunch-sessions/${id}/close`),

  list: (skip = 0, limit = 50) =>
    apiClient.get<PaginatedSessions>(`/lunch-sessions/?skip=${skip}&limit=${limit}`),
}
