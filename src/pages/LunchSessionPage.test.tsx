import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LunchSession } from '../types/lunchSession'

/**
 * Dos reglas nuevas conviven en esta pantalla:
 *
 * - el taquillero abre sesiones pero solo ve las suyas, así que no debe pedir el
 *   historial (endpoint ADMIN+ cuyo 403 se tragaba un `catch` vacío);
 * - la cierra quien la abrió, y el botón apagado tiene que decir por qué.
 *
 * La derivación de `canClose` en el cliente es solo para rotular: la autoridad es
 * el 403 del servidor.
 */

const OWNER_ID = 7
const OTHER_ID = 9

function session(overrides: Partial<LunchSession> = {}): LunchSession {
  return {
    id: 33,
    date: '2026-08-08',
    status: 'OPEN',
    opened_at: '2026-08-08T12:00:00Z',
    closed_at: null,
    opened_by_id: OWNER_ID,
    closed_by_id: null,
    opened_by_name: 'Ana Rodríguez',
    closed_by_name: null,
    sede_id: 1,
    sede: { id: 1, name: 'Sede Principal', is_active: true, created_at: '', updated_at: null },
    plates_quantity: 120,
    created_at: '2026-08-08T12:00:00Z',
    updated_at: null,
    ...overrides,
  }
}

const openList = vi.fn()
const listSessions = vi.fn()
const openableSedes = vi.fn()
const closeSession = vi.fn()
const forceClose = vi.fn()

let currentUser = { id: OWNER_ID, role: { name: 'TAQUILLERO' } }

vi.mock('../api/lunchSession', () => ({
  lunchSessionApi: {
    openList: () => openList(),
    list: (skip: number, limit: number) => listSessions(skip, limit),
    openableSedes: () => openableSedes(),
    open: vi.fn(),
    close: (id: number) => closeSession(id),
    forceClose: (id: number, reason: string) => forceClose(id, reason),
  },
}))

vi.mock('../api/sedes', () => ({
  sedesApi: { list: () => Promise.resolve({ total: 0, items: [] }) },
}))

