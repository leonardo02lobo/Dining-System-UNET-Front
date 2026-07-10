import { useEffect, useRef } from 'react'

export interface UseBarcodeScannerOptions {
  /** Minimum characters for a buffered sequence to count as a scan. Default 6. */
  minLength?: number
  /** Max gap (ms) between keystrokes to treat them as a single scan. Default 60. */
  maxGapMs?: number
  /** When false, the global keydown listener is not attached. Default true. */
  enabled?: boolean
}

/**
 * Listens to global `keydown` events to capture input from USB HID barcode
 * scanners that emulate a keyboard. Characters arriving faster than `maxGapMs`
 * are accumulated in a buffer; an `Enter` finalises the scan and, if the buffer
 * is at least `minLength` long, `onScan` is invoked with the scanned string.
 *
 * Keystrokes with modifier keys, or while focus is on an input/textarea, are
 * ignored so the operator can still type manually.
 *
 * The latest `onScan` is always used (kept in a ref), so callers can pass an
 * inline callback without re-attaching the listener on every render.
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  options: UseBarcodeScannerOptions = {},
) {
  const { minLength = 6, maxGapMs = 60, enabled = true } = options

  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  const lastKeyAtRef = useRef(0)
  const bufferRef = useRef('')

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return

      // Si el foco está en un input/textarea, dejamos que escriban manualmente
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const now = Date.now()
      if (now - lastKeyAtRef.current > maxGapMs) bufferRef.current = ''

      if (e.key === 'Enter') {
        const scanned = bufferRef.current.trim()
        if (scanned.length >= minLength) {
          onScanRef.current(scanned)
        }
        bufferRef.current = ''
        lastKeyAtRef.current = now
        return
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key
        lastKeyAtRef.current = now
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, minLength, maxGapMs])
}
