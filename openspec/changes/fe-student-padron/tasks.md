## 1. API del padrón (backend)

- [x] 1.1 `externalStudentApi.lookup` → `GET /students/lookup?q=` vía `apiClient` (conserva firma)
- [x] 1.2 `mapExternalToStudent` adaptado al shape del backend (`StudentPadronData`)
- [x] 1.3 `externalStudentApi.bulkCreate` → `POST /students/bulk`; tipos en `src/types/student.ts`
- [x] 1.4 Quitar la dependencia de `VITE_STUDENTS_API_URL`

## 2. Importación CSV → estudiantes

- [x] 2.1 `csvImport.ts`: campo `cedula` + `cleanCedula` (dígitos); shape `StudentBulkItem`
- [x] 2.2 `AccesoDirectoImportPage`: envío con `externalStudentApi.bulkCreate`, resultado
      `StudentBulkResult`, celdas/errores con `cedula`, textos a "Estudiantes"
- [x] 2.3 Label del navbar → "Importar Estudiantes (CSV)"
- [x] 2.4 Actualizar `csvImport.test.ts`

## 3. Verificación

- [x] 3.1 `npx tsc --noEmit`
- [x] 3.2 `npx vitest run src/utils/csvImport.test.ts`
- [x] 3.3 `npm run build`
- [x] 3.4 `openspec validate fe-student-padron --strict`
