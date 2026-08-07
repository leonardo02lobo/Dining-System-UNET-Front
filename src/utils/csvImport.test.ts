import { describe, it, expect } from 'vitest'
import {
  parseCsv,
  parseBoolean,
  parseActiveState,
  cleanCedula,
  autoMapColumns,
  buildBulkItems,
  buildFullName,
  validateRow,
  detectEncoding,
  decodeCsvBuffer,
  detectDelimiter,
  emptyMapping,
  chunk,
  type ColumnMapping,
} from './csvImport'

/** Cabecera exacta de Activos.csv / Inactivos.csv (Control de Estudios). */
const OFFICIAL_HEADERS = [
  'NACIONALIDAD', 'CEDULA', 'P_NOMBRE', 'S_NOMBRE', 'P_APELLIDO', 'S_APELLIDO',
  'EMAIL', 'COD_CARR', 'CARRERA', 'ESTADO', 'TIPO',
]

const OFFICIAL_ROW = [
  'E', '84600748', 'Nikol', 'Valentina', 'Cespedes', 'Rodriguez',
  'nikol.cespedes@unet.edu.ve', '22000', 'Licenciatura En Psicología', 'A', 'estudiante',
]

/** Codifica un texto tal como lo entrega el sistema académico: UTF-32BE sin BOM. */
function encodeUtf32be(text: string): ArrayBuffer {
  const points = [...text]
  const buffer = new ArrayBuffer(points.length * 4)
  const view = new DataView(buffer)
  points.forEach((ch, i) => view.setUint32(i * 4, ch.codePointAt(0)!, false))
  return buffer
}

function encodeUtf16le(text: string): ArrayBuffer {
  const buffer = new ArrayBuffer(text.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < text.length; i++) view.setUint16(i * 2, text.charCodeAt(i), true)
  return buffer
}

describe('detectEncoding', () => {
  it('detects UTF-32BE without BOM (the official roster files)', () => {
    expect(detectEncoding(encodeUtf32be('"NACIONALIDAD"'))).toBe('utf-32be')
  })

  it('detects UTF-16LE without BOM', () => {
    expect(detectEncoding(encodeUtf16le('abcd'))).toBe('utf-16le')
  })

  it('detects plain UTF-8 and UTF-8 with BOM', () => {
    expect(detectEncoding(new TextEncoder().encode('a,b,c').buffer as ArrayBuffer)).toBe('utf-8')
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, 0x61, 0x2c, 0x62])
    expect(detectEncoding(withBom.buffer)).toBe('utf-8')
  })

  it('prefers the 4-byte BOM over the 2-byte one it starts with', () => {
    // FF FE 00 00 es UTF-32LE, no UTF-16LE seguido de dos nulos.
    expect(detectEncoding(new Uint8Array([0xff, 0xfe, 0x00, 0x00]).buffer)).toBe('utf-32le')
  })
})

describe('decodeCsvBuffer', () => {
  it('decodes UTF-32BE preserving Spanish accents', () => {
    const source = '"CARRERA"\n"Ingeniería En Informática"\n"Licenciatura En Psicología"'
    const { text, encoding } = decodeCsvBuffer(encodeUtf32be(source))
    expect(encoding).toBe('utf-32be')
    expect(text).toBe(source)
  })

  it('round-trips the official header and row through UTF-32BE', () => {
    const csv = `"${OFFICIAL_HEADERS.join('","')}"\n"${OFFICIAL_ROW.join('","')}"`
    const { text } = decodeCsvBuffer(encodeUtf32be(csv))
    const { headers, rows } = parseCsv(text)
    expect(headers).toEqual(OFFICIAL_HEADERS)
    expect(rows[0]).toEqual(OFFICIAL_ROW)
  })

  it('decodes UTF-16LE', () => {
    const { text, encoding } = decodeCsvBuffer(encodeUtf16le('a,b\n1,2'))
    expect(encoding).toBe('utf-16le')
    expect(text).toBe('a,b\n1,2')
  })
})

describe('detectDelimiter', () => {
  it('detects commas and semicolons from the header line', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',')
    expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';')
  })

  it('ignores separators inside quoted fields', () => {
    expect(detectDelimiter('"Perez; Juan";b\n1;2')).toBe(';')
  })
})

