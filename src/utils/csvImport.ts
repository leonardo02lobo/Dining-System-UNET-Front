import type { StudentBulkItem } from '../types/student'

/** Campos destino a los que se mapean las columnas del CSV. */
export type TargetField = 'full_name' | 'email' | 'career' | 'cedula' | 'is_active'

export const TARGET_FIELDS: TargetField[] = [
  'full_name',
  'email',
  'career',
  'cedula',
  'is_active',
]

/** Etiquetas visibles de cada campo destino. */
export const TARGET_FIELD_LABEL: Record<TargetField, string> = {
  full_name: 'Nombre completo',
  email:     'Correo',
  career:    'Carrera',
  cedula:    'Cédula',
  is_active: 'Activo',
}

/**
 * Mapeo de campo destino → índice de columna del CSV (o `null` si no está mapeado).
 */
export type ColumnMapping = Record<TargetField, number | null>

/** Deja solo los dígitos de una cédula (quita 'V-', puntos, espacios, etc.). */
export function cleanCedula(raw: string): string {
  return (raw ?? '').replace(/\D/g, '')
}

export interface ParsedCsv {
  headers: string[]
  rows: string[][]
}

/**
 * Parser de CSV separado por comas con soporte de comillas dobles (`"..."`),
 * comas y saltos de línea escapados dentro de comillas, y `""` como comilla literal.
 * Devuelve la primera fila como `headers` y el resto como `rows`.
 */
export function parseCsv(text: string): ParsedCsv {
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
    } else if (ch === ',') {
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

const TRUE_VALUES = new Set(['true', '1', 'si', 'sí', 'activo', 'active', 'x', 'yes', 'y', 'verdadero'])
const FALSE_VALUES = new Set(['false', '0', 'no', 'inactivo', 'inactive', '', 'n', 'falso'])

/**
 * Interpreta un valor de texto como booleano de forma tolerante.
 * Acepta true/false, 1/0, si/sí/no, activo/inactivo, x/vacío (case-insensitive).
 * Los valores no reconocidos se tratan como `false`.
 */
export function parseBoolean(value: string | undefined | null): boolean {
  const v = (value ?? '').trim().toLowerCase()
  if (TRUE_VALUES.has(v)) return true
  if (FALSE_VALUES.has(v)) return false
  return false
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

/** Sinónimos de cabecera por campo destino (ya normalizados). */
const HEADER_SYNONYMS: Record<TargetField, string[]> = {
  full_name: ['nombre completo', 'nombre', 'nombres', 'nombre y apellido', 'full name', 'name'],
  email:     ['correo', 'email', 'e mail', 'correo electronico', 'mail'],
  career:    ['carrera', 'career', 'especialidad', 'programa'],
  cedula:    ['cedula', 'documento', 'document id', 'ci', 'dni', 'identificacion', 'nro documento'],
  is_active: ['activo', 'active', 'estado', 'is active', 'habilitado'],
}

/**
 * Auto-mapea las cabeceras del CSV a los campos destino por nombre.
 * Devuelve un `ColumnMapping` con el índice de columna o `null` si no se detecta.
 */
export function autoMapColumns(headers: string[]): ColumnMapping {
  const normalized = headers.map(normalizeHeader)
  const mapping: ColumnMapping = {
    full_name: null,
    email:     null,
    career:    null,
    cedula:    null,
    is_active: null,
  }

  for (const field of TARGET_FIELDS) {
    const synonyms = HEADER_SYNONYMS[field]
    // 1) coincidencia exacta
    let idx = normalized.findIndex((h) => synonyms.includes(h))
    // 2) coincidencia parcial (la cabecera contiene un sinónimo)
    if (idx === -1) {
      idx = normalized.findIndex((h) => synonyms.some((s) => h.includes(s)))
    }
    mapping[field] = idx === -1 ? null : idx
  }

  return mapping
}

/** Devuelve el valor de una celda para un campo mapeado, o `''` si no aplica. */
function cell(row: string[], index: number | null): string {
  if (index === null || index < 0 || index >= row.length) return ''
  return (row[index] ?? '').trim()
}

/**
 * Transforma las filas del CSV en items del contrato de importación masiva,
 * aplicando el mapeo de columnas. `email` y `career` vacíos se envían como `null`.
 */
export function buildBulkItems(rows: string[][], mapping: ColumnMapping): StudentBulkItem[] {
  return rows.map((row) => {
    const email = cell(row, mapping.email)
    const career = cell(row, mapping.career)
    return {
      full_name: cell(row, mapping.full_name),
      cedula:    cleanCedula(cell(row, mapping.cedula)),
      email:     email === '' ? null : email,
      career:    career === '' ? null : career,
      is_active: parseBoolean(cell(row, mapping.is_active)),
    }
  })
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface RowValidation {
  valid: boolean
  errors: string[]
}

/**
 * Valida un item de estudiante: `full_name` y `cedula` (con dígitos) obligatorios;
 * si hay email, formato razonable (el correo es opcional en el padrón).
 */
export function validateRow(item: StudentBulkItem): RowValidation {
  const errors: string[] = []
  if (item.full_name.trim() === '') errors.push('Falta el nombre completo')
  if (item.cedula.trim() === '') errors.push('Falta la cédula (sin dígitos válidos)')
  if (item.email !== null && item.email.trim() !== '' && !EMAIL_RE.test(item.email.trim())) {
    errors.push('Correo con formato inválido')
  }
  return { valid: errors.length === 0, errors }
}
