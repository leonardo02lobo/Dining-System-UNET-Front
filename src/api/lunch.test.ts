import { describe, it, expect, vi, beforeEach } from 'vitest'

// fixes.md #19 — composed createConfirmedLunch flow extracted into lunchApi.

const get = vi.fn()
const post = vi.fn()

vi.mock('./client', () => ({
  apiClient: {
    get: (url: string) => get(url),
    post: (url: string, body: unknown) => post(url, body),
  },
}))

import { lunchApi } from './lunch'

const baseParams = {
  name: 'Arroz con pollo',
  date: '2026-07-01',
  platesQuantity: 600,
  basePlatesQuantity: 500,
  ingredients: [{ inventoryItemId: 1, baseQuantity: 10, calculatedQuantity: 12, unit: 'kg' }],
  saveAsTemplate: false,
}

beforeEach(() => {
  get.mockReset()
  post.mockReset()
})

function stubHappyPath(isValid: boolean) {
  post.mockImplementation((url: string) => {
    if (url === '/lunches') return Promise.resolve({ id: 99 })
    return Promise.resolve({ id: 99 }) // ingredients, recalculate, confirm, template
  })
  get.mockImplementation((url: string) => {
    if (url.endsWith('/stock-validation')) {
      return Promise.resolve({ isValid, items: isValid ? [] : [{ isSufficient: false }] })
    }
    return Promise.resolve({ id: 99 }) // getLunch
  })
}

describe('lunchApi.createConfirmedLunch', () => {
  it('confirms the lunch when stock is sufficient', async () => {
    stubHappyPath(true)
    const result = await lunchApi.createConfirmedLunch(baseParams)

    expect(result.status).toBe('confirmed')
    // A confirm call must have happened.
    expect(post).toHaveBeenCalledWith('/lunches/99/confirm', expect.anything())
  })

  it('returns insufficient_stock and does NOT confirm when stock is short', async () => {
    stubHappyPath(false)
    const result = await lunchApi.createConfirmedLunch(baseParams)

    expect(result.status).toBe('insufficient_stock')
    const confirmCalled = post.mock.calls.some(([url]) => String(url).endsWith('/confirm'))
    expect(confirmCalled).toBe(false)
  })

  it('creates a template only when saveAsTemplate is true', async () => {
    stubHappyPath(true)
    await lunchApi.createConfirmedLunch({ ...baseParams, saveAsTemplate: true })

    const templateCalled = post.mock.calls.some(([url]) => url === '/lunch-templates')
    expect(templateCalled).toBe(true)
  })

  it('does not create a template when saveAsTemplate is false', async () => {
    stubHappyPath(true)
    await lunchApi.createConfirmedLunch(baseParams)

    const templateCalled = post.mock.calls.some(([url]) => url === '/lunch-templates')
    expect(templateCalled).toBe(false)
  })
})
