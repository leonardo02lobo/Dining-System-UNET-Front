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
