/** Fila del reporte de consumo de insumos */
export interface ConsumptionReportRow {
  id: number
  supply_name: string
  category: string
  consumed_amount: number
  unit: string
  period: string
}

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
