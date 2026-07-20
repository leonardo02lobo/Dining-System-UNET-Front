## Why

La importación CSV del panel admin enviaba los datos a `POST /accesos_directos/bulk`, guardándolos
como **accesos directos** (beneficiarios del comedor). Es un bug: esos registros son **usuarios del
sistema** y deben ir a `/users`. Además las cédulas llegaban con formato ("V-12.345.678") en vez de
solo números.

## What Changes

- Reapuntar la pantalla de importación a **`POST /users/bulk`** (`userApi.bulkCreate`) en vez de
  `accesoDirectoApi.bulkCreate`.
- Cambiar el campo destino `document_id` por **`cedula`** y **limpiar la cédula a solo dígitos** en
  el navegador (`cleanCedula`), reflejándolo en la vista previa.
- `email` pasa a ser **obligatorio** en la validación de fila (un usuario del sistema lo requiere).
- Actualizar el resultado para la respuesta del nuevo endpoint (`results[].cedula`,
  `created/updated/unchanged/failed`) y los textos de la pantalla y del navbar a "Usuarios".

## Impact

- **Archivos:** `src/api/user.ts` (`bulkCreate`), `src/types/user.ts` (tipos de lote),
  `src/utils/csvImport.ts` (`cedula` + `cleanCedula`), `src/utils/csvImport.test.ts`,
  `src/pages/AccesoDirectoImportPage.tsx` (envío + textos), `src/components/ui/NavBar.tsx` (label).
- **Contrato backend:** depende de `POST /users/bulk` (implementado en
  `be-import-usuarios-sistema`).
- **Ruta:** se mantiene el slug `/accesos_directos/importar` para no romper el catálogo de permisos;
  solo cambia la etiqueta visible a "Importar Usuarios (CSV)".
