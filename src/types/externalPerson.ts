export type ExternalPersonStatus = 'ACTIVE' | 'INACTIVE'

export interface ExternalPerson {
  id: number
  first_name: string
  last_name: string
  document_id: string
  card_code: string | null
  email: string | null
  gender: string | null
  label_id: number
  /** Nombre de la etiqueta, servido junto al id para pintar la fila sin otra consulta. */
  label: string | null
  career: string | null
  photo_url: string | null
  status: ExternalPersonStatus
  created_at: string
  updated_at: string | null
}

export interface ExternalPersonCreate {
  first_name: string
  last_name: string
  document_id: string
  card_code?: string | null
  email?: string | null
  gender?: string | null
  label_id: number
  career?: string | null
  photo_url?: string | null
  status?: ExternalPersonStatus
}

export interface ExternalPersonUpdate {
  first_name?: string
  last_name?: string
  card_code?: string | null
  email?: string | null
  gender?: string | null
  label_id?: number
  career?: string | null
  photo_url?: string | null
  status?: ExternalPersonStatus
}
