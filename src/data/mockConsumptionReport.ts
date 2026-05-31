import type {
  CategoryConsumption,
  ConsumptionReportRow,
  SupplyConsumption,
} from '../types/consumptionReport'

export const MOCK_CONSUMPTION_ROWS: ConsumptionReportRow[] = [
  { id: 1, supply_name: 'Papa',    category: 'Verdura',  consumed_amount: 40, unit: 'kg', period: '23/05 - 12/08' },
  { id: 2, supply_name: 'Pasta',   category: 'Víveres',  consumed_amount: 20, unit: 'kg', period: '23/05 - 12/08' },
  { id: 3, supply_name: 'Tomate',  category: 'Verdura',  consumed_amount: 8,  unit: 'kg', period: '23/05 - 12/08' },
  { id: 4, supply_name: 'Cebolla', category: 'Verdura',  consumed_amount: 9,  unit: 'kg', period: '23/05 - 12/08' },
  { id: 5, supply_name: 'Aceite',  category: 'Víveres',  consumed_amount: 20, unit: 'L',  period: '23/05 - 12/08' },
  { id: 6, supply_name: 'Leche',   category: 'Víveres',  consumed_amount: 18, unit: 'L',  period: '23/05 - 12/08' },
]

export const MOCK_CATEGORY_CONSUMPTION: CategoryConsumption[] = [
  { category: 'Víveres',  total: 228, color: '#2563eb' },
  { category: 'Verduras', total: 216, color: '#34c759' },
]

export const MOCK_SUPPLY_CONSUMPTION: SupplyConsumption[] = [
  { supply_name: 'Papa',    total: 40 },
  { supply_name: 'Pasta',   total: 20 },
  { supply_name: 'Tomate',  total: 8 },
  { supply_name: 'Cebolla', total: 9 },
  { supply_name: 'Aceite',  total: 20 },
  { supply_name: 'Leche',   total: 18 },
]

export function formatDisplayDate(isoDate: string) {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}
