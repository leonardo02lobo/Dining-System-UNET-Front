## Why

Guardar un almuerzo como plantilla era opcional (un toggle "Guardar como plantilla"). El
cliente pidió que **todos** los almuerzos creados se guarden como plantilla siempre (issue
**#11**). Change gemela backend `be-lunch-auto-plantilla` (implementada): `confirm_lunch` hace
**siempre** upsert de la plantilla (por nombre normalizado).

## What Changes

- Se elimina el toggle "Guardar como plantilla" de `LunchFooterActions`.
- `createConfirmedLunch` deja de recibir `saveAsTemplate` y **ya no crea la plantilla
  manualmente** (el backend la crea/actualiza al confirmar); se evita la doble creación.
- Tras guardar, el frontend siempre refresca la lista de plantillas precargadas y muestra
  "Servicio confirmado y plantilla guardada".

## Capabilities

### New Capabilities
- `crear-servicio-auto-plantilla`: la creación de un servicio de alimentación siempre genera su
  plantilla (sin opción manual en la UI).

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos:** `src/components/lunch/LunchFooterActions.tsx` (quitar toggle),
  `src/pages/CreateLunchPage.tsx` (quitar estado/uso), `src/api/lunch.ts` (`createConfirmedLunch`
  sin `saveAsTemplate` ni creación manual). Backend: sin cambios. Riesgo: bajo.
