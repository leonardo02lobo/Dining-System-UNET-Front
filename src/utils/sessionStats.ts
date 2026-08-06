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

/** Una carrera del catálogo, lista para filtrar y graficar. */
export interface CareerOption {
  /** Nombre normalizado: es la clave con la que se agrupan los entrantes. */
  key: string
  label: string
}

/** Clave especial para carreras que no casan con el catálogo (o vienen vacías). */
export const CAREER_OTHER_KEY = 'otras'

/**
 * Construye el set de carreras de las gráficas a partir del catálogo del backend
 * (`GET /careers/`), que se alimenta del padrón oficial. Sustituye a la constante
 * hardcodeada de 8 carreras que dejaba fuera a la mitad del padrón.
 */
export function careerOptionsFrom(careers: { name: string }[]): CareerOption[] {
  return careers
    .map((c) => ({ key: normalize(c.name), label: c.name }))
    .filter((c) => c.key !== '')
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
}

/**
 * Clave de carrera normalizada de una persona. Casa primero de forma exacta con el
 * catálogo (el caso normal: el padrón guarda el nombre canónico) y, si falla, por
 * inclusión en cualquier sentido, para tolerar registros antiguos escritos a mano.
 * Si no casa (o viene vacía) devuelve `CAREER_OTHER_KEY`.
 */
export function careerKeyOf(career: string | null | undefined, options: CareerOption[]): string {
  const c = normalize(career)
  if (!c) return CAREER_OTHER_KEY
  const exact = options.find((x) => x.key === c)
  if (exact) return exact.key
  const partial = options.find((x) => c.includes(x.key) || x.key.includes(c))
  return partial ? partial.key : CAREER_OTHER_KEY
}

/**
 * Conteo por carrera considerando **solo estudiantes**. Agrupa contra el catálogo
 * recibido; lo que no casa (o carrera vacía) se agrupa en "Otras" (solo si aparece).
 * Las carreras sin ningún entrante no se listan, para no llenar la gráfica de ceros.
 */
export function careerStats(entrants: Consumption[], options: CareerOption[]): StatBucket[] {
  const counts = new Map<string, number>(options.map((c) => [c.key, 0]))
  let otras = 0
  for (const e of entrants) {
    if (normalize(e.user_type) !== 'student') continue
    const key = careerKeyOf(e.career, options)
    if (key === CAREER_OTHER_KEY) otras++
    else counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const buckets = options
    .map((c) => ({ label: c.label, count: counts.get(c.key) ?? 0 }))
    .filter((b) => b.count > 0)
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
