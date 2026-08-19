import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/**
 * La salida del 404 tiene que llevar a `DEFAULT_ROUTE[rol]`, no a `/`.
 *
 * Un taquillero no tiene acceso a la raíz: `ProtectedRoute` lo devolvería a
 * `/comedor/registrar`, así que un botón apuntando a `/` rebotaría a la vista y sería
 * peor que no tenerlo. Es la razón por la que esta pantalla lee el rol en vez de
 * enlazar a un sitio fijo, y por eso se prueba.
 */

let mockRole = 'ADMIN'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: { name: mockRole } }, permissions: [] }),
}))

import { NotFoundPage } from './NotFoundPage'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NotFoundPage />
    </MemoryRouter>,
  )
}

describe('NotFoundPage', () => {
  beforeEach(() => {
    mockRole = 'ADMIN'
  })

  it('anuncia el 404 y muestra la dirección que se intentó abrir', () => {
    renderAt('/comedor/registrarr')

    expect(screen.getByRole('heading', { name: 'Esta página no existe' })).toBeInTheDocument()
    // La errata se muestra tal cual: es lo que permite verla sin adivinar.
    expect(screen.getByText('/comedor/registrarr')).toBeInTheDocument()
  })

  it('lleva al inicio del rol, no a la raíz, cuando el rol no puede abrir la raíz', () => {
    mockRole = 'TAQUILLERO'
    renderAt('/ruta-inexistente')

    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/comedor/registrar',
    )
  })

  it('lleva a la raíz cuando el rol sí puede abrirla', () => {
    mockRole = 'SUPER_ADMIN'
    renderAt('/ruta-inexistente')

    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })

  it('lleva al verificador cuando el rol es ACCESO_DIRECTO', () => {
    mockRole = 'ACCESO_DIRECTO'
    renderAt('/ruta-inexistente')

    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/verificar-acceso-directo',
    )
  })
})
