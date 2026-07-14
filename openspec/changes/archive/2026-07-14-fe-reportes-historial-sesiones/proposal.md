## Why

El reporte de comedor no ofrece un historial navegable de sesiones con el detalle de sus
entrantes ni descarga PDF por sesión. El cliente pidió listar sesiones por rango de fechas,
abrir una y ver quiénes ingresaron ese día, con descarga de un PDF (cédula, apellido, nombre,
carrera) — issue **#4** de `issues_reunion.md`.

Change gemela backend: `be-lunch-sessions-rango-y-pdf` (ya implementada; el backend expone
`GET /lunch-sessions/?from_date&to_date` con envelope `{total, items}` y los entrantes vía
`GET /consumptions/?session_id=`). El PDF por sesión se genera en el **frontend** con branding
institucional (decisión documentada del backend).

## What Changes

- Se añade `lunchSessionApi.listByRange({from_date, to_date})` y se extiende `consumptionApi.list`
  para aceptar `session_id`/`from_date`/`to_date`/`is_priority`; `Consumption` incluye ahora los
  datos de persona (`document_id`, `first_name`, `last_name`, `career`, `is_priority`).
- Nueva página `SessionHistoryPage` (ruta `/comedor/historial`): filtro por rango de fechas →
  tabla de sesiones (orden por fecha desc) → al seleccionar una, tabla de entrantes → botón
  "Descargar PDF".
- Nuevo util `src/utils/pdfSessionEntrants.ts` (jsPDF + logos) con columnas cédula/apellido/
  nombre/carrera.
- Ruta en `App.tsx`, entrada "Historial de Sesiones" en el grupo Comedor del `NavBar`, acceso
  `SUPER_ADMIN`/`ADMIN` en `routeAccess`.

Esta página es el contenedor que también alberga el filtro de acceso directo
(`fe-entrantes-filtro-acceso-directo`, #3) y el menú del día (`fe-sesion-menu-del-dia`, #14).

## Capabilities

### New Capabilities
- `reportes-historial-sesiones`: historial de sesiones por rango de fechas con detalle de
  entrantes y exportación PDF por sesión.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos:** `src/types/consumption.ts`, `src/api/consumption.ts`, `src/api/lunchSession.ts`,
  `src/pages/SessionHistoryPage.tsx` (nueva), `src/utils/pdfSessionEntrants.ts` (nuevo),
  `src/App.tsx`, `src/components/ui/NavBar.tsx`, `src/config/routeAccess.ts`.
- Backend: sin cambios (contrato ya disponible). Riesgo: medio (feature nueva).
