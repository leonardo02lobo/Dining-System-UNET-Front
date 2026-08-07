import type { UserType } from '../types/acceso_directo'
import type { RoleName } from '../types/auth'

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

/**
 * Única definición de las etiquetas de rol. Sustituye a las cuatro copias que vivían
 * en `UserFormModal`, `Header`, `ListUser` y `PermissionsPage`: además de dejar sin
 * etiqueta al rol de acceso directo en dos de ellas, divergían en el texto del mismo
 * rol ('Super Administrador' frente a 'Super Admin'), que es justo el mecanismo por
 * el que se coló el fallo.
 */
export const ROLE_LABEL: Record<RoleName, string> = {
  SUPER_ADMIN:    'Super Administrador',
  ADMIN:          'Administrador',
  TAQUILLERO:     'Taquillero',
  ACCESO_DIRECTO: 'Acceso Directo',
}

/**
 * Etiqueta de un rol recibido del servidor, con respaldo al valor crudo.
 *
 * El respaldo no es defensivo por costumbre: mientras la migración del backend no
 * renombre el valor del enum, `GET /roles/` sigue devolviendo `BENEFICIARIO`. Ese
 * valor debe pintarse tal cual en lugar de romper la pantalla. No se traduce
 * `BENEFICIARIO → ACCESO_DIRECTO` a propósito: perpetuaría los dos nombres que este
 * cambio elimina.
 */
export function roleLabel(value: string): string {
  return ROLE_LABEL[value as RoleName] ?? value
}
