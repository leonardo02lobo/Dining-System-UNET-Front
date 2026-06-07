/**
 * Shim de compatibilidad — redirige hacia las APIs reales de beneficiarios y consumos.
 * RegisterDining y ManualRegistrationPage importan este módulo; migrarlos directamente
 * a beneficiaryApi/consumptionApi es el siguiente paso de limpieza.
 */
import { beneficiaryApi } from './beneficiary'
import { consumptionApi } from './consumption'
import type { Student } from '../types/user'

interface RegisterDiningPayload {
  cedula: string
  date: string
  registered_by_id: number
  session_id: number
  is_manual?: boolean
}

export const studentApi = {
  lookup: async (q: string): Promise<Student> => {
    const b = await beneficiaryApi.lookup(q)
    return {
      cedula:       b.document_id,
      name:         `${b.first_name} ${b.last_name}`,
      career:       b.career ?? '',
      user_type:    b.user_type,
      is_suspended: b.status === 'SUSPENDED',
    }
  },

  registerDining: async (payload: RegisterDiningPayload): Promise<void> => {
    const b = await beneficiaryApi.lookup(payload.cedula)
    await consumptionApi.register({
      beneficiary_id:   b.id,
      lunch_session_id: payload.session_id,
      is_manual:        payload.is_manual ?? false,
    })
  },
}
