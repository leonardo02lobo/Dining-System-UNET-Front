import type { Ingredient, StockAlert } from '../types/inventory'

export const MOCK_INVENTORY_ITEMS: Ingredient[] = [
  { id: 1, name: 'Papa',       category: 'Verdura',  unit: 'kg', quantity: 40, min_stock: 100, last_updated: '24/05/2026', expiration_date: '2026-06-10' },
  { id: 2, name: 'Tomate',     category: 'Verdura',  unit: 'kg', quantity: 55, min_stock: 30,  last_updated: '23/05/2026', expiration_date: '2026-06-05' },
  { id: 3, name: 'Mantequilla',category: 'Lácteo',   unit: 'kg', quantity: 25, min_stock: 30,  last_updated: '22/05/2026', expiration_date: '2026-07-01' },
  { id: 4, name: 'Azúcar',     category: 'Condimento', unit: 'kg', quantity: 40, min_stock: 60, last_updated: '21/05/2026', expiration_date: '2026-12-31' },
]

export const MOCK_STOCK_ALERTS: StockAlert[] = [
  { id: 1, item_name: 'Mantequilla', current_stock: 25, min_stock: 30, unit: 'kg' },
  { id: 2, item_name: 'Azúcar',     current_stock: 40, min_stock: 60, unit: 'kg' },
]

export function getInventorySummary(items: Ingredient[]) {
  const lowStockCount = items.filter((i) => i.quantity < i.min_stock).length
  const lastUpdate = items.reduce((latest, item) => {
    return item.last_updated > latest ? item.last_updated : latest
  }, items[0]?.last_updated ?? '—')

  return {
    totalItems: items.length,
    lowStockCount,
    lastUpdate,
  }
}
