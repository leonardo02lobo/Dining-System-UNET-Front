import type { ApiError } from '../types/auth'
import type { Sanction } from '../types/sanction'

/** Error 403 con sanción activa adjunta (consumo bloqueado por el backend) */
export interface SanctionBlockError extends ApiError {
  sanction: Sanction
}

const DEFAULT_API_BASE_URL = '/api/v1'

function normalizeApiBaseUrl(value?: string): string {
  const baseUrl = (value || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '')

  return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`
}

const BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

// Serializa los intentos de refresh concurrentes en una sola llamada
let refreshPromise: Promise<void> | null = null

function doRefresh(): Promise<void> {
  if (refreshPromise) return refreshPromise
  refreshPromise = fetch(`${BASE_URL}/auth/refreshToken`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((res) => {
      if (!res.ok) throw new Error('refresh_failed')
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  { isRetry = false, noRefresh = false }: { isRetry?: boolean; noRefresh?: boolean } = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && !isRetry && !noRefresh) {
    try {
      await doRefresh()
      return request<T>(method, path, body, { isRetry: true })
    } catch {
      window.location.replace('/login')
      throw { message: 'Sesión expirada. Inicia sesión nuevamente.', status: 401 } as ApiError
    }
  }

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => ({ message: 'Error de conexión con el servidor' }))

  if (!response.ok) {
    // El backend puede devolver detail como string o como objeto (ej. 403 con sanción activa)
    const detail = data.detail
    const message: string =
      data.message ??
      (typeof detail === 'string' ? detail : detail?.message) ??
      'Error del servidor'

    const err: ApiError = { message, status: response.status, details: data.details }

    // 403 con sanción activa: adjuntar el objeto sanción al error
    if (response.status === 403 && detail?.sanction) {
      throw { ...err, sanction: detail.sanction } as SanctionBlockError
    }

    throw err
  }

  return data as T
}

export const apiClient = {
  get: <T>(path: string, opts?: { noRefresh?: boolean }) =>
    request<T>('GET', path, undefined, { noRefresh: opts?.noRefresh }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
  postForm: async <T>(path: string, form?: Record<string, string>): Promise<T> => {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: form ? new URLSearchParams(form).toString() : undefined,
    })

    if (response.status === 204) return undefined as T

    const data = await response.json().catch(() => ({ message: 'Error de conexión con el servidor' }))

    if (!response.ok) {
      throw { message: data.message ?? data.detail ?? 'Error del servidor', status: response.status, details: data.details } as unknown as Error
    }

    return data as T
  },
}
