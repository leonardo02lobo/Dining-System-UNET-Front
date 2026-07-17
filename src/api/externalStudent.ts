import { apiClient } from './client'
import type { Student } from '../types/user'
import type { StudentPadronData, StudentBulkItem, StudentBulkResult } from '../types/student'

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
    user_type:         '',
    is_suspended:      !data.is_active,
    avatar_url:        data.photo_url ?? undefined,
    is_acceso_directo: false,
  }
}

export const externalStudentApi = {
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
}
