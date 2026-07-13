## Context

El backend acepta `entry_date` (alias camel `entryDate`) SOLO en
`POST /inventory/items/{id}/stock/increase` (`StockChange`), no en el create/update del ítem.
El frontend "Cargar Insumo" creaba el ítem con `currentStock` directamente (movimiento con
fecha automática). Para asociar una fecha elegida a la entrada, hay que usar el endpoint de
increase.

## Goals / Non-Goals

**Goals:** permitir elegir la fecha de ingreso al cargar un insumo y que quede en el movimiento.
**Non-Goals:** no se añade fecha a la edición de ítem ni al ajuste rápido (+/-); no se toca el backend.

## Decisions

### D1 — Registrar la entrada inicial vía el endpoint de increase

Al crear: se crea el ítem con `currentStock: 0` y, si hay stock inicial (> 0), se registra con
`increaseStock({ quantity, reason: 'Carga inicial de insumo', entryDate })`. Así la fecha queda
en el `StockMovement`. Alternativa (mandar `entryDate` en createItem) rechazada: el backend no
lo acepta ahí y el campo se ignoraría (feature falsa).

### D2 — Default hoy, sin futuras

El input default = hoy y `max` = hoy; el backend además rechaza futuras (validación redundante).

## Risks / Trade-offs

- **Creación en dos pasos** (crear + entrada) → si la entrada falla, el ítem queda con stock 0;
  se muestra error y el usuario puede reintentar añadiendo stock. Aceptable.
- **Solo aplica al alta** → editar/ajustar stock con fecha queda fuera de alcance de este issue.

## Open Questions

- ¿Se quiere también fecha al ajustar stock de un ítem existente (+/-)? (Fuera de alcance de #7).
