import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { StudentGender, StudentPadronData } from '../types/student'

/**
 * El padrón se importa sin sexo, así que el dominio tiene tres estados: masculino,
 * femenino y *sin clasificar*. Una casilla de dos estados no puede representarlo —
 * sin marcar sería indistinguible de "femenino" — y sin el tercer estado no habría
 * forma de saber cuántos faltan por revisar ni de ofrecer la cola de trabajo.
 */

function student(over: Partial<StudentPadronData> = {}): StudentPadronData {
  return {
    id: 1,
    cedula: '31419581',
    full_name: 'Frankly Bautista',
    email: 'frankly@unet.edu.ve',
    career: 'Ingeniería En Informática',
    is_active: true,
    photo_url: null,
    nacionalidad: 'V',
    cedula_raw: 'V31419581',
    p_nombre: 'Frankly',
    s_nombre: null,
    p_apellido: 'Bautista',
    s_apellido: null,
    cod_carr: '08000',
    gender: null,
    ...over,
  }
}

const UNCLASSIFIED = student()
const CLASSIFIED = student({ id: 2, cedula: '20000000', full_name: 'Ana Pérez', gender: 'M' })

const list = vi.fn()
const setGender = vi.fn()

vi.mock('../api/externalStudent', () => ({
  externalStudentApi: {
    list: (params: unknown) => list(params),
    setGender: (id: number, gender: StudentGender | null) => setGender(id, gender),
  },
}))

vi.mock('../api/career', () => ({
  careerApi: { list: () => Promise.resolve([]) },
}))

vi.mock('../utils/toast', () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}))

import { StudentsPage } from './StudentsPage'

describe('StudentsPage — cola de clasificación del sexo', () => {
  beforeEach(() => {
    list.mockReset()
    setGender.mockReset()
    list.mockResolvedValue({ total: 2, items: [UNCLASSIFIED, CLASSIFIED] })
  })

  it('el filtro "Sin sexo asignado" lo resuelve el servidor, no la página cargada', async () => {
    const user = userEvent.setup()
    render(<StudentsPage />)

    expect(await screen.findByText('Frankly Bautista')).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ gender: undefined }))

    // El servidor devuelve solo a los pendientes cuando llega `gender: 'none'`.
    list.mockResolvedValue({ total: 1, items: [UNCLASSIFIED] })
    await user.click(screen.getByLabelText('Sin sexo asignado'))

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ gender: 'none' })),
    )
    expect(await screen.findByText('Frankly Bautista')).toBeInTheDocument()
    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument()
  })

  it('el total con el filtro puesto es el de pendientes, no el de la página', async () => {
    const user = userEvent.setup()
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')

    // Más pendientes que filas caben en una página: es el caso que el filtrado en
    // cliente no podía representar, porque solo veía las filas ya cargadas.
    list.mockResolvedValue({ total: 8375, items: [UNCLASSIFIED] })
    await user.click(screen.getByLabelText('Sin sexo asignado'))

    expect(await screen.findByText(/de 8375 estudiantes/)).toBeInTheDocument()
  })

  it('activar el filtro vuelve a la primera página', async () => {
    const user = userEvent.setup()
    list.mockResolvedValue({ total: 200, items: [UNCLASSIFIED, CLASSIFIED] })
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')

    await user.click(screen.getByRole('button', { name: /Siguiente/i }))
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 50 })),
    )

    await user.click(screen.getByLabelText('Sin sexo asignado'))

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 0, gender: 'none' })),
    )
  })

  it('el estado inicial no tiene ninguna opción marcada y el estudiante cae en el filtro', async () => {
    const user = userEvent.setup()
    render(<StudentsPage />)

    await user.click(await screen.findByText('Frankly Bautista'))

    expect(screen.getByRole('button', { name: 'Masculino' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Femenino' })).toHaveAttribute('aria-pressed', 'false')
    // Sin clasificar no ofrece el botón de deshacer: no hay nada que deshacer.
    expect(screen.queryByRole('button', { name: 'Dejar sin clasificar' })).not.toBeInTheDocument()
  })

  it('marcar un sexo envía solo `gender` y refleja el valor en la ficha y en el listado', async () => {
    const user = userEvent.setup()
    setGender.mockResolvedValue(student({ gender: 'F' }))
    render(<StudentsPage />)

    await user.click(await screen.findByText('Frankly Bautista'))
    await user.click(screen.getByRole('button', { name: 'Femenino' }))

    await waitFor(() => expect(setGender).toHaveBeenCalledWith(1, 'F'))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Femenino' })).toHaveAttribute('aria-pressed', 'true'),
    )
    expect(screen.getByRole('button', { name: 'Masculino' })).toHaveAttribute('aria-pressed', 'false')
    // El listado refleja el nuevo valor: la fila deja de estar "Sin clasificar".
    expect(screen.queryByText('Sin clasificar')).not.toBeInTheDocument()
  })

  it('se puede volver al estado sin clasificar y el estudiante reaparece en el filtro', async () => {
    const user = userEvent.setup()
    list.mockResolvedValue({ total: 1, items: [student({ gender: 'M' })] })
    setGender.mockResolvedValue(student({ gender: null }))
    render(<StudentsPage />)

    await user.click(await screen.findByText('Frankly Bautista'))
    expect(screen.getByRole('button', { name: 'Masculino' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Dejar sin clasificar' }))

    // `null` explícito: el backend lo acepta como "sin clasificar".
    await waitFor(() => expect(setGender).toHaveBeenCalledWith(1, null))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Masculino' })).toHaveAttribute('aria-pressed', 'false'),
    )

    await user.click(screen.getByLabelText('Sin sexo asignado'))
    // Sigue visible: la fila del listado y la cabecera de la ficha abierta.
    expect(screen.getAllByText('Frankly Bautista').length).toBeGreaterThan(0)
    expect(
      screen.queryByText('No queda ningún estudiante sin sexo asignado.'),
    ).not.toBeInTheDocument()
  })

  it('no revienta si la API todavía no responde: muestra el error y la tabla vacía', async () => {
    list.mockRejectedValue({ status: 500, message: 'Servicio no disponible' })
    render(<StudentsPage />)

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument()
    expect(screen.getByText('No hay estudiantes para los filtros seleccionados.')).toBeInTheDocument()
  })
})
