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

/**
 * Clasificación efectiva de una fila de consumo: el tipo del padrón traducido cuando la
 * persona es un acceso directo, y el nombre de la etiqueta **tal cual** cuando es una
 * persona externa.
 *
 * Existe porque la regla estaba escrita en tres pantallas y ninguna contemplaba a la
 * gente externa, que no tiene `user_type`: el listado de la fecha la enseñaba con un
 * guion, el filtro por rol la hacía desaparecer de la tabla y su PDF la imprimía sin
 * tipo. Los dos campos nunca vienen con valor a la vez (contrato del backend).
 *
 * La etiqueta no pasa por `USER_TYPE_LABEL` a propósito: las crea quien administra el
 * comedor, así que un mapa de rótulos en el cliente solo puede quedarse corto — es lo que
 * `fe-etiquetas-gente-externa` dejó dicho. Devuelve `null` y no `'—'`: el guion es
 * decisión de cada vista (la tabla lo pinta, el PDF lo escribe, el filtro lo ignora).
 */
export function personClassLabel(
  row: { user_type?: string | null; person_type?: string | null } | null | undefined,
): string | null {
  if (!row) return null
  if (row.user_type) return userTypeLabel(row.user_type)
  return row.person_type ?? null
}
