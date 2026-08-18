import { useEffect, useState } from 'react'
import { careerApi } from '../../api/career'
import { lunchSessionApi } from '../../api/lunchSession'
import { statisticsApi } from '../../api/statistics'
import { ActiveFilterChips, type FilterChip } from '../statistics/ActiveFilterChips'
import { AttendanceByCareerChart } from '../statistics/AttendanceByCareerChart'
import { AttendanceByGenderChart } from '../statistics/AttendanceByGenderChart'
import { AttendanceByPersonTypeChart } from '../statistics/AttendanceByPersonTypeChart'
import { AttendanceServedVsPlannedChart } from '../statistics/AttendanceServedVsPlannedChart'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { DateInput } from '../ui/DateInput'
import { Select } from '../ui/Select'
import { Spinner } from '../ui/Spinner'
import type { Career } from '../../types/career'
import type { LunchSession } from '../../types/lunchSession'
import {
  GENDER_OPTIONS,
  personTypeAllowsCareer,
  type AttendanceStatsResponse,
  type Gender,
  type PersonType,
} from '../../types/statistics'
import { usePersonTypeOptions } from '../../hooks/usePersonTypeOptions'
import { notify } from '../../utils/toast'

// Las opciones se componen en el render: los cuatro del padrón vienen de la constante y
// las etiquetas de gente externa del catálogo del servidor (`usePersonTypeOptions`).
const GENDER_SELECT_OPTIONS = [{ value: '', label: 'Todos' }, ...GENDER_OPTIONS]

function toIsoDate() {
  return new Date().toISOString().split('T')[0]
}

