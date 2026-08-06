import type { StudentBulkItem } from '../types/student'

/* -------------------------------------------------------------------------- */
/* Detección y decodificación de encoding                                      */
/* -------------------------------------------------------------------------- */

/**
 * Encodings que sabemos leer. Los archivos oficiales de Control de Estudios
 * llegan en **UTF-32BE sin BOM**, que `FileReader.readAsText` no sabe interpretar.
 */
export type CsvEncoding = 'utf-8' | 'utf-16le' | 'utf-16be' | 'utf-32le' | 'utf-32be'

export const ENCODING_LABEL: Record<CsvEncoding, string> = {
  'utf-8':     'UTF-8',
  'utf-16le':  'UTF-16 LE',
  'utf-16be':  'UTF-16 BE',
  'utf-32le':  'UTF-32 LE',
  'utf-32be':  'UTF-32 BE',
}

/**
 * Detecta el encoding de un CSV inspeccionando sus primeros bytes.
 *
 * Primero busca un BOM; si no lo hay, usa el patrón de bytes nulos que deja un
 * carácter ASCII en cada encoding de ancho fijo. El orden importa: el BOM de
 * UTF-32LE (`FF FE 00 00`) empieza igual que el de UTF-16LE (`FF FE`), así que
 * hay que comprobar el de 4 bytes antes.
 */
export function detectEncoding(buffer: ArrayBuffer): CsvEncoding {
  const b = new Uint8Array(buffer)
  if (b.length < 4) return 'utf-8'

  // BOM explícito.
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0xfe && b[3] === 0xff) return 'utf-32be'
  if (b[0] === 0xff && b[1] === 0xfe && b[2] === 0x00 && b[3] === 0x00) return 'utf-32le'
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return 'utf-8'
  if (b[0] === 0xfe && b[1] === 0xff) return 'utf-16be'
  if (b[0] === 0xff && b[1] === 0xfe) return 'utf-16le'

  // Sin BOM: un primer carácter ASCII deja un patrón de nulos inconfundible.
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x00 && b[3] !== 0x00) return 'utf-32be'
  if (b[0] !== 0x00 && b[1] === 0x00 && b[2] === 0x00 && b[3] === 0x00) return 'utf-32le'
  if (b[0] === 0x00 && b[1] !== 0x00) return 'utf-16be'
  if (b[0] !== 0x00 && b[1] === 0x00) return 'utf-16le'

  return 'utf-8'
}

/**
 * `TextDecoder` no soporta UTF-32, así que lo decodificamos a mano leyendo
 * enteros de 32 bits. Se procesa por bloques para no reventar la pila de
 * argumentos de `String.fromCodePoint` con archivos grandes.
 */
function decodeUtf32(buffer: ArrayBuffer, littleEndian: boolean): string {
  const view = new DataView(buffer)
  const count = Math.floor(view.byteLength / 4)
  const CHUNK = 8192
  const parts: string[] = []
  const codes: number[] = []

  for (let i = 0; i < count; i++) {
    const cp = view.getUint32(i * 4, littleEndian)
    // Descarta el BOM inicial y los code points fuera del rango Unicode válido.
    if (i === 0 && cp === 0xfeff) continue
    codes.push(cp > 0x10ffff ? 0xfffd : cp)
    if (codes.length >= CHUNK) {
      parts.push(String.fromCodePoint(...codes))
      codes.length = 0
    }
  }
  if (codes.length > 0) parts.push(String.fromCodePoint(...codes))
  return parts.join('')
}

/** Decodifica el contenido de un CSV detectando su encoding automáticamente. */
export function decodeCsvBuffer(buffer: ArrayBuffer): { text: string; encoding: CsvEncoding } {
  const encoding = detectEncoding(buffer)
  if (encoding === 'utf-32be') return { text: decodeUtf32(buffer, false), encoding }
  if (encoding === 'utf-32le') return { text: decodeUtf32(buffer, true), encoding }
  // `utf-8` con BOM: `TextDecoder` lo descarta solo.
  const text = new TextDecoder(encoding).decode(buffer)
  return { text, encoding }
}

/* -------------------------------------------------------------------------- */
/* Parseo                                                                      */
/* -------------------------------------------------------------------------- */

export type CsvDelimiter = ',' | ';'

/**
 * Deduce el separador contando ocurrencias fuera de comillas en la cabecera.
 * Excel en español exporta con `;`, los sistemas académicos con `,`.
 */
