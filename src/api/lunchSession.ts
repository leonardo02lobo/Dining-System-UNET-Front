import { apiClient } from './client'
import type { LunchSession, LunchSessionCreate } from '../types/lunchSession'
import type { Sede } from '../types/sede'

export interface PaginatedSessions {
  items: LunchSession[]
  total: number
}

export interface PaginatedSedes {
  items: Sede[]
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

  /**
   * Sesiones abiertas, acotadas por el servidor al rol de quien pregunta: un
   * taquillero recibe solo las que él abrió. No filtrar aquí.
   */
  openList: () => apiClient.get<PaginatedSessions>('/lunch-sessions/open'),

  /**
   * Sedes activas sin sesión abierta. Alimenta el selector de apertura: con el
   * listado de sesiones ya acotado por rol, el complemento no se puede calcular
   * en el cliente sin dejar al taquillero eligiendo sedes ocupadas.
   */
  openableSedes: () => apiClient.get<PaginatedSedes>('/lunch-sessions/openable-sedes'),

  close: (id: number) => apiClient.put<LunchSession>(`/lunch-sessions/${id}/close`),

  /** Cierre forzado de una sesión ajena (SUPER_ADMIN). Queda en auditoría. */
  forceClose: (id: number, reason: string) =>
    apiClient.put<LunchSession>(`/lunch-sessions/${id}/force-close`, { reason }),

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
