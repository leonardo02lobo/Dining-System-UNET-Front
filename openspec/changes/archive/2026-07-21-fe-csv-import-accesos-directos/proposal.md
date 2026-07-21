## Why

Cargar accesos directos (beneficiarios/estudiantes) uno por uno desde el formulario existente es lento
cuando hay que dar de alta decenas o cientos de personas. Se necesita una **importación masiva por
CSV** en el módulo de Administración: el admin sube un archivo, mapea las columnas a los campos
requeridos, previsualiza y envía todo en una sola petición al backend.

## What Changes

- Nueva sección/página de admin **"Importar CSV"** que permite:
  - Subir un archivo CSV separado por comas (`,`) mediante un `<input type="file">` (el usuario aporta
    el archivo en tiempo de ejecución; el frontend lo parsea en el navegador).
  - **Mapeo de columnas**: detectar la fila de cabecera y permitir asociar cada uno de los 5 campos
    destino (`full_name`, `email`, `career`, `document_id`, `is_active`) a una columna del CSV, con
    auto-mapeo por nombre de cabecera.
  - **Parseo tolerante de booleanos** para `Activo` (true/false, 1/0, si/sí/no, activo/inactivo, x/vacío,
    sin distinción de mayúsculas), documentando los valores aceptados en la UI.
  - **Vista previa** de las filas mapeadas con validación básica (`full_name` y `document_id`
    obligatorios, email con formato razonable).
  - **Envío masivo** a `POST /accesos_directos/bulk` con `{ items: [...] }`.
  - **Resumen de resultado** (total/creados/fallidos) y errores por fila, más un acceso para refrescar
    y ver la lista existente (`accesoDirectoApi.list`).
- Nuevo método `accesoDirectoApi.bulkCreate` y tipos en `src/types/acceso_directo.ts`.
- Nueva ruta protegida solo para **SUPER_ADMIN/ADMIN** más su ítem de navegación.

## Capabilities

### New Capabilities
- `importacion-csv-accesos-directos`: importación masiva de accesos directos vía CSV con mapeo de
  columnas, vista previa, envío masivo y resumen de resultados, restringida a admin.

## Impact

- **Contrato backend (fijo, implementado en paralelo):** `POST /accesos_directos/bulk`
  - Request: `{ "items": [ { full_name, email|null, career|null, document_id, is_active } ] }`
  - Response 200: `{ total, created, failed, results: [ { row, document_id, status, id|null, error|null } ] }`
- **Archivos nuevos:** `src/utils/csvImport.ts` (parser CSV + mapeo de booleanos + shaping de payload),
  `src/utils/csvImport.test.ts`, `src/pages/AccesoDirectoImportPage.tsx`.
- **Archivos modificados:** `src/api/acceso_directo.ts`, `src/types/acceso_directo.ts`, `src/App.tsx`,
  `src/components/ui/NavBar.tsx`, `src/config/routeAccess.ts`.
- **Sin dependencias nuevas**: parser CSV propio, sin librerías externas.
- **Build:** mantener verde `npx tsc --noEmit`, `npm run build` y `npm test`.
