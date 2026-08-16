import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Student } from '../types/user'
import type { Permission } from '../api/permissions'
import { todayISO } from '../utils/sanctionDates'

/**
 * La pantalla de comedor consulta siempre y registra cuando puede.
 *
 * Lo que se fija aquí es lo que la pantalla de consulta separada hacía **mal** y por lo
 * que existía este cambio: buscaba solo en el padrón de estudiantes y resolvía el
 * consumo por `acceso_directo_id`, de modo que una persona externa que sí había comido
 * salía como "no hay registro de consumo asociado". Y lo que hacía **bien** y el
 * registro no: afirmar en positivo que la persona está en orden, en lugar de dejar que
 * el operador lo dedujera de una ausencia de avisos.
 */

const ROSTER: Student = {
  cedula: '12345678',
  name: 'Ana Pérez',
  email: 'ana@unet.edu.ve',
  career: 'Ingeniería Informática',
  user_type: 'STUDENT',
  is_suspended: false,
  is_acceso_directo: true,
  acceso_directo_id: 42,
  person_kind: 'acceso_directo',
  gender: 'F',
}

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

const NO_CONSUMPTION = {
  document_id: '12345678',
  date: '2026-08-11',
  acceso_directo_id: 42,
  external_person_id: null,
  person_kind: 'acceso_directo' as const,
  has_consumed: false,
  consumption: null,
  active_sanction: null,
}

const lookup = vi.fn()
const checkByDocument = vi.fn()
const sessionRecent = vi.fn()
const history = vi.fn()
const today = vi.fn()

vi.mock('../api/student', () => ({
  studentApi: { lookup: (q: string) => lookup(q), registerDining: vi.fn() },
  studentToIdentity: vi.fn(),
}))

vi.mock('../api/consumption', () => ({
  consumptionApi: {
    // Reenvía también la fecha: el doble se quedaba con la cédula, así que ninguna
    // prueba podía ver contra qué día se estaba preguntando.
    checkByDocument: (documentId: string, date?: string) => checkByDocument(documentId, date),
    sessionRecent: (id: number, limit: number) => sessionRecent(id, limit),
  },
}))

vi.mock('../api/sanction', () => ({
  sanctionApi: { history: (id: number) => history(id), quickCreate: vi.fn() },
}))

vi.mock('../api/lunchSession', () => ({
  // Reenvía los argumentos tal cual: la prueba comprueba que la pantalla llama a
  // `today()` **sin** sede, y un doble que normalice a `undefined` lo ocultaría.
  lunchSessionApi: { today: (...args: unknown[]) => today(...args) },
}))

/** Permisos efectivos del usuario simulado; cada prueba los ajusta antes de renderizar. */
let permissions: Permission[] = []
/** Sede asignada a la cuenta simulada. `null` = sin asignar. */
let sede: { id: number; name: string } | null = { id: 1, name: 'Paramillo' }

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Operador',
      role: { name: 'TAQUILLERO' },
      sede_id: sede?.id ?? null,
      sede_name: sede?.name ?? null,
    },
    permissions,
  }),
}))

vi.mock('../utils/toast', () => ({ notify: { success: vi.fn(), error: vi.fn() } }))

vi.mock('../utils/sound', () => ({
  playSound: () => () => {},
  DUPLICATE_ALERT_SOUND: 'x',
  DUPLICATE_ALERT_DURATION_MS: 1,
}))

import { RegisterDining } from './RegisterDining'

const SOLO_CONSULTA: Permission[] = [
  { route: '/comedor/consultar', label: 'Comedor: solo consulta', enabled: true },
  { route: '/comedor/registrar', label: 'Registro al Comedor', enabled: false },
]

/**
 * Renderiza y espera a que el arranque se asiente: la sede sale de la cuenta y dispara
 * la consulta de la sesión del día. Aserciones antes de ese punto corren contra un
 * árbol a medio resolver.
 */
async function renderScreen() {
  render(<RegisterDining />)
  await waitFor(() => expect(today).toHaveBeenCalled())
}

