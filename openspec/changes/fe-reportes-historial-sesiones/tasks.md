## 1. API y tipos

- [x] 1.1 `Consumption` incluye datos de persona (`document_id`, `first_name`, `last_name`, `career`, `is_priority`)
- [x] 1.2 `consumptionApi.list` acepta `session_id`/`from_date`/`to_date`/`is_priority`
- [x] 1.3 `lunchSessionApi.listByRange({from_date, to_date})`

## 2. Página e integración

- [x] 2.1 `SessionHistoryPage` con filtro de fechas + tabla de sesiones (orden fecha desc)
- [x] 2.2 Detalle de entrantes por sesión (tabla cédula/apellido/nombre/carrera)
- [x] 2.3 Util `pdfSessionEntrants.ts` + botón "Descargar PDF"
- [x] 2.4 Ruta `/comedor/historial`, entrada en NavBar (Comedor) y `routeAccess` SUPER_ADMIN/ADMIN

## 3. Validación

- [ ] 3.1 Verificar historial/detalle/PDF end-to-end (requiere backend)
- [x] 3.2 Build verde: `npm run build`
