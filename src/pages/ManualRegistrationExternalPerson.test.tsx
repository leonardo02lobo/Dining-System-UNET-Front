import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Student } from '../types/user'

/**
 * fe-gente-externa-registro-manual — el registro manual admite a una persona externa.
 *
 * Hasta este cambio la pantalla cortaba el guardado con «el registro manual todavía no
 * admite personas externas»: era el mal menor frente a enviar el alta al vuelo, que
 * habría creado un acceso directo con la cédula de alguien ya registrado como externo.
 * El caso quedaba sin resolver, y el registro manual es precisamente la pantalla de los
 * días pasados: el invitado de una jornada al que se le sirvió el plato el martes y se
 * apuntó en papel no tenía forma de entrar al sistema.
 */

const PAST_DATE = '2026-08-03'

const EXTERNAL: Student = {
  cedula: '10000000',
  name: 'Luis Ríos',
  email: null,
  career: null,
  user_type: '',
  is_suspended: false,
  is_acceso_directo: false,
  person_kind: 'external',
  external_person_id: 42,
  external_label: 'Jornada Deportiva',
}

const ACCESO_DIRECTO: Student = {
  cedula: '20000000',
  name: 'Ana Pérez',
  email: 'ana@unet.edu.ve',
  career: null,
  user_type: 'TEACHER',
  is_suspended: false,
  is_acceso_directo: true,
  acceso_directo_id: 7,
  person_kind: 'acceso_directo',
}

const checkByDocument = vi.fn()
const listManual = vi.fn()
const daySummary = vi.fn()
const registerManual = vi.fn()
const updateManual = vi.fn()
const lookup = vi.fn()
const notifyError = vi.fn()

vi.mock('../api/consumption', () => ({
  consumptionApi: {
    checkByDocument: (documentId: string, date?: string) => checkByDocument(documentId, date),
    listManual: (params: unknown) => listManual(params),
    daySummary: (params: unknown) => daySummary(params),
    registerManual: (payload: unknown) => registerManual(payload),
    updateManual: (id: number, payload: unknown) => updateManual(id, payload),
    deleteManual: vi.fn(),
  },
}))

vi.mock('../api/student', () => ({
  studentApi: { lookup: (q: string) => lookup(q) },
  studentToIdentity: (s: Student) => ({ document_id: s.cedula, first_name: s.name }),
}))

vi.mock('../api/sanction', () => ({
  sanctionApi: { history: () => Promise.resolve({ total: 0, items: [] }) },
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: (...args: unknown[]) => notifyError(...args) },
}))

import { ManualRegistrationPage } from './ManualRegistrationPage'

async function searchCedula(user: ReturnType<typeof userEvent.setup>, cedula: string) {
  const dateField = screen.getByLabelText('Fecha del registro*')
  await user.clear(dateField)
  await user.type(dateField, PAST_DATE)
  await user.type(screen.getByLabelText('Cédula / Carnet*'), cedula)
  await user.click(screen.getByRole('button', { name: 'Buscar' }))
  await screen.findByDisplayValue(cedula === '10000000' ? 'Luis Ríos' : 'Ana Pérez')
}

beforeEach(() => {
  for (const fn of [checkByDocument, listManual, daySummary, registerManual, updateManual, lookup, notifyError]) {
    fn.mockReset()
  }
  listManual.mockResolvedValue({ total: 0, items: [] })
  daySummary.mockResolvedValue({ total: 0, items: [] })
  registerManual.mockResolvedValue({})
  updateManual.mockResolvedValue({})
  checkByDocument.mockResolvedValue({
    document_id: '10000000',
    date: PAST_DATE,
    acceso_directo_id: null,
    external_person_id: 42,
    person_kind: 'external',
    has_consumed: false,
    consumption: null,
    active_sanction: null,
  })
})

