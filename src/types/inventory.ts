/** Ingrediente / Insumo del inventario */
export interface Ingredient {
  id: number
  name: string
  category: string
  unit: string
  quantity: number
  expiration_date: string | null
}

/** Ingrediente asignado a un almuerzo */
export interface LunchIngredient {
  ingredient_id: number
  ingredient_name: string
  category: string
  unit: string
  available_quantity: number
  used_quantity: number
}

/** Almuerzo diario */
export interface Lunch {
  id: number
  date: string
  ingredients: LunchIngredient[]
  confirmed: boolean
}

/** Categorías de ingredientes */
export type IngredientCategory =
  | 'Verdura'
  | 'Fruta'
  | 'Proteína'
  | 'Cereal'
  | 'Lácteo'
  | 'Condimento'
  | 'Otro'

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  'Verdura', 'Fruta', 'Proteína', 'Cereal', 'Lácteo', 'Condimento', 'Otro',
]

export const UNIT_OPTIONS = ['kg', 'g', 'L', 'mL', 'unidad', 'docena', 'paquete']
