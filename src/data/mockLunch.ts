import type { LunchFormIngredient, PreloadedLunch } from '../types/lunch'

// Demo data only. Recalculation business logic lives in
// `src/utils/lunchRecalculation.ts` (fixes.md #14).

export const MOCK_PANTRY = [
  { id: 1, name: 'Papa',    category: 'Verdura',  unit: 'kg', available: 120 },
  { id: 2, name: 'Pasta',   category: 'Víveres',  unit: 'kg', available: 80 },
  { id: 3, name: 'Tomate',  category: 'Verdura',  unit: 'kg', available: 80 },
  { id: 4, name: 'Cebolla', category: 'Verdura',  unit: 'kg', available: 90 },
  { id: 5, name: 'Pollo',   category: 'Proteína', unit: 'kg', available: 50 },
  { id: 6, name: 'Arroz',   category: 'Cereal',   unit: 'kg', available: 100 },
]

export const MOCK_PRELOADED_LUNCHES: PreloadedLunch[] = [
  {
    id: 1,
    name: 'Arroz con pollo (plantilla)',
    meal_type: 'ALMUERZO',
    plate_count: 500,
    ingredients: [
      { ingredient_id: 6, ingredient_name: 'Arroz',  category: 'Cereal',   unit: 'kg', base_quantity: 60 },
      { ingredient_id: 5, ingredient_name: 'Pollo',  category: 'Proteína', unit: 'kg', base_quantity: 40 },
      { ingredient_id: 1, ingredient_name: 'Papa',   category: 'Verdura',  unit: 'kg', base_quantity: 40 },
    ],
  },
  {
    id: 2,
    name: 'Pasta con verduras (plantilla)',
    meal_type: 'ALMUERZO',
    plate_count: 400,
    ingredients: [
      { ingredient_id: 2, ingredient_name: 'Pasta',  category: 'Víveres', unit: 'kg', base_quantity: 20 },
      { ingredient_id: 3, ingredient_name: 'Tomate', category: 'Verdura', unit: 'kg', base_quantity: 8 },
      { ingredient_id: 4, ingredient_name: 'Cebolla', category: 'Verdura', unit: 'kg', base_quantity: 9 },
    ],
  },
]

export const MOCK_INITIAL_INGREDIENTS: LunchFormIngredient[] = [
  { ingredient_id: 1, ingredient_name: 'Papa',    category: 'Verdura', unit: 'kg', base_quantity: 40, base_plates: 500, calculated_quantity: 40, available_quantity: 120 },
  { ingredient_id: 2, ingredient_name: 'Pasta',   category: 'Víveres', unit: 'kg', base_quantity: 20, base_plates: 500, calculated_quantity: 20, available_quantity: 80 },
  { ingredient_id: 3, ingredient_name: 'Tomate',  category: 'Verdura', unit: 'kg', base_quantity: 8,  base_plates: 500, calculated_quantity: 8,  available_quantity: 80 },
  { ingredient_id: 4, ingredient_name: 'Cebolla', category: 'Verdura', unit: 'kg', base_quantity: 9,  base_plates: 500, calculated_quantity: 9,  available_quantity: 90 },
]
