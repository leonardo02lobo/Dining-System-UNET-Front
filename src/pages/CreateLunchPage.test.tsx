import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { LunchResponse } from '../types/lunch'

/** La planificación visible es la de la fecha seleccionada, que arranca en hoy. */
const TODAY = new Date().toISOString().split('T')[0]

/**
 * Planificador por fecha: guardar es guardar, confirmar es descontar.
 *
 * El botón único «Guardar» hacía las dos cosas, así que anotar el menú del
 * viernes vaciaba la despensa el lunes. Estas pruebas fijan la separación, el
 * aviso previo al descuento y qué pasa cuando el inventario no alcanza.
 */

const listItems = vi.fn()
const listLunches = vi.fn()
const createLunch = vi.fn()
const updateLunch = vi.fn()
const setLunchIngredients = vi.fn()
const confirmLunch = vi.fn()
const deleteLunch = vi.fn()
const listLunchTemplates = vi.fn()

vi.mock('../api/inventory', () => ({
  inventoryApi: { listItems: () => listItems() },
}))

vi.mock('../api/lunch', () => ({
  lunchApi: {
    listLunches: (params?: unknown) => listLunches(params),
    createLunch: (data: unknown) => createLunch(data),
    updateLunch: (id: number, data: unknown) => updateLunch(id, data),
    setLunchIngredients: (id: number, data: unknown) => setLunchIngredients(id, data),
    confirmLunch: (id: number) => confirmLunch(id),
    deleteLunch: (id: number) => deleteLunch(id),
    listLunchTemplates: () => listLunchTemplates(),
  },
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../utils/pdfLunch', () => ({ generateLunchListPdf: vi.fn() }))

import { CreateLunchPage } from './CreateLunchPage'

const ARROZ = {
  id: 1,
  name: 'Arroz',
  unit: 'kg',
  currentStock: 4,
  minimumStock: 0,
  category: { id: 1, name: 'Cereal' },
}

function lunch(overrides: Partial<LunchResponse> = {}): LunchResponse {
  return {
    id: 77,
    name: 'Arroz con pollo',
    date: TODAY,
    platesQuantity: 500,
    basePlatesQuantity: 500,
    mealType: 'ALMUERZO',
    status: 'DRAFT',
    createdById: 1,
    createdAt: '2026-08-18T10:00:00Z',
    updatedAt: '2026-08-18T10:00:00Z',
    ingredients: [],
    ...overrides,
  } as LunchResponse
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CreateLunchPage />
    </MemoryRouter>,
  )
}

/** Agrega un ingrediente por el modal, con la cantidad indicada. */
async function addIngredient(quantity: string) {
  fireEvent.click(screen.getByRole('button', { name: /Agregar Ingrediente/i }))
  await screen.findByText('Selecciona un ingrediente...')
  fireEvent.click(screen.getByText('Selecciona un ingrediente...'))
  fireEvent.click(await screen.findByText(/Arroz \(4 kg disponibles\)/))
  fireEvent.change(screen.getByLabelText(/Cantidad original/i), { target: { value: quantity } })
  fireEvent.click(screen.getByRole('button', { name: /^Agregar$/ }))
}

beforeEach(() => {
  vi.clearAllMocks()
  listItems.mockResolvedValue([ARROZ])
  listLunches.mockResolvedValue([])
  listLunchTemplates.mockResolvedValue([])
  createLunch.mockResolvedValue(lunch())
  updateLunch.mockResolvedValue(lunch())
  setLunchIngredients.mockResolvedValue(lunch())
  confirmLunch.mockResolvedValue({ status: 'confirmed', lunch: lunch({ status: 'CONFIRMED' }) })
  deleteLunch.mockResolvedValue(undefined)
})

describe('CreateLunchPage — borrador con insumos faltantes (FE-03)', () => {
  it('permite agregar una cantidad mayor que la existencia actual', async () => {
    renderPage()
    await addIngredient('500')

    // Queda en la lista de ingredientes pese a que solo hay 4 kg (aparece en la
    // tabla de ingredientes y en la de recálculo, de ahí el getAllBy).
    expect((await screen.findAllByText('Arroz')).length).toBeGreaterThan(0)
    expect(
      screen.getByText(/Hoy no hay existencias suficientes para 1 insumo/i),
    ).toBeInTheDocument()
  })

  it('el botón de guardar borrador queda habilitado aunque falte stock', async () => {
    renderPage()
    await addIngredient('500')

    expect(screen.getByRole('button', { name: /Guardar borrador/i })).toBeEnabled()
  })
})

describe('CreateLunchPage — guardar borrador (FE-02)', () => {
  it('guarda sin invocar la confirmación', async () => {
    renderPage()
    await addIngredient('2')

    fireEvent.click(screen.getByRole('button', { name: /Guardar borrador/i }))

    await waitFor(() => expect(createLunch).toHaveBeenCalledTimes(1))
    expect(confirmLunch).not.toHaveBeenCalled()
  })

  it('el segundo guardado actualiza el mismo borrador en vez de crear otro', async () => {
    renderPage()
    await addIngredient('2')

    fireEvent.click(screen.getByRole('button', { name: /Guardar borrador/i }))
    await waitFor(() => expect(createLunch).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: /Guardar borrador/i }))
    // Encabezado y receta en la misma petición: no hay un segundo viaje que
    // pueda dejar el borrador con la mitad del cambio.
    await waitFor(() =>
      expect(updateLunch).toHaveBeenCalledWith(77, expect.objectContaining({
        ingredients: expect.any(Array),
      })),
    )
    expect(createLunch).toHaveBeenCalledTimes(1)
    expect(setLunchIngredients).not.toHaveBeenCalled()
  })
})

