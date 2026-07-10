/** Consumo agrupado por categoría */
export interface CategoryConsumption {
  category: string
  total: number
  color: string
}

/** Consumo por insumo individual */
export interface SupplyConsumption {
  supply_name: string
  total: number
  unit: string
}
