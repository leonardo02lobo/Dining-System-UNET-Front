import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Student } from '../types/user'

/**
 * El registro manual opera sobre una fecha arbitraria, así que la comprobación de
 * consumo previo tiene que hacerse sobre **la fecha seleccionada en el formulario**,
 * no sobre hoy. Avisar de lo que alguien comió hoy mientras se le registra un consumo
 * del día 3 sería ruido, y peor: entrenaría al operador a ignorar el aviso.
 */

const PAST_DATE = '2026-08-03'

const STUDENT: Student = {
  cedula: '31419581',
  name: 'Frankly Bautista',
  email: 'frankly@unet.edu.ve',
  career: 'Ingeniería En Informática',
  user_type: 'STUDENT',
  is_suspended: false,
  is_acceso_directo: true,
  acceso_directo_id: 7,
  person_kind: 'acceso_directo',
}

const checkByDocument = vi.fn()
const listManual = vi.fn()
const daySummary = vi.fn()

vi.mock('../api/consumption', () => ({
  consumptionApi: {
    checkByDocument: (documentId: string, date?: string) => checkByDocument(documentId, date),
    listManual: (params: unknown) => listManual(params),
    daySummary: (params: unknown) => daySummary(params),
    registerManual: vi.fn(),
    updateManual: vi.fn(),
    deleteManual: vi.fn(),
  },
}))

vi.mock('../api/student', () => ({
  studentApi: { lookup: () => Promise.resolve(STUDENT) },
  studentToIdentity: vi.fn(),
}))

vi.mock('../api/sanction', () => ({
  sanctionApi: { history: () => Promise.resolve({ total: 0, items: [] }) },
}))

vi.mock('../api/acceso_directo', () => ({
  accesoDirectoApi: { lookup: vi.fn() },
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

import { ManualRegistrationPage } from './ManualRegistrationPage'

/** Consulta la cédula tras fijar la fecha del formulario. */
async function searchWithDate(user: ReturnType<typeof userEvent.setup>, date: string) {
  const dateField = screen.getByLabelText('Fecha del registro*')
  await user.clear(dateField)
  await user.type(dateField, date)
  await user.type(screen.getByLabelText('Cédula / Carnet*'), '31419581')
  await user.click(screen.getByRole('button', { name: 'Buscar' }))
}

describe('ManualRegistrationPage — aviso de consumo previo por fecha', () => {
  beforeEach(() => {
    checkByDocument.mockReset()
    listManual.mockReset()
    daySummary.mockReset()
    listManual.mockResolvedValue({ total: 0, items: [] })
    daySummary.mockResolvedValue({ total: 0, items: [] })
    checkByDocument.mockResolvedValue({
      document_id: '31419581',
      date: PAST_DATE,
      acceso_directo_id: 7,
      has_consumed: false,
      consumption: null,
      active_sanction: null,
    })
  })

  it('consulta el consumo previo con la fecha seleccionada, no con hoy', async () => {
    const user = userEvent.setup()
    render(<ManualRegistrationPage />)

    await searchWithDate(user, PAST_DATE)

    await waitFor(() => expect(checkByDocument).toHaveBeenCalledWith('31419581', PAST_DATE))
    // Sin consumo ese día: ni aviso ni botón bloqueado.
    expect(screen.queryByText(/Ya registró su consumo/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guardar Registro/ })).toBeEnabled()
  })

  it('rehace la comprobación cuando el operador cambia la fecha con la persona ya consultada', async () => {
    const user = userEvent.setup()
    render(<ManualRegistrationPage />)

    await searchWithDate(user, PAST_DATE)
    await waitFor(() => expect(checkByDocument).toHaveBeenCalledWith('31419581', PAST_DATE))

    checkByDocument.mockResolvedValue({
      document_id: '31419581',
      date: '2026-08-05',
      acceso_directo_id: 7,
      has_consumed: true,
      consumption: {
        id: 11,
        registered_at: '2026-08-05T15:42:11Z',
        is_manual: false,
        lunch_session_id: 61,
        sede_name: 'Paramillo',
      },
      active_sanction: null,
    })

    const activeDateField = screen.getByLabelText('Fecha del registro*')
    await user.clear(activeDateField)
    await user.type(activeDateField, '2026-08-05')

    await waitFor(() => expect(checkByDocument).toHaveBeenCalledWith('31419581', '2026-08-05'))
    // El aviso distingue taquilla de registro manual e incluye hora y sede.
    const notice = await screen.findByText(/Ya registró su consumo/)
    expect(notice.textContent).toContain('Paramillo')
    expect(notice.textContent).toContain('registrado en taquilla')
    expect(screen.getByRole('button', { name: /Guardar Registro/ })).toBeDisabled()
  })

  it('si la comprobación falla, la ficha se muestra igual y el registro sigue siendo posible', async () => {
    const user = userEvent.setup()
    checkByDocument.mockRejectedValue({ status: 503, message: 'Servicio no disponible' })
    render(<ManualRegistrationPage />)

    await searchWithDate(user, PAST_DATE)

    expect(await screen.findByDisplayValue('Frankly Bautista')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guardar Registro/ })).toBeEnabled()
  })
})

describe('ManualRegistrationPage — relación de ingresos del día', () => {
  beforeEach(() => {
    checkByDocument.mockReset()
    listManual.mockReset()
    daySummary.mockReset()
    listManual.mockResolvedValue({ total: 0, items: [] })
  })

  it('la pestaña "Ingresos del día" trae los dos orígenes y los distingue por fila', async () => {
    const user = userEvent.setup()
    daySummary.mockResolvedValue({
      total: 2,
      items: [
        {
          id: 1, acceso_directo_id: 7, lunch_session_id: 61, date: PAST_DATE,
          registered_by_id: 1, registered_at: '2026-08-03T12:00:00Z', is_manual: false,
          document_id: '31419581', first_name: 'Frankly', last_name: 'Bautista',
          user_type: 'STUDENT', career: 'Ingeniería En Informática',
        },
        {
          id: 2, acceso_directo_id: 8, lunch_session_id: 61, date: PAST_DATE,
          registered_by_id: 1, registered_at: '2026-08-03T13:00:00Z', is_manual: true,
          document_id: '20000000', first_name: 'Ana', last_name: 'Pérez',
          user_type: 'TEACHER', career: null,
        },
      ],
    })
    render(<ManualRegistrationPage />)

    await user.click(screen.getByRole('button', { name: 'Ingresos del día' }))

    expect(await screen.findByText('Taquilla')).toBeInTheDocument()
    expect(screen.getByText('Manual')).toBeInTheDocument()
    expect(screen.getByText('31419581')).toBeInTheDocument()
    expect(screen.getByText('20000000')).toBeInTheDocument()
  })

  it('una fecha sin ingresos muestra el estado vacío y ningún error', async () => {
    const user = userEvent.setup()
    daySummary.mockResolvedValue({ total: 0, items: [] })
    render(<ManualRegistrationPage />)

    await user.click(screen.getByRole('button', { name: 'Ingresos del día' }))

    expect(
      await screen.findByText('No hay ingresos registrados en la fecha seleccionada.'),
    ).toBeInTheDocument()
  })

  it('un fallo del listado se muestra en el sitio sin tumbar la pantalla', async () => {
    const user = userEvent.setup()
    daySummary.mockRejectedValue({ status: 500, message: 'Servicio no disponible' })
    render(<ManualRegistrationPage />)

    await user.click(screen.getByRole('button', { name: 'Ingresos del día' }))

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
    expect(
      screen.getByText('No hay ingresos registrados en la fecha seleccionada.'),
    ).toBeInTheDocument()
  })
})