export function detectDelimiter(text: string): CsvDelimiter {
  let commas = 0
  let semicolons = 0
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (!inQuotes) {
      if (ch === '\n') break
      if (ch === ',') commas++
      else if (ch === ';') semicolons++
    }
  }
  return semicolons > commas ? ';' : ','
}

/** Deja solo los dígitos de una cédula (quita 'V-', puntos, espacios, etc.). */
export function cleanCedula(raw: string): string {
  return (raw ?? '').replace(/\D/g, '')
}

export interface ParsedCsv {
  headers: string[]
  rows: string[][]
}

/**
 * Parser de CSV con soporte de comillas dobles (`"..."`), separador y saltos de
 * línea escapados dentro de comillas, y `""` como comilla literal. El separador
 * se detecta automáticamente si no se indica.
 * Devuelve la primera fila como `headers` y el resto como `rows`.
 */
export function parseCsv(text: string, delimiter?: CsvDelimiter): ParsedCsv {
  const sep = delimiter ?? detectDelimiter(text)
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false

  // Normaliza saltos de línea Windows/Mac.
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === sep) {
      record.push(field)
      field = ''
    } else if (ch === '\n') {
      record.push(field)
      records.push(record)
      record = []
      field = ''
    } else {
      field += ch
    }
  }

  // Último campo/registro (si el archivo no termina en salto de línea).
  if (field.length > 0 || record.length > 0) {
    record.push(field)
    records.push(record)
  }

  // Descarta registros completamente vacíos (líneas en blanco).
  const nonEmpty = records.filter(
    (r) => !(r.length === 1 && r[0].trim() === ''),
  )

  if (nonEmpty.length === 0) return { headers: [], rows: [] }

  const [headers, ...rows] = nonEmpty
  return {
    headers: headers.map((h) => h.trim()),
    rows,
  }
}

/* -------------------------------------------------------------------------- */
/* Estado activo/inactivo                                                      */
/* -------------------------------------------------------------------------- */

// 'a' y 'activo' cubren la columna ESTADO del padrón oficial, que trae 'A'/'I'.
const TRUE_VALUES = new Set(['true', '1', 'si', 'sí', 'a', 'activo', 'active', 'x', 'yes', 'y', 'verdadero'])
const FALSE_VALUES = new Set(['false', '0', 'no', 'i', 'inactivo', 'inactive', '', 'n', 'falso'])

/**
 * Interpreta un valor de texto como estado activo/inactivo.
 * Devuelve `null` cuando el valor no se reconoce, para que la fila pueda avisar
 * en lugar de asumir "inactivo" en silencio.
 */
export function parseActiveState(value: string | undefined | null): boolean | null {
  const v = (value ?? '').trim().toLowerCase()
  if (TRUE_VALUES.has(v)) return true
  if (FALSE_VALUES.has(v)) return false
  return null
}

/** Igual que `parseActiveState`, pero cae a `false` ante un valor desconocido. */
export function parseBoolean(value: string | undefined | null): boolean {
  return parseActiveState(value) ?? false
}

/* -------------------------------------------------------------------------- */
/* Mapeo de columnas                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Campos destino que se mapean a UNA columna del CSV. `full_name` va aparte
 * porque el padrón oficial parte el nombre en cuatro columnas.
 */
export type SingleField =
  | 'email' | 'career' | 'cedula' | 'is_active'
  | 'nacionalidad' | 'cod_carr'
  | 'p_nombre' | 's_nombre' | 'p_apellido' | 's_apellido'

export type TargetField = 'full_name' | SingleField

export const SINGLE_FIELDS: SingleField[] = [
  'cedula', 'nacionalidad', 'p_nombre', 's_nombre', 'p_apellido', 's_apellido',
  'email', 'cod_carr', 'career', 'is_active',
]

/** Las cuatro columnas del nombre, en el orden en que se concatenan. */
export const NAME_PART_FIELDS: SingleField[] = ['p_nombre', 's_nombre', 'p_apellido', 's_apellido']

export const TARGET_FIELDS: TargetField[] = ['full_name', ...SINGLE_FIELDS]

/** Etiquetas visibles de cada campo destino. */
export const TARGET_FIELD_LABEL: Record<TargetField, string> = {
  full_name:    'Nombre completo',
  cedula:       'Cédula',
  nacionalidad: 'Nacionalidad',
  p_nombre:     'Primer nombre',
  s_nombre:     'Segundo nombre',
  p_apellido:   'Primer apellido',
  s_apellido:   'Segundo apellido',
  email:        'Correo',
  cod_carr:     'Código de carrera',
  career:       'Carrera',
  is_active:    'Activo',
}

