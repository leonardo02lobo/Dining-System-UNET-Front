import { accesoDirectoApi } from './acceso_directo'
import { consumptionApi } from './consumption'
import { externalStudentApi, mapExternalToStudent } from './externalStudent'
import type { Student } from '../types/user'
import type { AccesoDirectoIdentity, ConsumptionCreate } from '../types/consumption'

interface RegisterDiningPayload {
  cedula:              string
  date:                string
  registered_by_id:    number
  session_id:          number
  is_manual?:          boolean
  acceso_directo_id?:  number
  /** Datos de la persona para el alta implícita si no es acceso directo (Issue 2). */
  person?:             AccesoDirectoIdentity
}

/** Deriva los datos mínimos de alta implícita a partir del estudiante (Issue 2). */
export function studentToIdentity(s: Student): AccesoDirectoIdentity {
  const parts = s.name.trim().split(/\s+/)
  const first_name = parts[0] ?? s.name.trim()
  const last_name = parts.length > 1 ? parts.slice(1).join(' ') : ''
  return {
    document_id: s.cedula,
    first_name,
    last_name,
    email: s.email || null,
    photo_url: s.avatar_url || null,
  }
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
    const body: ConsumptionCreate = {
      lunch_session_id: payload.session_id,
      is_manual:        payload.is_manual ?? false,
    }
    if (payload.acceso_directo_id) {
      body.acceso_directo_id = payload.acceso_directo_id
    } else if (payload.person) {
      // No es acceso directo: se envían sus datos para el alta al vuelo (Issue 2).
      body.person = payload.person
    } else {
      body.acceso_directo_id = (await accesoDirectoApi.lookup(payload.cedula)).id
    }
    await consumptionApi.register(body)
  },
}
