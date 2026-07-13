## Context

`GET /consumptions/` acepta `is_priority` y devuelve datos de persona en cada consumo
(envelope `{total, items}`). La vista de entrantes por sesión la crea `fe-reportes-historial-sesiones`
(#4). Fase 0 fijó "acceso directo" = `is_priority`.

## Goals / Non-Goals

**Goals:** filtrar los entrantes de una sesión a solo los de acceso directo, por servidor.
**Non-Goals:** no se crea la vista (la aporta #4); no se filtra en cliente (rompería paginación).

## Decisions

### D1 — Filtro por servidor con `is_priority`

El toggle recarga `consumptionApi.list({ session_id, is_priority: true })`. Alternativa (filtrar
en cliente la lista ya traída) rechazada: rompe el conteo/paginación por servidor.

### D2 — Indicador visual por fila

Se añade una columna/badge "Acceso directo" cuando `is_priority` es true, para distinguirlos
también sin filtrar.

## Risks / Trade-offs

- **Definición de "acceso directo"** depende de `is_priority` (Fase 0); si cambia, se ajusta el
  parámetro sin tocar la UI.
