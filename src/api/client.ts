import type { ApiError } from '../types/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api/v1'

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
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

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => ({ message: 'Error de conexión con el servidor' }))

  if (!response.ok) {
    throw { message: data.message ?? data.detail ?? 'Error del servidor', status: response.status, details: data.details } as ApiError
  }

  return data as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
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
