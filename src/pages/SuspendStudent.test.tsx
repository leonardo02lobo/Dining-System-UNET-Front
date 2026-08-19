import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Student } from '../types/user'

/**
 * Suspender a cualquiera, no solo a los estudiantes.
 *
 * La pantalla atendía a una sola de las tres clases de persona que su propia
 * búsqueda encuentra: a la gente externa le decía "no puede ser suspendida" y a
 * quien está en el padrón sin haber comido nunca, "no tiene acceso directo". Las dos
 * eran limitaciones del modelo de datos asomando en la interfaz, no decisiones sobre
 * a quién se puede sancionar.
 */

const ACCESO_DIRECTO: Student = {
  cedula: '12345678',
  name: 'Ana Pérez',
  email: 'ana@unet.edu.ve',
  career: 'Ingeniería Informática',
  user_type: 'TEACHER',
  is_suspended: false,
  is_acceso_directo: true,
  acceso_directo_id: 11,
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

/** Está en el padrón, pero nunca ha pasado por taquilla: aún no es nadie más. */
const ONLY_ROSTER: Student = {
  cedula: '30222111',
  name: 'Carla Ríos',
  email: 'carla@unet.edu.ve',
  career: 'Arquitectura',
  user_type: 'STUDENT',
  is_suspended: false,
  is_acceso_directo: false,
  person_kind: 'acceso_directo',
  gender: 'F',
}

const SANCTION = {
  id: 5,
  acceso_directo_id: 11,
  external_person_id: null,
  created_by_id: 1,
  reason: 'Se coló en la fila',
  start_date: '2026-08-18',
  end_date: null,
  status: 'ACTIVE' as const,
  notified_user: false,
  notified_authority: false,
  created_at: '2026-08-18T10:00:00',
  updated_at: null,
}

const lookup = vi.fn()
const check = vi.fn()
const checkByDocument = vi.fn()
const quickCreate = vi.fn()
const history = vi.fn()
const historyExternal = vi.fn()
const liftBySanction = vi.fn()

vi.mock('../api/student', async () => {
  // `studentToIdentity` se usa de verdad: es lo que arma el alta al vuelo, y
  // doblarlo escondería justo el dato que esta pantalla tiene que enviar.
  const actual = await vi.importActual<typeof import('../api/student')>('../api/student')
  return {
    ...actual,
    studentApi: { lookup: (q: string) => lookup(q) },
  }
})

vi.mock('../api/consumption', () => ({
  consumptionApi: {
    check: (id: number) => check(id),
    checkByDocument: (documentId: string) => checkByDocument(documentId),
  },
}))

vi.mock('../api/sanction', () => ({
  sanctionApi: {
    quickCreate: (data: unknown) => quickCreate(data),
    history: (id: number) => history(id),
    historyExternal: (id: number) => historyExternal(id),
    liftBySanction: (id: number) => liftBySanction(id),
  },
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

import { SuspendStudent } from './SuspendStudent'

async function search(user: ReturnType<typeof userEvent.setup>, person: Student) {
  await user.type(screen.getByLabelText('Cédula o Carnet'), person.cedula)
  await user.click(screen.getByRole('button', { name: 'Consultar' }))
  await waitFor(() => expect(screen.getByDisplayValue(person.name)).toBeInTheDocument())
}

async function suspendWithReason(user: ReturnType<typeof userEvent.setup>, reason: string) {
  await user.click(screen.getByRole('button', { name: 'Suspender' }))
  await user.type(await screen.findByLabelText(/Motivo de la suspensión/), reason)
  // Sin fecha de fin ni casilla, el formulario se planta: dejar el campo vacío no
  // significa "para siempre" por descuido.
  await user.click(screen.getByLabelText('Indefinida'))
  await user.click(screen.getByRole('button', { name: 'Confirmar suspensión' }))
}

describe('SuspendStudent — a quién se puede suspender', () => {
  beforeEach(() => {
    lookup.mockReset()
    check.mockReset()
    checkByDocument.mockReset()
    quickCreate.mockReset()
    history.mockReset()
    historyExternal.mockReset()
    liftBySanction.mockReset()

    check.mockResolvedValue({ active_sanction: null })
    checkByDocument.mockResolvedValue({ active_sanction: null })
    history.mockResolvedValue({ total: 0, items: [] })
    historyExternal.mockResolvedValue({ total: 0, items: [] })
    quickCreate.mockResolvedValue(SANCTION)
  })

  it('suspende a un acceso directo por su identificador', async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue(ACCESO_DIRECTO)
    render(<SuspendStudent />)

    await search(user, ACCESO_DIRECTO)
    await suspendWithReason(user, 'Se coló en la fila')

    await waitFor(() => expect(quickCreate).toHaveBeenCalledTimes(1))
    expect(quickCreate.mock.calls[0][0]).toMatchObject({
      acceso_directo_id: 11,
      reason: 'Se coló en la fila',
    })
  })

  it('suspende a una persona externa por su identificador propio', async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue(EXTERNAL)
    render(<SuspendStudent />)

    await search(user, EXTERNAL)
    expect(screen.queryByText(/no puede ser suspendida/i)).not.toBeInTheDocument()
    await suspendWithReason(user, 'Se coló en la fila')

    await waitFor(() => expect(quickCreate).toHaveBeenCalledTimes(1))
    const payload = quickCreate.mock.calls[0][0]
    expect(payload).toMatchObject({ external_person_id: 77 })
    // Nunca su id de acceso directo: no tiene, y mandar uno la duplicaría.
    expect(payload.acceso_directo_id).toBeUndefined()
  })

  it('suspende a alguien del padrón que todavía no es acceso directo', async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue(ONLY_ROSTER)
    render(<SuspendStudent />)

    await search(user, ONLY_ROSTER)
    // La ficha sigue avisando de que se dará de alta al vuelo, pero eso ya no
    // impide suspenderlo: el botón está operativo.
    expect(screen.getByRole('button', { name: 'Suspender' })).toBeEnabled()
    await suspendWithReason(user, 'Reincidencia')

    await waitFor(() => expect(quickCreate).toHaveBeenCalledTimes(1))
    // Se envían sus datos para que el servidor lo dé de alta al vuelo, con la
    // carrera del padrón incluida —es la que alimenta los reportes—.
    expect(quickCreate.mock.calls[0][0].person).toMatchObject({
      document_id: '30222111',
      first_name: 'Carla',
      career: 'Arquitectura',
    })
  })

  it('consulta la suspensión activa de la persona externa por su cédula', async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue(EXTERNAL)
    checkByDocument.mockResolvedValue({ active_sanction: { ...SANCTION, acceso_directo_id: null, external_person_id: 77 } })
    render(<SuspendStudent />)

    await search(user, EXTERNAL)

    await waitFor(() => expect(screen.getByText('Usuario suspendido.')).toBeInTheDocument())
    expect(checkByDocument).toHaveBeenCalledWith('87654321')
    expect(historyExternal).toHaveBeenCalledWith(77)
    // Con una suspensión activa la acción que se ofrece es levantarla.
    expect(screen.queryByRole('button', { name: 'Suspender' })).not.toBeInTheDocument()
  })

  it('levanta la suspensión por el id de la sanción, no por el de la persona', async () => {
    const user = userEvent.setup()
    lookup.mockResolvedValue(EXTERNAL)
    checkByDocument.mockResolvedValue({ active_sanction: { ...SANCTION, id: 9, external_person_id: 77 } })
    liftBySanction.mockResolvedValue({ ...SANCTION, status: 'REVOKED' })
    render(<SuspendStudent />)

    await search(user, EXTERNAL)
    await user.click(await screen.findByRole('button', { name: 'Reactivar acceso' }))

    await waitFor(() => expect(liftBySanction).toHaveBeenCalledWith(9))
  })
})
