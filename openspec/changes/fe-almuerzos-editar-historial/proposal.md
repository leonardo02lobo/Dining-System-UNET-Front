## Why

Los almuerzos ya creados no se pueden editar desde su historial ("Ver almuerzos creados"). El
cliente pidió poder editarlos (issue **#10**). Change gemela backend `be-lunches-regla-editabilidad`
(implementada): `PATCH /lunches/{id}` existe; solo los `DRAFT` son editables (409 si `CONFIRMED`);
cambiar platos recalcula ingredientes.

Decisión de Fase 0 (1.6): editar **solo estados que el backend permita** (borradores);
confirmados bloqueados con aviso claro.

## What Changes

- Se añade `lunchApi.updateLunch(id, data)` (`PATCH /lunches/{id}`) y el tipo `LunchUpdatePayload`.
- En el modal "Detalle del almuerzo" de `CreateLunchPage` se muestra el **estado** (Borrador/
  Confirmado) y, solo para `DRAFT`, un botón **"Editar"** que permite modificar nombre, fecha y
  platos, guardando vía `PATCH`.
- Para almuerzos no editables se muestra el aviso "Solo los borradores son editables"; si el
  backend responde 409 se surface un mensaje claro.

**Fuera de alcance (documentado):** edición completa de ingredientes del almuerzo (CRUD de
ingredientes), que se difiere; esta entrega cubre los campos del almuerzo.

## Capabilities

### New Capabilities
- `almuerzos-editar-historial`: edición de nombre/fecha/platos de un almuerzo en borrador desde
  su detalle, con bloqueo claro de los no editables.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos:** `src/types/lunch.ts` (`LunchUpdatePayload`, `LunchStatus` corregido a incluir
  `CONFIRMED`), `src/api/lunch.ts` (`updateLunch`), `src/pages/CreateLunchPage.tsx` (edición en
  el detalle). Backend: sin cambios. Riesgo: medio (archivo grande).
