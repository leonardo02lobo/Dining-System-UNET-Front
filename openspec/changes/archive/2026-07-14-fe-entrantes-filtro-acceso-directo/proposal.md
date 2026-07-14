## Why

En el listado de entrantes de una sesión no se distingue quién entró por **acceso directo**.
El cliente pidió un filtro/sublista para ver explícitamente esos entrantes (issue **#3** de
`issues_reunion.md`).

Decisión de Fase 0: "acceso directo" = `is_priority`. Change gemela backend
`be-consumptions-acceso-directo` (implementada): `GET /consumptions/` acepta `is_priority` y
`ConsumptionResponse` expone `is_priority` + datos de persona, conservando `{total, items}`.

## What Changes

- En `SessionHistoryPage` (creada por `fe-reportes-historial-sesiones`, #4) se añade un toggle
  **"Solo acceso directo"** que recarga los entrantes con `is_priority=true`, respetando la
  paginación por servidor.
- La tabla de entrantes muestra una columna/badge "Acceso directo" cuando `is_priority` es true.

## Capabilities

### New Capabilities
- `entrantes-filtro-acceso-directo`: filtro para ver solo los entrantes de acceso directo
  (`is_priority`) dentro de una sesión.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos:** `src/pages/SessionHistoryPage.tsx` (toggle + columna), `src/api/consumption.ts`
  (parámetro `is_priority`, compartido con #4). Backend: sin cambios. Riesgo: bajo.
- **Depende de** `fe-reportes-historial-sesiones` (#4), que crea la vista contenedora.
