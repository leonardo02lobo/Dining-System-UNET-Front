import { Calendar } from 'lucide-react'
import { PlateCountStepper } from './PlateCountStepper'

interface LunchDetailsFormProps {
  lunchName: string
  date: string
  plateCount: number
  desiredPlateCount: number
  onLunchNameChange: (value: string) => void
  onDateChange: (value: string) => void
  onPlateCountChange: (value: number) => void
  onDesiredPlateCountChange: (value: number) => void
}

const fieldLabel = 'mb-1 block text-[15px] text-black/60'

export function LunchDetailsForm({
  lunchName,
  date,
  plateCount,
  desiredPlateCount,
  onLunchNameChange,
  onDateChange,
  onPlateCountChange,
  onDesiredPlateCountChange,
}: LunchDetailsFormProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      <div>
        <label className={fieldLabel} htmlFor="lunch-name">
          Nombre del servicio de alimentación
        </label>
        <input
          id="lunch-name"
          type="text"
          value={lunchName}
          onChange={(e) => onLunchNameChange(e.target.value)}
          className="h-[38px] w-full rounded-[5px] border border-black bg-white/90 px-3 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#03216a]/20"
        />
      </div>

      <div>
        <label className={fieldLabel} htmlFor="lunch-date">
          Fecha
        </label>
        <div className="relative">
          <input
            id="lunch-date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-[38px] w-full rounded-[5px] border border-black bg-white/90 px-3 pr-10 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#03216a]/20"
          />
          <Calendar
            size={20}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
          />
        </div>
      </div>

      {/* Los dos steppers de platos siempre juntos, uno al lado del otro */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className={fieldLabel} htmlFor="plate-count">
            Cantidad de platos
          </label>
          <PlateCountStepper value={plateCount} onChange={onPlateCountChange} />
        </div>

        <div>
          <label className={fieldLabel} htmlFor="desired-plate-count">
            Cantidad deseada
          </label>
          <PlateCountStepper value={desiredPlateCount} onChange={onDesiredPlateCountChange} />
        </div>
      </div>
    </div>
  )
}
