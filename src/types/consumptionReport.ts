/** Fila del reporte de consumo por insumo */
export interface ConsumptionReportRow {
  id: number
  supply_name: string
  category: string
  consumed_amount: number
  unit: string
  period: string
}

/** Resumen de consumo por categoría */
export interface CategoryConsumption {
  category: string
  total: number
  color: string
}

/** Consumo por insumo para gráfico de barras */
export interface SupplyConsumption {
  supply_name: string
  total: number
}
