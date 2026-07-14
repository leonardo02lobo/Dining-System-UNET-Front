## Why

El cliente pidió renombrar la sección **"Crear almuerzo"** a **"Crear servicio de
alimentación"** (issue **#13** de `issues_reunion.md`). Es un cambio de nomenclatura de UI.

Decisión de Fase 0 (plan `plan-issues-reunion`): **solo se renombra el rótulo visible**; se
mantiene la ruta `/inventario/crear` para no romper enlaces ni entidades de backend.

## What Changes

- Se cambia el `label` del ítem de navegación en `NavBar.tsx` de "Crear Almuerzo" a
  "Crear servicio de alimentación".
- Se cambia el título del `PageHeader` en `CreateLunchPage.tsx` de "Crear Almuerzo" a
  "Crear servicio de alimentación".
- Se mantiene la ruta `/inventario/crear` y las entidades internas (`Lunch`) sin cambios.

## Capabilities

### New Capabilities
- `crear-servicio-alimentacion-label`: rótulo de la sección de creación de almuerzos
  renombrado a "Crear servicio de alimentación" en navegación y encabezado.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos afectados:** `src/components/ui/NavBar.tsx`, `src/pages/CreateLunchPage.tsx`.
- **Sin cambios** de ruta, backend ni datos. Riesgo: mínimo.
