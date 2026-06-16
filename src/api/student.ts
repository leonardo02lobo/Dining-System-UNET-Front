import { beneficiaryApi } from './beneficiary'
import { consumptionApi } from './consumption'
import { externalStudentApi, mapExternalToStudent } from './externalStudent'
import type { Student } from '../types/user'

interface RegisterDiningPayload {
  cedula:          string
  date:            string
  registered_by_id: number
  session_id:       number
  is_manual?:       boolean
  beneficiary_id?:  number
}

export const studentApi = {
  lookup: async (q: string): Promise<Student> => {
    const [extResult, bResult] = await Promise.allSettled([
      externalStudentApi.lookup(q),
      beneficiaryApi.lookup(q),
    ])
    if (extResult.status === 'rejected') throw extResult.reason
    const student = mapExternalToStudent(extResult.value)
    if (bResult.status === 'fulfilled') {
      student.is_beneficiary = true
      student.beneficiary_id = bResult.value.id
    }
    return student
  },

  registerDining: async (payload: RegisterDiningPayload): Promise<void> => {
    const beneficiaryId = payload.beneficiary_id
      ?? (await beneficiaryApi.lookup(payload.cedula)).id
    await consumptionApi.register({
      beneficiary_id:   beneficiaryId,
      lunch_session_id: payload.session_id,
      is_manual:        payload.is_manual ?? false,
    })
  },
}
