export interface Career {
  id: number
  name: string
  /** Código oficial de Control de Estudios ('08000'). Nulo si se creó a mano. */
  code: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface CareerCreatePayload {
  name: string
  code?: string | null
}

export interface CareerUpdatePayload {
  name?: string
  code?: string | null
  is_active?: boolean
}