/** Sin sede asignada la pantalla ni siquiera consulta la sesión: no hay nada que esperar. */
async function renderUnassigned() {
  render(<RegisterDining />)
  await screen.findByText(/no tiene una sede asignada/)
}

async function search(user: ReturnType<typeof userEvent.setup>, cedula: string, name: string) {
  await user.type(screen.getByLabelText('Cedula / Pasaporte / Carnet'), cedula)
  await user.click(screen.getByRole('button', { name: 'Buscar' }))
  await waitFor(() => expect(screen.getByDisplayValue(name)).toBeInTheDocument())
}

describe('Comedor unificado', () => {
  beforeEach(() => {
    permissions = []
    sede = { id: 1, name: 'Paramillo' }
    lookup.mockReset()
    checkByDocument.mockReset()
    sessionRecent.mockReset()
    history.mockReset()
    today.mockReset()

    lookup.mockResolvedValue(ROSTER)
    checkByDocument.mockResolvedValue(NO_CONSUMPTION)
    sessionRecent.mockResolvedValue({ total: 3, items: [] })
    history.mockResolvedValue({ total: 0, items: [] })
    // Fecha de hoy, no una fija: la pantalla bloquea el registro cuando el turno
    // sobrevivió a su fecha (QA-TEST#1 ALTO-1) y una fecha escrita a mano haría que
    // estas pruebas caducaran al día siguiente.
    today.mockResolvedValue({ id: 5, date: todayISO(), status: 'OPEN', sede_id: 1 })
  })

  describe('la consulta no depende del turno', () => {
    it('busca y muestra la ficha sin sesión de servicio abierta', async () => {
      today.mockResolvedValue(null)
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      expect(screen.getByDisplayValue('Ingeniería Informática')).toBeInTheDocument()
      // Y el registro queda apagado, diciendo por qué.
      expect(screen.getByRole('button', { name: 'Registrar Consumo' })).toBeDisabled()
      expect(screen.getByText('No hay una sesión de servicio abierta en esta sede.')).toBeInTheDocument()
    })

    it('el campo de cédula nunca está deshabilitado', async () => {
      today.mockResolvedValue(null)
      await renderScreen()

      expect(screen.getByLabelText('Cedula / Pasaporte / Carnet')).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Buscar' })).toBeEnabled()
    })
  })

  // QA-TEST#1 ALTO-1 y ALTO-2. El consumo se fecha con `session.date`, así que un turno
  // que sobrevivió a su fecha archiva la comida de hoy en el día en que se abrió — fuera
  // del reporte del día en que se sirvió— y deja a quien comió aquel día sin poder
  // repetir. Antes de esto la pantalla seguía registrando sin decir nada.
  describe('una sesión que sobrevivió a su fecha', () => {
    const STALE = { id: 5, date: '2026-08-06', status: 'OPEN', sede_id: 1 }

    it('no permite registrar y explica qué hacer', async () => {
      today.mockResolvedValue(STALE)
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      expect(screen.getByRole('button', { name: 'Registrar Consumo' })).toBeDisabled()
      // Nombra la fecha del turno y la acción concreta: sin eso el operador no puede
      // deducir por qué dejó de registrar una sesión que sigue diciendo "abierta".
      expect(screen.getByText(/no de hoy/)).toBeInTheDocument()
      expect(screen.getByText(/Ciérrala/)).toBeInTheDocument()
    })

    it('consulta el estado del día contra la fecha de la sesión, no contra hoy', async () => {
      today.mockResolvedValue(STALE)
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      // Preguntar por `hoy` respondía por un día distinto del que aplica el servidor:
      // la ficha afirmaba "no ha consumido" y el registro devolvía 409 acto seguido.
      expect(checkByDocument).toHaveBeenCalledWith('12345678', '2026-08-06')
    })

    it('sin sesión abierta no inventa una fecha de turno', async () => {
      today.mockResolvedValue(null)
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      // Sin turno no hay nada contra lo que comparar: decide el servidor (hoy).
      expect(checkByDocument).toHaveBeenCalledWith('12345678', undefined)
    })

    it('la sesión del día sigue permitiendo registrar', async () => {
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      expect(screen.getByRole('button', { name: 'Registrar Consumo' })).toBeEnabled()
      expect(screen.queryByText(/no de hoy/)).not.toBeInTheDocument()
    })
  })

  describe('el estado se afirma', () => {
    it('dice en positivo que no ha consumido y que no tiene sanción', async () => {
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      expect(screen.getByText('No ha consumido en la sesión de hoy.')).toBeInTheDocument()
      expect(screen.getByText('Sin sanción activa.')).toBeInTheDocument()
    })

    it('un fallo de la comprobación no se presenta como "no ha consumido"', async () => {
      checkByDocument.mockRejectedValue({ status: 500, message: 'boom' })
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      expect(screen.getByText(/No se pudo comprobar el consumo de hoy/)).toBeInTheDocument()
      expect(screen.queryByText('No ha consumido en la sesión de hoy.')).not.toBeInTheDocument()
      // La ficha se muestra igualmente y el registro sigue disponible: el rechazo del
      // servidor es el último guardia.
      expect(screen.getByRole('button', { name: 'Registrar Consumo' })).toBeEnabled()
    })

    it('avisa del consumo previo de una persona externa, con hora, sede y origen', async () => {
      // El caso que la pantalla de consulta respondía mal: resolvía por
      // `acceso_directo_id`, que una persona externa no tiene.
      lookup.mockResolvedValue(EXTERNAL)
      checkByDocument.mockResolvedValue({
        document_id: '87654321',
        date: '2026-08-11',
        acceso_directo_id: null,
        external_person_id: 77,
        person_kind: 'external',
        has_consumed: true,
        consumption: {
          id: 3,
          registered_at: '2026-08-11T15:30:00Z',
          is_manual: true,
          lunch_session_id: 5,
          sede_name: 'Paramillo',
        },
        active_sanction: null,
      })
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '87654321', 'Rosa Gómez')

      expect(screen.getByText(/Ya registró su consumo a las/)).toBeInTheDocument()
      expect(screen.getByText(/en la sede Paramillo/)).toBeInTheDocument()
      expect(screen.getByText(/registrado manualmente/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Registrar Consumo' })).toBeDisabled()
    })

    it('no promete estado de sanción para la gente externa', async () => {
      lookup.mockResolvedValue(EXTERNAL)
      checkByDocument.mockResolvedValue({ ...NO_CONSUMPTION, acceso_directo_id: null, person_kind: 'external' })
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '87654321', 'Rosa Gómez')

      expect(screen.getByText(/A la gente externa no se la sanciona/)).toBeInTheDocument()
      expect(screen.queryByText('Sin sanción activa.')).not.toBeInTheDocument()
    })
  })

  describe('modo de solo consulta', () => {
    beforeEach(() => { permissions = SOLO_CONSULTA })

    it('no ofrece registrar ni suspender, y lo explica', async () => {
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      expect(screen.queryByRole('button', { name: 'Registrar Consumo' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Suspender/ })).not.toBeInTheDocument()
      expect(screen.getByText(/Modo consulta/)).toBeInTheDocument()
    })

    it('no pide los últimos registros, cuyo endpoint deniega ese permiso', async () => {
      await renderScreen()

      expect(sessionRecent).not.toHaveBeenCalled()
      expect(screen.queryByRole('button', { name: 'ULTIMOS REGISTROS' })).not.toBeInTheDocument()
    })
  })

  describe('sin vacíos en pantalla', () => {
    it('recién abierta no dibuja ficha ni campos en blanco', async () => {
      await renderScreen()

      expect(
        screen.getByText('Escanea un carnet o escribe una cédula para ver a la persona.'),
      ).toBeInTheDocument()
      // El campo de cédula es el único input vacío legítimo: está esperando que escribas.
      const blanks = screen
        .getAllByRole('textbox')
        .filter((el) => (el as HTMLInputElement).value === '')
      expect(blanks).toHaveLength(1)
      expect(blanks[0]).toHaveAttribute('id', 'cedula-register')
    })

    it('con persona en pantalla, ningún campo de la ficha está vacío', async () => {
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      const blanks = screen
        .getAllByRole('textbox')
        .filter((el) => (el as HTMLInputElement).value === '' && el.id !== 'cedula-register')
      expect(blanks).toEqual([])
    })

    it('sin sesión no dibuja contador ni fecha de turno vacíos', async () => {
      today.mockResolvedValue(null)
      await renderScreen()

      expect(screen.queryByText('Consumos del Turno:')).not.toBeInTheDocument()
      expect(screen.queryByText('Fecha:')).not.toBeInTheDocument()
    })
  })

  describe('la sede la pone la cuenta', () => {
    it('la rotula, no la ofrece a elegir', async () => {
      await renderScreen()

      expect(screen.getByText('Sede:')).toBeInTheDocument()
      expect(screen.getByText('Paramillo')).toBeInTheDocument()
      // Lo que desaparece es la posibilidad de equivocarse: no hay desplegable.
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('no pide la sesión con una sede: la impone el servidor', async () => {
      await renderScreen()

      expect(today).toHaveBeenCalledWith()
    })

    it('sin sede asignada bloquea el registro pero deja consultar', async () => {
      sede = null
      const user = userEvent.setup()
      await renderUnassigned()

      // Ni siquiera se pregunta por la sesión: la respuesta sería un 403.
      expect(today).not.toHaveBeenCalled()

      await search(user, '12345678', 'Ana Pérez')
      expect(screen.getByRole('button', { name: 'Registrar Consumo' })).toBeDisabled()
      expect(screen.getByText('Tu cuenta no tiene una sede asignada.')).toBeInTheDocument()
    })

    it('ya no guarda nada en el navegador', async () => {
      localStorage.clear()
      await renderScreen()

      expect(localStorage.getItem('selected_sede_id')).toBeNull()
      expect(localStorage.length).toBe(0)
    })
  })

  describe('consumo en otra sede', () => {
    function comioEn(sedeName: string | null) {
      checkByDocument.mockResolvedValue({
        ...NO_CONSUMPTION,
        has_consumed: true,
        consumption: {
          id: 9,
          registered_at: '2026-08-11T12:15:00Z',
          is_manual: false,
          lunch_session_id: 8,
          sede_name: sedeName,
        },
      })
    }

    it('dice que ya consumió y en qué otra sede lo hizo', async () => {
      // El caso del encargo: el taquillero de un municipio no tiene forma de saber
      // que esta persona ya comió en otro.
      comioEn('San Cristóbal')
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      const aviso = screen.getByText(/Ya consumió hoy en otra sede/)
      expect(aviso).toBeInTheDocument()
      expect(aviso.textContent).toContain('San Cristóbal')
      expect(screen.getByRole('button', { name: 'Registrar Consumo' })).toBeDisabled()
    })

    it('en la propia sede no lo llama "otra sede"', async () => {
      comioEn('Paramillo')
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      expect(screen.queryByText(/en otra sede/)).not.toBeInTheDocument()
      expect(screen.getByText(/Ya registró su consumo a las/)).toBeInTheDocument()
    })

    it('sin nombre de sede no inventa que fuera otra', async () => {
      // Un servidor que no traiga la sede no debe producir un aviso de "otra sede":
      // no saberlo no es saber que son distintas.
      comioEn(null)
      const user = userEvent.setup()
      await renderScreen()

      await search(user, '12345678', 'Ana Pérez')

      expect(screen.queryByText(/en otra sede/)).not.toBeInTheDocument()
    })
  })

  it('no consulta la sanción por separado: la trae la comprobación por cédula', async () => {
    const user = userEvent.setup()
    await renderScreen()

    await search(user, '12345678', 'Ana Pérez')

    // Una sola comprobación de estado por consulta. `check/{id}` ya no se usa, y por eso
    // ni siquiera está en el doble de `consumptionApi`.
    expect(checkByDocument).toHaveBeenCalledTimes(1)
  })
})
