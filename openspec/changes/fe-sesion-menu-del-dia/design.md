## Context

`GET /lunches?date=` devuelve el/los almuerzo(s) de una fecha (sesión↔almuerzo por igualdad de
fecha). El detalle de sesión lo aporta `fe-reportes-historial-sesiones` (#4). `LunchResponse`
trae `ingredients` (con `inventoryItem`, `calculatedQuantity`, `unit`).

## Goals / Non-Goals

**Goals:** mostrar el menú planificado del día (nombre + ingredientes) en el detalle de sesión.
**Non-Goals:** no se calcula "consumo real" (insumos descontados); Fase 0 fijó menú planificado.

## Decisions

### D1 — Panel de menú por fecha de la sesión

Se consulta `listLunches({ date: session.date })` y se muestra el primer almuerzo del día. Si no
hay, se indica "No hay menú registrado para este día". Alternativa (vínculo directo sesión↔almuerzo)
innecesaria: el backend asocia por fecha.

### D2 — Tipar `LunchResponse.ingredients`

Se cambia `ingredients: unknown[]` a `LunchIngredientResponse[]` para renderizar nombre/cantidad/
unidad sin casts.

## Risks / Trade-offs

- **Varios almuerzos por día** → se muestra el primero; si el negocio permite varios, se puede
  listar todos en una iteración futura.
