import { describe, it, expect } from 'vitest'
import { ROLE_LABEL, roleLabel, USER_TYPE_LABEL, userTypeLabel } from './labels'

// fixes.md #12 — single source of truth for user-type labels.

describe('USER_TYPE_LABEL', () => {
  it('maps every known user type to its Spanish label', () => {
    expect(USER_TYPE_LABEL).toEqual({
      STUDENT: 'Estudiante',
      TEACHER: 'Docente',
      ADMINISTRATIVE: 'Administrativo',
      WORKER: 'Obrero',
    })
  })
})

describe('userTypeLabel', () => {
  it('returns the label for a known user type', () => {
    expect(userTypeLabel('STUDENT')).toBe('Estudiante')
    expect(userTypeLabel('WORKER')).toBe('Obrero')
  })

  it('falls back to the raw value for an unknown type', () => {
    expect(userTypeLabel('UNKNOWN')).toBe('UNKNOWN')
  })
})

/**
 * Una sola definición de las etiquetas de rol. Antes había cuatro copias que además
 * divergían entre sí ('Super Administrador' frente a 'Super Admin'), y dos de ellas
 * no tenían entrada para el rol de acceso directo: la celda salía vacía en el
 * directorio y "Nombre — undefined" en la gestión de permisos.
 */
describe('ROLE_LABEL', () => {
  it('maps every role, including ACCESO_DIRECTO, to its Spanish label', () => {
    expect(ROLE_LABEL).toEqual({
      SUPER_ADMIN:    'Super Administrador',
      ADMIN:          'Administrador',
      TAQUILLERO:     'Taquillero',
      ACCESO_DIRECTO: 'Acceso Directo',
    })
  })
})

describe('roleLabel', () => {
  it('resolves ACCESO_DIRECTO to its readable label', () => {
    expect(roleLabel('ACCESO_DIRECTO')).toBe('Acceso Directo')
  })

  it('shows the raw value for an unknown role instead of breaking', () => {
    // Mientras la migración del backend no esté aplicada, `GET /roles/` sigue
    // devolviendo el valor antiguo. Debe pintarse tal cual, no romper la pantalla.
    expect(roleLabel('BENEFICIARIO')).toBe('BENEFICIARIO')
    expect(roleLabel('')).toBe('')
  })

  it('does not translate the old value into the new one', () => {
    // Traducir BENEFICIARIO → ACCESO_DIRECTO perpetuaría los dos nombres que este
    // cambio elimina.
    expect(roleLabel('BENEFICIARIO')).not.toBe('Acceso Directo')
  })
})
