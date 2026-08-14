import { describe, it, expect } from 'vitest'
import { previousConsumptionMessage, isOtherSedeConsumption } from './consumptionNotice'
import type { DayConsumptionRef } from '../types/consumption'

/**
 * El texto vive en un módulo compartido para que la taquilla y el registro manual no
 * describan el mismo hecho de dos maneras. Estas pruebas fijan la distinción que se le
 * añadió: **haber comido en otra sede no se cuenta igual que haber comido aquí**.
 */

const BASE: DayConsumptionRef = {
  id: 1,
  registered_at: '2026-08-11T12:15:00Z',
  is_manual: false,
  lunch_session_id: 8,
  sede_name: 'San Cristóbal',
}

describe('previousConsumptionMessage', () => {
  it('lleva el dónde al principio cuando la sede es otra', () => {
    const msg = previousConsumptionMessage(BASE, { currentSedeName: 'Paramillo' })

    expect(msg).toContain('en otra sede: San Cristóbal')
    expect(msg).toContain('registrado en taquilla')
  })

  it('mantiene la redacción de siempre dentro de la propia sede', () => {
    const msg = previousConsumptionMessage(BASE, { currentSedeName: 'San Cristóbal' })

    expect(msg).not.toContain('otra sede')
    expect(msg).toContain('en la sede San Cristóbal')
  })

  it('sin sede de referencia no afirma que fuera otra', () => {
    // El registro manual llama sin sede: no tiene una con la que comparar.
    expect(previousConsumptionMessage(BASE)).not.toContain('otra sede')
  })

  it('distingue el origen manual', () => {
    const msg = previousConsumptionMessage(
      { ...BASE, is_manual: true },
      { currentSedeName: 'Paramillo' },
    )

    expect(msg).toContain('registrado manualmente')
  })
})

describe('isOtherSedeConsumption', () => {
  it('es verdadero solo con los dos nombres y distintos', () => {
    expect(isOtherSedeConsumption(BASE, 'Paramillo')).toBe(true)
    expect(isOtherSedeConsumption(BASE, 'San Cristóbal')).toBe(false)
  })

  it('con un nombre ausente no se pronuncia', () => {
    // No saber una de las dos sedes no es saber que son distintas: afirmarlo pondría
    // un aviso de "otra sede" sobre un consumo de la propia.
    expect(isOtherSedeConsumption(BASE, null)).toBe(false)
    expect(isOtherSedeConsumption({ ...BASE, sede_name: null }, 'Paramillo')).toBe(false)
  })
})
