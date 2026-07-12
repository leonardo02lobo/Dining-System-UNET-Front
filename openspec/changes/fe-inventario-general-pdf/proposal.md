## Why

En la pantalla **Inventario General** (`GeneralInventoryPage.tsx`) no existe forma de
exportar o imprimir en PDF toda la data del inventario. Los administradores necesitan un
respaldo/impresión formal del inventario. El backend **ya expone** `GET /inventory/export/pdf`
(patrón idéntico al de reportes de consumo), por lo que este trabajo es de frontend puro.

Issue de origen: **#8** de `issues_reunion.md`. Change gemela de backend: **ninguna** (el
endpoint ya existe). Este es un quick win de la Ola 1 del plan `plan-issues-reunion`.

## What Changes

- Se añade el método `exportInventoryPdf()` a `inventoryApi` (`src/api/inventory.ts`) que
  consume `GET /inventory/export/pdf` con `apiClient.getBlob(path, 'application/pdf')`,
  siguiendo el patrón ya usado en `reportsApi.exportConsumptionReportPdf`.
- Se añade en `GeneralInventoryPage.tsx` un botón **"Descargar PDF"** (primitivo `Button`)
  en el encabezado de la vista, que dispara la descarga del blob con estado `loading` y
  manejo de error.
- Se añade (o reutiliza) un helper mínimo para disparar la descarga del `Blob` en el
  navegador (`URL.createObjectURL` + `<a download>`), si no existe ya uno reutilizable.

## Capabilities

### New Capabilities
- `inventory-general-pdf-export`: capacidad de exportar/descargar en PDF toda la data del
  Inventario General desde la UI, consumiendo el endpoint existente del backend.

### Modified Capabilities
<!-- Ninguna: openspec/specs/ está vacío. -->

## Impact

- **Archivos afectados:** `src/api/inventory.ts` (nuevo método), `src/pages/GeneralInventoryPage.tsx`
  (botón + handler), y posiblemente `src/utils/` (helper de descarga de blob).
- **Backend:** sin cambios; consume `GET /inventory/export/pdf` existente.
- **Riesgo:** bajo. Depende de que el PDF del endpoint cubra las columnas esperadas
  (verificación en tareas).
