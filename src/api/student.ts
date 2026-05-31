import type { Student } from '../types/user'

interface RegisterDiningPayload {
  cedula: string
  date: string
  registered_by_id: number
}

export const studentApi = {
  lookup: async (cedula: string): Promise<Student> => {
    await new Promise((r) => setTimeout(r, 600))
    // TODO: replace with real call → apiClient.get<Student>(`/beneficiaries/${cedula}`)
    if (cedula.trim().length < 6) throw new Error('Estudiante no encontrado')
    return {
      cedula,
      name:         'Leonardo Pérez',
      career:       'Ing. Informática',
      user_type:    'ESTUDIANTE',
      is_suspended: cedula.endsWith('0'),
    }
  },

  registerDining: async (_payload: RegisterDiningPayload): Promise<void> => {
    await new Promise((r) => setTimeout(r, 500))
    // TODO: replace with real call → apiClient.post('/dining/register', _payload)
  },
}
