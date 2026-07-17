import { describe, it, expect } from 'vitest'
import {
  parseCsv,
  parseBoolean,
  cleanCedula,
  autoMapColumns,
  buildBulkItems,
  validateRow,
  type ColumnMapping,
} from './csvImport'

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
})

describe('parseBoolean', () => {
  it('parses truthy values tolerantly', () => {
    for (const v of ['true', '1', 'si', 'sí', 'Activo', 'ACTIVE', 'x', 'Yes', 'VERDADERO']) {
      expect(parseBoolean(v)).toBe(true)
    }
  })

  it('parses falsy/empty values tolerantly', () => {
    for (const v of ['false', '0', 'no', 'Inactivo', '', '   ', undefined, null]) {
      expect(parseBoolean(v)).toBe(false)
    }
  })

  it('treats unknown values as false', () => {
    expect(parseBoolean('maybe')).toBe(false)
  })
})

describe('cleanCedula', () => {
  it('keeps only digits', () => {
    expect(cleanCedula('V-12.345.678')).toBe('12345678')
    expect(cleanCedula('  V 123 ')).toBe('123')
    expect(cleanCedula('E-9.876.543')).toBe('9876543')
    expect(cleanCedula('ABC')).toBe('')
  })
})

describe('autoMapColumns', () => {
  it('maps headers by name including accents and synonyms', () => {
    const mapping = autoMapColumns(['Nombre Completo', 'Correo', 'Carrera', 'Cédula', 'Activo'])
    expect(mapping).toEqual({
      full_name: 0,
      email: 1,
      career: 2,
      cedula: 3,
      is_active: 4,
    })
  })

  it('detects alternative header names', () => {
    const mapping = autoMapColumns(['documento', 'email', 'nombre', 'estado', 'especialidad'])
    expect(mapping.cedula).toBe(0)
    expect(mapping.email).toBe(1)
    expect(mapping.full_name).toBe(2)
    expect(mapping.is_active).toBe(3)
    expect(mapping.career).toBe(4)
  })

  it('leaves unmatched fields as null', () => {
    const mapping = autoMapColumns(['col1', 'col2'])
    expect(mapping.full_name).toBeNull()
    expect(mapping.cedula).toBeNull()
  })
})

describe('buildBulkItems', () => {
  const mapping: ColumnMapping = {
    full_name: 0,
    email: 1,
    career: 2,
    cedula: 3,
    is_active: 4,
  }

  it('shapes rows to the bulk contract and cleans the cédula', () => {
    const rows = [['Juan Perez', 'juan@x.com', 'Ing. Civil', 'V-12.345.678', 'si']]
    expect(buildBulkItems(rows, mapping)).toEqual([
      {
        full_name: 'Juan Perez',
        cedula: '12345678',
        email: 'juan@x.com',
        career: 'Ing. Civil',
        is_active: true,
      },
    ])
  })

  it('sends empty email/career as null and parses booleans', () => {
    const rows = [['Ana', '', '', 'V999', '0']]
    expect(buildBulkItems(rows, mapping)[0]).toEqual({
      full_name: 'Ana',
      cedula: '999',
      email: null,
      career: null,
      is_active: false,
    })
  })

  it('tolerates missing/unmapped columns', () => {
    const partial: ColumnMapping = { full_name: 0, email: null, career: null, cedula: 1, is_active: null }
    const item = buildBulkItems([['Bob', 'V1']], partial)[0]
    expect(item).toEqual({
      full_name: 'Bob',
      cedula: '1',
      email: null,
      career: null,
      is_active: false,
    })
  })
})

describe('validateRow', () => {
  it('accepts a valid row', () => {
    expect(validateRow({ full_name: 'Juan', cedula: '123', email: 'j@x.com', career: null, is_active: true }).valid).toBe(true)
  })

  it('requires full_name and cedula', () => {
    const r = validateRow({ full_name: '', cedula: '', email: null, career: null, is_active: false })
    expect(r.valid).toBe(false)
    expect(r.errors.length).toBe(2)
  })

  it('rejects a malformed email but allows null email', () => {
    expect(validateRow({ full_name: 'A', cedula: '1', email: 'not-an-email', career: null, is_active: true }).valid).toBe(false)
    expect(validateRow({ full_name: 'A', cedula: '1', email: null, career: null, is_active: true }).valid).toBe(true)
  })
})
