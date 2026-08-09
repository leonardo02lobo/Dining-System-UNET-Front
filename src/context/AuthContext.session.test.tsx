import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

/**
 * Regresión del pantallazo en blanco reportado tras el despliegue.
 *
 * `refetch` dependía de `navigate`, cuya identidad cambia con el pathname, así que
 * el efecto de arranque volvía a correr en cada navegación: `loading` regresaba a
 * true y `ProtectedRoute` cambiaba toda la interfaz por el spinner a pantalla
 * completa mientras reconsultaba `/users/me` y los permisos. Con la red del
 * despliegue eso se veía como abrir un submenú y quedarse en blanco.
 */

const USER = {
  id: 1,
  name: 'Super Admin',
  email: 'admin@dining-system.com',
  role_id: 1,
  role: { id: 1, name: 'SUPER_ADMIN' },
  is_active: true,
  created_at: '2026-01-01T00:00:00',
  updated_at: null,
}

const calls: string[] = []

function json(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
  } as unknown as Response)
}

function meCalls() {
  return calls.filter((c) => c.startsWith('/users/me')).length
}

describe('AuthContext — la sesión se resuelve una sola vez', () => {
  beforeEach(() => {
    calls.length = 0
    window.history.pushState({}, '', '/')
    vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
      const path = String(input).replace(/^.*\/api\/v1/, '')
      calls.push(path)
      if (path.startsWith('/users/me')) return json(USER)
      if (/permissions/.test(path)) return json([])
      if (path.startsWith('/users')) return json([USER])
      if (path.startsWith('/roles')) return json([{ id: 1, name: 'SUPER_ADMIN' }])
      return json({ total: 0, items: [] })
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('no revalida la sesión al navegar entre pantallas', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Menu Principal')).toBeInTheDocument())
    await waitFor(() => expect(meCalls()).toBeGreaterThan(0))

    const afterMount = meCalls()

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Administración' }))
    await user.click(await screen.findByRole('link', { name: 'Sedes' }))
    await waitFor(() => expect(window.location.pathname).toBe('/sedes'))
    const afterFirstNav = meCalls()

    await user.click(await screen.findByRole('link', { name: 'Catálogo de Carreras' }))
    await waitFor(() => expect(window.location.pathname).toBe('/admin/carreras'))
    const afterSecondNav = meCalls()

    expect({ afterFirstNav, afterSecondNav }).toEqual({
      afterFirstNav: afterMount,
      afterSecondNav: afterMount,
    })
  }, 30000)

  it('mantiene la cabecera y el menú visibles durante toda la navegación', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Menu Principal')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Administración' }))
    await user.click(await screen.findByRole('link', { name: 'Sedes' }))

    // El menú no desaparece en ningún momento del cambio de pantalla.
    expect(screen.getByText('Menu Principal')).toBeInTheDocument()
    await waitFor(() => expect(window.location.pathname).toBe('/sedes'))
    expect(screen.getByText('Menu Principal')).toBeInTheDocument()
  }, 30000)
})
