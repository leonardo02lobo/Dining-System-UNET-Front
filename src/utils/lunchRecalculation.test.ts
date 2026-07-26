import { describe, it, expect } from 'vitest'
import {
  BASE_PLATES,
  buildIngredientFromTemplate,
  displayQuantity,
  formatQuantity,
  formatStock,
  getRecalculationPreview,
  isDiscreteUnit,
  isValidPlateCount,
  payloadQuantity,
  quantityPerPlate,
  recalculateIngredients,
  scaleIngredient,
  scaleQuantity,
} from './lunchRecalculation'
import type { LunchFormIngredient } from '../types/lunch'

// fixes.md #14 — recalculation logic moved out of data/mockLunch.ts.

function ingredient(overrides: Partial<LunchFormIngredient> = {}): LunchFormIngredient {
  return {
    ingredient_id: 1,
    ingredient_name: 'Papa',
    category: 'Verdura',
    unit: 'kg',
    base_quantity: 10,
    base_plates: 30,
    calculated_quantity: 10,
    available_quantity: 100,
    ...overrides,
  }
}

/** Caso del criterio de aceptación: 30 platos ⇒ 10 kg de papa. */
const papa = ingredient()

describe('BASE_PLATES', () => {
  it('is 500', () => {
    expect(BASE_PLATES).toBe(500)
  })
})

describe('scaleQuantity (regla de tres)', () => {
  it('aumenta proporcionalmente: 10 kg / 30 platos → 35 platos ≈ 11,67 kg', () => {
    expect(scaleQuantity(10, 30, 35)).toBeCloseTo(11.6667, 4)
    expect(displayQuantity(scaleQuantity(10, 30, 35), 'kg')).toBe(11.67)
  })

  it('disminuye proporcionalmente: 20 platos ≈ 6,67 kg', () => {
    expect(scaleQuantity(10, 30, 20)).toBeCloseTo(6.6667, 4)
    expect(displayQuantity(scaleQuantity(10, 30, 20), 'kg')).toBe(6.67)
  })

  it('mantiene la cantidad cuando los platos no cambian', () => {
    expect(scaleQuantity(10, 30, 30)).toBe(10)
  })

  it('conserva la precisión completa: no redondea el cálculo intermedio', () => {
    expect(scaleQuantity(10, 30, 35)).not.toBe(11.67)
  })

  it('opera con cantidades base decimales', () => {
    expect(scaleQuantity(0.125, 30, 35)).toBeCloseTo(0.1458333, 6)
    expect(displayQuantity(scaleQuantity(2.5, 40, 100), 'L')).toBe(6.25)
  })

  it('devuelve 0 si la cantidad base de platos es cero', () => {
    expect(scaleQuantity(10, 0, 35)).toBe(0)
  })

  it('devuelve 0 con platos base negativos, NaN o Infinity', () => {
    expect(scaleQuantity(10, -30, 35)).toBe(0)
    expect(scaleQuantity(10, Number.NaN, 35)).toBe(0)
    expect(scaleQuantity(10, Number.POSITIVE_INFINITY, 35)).toBe(0)
  })

  it('rechaza platos deseados negativos y cantidades negativas', () => {
    expect(scaleQuantity(10, 30, -5)).toBe(0)
    expect(scaleQuantity(-10, 30, 35)).toBe(0)
  })

  it('devuelve 0 platos → 0 de ingrediente', () => {
    expect(scaleQuantity(10, 30, 0)).toBe(0)
  })
})

describe('isValidPlateCount', () => {
  it('exige un número finito mayor que cero', () => {
    expect(isValidPlateCount(30)).toBe(true)
    expect(isValidPlateCount(0)).toBe(false)
    expect(isValidPlateCount(-1)).toBe(false)
    expect(isValidPlateCount(Number.NaN)).toBe(false)
  })
})

describe('redondeo por unidad', () => {
  it('trata kg, L, g y mL como continuas', () => {
    expect(isDiscreteUnit('kg')).toBe(false)
    expect(isDiscreteUnit('L')).toBe(false)
    expect(isDiscreteUnit('mL')).toBe(false)
  })

  it('trata unidad, docena y paquete como discretas (sin distinguir mayúsculas)', () => {
    expect(isDiscreteUnit('unidad')).toBe(true)
    expect(isDiscreteUnit('Docena')).toBe(true)
    expect(isDiscreteUnit(' PAQUETE ')).toBe(true)
  })

  it('muestra dos decimales en unidades continuas', () => {
    expect(displayQuantity(11.666666, 'kg')).toBe(11.67)
    expect(displayQuantity(6.666666, 'L')).toBe(6.67)
  })

  it('redondea hacia arriba las unidades discretas: no se sirve media unidad', () => {
    expect(displayQuantity(11.01, 'unidad')).toBe(12)
    expect(displayQuantity(12, 'unidad')).toBe(12)
    expect(scaleQuantity(30, 30, 35)).toBe(35)
  })

  it('conserva más decimales al persistir que al mostrar', () => {
    expect(payloadQuantity(11.666666, 'kg')).toBe(11.667)
    expect(payloadQuantity(11.01, 'unidad')).toBe(12)
  })

  it('no arrastra el sesgo binario en el redondeo half-up', () => {
    expect(displayQuantity(1.005, 'kg')).toBe(1.01)
    expect(displayQuantity(2.675, 'kg')).toBe(2.68)
  })
})

