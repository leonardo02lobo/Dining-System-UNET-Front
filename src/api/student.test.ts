import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * La carrera que se ve en el historial de sesiones, el registro manual y los PDFs
 * sale de `beneficiaries.career`, que se rellena con lo que estas dos funciones
 * envían al registrar. Si `studentToIdentity` no manda la carrera, la columna sale
 * en blanco; si `lookup` deja ganar la del acceso directo, sale con la grafía vieja
 * y deja de casar con el catálogo.
 */

const get = vi.fn()

vi.mock('./client', () => ({
  apiClient: {
    get: (url: string) => get(url),
    post: vi.fn(),
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

function mockLookups(padron: unknown, accesoDirecto: unknown | Error) {
  get.mockImplementation((url: string) => {
    if (url.startsWith('/students/lookup')) {
      return padron instanceof Error ? Promise.reject(padron) : Promise.resolve(padron)
    }
    return accesoDirecto instanceof Error
      ? Promise.reject(accesoDirecto)
      : Promise.resolve(accesoDirecto)
  })
}

// Con llaves a propósito: `() => get.mockReset()` devolvería el mock, y Vitest
// trata lo que devuelve un `beforeEach` como hook de limpieza y lo invoca al
// terminar el test — añadiendo una llamada espuria sin argumentos.
beforeEach(() => {
  get.mockReset()
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

  it('propagates a roster miss: nobody outside the padrón can be looked up', async () => {
    mockLookups(new Error('no inscrito'), { id: 9, user_type: 'STUDENT', career: null })
    await expect(studentApi.lookup('99999999')).rejects.toThrow('no inscrito')
  })
})
