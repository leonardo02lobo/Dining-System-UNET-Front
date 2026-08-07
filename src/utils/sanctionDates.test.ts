import { describe, it, expect } from 'vitest'
import {
  MAX_SANCTION_DAYS,
  maxSanctionEndDate,
  validateSanctionEndDate,
} from './sanctionDates'

/**
 * El atributo `max` de un `<input type="date">` acota el calendario pero no impide
 * teclear la fecha a mano. Sin esta validación previa, el formulario dependería del
 * 422 del servidor para un error que puede señalar junto al campo.
 */

const TODAY = '2026-08-06'

describe('maxSanctionEndDate', () => {
  it('is exactly MAX_SANCTION_DAYS after the start date', () => {
    expect(MAX_SANCTION_DAYS).toBe(365)
    expect(maxSanctionEndDate(TODAY)).toBe('2027-08-06')
  })

  it('crosses month and year boundaries without drifting', () => {
    expect(maxSanctionEndDate('2026-12-31')).toBe('2027-12-31')
    // 2028 es bisiesto: 365 días desde el 01-03-2027 caen en el 29-02-2028.
    expect(maxSanctionEndDate('2027-03-01')).toBe('2028-02-29')
  })
})

describe('validateSanctionEndDate', () => {
  it('accepts a date inside the allowed window', () => {
    expect(validateSanctionEndDate('2026-09-01', { indefinite: false, start: TODAY })).toBeNull()
    expect(validateSanctionEndDate(TODAY, { indefinite: false, start: TODAY })).toBeNull()
    expect(validateSanctionEndDate('2027-08-06', { indefinite: false, start: TODAY })).toBeNull()
  })

  it('rejects a hand-typed date past the limit before any API call', () => {
    const error = validateSanctionEndDate('2027-08-07', { indefinite: false, start: TODAY })
    expect(error).toContain('365')
  })

  it('rejects a date before the start date', () => {
    expect(validateSanctionEndDate('2026-08-05', { indefinite: false, start: TODAY }))
      .toBe('La fecha de fin no puede ser anterior a hoy.')
  })

  it('rejects an empty field: an indefinite suspension must be chosen on purpose', () => {
    expect(validateSanctionEndDate('', { indefinite: false, start: TODAY }))
      .toBe('Indica la fecha de fin o marca "Indefinida".')
  })

  it('rejects a malformed value', () => {
    expect(validateSanctionEndDate('06/08/2026', { indefinite: false, start: TODAY }))
      .toBe('La fecha de fin no es válida.')
  })

  it('validates nothing when "Indefinida" is checked', () => {
    // La suspensión indefinida es válida por contrato: `end_date: null`.
    expect(validateSanctionEndDate('', { indefinite: true, start: TODAY })).toBeNull()
    expect(validateSanctionEndDate('2999-01-01', { indefinite: true, start: TODAY })).toBeNull()
  })
})
