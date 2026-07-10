import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InventorySummaryPanel } from './InventorySummaryPanel'
import type { Ingredient, StockAlert } from '../../types/inventory'

// fixes.md #5 — the summary must be computed from the real items passed in,
// not from mock data.

const items: Ingredient[] = [
  { id: 1, name: 'Papa', category: 'Verdura', unit: 'kg', quantity: 40, min_stock: 100, last_updated: '24/5/2026', expiration_date: null },
  { id: 2, name: 'Tomate', category: 'Verdura', unit: 'kg', quantity: 55, min_stock: 30, last_updated: '2/6/2026', expiration_date: null },
  { id: 3, name: 'Azúcar', category: 'Condimento', unit: 'kg', quantity: 40, min_stock: 60, last_updated: '21/5/2026', expiration_date: null },
]

function labelValue(label: string): string {
  const labelEl = screen.getByText(label)
  // value is the sibling <p> within the same card body
  const value = labelEl.parentElement?.querySelector('p:last-child')
  return value?.textContent ?? ''
}

describe('InventorySummaryPanel (fixes.md #5)', () => {
  it('computes totals from the real items', () => {
    render(<InventorySummaryPanel items={items} alerts={[]} />)

    expect(labelValue('Total de insumos registrados')).toBe('3')
    // Papa (40<100) and Azúcar (40<60) are low; Tomate (55>30) is not.
    expect(labelValue('Insumos con Stock Bajo')).toBe('2')
  })

  it('picks the latest last_updated across months (not string compare)', () => {
    render(<InventorySummaryPanel items={items} alerts={[]} />)
    // June 2 is later than May 24 even though "2" < "24" lexicographically.
    expect(labelValue('Última Actualización')).toBe('2/6/2026')
  })

  it('shows the empty-alerts message when there are none', () => {
    render(<InventorySummaryPanel items={items} alerts={[]} />)
    expect(screen.getByText('No hay alertas de stock')).toBeInTheDocument()
  })

  it('renders provided stock alerts', () => {
    const alerts: StockAlert[] = [
      { id: 1, item_name: 'Azúcar', current_stock: 40, min_stock: 60, unit: 'kg' },
    ]
    render(<InventorySummaryPanel items={items} alerts={alerts} />)
    expect(screen.queryByText('No hay alertas de stock')).not.toBeInTheDocument()
    expect(screen.getByText(/Azúcar/)).toBeInTheDocument()
  })

  it('handles an empty inventory gracefully', () => {
    render(<InventorySummaryPanel items={[]} alerts={[]} />)
    expect(labelValue('Total de insumos registrados')).toBe('0')
    expect(labelValue('Última Actualización')).toBe('—')
  })
})
