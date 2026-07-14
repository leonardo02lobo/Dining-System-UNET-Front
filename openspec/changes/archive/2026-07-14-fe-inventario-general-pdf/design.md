## Context

`GeneralInventoryPage.tsx` carga los insumos con `inventoryApi.listItems()`, muestra
`InventoryFilters` (búsqueda + categoría), `InventoryOverviewTable` y `InventorySummaryPanel`.
No hay exportación. El backend ya expone `GET /inventory/export/pdf`. El repo ya tiene el
patrón de descarga de blobs: `apiClient.getBlob(path, accept)` (`src/api/client.ts`) usado en
`reportsApi.exportConsumptionReportPdf`.

## Goals / Non-Goals

**Goals:**
- Botón "Descargar PDF" en Inventario General que descargue el PDF del inventario completo.
- Reutilizar el patrón `getBlob` existente y el primitivo `Button`.

**Non-Goals:**
- No se genera el PDF en el cliente (se usa el del backend).
- No se cambia el layout general de la página (eso es el issue #6 / change `fe-inventario-resumen-70-30`).
- No se modifica el endpoint del backend.

## Decisions

### D1 — Consumir el PDF del backend, no generarlo en cliente

Se usa `GET /inventory/export/pdf` vía `apiClient.getBlob`. Alternativa (generar PDF en
frontend con `pdfLogos`/jsPDF) rechazada: duplica formato y el endpoint ya existe.

### D2 — Exportar el inventario completo, no el filtrado (default de Fase 0)

El botón descarga **toda** la data del inventario (lo que pide el issue #8 literalmente:
"toda la data que se encuentre ahí albergada"), independientemente de los filtros de
búsqueda/categoría activos en la UI. Si el cliente pide respetar filtros, se revisará al
cerrar el design (requiere que el endpoint acepte parámetros de filtro).

### D3 — Helper de descarga de blob

Disparar la descarga con `URL.createObjectURL(blob)` + un `<a download="inventario.pdf">`
temporal, con `URL.revokeObjectURL` tras el click. Si existe un helper reutilizable en
`src/utils/`, se usa ese; si no, se crea uno pequeño (`downloadBlob(blob, filename)`).

## Risks / Trade-offs

- **El PDF del endpoint no cubre las columnas esperadas** → verificar contenido en la tarea
  de QA; si falta, el ajuste de columnas es una change de backend aparte (fuera de alcance).
- **Inventario vacío** → el endpoint debe responder un PDF válido; se prueba el caso vacío.
- **Bloqueo de descarga en Tauri** → validar que la descarga de blob funciona en la ventana
  Tauri además del navegador.

## Open Questions

- ¿El nombre del archivo descargado debe incluir la fecha (`inventario-YYYY-MM-DD.pdf`)?
- ¿Confirmado que se exporta siempre todo y no el subconjunto filtrado? (default asumido: todo).
