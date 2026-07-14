## Why

Además de ver quién entró a una sesión, el cliente pidió ver **qué se consumió / cuál fue el
menú** de ese día (issue **#14**, va de la mano con #4).

Decisión de Fase 0: "consumo" = **menú planificado** (nombre + ingredientes/cantidades del
`Lunch` del día). Change gemela backend `be-lunch-menu-del-dia` (implementada): `GET /lunches?date=`;
sesión↔almuerzo se asocian por igualdad de fecha.

## What Changes

- En el detalle de sesión de `SessionHistoryPage` (#4) se añade un panel **"Menú del día"** que
  consulta `lunchApi.listLunches({ date: session.date })` y muestra el nombre del almuerzo y sus
  ingredientes (nombre · cantidad · unidad).
- Se maneja el caso "sin almuerzo registrado" para ese día sin error.
- Se tipa `LunchResponse.ingredients` como `LunchIngredientResponse[]` para renderizar el menú.

## Capabilities

### New Capabilities
- `sesion-menu-del-dia`: panel que muestra el menú planificado del día junto al detalle de
  entrantes de la sesión.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos:** `src/api/lunch.ts` (`listLunches({date})`), `src/types/lunch.ts` (ingredients
  tipado), `src/pages/SessionHistoryPage.tsx` (panel menú). Backend: sin cambios. Riesgo: bajo.
- **Depende de** `fe-reportes-historial-sesiones` (#4).
