import type { UserType } from '../types/acceso_directo'

/** Single source of truth for beneficiary user-type display labels (fixes.md #12). */
export const USER_TYPE_LABEL: Record<UserType, string> = {
  STUDENT:        'Estudiante',
  TEACHER:        'Docente',
  ADMINISTRATIVE: 'Administrativo',
  WORKER:         'Obrero',
}

/** Label for a (possibly untyped) user_type string, falling back to the raw value. */
export function userTypeLabel(value: string): string {
  return USER_TYPE_LABEL[value as UserType] ?? value
}
