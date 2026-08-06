/**
 * Campos que aporta el CSV oficial de Control de Estudios. Todos opcionales: los
 * registros dados de alta a mano y las importaciones con el formato anterior no
 * los traen.
 */
export interface RosterFields {
  nacionalidad?: string | null   // 'V' | 'E' | 'P'
  cedula_raw?:   string | null   // documento sin limpiar ('BD201239')
  p_nombre?:     string | null
  s_nombre?:     string | null
  p_apellido?:   string | null
  s_apellido?:   string | null
  cod_carr?:     string | null   // código oficial de carrera ('08000')
}

/** Estudiante del padrón backend (GET /students/lookup, POST /students/bulk). */
export interface StudentPadronData extends RosterFields {
  id:         number
  cedula:     string
  full_name:  string
  email:      string | null
  career:     string | null
  is_active:  boolean
  photo_url:  string | null
}

/** Una fila de la importación masiva de estudiantes (CSV). */
export interface StudentBulkItem extends RosterFields {
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

/** Estudiante activo del padrón ausente en la última carga (POST /students/missing-check). */
export interface StudentMissingItem {
  id:        number
  cedula:    string
  full_name: string
  career:    string | null
}

export interface StudentMissingResult {
  total: number
  items: StudentMissingItem[]
}
