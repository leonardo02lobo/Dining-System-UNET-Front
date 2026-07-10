import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { InventoryCategory, InventoryItem } from '../types/inventory'

/**
 * Regression coverage for fixes.md #4: native confirm()/alert() dialogs are
 * unreliable in Tauri desktop and blocked deletion. Deletion must now go through
 * the in-app confirmation Modal instead.
 */

const category: InventoryCategory = {
  id: 1,
  name: 'Verdura',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const item: InventoryItem = {
  id: 42,
  name: 'Tomate',
  categoryId: 1,
  category,
  currentStock: 10,
  unit: 'kg',
  minimumStock: 2,
  lastUpdatedAt: '2026-06-01T00:00:00Z',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

const deleteItem = vi.fn()

vi.mock('../api/inventory', () => ({
  inventoryApi: {
    listItems: () => Promise.resolve([item]),
    listCategories: () => Promise.resolve([category]),
    deleteItem: (id: number) => deleteItem(id),
    deleteCategory: vi.fn(),
    getItem: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    createCategory: vi.fn(),
  },
}))

// Native confirm should never be called by the deletion flow anymore.
const confirmSpy = vi.spyOn(window, 'confirm')

import { InventoryPage } from './InventoryPage'

describe('InventoryPage deletion flow (fixes.md #4)', () => {
  beforeEach(() => {
    deleteItem.mockReset()
    deleteItem.mockResolvedValue(undefined)
    confirmSpy.mockClear()
  })

  it('opens a confirmation Modal instead of calling native confirm(), and only deletes after confirming', async () => {
    const user = userEvent.setup()
    render(<InventoryPage />)

    // Wait for the mocked item to load into the table.
    expect(await screen.findByText('Tomate')).toBeInTheDocument()

    // Click the row's delete (trash) button.
    await user.click(screen.getByTitle('Eliminar'))

    // The native dialog must not be used.
    expect(confirmSpy).not.toHaveBeenCalled()

    // A confirmation modal appears and no deletion has happened yet.
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Eliminar insumo')).toBeInTheDocument()
    expect(deleteItem).not.toHaveBeenCalled()

    // Confirm deletion.
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(deleteItem).toHaveBeenCalledWith(42))
  })

  it('cancelling the Modal does not delete the item', async () => {
    const user = userEvent.setup()
    render(<InventoryPage />)

    expect(await screen.findByText('Tomate')).toBeInTheDocument()
    await user.click(screen.getByTitle('Eliminar'))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(deleteItem).not.toHaveBeenCalled()
    expect(confirmSpy).not.toHaveBeenCalled()
  })
})
