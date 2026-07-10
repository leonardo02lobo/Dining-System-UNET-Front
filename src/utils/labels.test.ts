import { describe, it, expect } from 'vitest'
import { USER_TYPE_LABEL, userTypeLabel } from './labels'

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
