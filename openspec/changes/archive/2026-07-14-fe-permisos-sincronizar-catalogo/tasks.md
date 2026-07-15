## 1. Sincronizar el catálogo

- [x] 1.1 Auditar rutas del `NavBar`/`App.tsx` ausentes en `ROUTE_ACCESS`
- [x] 1.2 Añadir las rutas faltantes con sus roles por defecto (paridad con el backend)
- [x] 1.3 Quitar `/suspendStudent` de `ROUTE_ACCESS`

## 2. Mejorar la pantalla de permisos

- [x] 2.1 Agrupar rutas por sección y permitir buscar en `PermissionsPage`
- [x] 2.2 Dar feedback claro al guardar (banners de éxito/error)
- [ ] 2.3 (Pendiente) Mostrar estado por defecto vs. override — requiere que el backend exponga el override por permiso
- [x] 2.3 Verificar el flujo seleccionar usuario → editar → guardar contra `api/permissions.ts`

## 3. Validación

- [x] 3.1 Verificar que el `NavBar` no muestra `/suspendStudent` y sí las rutas añadidas según rol
- [x] 3.2 Verificar paridad FE/BE del catálogo
- [x] 3.3 Build verde: `npm run build`
