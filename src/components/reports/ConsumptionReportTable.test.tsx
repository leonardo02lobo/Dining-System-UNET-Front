import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConsumptionReportTable } from './ConsumptionReportTable'
import type { ConsumptionReportItem } from '../../types/report'

// fixes.md #18 — table now consumes ConsumptionReportItem[] directly (no legacy adapter).

const items: ConsumptionReportItem[] = [
  {
    itemId: 1,
    itemName: 'Tomate',
    categoryName: 'Verdura',
    quantityConsumed: 8,
    unit: 'kg',
    period: { fromDate: '2026-05-23', toDate: '2026-08-12' },
  },
]

describe('ConsumptionReportTable', () => {
  it('renders the modern item fields', () => {
    render(<ConsumptionReportTable items={items} />)

    expect(screen.getByText('Tomate')).toBeInTheDocument()
    expect(screen.getByText('Verdura')).toBeInTheDocument()
    expect(screen.getByText('8 kg')).toBeInTheDocument()
  })

  it('shows the empty message when there are no items', () => {
    render(<ConsumptionReportTable items={[]} />)
    expect(screen.getByText('No hay datos en el rango seleccionado.')).toBeInTheDocument()
  })
})