describe('formatQuantity', () => {
  it('formatea con coma decimal (es-VE) y unidad', () => {
    expect(formatQuantity(11.666666, 'kg')).toBe('11,67 kg')
    expect(formatQuantity(10, 'kg')).toBe('10 kg')
  })

  it('formatea las unidades discretas sin decimales', () => {
    expect(formatQuantity(11.2, 'unidad')).toBe('12 unidad')
  })

  it('formatStock nunca redondea hacia arriba una existencia', () => {
    expect(formatStock(11.2, 'unidad')).toBe('11,2 unidad')
    expect(formatStock(11.666666, 'kg')).toBe('11,67 kg')
  })
})

describe('recalculateIngredients', () => {
  it('recalcula todos los ingredientes de la lista', () => {
    const items = [
      papa,
      ingredient({ ingredient_id: 2, ingredient_name: 'Arroz', base_quantity: 6, base_plates: 30 }),
    ]
    const result = recalculateIngredients(items, 35)

    expect(result.map((i) => i.calculated_quantity)).toEqual([11.67, 7])
  })

  it('aumenta y disminuye desde la misma cantidad original', () => {
    expect(recalculateIngredients([papa], 35)[0].calculated_quantity).toBe(11.67)
    expect(recalculateIngredients([papa], 20)[0].calculated_quantity).toBe(6.67)
    expect(recalculateIngredients([papa], 30)[0].calculated_quantity).toBe(10)
  })

  it('no acumula error tras cambios sucesivos de platos', () => {
    // 30 → 35 → 20 → 30 debe devolver exactamente la cantidad original.
    const step1 = recalculateIngredients([papa], 35)
    const step2 = recalculateIngredients(step1, 20)
    const step3 = recalculateIngredients(step2, 30)

    expect(step3[0].calculated_quantity).toBe(10)
    expect(step3[0].base_quantity).toBe(10)
    expect(step3[0].base_plates).toBe(30)
  })

  it('conserva la cantidad original y la base de platos intactas', () => {
    const [result] = recalculateIngredients([papa], 1000)
    expect(result.base_quantity).toBe(10)
    expect(result.base_plates).toBe(30)
  })

  it('deja el cálculo en cero si la base de platos del ingrediente es inválida', () => {
    const corrupto = ingredient({ base_plates: 0 })
    expect(recalculateIngredients([corrupto], 35)[0].calculated_quantity).toBe(0)
  })

  it('no muta la lista recibida', () => {
    const items = [papa]
    recalculateIngredients(items, 1000)
    expect(items[0].calculated_quantity).toBe(10)
  })
})

describe('scaleIngredient / quantityPerPlate', () => {
  it('escala un ingrediente sin redondear', () => {
    expect(scaleIngredient(papa, 35)).toBeCloseTo(11.6667, 4)
  })

  it('deriva la cantidad por plato del par original', () => {
    expect(quantityPerPlate(papa)).toBeCloseTo(0.3333, 4)
  })
})

describe('getRecalculationPreview', () => {
  it('muestra la original, la actual y la recalculada', () => {
    const [preview] = getRecalculationPreview([papa], 30, 35)

    expect(preview).toEqual({
      ingredient_id: 1,
      ingredient_name: 'Papa',
      unit: 'kg',
      base_plates: 30,
      base_quantity: 10,
      previous_quantity: 10,
      new_quantity: 11.67,
    })
  })

  it('refleja también las disminuciones', () => {
    const [preview] = getRecalculationPreview([papa], 30, 20)
    expect(preview.new_quantity).toBe(6.67)
  })

  it('iguala ambas columnas cuando no cambia la cantidad de platos', () => {
    const [preview] = getRecalculationPreview([papa], 30, 30)
    expect(preview.previous_quantity).toBe(preview.new_quantity)
  })
})

describe('buildIngredientFromTemplate', () => {
  it('toma la cantidad de la plantilla como cantidad original', () => {
    const result = buildIngredientFromTemplate(
      { ingredient_id: 5, ingredient_name: 'Pollo', category: 'Proteína', unit: 'kg', base_quantity: 40 },
      500,
      50,
    )

    expect(result).toEqual({
      ingredient_id: 5,
      ingredient_name: 'Pollo',
      category: 'Proteína',
      unit: 'kg',
      base_quantity: 40,
      base_plates: 500,
      calculated_quantity: 40,
      available_quantity: 50,
    })
  })

  it('no admite una plantilla con base de platos cero', () => {
    const result = buildIngredientFromTemplate(
      { ingredient_id: 5, ingredient_name: 'Pollo', category: 'Proteína', unit: 'kg', base_quantity: 40 },
      0,
      50,
    )

    expect(result.base_plates).toBe(1)
    expect(scaleIngredient(result, 2)).toBe(80)
  })
})
