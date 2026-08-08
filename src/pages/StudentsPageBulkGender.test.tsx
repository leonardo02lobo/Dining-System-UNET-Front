import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { StudentPadronData } from '../types/student'

/**
 * Clasificación masiva del sexo desde la lista.
 *
 * Lo que se protege aquí, por orden de importancia: que un guardado fallido no
 * borre el trabajo hecho a mano, que no se pierdan cambios al cambiar de página, y
 * que el aviso de éxito hable de lo que el servidor dice haber actualizado y no de
 * lo que se envió.
 */

function student(overrides: Partial<StudentPadronData> = {}): StudentPadronData {
  return {
    id: 1,
    cedula: '31419581',
    full_name: 'Frankly Bautista',
    email: 'frankly@unet.edu.ve',
    career: 'Ingeniería En Informática',
    is_active: true,
    photo_url: null,
    gender: null,
    nacionalidad: null,
    cedula_raw: null,
    p_nombre: null,
    s_nombre: null,
    p_apellido: null,
    s_apellido: null,
    cod_carr: null,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: null,
    ...overrides,
  }
}

const A = student({ id: 1, cedula: '11111111', full_name: 'Frankly Bautista' })
const B = student({ id: 2, cedula: '22222222', full_name: 'Ana Pérez' })

const list = vi.fn()
const bulkSetGender = vi.fn()
const notifySuccess = vi.fn()
const notifyError = vi.fn()

vi.mock('../api/externalStudent', () => ({
  externalStudentApi: {
    list: (params: unknown) => list(params),
    setGender: vi.fn(),
    bulkSetGender: (items: unknown) => bulkSetGender(items),
  },
}))

vi.mock('../api/career', () => ({
  careerApi: { list: () => Promise.resolve([]) },
}))

vi.mock('../utils/toast', () => ({
  notify: {
    success: (m: unknown) => notifySuccess(m),
    error: (e: unknown) => notifyError(e),
  },
}))

import { StudentsPage } from './StudentsPage'

/** Pulsa M o F en la fila de esa persona. */
function genderButton(name: string, option: 'Masculino' | 'Femenino') {
  return screen.getByRole('button', { name: `${option} para ${name}` })
}

