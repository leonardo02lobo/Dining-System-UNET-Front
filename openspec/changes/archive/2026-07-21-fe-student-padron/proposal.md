## Why

El frontend consultaba el padrón de estudiantes en un servicio Node externo
(`VITE_STUDENTS_API_URL`, `http://localhost:3000/api`) para consultar, registrar y hacer registro
manual, y la importación CSV guardaba en accesos directos. Ahora existe un padrón propio en el
backend (`/students`); todos esos flujos deben usarlo, dejando de llamar al API externo.

## What Changes

- Reapuntar `externalStudentApi.lookup` (en `src/api/externalStudent.ts`) al backend
  `GET /students/lookup?q=` vía `apiClient` (con cookies), en vez del Node externo. Se conserva el
  nombre y la firma para no tocar los consumidores (`studentApi`, `CheckConsumes`, `RegisterDining`,
  `SuspendStudent`, `ManualRegistration`). `mapExternalToStudent` se adapta al shape del backend.
- Añadir `externalStudentApi.bulkCreate` → `POST /students/bulk` y los tipos en `src/types/student.ts`.
- La pantalla de importación CSV pasa a importar **estudiantes** al padrón (`/students/bulk`), con
  campo `cedula` limpiado a dígitos (`cleanCedula`) y textos/label a "Estudiantes".
- Se elimina la dependencia de `VITE_STUDENTS_API_URL`.

## Impact

- **Archivos:** `src/api/externalStudent.ts`, `src/types/student.ts` (nuevo), `src/utils/csvImport.ts`
  (`cedula` + `cleanCedula`), `src/utils/csvImport.test.ts`, `src/pages/AccesoDirectoImportPage.tsx`
  (envío a `/students/bulk` + textos), `src/components/ui/NavBar.tsx` (label).
- **Contrato backend:** depende de `/students/lookup` y `/students/bulk` (`be-student-padron`).
- **Sin cambios** en el registro de consumos ni en `studentApi.registerDining`/`studentToIdentity`.
- **Ruta:** se mantiene el slug `/accesos_directos/importar`; solo cambia el label a
  "Importar Estudiantes (CSV)".
