import { accesoDirectoApi } from './acceso_directo'
import { consumptionApi } from './consumption'
import { externalPersonApi } from './externalPerson'
import { externalStudentApi, mapExternalToStudent } from './externalStudent'
import type { ExternalPerson } from '../types/externalPerson'
import type { Student } from '../types/user'
import type { AccesoDirectoIdentity, ConsumptionCreate } from '../types/consumption'

interface RegisterDiningPayload {
  cedula:              string
  date:                string
  registered_by_id:    number
  session_id:          number
  is_manual?:          boolean
  acceso_directo_id?:  number
  /** Identificador de la persona externa. Tiene prioridad sobre el alta al vuelo. */
  external_person_id?: number
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
    // Sin estos dos, el acceso directo se creaba con carrera y tipo vacíos y la
    // columna "Carrera" salía en blanco en historial, registro manual y PDFs.
    career: s.career || null,
    user_type: s.user_type || 'STUDENT',
    // El sexo llega del padrón. Se omite cuando no está clasificado: un valor vacío
    // nunca debe pisar el que ya tenga guardado el acceso directo.
    gender: s.gender || undefined,
  }
}

/** Adapta la persona externa al `Student` que pintan las pantallas de comedor. */
export function externalPersonToStudent(p: ExternalPerson): Student {
  return {
    cedula:            p.document_id,
    name:              `${p.first_name} ${p.last_name}`.trim(),
    email:             p.email ?? '',
    career:            p.career ?? '',
    // No sale del padrón universitario, así que no tiene tipo de usuario. Lo que la
    // clasifica es su etiqueta, y va en su propio campo.
    user_type:         '',
    // A la gente externa no se la sanciona; su equivalente de la baja es el estado.
    is_suspended:      false,
    avatar_url:        p.photo_url ?? undefined,
    is_acceso_directo: false,
    person_kind:       'external',
    external_person_id: p.id,
    external_label:    p.label,
    gender:            p.gender ?? null,
  }
}

export const studentApi = {
  /**
   * Busca a la persona en los **tres** padrones y falla solo si fallan los tres.
   *
   * Antes lanzaba en cuanto fallaba el padrón de estudiantes, de modo que una
   * persona externa —que por definición no está en él— nunca llegaba a mostrarse en
   * la taquilla. Sin ficha en pantalla tampoco se armaba el atajo de flechas, que es
   * por lo que "la flecha hacia abajo no hacía nada".
   */
  lookup: async (q: string): Promise<Student> => {
    const [extResult, adResult, externalResult] = await Promise.allSettled([
      externalStudentApi.lookup(q),
      accesoDirectoApi.lookup(q),
      externalPersonApi.lookup(q),
    ])

    // Precedencia: el padrón es la base de la ficha y la fuente autoritativa de la
    // carrera; la persona externa solo sirve de base cuando los otros dos fallaron.
    let student: Student
    if (extResult.status === 'fulfilled') {
      student = mapExternalToStudent(extResult.value)
    } else if (adResult.status === 'fulfilled') {
      const ad = adResult.value
      student = {
        cedula:            ad.document_id,
        name:              `${ad.first_name} ${ad.last_name}`.trim(),
        email:             ad.email ?? '',
        career:            ad.career ?? '',
        user_type:         ad.user_type || 'STUDENT',
        is_suspended:      false,
        avatar_url:        ad.photo_url ?? undefined,
        is_acceso_directo: false,
        person_kind:       'acceso_directo',
        gender:            ad.gender ?? null,
      }
    } else if (externalResult.status === 'fulfilled') {
      return externalPersonToStudent(externalResult.value)
    } else {
      // No está en ninguna parte. El mensaje no dice cuál de las tres búsquedas
      // falló: al taquillero le da igual, y decirlo solo confunde.
      throw extResult.reason
    }

    if (adResult.status === 'fulfilled') {
      const ad = adResult.value
      student.is_acceso_directo = true
      student.acceso_directo_id = ad.id
      student.person_kind = 'acceso_directo'
      // El acceso directo es la fuente autoritativa de tipo de usuario (docente,
      // obrero, administrativo…). Solo se sobrescribe cuando trae valor.
      student.user_type = ad.user_type || student.user_type
      // La carrera, en cambio, la manda el padrón: se recarga del CSV oficial cada
      // semestre, mientras que la del acceso directo se escribió a mano una vez y
      // queda obsoleta al cambiar de carrera. Para quien no es estudiante el padrón
      // no tiene carrera, así que ahí sí vale la del acceso directo (su departamento).
      student.career = student.career || ad.career || ''
    }
    return student
  },

  registerDining: async (payload: RegisterDiningPayload): Promise<void> => {
    const body: ConsumptionCreate = {
      lunch_session_id: payload.session_id,
      is_manual:        payload.is_manual ?? false,
    }
    if (payload.external_person_id) {
      // Persona externa: se envía su identificador propio. Mandar `person` la daría
      // de alta como acceso directo con la misma cédula — la misma persona en dos
      // padrones y contada dos veces en las estadísticas.
      body.external_person_id = payload.external_person_id
    } else if (payload.acceso_directo_id) {
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
