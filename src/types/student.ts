/** Estudiante del padrón backend (GET /students/lookup, POST /students/bulk). */
export interface StudentPadronData {
  id:         number
  cedula:     string
  full_name:  string
  email:      string | null
  career:     string | null
  is_active:  boolean
  photo_url:  string | null
}

/** Una fila de la importación masiva de estudiantes (CSV). */
export interface StudentBulkItem {
  full_name: string
  cedula:    string
  email:     string | null
  career:    string | null
  is_active: boolean
}

/** Resultado por fila devuelto por el backend en la importación masiva. */
export interface StudentBulkRowResult {
  row:    number
  cedula: string
  status: 'created' | 'updated' | 'unchanged' | 'error'
  id:     number | null
  error:  string | null
}

/** Respuesta (HTTP 200) de la importación masiva de estudiantes (upsert por cédula). */
export interface StudentBulkResult {
  total:     number
  created:   number
  updated:   number
  unchanged: number
  failed:    number
  results:   StudentBulkRowResult[]
}