describe('StudentsPage — clasificación masiva del sexo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    list.mockResolvedValue({ total: 2, items: [A, B] })
    bulkSetGender.mockResolvedValue({
      total: 1, updated: 1, unchanged: 0, failed: 0,
      results: [{ row: 0, id: 1, status: 'updated' }],
    })
  })

  it('elegir un sexo deja la fila pendiente, la marca y no llama al servidor', async () => {
    const user = userEvent.setup()
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')

    await user.click(genderButton('Frankly Bautista', 'Masculino'))

    expect(await screen.findByText('1 cambio pendiente')).toBeInTheDocument()
    // Elegir el sexo ya es la declaración de intención: exigir además marcar la
    // casilla solo produciría trabajo perdido.
    expect(screen.getByLabelText('Seleccionar Frankly Bautista')).toBeChecked()
    expect(bulkSetGender).not.toHaveBeenCalled()
  })

  it('desmarcar la casilla descarta el valor pendiente de esa fila', async () => {
    const user = userEvent.setup()
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')
    await user.click(genderButton('Frankly Bautista', 'Femenino'))
    await screen.findByText('1 cambio pendiente')

    await user.click(screen.getByLabelText('Seleccionar Frankly Bautista'))

    await waitFor(() =>
      expect(screen.queryByText('1 cambio pendiente')).not.toBeInTheDocument(),
    )
  })

  it('una fila marcada sin sexo elegido no viaja en el lote', async () => {
    const user = userEvent.setup()
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')

    await user.click(screen.getByLabelText('Seleccionar Ana Pérez'))
    await user.click(genderButton('Frankly Bautista', 'Masculino'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(bulkSetGender).toHaveBeenCalledWith([{ id: 1, gender: 'M' }]))
  })

  it('la casilla de cabecera marca las filas visibles', async () => {
    const user = userEvent.setup()
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')

    await user.click(screen.getByLabelText('Seleccionar todas las filas visibles'))

    expect(screen.getByLabelText('Seleccionar Frankly Bautista')).toBeChecked()
    expect(screen.getByLabelText('Seleccionar Ana Pérez')).toBeChecked()
  })

  it('la cabecera queda indeterminada con selección parcial', async () => {
    const user = userEvent.setup()
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')

    await user.click(screen.getByLabelText('Seleccionar Ana Pérez'))

    const header = screen.getByLabelText(
      'Seleccionar todas las filas visibles',
    ) as HTMLInputElement
    await waitFor(() => expect(header.indeterminate).toBe(true))
  })

  it('guarda todos los cambios pendientes en una sola petición', async () => {
    const user = userEvent.setup()
    bulkSetGender.mockResolvedValue({
      total: 2, updated: 2, unchanged: 0, failed: 0,
      results: [
        { row: 0, id: 1, status: 'updated' },
        { row: 1, id: 2, status: 'updated' },
      ],
    })
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')

    await user.click(genderButton('Frankly Bautista', 'Masculino'))
    await user.click(genderButton('Ana Pérez', 'Femenino'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(bulkSetGender).toHaveBeenCalledTimes(1))
    expect(bulkSetGender).toHaveBeenCalledWith([
      { id: 1, gender: 'M' },
      { id: 2, gender: 'F' },
    ])
  })

  it('el aviso de éxito usa lo actualizado por el servidor, no lo enviado', async () => {
    const user = userEvent.setup()
    bulkSetGender.mockResolvedValue({
      total: 2, updated: 1, unchanged: 1, failed: 0,
      results: [
        { row: 0, id: 1, status: 'updated' },
        { row: 1, id: 2, status: 'unchanged' },
      ],
    })
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')

    await user.click(genderButton('Frankly Bautista', 'Masculino'))
    await user.click(genderButton('Ana Pérez', 'Femenino'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(notifySuccess).toHaveBeenCalledWith('1 estudiante clasificado.'),
    )
  })

  it('un lote parcialmente fallido se avisa además como error', async () => {
    const user = userEvent.setup()
    bulkSetGender.mockResolvedValue({
      total: 2, updated: 1, unchanged: 0, failed: 1,
      results: [
        { row: 0, id: 1, status: 'updated' },
        { row: 1, id: 2, status: 'error', error: 'Estudiante no encontrado' },
      ],
    })
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')

    await user.click(genderButton('Frankly Bautista', 'Masculino'))
    await user.click(genderButton('Ana Pérez', 'Femenino'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith(
        'No se pudieron clasificar 1 (ids: 2).',
      ),
    )
  })

  it('un guardado fallido conserva los cambios pendientes', async () => {
    const user = userEvent.setup()
    bulkSetGender.mockRejectedValue({ status: 500, message: 'Servicio no disponible' })
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')

    await user.click(genderButton('Frankly Bautista', 'Masculino'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(notifyError).toHaveBeenCalled())
    // Reintentar no debe costar volver a clasificar a mano lo ya mirado.
    expect(screen.getByText('1 cambio pendiente')).toBeInTheDocument()
  })

  it('descartar limpia sin llamar al servidor', async () => {
    const user = userEvent.setup()
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')
    await user.click(genderButton('Frankly Bautista', 'Masculino'))

    await user.click(screen.getByRole('button', { name: 'Descartar' }))

    await waitFor(() =>
      expect(screen.queryByText('1 cambio pendiente')).not.toBeInTheDocument(),
    )
    expect(bulkSetGender).not.toHaveBeenCalled()
  })

  it('cambiar de página con cambios pendientes pide confirmación', async () => {
    const user = userEvent.setup()
    list.mockResolvedValue({ total: 200, items: [A, B] })
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')
    await user.click(genderButton('Frankly Bautista', 'Masculino'))

    await user.click(screen.getByRole('button', { name: /Siguiente/i }))

    expect(await screen.findByText('Tienes cambios sin guardar')).toBeInTheDocument()
  })

  it('cancelar la confirmación conserva los cambios y la página', async () => {
    const user = userEvent.setup()
    list.mockResolvedValue({ total: 200, items: [A, B] })
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')
    await user.click(genderButton('Frankly Bautista', 'Masculino'))
    await user.click(screen.getByRole('button', { name: /Siguiente/i }))
    await screen.findByText('Tienes cambios sin guardar')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByText('1 cambio pendiente')).toBeInTheDocument()
    expect(list).not.toHaveBeenCalledWith(expect.objectContaining({ skip: 50 }))
  })

  it('confirmar descarta los cambios y avanza de página', async () => {
    const user = userEvent.setup()
    list.mockResolvedValue({ total: 200, items: [A, B] })
    render(<StudentsPage />)
    await screen.findByText('Frankly Bautista')
    await user.click(genderButton('Frankly Bautista', 'Masculino'))
    await user.click(screen.getByRole('button', { name: /Siguiente/i }))
    await screen.findByText('Tienes cambios sin guardar')

    await user.click(screen.getByRole('button', { name: 'Descartar y continuar' }))

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 50 })),
    )
    expect(screen.queryByText('1 cambio pendiente')).not.toBeInTheDocument()
  })
})
