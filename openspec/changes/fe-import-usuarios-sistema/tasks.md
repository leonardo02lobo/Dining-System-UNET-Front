## 1. API y tipos

- [x] 1.1 `userApi.bulkCreate(items)` → `POST /users/bulk` en `src/api/user.ts`
- [x] 1.2 Tipos `UserBulkItem`, `UserBulkRowResult`, `UserBulkResult` en `src/types/user.ts`

## 2. Lógica CSV (`src/utils/csvImport.ts`)

- [x] 2.1 Campo destino `document_id` → `cedula` (constantes, sinónimos, auto-mapeo)
- [x] 2.2 `cleanCedula()` (solo dígitos) aplicada en `buildBulkItems`
- [x] 2.3 `validateRow`: `full_name`, `cedula` y `email` obligatorios
- [x] 2.4 Actualizar `csvImport.test.ts` (limpieza de cédula, email obligatorio)

## 3. Pantalla y navegación

- [x] 3.1 `AccesoDirectoImportPage`: enviar con `userApi.bulkCreate`, resultado `UserBulkResult`
- [x] 3.2 Vista previa y tabla de errores usan `cedula`
- [x] 3.3 Textos de la pantalla a "Usuarios"; enlace a `/usuarios`
- [x] 3.4 Label del navbar → "Importar Usuarios (CSV)"

## 4. Verificación

- [x] 4.1 `npx tsc --noEmit`
- [x] 4.2 `npx vitest run src/utils/csvImport.test.ts`
- [x] 4.3 `npm run build`
- [x] 4.4 `openspec validate fe-import-usuarios-sistema --strict`
