import type { Student } from '../types/user'

const BASE_URL = ((import.meta.env.VITE_STUDENTS_API_URL as string | undefined) ?? 'http://localhost:3000/api')
  .replace(/\/$/, '')

/** Shape returned by GET /api/users/:cedula */
export interface ExternalStudentData {
  id:          number
  nombre:      string
  documento:   string
  email:       string
  is_active:   boolean
  foto_perfil: string
}

export function mapExternalToStudent(data: ExternalStudentData): Student {
  return {
    cedula:         data.documento,
    name:           data.nombre,
    email:          data.email,
    career:         '',
    user_type:      '',
    is_suspended:   !data.is_active,
    avatar_url:     data.foto_perfil,
    is_beneficiary: false,
  }
}

export const externalStudentApi = {
  lookup: async (cedula: string): Promise<ExternalStudentData> => {
    const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(cedula)}`)
    if (!res.ok) {
      if (res.status === 404) {
        throw { status: 404, message: 'Este estudiante no está inscrito en la UNET' }
      }
      throw { status: res.status, message: 'Error al consultar el estudiante' }
    }
    const json = await res.json()
    return (json.data ?? json) as ExternalStudentData
  },
}
