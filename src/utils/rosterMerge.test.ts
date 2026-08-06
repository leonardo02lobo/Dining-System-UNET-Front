import { describe, it, expect } from 'vitest'
import { mergeRosterFiles } from './rosterMerge'
import type { StudentBulkItem } from '../types/student'

function item(over: Partial<StudentBulkItem> & { cedula: string }): StudentBulkItem {
  return {
    full_name: 'Persona Uno',
    email: null,
    career: null,
    is_active: true,
    ...over,
  }
}

describe('mergeRosterFiles', () => {
  it('concatenates files that share no cédula', () => {
    const res = mergeRosterFiles([
      { name: 'Activos.csv', items: [item({ cedula: '111' })] },
      { name: 'Inactivos.csv', items: [item({ cedula: '222', is_active: false })] },
    ])
    expect(res.merged).toHaveLength(2)
    expect(res.conflicts).toHaveLength(0)
    expect(res.duplicates).toBe(0)
  })

  it('keeps the active record when a cédula is in both files', () => {
    // El caso real del padrón: 32889089 figura activo en Producción Animal e
    // inactivo en TSU Entrenamiento Deportivo.
    const res = mergeRosterFiles([
      {
        name: 'Activos.csv',
        items: [item({ cedula: '32889089', career: 'Ingeniería De Producción Animal', is_active: true })],
      },
      {
        name: 'Inactivos.csv',
        items: [item({ cedula: '32889089', career: 'TSU Entrenamiento Deportivo', is_active: false })],
      },
    ])

    expect(res.merged).toHaveLength(1)
    expect(res.merged[0].is_active).toBe(true)
    expect(res.merged[0].career).toBe('Ingeniería De Producción Animal')
    expect(res.duplicates).toBe(1)
    expect(res.conflicts).toHaveLength(1)
    expect(res.conflicts[0].cedula).toBe('32889089')
    expect(res.conflicts[0].keptFrom).toBe('Activos.csv')
    expect(res.conflicts[0].discarded[0].from).toBe('Inactivos.csv')
  })

  it('keeps the active record regardless of file order', () => {
    const activo = { name: 'Activos.csv', items: [item({ cedula: '1', is_active: true })] }
    const inactivo = { name: 'Inactivos.csv', items: [item({ cedula: '1', is_active: false })] }
    expect(mergeRosterFiles([activo, inactivo]).merged[0].is_active).toBe(true)
    expect(mergeRosterFiles([inactivo, activo]).merged[0].is_active).toBe(true)
  })

  it('keeps the later row when both duplicates share the same state', () => {
    const res = mergeRosterFiles([
      { name: 'A.csv', items: [item({ cedula: '1', career: 'Vieja', is_active: false })] },
      { name: 'B.csv', items: [item({ cedula: '1', career: 'Nueva', is_active: false })] },
    ])
    expect(res.merged[0].career).toBe('Nueva')
    expect(res.conflicts[0].keptFrom).toBe('B.csv')
  })

  it('deduplicates within a single file too', () => {
    const res = mergeRosterFiles([
      { name: 'A.csv', items: [item({ cedula: '1' }), item({ cedula: '1' }), item({ cedula: '2' })] },
    ])
    expect(res.merged).toHaveLength(2)
    expect(res.duplicates).toBe(1)
  })

  it('reports every discarded row of a triple duplicate', () => {
    const res = mergeRosterFiles([
      { name: 'A.csv', items: [item({ cedula: '1', is_active: false })] },
      { name: 'B.csv', items: [item({ cedula: '1', is_active: false })] },
      { name: 'C.csv', items: [item({ cedula: '1', is_active: true })] },
    ])
    expect(res.merged).toHaveLength(1)
    expect(res.merged[0].is_active).toBe(true)
    expect(res.duplicates).toBe(2)
    expect(res.conflicts[0].discarded).toHaveLength(2)
  })

  it('passes through rows without a usable cédula so the backend reports them', () => {
    const res = mergeRosterFiles([
      { name: 'A.csv', items: [item({ cedula: '' }), item({ cedula: '' })] },
    ])
    expect(res.merged).toHaveLength(2)
    expect(res.duplicates).toBe(0)
  })
})
