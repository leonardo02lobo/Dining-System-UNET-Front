import { describe, it, expect } from 'vitest'
import type { Consumption } from '../types/consumption'
import { labelsPresentIn, matchesTypeFilter } from './entrantTypeFilter'

/**
 * fe-gente-externa-registro-manual — el filtro de los entrantes de una sesión clasifica
 * también a la gente externa.
 *
 * Comparar solo contra `user_type` hacía desaparecer de la tabla a toda la gente externa
 * en cuanto se elegía cualquier rol: la tienen nula, así que no había ningún valor del
 * filtro capaz de mostrarla.
 */

function entrant(partial: Partial<Consumption>): Consumption {
  return {
    id: 1,
    lunch_session_id: 1,
    registered_by_id: 1,
    registered_at: '2026-08-17T12:00:00Z',
    is_manual: false,
    ...partial,
  } as Consumption
}

describe('labelsPresentIn', () => {
  it('devuelve solo las etiquetas que hay en los entrantes cargados', () => {
    const labels = labelsPresentIn([
      entrant({ user_type: 'STUDENT' }),
      entrant({ person_type: 'Jubilado' }),
      entrant({ person_type: 'Jubilado' }),
      entrant({ person_type: 'Congreso' }),
    ])

    // No el catálogo completo: una etiqueta por la que no entró nadie a esta sesión solo
    // produciría un filtro que devuelve una tabla vacía.
    expect(labels).toEqual(['Congreso', 'Jubilado'])
  })

  it('ignora las filas sin etiqueta y las vacías', () => {
    expect(labelsPresentIn([entrant({}), entrant({ person_type: '  ' })])).toEqual([])
  })

  it('ordena alfabéticamente en español', () => {
    const labels = labelsPresentIn([
      entrant({ person_type: 'Ñandú' }),
      entrant({ person_type: 'Álvarez' }),
      entrant({ person_type: 'Congreso' }),
    ])

    expect(labels).toEqual(['Álvarez', 'Congreso', 'Ñandú'])
  })
})

describe('matchesTypeFilter', () => {
  it('"ALL" deja pasar a todo el mundo', () => {
    expect(matchesTypeFilter(entrant({ person_type: 'Congreso' }), 'ALL')).toBe(true)
    expect(matchesTypeFilter(entrant({ user_type: 'STUDENT' }), 'ALL')).toBe(true)
  })

  it('un rol del padrón compara contra user_type', () => {
    expect(matchesTypeFilter(entrant({ user_type: 'TEACHER' }), 'TEACHER')).toBe(true)
    expect(matchesTypeFilter(entrant({ user_type: 'STUDENT' }), 'TEACHER')).toBe(false)
  })

  it('una etiqueta compara contra person_type', () => {
    expect(matchesTypeFilter(entrant({ person_type: 'Congreso' }), 'Congreso')).toBe(true)
    expect(matchesTypeFilter(entrant({ person_type: 'Jubilado' }), 'Congreso')).toBe(false)
  })

  it('elegir un rol del padrón excluye a la gente externa, y viceversa', () => {
    const external = entrant({ person_type: 'Congreso' })
    const teacher = entrant({ user_type: 'TEACHER' })

    expect(matchesTypeFilter(external, 'TEACHER')).toBe(false)
    expect(matchesTypeFilter(teacher, 'Congreso')).toBe(false)
    // …pero con "Todos" las dos vuelven: la gente externa no se pierde por el camino.
    expect([external, teacher].filter((e) => matchesTypeFilter(e, 'ALL'))).toHaveLength(2)
  })

  it('el rol del padrón se compara sin distinguir caja', () => {
    expect(matchesTypeFilter(entrant({ user_type: 'teacher' }), 'TEACHER')).toBe(true)
  })
})
