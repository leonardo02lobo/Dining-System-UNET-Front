## Why

En "Registrar inventario" (`InventoryPage`) e "Inventario General" (`GeneralInventoryPage`)
el panel de resumen ocupa poco espacio (ancho fijo `xl:w-[267px]`) frente a la tabla. El
cliente pidió una **distribución 70/30** para agrandar el resumen (issue **#6**).

Decisión de Fase 0 (plan `plan-issues-reunion`): **70% tabla / 30% resumen**.

## What Changes

- En ambas páginas, el contenedor pasa de `flex ... xl:flex-row` a un grid con proporción
  explícita `xl:grid-cols-[7fr_3fr]` (patrón ya usado en `CreateLunchPage`).
- El envoltorio de la tabla deja de usar `flex-1` (el grid controla el ancho).
- `InventorySummaryPanel` deja de tener ancho fijo (`xl:w-[267px]`) y pasa a `w-full` para
  llenar su columna del 30%.
- Se conserva el apilado responsivo en pantallas angostas.

## Capabilities

### New Capabilities
- `inventario-layout-70-30`: distribución 70/30 (tabla/resumen) en Registrar Inventario e
  Inventario General, con el panel de resumen ocupando el 30%.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos afectados:** `src/pages/InventoryPage.tsx`, `src/pages/GeneralInventoryPage.tsx`,
  `src/components/inventory/InventorySummaryPanel.tsx` (ancho).
- `InventorySummaryPanel` solo se usa en esas dos páginas (verificado), por lo que ampliar su
  ancho es consistente. Sin cambios de backend. Riesgo: bajo (visual/responsivo).
