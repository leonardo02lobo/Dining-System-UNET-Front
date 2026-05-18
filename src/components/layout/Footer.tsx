export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t-[3px] border-amber-500 bg-slate-950 px-4 py-3 text-white md:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 text-center">
        <span className="text-xs text-white/55">
          © {year} Universidad Nacional Experimental del Táchira
        </span>
        <span className="text-xs text-white/25" aria-hidden>
          ·
        </span>
        <span className="text-xs text-white/55">
          Secretaría — Sistema de Comedor Universitario
        </span>
      </div>
    </footer>
  )
}
