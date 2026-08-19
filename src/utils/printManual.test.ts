import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ManualConsumption } from '../types/consumption'

// fixes.md #24 — printManual must warn (not fail silently) when the print
// window is blocked.

const error = vi.fn()
vi.mock('./toast', () => ({
  notify: { error: (msg: unknown) => error(msg), success: vi.fn(), info: vi.fn() },
}))

import { printManualList } from './printManual'

const rows: ManualConsumption[] = [
  {
    document_id: 'V12345678',
    first_name: 'Ana',
    last_name: 'Pérez',
    user_type: 'STUDENT',
    career: 'Ing. Sistemas',
    registered_at: '2026-07-01T12:00:00Z',
  } as ManualConsumption,
]

beforeEach(() => error.mockReset())
afterEach(() => vi.restoreAllMocks())

describe('printManualList', () => {
  it('notifies an error when window.open is blocked (returns null)', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)

    expect(() => printManualList('2026-07-01', rows)).not.toThrow()
    expect(error).toHaveBeenCalledTimes(1)
  })

  it('does not notify an error when the window opens', () => {
    const fakeDoc = { write: vi.fn(), close: vi.fn() }
    const fakeWin = { document: fakeDoc, focus: vi.fn(), print: vi.fn() } as unknown as Window
    vi.spyOn(window, 'open').mockReturnValue(fakeWin)

    printManualList('2026-07-01', rows)
    expect(error).not.toHaveBeenCalled()
    expect(fakeDoc.write).toHaveBeenCalled()
  })
})

/**
 * fe-gente-externa-registro-manual — el PDF clasifica igual que la tabla.
 *
 * La regla es la misma (`personClassLabel`) y se comparte a propósito: escrita dos veces,
 * la columna Tipo del PDF y la de la pantalla acabarían diciendo cosas distintas de la
 * misma fila.
 */
describe('printManualList — clasificación de la columna Tipo', () => {
  function htmlOf(rows: ManualConsumption[]): string {
    const fakeDoc = { write: vi.fn(), close: vi.fn() }
    const fakeWin = { document: fakeDoc, focus: vi.fn(), print: vi.fn() } as unknown as Window
    vi.spyOn(window, 'open').mockReturnValue(fakeWin)
    printManualList('2026-08-03', rows)
    return fakeDoc.write.mock.calls.map(([html]) => String(html)).join('')
  }

  it('escribe el rol traducido de un acceso directo y la etiqueta de una persona externa', () => {
    const html = htmlOf([
      { document_id: '20000000', first_name: 'Ana', last_name: 'Pérez', user_type: 'TEACHER',
        career: null, registered_at: '2026-08-03T12:00:00Z' } as ManualConsumption,
      { document_id: '10000000', first_name: 'Luis', last_name: 'Ríos', external_person_id: 42,
        person_type: 'Jornada Deportiva', career: null,
        registered_at: '2026-08-03T13:00:00Z' } as ManualConsumption,
    ])

    expect(html).toContain('Docente')
    expect(html).toContain('Jornada Deportiva')
  })

  it('una fila sin ninguna de las dos clasificaciones escribe el guion sin fallar', () => {
    const html = htmlOf([
      { document_id: '10000000', first_name: 'Luis', last_name: 'Ríos', career: null,
        registered_at: '2026-08-03T13:00:00Z' } as ManualConsumption,
    ])

    expect(html).toContain('10000000')
    expect(html).toContain('—')
  })
})
