## 1. Tipos y cliente API

- [x] 1.1 Añadir tipos `AccesoDirectoBulkItem`, `AccesoDirectoBulkRequest`, `AccesoDirectoBulkResult`,
      `AccesoDirectoBulkRowResult` en `src/types/acceso_directo.ts`
- [x] 1.2 Añadir `accesoDirectoApi.bulkCreate(items)` → `POST /accesos_directos/bulk` en `src/api/acceso_directo.ts`

## 2. Lógica de CSV (utils testeables)

- [x] 2.1 `src/utils/csvImport.ts`: `parseCsv(text)` (parser de comas con comillas y saltos), devuelve headers + rows
- [x] 2.2 `parseBoolean(value)` tolerante (true/false, 1/0, si/sí/no, activo/inactivo, x/vacío, case-insensitive)
- [x] 2.3 `autoMapColumns(headers)`: auto-mapeo por nombre de cabecera a los 5 campos destino
- [x] 2.4 `buildBulkItems(rows, mapping)`: shaping al contrato `{ full_name, email|null, career|null, document_id, is_active }`
- [x] 2.5 `validateRow(item)`: `full_name` y `document_id` obligatorios, email con formato razonable
- [x] 2.6 `src/utils/csvImport.test.ts`: pruebas de parseo, booleanos, auto-mapeo, shaping y validación

## 3. UI de importación

- [x] 3.1 `src/pages/AccesoDirectoImportPage.tsx`: input de archivo + parseo en navegador
- [x] 3.2 UI de mapeo de columnas (dropdowns por campo destino con auto-mapeo aplicado)
- [x] 3.3 Tabla de vista previa con validación por fila y valores aceptados de `Activo` documentados
- [x] 3.4 Botón de envío → `bulkCreate`; resumen (total/creados/fallidos) + errores por fila
- [x] 3.5 Acción para refrescar/ver la lista (`accesoDirectoApi.list`) tras la importación

## 4. Rutas y navegación (solo admin)

- [x] 4.1 Ruta `accesos_directos/importar` en `App.tsx`
- [x] 4.2 Gate en `routeAccess.ts`: `/accesos_directos/importar` → `['SUPER_ADMIN', 'ADMIN']`
- [x] 4.3 Ítem de nav "Importar Accesos (CSV)" en `NavBar.tsx`

## 5. Verificación

- [x] 5.1 Typecheck estricto: `npx tsc --noEmit`
- [x] 5.2 Build verde: `npm run build`
- [x] 5.3 Pruebas verdes: `npm test`
