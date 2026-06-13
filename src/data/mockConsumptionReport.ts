import type {
  CategoryConsumption,
  ConsumptionReportRow,
  SupplyConsumption,
} from '../types/consumptionReport'

export const MOCK_CONSUMPTION_ROWS: ConsumptionReportRow[] = [
  { id: 1, supply_name: 'Papa', category: 'Verdura', consumed_amount: 40, unit: 'kg', date_from: '23/05', date_to: '12/08' },
  { id: 2, supply_name: 'Pasta', category: 'Víveres', consumed_amount: 20, unit: 'kg', date_from: '23/05', date_to: '12/08' },
  { id: 3, supply_name: 'Tomate', category: 'Verdura', consumed_amount: 8, unit: 'kg', date_from: '23/05', date_to: '12/08' },
  { id: 4, supply_name: 'Cebolla', category: 'Verdura', consumed_amount: 9, unit: 'kg', date_from: '23/05', date_to: '12/08' },
  { id: 5, supply_name: 'Aceite', category: 'Víveres', consumed_amount: 20, unit: 'L', date_from: '23/05', date_to: '12/08' },
  { id: 6, supply_name: 'Leche', category: 'Víveres', consumed_amount: 18, unit: 'L', date_from: '23/05', date_to: '12/08' },
]

export const MOCK_CATEGORY_CONSUMPTION: CategoryConsumption[] = [
  { category: 'Víveres',  total: 58, color: '#03216a' },
  { category: 'Verduras', total: 57, color: '#34c759' },
  { category: 'Proteína', total: 15, color: '#f59e0b' },
  { category: 'Lácteo',   total: 8,  color: '#ef4444' },
  { category: 'Otro',     total: 5,  color: '#8b5cf6' },
]

export const MOCK_SUPPLY_CONSUMPTION: SupplyConsumption[] = [
  { supply_name: 'Papa',    total: 40, unit: 'kg' },
  { supply_name: 'Pasta',   total: 20, unit: 'kg' },
  { supply_name: 'Tomate',  total: 8,  unit: 'kg' },
  { supply_name: 'Aceite',  total: 20, unit: 'L'  },
  { supply_name: 'Leche',   total: 18, unit: 'L'  },
  { supply_name: 'Cebolla', total: 9,  unit: 'kg' },
]
