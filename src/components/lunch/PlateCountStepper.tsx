import { Minus, Plus } from 'lucide-react'

interface PlateCountStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  step?: number
}

export function PlateCountStepper({
  value,
  onChange,
  min = 1,
  step = 10,
}: PlateCountStepperProps) {
  function decrease() {
    onChange(Math.max(min, value - step))
  }

  function increase() {
    onChange(value + step)
  }

  return (
    <div className="flex h-[38px] w-full max-w-[190px] overflow-hidden rounded-[5px] border border-black bg-white/90">
      <button
        type="button"
        onClick={decrease}
        className="flex w-10 flex-shrink-0 items-center justify-center border-r border-black text-slate-800 transition hover:bg-slate-100"
        aria-label="Disminuir platos"
      >
        <Minus size={18} />
      </button>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
        className="min-w-0 flex-1 border-0 bg-transparent px-2 text-center text-[15px] text-black outline-none"
      />
      <button
        type="button"
        onClick={increase}
        className="flex w-10 flex-shrink-0 items-center justify-center border-l border-black text-slate-800 transition hover:bg-slate-100"
        aria-label="Aumentar platos"
      >
        <Plus size={18} />
      </button>
    </div>
  )
}
