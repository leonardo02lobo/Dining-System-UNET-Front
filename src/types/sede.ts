export interface Sede {
  id: number
  name: string
  description: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface SedeCreate {
  name: string
  description?: string
  address?: string
  is_active?: boolean
}

export interface SedeUpdate {
  name?: string
  description?: string
  address?: string
  is_active?: boolean
}

export interface PaginatedSedes {
  items: Sede[]
  total: number
}
