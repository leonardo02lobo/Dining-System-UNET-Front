import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * La carrera que se ve en el historial de sesiones, el registro manual y los PDFs
 * sale de `beneficiaries.career`, que se rellena con lo que estas dos funciones
 * envían al registrar. Si `studentToIdentity` no manda la carrera, la columna sale
 * en blanco; si `lookup` deja ganar la del acceso directo, sale con la grafía vieja
 * y deja de casar con el catálogo.
 */

const get = vi.fn()
const post = vi.fn()

vi.mock('./client', () => ({
  apiClient: {
    get: (url: string) => get(url),
    post: (url: string, body: unknown) => post(url, body),
  },
}))

import { studentApi, studentToIdentity } from './student'
import type { Student } from '../types/user'

const PADRON = {
  id: 1,
  cedula: '31419581',
  full_name: 'Frankly José Bautista Pérez',
  email: 'frankly.bautista@unet.edu.ve',
  career: 'Ingeniería En Informática',
  is_active: true,
  photo_url: null,
}

const NOT_FOUND = new Error('404')

const EXTERNAL = {
  id: 77,
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
  status: 'ACTIVE',
  created_at: '2026-08-10T00:00:00Z',
  updated_at: null,
}

function mockLookups(
  padron: unknown,
  accesoDirecto: unknown | Error,
  external: unknown | Error = NOT_FOUND,
) {
  const settle = (v: unknown) => (v instanceof Error ? Promise.reject(v) : Promise.resolve(v))
  get.mockImplementation((url: string) => {
    if (url.startsWith('/students/lookup')) return settle(padron)
    if (url.startsWith('/external-people/lookup')) return settle(external)
    return settle(accesoDirecto)
  })
}

// Con llaves a propósito: `() => get.mockReset()` devolvería el mock, y Vitest
// trata lo que devuelve un `beforeEach` como hook de limpieza y lo invoca al
// terminar el test — añadiendo una llamada espuria sin argumentos.
beforeEach(() => {
  get.mockReset()
  post.mockReset()
})

describe('studentToIdentity', () => {
  const base: Student = {
    cedula: '31419581',
    name: 'Frankly José Bautista Pérez',
    email: 'frankly.bautista@unet.edu.ve',
    career: 'Ingeniería En Informática',
    user_type: 'STUDENT',
    is_suspended: false,
    is_acceso_directo: false,
    person_kind: 'roster',
  }

  it('carries the career so the implicit alta does not leave it null', () => {
    expect(studentToIdentity(base).career).toBe('Ingeniería En Informática')
  })

  it('carries the user type', () => {
    expect(studentToIdentity({ ...base, user_type: 'TEACHER' }).user_type).toBe('TEACHER')
  })

  it('sends null instead of an empty career', () => {
    expect(studentToIdentity({ ...base, career: '' }).career).toBeNull()
  })

  it('still splits the name into first and last', () => {
    const id = studentToIdentity(base)
    expect(id.first_name).toBe('Frankly')
    expect(id.last_name).toBe('José Bautista Pérez')
    expect(id.document_id).toBe('31419581')
  })
})

