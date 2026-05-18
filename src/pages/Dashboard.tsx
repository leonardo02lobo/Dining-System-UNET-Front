export function Dashboard() {
  return (
    <div className="space-y-6">
      <span className="inline-flex rounded-full border border-sky-300/30 bg-sky-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-100">
        Dashboard
      </span>

      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Reportes
        </h1>
        <p className="text-base leading-7 text-slate-200 md:text-lg">
          Esta ruta puede pintar gráficas, métricas y resúmenes dentro del mismo
          section, usando el mismo contenedor del Index.
        </p>
      </div>
    </div>
  )
}