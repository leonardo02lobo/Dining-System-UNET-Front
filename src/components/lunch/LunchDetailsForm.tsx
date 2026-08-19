import { Calendar } from 'lucide-react'
import { PlateCountStepper } from './PlateCountStepper'
import { MEAL_TYPES, MEAL_TYPE_LABEL, type MealType } from '../../types/lunch'

interface LunchDetailsFormProps {
  lunchName: string
  date: string
  mealType: MealType
  plateCount: number
  desiredPlateCount: number
  minDate?: string
  onLunchNameChange: (value: string) => void
  onDateChange: (value: string) => void
  onMealTypeChange: (value: MealType) => void
  onPlateCountChange: (value: number) => void
  onDesiredPlateCountChange: (value: number) => void
}

const fieldLabel = 'mb-1 block text-[15px] text-black/60'

export function LunchDetailsForm({
  lunchName,
  date,
  mealType,
  plateCount,
  desiredPlateCount,
  minDate,
  onLunchNameChange,
  onDateChange,
  onMealTypeChange,
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
            min={minDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-[38px] w-full rounded-[5px] border border-black bg-white/90 px-3 pr-10 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#03216a]/20"
          />
          <Calendar
            size={20}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
          />
        </div>
      </div>

      {/* Una fecha admite varios servicios (desayuno, almuerzo, cena): el tipo es
          lo que los distingue entre sí en el plan del día. */}
      <div>
        <label className={fieldLabel} htmlFor="lunch-meal-type">
          Tipo de servicio
        </label>
        <select
          id="lunch-meal-type"
          value={mealType}
          onChange={(e) => onMealTypeChange(e.target.value as MealType)}
          className="h-[38px] w-full rounded-[5px] border border-black bg-white/90 px-3 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#03216a]/20"
        >
          {MEAL_TYPES.map((option) => (
            <option key={option} value={option}>
              {MEAL_TYPE_LABEL[option]}
            </option>
          ))}
        </select>
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