describe('parseCsv', () => {
  it('splits headers and rows on commas', () => {
    const { headers, rows } = parseCsv('Nombre,Correo,Cedula\nJuan Perez,juan@x.com,V123\nAna,ana@x.com,V456')
    expect(headers).toEqual(['Nombre', 'Correo', 'Cedula'])
    expect(rows).toEqual([
      ['Juan Perez', 'juan@x.com', 'V123'],
      ['Ana', 'ana@x.com', 'V456'],
    ])
  })

  it('respects quoted fields containing commas', () => {
    const { rows } = parseCsv('Nombre,Carrera\n"Perez, Juan","Ing. Civil"')
    expect(rows[0]).toEqual(['Perez, Juan', 'Ing. Civil'])
  })

  it('handles escaped quotes and CRLF line endings', () => {
    const { rows } = parseCsv('a,b\r\n"say ""hi""",z\r\n')
    expect(rows[0]).toEqual(['say "hi"', 'z'])
  })

  it('ignores fully blank lines', () => {
    const { rows } = parseCsv('a,b\n1,2\n\n3,4\n')
    expect(rows).toEqual([['1', '2'], ['3', '4']])
  })

  it('parses semicolon-separated files (Excel es-ES)', () => {
    const { headers, rows } = parseCsv('Nombre;Cedula\nAna;V-1')
    expect(headers).toEqual(['Nombre', 'Cedula'])
    expect(rows[0]).toEqual(['Ana', 'V-1'])
  })
})

describe('parseActiveState', () => {
  it('reads the official A / I codes', () => {
    expect(parseActiveState('A')).toBe(true)
    expect(parseActiveState('a')).toBe(true)
    expect(parseActiveState('I')).toBe(false)
  })

  it('parses truthy values tolerantly', () => {
    for (const v of ['true', '1', 'si', 'sí', 'Activo', 'ACTIVE', 'x', 'Yes', 'VERDADERO']) {
      expect(parseActiveState(v)).toBe(true)
    }
  })

  it('parses falsy/empty values tolerantly', () => {
    for (const v of ['false', '0', 'no', 'Inactivo', '', '   ', undefined, null]) {
      expect(parseActiveState(v)).toBe(false)
    }
  })

  it('returns null for unknown values so the row can warn', () => {
    expect(parseActiveState('maybe')).toBeNull()
    expect(parseBoolean('maybe')).toBe(false)
  })
})

describe('cleanCedula', () => {
  it('keeps only digits', () => {
    expect(cleanCedula('V-12.345.678')).toBe('12345678')
    expect(cleanCedula('  V 123 ')).toBe('123')
    expect(cleanCedula('E-9.876.543')).toBe('9876543')
    expect(cleanCedula('ABC')).toBe('')
    expect(cleanCedula('BD201239')).toBe('201239')
  })
})

describe('autoMapColumns', () => {
  it('maps every column of the official header', () => {
    const m = autoMapColumns(OFFICIAL_HEADERS)
    expect(m.nacionalidad).toBe(0)
    expect(m.cedula).toBe(1)
    expect(m.p_nombre).toBe(2)
    expect(m.s_nombre).toBe(3)
    expect(m.p_apellido).toBe(4)
    expect(m.s_apellido).toBe(5)
    expect(m.email).toBe(6)
    expect(m.cod_carr).toBe(7)
    expect(m.career).toBe(8)
    expect(m.is_active).toBe(9)
    // El nombre sale de sus cuatro partes, no de una columna suelta.
    expect(m.full_name).toEqual([])
  })

  it('never assigns the same column to two fields', () => {
    const m = autoMapColumns(OFFICIAL_HEADERS)
    const used = [m.nacionalidad, m.cedula, m.p_nombre, m.s_nombre, m.p_apellido,
      m.s_apellido, m.email, m.cod_carr, m.career, m.is_active]
    expect(new Set(used).size).toBe(used.length)
  })

  it('falls back to a single full-name column in the legacy format', () => {
    const m = autoMapColumns(['Nombre Completo', 'Correo', 'Carrera', 'Cédula', 'Activo'])
    expect(m.full_name).toEqual([0])
    expect(m.email).toBe(1)
    expect(m.career).toBe(2)
    expect(m.cedula).toBe(3)
    expect(m.is_active).toBe(4)
  })

  it('detects alternative header names', () => {
    const m = autoMapColumns(['documento', 'email', 'nombre', 'estado', 'especialidad'])
    expect(m.cedula).toBe(0)
    expect(m.email).toBe(1)
    expect(m.full_name).toEqual([2])
    expect(m.is_active).toBe(3)
    expect(m.career).toBe(4)
  })

  it('leaves unmatched fields unmapped', () => {
    const m = autoMapColumns(['col1', 'col2'])
    expect(m.full_name).toEqual([])
    expect(m.cedula).toBeNull()
  })
})

