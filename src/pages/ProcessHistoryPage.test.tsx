import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/**
 * fe-historial-procesos-usuario — el historial de procesos por persona.
 *
 * Lo que se defiende aquí: que la persona seleccionada mande sobre la consulta y viaje en
 * la URL, que el detalle se abra sin sacar al usuario de la lista, que una entrada sin
 * enriquecer siga siendo legible, que un campo redactado se vea marcado y sin valor, que la
 * exportación mande los filtros y no la página, y que el vacío no parezca una avería.
 */

const listLogs = vi.fn()
const filterCatalog = vi.fn()
const exportLogs = vi.fn()
const listUsers = vi.fn()
const downloadBlob = vi.fn()

vi.mock('../api/audit', () => ({
  processHistoryApi: {
    list: (skip: number, limit: number, filters: unknown) => listLogs(skip, limit, filters),
    listMine: vi.fn(),
    filterCatalog: () => filterCatalog(),
    export: (format: string, filters: unknown) => exportLogs(format, filters),
  },
}))

vi.mock('../api/user', () => ({
  userApi: { list: () => listUsers() },
}))

vi.mock('../utils/downloadBlob', () => ({
  downloadBlob: (blob: Blob, name: string) => downloadBlob(blob, name),
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

import { ProcessHistoryPage } from './ProcessHistoryPage'

const USERS = [
  { id: 7, name: 'Ana Rodríguez', email: 'ana@unet.edu.ve', role_id: 1, role: { id: 1, name: 'ADMIN' }, is_active: true, sede_id: null, sede_name: null, created_at: '', updated_at: null },
  { id: 9, name: 'Luis Pérez', email: 'luis@unet.edu.ve', role_id: 2, role: { id: 2, name: 'TAQUILLERO' }, is_active: true, sede_id: null, sede_name: null, created_at: '', updated_at: null },
]

const ENTRY_WITH_CHANGES = {
  id: 1,
  user_id: 7,
  actor_name: 'Ana Rodríguez',
  actor_email: 'ana@unet.edu.ve',
  actor_role: 'ADMIN',
  action: 'ACTUALIZAR',
  resource: 'user',
  resource_id: '9',
  details: 'Edición de la cuenta Luis Pérez',
  changes: {
    password: { antes: '«redactado»', después: '«redactado»' },
    name: { antes: 'Luis P.', después: 'Luis Pérez' },
  },
  method: 'PUT',
  path: '/users/{user_id}',
  status_code: 200,
  ip_address: '10.0.0.4',
  user_agent: 'Mozilla/5.0 Chrome/120',
  created_at: '2026-08-12T10:15:00Z',
}

const BARE_ENTRY = {
  ...ENTRY_WITH_CHANGES,
  id: 2,
  action: 'ELIMINAR',
  resource: 'acceso_directo',
  resource_id: '31',
  details: null,
  changes: null,
}

const DELETED_ACTOR_ENTRY = {
  ...BARE_ENTRY,
  id: 3,
  user_id: null,
  actor_name: 'Rosa Díaz',
}

function renderPage(initialPath = '/auditoria/procesos') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ProcessHistoryPage />
    </MemoryRouter>,
  )
}

describe('ProcessHistoryPage', () => {
  beforeEach(() => {
    listLogs.mockReset()
    filterCatalog.mockReset()
    exportLogs.mockReset()
    listUsers.mockReset()
    downloadBlob.mockReset()
    listLogs.mockResolvedValue({ total: 1, items: [ENTRY_WITH_CHANGES] })
    filterCatalog.mockResolvedValue({ actions: ['ACTUALIZAR', 'ELIMINAR'], resources: ['user'] })
    listUsers.mockResolvedValue(USERS)
    exportLogs.mockResolvedValue(new Blob(['x']))
  })

  it('sin persona seleccionada pide el movimiento de todos', async () => {
    renderPage()

    await waitFor(() => expect(listLogs).toHaveBeenCalled())
    expect(listLogs.mock.calls[0][2]).toMatchObject({ user_id: undefined })
  })

  it('arranca con la persona del parámetro de la URL', async () => {
    renderPage('/auditoria/procesos?usuario=7')

    await waitFor(() =>
      expect(listLogs).toHaveBeenCalledWith(0, 50, expect.objectContaining({ user_id: 7 })),
    )
    await waitFor(() =>
      expect(screen.getByLabelText('Persona')).toHaveValue('7'),
    )
  })

  it('al elegir una persona filtra por ella', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByLabelText('Persona')).toBeInTheDocument())
    await user.selectOptions(screen.getByLabelText('Persona'), '9')

    await waitFor(() =>
      expect(listLogs).toHaveBeenCalledWith(0, 50, expect.objectContaining({ user_id: 9 })),
    )
  })

  it('llena los desplegables con el catálogo del servidor', async () => {
    renderPage()

    await waitFor(() => expect(filterCatalog).toHaveBeenCalled())
    // El código llega del servidor; el rótulo lo pone el cliente.
    expect(screen.getByLabelText('Acción')).toHaveTextContent('Modificación')
    expect(screen.getByLabelText('Acción')).toHaveTextContent('Eliminación')
  })

  it('abre el detalle dentro de la lista, con el antes y el después', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Edición de la cuenta Luis Pérez')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Ver detalle/ }))

    expect(screen.getByText('Luis P.')).toBeInTheDocument()
    expect(screen.getByText('nombre')).toBeInTheDocument()
    // La lista sigue ahí: comparar entradas seguidas es la tarea.
    expect(screen.getByText('Edición de la cuenta Luis Pérez')).toBeInTheDocument()
  })

  it('un campo redactado se muestra marcado y sin valor', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Edición de la cuenta Luis Pérez')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Ver detalle/ }))

    expect(screen.getByText('contraseña')).toBeInTheDocument()
    expect(screen.getAllByText('Redactado').length).toBe(2)
    expect(screen.queryByText('«redactado»')).not.toBeInTheDocument()
  })

  it('una entrada sin detalle ni cambios sigue siendo legible', async () => {
    listLogs.mockResolvedValue({ total: 1, items: [BARE_ENTRY] })
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('Eliminación de Acceso directo #31')).toBeInTheDocument(),
    )
  })

  it('marca al actor cuya cuenta ya fue eliminada', async () => {
    listLogs.mockResolvedValue({ total: 1, items: [DELETED_ACTOR_ENTRY] })
    renderPage()

    await waitFor(() => expect(screen.getByText('Rosa Díaz')).toBeInTheDocument())
    expect(screen.getByText(/cuenta eliminada/)).toBeInTheDocument()
  })

  it('la exportación manda los filtros activos y no la página', async () => {
    const user = userEvent.setup()
    renderPage('/auditoria/procesos?usuario=7')

    await waitFor(() => expect(screen.getByLabelText('Persona')).toHaveValue('7'))
    await user.click(screen.getByRole('button', { name: 'CSV' }))

    await waitFor(() =>
      expect(exportLogs).toHaveBeenCalledWith('csv', expect.objectContaining({ user_id: 7 })),
    )
    // Nada de skip/limit: el servidor exporta todo el resultado filtrado.
    expect(exportLogs.mock.calls[0][1]).not.toHaveProperty('skip')
    await waitFor(() => expect(downloadBlob).toHaveBeenCalled())
  })

  it('cambiar un filtro vuelve a la primera página', async () => {
    const user = userEvent.setup()
    listLogs.mockResolvedValue({ total: 200, items: [ENTRY_WITH_CHANGES] })
    renderPage()

    await waitFor(() => expect(screen.getByText(/Página 1 de 4/)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Siguiente/ }))
    await waitFor(() => expect(screen.getByText(/Página 2 de 4/)).toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText('Acción'), 'ELIMINAR')

    await waitFor(() => expect(screen.getByText(/Página 1 de 4/)).toBeInTheDocument())
    expect(listLogs).toHaveBeenLastCalledWith(0, 50, expect.objectContaining({ action: 'ELIMINAR' }))
  })

  it('el vacío sin filtros no parece una avería', async () => {
    listLogs.mockResolvedValue({ total: 0, items: [] })
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('Todavía no hay procesos registrados.')).toBeInTheDocument(),
    )
    expect(screen.queryByText(/Error/)).not.toBeInTheDocument()
  })

  it('el vacío con filtros ofrece limpiarlos', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByLabelText('Acción')).toBeInTheDocument())
    listLogs.mockResolvedValue({ total: 0, items: [] })
    await user.selectOptions(screen.getByLabelText('Acción'), 'ELIMINAR')

    await waitFor(() =>
      expect(screen.getByText(/No hay procesos registrados para estos filtros/)).toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument()
  })
})
