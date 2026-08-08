import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AccesoDirectoRecentEntry } from '../types/acceso_directo'

/**
 * El panel de "Últimos ingresos" y la tabla del padrón responden a preguntas
 * distintas —quién acaba de entrar y quién está dado de alta—, así que los filtros
 * de la tabla no deben arrastrar al panel: si lo hicieran, escribir en el buscador
 * cambiaría la lista de ingresos, que es un resultado que nadie pidió.
 */

function entry(overrides: Partial<AccesoDirectoRecentEntry> = {}): AccesoDirectoRecentEntry {
  return {
    consumption_id: 1,
    acceso_directo_id: 7,
    document_id: '31419581',
    first_name: 'Frankly',
    last_name: 'Bautista',
    user_type: 'STUDENT',
    career: 'Ingeniería En Informática',
    access_reason: 'Fútbol',
    is_priority: true,
    registered_at: '2026-08-08T15:42:10Z',
    consumption_date: '2026-08-08',
    is_manual: false,
    lunch_session_id: 33,
    sede_id: 1,
    sede_name: 'Sede Principal',
    ...overrides,
  }
}

const list = vi.fn()
const recentEntries = vi.fn()
const notifyError = vi.fn()

vi.mock('../api/acceso_directo', () => ({
  accesoDirectoApi: {
    list: (filters: unknown) => list(filters),
    recentEntries: (limit: number, onlyPriority: boolean) => recentEntries(limit, onlyPriority),
    remove: vi.fn(),
  },
}))

vi.mock('../api/accessReason', () => ({
  accessReasonApi: { list: () => Promise.resolve([]) },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: { name: 'ADMIN' } }, permissions: [] }),
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: (err: unknown) => notifyError(err) },
}))

import { AccesoDirectoPage } from './AccesoDirectoPage'

describe('AccesoDirectoPage — panel de ingresos recientes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    list.mockResolvedValue({ total: 0, items: [] })
    recentEntries.mockResolvedValue({ total: 1483, items: [entry()] })
  })

  it('pide los últimos diez ingresos y sitúa la ventana sobre el total', async () => {
    render(<AccesoDirectoPage />)

    await waitFor(() => expect(recentEntries).toHaveBeenCalledWith(10, false))
    expect(await screen.findByText('1 de 1483')).toBeInTheDocument()
    expect(screen.getByText('Frankly Bautista')).toBeInTheDocument()
    expect(screen.getByText('Sede Principal')).toBeInTheDocument()
    expect(screen.getByText('Taquilla')).toBeInTheDocument()
  })

  it('rotula el origen manual y deja la sede en blanco cuando no la hay', async () => {
    recentEntries.mockResolvedValue({
      total: 1,
      items: [entry({ is_manual: true, sede_id: null, sede_name: null })],
    })

    render(<AccesoDirectoPage />)

    expect(await screen.findByText('Manual')).toBeInTheDocument()
    expect(screen.queryByText('Sede Principal')).not.toBeInTheDocument()
  })

  it('vuelve a consultar al activar "Solo prioritarios"', async () => {
    const user = userEvent.setup()
    render(<AccesoDirectoPage />)
    await waitFor(() => expect(recentEntries).toHaveBeenCalledWith(10, false))

    await user.click(screen.getByLabelText('Solo prioritarios'))

    await waitFor(() => expect(recentEntries).toHaveBeenCalledWith(10, true))
  })

  it('no recarga el panel al escribir en el buscador del padrón', async () => {
    const user = userEvent.setup()
    render(<AccesoDirectoPage />)
    await waitFor(() => expect(recentEntries).toHaveBeenCalledTimes(1))

    await user.type(screen.getByPlaceholderText('Buscar por nombre o cédula...'), 'Frankly')

    // El padrón sí se vuelve a consultar; el panel no.
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(1))
    expect(recentEntries).toHaveBeenCalledTimes(1)
  })

  it('un fallo del panel no impide usar la tabla del padrón', async () => {
    recentEntries.mockRejectedValue(new Error('boom'))
    list.mockResolvedValue({
      total: 1,
      items: [
        {
          id: 7,
          first_name: 'Frankly',
          last_name: 'Bautista',
          document_id: '31419581',
          card_code: null,
          user_type: 'STUDENT',
          is_priority: false,
          status: 'ACTIVE',
          created_at: '2026-08-01T00:00:00Z',
          updated_at: null,
        },
      ],
    })

    render(<AccesoDirectoPage />)

    await waitFor(() => expect(notifyError).toHaveBeenCalled())
    expect(await screen.findByText('Todavía no hay ingresos registrados.')).toBeInTheDocument()
    // La gestión del padrón, que es la función principal de la pantalla, sigue viva.
    expect(await screen.findByText('Frankly Bautista')).toBeInTheDocument()
  })
})
