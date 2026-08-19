import type { Consumption } from '../types/consumption'

export const PADRON_TYPES = new Set(['STUDENT', 'ADMINISTRATIVE', 'TEACHER', 'WORKER'])

/**
 * Etiquetas de gente externa **presentes en los entrantes cargados**, en orden alfabético.
 *
 * Se derivan de las filas que se están mostrando y no del catálogo completo: ofrecer la
 * etiqueta de un evento por el que no entró nadie en esta sesión solo produce un filtro
 * que devuelve una tabla vacía. Las opciones describen lo que hay delante.
 */
export function labelsPresentIn(entrants: Consumption[]): string[] {
  const labels = new Set<string>()
  for (const e of entrants) {
    const label = e.person_type?.trim()
    if (label && !PADRON_TYPES.has(label.toUpperCase())) labels.add(label)
  }
  return [...labels].sort((a, b) => a.localeCompare(b, 'es'))
}

/**
 * ¿Esta fila cae dentro del filtro elegido? El filtro vale para un rol del padrón o para
 * el nombre de una etiqueta.
 *
 * Comparar solo contra `user_type` —como se hacía— hacía desaparecer de la tabla a toda
 * la gente externa en cuanto se elegía cualquier rol: no había ningún valor del filtro
 * capaz de mostrarla. El servidor ya impide que una etiqueta se llame como un `UserType`,
 * así que la comparación no necesita desambiguar.
 */
export function matchesTypeFilter(e: Consumption, filter: string): boolean {
  if (filter === 'ALL') return true
  if (PADRON_TYPES.has(filter)) return (e.user_type ?? '').toUpperCase() === filter
  return (e.person_type ?? '').trim() === filter
}
