import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { Permission } from '../api/permissions'

/**
 * fe-permisos-conceden-capacidad — la pantalla decide por permiso, no por rol.
 *
 * El caso que originó el cambio: un usuario con rol `ACCESO_DIRECTO` al que se le
 * concedió `/comedor/sesion` entraba a la pantalla y leía "No tienes permisos", y
 * cuando el listado devolvía 403 la vista anunciaba "No tienes ninguna sesión
 * abierta". Mentía dos veces.
 */

const openList = vi.fn()
const listSessions = vi.fn()

let currentUser: { id: number; role: { name: string } } = { id: 5, role: { name: 'ACCESO_DIRECTO' } }
let currentPermissions: Permission[] = []

vi.mock('../api/lunchSession', () => ({
  lunchSessionApi: {
    openList: () => openList(),
    list: (skip: number, limit: number) => listSessions(skip, limit),
    openableSedes: () => Promise.resolve({ total: 0, items: [] }),
    open: vi.fn(),
    close: vi.fn(),
    forceClose: vi.fn(),
  },
}))

vi.mock('../api/sedes', () => ({
  sedesApi: { list: () => Promise.resolve({ total: 0, items: [] }) },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, permissions: currentPermissions }),
}))

vi.mock('../utils/toast', () => ({ notify: { success: vi.fn(), error: vi.fn() } }))

import { LunchSessionPage } from './LunchSessionPage'

function grant(...routes: string[]): Permission[] {
  return routes.map((route) => ({ route, label: route, enabled: true }))
}

describe('LunchSessionPage — el permiso concede la capacidad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentUser = { id: 5, role: { name: 'ACCESO_DIRECTO' } }
    currentPermissions = []
    openList.mockResolvedValue({ total: 0, items: [] })
    listSessions.mockResolvedValue({ total: 0, items: [] })
  })

  it('un acceso directo con la pantalla concedida puede abrir sesiones', async () => {
    currentPermissions = grant('/comedor/sesion')

    render(<LunchSessionPage />)

    expect(await screen.findByRole('button', { name: /Abrir Sesión/ })).toBeEnabled()
  })

  it('sin la pantalla concedida no se ofrece abrir, y se dice cuál falta', async () => {
    currentPermissions = [{ route: '/comedor/sesion', label: 'Sesión', enabled: false }]

    render(<LunchSessionPage />)

    await waitFor(() => expect(openList).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: /Abrir Sesión/ })).not.toBeInTheDocument()
    expect(
      await screen.findByText(/no puedes abrir ni cerrar sesiones/i),
    ).toBeInTheDocument()
  })

  it('un taquillero con sus rutas por defecto sigue pudiendo abrir', async () => {
    currentUser = { id: 6, role: { name: 'TAQUILLERO' } }
    currentPermissions = [] // sin ajustes: manda la lista estática por rol

    render(<LunchSessionPage />)

    expect(await screen.findByRole('button', { name: /Abrir Sesión/ })).toBeEnabled()
  })

  it('un 403 al listar dice que falta acceso, no que no haya sesiones', async () => {
    currentPermissions = grant('/comedor/sesion')
    openList.mockRejectedValue({ status: 403, message: 'No tiene permiso' })

    render(<LunchSessionPage />)

    expect(await screen.findByText(/No tienes acceso a las sesiones de servicio/)).toBeInTheDocument()
    // La confusión entre "no puedes ver" y "no hay nada" fue el fallo original.
    expect(screen.queryByText('No tienes ninguna sesión abierta')).not.toBeInTheDocument()
  })

  it('una lista vacía legítima sí muestra el estado vacío', async () => {
    currentPermissions = grant('/comedor/sesion')

    render(<LunchSessionPage />)

    expect(await screen.findByText('No tienes ninguna sesión abierta')).toBeInTheDocument()
    expect(screen.queryByText(/No tienes acceso/)).not.toBeInTheDocument()
  })

  it('un error que no es 403 no se atribuye a los permisos', async () => {
    currentPermissions = grant('/comedor/sesion')
    openList.mockRejectedValue({ status: 500, message: 'Servicio no disponible' })

    render(<LunchSessionPage />)

    expect(await screen.findByText(/No se pudieron cargar las sesiones/)).toBeInTheDocument()
    expect(screen.queryByText(/No tienes acceso/)).not.toBeInTheDocument()
  })

  it('el historial exige su propia pantalla y no se cuela con la de sesión', async () => {
    currentPermissions = grant('/comedor/sesion')

    render(<LunchSessionPage />)

    await waitFor(() => expect(openList).toHaveBeenCalled())
    // Ese listado enseña las sesiones de todas las sedes: pedirlo con solo la
    // pantalla de sesión devolvería el panorama que esta vista retira.
    expect(listSessions).not.toHaveBeenCalled()
  })

  it('con la pantalla de historial concedida sí se carga', async () => {
    currentPermissions = grant('/comedor/sesion', '/comedor/historial')

    render(<LunchSessionPage />)

    await waitFor(() => expect(listSessions).toHaveBeenCalled())
  })
})
