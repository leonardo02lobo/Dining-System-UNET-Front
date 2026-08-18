import { describe, it, expect } from 'vitest'
import type { Consumption } from '../types/consumption'
import { roleStats } from './sessionStats'

/**
 * fe-gente-externa-registro-manual — la gráfica «Por rol» agrupa a la gente externa por
 * su etiqueta.
 *
 * El `else` que volcaba a todo el que no era del padrón en un único sector «Externo»
 * venía de cuando había dos tipos fijos de externo. Con etiquetas que crea quien
 * administra, ese sector amontonaba a los jubilados, a los cuarenta de una jornada
 * deportiva y a una comisión de visita: la gráfica decía «hubo 47 externos» cuando la
 * pregunta que se le hace es de qué grupo eran.
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

const bucket = (buckets: { label: string; count: number }[], label: string) =>
  buckets.find((b) => b.label === label)?.count

describe('roleStats', () => {
  it('cuenta los cuatro roles del padrón como siempre', () => {
    const buckets = roleStats([
      entrant({ user_type: 'STUDENT' }),
      entrant({ user_type: 'STUDENT' }),
      entrant({ user_type: 'TEACHER' }),
    ])

    expect(bucket(buckets, 'Estudiante')).toBe(2)
    expect(bucket(buckets, 'Docente')).toBe(1)
    expect(bucket(buckets, 'Administrativo')).toBe(0)
  })

  it('crea un sector por etiqueta en vez de uno solo llamado «Externo»', () => {
    const buckets = roleStats([
      entrant({ person_type: 'Jubilado' }),
      entrant({ person_type: 'Jubilado' }),
      entrant({ person_type: 'Congreso' }),
    ])

    expect(bucket(buckets, 'Jubilado')).toBe(2)
    expect(bucket(buckets, 'Congreso')).toBe(1)
    expect(bucket(buckets, 'Externo')).toBeUndefined()
  })

  it('las etiquetas van detrás de los cuatro roles del padrón', () => {
    const buckets = roleStats([entrant({ person_type: 'Congreso' }), entrant({ user_type: 'WORKER' })])

    const labels = buckets.map((b) => b.label)
    expect(labels.slice(0, 4)).toEqual(['Estudiante', 'Docente', 'Administrativo', 'Obrero'])
    expect(labels[4]).toBe('Congreso')
  })

  it('los sectores suman el total de entrantes graficados', () => {
    const entrants = [
      entrant({ user_type: 'STUDENT' }),
      entrant({ person_type: 'Jubilado' }),
      entrant({ person_type: 'Congreso' }),
      entrant({}), // sin ninguna de las dos clasificaciones
    ]

    const total = roleStats(entrants).reduce((sum, b) => sum + b.count, 0)

    // Una gráfica cuyos sectores no suman el total engaña más que una con un sector feo.
    expect(total).toBe(entrants.length)
  })

  it('las filas sin clasificar tienen su propio sector, no desaparecen', () => {
    const buckets = roleStats([entrant({}), entrant({ person_type: '   ' })])

    expect(bucket(buckets, 'Sin clasificar')).toBe(2)
  })

  it('el sector «Sin clasificar» no aparece cuando no hace falta', () => {
    const buckets = roleStats([entrant({ user_type: 'STUDENT' })])

    expect(bucket(buckets, 'Sin clasificar')).toBeUndefined()
  })
})
