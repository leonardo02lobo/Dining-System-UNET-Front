/** Acceso de un estudiante al comedor (espejo de StudentAccessResponse del backend). */
export interface StudentAccess {
  id: number
  acceso_directo_id: number
  document_id: string
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  user_type: string
  career: string | null
  photo_url: string | null
  registered_at: string
  consumption_date: string
  is_manual: boolean
}

export interface PaginatedStudentAccess {
  total: number
  items: StudentAccess[]
}
