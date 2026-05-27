export function Header() {
  return (
    <header className="flex-shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo UNET + Nombre institución */}
        <div className="flex items-center gap-4">
          <img
            alt="UNET"
            className="h-14 w-14 object-contain"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold leading-tight text-slate-800">
              UNIVERSIDAD NACIONAL EXPERIMENTAL DEL TÁCHIRA
            </span>
            <span className="text-xs font-semibold text-slate-700">
              SECRETARÍA
            </span>
            <span className="text-[11px] text-slate-500">
              COORDINACIÓN DE CONTROL Y EVALUACIÓN ESTUDIANTIL
            </span>
          </div>
        </div>

        {/* Logo Decanato */}
        <div className="hidden flex-col items-end gap-1 md:flex">
          <img
            alt="Decanato de Orlando Student"
            className="h-14 w-14 object-contain"
          />
          <span className="text-[10px] text-slate-400">Decanato</span>
        </div>
      </div>
    </header>
  )
}
