import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import App from './App'

/**
 * USR-03 — mover la entrada del menú no puede tocar el direccionamiento.
 *
 * La URL `/usuarios` y el redirect legado `/listUser` existían antes del cambio
 * de grupo y siguen existiendo: los enlaces guardados no se rompen porque solo
 * se movió un elemento de la lista de navegación.
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

function json(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
  } as unknown as Response)
}

describe('Ruta /usuarios', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
      const path = String(input).replace(/^.*\/api\/v1/, '')
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

  it('sigue abriendo la pantalla de usuarios en su misma URL', async () => {
    window.history.pushState({}, '', '/usuarios')
    render(<App />)

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Lista de Usuarios' })).toBeInTheDocument())
    expect(window.location.pathname).toBe('/usuarios')
  }, 30000)

  it('el enlace legado /listUser continúa redirigiendo a /usuarios', async () => {
    window.history.pushState({}, '', '/listUser')
    render(<App />)

    await waitFor(() => expect(window.location.pathname).toBe('/usuarios'))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Lista de Usuarios' })).toBeInTheDocument())
  }, 30000)
})
