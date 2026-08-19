export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'TAQUILLERO' | 'ACCESO_DIRECTO'

export interface LoginCredentials {
  username: string
  password: string
}

export interface User {
  id: number
  name: string
  email: string
  role_id: number
  role: { id: number; name: RoleName }
  is_active: boolean
  /**
   * Sede asignada a la cuenta. `null` es "sin asignar", y para quien no administra
   * significa que el servidor le rechazará las operaciones de taquilla: la pantalla
   * tiene que decirlo antes de que lo descubra con un 403.
   */
  sede_id: number | null
  /** Nombre de la sede, proyectado por el servidor para poder rotularla sin traducir ids. */
  sede_name: string | null
  created_at: string
  updated_at: string | null
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ApiError {
  message: string
  status: number
  details?: Record<string, string[]>
  /**
   * `detail` del backend cuando viaja como objeto y no como texto: es el cuerpo
   * estructurado del error (por ejemplo el 409 de stock insuficiente, con la
   * lista de insumos que faltan). `message` seguirá siendo su resumen legible.
   */
  detail?: Record<string, unknown>
}
