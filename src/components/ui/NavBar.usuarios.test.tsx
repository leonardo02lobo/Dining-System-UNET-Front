import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Permission } from '../../api/permissions'

/**
 * USR — «Lista de Usuarios» es administración, no comedor.
 *
 * La ruta y el permiso `/usuarios` no cambian: lo único que se mueve es dónde la
 * muestra el menú. Estas pruebas fijan esa ubicación y, sobre todo, que moverla
 * no le abrió la puerta a nadie que antes no la tuviera.
 */

let currentUser: { id: number; role: { name: string } } | null = null
let currentPermissions: Permission[] = []

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, permissions: currentPermissions, logout: vi.fn() }),
}))

import { NavBar } from './NavBar'

function grant(...routes: string[]): Permission[] {
  return routes.map((route) => ({ route, label: route, enabled: true }))
}

function deny(route: string): Permission {
  return { route, label: route, enabled: false }
}

/** Etiquetas visibles del grupo indicado (el grupo se abre al hacer clic). */
function itemsOfGroup(groupLabel: string): string[] {
  const groupButton = screen.getByRole('button', { name: new RegExp(`^${groupLabel}$`) })
  const container = groupButton.parentElement!
  const list = container.querySelector('ul')
  if (!list) return []
  return Array.from(list.querySelectorAll('a')).map((a) => a.textContent?.trim() ?? '')
}

function openGroup(groupLabel: string) {
  const groupButton = screen.getByRole('button', { name: new RegExp(`^${groupLabel}$`) })
  fireEvent.click(groupButton)
}

describe('NavBar — ubicación de Lista de Usuarios', () => {
  beforeEach(() => {
    currentUser = null
    currentPermissions = []
  })

  it.each(['SUPER_ADMIN', 'ADMIN'])(
    'un %s autorizado la encuentra en Administración y no en Comedor',
    (role) => {
      currentUser = { id: 1, role: { name: role } }
      currentPermissions = grant('/usuarios', '/comedor/sesion')

      render(
        <MemoryRouter>
          <NavBar />
        </MemoryRouter>,
      )

      openGroup('Administración')
      expect(itemsOfGroup('Administración')).toContain('Lista de Usuarios')

      openGroup('Comedor')
      expect(itemsOfGroup('Comedor')).not.toContain('Lista de Usuarios')
      expect(itemsOfGroup('Comedor')).not.toContain('Lista de Usuario')
    },
  )

  it('no se duplica: aparece una sola vez en todo el menú', () => {
    currentUser = { id: 1, role: { name: 'SUPER_ADMIN' } }
    currentPermissions = grant('/usuarios', '/comedor/sesion')

    const { container } = render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )

    // Solo un grupo está abierto a la vez, así que se cuenta grupo por grupo.
    const groups = ['Comedor', 'Inventario', 'Administración']
    const hits = groups.filter((group) => {
      openGroup(group)
      return container.querySelector('a[href="/usuarios"]') !== null
    })

    expect(hits).toEqual(['Administración'])
  })

  it('un administrador con el permiso /usuarios revocado no ve la entrada', () => {
    currentUser = { id: 2, role: { name: 'ADMIN' } }
    currentPermissions = [...grant('/auditoria'), deny('/usuarios')]

    const { container } = render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )

    openGroup('Administración')
    expect(container.querySelector('a[href="/usuarios"]')).toBeNull()
  })

  it('un TAQUILLERO no gana acceso por el cambio de grupo', () => {
    currentUser = { id: 3, role: { name: 'TAQUILLERO' } }
    // Sin una concesión explícita de `/usuarios`, decide ROUTE_ACCESS: la ruta es
    // de SUPER_ADMIN/ADMIN y moverla de grupo no cambió eso.
    currentPermissions = grant('/comedor/sesion', '/comedor/registrar')

    const { container } = render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )

    expect(container.querySelector('a[href="/usuarios"]')).toBeNull()
  })
})
