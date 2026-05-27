export interface Row {
  name: string
  career: string
  email: string
  gender: string
  picture: string
}

/** Estudiante del sistema de comedor */
export interface Student {
  cedula: string
  name: string
  career: string
  user_type: string
  is_suspended: boolean
  avatar_url?: string
}

/** Usuario del sistema (administrador, taquillero, etc.) */
export interface SystemUser {
  id: number
  name: string
  cedula: string
  email: string
  status: 'Activo' | 'Suspendido'
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TAQUILLERO'
  avatar_url?: string
}