vi.mock('../context/AuthContext', () => ({
  // `permissions: []` deja que resuelva la lista estática por rol, que es la
  // precedencia real: el permiso explícito manda y, a falta de él, el rol.
  useAuth: () => ({ user: currentUser, permissions: [] }),
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

import { LunchSessionPage } from './LunchSessionPage'

describe('LunchSessionPage — vista por rol y propiedad del cierre', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentUser = { id: OWNER_ID, role: { name: 'TAQUILLERO' } }
    openList.mockResolvedValue({ total: 0, items: [] })
    listSessions.mockResolvedValue({ total: 0, items: [] })
    openableSedes.mockResolvedValue({ total: 0, items: [] })
    closeSession.mockResolvedValue(session({ status: 'CLOSED' }))
    forceClose.mockResolvedValue(session({ status: 'CLOSED' }))
  })

  it('el taquillero no pide el historial de sesiones', async () => {
    render(<LunchSessionPage />)

    await waitFor(() => expect(openList).toHaveBeenCalled())
    expect(listSessions).not.toHaveBeenCalled()
    expect(await screen.findByText('Solo se muestran las sesiones que abriste.')).toBeInTheDocument()
  })

  it('el administrador sí carga el historial', async () => {
    currentUser = { id: 1, role: { name: 'ADMIN' } }

    render(<LunchSessionPage />)

    await waitFor(() => expect(listSessions).toHaveBeenCalled())
  })

  it('el taquillero puede abrir sesiones', async () => {
    render(<LunchSessionPage />)

    expect(await screen.findByRole('button', { name: /Abrir Sesión/ })).toBeEnabled()
  })

  it('el dueño puede cerrar su sesión', async () => {
    openList.mockResolvedValue({ total: 1, items: [session({ opened_by_id: OWNER_ID })] })

    render(<LunchSessionPage />)

    expect(await screen.findByRole('button', { name: /Cerrar/ })).toBeEnabled()
  })

  it('sobre una sesión ajena el botón queda apagado y explicado', async () => {
    openList.mockResolvedValue({ total: 1, items: [session({ opened_by_id: OTHER_ID })] })

    render(<LunchSessionPage />)

    expect(await screen.findByRole('button', { name: /Cerrar/ })).toBeDisabled()
    expect(
      screen.getByText('Solo Ana Rodríguez puede cerrar esta sesión.'),
    ).toBeInTheDocument()
  })

  it('el cierre forzado no existe para el taquillero', async () => {
    openList.mockResolvedValue({ total: 1, items: [session({ opened_by_id: OTHER_ID })] })

    render(<LunchSessionPage />)

    await screen.findByRole('button', { name: /Cerrar/ })
    expect(screen.queryByRole('button', { name: /Cierre forzado/ })).not.toBeInTheDocument()
  })

  it('el cierre forzado no existe para un ADMIN', async () => {
    currentUser = { id: 1, role: { name: 'ADMIN' } }
    openList.mockResolvedValue({ total: 1, items: [session({ opened_by_id: OTHER_ID })] })

    render(<LunchSessionPage />)

    await screen.findByRole('button', { name: /Cerrar/ })
    expect(screen.queryByRole('button', { name: /Cierre forzado/ })).not.toBeInTheDocument()
  })

  it('el SUPER_ADMIN puede forzar el cierre de una sesión ajena', async () => {
    currentUser = { id: 1, role: { name: 'SUPER_ADMIN' } }
    openList.mockResolvedValue({ total: 1, items: [session({ opened_by_id: OTHER_ID })] })

    render(<LunchSessionPage />)

    expect(await screen.findByRole('button', { name: /Cierre forzado/ })).toBeInTheDocument()
  })

  it('un motivo demasiado corto no llega a emitir la petición', async () => {
    currentUser = { id: 1, role: { name: 'SUPER_ADMIN' } }
    openList.mockResolvedValue({ total: 1, items: [session({ opened_by_id: OTHER_ID })] })
    const user = userEvent.setup()

    render(<LunchSessionPage />)
    await user.click(await screen.findByRole('button', { name: /Cierre forzado/ }))
    await user.type(screen.getByLabelText('Motivo del cierre forzado'), 'corto')

    expect(screen.getByRole('button', { name: 'Forzar cierre' })).toBeDisabled()
    expect(forceClose).not.toHaveBeenCalled()
  })

  it('con motivo suficiente se envía el cierre forzado', async () => {
    currentUser = { id: 1, role: { name: 'SUPER_ADMIN' } }
    openList.mockResolvedValue({ total: 1, items: [session({ opened_by_id: OTHER_ID })] })
    const user = userEvent.setup()
    const reason = 'El taquillero terminó su turno sin cerrar.'

    render(<LunchSessionPage />)
    await user.click(await screen.findByRole('button', { name: /Cierre forzado/ }))
    await user.type(screen.getByLabelText('Motivo del cierre forzado'), reason)
    await user.click(screen.getByRole('button', { name: 'Forzar cierre' }))

    await waitFor(() => expect(forceClose).toHaveBeenCalledWith(33, reason))
  })

  it('el modal de apertura usa el catálogo de sedes disponibles', async () => {
    const user = userEvent.setup()

    render(<LunchSessionPage />)
    await user.click(await screen.findByRole('button', { name: /Abrir Sesión/ }))

    // No el catálogo completo: el servidor es quien sabe cuáles están libres.
    await waitFor(() => expect(openableSedes).toHaveBeenCalled())
  })

  it('el estado vacío del taquillero no insinúa sesiones ajenas', async () => {
    render(<LunchSessionPage />)

    expect(await screen.findByText('No tienes ninguna sesión abierta')).toBeInTheDocument()
    expect(screen.queryByText(/Ninguna sede tiene/)).not.toBeInTheDocument()
  })
})
