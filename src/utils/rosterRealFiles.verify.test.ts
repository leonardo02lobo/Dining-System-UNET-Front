/**
 * Comprobación de aceptación del pipeline de importación contra los archivos
 * REALES del padrón (`Activos.csv` / `Inactivos.csv` en la raíz del proyecto).
 *
 * Se salta si los archivos no están: no se versionan porque contienen datos
 * personales. Las aserciones son invariantes del formato, no cifras concretas,
 * para que siga sirviendo de humo al cargar el padrón de cada semestre.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { decodeCsvBuffer, parseCsv, autoMapColumns, buildBulkItems, validateRow } from './csvImport'
import { mergeRosterFiles } from './rosterMerge'

const ROOT = resolve(__dirname, '../../..')
const ACTIVOS = resolve(ROOT, 'Activos.csv')
const INACTIVOS = resolve(ROOT, 'Inactivos.csv')

const OFFICIAL_HEADERS = [
  'NACIONALIDAD', 'CEDULA', 'P_NOMBRE', 'S_NOMBRE', 'P_APELLIDO', 'S_APELLIDO',
  'EMAIL', 'COD_CARR', 'CARRERA', 'ESTADO', 'TIPO',
]

const available = existsSync(ACTIVOS) && existsSync(INACTIVOS)

function load(path: string) {
  const bytes = readFileSync(path)
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  const { text, encoding } = decodeCsvBuffer(buffer as ArrayBuffer)
  const parsed = parseCsv(text)
  const mapping = autoMapColumns(parsed.headers)
  return { encoding, ...parsed, mapping, items: buildBulkItems(parsed.rows, mapping) }
}

describe.skipIf(!available)('padrón oficial (archivos reales)', () => {
  const activos = load(ACTIVOS)
  const inactivos = load(INACTIVOS)

  it('detecta el encoding y reconoce la cabecera oficial en ambos archivos', () => {
    expect(activos.encoding).toBe('utf-32be')
    expect(inactivos.encoding).toBe('utf-32be')
    expect(activos.headers).toEqual(OFFICIAL_HEADERS)
    expect(inactivos.headers).toEqual(OFFICIAL_HEADERS)
  })

  it('lee todas las filas de ambos archivos', () => {
    expect(activos.rows.length).toBeGreaterThan(0)
    expect(inactivos.rows.length).toBeGreaterThan(0)
  })

  it('interpreta ESTADO: Activos → activo, Inactivos → inactivo', () => {
    expect(activos.items.every((i) => i.is_active)).toBe(true)
    expect(inactivos.items.every((i) => !i.is_active)).toBe(true)
  })

  it('arma nombres completos limpios, con acentos y sin espacios dobles', () => {
    const all = [...activos.items, ...inactivos.items]
    expect(all.filter((i) => i.full_name.trim() === '')).toHaveLength(0)
    expect(all.filter((i) => /\s{2}/.test(i.full_name))).toHaveLength(0)
    // Si la decodificación fallara, los acentos saldrían como U+FFFD.
    expect(all.filter((i) => i.full_name.includes('�'))).toHaveLength(0)
    expect(all.some((i) => /[áéíóúñÁÉÍÓÚÑ]/.test(i.full_name))).toBe(true)
  })

  it('conserva el documento crudo cuando no es una cédula numérica', () => {
    const passports = [...activos.items, ...inactivos.items]
      .filter((i) => i.cedula_raw && i.cedula_raw !== i.cedula)
    for (const p of passports) {
      expect(p.cedula).toBe(p.cedula_raw!.replace(/\D/g, ''))
    }
  })

  it('todas las filas pasan la validación previa al envío', () => {
    const invalid = [...activos.items, ...inactivos.items]
      .map((item) => ({ item, v: validateRow(item) }))
      .filter((r) => !r.v.valid)
    expect(invalid.map((r) => `${r.item.cedula}: ${r.v.errors.join(', ')}`)).toEqual([])
  })

  it('fusiona ambos archivos sin dejar cédulas repetidas y conservando el activo', () => {
    const merged = mergeRosterFiles([
      { name: 'Activos.csv', items: activos.items },
      { name: 'Inactivos.csv', items: inactivos.items },
    ])
    const cedulas = merged.merged.map((i) => i.cedula)
    expect(new Set(cedulas).size).toBe(cedulas.length)
    expect(merged.merged.length).toBe(activos.items.length + inactivos.items.length - merged.duplicates)
    for (const c of merged.conflicts) {
      // Si alguna de las versiones estaba activa, esa es la que sobrevive.
      const anyActive = c.kept.is_active || c.discarded.some((d) => d.item.is_active)
      expect(c.kept.is_active).toBe(anyActive)
    }
  })

  it('cada COD_CARR corresponde a un único nombre de carrera', () => {
    const byCode = new Map<string, Set<string>>()
    for (const i of [...activos.items, ...inactivos.items]) {
      if (!i.cod_carr) continue
      if (!byCode.has(i.cod_carr)) byCode.set(i.cod_carr, new Set())
      byCode.get(i.cod_carr)!.add(i.career ?? '')
    }
    expect(byCode.size).toBeGreaterThan(0)
    for (const [code, names] of byCode) {
      expect(`${code} → ${[...names].join(' | ')}`).toBe(`${code} → ${[...names][0]}`)
    }
  })
})
