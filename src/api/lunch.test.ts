import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * FE-06 — la capa API después de separar borrador y confirmación.
 *
 * El flujo compuesto `createConfirmedLunch` (crear → ingredientes → recalcular →
 * validar → confirmar) desapareció: encadenaba cinco peticiones y guardar
 * significaba descontar. Ahora crear es **una** petición y confirmar es una
 * decisión aparte y explícita.
 */

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()

vi.mock('./client', () => ({
  apiClient: {
    get: (url: string) => get(url),
    post: (url: string, body: unknown) => post(url, body),
    put: (url: string, body: unknown) => put(url, body),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { lunchApi } from './lunch'

const ingredients = [{ inventoryItemId: 1, baseQuantity: 10, calculatedQuantity: 12, unit: 'kg' }]

beforeEach(() => {
  get.mockReset()
  post.mockReset()
  put.mockReset()
})

describe('lunchApi.createLunch', () => {
  it('crea el borrador con sus ingredientes en una sola petición', async () => {
    post.mockResolvedValue({ id: 99, status: 'DRAFT' })

    await lunchApi.createLunch({
      name: 'Arroz con pollo',
      date: '2026-09-01',
      mealType: 'ALMUERZO',
      platesQuantity: 600,
      basePlatesQuantity: 500,
      ingredients,
    })

    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('/lunches', expect.objectContaining({ ingredients }))
  })

  it('no confirma nada al guardar un borrador', async () => {
    post.mockResolvedValue({ id: 99, status: 'DRAFT' })

    await lunchApi.createLunch({
      name: 'Arroz con pollo',
      date: '2026-09-01',
      platesQuantity: 600,
      basePlatesQuantity: 500,
      ingredients,
    })

    expect(post.mock.calls.some(([url]) => String(url).endsWith('/confirm'))).toBe(false)
  })
})

describe('lunchApi.listLunches', () => {
  it('filtra por fecha y por estado', async () => {
    get.mockResolvedValue([])

    await lunchApi.listLunches({ date: '2026-09-01', status: 'CONFIRMED' })

    expect(get).toHaveBeenCalledWith('/lunches?date=2026-09-01&status=CONFIRMED')
  })

  it('sin parámetros pide la lista completa', async () => {
    get.mockResolvedValue([])

    await lunchApi.listLunches()

    expect(get).toHaveBeenCalledWith('/lunches')
  })
})

describe('lunchApi.setLunchIngredients', () => {
  it('reemplaza la receta completa en una sola petición', async () => {
    put.mockResolvedValue({ id: 99 })

    await lunchApi.setLunchIngredients(99, ingredients)

    expect(put).toHaveBeenCalledWith('/lunches/99/ingredients', ingredients)
  })
})

describe('lunchApi.confirmLunch', () => {
  it('devuelve el almuerzo confirmado cuando el stock alcanza', async () => {
    post.mockResolvedValue({ id: 99, status: 'CONFIRMED' })

    const result = await lunchApi.confirmLunch(99)

    expect(post).toHaveBeenCalledWith('/lunches/99/confirm', {})
    expect(result).toEqual({ status: 'confirmed', lunch: { id: 99, status: 'CONFIRMED' } })
  })

  it('devuelve los faltantes —sin lanzar— cuando el backend responde 409 por stock', async () => {
    const items = [{
      inventoryItemId: 7,
      ingredientId: 3,
      name: 'Pollo',
      requiredQuantity: 25,
      availableStock: 5,
      missingQuantity: 20,
      unit: 'kg',
    }]
    post.mockRejectedValue({
      status: 409,
      message: 'No hay suficiente stock para confirmar el servicio',
      detail: { code: 'insufficient_stock', lunchId: 99, items },
    })

    const result = await lunchApi.confirmLunch(99)

    expect(result).toEqual({ status: 'insufficient_stock', items })
  })

  it('propaga los demás 409: doble confirmación no es un problema de stock', async () => {
    post.mockRejectedValue({
      status: 409,
      message: 'Lunch already confirmed',
      detail: undefined,
    })

    await expect(lunchApi.confirmLunch(99)).rejects.toMatchObject({
      message: 'Lunch already confirmed',
    })
  })

  it('propaga un 409 cuyo detalle es de otro tipo', async () => {
    post.mockRejectedValue({
      status: 409,
      message: 'Otro conflicto',
      detail: { code: 'something_else' },
    })

    await expect(lunchApi.confirmLunch(99)).rejects.toMatchObject({ status: 409 })
  })
})
