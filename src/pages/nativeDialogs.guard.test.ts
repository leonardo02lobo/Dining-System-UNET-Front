import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

/**
 * Regression guard for fixes.md #4. Native confirm()/alert() dialogs are
 * unreliable in Tauri desktop, so the deletion/confirmation flows in these
 * pages must not reintroduce them.
 */

const here = dirname(fileURLToPath(import.meta.url))

const FILES = [
  'InventoryPage.tsx',
  'CreateLunchPage.tsx',
  'LunchTestPage.tsx',
]

// Matches a bare confirm(/alert( call, but not member calls like foo.confirm(.
const NATIVE_DIALOG = /(?<![.\w])(confirm|alert)\s*\(/

describe('no native confirm()/alert() in deletion-heavy pages (fixes.md #4)', () => {
  it.each(FILES)('%s uses the in-app Modal/notify instead of native dialogs', (file) => {
    const source = readFileSync(resolve(here, file), 'utf8')
    const offending = source
      .split('\n')
      .map((line: string, i: number) => ({ line: line.trim(), n: i + 1 }))
      .filter(({ line }: { line: string }) => NATIVE_DIALOG.test(line) && !line.startsWith('//'))

    expect(offending, `native dialog call(s) found in ${file}: ${JSON.stringify(offending)}`).toEqual([])
  })
})