/**
 * Mapeo de campo destino → índice de columna del CSV.
 *
 * `full_name` es una lista: se usa cuando el archivo trae el nombre en una sola
 * columna (o en varias sin cabeceras reconocibles). Si están mapeadas las partes
 * del nombre (`p_nombre`…`s_apellido`), esas mandan y `full_name` se ignora.
 */
export type ColumnMapping = { full_name: number[] } & Record<SingleField, number | null>

export function emptyMapping(): ColumnMapping {
  return {
    full_name: [],
    cedula: null, nacionalidad: null,
    p_nombre: null, s_nombre: null, p_apellido: null, s_apellido: null,
    email: null, cod_carr: null, career: null, is_active: null,
  }
}

/** Normaliza una cabecera para comparaciones (minúsculas, sin acentos ni signos). */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Sinónimos de cabecera por campo destino (ya normalizados).
 *
 * Ojo con el orden de comprobación en `autoMapColumns`: las partes del nombre se
 * resuelven ANTES que `full_name` porque `'p nombre'` contiene `'nombre'`.
 */
const HEADER_SYNONYMS: Record<TargetField, string[]> = {
  full_name:    ['nombre completo', 'nombre y apellido', 'full name', 'nombre', 'nombres', 'name'],
  email:        ['correo', 'email', 'e mail', 'correo electronico', 'mail'],
  career:       ['carrera', 'career', 'especialidad', 'programa'],
  cedula:       ['cedula', 'documento', 'document id', 'ci', 'dni', 'identificacion', 'nro documento'],
  is_active:    ['estado', 'activo', 'active', 'is active', 'habilitado', 'condicion'],
  nacionalidad: ['nacionalidad', 'nac', 'nationality'],
  cod_carr:     ['cod carr', 'codigo carrera', 'cod carrera', 'codigo de carrera', 'career code'],
  p_nombre:     ['p nombre', 'primer nombre', 'primer nombre 1', 'nombre1'],
  s_nombre:     ['s nombre', 'segundo nombre', 'nombre2'],
  p_apellido:   ['p apellido', 'primer apellido', 'apellido', 'apellidos', 'apellido1'],
  s_apellido:   ['s apellido', 'segundo apellido', 'apellido2'],
}

/** Índice de la primera cabecera que casa exacta o parcialmente con un sinónimo. */
function findHeader(normalized: string[], field: TargetField, taken: Set<number>): number | null {
  const synonyms = HEADER_SYNONYMS[field]
  const free = (i: number) => i !== -1 && !taken.has(i)

  let idx = normalized.findIndex((h, i) => !taken.has(i) && synonyms.includes(h))
  if (!free(idx)) {
    idx = normalized.findIndex((h, i) => !taken.has(i) && synonyms.some((s) => h.includes(s)))
  }
  return free(idx) ? idx : null
}

/**
 * Auto-mapea las cabeceras del CSV a los campos destino por nombre.
 *
 * Con la cabecera oficial (`NACIONALIDAD,CEDULA,P_NOMBRE,S_NOMBRE,P_APELLIDO,
 * S_APELLIDO,EMAIL,COD_CARR,CARRERA,ESTADO,TIPO`) acierta las once columnas y
 * deja `full_name` vacío, porque el nombre sale de sus cuatro partes.
 */
export function autoMapColumns(headers: string[]): ColumnMapping {
  const normalized = headers.map(normalizeHeader)
  const mapping = emptyMapping()
  // Una columna no puede alimentar dos campos: 'CEDULA' no debe acabar también
  // en 'cod_carr' por la coincidencia parcial de 'codigo'.
  const taken = new Set<number>()

  // Las partes del nombre primero: 'p nombre' contiene 'nombre', así que si
  // `full_name` fuese antes se quedaría con la columna equivocada.
  const order: SingleField[] = [
    ...NAME_PART_FIELDS, 'cedula', 'nacionalidad', 'cod_carr', 'email', 'career', 'is_active',
  ]
  for (const field of order) {
    const idx = findHeader(normalized, field, taken)
    mapping[field] = idx
    if (idx !== null) taken.add(idx)
  }

  // Solo se busca una columna de nombre completo si no se detectó ninguna parte.
  const hasParts = NAME_PART_FIELDS.some((f) => mapping[f] !== null)
  if (!hasParts) {
    const idx = findHeader(normalized, 'full_name', taken)
    if (idx !== null) {
      mapping.full_name = [idx]
      taken.add(idx)
    }
  }

  return mapping
}

