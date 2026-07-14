## Context

Backend ya expone `GET /lunch-sessions/?from_date&to_date` (`{total, items}`) y entrantes por
`GET /consumptions/?session_id=` con datos de persona en `ConsumptionResponse`. `ReportsPage`
(`/comedor/reporte`) está enfocada en gráficos de insumos; una vista maestro-detalle de
sesiones encaja mejor en su propia página. El PDF se genera en el frontend (branding con
`pdfLogos`), patrón ya usado en `pdfLunch`/`ReportsPage`.

## Goals / Non-Goals

**Goals:** historial por rango → detalle de entrantes → PDF por sesión (cédula/apellido/nombre/carrera).
**Non-Goals:** no se toca `ReportsPage`; el filtro de acceso directo (#3) y el menú del día (#14)
se documentan en sus propias changes aunque vivan en esta página.

## Decisions

### D1 — Página dedicada `SessionHistoryPage`

Se crea una página maestro-detalle en `/comedor/historial` en lugar de engordar `ReportsPage`.
Alternativa (embeber en ReportsPage) rechazada por acoplar dos flujos distintos.

### D2 — PDF en frontend

Se genera con jsPDF + `pdfLogos` (`pdfSessionEntrants.ts`), acorde a la decisión del backend de
delegar el PDF de sesión al cliente. Columnas fijas cédula/apellido/nombre/carrera.

### D3 — Orden y contratos

Sesiones ordenadas por fecha descendente en cliente. `consumptionApi.list` y
`lunchSessionApi.listByRange` conservan el envelope `{total, items}`.

## Risks / Trade-offs

- **Sesiones grandes → PDF pesado** → aceptable; se puede paginar en una iteración futura.
- **Datos de persona ausentes en algún consumo** → se muestran con "—" sin romper.

## Open Questions

- ¿El historial debería vivir también como sección dentro de `ReportsPage`? (Se optó por página propia).
