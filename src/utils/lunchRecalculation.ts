import type { LunchFormIngredient, PreloadedLunch } from '../types/lunch'

/**
 * Lunch ingredient recalculation logic (fixes.md #14).
 *
 * Previously this lived in `data/mockLunch.ts`, a misleading location for real
 * business logic — `data/` is now only demo data.
 */

/** Base plate count that per-plate quantities are referenced against. */
export const BASE_PLATES = 500

function roundQty(value: number): number {
  return Math.round(value * 100) / 100
}

/** Build a form ingredient from a preloaded template line, scaled to `plateCount`. */
export function buildIngredientFromTemplate(
  item: PreloadedLunch['ingredients'][0],
  plateCount: number,
  available: number,
): LunchFormIngredient {
  const calculated = roundQty(item.quantity_per_plate * plateCount)
  return {
    ingredient_id: item.ingredient_id,
    ingredient_name: item.ingredient_name,
    category: item.category,
    unit: item.unit,
    calculated_quantity: calculated,
    available_quantity: available,
    quantity_per_plate: item.quantity_per_plate,
  }
}

/** Recompute each ingredient's calculated quantity for a new plate count. */
export function recalculateIngredients(
  items: LunchFormIngredient[],
  plateCount: number,
): LunchFormIngredient[] {
  return items.map((item) => ({
    ...item,
    calculated_quantity: roundQty(item.quantity_per_plate * plateCount),
  }))
}

/** Preview the before/after quantities when changing the plate count. */
export function getRecalculationPreview(
  items: LunchFormIngredient[],
  previousPlates: number,
  newPlates: number,
) {
  return items.map((item) => ({
    ingredient_name: item.ingredient_name,
    unit: item.unit,
    previous_quantity: roundQty(item.quantity_per_plate * previousPlates),
    new_quantity: roundQty(item.quantity_per_plate * newPlates),
  }))
}
