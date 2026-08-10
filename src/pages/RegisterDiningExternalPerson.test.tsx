import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Student } from '../types/user'

/**
 * El caso que originó el cambio: se registra a una persona en Gente Externa, llega a
 * la taquilla y el sistema no la encuentra. Hay que pulsar Enter otra vez y la flecha
 * abajo —el atajo con el que se registra sin soltar el lector— no hace nada.
 *
 * Los tres síntomas eran el mismo fallo: la búsqueda nunca consultaba el padrón de
 * gente externa, así que no había ficha en pantalla; sin ficha, la condición del
 * botón era falsa y **ni siquiera se armaba** el escuchador de flechas.
 *
 * Un atajo que "no hace nada" es indistinguible de un atajo roto, así que el caso se
 * fija aquí y no queda solo implicado por la condición general.
 */

const EXTERNAL: Student = {
  cedula: '87654321',
  name: 'Rosa Gómez',
  email: '',
  career: '',
  user_type: '',
  is_suspended: false,
  is_acceso_directo: false,
  person_kind: 'external',
  external_person_id: 77,
  external_label: 'Congreso Julio 2026',
  gender: 'F',
}

const registerDining = vi.fn()
const lookup = vi.fn()
const checkByDocument = vi.fn()
const sessionRecent = vi.fn()
const check = vi.fn()
const history = vi.fn()

vi.mock('../api/student', () => ({
  studentApi: {
    lookup: (q: string) => lookup(q),
    registerDining: (payload: unknown) => registerDining(payload),
  },
  studentToIdentity: vi.fn(),
}))

vi.mock('../api/consumption', () => ({
  consumptionApi: {
    checkByDocument: (documentId: string) => checkByDocument(documentId),
    sessionRecent: (id: number, limit: number) => sessionRecent(id, limit),
    check: (id: number) => check(id),
  },
}))

vi.mock('../api/sanction', () => ({
  sanctionApi: { history: (id: number) => history(id), quickCreate: vi.fn() },
}))

vi.mock('../api/lunchSession', () => ({
  lunchSessionApi: {
    today: () => Promise.resolve({ id: 5, date: '2026-08-10', status: 'OPEN', sede_id: 1 }),
  },
}))

// Se usa el `SedeSelector` real con su catálogo simulado: una sola sede activa hace
// que la pantalla la seleccione sola y deje de bloquear el registro. Un doble que
// invoque `onLoaded` en el cuerpo del render dispara un setState del padre durante el
// render y deja el árbol en bucle — la prueba se cuelga sin decir por qué.
vi.mock('../api/sedes', () => ({
  sedesApi: {
    list: () => Promise.resolve({ total: 1, items: [{ id: 1, name: 'Paramillo', is_active: true }] }),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Taquillero', role: { name: 'TAQUILLERO' } } }),
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../utils/sound', () => ({
  playSound: () => () => {},
  DUPLICATE_ALERT_SOUND: 'x',
  DUPLICATE_ALERT_DURATION_MS: 1,
}))

import { RegisterDining } from './RegisterDining'

async function searchExternal(user: ReturnType<typeof userEvent.setup>) {
  // La sede y la sesión se resuelven de forma asíncrona; hasta entonces el campo y
  // el botón están deshabilitados y escribir en ellos no haría nada.
  await waitFor(() => expect(screen.getByRole('button', { name: 'REGISTRA' })).toBeEnabled())
  await user.type(screen.getByLabelText('Cedula / Pasaporte / Carnet'), '87654321')
  await user.click(screen.getByRole('button', { name: 'REGISTRA' }))
  await waitFor(() => expect(screen.getByDisplayValue('Rosa Gómez')).toBeInTheDocument())
}

describe('RegisterDining — persona externa', () => {
  beforeEach(() => {
    lookup.mockReset()
    registerDining.mockReset()
    checkByDocument.mockReset()
    sessionRecent.mockReset()
    check.mockReset()
    history.mockReset()

    lookup.mockResolvedValue(EXTERNAL)
    registerDining.mockResolvedValue(undefined)
    sessionRecent.mockResolvedValue({ total: 0, items: [] })
    checkByDocument.mockResolvedValue({
      document_id: '87654321',
      date: '2026-08-10',
      acceso_directo_id: null,
      external_person_id: 77,
      person_kind: 'external',
      has_consumed: false,
      consumption: null,
      active_sanction: null,
    })
  })

  it('muestra la ficha de la persona externa con una sola consulta', async () => {
    const user = userEvent.setup()
    render(<RegisterDining />)

    await searchExternal(user)

    // La etiqueta ocupa la casilla donde un estudiante muestra su tipo de usuario.
    expect(screen.getByDisplayValue('Congreso Julio 2026')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Estudiante')).not.toBeInTheDocument()
  })

  it('la flecha hacia abajo registra el consumo de la persona externa', async () => {
    const user = userEvent.setup()
    render(<RegisterDining />)

    await searchExternal(user)
    await user.keyboard('{ArrowDown}')

    await waitFor(() => expect(registerDining).toHaveBeenCalled())
    expect(registerDining.mock.calls[0][0]).toMatchObject({
      external_person_id: 77,
      session_id: 5,
    })
  })

  it('no envía el alta al vuelo, que la duplicaría como acceso directo', async () => {
    const user = userEvent.setup()
    render(<RegisterDining />)

    await searchExternal(user)
    await user.keyboard('{ArrowDown}')

    await waitFor(() => expect(registerDining).toHaveBeenCalled())
    expect(registerDining.mock.calls[0][0].person).toBeUndefined()
  })

  it('no pide la sanción activa ni el histórico de una persona externa', async () => {
    const user = userEvent.setup()
    render(<RegisterDining />)

    await searchExternal(user)

    expect(check).not.toHaveBeenCalled()
    expect(history).not.toHaveBeenCalled()
  })

  it('avisa antes de registrar cuando la persona externa ya comió hoy', async () => {
    checkByDocument.mockResolvedValue({
      document_id: '87654321',
      date: '2026-08-10',
      acceso_directo_id: null,
      external_person_id: 77,
      person_kind: 'external',
      has_consumed: true,
      consumption: {
        id: 3,
        registered_at: '2026-08-10T11:00:00Z',
        is_manual: false,
        lunch_session_id: 5,
        sede_name: 'Paramillo',
      },
      active_sanction: null,
    })
    const user = userEvent.setup()
    render(<RegisterDining />)

    await searchExternal(user)
    await user.keyboard('{ArrowDown}')

    // El aviso previo apaga el registro: el atajo no debe poder saltárselo.
    expect(registerDining).not.toHaveBeenCalled()
  })

  it('aguanta un servidor que todavía no trae person_kind', async () => {
    checkByDocument.mockResolvedValue({
      document_id: '87654321',
      date: '2026-08-10',
      acceso_directo_id: null,
      has_consumed: false,
      consumption: null,
      active_sanction: null,
    })
    const user = userEvent.setup()
    render(<RegisterDining />)

    await searchExternal(user)
    await user.keyboard('{ArrowDown}')

    // Se pierde el aviso previo, no la pantalla: el 409 sigue siendo la red.
    await waitFor(() => expect(registerDining).toHaveBeenCalled())
  })
})