/* -------------------------------------------------------------------------- */
/* Construcción de las filas del contrato bulk                                 */
/* -------------------------------------------------------------------------- */

/** Devuelve el valor de una celda para un campo mapeado, o `''` si no aplica. */
function cell(row: string[], index: number | null): string {
  if (index === null || index < 0 || index >= row.length) return ''
  return (row[index] ?? '').trim()
}

/** Colapsa espacios repetidos y recorta: evita dobles espacios al faltar una parte. */
function joinName(parts: string[]): string {
  return parts.filter((p) => p !== '').join(' ').replace(/\s+/g, ' ').trim()
}

/** Une las partes del nombre (o las columnas de `full_name`) en un nombre único. */
export function buildFullName(row: string[], mapping: ColumnMapping): string {
  const parts = NAME_PART_FIELDS.map((f) => cell(row, mapping[f]))
  if (parts.some((p) => p !== '')) return joinName(parts)
  return joinName(mapping.full_name.map((i) => cell(row, i)))
}

const nullIfEmpty = (v: string): string | null => (v === '' ? null : v)

/**
 * Transforma las filas del CSV en items del contrato de importación masiva,
 * aplicando el mapeo de columnas. La cédula se limpia a solo dígitos; los campos
 * opcionales vacíos se envían como `null`.
 *
 * Un `is_active` sin mapear o con un valor no reconocido cae a `false`; la
 * advertencia la emite `validateRow`, que sí ve el texto original.
 */
export function buildBulkItems(rows: string[][], mapping: ColumnMapping): StudentBulkItem[] {
  return rows.map((row) => {
    const cedulaRaw = cell(row, mapping.cedula)
    return {
      full_name:    buildFullName(row, mapping),
      cedula:       cleanCedula(cedulaRaw),
      email:        nullIfEmpty(cell(row, mapping.email)),
      career:       nullIfEmpty(cell(row, mapping.career)),
      is_active:    parseActiveState(cell(row, mapping.is_active)) ?? false,
      // La columna es de un solo carácter en la BD ('V' | 'E' | 'P').
      nacionalidad: nullIfEmpty(cell(row, mapping.nacionalidad).slice(0, 1).toUpperCase()),
      cedula_raw:   nullIfEmpty(cedulaRaw),
      p_nombre:     nullIfEmpty(cell(row, mapping.p_nombre)),
      s_nombre:     nullIfEmpty(cell(row, mapping.s_nombre)),
      p_apellido:   nullIfEmpty(cell(row, mapping.p_apellido)),
      s_apellido:   nullIfEmpty(cell(row, mapping.s_apellido)),
      cod_carr:     nullIfEmpty(cell(row, mapping.cod_carr)),
    }
  })
}

/* -------------------------------------------------------------------------- */
/* Validación                                                                  */
/* -------------------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface RowValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Valida un item de estudiante: `full_name` y `cedula` (con dígitos) obligatorios;
 * si hay email, formato razonable (el correo es opcional en el padrón).
 *
 * `rawActive` es el texto original de la columna de estado: si no se reconoce, la
 * fila se importa como inactiva pero con una advertencia visible, en lugar de
 * asumirlo en silencio.
 */
export function validateRow(item: StudentBulkItem, rawActive?: string): RowValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (item.full_name.trim() === '') errors.push('Falta el nombre completo')
  if (item.cedula.trim() === '') errors.push('Falta la cédula (sin dígitos válidos)')
  if (item.email !== null && item.email.trim() !== '' && !EMAIL_RE.test(item.email.trim())) {
    errors.push('Correo con formato inválido')
  }
  if (rawActive !== undefined && parseActiveState(rawActive) === null) {
    warnings.push(`Estado "${rawActive}" no reconocido: se importa como inactivo`)
  }
  if (item.cedula_raw && item.cedula_raw.trim() !== item.cedula) {
    warnings.push(`Documento "${item.cedula_raw}" se guarda con cédula ${item.cedula}`)
  }

  return { valid: errors.length === 0, errors, warnings }
}

/** Parte una lista en lotes de tamaño fijo (envío por chunks a `/students/bulk`). */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}
