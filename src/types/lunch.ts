import type { InventoryItem } from './inventory'

/** Ingrediente en el formulario de crear almuerzo */
export interface LunchFormIngredient {
  ingredient_id: number
  ingredient_name: string
  category: string
  unit: string
  /**
   * Cantidad ORIGINAL del ingrediente, referida a `base_plates` platos.
   * Es el único dato de entrada del recálculo: nunca se sobrescribe con un
   * valor ya recalculado (evita el arrastre de error entre cambios sucesivos).
   */
  base_quantity: number
  /** Cantidad base de platos a la que corresponde `base_quantity`. Siempre > 0. */
  base_plates: number
  /** Cantidad derivada para la cantidad de platos vigente (solo presentación). */
  calculated_quantity: number
  available_quantity: number
}

/** Plantilla de almuerzo precargado */
export interface PreloadedLunch {
  id: number
  name: string
  /** Cantidad base de platos de la plantilla (denominador de la regla de tres). */
  plate_count: number
  ingredients: Array<{
    ingredient_id: number
    ingredient_name: string
    category: string
    unit: string
    /** Cantidad original del ingrediente para `plate_count` platos. */
    base_quantity: number
  }>
}

/** Vista previa de recálculo por ingrediente */
export interface RecalculationPreview {
  ingredient_id: number
  ingredient_name: string
  unit: string
  /** Platos a los que corresponde `base_quantity`. */
  base_plates: number
  /** Cantidad original inmutable, tal como se registró. */
  base_quantity: number
  /** Cantidad para la cantidad de platos vigente del formulario. */
  previous_quantity: number
  /** Cantidad recalculada para la cantidad de platos deseada. */
  new_quantity: number
}

export type LunchStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'

export interface LunchIngredientPayload {
  inventoryItemId: number
  baseQuantity: number
  calculatedQuantity: number
  unit: string
}

export interface LunchCreatePayload {
  name: string
  date: string
  platesQuantity: number
  basePlatesQuantity: number
  ingredients: LunchIngredientPayload[]
}

export interface LunchUpdatePayload {
  name?: string
  date?: string
  platesQuantity?: number
}

export interface LunchTemplateCreatePayload extends LunchCreatePayload {
  lunchId: number
}

/** Ingrediente enviado al crear/editar una plantilla */
export interface LunchTemplateIngredientPayload {
  inventoryItemId: number
  baseQuantity: number
  unit?: string
}

export interface LunchTemplateUpdatePayload {
  name?: string
  basePlatesQuantity?: number
  platesQuantity?: number
  ingredients?: LunchTemplateIngredientPayload[]
}

export interface LunchStockValidationItem {
  inventoryItemId: number
  ingredientId: number
  name: string
  requiredQuantity: number
  availableStock: number
  unit: string
  isSufficient: boolean
  missingQuantity: number
}

export interface LunchStockValidationResponse {
  lunchId: number
  isValid: boolean
  items: LunchStockValidationItem[]
}

export interface LunchResponse {
  id: number
  name: string
  date: string
  platesQuantity: number
  basePlatesQuantity: number
  status: LunchStatus
  createdById: number
  createdAt: string
  updatedAt: string
  ingredients: LunchIngredientResponse[]
}

export interface LunchTemplateIngredientResponse {
  id: number
  templateId: number
  inventoryItemId: number
  inventoryItem: InventoryItem
  baseQuantity: number
  unit: string
}

export interface LunchTemplateResponse {
  id: number
  name: string
  date: string
  platesQuantity: number
  basePlatesQuantity: number
  createdById: number
  createdAt: string
  updatedAt: string
  ingredients: LunchTemplateIngredientResponse[]
}

export interface LunchIngredientResponse {
  id: number
  lunchId: number
  inventoryItemId: number
  inventoryItem: InventoryItem
  baseQuantity: number
  calculatedQuantity: number
  unit: string
  createdAt: string
  updatedAt: string
}
