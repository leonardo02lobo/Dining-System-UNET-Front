## 1. Verificación previa

- [x] 1.1 Confirmar el contenido/columnas del PDF de `GET /inventory/export/pdf` — endpoint confirmado en `app/api/v1/endpoints/inventory.py:300`

## 2. Capa API

- [x] 2.1 Añadir `exportInventoryPdf()` a `inventoryApi` (`src/api/inventory.ts`) usando `apiClient.getBlob('/inventory/export/pdf', 'application/pdf')`
- [x] 2.2 Crear `downloadBlob(blob, filename)` en `src/utils/downloadBlob.ts` (patrón `URL.createObjectURL` + `<a download>` + `revokeObjectURL`)

## 3. UI en Inventario General

- [x] 3.1 Añadir botón "Descargar PDF" (primitivo `Button`) en el encabezado de `GeneralInventoryPage.tsx`
- [x] 3.2 Implementar el handler con estado `loading` y bloqueo de doble disparo
- [x] 3.3 Mostrar mensaje de error legible ante fallo, sin romper tabla ni resumen

## 4. Validación

- [ ] 4.1 Probar descarga con inventario poblado (contenido correcto) y vacío (sin error) — requiere backend corriendo
- [ ] 4.2 Verificar la descarga en la ventana Tauri además del navegador — prueba manual
- [x] 4.3 Build verde: `npm run build` (`tsc && vite build`) pasa. Nota: se corrigieron 3 errores preexistentes en `RegisterDining.tsx` (2 consts sin uso + `disabled` duplicado, unificado a `isSuspended || registrationBlocked` confirmado con el usuario) que bloqueaban el build
