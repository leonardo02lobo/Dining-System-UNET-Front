import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LunchFooterActions } from './LunchFooterActions'

// FE-02 — mientras una petición está en curso el doble envío significa doble
// descuento, así que las dos acciones que tocan el backend se deshabilitan.

const noop = () => {}

describe('LunchFooterActions — doble envío', () => {
  it('deshabilita guardar y confirmar mientras se confirma', () => {
    const onConfirm = vi.fn()
    const onSaveDraft = vi.fn()

    render(
      <LunchFooterActions
        onSaveDraft={onSaveDraft}
        onConfirm={onConfirm}
        onDownload={noop}
        confirming
      />,
    )

    const confirmar = screen.getByRole('button', { name: /Confirmando/ })
    const guardar = screen.getByRole('button', { name: /Guardar borrador/ })

    expect(confirmar).toBeDisabled()
    expect(guardar).toBeDisabled()

    fireEvent.click(confirmar)
    fireEvent.click(guardar)
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onSaveDraft).not.toHaveBeenCalled()
  })

  it('deshabilita confirmar mientras se guarda el borrador', () => {
    const onConfirm = vi.fn()

    render(
      <LunchFooterActions
        onSaveDraft={noop}
        onConfirm={onConfirm}
        onDownload={noop}
        savingDraft
      />,
    )

    const confirmar = screen.getByRole('button', { name: /Confirmar servicio/ })
    expect(confirmar).toBeDisabled()
    expect(screen.getByRole('button', { name: /Guardando/ })).toBeDisabled()

    fireEvent.click(confirmar)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('con las acciones libres, cada botón llama a su handler una vez', () => {
    const onSaveDraft = vi.fn()
    const onConfirm = vi.fn()

    render(
      <LunchFooterActions onSaveDraft={onSaveDraft} onConfirm={onConfirm} onDownload={noop} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Guardar borrador/ }))
    fireEvent.click(screen.getByRole('button', { name: /Confirmar servicio/ }))

    expect(onSaveDraft).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