describe('ManualRegistrationPage — el guardado de una persona externa', () => {
  it('envía external_person_id y no envía person', async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue(EXTERNAL)
    render(<ManualRegistrationPage />)

    await searchCedula(user, '10000000')
    await user.click(screen.getByRole('button', { name: /Guardar Registro/ }))

    await waitFor(() => expect(registerManual).toHaveBeenCalledTimes(1))
    const payload = registerManual.mock.calls[0][0]
    expect(payload).toEqual({ date: PAST_DATE, external_person_id: 42 })
    expect(payload).not.toHaveProperty('person')
  })

  it('el atajo ArrowDown registra a una persona externa', async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue(EXTERNAL)
    render(<ManualRegistrationPage />)

    await searchCedula(user, '10000000')
    await user.click(document.body)
    await user.keyboard('{ArrowDown}')

    await waitFor(() => expect(registerManual).toHaveBeenCalledTimes(1))
    expect(registerManual.mock.calls[0][0]).toMatchObject({ external_person_id: 42 })
  })

  it('un rechazo del servidor no se reintenta con el alta al vuelo', async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue(EXTERNAL)
    registerManual.mockRejectedValue({ status: 409, message: 'Ya tiene un registro' })
    render(<ManualRegistrationPage />)

    await searchCedula(user, '10000000')
    await user.click(screen.getByRole('button', { name: /Guardar Registro/ }))

    await waitFor(() => expect(notifyError).toHaveBeenCalled())
    expect(registerManual).toHaveBeenCalledTimes(1)
  })

  it('un acceso directo sigue registrándose por su identificador (regresión)', async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue(ACCESO_DIRECTO)
    checkByDocument.mockResolvedValue({
      document_id: '20000000', date: PAST_DATE, acceso_directo_id: 7,
      has_consumed: false, consumption: null, active_sanction: null,
    })
    render(<ManualRegistrationPage />)

    await searchCedula(user, '20000000')
    await user.click(screen.getByRole('button', { name: /Guardar Registro/ }))

    await waitFor(() => expect(registerManual).toHaveBeenCalledTimes(1))
    expect(registerManual.mock.calls[0][0]).toEqual({ date: PAST_DATE, acceso_directo_id: 7 })
  })

  it('quien no está en ninguna de las dos tablas sigue dándose de alta al vuelo', async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue({ ...ACCESO_DIRECTO, is_acceso_directo: false, acceso_directo_id: undefined, person_kind: 'roster' })
    checkByDocument.mockResolvedValue({
      document_id: '20000000', date: PAST_DATE, acceso_directo_id: null,
      has_consumed: false, consumption: null, active_sanction: null,
    })
    render(<ManualRegistrationPage />)

    await searchCedula(user, '20000000')
    await user.click(screen.getByRole('button', { name: /Guardar Registro/ }))

    await waitFor(() => expect(registerManual).toHaveBeenCalledTimes(1))
    expect(registerManual.mock.calls[0][0]).toHaveProperty('person')
  })
})

describe('ManualRegistrationPage — clasificación en el listado', () => {
  const ROWS = [
    {
      id: 1, acceso_directo_id: 7, lunch_session_id: 61, date: PAST_DATE,
      registered_by_id: 1, registered_at: '2026-08-03T12:00:00Z', is_manual: true,
      document_id: '20000000', first_name: 'Ana', last_name: 'Pérez',
      user_type: 'TEACHER', person_type: null, career: null,
    },
    {
      id: 2, acceso_directo_id: null, external_person_id: 42, lunch_session_id: 61, date: PAST_DATE,
      registered_by_id: 1, registered_at: '2026-08-03T13:00:00Z', is_manual: true,
      document_id: '10000000', first_name: 'Luis', last_name: 'Ríos',
      user_type: null, person_type: 'Jornada Deportiva', career: null,
    },
  ]

  it('la fila de un acceso directo trae su rol traducido y la de una externa su etiqueta', async () => {
    listManual.mockResolvedValue({ total: 2, items: ROWS })
    render(<ManualRegistrationPage />)

    expect(await screen.findByText('Docente')).toBeInTheDocument()
    expect(screen.getByText('Jornada Deportiva')).toBeInTheDocument()
    // El distintivo separa la etiqueta de un tipo del padrón: leída sin él,
    // «Jornada Deportiva» parecería una carrera o un rol del sistema.
    expect(screen.getByText('· externa')).toBeInTheDocument()
  })

  it('una fila sin ninguna de las dos clasificaciones muestra el guion sin romper la tabla', async () => {
    listManual.mockResolvedValue({
      total: 1,
      items: [{ ...ROWS[1], person_type: null }],
    })
    render(<ManualRegistrationPage />)

    expect(await screen.findByText('10000000')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})

describe('ManualRegistrationPage — edición de una fila de gente externa', () => {
  const EXTERNAL_ROW = {
    id: 2, acceso_directo_id: null, external_person_id: 42, lunch_session_id: 61,
    date: PAST_DATE, registered_by_id: 1, registered_at: '2026-08-03T13:00:00Z',
    is_manual: true, document_id: '10000000', first_name: 'Luis', last_name: 'Ríos',
    user_type: null, person_type: 'Jornada Deportiva', career: null,
  }

  it('cambiar solo la fecha no reasigna la persona', async () => {
    const user = userEvent.setup()
    listManual.mockResolvedValue({ total: 1, items: [EXTERNAL_ROW] })
    render(<ManualRegistrationPage />)

    await user.click(await screen.findByRole('button', { name: /Editar/ }))
    const dateField = screen.getByLabelText('Fecha del registro')
    await user.clear(dateField)
    await user.type(dateField, '2026-08-05')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(updateManual).toHaveBeenCalledTimes(1))
    expect(updateManual.mock.calls[0][1]).toEqual({ date: '2026-08-05' })
  })

  it('reasignar la fila a una persona externa envía su external_person_id', async () => {
    const user = userEvent.setup()
    listManual.mockResolvedValue({
      total: 1,
      items: [{ ...EXTERNAL_ROW, acceso_directo_id: 7, external_person_id: null, user_type: 'TEACHER', person_type: null, document_id: '20000000' }],
    })
    lookup.mockResolvedValue(EXTERNAL)
    render(<ManualRegistrationPage />)

    await user.click(await screen.findByRole('button', { name: /Editar/ }))
    const cedulaField = screen.getByLabelText('Cédula de la persona')
    await user.clear(cedulaField)
    await user.type(cedulaField, '10000000')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(updateManual).toHaveBeenCalledTimes(1))
    expect(updateManual.mock.calls[0][1]).toEqual({ external_person_id: 42 })
  })
})
