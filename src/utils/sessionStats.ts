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
export const CAREER_SET: { key: string; label: string }[] = [
  { key: 'informatica', label: 'Informática' },
  { key: 'civil', label: 'Civil' },
  { key: 'mecanica', label: 'Mecánica' },
  { key: 'psicologia', label: 'Psicología' },
  { key: 'electronica', label: 'Electrónica' },
  { key: 'arquitectura', label: 'Arquitectura' },
  { key: 'musica', label: 'Música' },
  { key: 'produccion animal', label: 'Producción Animal' },
]

/** Clave especial para carreras que no casan con el set fijo (o vienen vacías). */
export const CAREER_OTHER_KEY = 'otras'

/**
 * Clave de carrera normalizada de una persona (misma lógica que `careerStats`): se
 * normaliza el texto libre y se casa por inclusión contra el set fijo; si no casa
 * (o viene vacía) devuelve `CAREER_OTHER_KEY`. Sirve para filtrar por carrera de
 * forma coherente con la gráfica.
 */
export function careerKeyOf(career: string | null | undefined): string {
  const c = normalize(career)
  const match = c ? CAREER_SET.find((x) => c.includes(x.key)) : undefined
  return match ? match.key : CAREER_OTHER_KEY
}

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
    const key = careerKeyOf(e.career)
    if (key === CAREER_OTHER_KEY) otras++
    else counts.set(key, (counts.get(key) ?? 0) + 1)
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
