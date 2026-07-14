## 1. Verificación dirigida

- [x] 1.1 Reproducir el síntoma reportado en `/admin/acceso-estudiantes`
- [x] 1.2 Verificar carga inicial y forma de la respuesta (`{ items, total }`)
- [x] 1.3 Verificar búsqueda por cédula/nombre (debounce, reseteo de página)
- [x] 1.4 Verificar filtros *desde/hasta* (inclusividad, reseteo de página)
- [x] 1.5 Verificar paginación (`skip`/`limit`, total, botones deshabilitados en extremos)
- [x] 1.6 Verificar modal de detalle (todos los campos, foto ausente, badge de registro manual)

## 2. Corrección

- [x] 2.1 Corregir los defectos encontrados en `StudentAccessPage.tsx` / `studentAccess.ts`
- [x] 2.2 Ajustar estados de carga/error/vacío si son incoherentes
- [x] 2.3 Si la causa es el contrato de la API, documentarla como dependencia de backend

## 3. Validación

- [x] 3.1 Verificar cada punto del checklist tras la corrección
- [x] 3.2 Build verde: `npm run build`
