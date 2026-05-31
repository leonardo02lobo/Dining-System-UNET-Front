export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="flex-shrink-0 border-t border-slate-200 bg-white px-6 py-2">
      <div className="flex flex-wrap items-center justify-center gap-2 text-center">
        <span className="text-xs text-slate-400">
          © {year} Universidad Nacional Experimental del Táchira
        </span>
        <span className="text-xs text-slate-300" aria-hidden>·</span>
        <span className="text-xs text-slate-400">
          Decanato de desarrollo Estudiantil — Sistema de Comedor Universitario
        </span>
      </div>
    </footer>
  )
}
