import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/**
 * El panel de procesos vive dentro de Auditoría de Acceso: cada inicio de sesión se
 * despliega y muestra qué se hizo **en esa sesión**.
 *
 * Lo que se defiende aquí: que los procesos se pidan por el id de la sesión y no por una
 * ventana de tiempo, que se pidan al desplegar y no al cargar la lista, que desplegar exija
 * el permiso del historial —porque es el rastro de otra persona—, y que una sesión sin
 * procesos atados diga por qué en vez de dejar el hueco.
 */

const getLogs = vi.fn()
const listProcesses = vi.fn()
let permissions: { route: string; label: string; enabled: boolean }[] = []

vi.mock('../api/audit', () => ({
  auditApi: { getLogs: (skip: number, limit: number, filters: unknown) => getLogs(skip, limit, filters) },
  processHistoryApi: {
    list: (skip: number, limit: number, filters: unknown) => listProcesses(skip, limit, filters),
    listMine: vi.fn(),
    filterCatalog: vi.fn(),
    export: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin', role: { name: 'ADMIN' } },
    permissions,
  }),
}))

import { LoginAuditPage } from './LoginAuditPage'

const SESSION = {
  id: 55,
  user_id: 7,
  user_name: 'Ana Rodríguez',
  user_email: 'ana@unet.edu.ve',
  user_role: 'ADMIN',
  ip_address: '10.0.0.7',
  user_agent: 'Mozilla/5.0 Chrome/120',
  logged_at: '2026-08-12T08:00:00Z',
  process_count: 2,
}

const PROCESS = {
  id: 1,
  user_id: 7,
  login_audit_id: 55,
  actor_name: 'Ana Rodríguez',
  actor_email: 'ana@unet.edu.ve',
  actor_role: 'ADMIN',
  action: 'ELIMINAR',
  resource: 'user',
  resource_id: '31',
  details: 'Eliminación de la cuenta de Pedro Gómez',
  changes: null,
  method: 'DELETE',
  path: '/users/{user_id}',
  status_code: 204,
  ip_address: '10.0.0.7',
  user_agent: 'Mozilla/5.0 Chrome/120',
  created_at: '2026-08-12T08:30:00Z',
}

const WITH_PROCESSES = [
  { route: '/auditoria', label: 'Auditoría de Acceso', enabled: true },
  { route: '/auditoria/procesos', label: 'Historial de Procesos', enabled: true },
]

const WITHOUT_PROCESSES = [
  { route: '/auditoria', label: 'Auditoría de Acceso', enabled: true },
  { route: '/auditoria/procesos', label: 'Historial de Procesos', enabled: false },
]

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginAuditPage />
    </MemoryRouter>,
  )
}

describe('LoginAuditPage — procesos por sesión', () => {
  beforeEach(() => {
    getLogs.mockReset()
    listProcesses.mockReset()
    permissions = WITH_PROCESSES
    getLogs.mockResolvedValue({ total: 1, items: [SESSION] })
    listProcesses.mockResolvedValue({ total: 1, items: [PROCESS] })
  })

  it('muestra cuántos procesos tuvo cada sesión sin desplegarla', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument())
    expect(screen.getByText('2')).toBeInTheDocument()
    // Y no los pide hasta que hagan falta.
    expect(listProcesses).not.toHaveBeenCalled()
  })

  it('al desplegar, pide los procesos de esa sesión por su id', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Ver detalle de la sesión/ }))

    await waitFor(() =>
      expect(listProcesses).toHaveBeenCalledWith(
        0, expect.any(Number), { login_audit_id: 55 },
      ),
    )
    // Por id de sesión, no por rango de fechas: con la misma persona en dos equipos, la
    // ventana de tiempo atribuye a una sesión lo que hizo la otra.
    expect(listProcesses.mock.calls[0][2]).not.toHaveProperty('from_date')
    await waitFor(() =>
      expect(screen.getByText('Eliminación de la cuenta de Pedro Gómez')).toBeInTheDocument(),
    )
  })

  it('el detalle de la sesión muestra la IP y el dispositivo', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Ver detalle de la sesión/ }))

    await waitFor(() => expect(screen.getByText('Agente completo')).toBeInTheDocument())
    expect(screen.getAllByText('10.0.0.7').length).toBeGreaterThan(0)
    expect(screen.getByText('Mozilla/5.0 Chrome/120')).toBeInTheDocument()
  })

  it('una sesión sin procesos atados explica por qué', async () => {
    const user = userEvent.setup()
    listProcesses.mockResolvedValue({ total: 0, items: [] })
    getLogs.mockResolvedValue({ total: 1, items: [{ ...SESSION, process_count: 0 }] })
    renderPage()

    await waitFor(() => expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Ver detalle de la sesión/ }))

    await waitFor(() =>
      expect(screen.getByText(/anterior al registro de procesos por sesión/)).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('link', { name: /Ver todo el historial de esta persona/ }),
    ).toHaveAttribute('href', '/auditoria/procesos?usuario=7')
  })

  it('sin el permiso del historial no hay nada que desplegar, y se dice', async () => {
    permissions = WITHOUT_PROCESSES
    renderPage()

    await waitFor(() => expect(screen.getByText('Ana Rodríguez')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /Ver detalle/ })).not.toBeInTheDocument()
    expect(screen.getByText(/hace falta el permiso del Historial de Procesos/)).toBeInTheDocument()
  })

  it('un ingreso de una cuenta ya eliminada sigue en el panel', async () => {
    getLogs.mockResolvedValue({
      total: 1,
      items: [{ ...SESSION, user_id: null, user_name: 'Rosa Díaz' }],
    })
    renderPage()

    await waitFor(() => expect(screen.getByText('Rosa Díaz')).toBeInTheDocument())
    expect(screen.getByText('cuenta eliminada')).toBeInTheDocument()
  })
})
