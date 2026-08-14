import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

/**
 * «Mi Actividad» está abierta a cualquier sesión y no es una puerta al historial ajeno:
 * llama al endpoint que el servidor acota a quien pregunta, y ni ofrece ni acepta un
 * selector de persona.
 */

const listMine = vi.fn()
const list = vi.fn()

vi.mock('../api/audit', () => ({
  processHistoryApi: {
    list: (...args: unknown[]) => list(...args),
    listMine: (skip: number, limit: number, filters: unknown) => listMine(skip, limit, filters),
    filterCatalog: vi.fn(),
    export: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 9, name: 'Rosa Díaz', role: { name: 'TAQUILLERO' } },
    permissions: [],
  }),
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

import { MyActivityPage } from './MyActivityPage'

const ENTRY = {
  id: 1,
  user_id: 9,
  actor_name: 'Rosa Díaz',
  actor_email: 'rosa@unet.edu.ve',
  actor_role: 'TAQUILLERO',
  action: 'CREAR',
  resource: 'consumption',
  resource_id: '404',
  details: 'Registro de consumo — Pedro Gómez (V12345678) el 2026-08-12',
  changes: null,
  method: 'POST',
  path: '/consumptions/',
  status_code: 201,
  ip_address: '10.0.0.9',
  user_agent: null,
  created_at: '2026-08-12T11:00:00Z',
}

describe('MyActivityPage', () => {
  beforeEach(() => {
    listMine.mockReset()
    list.mockReset()
    listMine.mockResolvedValue({ total: 1, items: [ENTRY] })
  })

  it('lee el historial propio, no el general', async () => {
    render(<MyActivityPage />)

    await waitFor(() => expect(listMine).toHaveBeenCalled())
    expect(list).not.toHaveBeenCalled()
  })

  it('no ofrece selector de persona', async () => {
    render(<MyActivityPage />)

    await waitFor(() => expect(listMine).toHaveBeenCalled())
    expect(screen.queryByLabelText('Persona')).not.toBeInTheDocument()
  })

  it('un taquillero sin permisos ve sus procesos', async () => {
    render(<MyActivityPage />)

    await waitFor(() =>
      expect(screen.getByText(/Registro de consumo — Pedro Gómez/)).toBeInTheDocument(),
    )
    expect(screen.getByText(/a nombre de Rosa Díaz/)).toBeInTheDocument()
  })

  it('llena los desplegables con lo que hay en el historial propio', async () => {
    render(<MyActivityPage />)

    // El catálogo general exige el permiso de auditoría, que esta pantalla no pide.
    await waitFor(() => expect(screen.getByLabelText('Acción')).toHaveTextContent('Creación'))
  })

  it('sin nada registrado, el vacío no parece una avería', async () => {
    listMine.mockResolvedValue({ total: 0, items: [] })
    render(<MyActivityPage />)

    await waitFor(() =>
      expect(
        screen.getByText('Todavía no hay procesos registrados a tu nombre.'),
      ).toBeInTheDocument(),
    )
  })
})
