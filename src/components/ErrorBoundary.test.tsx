import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

function Boom({ explode }: { explode: boolean }): React.ReactElement {
  if (explode) throw new Error('columna inesperada')
  return <p>contenido</p>
}

describe('ErrorBoundary', () => {
  afterEach(cleanup)

  it('muestra el aviso en lugar de dejar la pantalla en blanco', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom explode />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('No se pudo mostrar esta pantalla')).toBeInTheDocument()
    expect(screen.getByText('columna inesperada')).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('descarta el error al cambiar de ruta', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { rerender } = render(
      <ErrorBoundary resetKey="/estudiantes">
        <Boom explode />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Navegar a otra pantalla debe volver a intentar el render, no quedarse en el aviso.
    rerender(
      <ErrorBoundary resetKey="/sedes">
        <Boom explode={false} />
      </ErrorBoundary>,
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('contenido')).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('reintenta el render con el botón', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    let failing = true
    function Flaky() {
      if (failing) throw new Error('fallo transitorio')
      return <p>contenido</p>
    }

    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    failing = false
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(screen.getByText('contenido')).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
