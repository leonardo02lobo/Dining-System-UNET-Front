import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { careerApi } from '../../api/career'
import { statisticsApi } from '../../api/statistics'
import { ActiveFilterChips, type FilterChip } from '../statistics/ActiveFilterChips'
import { AttendanceByCareerChart } from '../statistics/AttendanceByCareerChart'
import { AttendanceByDateChart } from '../statistics/AttendanceByDateChart'
import { AttendanceByGenderChart } from '../statistics/AttendanceByGenderChart'
import { AttendanceByPersonTypeChart } from '../statistics/AttendanceByPersonTypeChart'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { DateInput } from '../ui/DateInput'
import { Select } from '../ui/Select'
import { Spinner } from '../ui/Spinner'
import type { Career } from '../../types/career'
import {
  GENDER_OPTIONS,
  PERSON_TYPE_OPTIONS,
  personTypeAllowsCareer,
  type AttendanceStatsResponse,
  type Gender,
  type PersonType,
} from '../../types/statistics'
import { notify } from '../../utils/toast'

function toIsoDate(daysAgo = 0) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

const DEFAULT_FROM = toIsoDate(30)
const DEFAULT_TO = toIsoDate(0)

const PERSON_TYPE_SELECT_OPTIONS = [{ value: '', label: 'Todos' }, ...PERSON_TYPE_OPTIONS]
const GENDER_SELECT_OPTIONS = [{ value: '', label: 'Todos' }, ...GENDER_OPTIONS]

/** Qué gráficas mostrar según tipo de persona/carrera filtrados (ver design.md). */
type ChartPlan = 'byPersonType' | 'byCareerAndDate' | 'byDateOnly'

function pickChartPlan(personType: PersonType | '', career: string): ChartPlan {
  if (personType === '') return 'byPersonType'
  if (personType === 'STUDENT') return career ? 'byDateOnly' : 'byCareerAndDate'
  return 'byDateOnly'
}

/** Estadísticas de asistencia por rango de fechas, pestaña "Por Período" de Reporte de Comedor. */
export function PeriodAttendancePanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || DEFAULT_FROM)
  const [dateTo, setDateTo] = useState(searchParams.get('to') || DEFAULT_TO)
  const [personType, setPersonType] = useState<PersonType | ''>(
    (searchParams.get('personType') as PersonType) || '',
  )
  const [gender, setGender] = useState<Gender | ''>((searchParams.get('gender') as Gender) || '')
  const [career, setCareer] = useState(searchParams.get('career') || '')
  const [careers, setCareers] = useState<Career[]>([])

  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [result, setResult] = useState<AttendanceStatsResponse | null>(null)
  const [hasQueried, setHasQueried] = useState(false)

  const showCareerFilter = personTypeAllowsCareer(personType || null)

  useEffect(() => {
    void (async () => {
      try {
        setCareers(await careerApi.list())
      } catch (err) {
        notify.error(err)
      }
    })()
  }, [])

  // Refleja los filtros en la URL (compartible), sin apilar historial ni disparar la consulta.
  useEffect(() => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    if (personType) params.set('personType', personType)
    if (gender) params.set('gender', gender)
    if (career) params.set('career', career)
    setSearchParams(params, { replace: true })
  }, [dateFrom, dateTo, personType, gender, career, setSearchParams])

  function handlePersonTypeChange(value: string) {
    setPersonType(value as PersonType | '')
    if (value !== '' && value !== 'STUDENT') setCareer('')
  }

  async function handleConsultar() {
    if (!dateFrom || !dateTo) {
      setValidationError('Debe seleccionar una fecha inicial y una fecha final.')
      return
    }
    if (dateFrom > dateTo) {
      setValidationError('La fecha inicial no puede ser posterior a la fecha final.')
      return
    }

    setValidationError('')
    setLoading(true)
    try {
      const data = await statisticsApi.byPeriod(dateFrom, dateTo, {
        personType: personType || null,
        gender: gender || null,
        career: showCareerFilter && career ? career : null,
      })
      setResult(data)
      setHasQueried(true)
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleLimpiar() {
    setDateFrom(DEFAULT_FROM)
    setDateTo(DEFAULT_TO)
    setPersonType('')
    setGender('')
    setCareer('')
    setResult(null)
    setHasQueried(false)
    setValidationError('')
  }

  const rows = result?.byPersonType ?? []
  const totalAttended = result?.summary.total ?? 0
  const hasResults = hasQueried && totalAttended > 0
  const chartPlan = pickChartPlan(personType, career)

  const personTypeLabel = PERSON_TYPE_OPTIONS.find((o) => o.value === personType)?.label
  const genderLabel = GENDER_OPTIONS.find((o) => o.value === gender)?.label
  const chips: FilterChip[] = [
    { label: `Período: ${formatDisplayDate(dateFrom)} - ${formatDisplayDate(dateTo)}` },
    ...(personTypeLabel ? [{ label: `Tipo: ${personTypeLabel}`, onRemove: () => handlePersonTypeChange('') }] : []),
    ...(genderLabel ? [{ label: `Género: ${genderLabel}`, onRemove: () => setGender('') }] : []),
    ...(showCareerFilter && career ? [{ label: `Carrera: ${career}`, onRemove: () => setCareer('') }] : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card variant="outlined" padding="md">
        <div className="flex flex-wrap items-end gap-4">
          <DateInput label="Desde" value={dateFrom} onChange={setDateFrom} maxDate={dateTo || undefined} className="w-full sm:w-48" />
          <DateInput label="Hasta" value={dateTo} onChange={setDateTo} minDate={dateFrom || undefined} className="w-full sm:w-48" />
          <Select
            label="Tipo de persona"
            options={PERSON_TYPE_SELECT_OPTIONS}
            value={personType}
            onChange={(e) => handlePersonTypeChange(e.target.value)}
            className="w-full sm:w-52"
          />
          <Select
            label="Género"
            options={GENDER_SELECT_OPTIONS}
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender | '')}
            className="w-full sm:w-40"
          />
          {showCareerFilter && (
            <Select
              label="Carrera"
              options={[{ value: '', label: 'Todas' }, ...careers.map((c) => ({ value: c.name, label: c.name }))]}
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              className="w-full sm:w-56"
            />
          )}
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Search size={16} />}
              loading={loading}
              onClick={handleConsultar}
              className="h-11"
            >
              Consultar
            </Button>
            <Button variant="ghost" size="md" onClick={handleLimpiar} className="h-11">
              Limpiar
            </Button>
          </div>
        </div>
        {validationError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {validationError}
          </p>
        )}
        <div className="mt-4">
          <ActiveFilterChips chips={chips} />
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && hasQueried && totalAttended === 0 && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600">
          No se encontraron registros para el período y los filtros seleccionados.
        </div>
      )}

      {!loading && hasResults && result && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card variant="outlined" padding="md">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total atendidos</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 sm:text-3xl">{totalAttended}</p>
            </Card>
            {rows.map((row) => (
              <Card key={row.key} variant="outlined" padding="md">
                <p className="text-xs uppercase tracking-wide text-slate-500">{row.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">{row.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {chartPlan === 'byPersonType' && <AttendanceByPersonTypeChart data={result.byPersonType} />}
            {chartPlan === 'byCareerAndDate' && (
              <>
                <AttendanceByCareerChart data={result.byCareer} />
                <AttendanceByDateChart data={result.byDate ?? []} />
              </>
            )}
            {chartPlan === 'byDateOnly' && <AttendanceByDateChart data={result.byDate ?? []} />}
            <AttendanceByGenderChart data={result.byGender} />
          </div>
        </>
      )}
    </div>
  )
}
