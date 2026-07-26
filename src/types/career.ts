export interface Career {
  id: number
  name: string
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface CareerCreatePayload {
  name: string
}

export interface CareerUpdatePayload {
  name?: string
  is_active?: boolean
}
