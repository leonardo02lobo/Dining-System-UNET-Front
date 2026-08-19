import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { MEAL_TYPE_LABEL, type LunchResponse } from '../../types/lunch'

export type PlannerRange = 'day' | 'week' | 'month'

export const RANGE_LABEL: Record<PlannerRange, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
}

interface LunchDatePlannerProps {
  date: string
  range: PlannerRange
  lunches: LunchResponse[]
  loading: boolean
  error: string
  editingLunchId: number | null
  onDateChange: (value: string) => void
  onRangeChange: (value: PlannerRange) => void
  onOpenDraft: (lunch: LunchResponse) => void
  onDeleteDraft: (lunch: LunchResponse) => void
  onCreateNew: () => void
}

/** Fecha ISO desplazada N días, sin pasar por Date UTC (que corre un día). */
function shiftIso(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  const shifted = new Date(year, month - 1, day + days)
  return [
    shifted.getFullYear(),
    String(shifted.getMonth() + 1).padStart(2, '0'),
    String(shifted.getDate()).padStart(2, '0'),
  ].join('-')
}

export function todayIso(): string {
  return shiftIso(new Date().toISOString().split('T')[0], 0)
}

/** Rango visible [desde, hasta] en ISO, según el modo elegido. */
export function rangeBounds(date: string, range: PlannerRange): [string, string] {
  if (range === 'day') return [date, date]
  const [year, month, day] = date.split('-').map(Number)
  if (range === 'week') {
    // Semana de lunes a domingo: getDay() da 0 para domingo.
    const weekday = new Date(year, month - 1, day).getDay()
    const backToMonday = weekday === 0 ? 6 : weekday - 1
    const monday = shiftIso(date, -backToMonday)
    return [monday, shiftIso(monday, 6)]
  }
  const first = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  return [first, `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`]
}

function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * FE-01 / FE-05 — la fecha es el primer paso, y lo planificado para ella se ve
 * antes de escribir nada. Los confirmados aparecen sin acciones de edición: no
 * se ocultan (son parte del plan del día) pero ya no son modificables.
 */
export function LunchDatePlanner({
  date,
  range,
  lunches,
  loading,
  error,
  editingLunchId,
  onDateChange,
  onRangeChange,
  onOpenDraft,
  onDeleteDraft,
  onCreateNew,
}: LunchDatePlannerProps) {
  const [from, to] = rangeBounds(date, range)
  const visible = lunches.filter((lunch) => lunch.date >= from && lunch.date <= to)
  const isPast = date < todayIso()

  const byDate = visible.reduce<Record<string, LunchResponse[]>>((groups, lunch) => {
    ;(groups[lunch.date] ??= []).push(lunch)
    return groups
  }, {})
  const dates = Object.keys(byDate).sort()

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="planner-date">
              Fecha del servicio
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Día anterior"
                onClick={() => onDateChange(shiftIso(date, -1))}
                className="flex h-11 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronLeft size={18} />
              </button>
              <input
                id="planner-date"
                type="date"
                value={date}
                min={todayIso()}
                onChange={(event) => onDateChange(event.target.value)}
                className="h-11 rounded-md border border-slate-300 px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                aria-label="Día siguiente"
                onClick={() => onDateChange(shiftIso(date, 1))}
                className="flex h-11 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-50"
              >
                <ChevronRight size={18} />
              </button>
              <Button variant="ghost" size="sm" onClick={() => onDateChange(todayIso())}>
                Hoy
              </Button>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Ver</span>
            <div className="flex overflow-hidden rounded-md border border-slate-300">
              {(Object.keys(RANGE_LABEL) as PlannerRange[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={range === option}
                  onClick={() => onRangeChange(option)}
                  className={`h-11 px-4 text-sm transition ${
                    range === option
                      ? 'bg-[#03216a] font-semibold text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {RANGE_LABEL[option]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button type="button" onClick={onCreateNew} leftIcon={<CalendarDays size={18} />}>
          Crear servicio para esta fecha
        </Button>
      </div>

      {isPast && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Esta fecha ya pasó. Puedes consultar lo planificado, pero no crear servicios nuevos
          para ella.
        </p>
      )}

      <div className="mt-4">
        <h2 className="text-sm font-semibold text-slate-900">
          {range === 'day'
            ? `Planificado para el ${formatLongDate(date)}`
            : `Planificado del ${formatLongDate(from)} al ${formatLongDate(to)}`}
        </h2>

        {error && (
          <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Cargando planificación...</p>
        ) : visible.length === 0 ? (
          <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
            No hay servicios planificados en este periodo.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {dates.map((groupDate) => (
              <div key={groupDate}>
                {range !== 'day' && (
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {formatLongDate(groupDate)}
                  </h3>
                )}
                <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
                  {byDate[groupDate].map((lunch) => {
                    const isDraft = lunch.status === 'DRAFT'
                    return (
                      <li
                        key={lunch.id}
                        className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                          lunch.id === editingLunchId ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-slate-900">
                              {lunch.name}
                            </span>
                            <Badge variant="info">{MEAL_TYPE_LABEL[lunch.mealType]}</Badge>
                            <Badge variant={isDraft ? 'warning' : 'success'}>
                              {isDraft ? 'Borrador' : 'Confirmado'}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-500">
                            {lunch.platesQuantity} platos · {lunch.ingredients.length} insumos
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isDraft ? (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<Pencil size={15} />}
                                onClick={() => onOpenDraft(lunch)}
                              >
                                Abrir
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                leftIcon={<Trash2 size={15} />}
                                onClick={() => onDeleteDraft(lunch)}
                              >
                                Eliminar
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Confirmado: ya descontó inventario y no puede editarse
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
