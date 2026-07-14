## Context

`CreateLunchPage` ya lista almuerzos creados y abre un modal de detalle (`getLunch`). Backend:
`PATCH /lunches/{id}` con `_ensure_editable` (solo `DRAFT`; 409 si `CONFIRMED`). El tipo
`LunchStatus` del frontend estaba desactualizado (`PUBLISHED`); el backend usa `CONFIRMED`.

## Goals / Non-Goals

**Goals:** editar nombre/fecha/platos de un almuerzo DRAFT desde su detalle; bloquear los no
editables con aviso.
**Non-Goals:** editar ingredientes del almuerzo (CRUD de ingredientes) se difiere.

## Decisions

### D1 — Edición inline en el modal de detalle

Se añade estado de edición en el detalle: badge de estado + botón "Editar" (solo DRAFT) que
alterna inputs de nombre/fecha/platos; "Guardar cambios" llama `updateLunch` y recarga detalle +
lista. Alternativa (página/modal aparte) rechazada: el detalle ya es el lugar natural.

### D2 — Corregir `LunchStatus`

Se cambia `LunchStatus` a `'DRAFT' | 'CONFIRMED' | 'CANCELLED'` (real del backend); `PUBLISHED`
no se usaba en ningún sitio.

### D3 — Manejo de no editable

Para no-DRAFT no se muestra "Editar" sino "Solo los borradores son editables"; si aun así el
backend rechaza (409), `errorMessage` lo traduce a un aviso claro.

## Risks / Trade-offs

- **La mayoría de almuerzos creados son CONFIRMED** (el flujo confirma al crear) → la edición
  aplica sobre todo a borradores; es la regla del backend, no una limitación del FE.
- **Editar sin ingredientes** → cambiar platos recalcula en backend; el detalle se recarga para
  reflejarlo.
