## Why

El usuario pidió que el dashboard de asistencia (pestañas "Asistencia por Período" y "Asistencia
por Almuerzo"), que hoy vive en "Reportes de Consumo" (`/inventario/reportes-consumo`, bajo
Inventario), se mueva a "Reporte al Comedor" (`/comedor/reporte`) en su lugar. Confirmado
explícitamente con el usuario: es una **mudanza**, no una duplicación — el dashboard deja de
aparecer en Reportes de Consumo (que vuelve a mostrar solo el reporte de insumos) y pasa a vivir
únicamente en Reporte al Comedor.

## What Changes

- **`ReportsPage.tsx`** ("Reporte al Comedor", `/comedor/reporte`): ofrece dos pestañas —
  Asistencia por Período | Asistencia por Almuerzo —, montando
  `PeriodAttendancePanel`/`LunchSessionAttendancePanel` sin modificarlos (incluye todas las mejoras
  agregadas en el cambio anterior: chips de filtros activos, botones de limpiar, gráfica de
  asistencia diaria, gráfica planificados-vs-servidos, filtros en la URL).
- **`ConsumptionReportPage.tsx`** ("Reportes de Consumo", `/inventario/reportes-consumo`): pierde
  la barra de pestañas y vuelve a mostrar únicamente el reporte de consumo de insumos, tal como
  estaba antes de que el dashboard se moviera ahí.
- Sin cambios de rutas ni de navegación: ambas pantallas ya existen y están en sus menús
  respectivos; solo cambia qué contenido tiene cada una.

**Corrección post-implementación**: la primera versión de este change dejó la pestaña "Consumo de
Insumos" también en "Reporte al Comedor" (junto a las dos de asistencia), replicando el mismo
error de ubicación de un cambio anterior. El usuario corrigió: el consumo de insumos pertenece
**exclusivamente** a Inventario → Reportes de Consumo. "Reporte al Comedor" quedó con **solo** las
dos pestañas de asistencia, sin ningún contenido de insumos.

## Capabilities

### Modified Capabilities
- `reportes-consumo-pestanas-asistencia`: se revierte — Reportes de Consumo ya no ofrece pestañas
  de asistencia, solo el reporte de insumos que tenía originalmente.

### New Capabilities
- `reporte-comedor-pestanas-asistencia`: Reporte al Comedor (`/comedor/reporte`) ofrece
  **únicamente** las pestañas de asistencia por período y por almuerzo — sin reporte de insumos,
  que permanece exclusivo de Reportes de Consumo.

## Impact

**Frontend** (este repo), sin cambios de backend ni de rutas/navegación:
- `src/pages/ReportsPage.tsx`: agrega estado de pestaña + barra de pestañas + montaje de
  `PeriodAttendancePanel`/`LunchSessionAttendancePanel`.
- `src/pages/ConsumptionReportPage.tsx`: quita estado de pestaña + barra de pestañas + montaje de
  esos mismos paneles, volviendo a su forma de solo-insumos.
- Sin cambios en `src/components/reports/PeriodAttendancePanel.tsx`,
  `LunchSessionAttendancePanel.tsx`, ni en ningún componente de `src/components/statistics/` —
  se reutilizan tal cual.
