## Context

`CreateLunchPage` usa `createConfirmedLunch` (crea → recalcula → valida stock → confirma) y,
si `saveAsTemplate`, creaba la plantilla manualmente. El backend ahora hace upsert de la
plantilla al confirmar (`confirm_lunch`), por lo que la creación manual es redundante.

## Goals / Non-Goals

**Goals:** quitar el toggle y dejar que el backend cree la plantilla siempre; evitar doble
creación.
**Non-Goals:** no se cambia el flujo de confirmación ni el CRUD de plantillas (#12).

## Decisions

### D1 — Quitar toggle y creación manual

Se elimina `saveAsTemplate` de `LunchFooterActions`, del estado de la página y de
`createConfirmedLunch` (incluida la llamada `createLunchTemplate`). El refresco de plantillas se
hace siempre tras guardar.

## Risks / Trade-offs

- **Doble plantilla si el backend no la crea** → mitigado: la auditoría confirmó que
  `confirm_lunch` la crea siempre; se quita la creación del FE para no duplicar.
- **Nombre repetido** → lo resuelve el backend (upsert por nombre normalizado).
