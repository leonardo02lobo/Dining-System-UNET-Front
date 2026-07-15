/**
 * Agregaciones para el modal de gráficas del historial de sesiones (#3).
 *
 * Todo se calcula en el frontend sobre los entrantes ya cargados (`Consumption[]`),
 * evitando llamadas adicionales al backend. Los valores de `gender`, `career` y
 * `user_type` se normalizan (acentos y mayúsculas) para tolerar variaciones de la BD.
 */
import type { Consumption } from '../types/consumption'

export interface ChartCount {
  labels: string[]
  data: number[]
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Minúsculas, sin acentos ni espacios sobrantes. */
function norm(value: string | null | undefined): string {
  return stripAccents(value ?? '').toLowerCase().trim()
}

/** Conteo por género (hombre/mujer/no especificado). */
export function genderStats(entrants: Consumption[]): ChartCount {
  let male = 0
  let female = 0
  let other = 0
  for (const e of entrants) {
    const g = norm(e.gender)
    if (['m', 'masculino', 'hombre', 'male'].includes(g)) male++
    else if (['f', 'femenino', 'mujer', 'female'].includes(g)) female++
    else other++
  }
  const labels = ['Hombres', 'Mujeres']
  const data = [male, female]
  if (other > 0) {
    labels.push('No especificado')
    data.push(other)
  }
  return { labels, data }
}

/** Carreras contempladas por el requisito (#3), en orden fijo, más "Otras". */
const CAREER_SET: Array<{ label: string; match: string[] }> = [
  { label: 'Informática',       match: ['informatica'] },
  { label: 'Civil',             match: ['civil'] },
  { label: 'Mecánica',          match: ['mecanica'] },
  { label: 'Psicología',        match: ['psicologia'] },
  { label: 'Electrónica',       match: ['electronica'] },
  { label: 'Arquitectura',      match: ['arquitectura'] },
  { label: 'Música',            match: ['musica'] },
  { label: 'Producción Animal', match: ['produccion animal', 'produccion pecuaria', 'produccion'] },
]

/** Conteo por carrera, SOLO estudiantes; fuera del set fijo → "Otras". */
export function careerStats(entrants: Consumption[]): ChartCount {
  const counts = new Map<string, number>(CAREER_SET.map((c) => [c.label, 0]))
  let otras = 0
  for (const e of entrants) {
    if (norm(e.user_type) !== 'student') continue
    const career = norm(e.career)
    const found = career
      ? CAREER_SET.find((c) => c.match.some((m) => career.includes(m)))
      : undefined
    if (found) counts.set(found.label, (counts.get(found.label) ?? 0) + 1)
    else otras++
  }
  const labels = CAREER_SET.map((c) => c.label)
  const data = labels.map((l) => counts.get(l) ?? 0)
  labels.push('Otras')
  data.push(otras)
  return { labels, data }
}

const ROLE_ORDER: Array<{ key: string; label: string }> = [
  { key: 'student',        label: 'Estudiantes' },
  { key: 'teacher',        label: 'Docentes' },
  { key: 'administrative', label: 'Administrativos' },
  { key: 'worker',         label: 'Obreros' },
]

/** Conteo por rol (los 4 tipos); tipos ajenos (externos) van a "Externos". */
export function roleStats(entrants: Consumption[]): ChartCount {
  const counts: Record<string, number> = { student: 0, teacher: 0, administrative: 0, worker: 0 }
  let externos = 0
  for (const e of entrants) {
    const t = norm(e.user_type)
    if (t in counts) counts[t] += 1
    else externos += 1
  }
  const labels = ROLE_ORDER.map((r) => r.label)
  const data = ROLE_ORDER.map((r) => counts[r.key])
  if (externos > 0) {
    labels.push('Externos')
    data.push(externos)
  }
  return { labels, data }
}