describe('CreateLunchPage — confirmar descuenta (FE-02)', () => {
  it('avisa del descuento antes de confirmar y no llama al backend hasta aceptar', async () => {
    renderPage()
    await addIngredient('2')

    fireEvent.click(screen.getByRole('button', { name: /Confirmar servicio/i }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/se descuentan/i)).toBeInTheDocument()
    expect(confirmLunch).not.toHaveBeenCalled()
  })

  it('al aceptar guarda el borrador y luego confirma', async () => {
    renderPage()
    await addIngredient('2')

    fireEvent.click(screen.getByRole('button', { name: /Confirmar servicio/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Confirmar y descontar/i }))

    await waitFor(() => expect(confirmLunch).toHaveBeenCalledWith(77))
    expect(createLunch).toHaveBeenCalledTimes(1)
  })

  it('refresca inventario y planificación tras una confirmación exitosa', async () => {
    renderPage()
    await waitFor(() => expect(listItems).toHaveBeenCalledTimes(1))
    await addIngredient('2')

    fireEvent.click(screen.getByRole('button', { name: /Confirmar servicio/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Confirmar y descontar/i }))

    await waitFor(() => expect(listItems.mock.calls.length).toBeGreaterThan(1))
    expect(listLunches.mock.calls.length).toBeGreaterThan(1)
  })
})

describe('CreateLunchPage — modal de insumos faltantes (FE-04)', () => {
  const missing = [{
    inventoryItemId: 1,
    ingredientId: 5,
    name: 'Arroz',
    requiredQuantity: 500,
    availableStock: 4,
    missingQuantity: 496,
    unit: 'kg',
  }]

  it('muestra requerido, disponible y faltante de cada insumo devuelto', async () => {
    confirmLunch.mockResolvedValue({ status: 'insufficient_stock', items: missing })
    renderPage()
    await addIngredient('500')

    fireEvent.click(screen.getByRole('button', { name: /Confirmar servicio/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Confirmar y descontar/i }))

    const dialog = await screen.findByRole('dialog', { name: /Faltan insumos/i })
    const row = within(dialog).getByRole('row', { name: /Arroz/ })
    expect(within(row).getByText(/500/)).toBeInTheDocument()
    expect(within(row).getByText(/^4 kg$/)).toBeInTheDocument()
    expect(within(row).getByText(/496/)).toBeInTheDocument()
  })

  it('conserva el borrador: al cerrar, el formulario sigue con sus ingredientes', async () => {
    confirmLunch.mockResolvedValue({ status: 'insufficient_stock', items: missing })
    renderPage()
    await addIngredient('500')

    fireEvent.click(screen.getByRole('button', { name: /Confirmar servicio/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Confirmar y descontar/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Volver al borrador/i }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /Faltan insumos/i })).not.toBeInTheDocument(),
    )
    expect(screen.getAllByText('Arroz').length).toBeGreaterThan(0)
    expect(screen.getByText(/Editando servicio #77/)).toBeInTheDocument()
  })
})

describe('CreateLunchPage — planificación de la fecha (FE-05)', () => {
  it('un confirmado se muestra sin acciones de edición y con el motivo', async () => {
    listLunches.mockResolvedValue([
      lunch({ id: 1, name: 'Pabellón', status: 'CONFIRMED' }),
    ])
    renderPage()

    expect(await screen.findByText('Pabellón')).toBeInTheDocument()
    expect(screen.getByText(/ya descontó inventario y no puede editarse/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Abrir$/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Eliminar$/ })).not.toBeInTheDocument()
  })

  it('un borrador se puede abrir y eliminar', async () => {
    listLunches.mockResolvedValue([lunch({ id: 2, name: 'Sopa' })])
    renderPage()

    await screen.findByText('Sopa')
    expect(screen.getByRole('button', { name: /^Abrir$/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Eliminar$/ }))
    const dialog = await screen.findByRole('dialog', { name: /Eliminar borrador/i })
    fireEvent.click(within(dialog).getByRole('button', { name: /^Eliminar$/ }))

    await waitFor(() => expect(deleteLunch).toHaveBeenCalledWith(2))
  })
})
