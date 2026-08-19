import { studentToIdentity } from '../api/student'
import type { Student } from '../types/user'
import type { SanctionPersonTarget } from '../types/sanction'

/**
 * A quién se suspende, en los términos que entiende el backend.
 *
 * Las tres pantallas que suspenden (registro, suspensión y el listado) atienden a
 * las mismas tres clases de persona, y elegir mal el identificador es lo que antes
 * dejaba fuera a media taquilla: la gente externa no tiene acceso directo, y quien
 * está en el padrón pero nunca ha comido tampoco lo tiene todavía —para ese último
 * se envían sus datos y el servidor lo da de alta al vuelo—.
 */
export function suspensionTarget(student: Student): SanctionPersonTarget {
  if (student.person_kind === 'external' && student.external_person_id) {
    return { external_person_id: student.external_person_id }
  }
  if (student.acceso_directo_id) {
    return { acceso_directo_id: student.acceso_directo_id }
  }
  return { person: studentToIdentity(student) }
}
