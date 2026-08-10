## 1. Componentes de gráficas nuevos

- [x] 1.1 `src/components/statistics/AttendanceByDateChart.tsx`: gráfica de barras (eje X fecha,
      eje Y cantidad) a partir de `DateStatBucket[]` (`result.byDate`), mismo patrón `Card` +
      `BarChart` que los demás componentes de `src/components/statistics/`.
- [x] 1.2 `src/components/statistics/AttendanceServedVsPlannedChart.tsx`: gráfica de barras con 2
      barras ("Planificados", "Servidos") a partir de `LunchSessionSummary.plannedCount`/
      `servedCount`, con subtítulo indicando que no está filtrada por demografía.
- [x] 1.3 `src/components/statistics/ActiveFilterChips.tsx`: componente genérico que recibe
      `{ label: string; onRemove?: () => void }[]` y renderiza chips (con `×` solo si `onRemove`
      está presente).

## 2. Período — chips, limpiar, gráficas condicionales, URL

- [x] 2.1 `PeriodAttendancePanel.tsx`: agregado `ActiveFilterChips` bajo los filtros, con un chip
      informativo de rango de fechas (sin quitar) y chips removibles por tipo de persona/género/
      carrera activos.
- [x] 2.2 Agregado botón "Limpiar" junto a "Consultar": resetea fechas a los valores iniciales,
      filtros demográficos a "Todos", y `result`/`hasQueried` a su estado inicial.
- [x] 2.3 Reescrita la selección de gráficas como `pickChartPlan(personType, career)`
      (`byPersonType` | `byCareerAndDate` | `byDateOnly`), implementando la lógica condicional de
      la spec.
- [x] 2.4 Integrado `useSearchParams` de `react-router-dom`: filtros inicializados desde la URL al
      montar (`searchParams.get('from')`, etc.), sincronizados con `setSearchParams(params, {
      replace: true })` en cada cambio, sin disparar la consulta automáticamente.

## 3. Almuerzo — chips, limpieza en dos niveles, gráfica comparativa

- [x] 3.1 `LunchSessionAttendancePanel.tsx`: agregado `ActiveFilterChips` con los filtros
      demográficos activos del turno seleccionado.
- [x] 3.2 Agregado botón "Limpiar filtros": resetea `personType`/`gender`/`career` a "Todos" sin
      tocar `lunchDate`/`selectedSessionId`.
- [x] 3.3 Agregado botón "Reiniciar consulta": resetea `lunchDate` a hoy, `selectedSessionId` a
      `null`, `sessions` a `[]`, filtros demográficos a "Todos", `result` a `null`.
- [x] 3.4 Montado `AttendanceServedVsPlannedChart` (siempre visible con un turno seleccionado, no
      afectado por los filtros demográficos) antes de las gráficas demográficas/estado vacío.

## 4. Verificación

- [x] 4.1 `npx tsc --noEmit` → 0 errores.
- [x] 4.2 `npx vitest run` → 76/78 (mismos 2 fallos preexistentes ya conocidos, sin regresiones).
- [x] 4.3 Verificado con el backend y frontend reales que ya estaban corriendo en el entorno del
      usuario (no solo lectura de código, como en rondas anteriores): confirmado por `curl` que el
      servidor de Vite sirve el código actualizado (`ActiveFilterChips`, `pickChartPlan`,
      `useSearchParams`, botón "Limpiar" presentes en el módulo servido), y que
      `GET /statistics/attendance/by-period?person_type=STUDENT` devuelve `byDate`/`byCareer` con
      datos reales — la data que alimenta los componentes nuevos existe y fluye correctamente.
      **Pendiente**: no se pudo abrir un navegador real en este entorno (extensión de Chrome
      desconectada) para confirmar visualmente el layout de los 3 chips/gráficas nuevas — se
      recomienda una revisión visual rápida por el usuario.
