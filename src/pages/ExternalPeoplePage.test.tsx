import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * La etiqueta sustituye al par fijo jubilado/externo porque quien administra el
 * comedor da acceso a **grupos** —un congreso, una jornada— y necesita retirarles el
 * acceso a todos juntos. Lo que se defiende aquí es que crear una etiqueta cueste lo
 * mismo que elegirla, y que la baja en lote sea deliberada: alcanza a decenas de
 * personas y no tiene deshacer de un clic.
 */

const LABELS = [
  { id: 1, name: 'Jubilado' },
  { id: 2, name: 'Externo' },
  { id: 3, name: 'Congreso Julio 2026' },
]

const PERSON = {
  id: 10,
  first_name: 'Rosa',
  last_name: 'Gómez',
  document_id: '87654321',
  card_code: null,
  email: null,
  gender: 'F',
  label_id: 3,
  label: 'Congreso Julio 2026',
  career: null,
  photo_url: null,
  status: 'ACTIVE' as const,
  created_at: '2026-08-10T00:00:00Z',
  updated_at: null,
}

const listPeople = vi.fn()
const listLabels = vi.fn()
const createLabel = vi.fn()
const deactivateAll = vi.fn()
let role = 'SUPER_ADMIN'

vi.mock('../api/externalPerson', () => ({
  externalPersonApi: {
    list: (params: unknown) => listPeople(params),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('../api/externalPersonLabel', () => ({
  externalPersonLabelApi: {
    list: () => listLabels(),
    create: (data: unknown) => createLabel(data),
    rename: vi.fn(),
    remove: vi.fn(),
    deactivateAll: (id: number) => deactivateAll(id),
  },
}))

vi.mock('../api/career', () => ({
  careerApi: { list: () => Promise.resolve([]) },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Admin', role: { name: role } } }),
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

import { ExternalPeoplePage } from './ExternalPeoplePage'

const BULK_BUTTON = /Dar de baja a todos los de esta etiqueta/

async function selectLabelFilter(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => expect(screen.getByLabelText('Etiqueta')).toBeInTheDocument())
  await user.selectOptions(screen.getByLabelText('Etiqueta'), '3')
}

describe('ExternalPeoplePage — etiquetas', () => {
  beforeEach(() => {
    role = 'SUPER_ADMIN'
    listPeople.mockReset()
    listLabels.mockReset()
    createLabel.mockReset()
    deactivateAll.mockReset()
    listPeople.mockResolvedValue({ total: 1, items: [PERSON] })
    listLabels.mockResolvedValue({ total: LABELS.length, items: LABELS })
  })

  it('alimenta el filtro con el catálogo y no con una lista fija', async () => {
    render(<ExternalPeoplePage />)

    await waitFor(() => expect(listLabels).toHaveBeenCalled())
    const filter = screen.getByLabelText('Etiqueta')
    expect(filter).toHaveTextContent('Congreso Julio 2026')
  })

  it('muestra en la tabla el nombre guardado de la etiqueta', async () => {
    render(<ExternalPeoplePage />)

    await waitFor(() =>
      expect(screen.getAllByText('Congreso Julio 2026').length).toBeGreaterThan(0),
    )
  })

  it('filtra el listado por etiqueta', async () => {
    const user = userEvent.setup()
    render(<ExternalPeoplePage />)

    await selectLabelFilter(user)

    await waitFor(() =>
      expect(listPeople).toHaveBeenCalledWith(expect.objectContaining({ label_id: 3 })),
    )
  })
})

describe('ExternalPeoplePage — baja en lote', () => {
  beforeEach(() => {
    role = 'SUPER_ADMIN'
    listPeople.mockReset()
    listLabels.mockReset()
    deactivateAll.mockReset()
    listPeople.mockResolvedValue({ total: 40, items: [PERSON] })
    listLabels.mockResolvedValue({ total: LABELS.length, items: LABELS })
    deactivateAll.mockResolvedValue({
      label_id: 3, label: 'Congreso Julio 2026', total: 40, deactivated: 38, unchanged: 2,
    })
  })

  it('no ofrece la acción a quien no es SUPER_ADMIN', async () => {
    role = 'ADMIN'
    const user = userEvent.setup()
    render(<ExternalPeoplePage />)

    await selectLabelFilter(user)

    expect(screen.queryByRole('button', { name: BULK_BUTTON })).not.toBeInTheDocument()
    // El resto de la pantalla sigue disponible.
    expect(screen.getByRole('button', { name: /Registrar persona/ })).toBeInTheDocument()
  })

  it('exige teclear el nombre exacto de la etiqueta para confirmar', async () => {
    const user = userEvent.setup()
    render(<ExternalPeoplePage />)

    await selectLabelFilter(user)
    await user.click(screen.getByRole('button', { name: BULK_BUTTON }))

    const confirm = await screen.findByRole('button', { name: 'Dar de baja al grupo' })
    expect(confirm).toBeDisabled()

    await user.type(screen.getByLabelText(/Escribe «Congreso Julio 2026»/), 'otra cosa')
    expect(confirm).toBeDisabled()

    await user.clear(screen.getByLabelText(/Escribe «Congreso Julio 2026»/))
    await user.type(screen.getByLabelText(/Escribe «Congreso Julio 2026»/), 'Congreso Julio 2026')
    expect(confirm).toBeEnabled()
  })

  it('anuncia cuántas personas alcanza antes de pulsar', async () => {
    const user = userEvent.setup()
    render(<ExternalPeoplePage />)

    await selectLabelFilter(user)
    await user.click(screen.getByRole('button', { name: BULK_BUTTON }))

    // El recuento va en el modal y no solo en el mensaje posterior: después de
    // pulsar ya no sirve de nada.
    expect(await screen.findByText(/40 personas/)).toBeInTheDocument()
  })

  it('dice que quedan inactivas y que el historial se conserva', async () => {
    const user = userEvent.setup()
    render(<ExternalPeoplePage />)

    await selectLabelFilter(user)
    await user.click(screen.getByRole('button', { name: BULK_BUTTON }))

    expect(await screen.findByText(/historial\s+de consumos se conserva/)).toBeInTheDocument()
  })

  it('invoca la baja y recarga el listado', async () => {
    const user = userEvent.setup()
    render(<ExternalPeoplePage />)

    await selectLabelFilter(user)
    await user.click(screen.getByRole('button', { name: BULK_BUTTON }))
    await user.type(screen.getByLabelText(/Escribe «Congreso Julio 2026»/), 'Congreso Julio 2026')
    await user.click(screen.getByRole('button', { name: 'Dar de baja al grupo' }))

    await waitFor(() => expect(deactivateAll).toHaveBeenCalledWith(3))
  })
})

describe('ExternalPeoplePage — crear etiqueta desde el formulario', () => {
  beforeEach(() => {
    role = 'SUPER_ADMIN'
    listPeople.mockReset()
    listLabels.mockReset()
    createLabel.mockReset()
    listPeople.mockResolvedValue({ total: 0, items: [] })
    listLabels.mockResolvedValue({ total: LABELS.length, items: LABELS })
  })

  async function openCreateForm(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /Registrar persona/ }))
    await waitFor(() => expect(screen.getByLabelText('Etiqueta', { selector: '#form-label' })).toBeInTheDocument())
  }

  it('crea la etiqueta sin perder lo ya escrito en el formulario', async () => {
    createLabel.mockResolvedValue({ id: 4, name: 'Jornada Deportiva' })
    listLabels
      .mockResolvedValueOnce({ total: LABELS.length, items: LABELS })
      .mockResolvedValueOnce({ total: LABELS.length, items: LABELS })
      .mockResolvedValue({ total: 4, items: [...LABELS, { id: 4, name: 'Jornada Deportiva' }] })
    const user = userEvent.setup()
    render(<ExternalPeoplePage />)

    await openCreateForm(user)
    await user.type(screen.getByLabelText('Nombre'), 'Rosa')
    await user.selectOptions(screen.getByLabelText('Etiqueta', { selector: '#form-label' }), '__create__')
    await user.type(await screen.findByLabelText('Etiqueta nueva'), 'Jornada Deportiva')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() => expect(createLabel).toHaveBeenCalledWith({ name: 'Jornada Deportiva' }))
    // El resto del formulario no se pierde al crear.
    expect(screen.getByLabelText('Nombre')).toHaveValue('Rosa')
  })

  it('ante un nombre repetido selecciona la que ya existía en vez de dar error', async () => {
    // Elegirla es lo que la persona quería: un 409 aquí no es un error que mostrar.
    createLabel.mockRejectedValue({ status: 409, message: 'Ya existe' })
    const user = userEvent.setup()
    render(<ExternalPeoplePage />)

    await openCreateForm(user)
    await user.selectOptions(screen.getByLabelText('Etiqueta', { selector: '#form-label' }), '__create__')
    await user.type(await screen.findByLabelText('Etiqueta nueva'), 'congreso julio 2026')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    await waitFor(() =>
      expect(screen.getByLabelText('Etiqueta', { selector: '#form-label' })).toHaveValue('3'),
    )
  })

  it('deja el modo de creación abierto cuando el nombre está reservado', async () => {
    createLabel.mockRejectedValue({ status: 409, message: "'worker' es un tipo de persona reservado" })
    const user = userEvent.setup()
    render(<ExternalPeoplePage />)

    await openCreateForm(user)
    await user.selectOptions(screen.getByLabelText('Etiqueta', { selector: '#form-label' }), '__create__')
    await user.type(await screen.findByLabelText('Etiqueta nueva'), 'worker')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText(/reservado/)).toBeInTheDocument()
    expect(screen.getByLabelText('Etiqueta nueva')).toBeInTheDocument()
  })
})
