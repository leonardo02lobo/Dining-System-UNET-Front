import { apiClient } from './client'
import type {
  Consumption,
  ConsumptionCreate,
  ConsumptionCheckResult,
  ConsumptionCheckByDocument,
  ManualConsumption,
  PaginatedDayConsumptions,
  ManualConsumptionCreate,
  ManualConsumptionUpdate,
  ManualOrderBy,
  OrderDir,
  PaginatedManualConsumptions,
} from '../types/consumption'

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
  list:     (params?: {
    acceso_directo_id?: number
    session_id?: number
    from_date?: string
    to_date?: string
    is_priority?: boolean
    limit?: number
  }) => {
    const p = new URLSearchParams()
    if (params?.acceso_directo_id) p.set('acceso_directo_id', String(params.acceso_directo_id))
    if (params?.session_id)     p.set('session_id', String(params.session_id))
    if (params?.from_date)      p.set('from_date', params.from_date)
    if (params?.to_date)        p.set('to_date', params.to_date)
    if (params?.is_priority)    p.set('is_priority', 'true')
    if (params?.limit != null)  p.set('limit', String(params.limit))
    const qs = p.toString()
    return apiClient.get<PaginatedConsumptions>(`/consumptions/${qs ? `?${qs}` : ''}`)
  },
  /**
   * Últimos consumos de una sesión + total de registros de la sesión.
   * Alimenta el contador (#6) y la ventana de "últimas N personas" (#7) de Registro
   * al Comedor. Endpoint acotado a la sesión, accesible también a taquilleros.
   */
  sessionRecent: (sessionId: number, limit = 10) =>
    apiClient.get<PaginatedConsumptions>(`/consumptions/session/${sessionId}/recent?limit=${limit}`),

  userStats: (params?: { from?: string; to?: string }) => {
    const p = new URLSearchParams()
    if (params?.from) p.set('from', params.from)
    if (params?.to)   p.set('to', params.to)
    const qs = p.toString()
    return apiClient.get<UserConsumptionStats>(`/consumptions/user-stats${qs ? `?${qs}` : ''}`)
  },

  /**
   * ¿Esta cédula ya registró consumo en esa fecha? Resuelve por documento, así que
   * sirve para alguien recién consultado en el padrón que todavía no es acceso
   * directo (`check/{id}` exige un id que esa persona aún no tiene).
   *
   * `date` omitida ⇒ hoy. El registro manual **debe** pasar la fecha seleccionada:
   * avisar de lo que alguien comió hoy mientras se le registra un consumo del día 3
   * sería ruido, y entrenaría al operador a ignorar el aviso.
   */
  checkByDocument: (documentId: string, date?: string) => {
    const p = new URLSearchParams({ document_id: documentId })
    if (date) p.set('date', date)
    return apiClient.get<ConsumptionCheckByDocument>(
      `/consumptions/check-by-document?${p.toString()}`,
    )
  },

  /**
   * Todos los ingresos de una fecha (taquilla + manuales), con `is_manual` por fila.
   * El listado manual por sí solo deja invisible a quien entró por taquilla, que es
   * justamente la confusión que lleva a registrar dos veces a la misma persona.
   */
  daySummary: (params: { date: string; order_by?: ManualOrderBy; order_dir?: OrderDir }) => {
    const p = new URLSearchParams()
    p.set('date', params.date)
    if (params.order_by)  p.set('order_by', params.order_by)
    if (params.order_dir) p.set('order_dir', params.order_dir)
    return apiClient.get<PaginatedDayConsumptions>(`/consumptions/day-summary?${p.toString()}`)
  },

  // --- Registro manual (problemáticas 23-28) ---
  registerManual: (data: ManualConsumptionCreate) =>
    apiClient.post<ManualConsumption>('/consumptions/manual', data),

  listManual: (params: { date: string; order_by?: ManualOrderBy; order_dir?: OrderDir }) => {
    const p = new URLSearchParams()
    p.set('date', params.date)
    if (params.order_by)  p.set('order_by', params.order_by)
    if (params.order_dir) p.set('order_dir', params.order_dir)
    return apiClient.get<PaginatedManualConsumptions>(`/consumptions/manual?${p.toString()}`)
  },

  updateManual: (id: number, data: ManualConsumptionUpdate) =>
    apiClient.put<ManualConsumption>(`/consumptions/manual/${id}`, data),

  deleteManual: (id: number) =>
    apiClient.delete<void>(`/consumptions/manual/${id}`),
}
