## Why

En "Crear servicio de alimentación" (`CreateLunchPage`), la tabla de ingredientes y el panel
de recálculo automático tienen presentación distinta y disposición 70/30, y el botón
"Agregar Ingrediente" vive dentro del panel de recálculo. El cliente pidió **dos tablas
paralelas al 50/50 visualmente iguales** (ingredientes vs. recálculo), con el botón "Agregar
Ingrediente" en la **región central inferior** entre ambas (issue **#9** de `issues_reunion.md`).

Decisiones de Fase 0 (plan `plan-issues-reunion`): usar un **componente de tabla reutilizable**
(mismo estilo `ui/Table` para ambas) y mantener las tablas **independientes** (base vs.
recalculada).

## What Changes

- Se crea `LunchRecalculationTable` que presenta el recálculo con `ui/Table` (mismo estilo que
  `LunchIngredientsTable`): columnas Ingrediente / Base·N / Nuevo·N, más el control de platos
  deseados y el botón "Aplicar recálculo".
- En `CreateLunchPage`, el layout pasa de `xl:grid-cols-[7fr_3fr]` a **dos columnas 50/50**
  (`xl:grid-cols-2`) con `LunchIngredientsTable` a la izquierda y `LunchRecalculationTable` a
  la derecha.
- El botón **"Agregar Ingrediente"** se mueve a un contenedor **centrado debajo de ambas
  tablas**.
- Se conserva el recálculo en vivo (el flujo de `previews`/`getRecalculationPreview` no cambia).
- `LunchRecalculationPanel` se mantiene intacto (lo sigue usando `LunchTestPage`).

## Capabilities

### New Capabilities
- `crear-servicio-tablas-50-50`: dos tablas paralelas 50/50 (ingredientes y recálculo) con el
  mismo estilo y el botón "Agregar Ingrediente" centrado debajo de ambas.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos afectados:** nuevo `src/components/lunch/LunchRecalculationTable.tsx`;
  `src/pages/CreateLunchPage.tsx` (layout + botón). Sin cambios de backend.
- **Riesgo:** medio (no romper el recálculo en vivo); mitigado conservando el flujo de datos.
