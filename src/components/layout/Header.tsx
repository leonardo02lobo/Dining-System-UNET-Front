import { UnetLogo } from '../ui/UnetLogo'

export function Header() {
  return (
    <header className="relative z-10 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 md:px-8">
        <div className="flex items-center gap-4">
          <UnetLogo />

          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold leading-tight tracking-[0.01em] text-white">
              Universidad Nacional Experimental del Táchira
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-white/85">
              Secretaría
            </span>
            <span className="text-[11px] tracking-[0.02em] text-white/65">
              Coordinación de Control y Evaluación Estudiantil
            </span>
          </div>
        </div>

        <div className="hidden flex-col items-end gap-0.5 md:flex">
          <span className="text-[11px] uppercase tracking-[0.08em] text-white/60">
            Sistema de
          </span>
          <span className="text-[13px] font-semibold tracking-[0.02em] text-amber-400">
            Comedor Universitario
          </span>
        </div>
      </div>
      <div className="h-[3px] bg-gradient-to-r from-amber-400 to-amber-600" />
    </header>
  )
}
