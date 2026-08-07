import { apiClient } from './client'
import type { Student } from '../types/user'
import type {
  StudentPadronData,
  StudentBulkItem,
  StudentBulkResult,
  StudentGender,
  StudentMissingResult,
  PaginatedStudents,
} from '../types/student'

/**
 * Padrón de estudiantes del backend (`/students`). Reemplaza al antiguo servicio
 * Node externo. Se conserva el nombre `externalStudentApi` para no tocar los
 * consumidores (RegisterDining, CheckConsumes, SuspendStudent, ManualRegistration).
 */

// Alias de compatibilidad con el nombre anterior del shape.
export type ExternalStudentData = StudentPadronData

/** Adapta el estudiante del padrón backend al tipo `Student` de la UI. */
export function mapExternalToStudent(data: StudentPadronData): Student {
  return {
    cedula:            data.cedula,
    name:              data.full_name,
    email:             data.email ?? '',
    career:            data.career ?? '',
    // El padrón `/students` no guarda tipo de usuario: por definición todos sus
    // registros son estudiantes. Si además existe como acceso directo, el
    // `user_type` real lo sobrescribe en `studentApi.lookup`.
    user_type:         'STUDENT',
    is_suspended:      !data.is_active,
    avatar_url:        data.photo_url ?? undefined,
    is_acceso_directo: false,
    // Viaja hasta `studentToIdentity` para que el alta al vuelo escriba el sexo en
    // `beneficiaries.gender`, que es la columna que alimenta las estadísticas de
    // género. Sin este salto la clasificación del padrón sería decorativa.
    gender:            data.gender ?? null,
  }
}

/** Parámetros de `GET /students/` (paginado + filtros que el backend ya expone). */
/**
 * Valor del filtro de sexo. `'none'` **no** es un sexo: selecciona a quienes faltan
 * por clasificar. Hace falta un token porque un parámetro vacío en la URL no puede
 * distinguirse de "sin filtro".
 */
export type StudentGenderFilter = StudentGender | 'none'

export interface StudentListParams {
  skip?:      number
  limit?:     number
  search?:    string
  is_active?: boolean
  cod_carr?:  string
  gender?:    StudentGenderFilter
}

export const externalStudentApi = {
  /** Listado paginado del padrón. Envolvente `{ total, items }`. */
  list: (params: StudentListParams = {}): Promise<PaginatedStudents> => {
    const p = new URLSearchParams()
    if (params.skip != null)      p.set('skip', String(params.skip))
    if (params.limit != null)     p.set('limit', String(params.limit))
    if (params.search)            p.set('search', params.search)
    if (params.is_active != null) p.set('is_active', String(params.is_active))
    if (params.cod_carr)          p.set('cod_carr', params.cod_carr)
    // El filtro de sexo lo resuelve el servidor: hacerlo aquí sobre la página ya
    // cargada devolvería un `total` falso y menos filas de las pedidas conforme
    // avanzara la clasificación, justo cuando la cola de trabajo empieza a servir.
    if (params.gender)            p.set('gender', params.gender)
    const qs = p.toString()
    return apiClient.get<PaginatedStudents>(`/students/${qs ? `?${qs}` : ''}`)
  },

  /** Ficha completa de un estudiante del padrón. */
  getById: (id: number): Promise<StudentPadronData> =>
    apiClient.get<StudentPadronData>(`/students/${id}`),

  /**
   * Clasifica (o desclasifica, con `null`) el sexo del estudiante.
   *
   * El PATCH del backend **solo** acepta `gender`: cualquier otro campo responde 422.
   * Esa restricción es la que hace real el "el resto del padrón es de solo lectura";
   * por eso aquí se envía el objeto con ese único campo y nada más.
   */
  setGender: (id: number, gender: StudentGender | null): Promise<StudentPadronData> =>
    apiClient.patch<StudentPadronData>(`/students/${id}`, { gender }),

  lookup: async (cedula: string): Promise<StudentPadronData> => {
    try {
      return await apiClient.get<StudentPadronData>(
        `/students/lookup?q=${encodeURIComponent(cedula)}`,
      )
    } catch (err: any) {
      if (err?.status === 404) {
        throw { status: 404, message: 'Este estudiante no está inscrito en la UNET' }
      }
      throw err
    }
  },

  bulkCreate: (items: StudentBulkItem[]): Promise<StudentBulkResult> =>
    apiClient.post<StudentBulkResult>('/students/bulk', { items }),

  /**
   * Estudiantes activos del padrón que no vienen en la carga recién importada
   * (graduados, retirados). Solo informa: no desactiva a nadie.
   */
  missingCheck: (cedulas: string[]): Promise<StudentMissingResult> =>
    apiClient.post<StudentMissingResult>('/students/missing-check', { cedulas }),
}
