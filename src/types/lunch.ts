/** Ingrediente en el formulario de crear almuerzo */
export interface LunchFormIngredient {
  ingredient_id: number
  ingredient_name: string
  category: string
  unit: string
  calculated_quantity: number
  available_quantity: number
  /** Cantidad base usada para recalcular al cambiar platos */
  quantity_per_plate: number
}

/** Plantilla de almuerzo precargado */
export interface PreloadedLunch {
  id: number
  name: string
  plate_count: number
  ingredients: Array<{
    ingredient_id: number
    ingredient_name: string
    category: string
    unit: string
    quantity_per_plate: number
  }>
}

/** Vista previa de recálculo por ingrediente */
export interface RecalculationPreview {
  ingredient_name: string
  unit: string
  previous_quantity: number
  new_quantity: number
}
