import { apiClient } from './client'
import type {
  AuditEntryListResponse,
  AuditFilterCatalog,
  LoginAuditListResponse,
} from '../types/audit'

export interface AuditFilters {
  from_date?: string
  to_date?: string
  role?: string
}

export const auditApi = {
  getLogs: (skip = 0, limit = 50, filters: AuditFilters = {}): Promise<LoginAuditListResponse> => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
    if (filters.from_date) params.set('from_date', filters.from_date)
    if (filters.to_date)   params.set('to_date', `${filters.to_date}T23:59:59`)
    if (filters.role)      params.set('role', filters.role)
    return apiClient.get<LoginAuditListResponse>(`/auth/audit-logs?${params}`)
  },
}

// --- Historial de procesos ---------------------------------------------------

export interface ProcessHistoryFilters {
  user_id?: number
  /** Procesos de una sola sesión: lo que despliega cada fila de Auditoría de Acceso. */
  login_audit_id?: number
  action?: string
  resource?: string
  from_date?: string
  to_date?: string
  q?: string
}

/**
 * Los filtros, en la forma que espera el servidor.
 *
 * `to_date` se cierra a las 23:59:59 igual que en la auditoría de accesos: quien escribe
 * una fecha de fin la entiende incluida, y sin la hora el día elegido queda fuera.
 */
function toParams(filters: ProcessHistoryFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.user_id !== undefined) params.set('user_id', String(filters.user_id))
  if (filters.login_audit_id !== undefined) params.set('login_audit_id', String(filters.login_audit_id))
  if (filters.action)    params.set('action', filters.action)
  if (filters.resource)  params.set('resource', filters.resource)
  if (filters.from_date) params.set('from_date', filters.from_date)
  if (filters.to_date)   params.set('to_date', `${filters.to_date}T23:59:59`)
  if (filters.q)         params.set('q', filters.q)
  return params
}

export const processHistoryApi = {
  /** Historial de una persona, o de todo el sistema si no se indica `user_id`. */
  list: (skip = 0, limit = 50, filters: ProcessHistoryFilters = {}): Promise<AuditEntryListResponse> => {
    const params = toParams(filters)
    params.set('skip', String(skip))
    params.set('limit', String(limit))
    return apiClient.get<AuditEntryListResponse>(`/audit-logs/?${params}`)
  },

  /**
   * El historial propio. No exige permiso de pantalla y **no acepta `user_id`**: el
   * servidor devuelve siempre lo del que pregunta.
   */
  listMine: (skip = 0, limit = 50, filters: ProcessHistoryFilters = {}): Promise<AuditEntryListResponse> => {
    const { user_id: _ignored, ...rest } = filters
    const params = toParams(rest)
    params.set('skip', String(skip))
    params.set('limit', String(limit))
    return apiClient.get<AuditEntryListResponse>(`/audit-logs/me?${params}`)
  },

  /** Acciones y recursos realmente presentes, para no ofrecer opciones sin resultados. */
  filterCatalog: (): Promise<AuditFilterCatalog> =>
    apiClient.get<AuditFilterCatalog>('/audit-logs/filters'),

  /**
   * Exportación con los filtros activos y **sin** ventana de paginación: quien pulsa
   * "Exportar" mirando la página 3 no está pidiendo la página 3, así que la genera el
   * servidor sobre todo el resultado en vez de armarla con las filas en pantalla.
   */
  export: (format: 'csv' | 'pdf', filters: ProcessHistoryFilters = {}): Promise<Blob> =>
    apiClient.getBlob(
      `/audit-logs/export/${format}?${toParams(filters)}`,
      format === 'csv' ? 'text/csv' : 'application/pdf',
    ),
}
