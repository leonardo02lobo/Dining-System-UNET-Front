import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Student } from '../types/user'
import { todayISO } from '../utils/sanctionDates'

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

// La sesión abierta es **la de hoy**, no una fecha fija: la pantalla bloquea el registro
// cuando el turno sobrevivió a su fecha (QA-TEST#1 ALTO-1), así que una fecha escrita a
// mano convertiría estas pruebas en algo que caduca al día siguiente de escribirlas.
// `todayISO()` se llama dentro de la factoría porque `vi.mock` se iza por encima de
// cualquier constante del módulo.
vi.mock('../api/lunchSession', () => ({
  lunchSessionApi: {
    today: () => Promise.resolve({ id: 5, date: todayISO(), status: 'OPEN', sede_id: 1 }),
  },
}))

// Ya no hace falta doblar el catálogo de sedes: la pantalla no lo consulta. La sede
// viene en la cuenta y el servidor la impone en cada operación.

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Taquillero',
      role: { name: 'TAQUILLERO' },
      // Sin sede asignada, quien no administra no registra: la pantalla lo bloquea
      // antes de que el servidor lo rechace con un 403.
      sede_id: 1,
      sede_name: 'Paramillo',
    },
    // `useCan` lee los permisos efectivos del contexto: sin la lista, la pantalla no
    // podría decidir si ofrece registrar. Vacía = mandan las rutas por defecto del rol.
    permissions: [],
  }),
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
  // Buscar ya no depende de la sede ni de la sesión, así que no hay nada que esperar
  // antes de escribir: la consulta es válida a cualquier hora.
  await user.type(screen.getByLabelText('Cedula / Pasaporte / Carnet'), '87654321')
  await user.click(screen.getByRole('button', { name: 'Buscar' }))
  await waitFor(() => expect(screen.getByDisplayValue('Rosa Gómez')).toBeInTheDocument())
}

/**
 * Registrar sí depende de la sesión, que se resuelve de forma asíncrona. El atajo de
 * flechas no se arma hasta que el botón está operativo, así que este es el punto de
 * sincronización de las pruebas que registran.
 */
async function waitForRegisterReady() {
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Registrar Consumo' })).toBeEnabled(),
  )
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
    await waitForRegisterReady()
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
    await waitForRegisterReady()
    await user.keyboard('{ArrowDown}')

    await waitFor(() => expect(registerDining).toHaveBeenCalled())
    expect(registerDining.mock.calls[0][0].person).toBeUndefined()
  })

  it('no pide la sanción activa ni el histórico de una persona externa', async () => {
    // `checkByDocument` ya trae la sanción activa: la llamada a `check/{id}` sobraba
    // para todo el mundo, no solo para la gente externa.
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
    await waitForRegisterReady()
    await user.keyboard('{ArrowDown}')

    // Se pierde el aviso previo, no la pantalla: el 409 sigue siendo la red.
    await waitFor(() => expect(registerDining).toHaveBeenCalled())
  })
})
