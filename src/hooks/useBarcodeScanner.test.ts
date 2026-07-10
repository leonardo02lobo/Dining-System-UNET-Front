import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBarcodeScanner } from './useBarcodeScanner'

/**
 * Coverage for fixes.md #6: the HID barcode-scanner listener was duplicated in
 * three pages and is now a single shared hook.
 */

function press(key: string, target: EventTarget = document.body) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true })
  // jsdom KeyboardEvent ignores `target` in the init dict, so pin it manually.
  Object.defineProperty(event, 'target', { value: target, enumerable: true })
  window.dispatchEvent(event)
}

function type(text: string) {
  for (const ch of text) press(ch)
}

describe('useBarcodeScanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires onScan with the buffered code when Enter is pressed', () => {
    const onScan = vi.fn()
    renderHook(() => useBarcodeScanner(onScan))

    type('V12345678')
    press('Enter')

    expect(onScan).toHaveBeenCalledTimes(1)
    expect(onScan).toHaveBeenCalledWith('V12345678')
  })

  it('ignores scans shorter than minLength', () => {
    const onScan = vi.fn()
    renderHook(() => useBarcodeScanner(onScan, { minLength: 6 }))

    type('123') // below the 6-char threshold
    press('Enter')

    expect(onScan).not.toHaveBeenCalled()
  })

  it('resets the buffer when keystrokes are slower than maxGapMs', () => {
    const onScan = vi.fn()
    renderHook(() => useBarcodeScanner(onScan, { maxGapMs: 60 }))

    type('99999')          // 5 chars typed "fast" (time is frozen at 0)
    vi.setSystemTime(500)  // human pause > 60ms → buffer should reset
    type('1')
    press('Enter')

    // Only '1' survived the reset → below minLength → no scan.
    expect(onScan).not.toHaveBeenCalled()
  })

  it('ignores keystrokes while an input is focused', () => {
    const onScan = vi.fn()
    renderHook(() => useBarcodeScanner(onScan))

    const input = document.createElement('input')
    document.body.appendChild(input)
    type('V12345678') // typed "into" the input
    // simulate all keys targeting the input
    for (const ch of 'ABCDEFGH') press(ch, input)
    press('Enter', input)

    expect(onScan).not.toHaveBeenCalled()
    input.remove()
  })

  it('ignores keystrokes combined with modifier keys', () => {
    const onScan = vi.fn()
    renderHook(() => useBarcodeScanner(onScan))

    const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true })
    Object.defineProperty(event, 'target', { value: document.body })
    window.dispatchEvent(event)
    press('Enter')

    expect(onScan).not.toHaveBeenCalled()
  })

  it('always uses the latest onScan callback without re-attaching', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ cb }) => useBarcodeScanner(cb), {
      initialProps: { cb: first },
    })

    rerender({ cb: second })

    type('V12345678')
    press('Enter')

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('V12345678')
  })

  it('removes the global listener on unmount', () => {
    const onScan = vi.fn()
    const { unmount } = renderHook(() => useBarcodeScanner(onScan))

    unmount()
    type('V12345678')
    press('Enter')

    expect(onScan).not.toHaveBeenCalled()
  })
})
