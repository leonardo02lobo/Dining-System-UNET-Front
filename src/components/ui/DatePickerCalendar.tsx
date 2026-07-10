import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface SessionMark {
  date: string   // YYYY-MM-DD
  status: 'OPEN' | 'CLOSED'
}

interface Props {
  /** Currently selected date as YYYY-MM-DD string. Pass '' for no selection. */
  value?: string
  onChange?: (date: string) => void
  minDate?: string
  maxDate?: string
  /** When true, no date can be selected — the calendar just displays session marks. */
  readOnly?: boolean
  /** Dots shown below day numbers to indicate session history. */
  sessionMarks?: SessionMark[]
  /** Label shown above the calendar (optional). */
  label?: string
  size?: 'md' | 'lg'
}

const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseIso(iso: string): { year: number; month: number; day: number } | null {
  if (!iso) return null
  const parts = iso.split('-')
  if (parts.length !== 3) return null
  return { year: Number(parts[0]), month: Number(parts[1]) - 1, day: Number(parts[2]) }
}

export function DatePickerCalendar({
  value = '',
  onChange,
  minDate,
  maxDate,
  readOnly = false,
  sessionMarks = [],
  label,
  size = 'md',
}: Props) {
  const today = new Date()
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate())

  const initial = parseIso(value) ?? { year: today.getFullYear(), month: today.getMonth(), day: 0 }
  const [viewYear,  setViewYear]  = useState(initial.year)
  const [viewMonth, setViewMonth] = useState(initial.month)

  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekDay  = new Date(viewYear, viewMonth, 1).getDay()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  function handleDayClick(day: number) {
    if (readOnly || !onChange) return
    const iso = toIso(viewYear, viewMonth, day)
    if (minDate && iso < minDate) return
    if (maxDate && iso > maxDate) return
    onChange(iso)
  }

  const markMap = new Map<string, 'OPEN' | 'CLOSED'>()
  for (const m of sessionMarks) markMap.set(m.date, m.status)

  const cells: (number | null)[] = [
    ...Array(firstWeekDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Pad to complete the last row
  while (cells.length % 7 !== 0) cells.push(null)

  const isLarge = size === 'lg'

  return (
    <div className={`${isLarge ? 'w-[min(390px,calc(100vw-1rem))] p-5' : 'w-[min(290px,calc(100vw-1rem))] p-4'} select-none rounded-xl border border-slate-200 bg-white shadow-sm`}>
      {label && (
        <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      )}

      {/* Month navigation */}
      <div className={`${isLarge ? 'mb-4' : 'mb-3'} flex items-center justify-between`}>
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={isLarge ? 22 : 18} />
        </button>

        <span className={`${isLarge ? 'text-base' : 'text-sm'} font-semibold text-slate-800`}>
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={isLarge ? 22 : 18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className={`${isLarge ? 'py-2 text-xs' : 'py-1 text-[11px]'} font-semibold uppercase tracking-wide text-slate-400`}>
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const iso = toIso(viewYear, viewMonth, day)
          const isSelected  = iso === value
          const isToday     = iso === todayIso
          const isDisabled  = (!readOnly) && ((!!minDate && iso < minDate) || (!!maxDate && iso > maxDate))
          const mark        = markMap.get(iso)

          return (
            <div
              key={iso}
              className="flex flex-col items-center py-0.5"
            >
              <button
                type="button"
                disabled={isDisabled || readOnly}
                onClick={() => handleDayClick(day)}
                className={[
                  `flex flex-col items-center justify-center rounded-full font-medium transition-colors ${isLarge ? 'h-11 w-11 text-base' : 'h-9 w-9 text-sm'}`,
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isToday
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : isDisabled
                    ? 'cursor-not-allowed text-slate-300'
                    : readOnly
                    ? 'cursor-default text-slate-700'
                    : 'cursor-pointer text-slate-700 hover:bg-slate-100',
                ].filter(Boolean).join(' ')}
              >
                {day}
              </button>

              {/* Session status dot */}
              {mark && (
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    mark === 'OPEN' ? 'bg-green-500' : 'bg-slate-400'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
