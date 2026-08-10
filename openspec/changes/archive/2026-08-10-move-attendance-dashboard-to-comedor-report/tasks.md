## 1. Reporte al Comedor — recuperar pestañas

- [x] 1.1 `src/pages/ReportsPage.tsx`: agregado estado de pestaña (`insumos`/`periodo`/`almuerzo`)
      y la barra de pestañas. **Corregido en 1.5**: el estado final es `periodo`/`almuerzo`
      únicamente.
- [x] 1.2 Contenido de insumos envuelto en `{tab === 'insumos' && (...)}`, sin modificar su lógica.
      **Corregido en 1.5**: este contenido se eliminó por completo de esta página.
- [x] 1.3 `PeriodAttendancePanel` montado en `periodo`, `LunchSessionAttendancePanel` en
      `almuerzo`, importados sin modificarlos.
- [x] 1.4 Acciones "Actualizar Reporte"/"Descargar PDF" del `PageHeader` ocultas cuando la pestaña
      activa no es `insumos`. **Corregido en 1.5**: estas acciones eran exclusivas del reporte de
      insumos y se eliminaron junto con él.
- [x] 1.5 **Corrección post-implementación** (el usuario señaló con una captura que la pestaña
      "Consumo de Insumos" no debía estar en esta página): `ReportsPage.tsx` reescrita desde cero
      sin ningún estado/lógica/import de insumos — solo las 2 pestañas de asistencia
      (`periodo`/`almuerzo`), `PageHeader` sin acciones, y el `<h1>` de la barra de pestañas
      apuntando directamente a los paneles.

## 2. Reportes de Consumo — revertir a solo insumos

- [x] 2.1 `src/pages/ConsumptionReportPage.tsx`: quitado el estado de pestaña, la barra de
      pestañas, y los imports/montaje de `PeriodAttendancePanel`/`LunchSessionAttendancePanel`.
- [x] 2.2 Confirmado por lectura del archivo resultante: el contenido de insumos queda igual que
      antes de que el dashboard se agregara ahí (mismo `ReportDateRangeFilters` +
      `ConsumptionReportTable` + `ReportChartsPanel`, sin cambios de lógica).

## 3. Verificación

- [x] 3.1 `npx tsc --noEmit` → 0 errores.
- [x] 3.2 `npx vitest run` → 76/78 (mismos 2 fallos preexistentes, sin regresiones).
- [x] 3.3 Verificado contra el servidor de Vite real ya corriendo: `ReportsPage.tsx` servido
      contiene las referencias a `PeriodAttendancePanel`/`LunchSessionAttendancePanel` (4
      coincidencias), y `ConsumptionReportPage.tsx` servido ya no contiene ninguna referencia a
      esos paneles (0 coincidencias). El movimiento está confirmado en el código que realmente se
      sirve, no solo en el código fuente.
- [x] 3.4 Tras la corrección de 1.5: `npx tsc --noEmit` → 0 errores (confirma que no quedaron
      imports/variables de insumos sin usar en `ReportsPage.tsx`).