function sessionLabel(session: LunchSession): string {
  const time = session.opened_at
    ? new Date(session.opened_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
    : 'sin hora de apertura'
  const sede = session.sede?.name ?? 'Sin sede'
  const statusLabel = session.status === 'OPEN' ? 'Abierto' : 'Cerrado'
  return `#${session.id} — ${sede} — ${time} — ${statusLabel}`
}

/** Estadísticas de asistencia por turno de servicio, pestaña "Por Almuerzo" de Reporte de Comedor. */
export function LunchSessionAttendancePanel() {
  const [lunchDate, setLunchDate] = useState(toIsoDate())
  const [sessions, setSessions] = useState<LunchSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)

  const [personType, setPersonType] = useState<PersonType | ''>('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [career, setCareer] = useState('')
  const [careers, setCareers] = useState<Career[]>([])

  const [result, setResult] = useState<AttendanceStatsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Los cuatro del padrón más las etiquetas de gente externa del catálogo.
  const personTypeOptions = usePersonTypeOptions()
  const personTypeSelectOptions = [{ value: '', label: 'Todos' }, ...personTypeOptions]

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

  useEffect(() => {
    setSelectedSessionId(null)
    setResult(null)
    if (!lunchDate) {
      setSessions([])
      return
    }

    let mounted = true
    setSessionsLoading(true)
    void (async () => {
      try {
        const data = await lunchSessionApi.listByRange({ from_date: lunchDate, to_date: lunchDate })
        if (mounted) setSessions(data.items)
      } catch (err) {
        if (mounted) notify.error(err)
      } finally {
        if (mounted) setSessionsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [lunchDate])

  useEffect(() => {
    if (selectedSessionId === null) return

    let mounted = true
    setStatsLoading(true)
    void (async () => {
      try {
        const data = await statisticsApi.byLunchSession(selectedSessionId, {
          personType: personType || null,
          gender: gender || null,
          career: showCareerFilter && career ? career : null,
        })
        if (mounted) setResult(data)
      } catch (err) {
        if (mounted) notify.error(err)
      } finally {
        if (mounted) setStatsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [selectedSessionId, personType, gender, career, showCareerFilter])

  function handlePersonTypeChange(value: string) {
    setPersonType(value as PersonType | '')
    if (value !== '' && value !== 'STUDENT') setCareer('')
  }

  /** "Limpiar filtros": conserva fecha y turno seleccionados. */
  function handleLimpiarFiltros() {
    setPersonType('')
    setGender('')
    setCareer('')
  }

  /** "Reiniciar consulta": limpia todo, incluida la fecha y el turno seleccionado. */
  function handleReiniciar() {
    setLunchDate(toIsoDate())
    setSessions([])
    setSelectedSessionId(null)
    setPersonType('')
    setGender('')
    setCareer('')
    setResult(null)
  }

  const summary = result?.lunchSession
  const totalAttended = result?.summary.total ?? 0

  const personTypeLabel = personTypeOptions.find((o) => o.value === personType)?.label
  const genderLabel = GENDER_OPTIONS.find((o) => o.value === gender)?.label
  const chips: FilterChip[] = [
    ...(personTypeLabel ? [{ label: `Tipo: ${personTypeLabel}`, onRemove: () => handlePersonTypeChange('') }] : []),
    ...(genderLabel ? [{ label: `Género: ${genderLabel}`, onRemove: () => setGender('') }] : []),
    ...(showCareerFilter && career ? [{ label: `Carrera: ${career}`, onRemove: () => setCareer('') }] : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card variant="outlined" padding="md">
        <div className="flex flex-wrap items-end gap-4">
          <DateInput
            label="Fecha del almuerzo"
            value={lunchDate}
            onChange={setLunchDate}
            className="w-full sm:w-48"
          />
          <Select
            label="Almuerzo"
            options={
              sessions.length > 0
                ? sessions.map((s) => ({ value: String(s.id), label: sessionLabel(s) }))
                : []
            }
            placeholder={sessionsLoading ? 'Cargando...' : 'Seleccione un almuerzo'}
            value={selectedSessionId !== null ? String(selectedSessionId) : ''}
            onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : null)}
            disabled={sessionsLoading || sessions.length === 0}
            className="w-full sm:w-72"
          />
          <Button variant="ghost" size="md" onClick={handleReiniciar} className="h-11">
            Reiniciar consulta
          </Button>
        </div>

        {!lunchDate && (
          <p className="mt-3 text-sm text-slate-500">
            Seleccione una fecha para consultar los almuerzos disponibles.
          </p>
        )}
        {lunchDate && !sessionsLoading && sessions.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">
            No existen almuerzos registrados para la fecha seleccionada.
          </p>
        )}
      </Card>

      {selectedSessionId === null && lunchDate && sessions.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600">
          Seleccione un almuerzo para visualizar sus estadísticas.
        </div>
      )}

      {statsLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!statsLoading && summary && (
        <>
          <Card variant="outlined" padding="md">
            <Card.Header
              title={summary.menuName ?? 'Menú no especificado'}
              subtitle={`Turno #${summary.id} — ${summary.status === 'OPEN' ? 'Abierto' : 'Cerrado'}`}
            />
            <Card.Body>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Planificados: {summary.plannedCount ?? 'N/D'}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Servidos: {summary.servedCount}
                </span>
                {summary.surplusCount ? (
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                    Excedente servido: {summary.surplusCount}
                  </span>
                ) : (
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    Restantes: {summary.remainingCount ?? 'N/D'}
                  </span>
                )}
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Cumplimiento: {summary.servedPercentage !== null ? `${summary.servedPercentage}%` : 'No disponible'}
                </span>
              </div>
            </Card.Body>
          </Card>

          <Card variant="outlined" padding="md">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-4">
                <Select
                  label="Tipo de persona"
                  options={personTypeSelectOptions}
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
              </div>
              <Button variant="ghost" size="sm" onClick={handleLimpiarFiltros}>
                Limpiar filtros
              </Button>
            </div>
            <div className="mt-4">
              <ActiveFilterChips chips={chips} />
            </div>
          </Card>

          <AttendanceServedVsPlannedChart plannedCount={summary.plannedCount} servedCount={summary.servedCount} />

          {totalAttended === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600">
              Este almuerzo no posee registros de personas atendidas.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {personType === 'STUDENT' ? (
                <AttendanceByCareerChart data={result!.byCareer} />
              ) : (
                <AttendanceByPersonTypeChart data={result!.byPersonType} />
              )}
              <AttendanceByGenderChart data={result!.byGender} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
