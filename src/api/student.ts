import { accesoDirectoApi } from './acceso_directo'
import { consumptionApi } from './consumption'
import { externalStudentApi, mapExternalToStudent } from './externalStudent'
import type { Student } from '../types/user'

interface RegisterDiningPayload {
  cedula:              string
  date:                string
  registered_by_id:    number
  session_id:          number
  is_manual?:          boolean
  acceso_directo_id?:  number
}

export const studentApi = {
  lookup: async (q: string): Promise<Student> => {
    const [extResult, adResult] = await Promise.allSettled([
      externalStudentApi.lookup(q),
      accesoDirectoApi.lookup(q),
    ])
    if (extResult.status === 'rejected') throw extResult.reason
    const student = mapExternalToStudent(extResult.value)
    if (adResult.status === 'fulfilled') {
      student.is_acceso_directo = true
      student.acceso_directo_id = adResult.value.id
    }
    return student
  },

  registerDining: async (payload: RegisterDiningPayload): Promise<void> => {
    const accesoDirectoId = payload.acceso_directo_id
      ?? (await accesoDirectoApi.lookup(payload.cedula)).id
    await consumptionApi.register({
      acceso_directo_id: accesoDirectoId,
      lunch_session_id:  payload.session_id,
      is_manual:         payload.is_manual ?? false,
    })
  },
}
