/** Ingrediente / Insumo del inventario */
export interface Ingredient {
  id: number
  name: string
  category: string
  unit: string
  quantity: number
  min_stock: number
  last_updated: string
  expiration_date: string | null
}

/** Alerta de stock bajo */
export interface StockAlert {
  id: number
  item_name: string
  current_stock: number
  min_stock: number
  unit: string
}

/** Categoría de alimentos del inventario */
export interface InventoryCategory {
  id: number
  name: string
  createdAt: string
  updatedAt: string | null
}

export interface InventoryCategoryCreatePayload {
  name: string
}

export interface InventoryItem {
  id: number
  name: string
  categoryId: number
  category: InventoryCategory
  currentStock: number
  unit: string
  minimumStock: number
  lastUpdatedAt: string
  createdAt: string
  updatedAt: string | null
}

export interface InventoryItemCreatePayload {
  name: string
  categoryId: number
  currentStock: number
  unit: string
  minimumStock: number
}

export interface InventoryItemUpdatePayload extends InventoryItemCreatePayload {
  stockChangeReason: string
}

/** Entrada de stock con fecha de ingreso opcional (#7). */
export interface StockIncreasePayload {
  quantity: number
  reason: string
  /** Fecha de ingreso (YYYY-MM-DD). Si se omite, el backend usa hoy. */
  entryDate?: string
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
