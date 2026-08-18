/** Los cuatro tipos del padrón universitario: un enumerado del servidor. */
export type PadronPersonType = 'STUDENT' | 'TEACHER' | 'ADMINISTRATIVE' | 'WORKER'

/**
 * Tipo de persona admitido por el filtro de asistencia: uno de los cuatro del padrón o
 * el **nombre de una etiqueta de gente externa**.
 *
 * Era una unión cerrada de seis literales con `JUBILADO` y `EXTERNO` escritos aquí. Desde
 * que las etiquetas las crea quien administra el comedor, el servidor admite los cuatro
 * `UserType` más cualquier nombre del catálogo, así que un tipo cerrado en el cliente solo
 * puede quedarse corto: la etiqueta de la jornada de ayer no se podría enviar.
 */
export type PersonType = PadronPersonType | (string & {})
export type Gender = 'M' | 'F'

/**
 * Solo los cuatro del padrón. Las etiquetas de gente externa se piden al catálogo
 * (`usePersonTypeOptions`): un mapa de rótulos en el cliente no puede seguir el ritmo de
 * unas etiquetas que se inventan al registrar a la gente.
 */
export const PERSON_TYPE_OPTIONS: { value: PadronPersonType; label: string }[] = [
  { value: 'STUDENT', label: 'Estudiantes' },
  { value: 'TEACHER', label: 'Docentes' },
  { value: 'ADMINISTRATIVE', label: 'Administrativos' },
  { value: 'WORKER', label: 'Obreros' },
]

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
]

/** El selector de carrera solo aplica a estudiantes (spec: Selector de carrera condicional). */
export function personTypeAllowsCareer(personType: PersonType | null): boolean {
  return personType === null || personType === 'STUDENT'
}

export interface AttendanceQueryFilters {
  personType?: PersonType | null
  gender?: Gender | null
  career?: string | null
}

export interface AttendanceFilters extends AttendanceQueryFilters {
  startDate?: string
  endDate?: string
  lunchSessionId?: number
}

export interface StatBucket {
  key: string
  label: string
  value: number
}

export interface GenderStatBucket extends StatBucket {
  percentage: number
}

export interface DateStatBucket {
  date: string
  value: number
}

export type LunchSessionStatus = 'OPEN' | 'CLOSED'

export interface LunchSessionSummary {
  id: number
  date: string
  status: LunchSessionStatus
  sedeId: number | null
  menuName: string | null
  plannedCount: number | null
  servedCount: number
  remainingCount: number | null
  surplusCount: number | null
  servedPercentage: number | null
}

export interface AttendanceStatsResponse {
  filters: AttendanceFilters
  summary: { total: number }
  byPersonType: StatBucket[]
  byGender: GenderStatBucket[]
  byCareer: StatBucket[]
  byDate?: DateStatBucket[]
  lunchSession?: LunchSessionSummary
}
