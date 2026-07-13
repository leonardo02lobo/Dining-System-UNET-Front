import type { InventoryItem } from './inventory'

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

export type LunchStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED'

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

export interface LunchTemplateCreatePayload extends LunchCreatePayload {
  lunchId: number
}

export interface LunchTemplateUpdatePayload {
  name?: string
  basePlatesQuantity?: number
  platesQuantity?: number
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
  ingredients: unknown[]
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
  ingredients: unknown[]
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
