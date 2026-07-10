import { describe, it, expect } from 'vitest'
import {
  BASE_PLATES,
  buildIngredientFromTemplate,
  getRecalculationPreview,
  recalculateIngredients,
} from './lunchRecalculation'
import type { LunchFormIngredient } from '../types/lunch'

// fixes.md #14 — recalculation logic moved out of data/mockLunch.ts.

const ingredients: LunchFormIngredient[] = [
  {
    ingredient_id: 1,
    ingredient_name: 'Arroz',
    category: 'Cereal',
    unit: 'kg',
    calculated_quantity: 60,
    available_quantity: 100,
    quantity_per_plate: 0.12,
  },
]

describe('BASE_PLATES', () => {
  it('is 500', () => {
    expect(BASE_PLATES).toBe(500)
  })
})

describe('recalculateIngredients', () => {
  it('recomputes calculated_quantity for a new plate count', () => {
    const [result] = recalculateIngredients(ingredients, 1000)
    expect(result.calculated_quantity).toBe(120)
  })

  it('rounds to two decimals', () => {
    const [result] = recalculateIngredients(ingredients, 333)
    // 0.12 * 333 = 39.96
    expect(result.calculated_quantity).toBe(39.96)
  })

  it('does not mutate the input', () => {
    recalculateIngredients(ingredients, 1000)
    expect(ingredients[0].calculated_quantity).toBe(60)
  })
})

describe('getRecalculationPreview', () => {
  it('returns previous and new quantities per ingredient', () => {
    const [preview] = getRecalculationPreview(ingredients, 500, 1000)
    expect(preview).toEqual({
      ingredient_name: 'Arroz',
      unit: 'kg',
      previous_quantity: 60,
      new_quantity: 120,
    })
  })
})

describe('buildIngredientFromTemplate', () => {
  it('scales the template line to the plate count', () => {
    const result = buildIngredientFromTemplate(
      { ingredient_id: 5, ingredient_name: 'Pollo', category: 'Proteína', unit: 'kg', quantity_per_plate: 0.08 },
      500,
      50,
    )
    expect(result).toEqual({
      ingredient_id: 5,
      ingredient_name: 'Pollo',
      category: 'Proteína',
      unit: 'kg',
      calculated_quantity: 40,
      available_quantity: 50,
      quantity_per_plate: 0.08,
    })
  })
})