describe('studentApi.lookup', () => {
  it('uses the roster career, not the one typed into the direct-access record', async () => {
    mockLookups(PADRON, {
      id: 9, user_type: 'STUDENT', career: 'ing. informatica',
    })
    const student = await studentApi.lookup('31419581')
    expect(student.career).toBe('Ingeniería En Informática')
    expect(student.is_acceso_directo).toBe(true)
    expect(student.acceso_directo_id).toBe(9)
  })

  it('falls back to the direct-access career when the roster has none', async () => {
    // Es el caso de un docente u obrero: el padrón solo tiene estudiantes.
    mockLookups({ ...PADRON, career: null }, {
      id: 9, user_type: 'TEACHER', career: 'Departamento de Física',
    })
    const student = await studentApi.lookup('31419581')
    expect(student.career).toBe('Departamento de Física')
    expect(student.user_type).toBe('TEACHER')
  })

  it('keeps the direct-access record authoritative for the user type', async () => {
    mockLookups(PADRON, { id: 9, user_type: 'WORKER', career: null })
    expect((await studentApi.lookup('31419581')).user_type).toBe('WORKER')
  })

  it('returns the roster data alone when there is no direct-access record', async () => {
    mockLookups(PADRON, new Error('404'))
    const student = await studentApi.lookup('31419581')
    expect(student.career).toBe('Ingeniería En Informática')
    expect(student.is_acceso_directo).toBe(false)
  })

  it('resolves someone who is only a direct-access record, not in the roster', async () => {
    // Antes esto lanzaba en cuanto el padrón fallaba, aunque la persona existiera.
    mockLookups(new Error('no inscrito'), {
      id: 9, document_id: '99999999', first_name: 'Luis', last_name: 'Ríos',
      user_type: 'TEACHER', career: 'Departamento de Física',
    })

    const student = await studentApi.lookup('99999999')

    expect(student.is_acceso_directo).toBe(true)
    expect(student.acceso_directo_id).toBe(9)
    expect(student.career).toBe('Departamento de Física')
  })

  it('resolves an external person the roster and direct access do not know', async () => {
    // El fallo que originó el cambio: la persona externa existía y la taquilla
    // decía que no la encontraba, porque nunca se consultaba su padrón.
    mockLookups(new Error('no inscrito'), NOT_FOUND, EXTERNAL)

    const student = await studentApi.lookup('87654321')

    expect(student.person_kind).toBe('external')
    expect(student.external_person_id).toBe(77)
    expect(student.external_label).toBe('Congreso Julio 2026')
    expect(student.name).toBe('Rosa Gómez')
    expect(student.is_acceso_directo).toBe(false)
  })

  it('lets the direct-access record win over the external person', async () => {
    // Nada impide que la misma cédula esté en los dos padrones. Gana el acceso
    // directo: es la única clase de persona que puede arrastrar una sanción.
    mockLookups(new Error('no inscrito'), {
      id: 9, document_id: '87654321', first_name: 'Rosa', last_name: 'Gómez',
      user_type: 'WORKER', career: null,
    }, EXTERNAL)

    const student = await studentApi.lookup('87654321')

    expect(student.person_kind).toBe('acceso_directo')
    expect(student.acceso_directo_id).toBe(9)
    expect(student.external_person_id).toBeUndefined()
  })

  it('fails only when all three lookups fail', async () => {
    mockLookups(new Error('no inscrito'), NOT_FOUND, NOT_FOUND)
    await expect(studentApi.lookup('99999999')).rejects.toThrow('no inscrito')
  })
})

describe('studentApi.registerDining', () => {
  it('sends the external id and never the on-the-fly alta', async () => {
    // Mandar `person` para alguien ya registrado como externo crearía un acceso
    // directo con su misma cédula: la misma persona en dos padrones.
    await studentApi.registerDining({
      cedula: '87654321',
      date: '2026-08-10T12:00:00Z',
      registered_by_id: 1,
      session_id: 5,
      external_person_id: 77,
    })

    expect(post).toHaveBeenCalledWith('/consumptions/', {
      lunch_session_id: 5,
      is_manual: false,
      external_person_id: 77,
    })
  })

  it('keeps the on-the-fly alta for a roster student', async () => {
    await studentApi.registerDining({
      cedula: '31419581',
      date: '2026-08-10T12:00:00Z',
      registered_by_id: 1,
      session_id: 5,
      person: studentToIdentity({
        cedula: '31419581',
        name: 'Frankly Bautista',
        email: '',
        career: 'Ingeniería En Informática',
        user_type: 'STUDENT',
        is_suspended: false,
        is_acceso_directo: false,
        person_kind: 'roster',
      }),
    })

    const body = post.mock.calls[post.mock.calls.length - 1][1] as Record<string, unknown>
    expect(body.person).toBeDefined()
    expect(body.external_person_id).toBeUndefined()
  })
})