describe('buildFullName', () => {
  const mapping = autoMapColumns(OFFICIAL_HEADERS)

  it('joins the four official name columns', () => {
    expect(buildFullName(OFFICIAL_ROW, mapping)).toBe('Nikol Valentina Cespedes Rodriguez')
  })

  it('collapses the gap left by an empty middle name', () => {
    const row = [...OFFICIAL_ROW]
    row[3] = ''   // S_NOMBRE vacío: 287 filas del padrón real
    row[5] = ''   // S_APELLIDO vacío
    expect(buildFullName(row, mapping)).toBe('Nikol Cespedes')
  })
})

describe('buildBulkItems', () => {
  it('shapes an official row into the bulk contract', () => {
    const mapping = autoMapColumns(OFFICIAL_HEADERS)
    expect(buildBulkItems([OFFICIAL_ROW], mapping)[0]).toEqual({
      full_name:    'Nikol Valentina Cespedes Rodriguez',
      cedula:       '84600748',
      email:        'nikol.cespedes@unet.edu.ve',
      career:       'Licenciatura En Psicología',
      is_active:    true,
      nacionalidad: 'E',
      cedula_raw:   '84600748',
      p_nombre:     'Nikol',
      s_nombre:     'Valentina',
      p_apellido:   'Cespedes',
      s_apellido:   'Rodriguez',
      cod_carr:     '22000',
    })
  })

  it('marks an ESTADO of I as inactive', () => {
    const mapping = autoMapColumns(OFFICIAL_HEADERS)
    const row = [...OFFICIAL_ROW]
    row[9] = 'I'
    expect(buildBulkItems([row], mapping)[0].is_active).toBe(false)
  })

  it('keeps the raw document of a passport while cleaning the cédula', () => {
    const mapping = autoMapColumns(OFFICIAL_HEADERS)
    const row = ['P', 'BD201239', 'Kevin', 'Andrés', 'Ortiz', 'Bedoya',
      'kevin.ortizb@unet.edu.ve', '05000', 'Arquitectura', 'I', 'Estudiante']
    const item = buildBulkItems([row], mapping)[0]
    expect(item.cedula).toBe('201239')
    expect(item.cedula_raw).toBe('BD201239')
    expect(item.nacionalidad).toBe('P')
  })

  it('sends empty optional fields as null', () => {
    const mapping: ColumnMapping = { ...emptyMapping(), full_name: [0], email: 1, career: 2, cedula: 3, is_active: 4 }
    expect(buildBulkItems([['Ana', '', '', 'V999', '0']], mapping)[0]).toMatchObject({
      full_name: 'Ana',
      cedula:    '999',
      email:     null,
      career:    null,
      is_active: false,
      cod_carr:  null,
    })
  })

  it('tolerates unmapped columns', () => {
    const mapping: ColumnMapping = { ...emptyMapping(), full_name: [0], cedula: 1 }
    expect(buildBulkItems([['Bob', 'V1']], mapping)[0]).toMatchObject({
      full_name: 'Bob',
      cedula:    '1',
      email:     null,
      is_active: false,
    })
  })
})

describe('validateRow', () => {
  const base = {
    full_name: 'Juan', cedula: '123', email: 'j@x.com', career: null, is_active: true,
  }

  it('accepts a valid row', () => {
    expect(validateRow(base).valid).toBe(true)
  })

  it('requires full_name and cedula', () => {
    const r = validateRow({ ...base, full_name: '', cedula: '', email: null })
    expect(r.valid).toBe(false)
    expect(r.errors.length).toBe(2)
  })

  it('rejects a malformed email but allows null email', () => {
    expect(validateRow({ ...base, email: 'not-an-email' }).valid).toBe(false)
    expect(validateRow({ ...base, email: null }).valid).toBe(true)
  })

  it('warns instead of failing when the state text is unrecognised', () => {
    const r = validateRow(base, 'quizá')
    expect(r.valid).toBe(true)
    expect(r.warnings[0]).toContain('no reconocido')
  })

  it('warns when the stored cédula differs from the raw document', () => {
    const r = validateRow({ ...base, cedula: '201239', cedula_raw: 'BD201239' })
    expect(r.valid).toBe(true)
    expect(r.warnings[0]).toContain('BD201239')
  })
})

describe('chunk', () => {
  it('splits a list into fixed-size batches', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([], 500)).toEqual([])
  })
})
