export type PersonType = 'STUDENT' | 'TEACHER' | 'ADMINISTRATIVE' | 'WORKER' | 'JUBILADO' | 'EXTERNO'
export type Gender = 'M' | 'F'

export const PERSON_TYPE_OPTIONS: { value: PersonType; label: string }[] = [
  { value: 'STUDENT', label: 'Estudiantes' },
  { value: 'TEACHER', label: 'Docentes' },
  { value: 'ADMINISTRATIVE', label: 'Administrativos' },
  { value: 'WORKER', label: 'Obreros' },
  { value: 'JUBILADO', label: 'Jubilados' },
  { value: 'EXTERNO', label: 'Externos' },
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
