import type { Consumption } from '../types/consumption'
import { USER_TYPE_LABEL } from './labels'

/** Un segmento de una gráfica: etiqueta legible + conteo. */
export interface StatBucket {
  label: string
  count: number
}

/** Normaliza texto para comparar: sin acentos, sin espacios sobrantes, minúsculas. */
function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

/**
 * Conteo por género (issue #3). Los valores almacenados son texto libre (p. ej.
 * "M"/"F", "Masculino"/"Femenino"); se normalizan a Hombres/Mujeres y el resto a
 * "No especificado" (solo si aparece).
 */
export function genderStats(entrants: Consumption[]): StatBucket[] {
  let male = 0
  let female = 0
  let other = 0
  for (const e of entrants) {
    const g = normalize(e.gender)
    if (g === 'm' || g === 'masculino' || g === 'hombre') male++
    else if (g === 'f' || g === 'femenino' || g === 'mujer') female++
    else other++
  }
  const buckets: StatBucket[] = [
    { label: 'Hombres', count: male },
    { label: 'Mujeres', count: female },
  ]
  if (other > 0) buckets.push({ label: 'No especificado', count: other })
  return buckets
}

/** Set fijo de carreras pedido en el issue #3 (clave normalizada + etiqueta). */
const CAREER_SET: { key: string; label: string }[] = [
  { key: 'informatica', label: 'Informática' },
  { key: 'civil', label: 'Civil' },
  { key: 'mecanica', label: 'Mecánica' },
  { key: 'psicologia', label: 'Psicología' },
  { key: 'electronica', label: 'Electrónica' },
  { key: 'arquitectura', label: 'Arquitectura' },
  { key: 'musica', label: 'Música' },
  { key: 'produccion animal', label: 'Producción Animal' },
]

/**
 * Conteo por carrera (issue #3) considerando **solo estudiantes**. La carrera es
 * texto libre, así que se normaliza y se intenta casar por inclusión contra el set
 * fijo; lo que no casa (o carrera vacía) se agrupa en "Otras" (solo si aparece).
 */
export function careerStats(entrants: Consumption[]): StatBucket[] {
  const counts = new Map<string, number>(CAREER_SET.map((c) => [c.key, 0]))
  let otras = 0
  for (const e of entrants) {
    if (normalize(e.user_type) !== 'student') continue
    const career = normalize(e.career)
    const match = career ? CAREER_SET.find((c) => career.includes(c.key)) : undefined
    if (match) counts.set(match.key, (counts.get(match.key) ?? 0) + 1)
    else otras++
  }
  const buckets = CAREER_SET.map((c) => ({ label: c.label, count: counts.get(c.key) ?? 0 }))
  if (otras > 0) buckets.push({ label: 'Otras', count: otras })
  return buckets
}

const ROLE_ORDER = ['STUDENT', 'TEACHER', 'ADMINISTRATIVE', 'WORKER'] as const

/**
 * Conteo por rol (issue #3). Los 4 roles pedidos usan las etiquetas de `labels.ts`;
 * las personas sin rol (externos/jubilados, `user_type` nulo) se agrupan como
 * "Externo" (solo si aparecen), según la decisión de producto.
 */
export function roleStats(entrants: Consumption[]): StatBucket[] {
  const counts: Record<string, number> = { STUDENT: 0, TEACHER: 0, ADMINISTRATIVE: 0, WORKER: 0 }
  let externo = 0
  for (const e of entrants) {
    const ut = (e.user_type ?? '').toUpperCase()
    if (ut in counts) counts[ut]++
    else externo++
  }
  const buckets: StatBucket[] = ROLE_ORDER.map((r) => ({ label: USER_TYPE_LABEL[r], count: counts[r] }))
  if (externo > 0) buckets.push({ label: 'Externo', count: externo })
  return buckets
}
