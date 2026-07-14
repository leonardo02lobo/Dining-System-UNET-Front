## 1. Capa de tipos y API

- [x] 1.1 Añadir `LunchTemplateUpdatePayload` en `src/types/lunch.ts` (name?, basePlatesQuantity?, platesQuantity?)
- [x] 1.2 Añadir `getLunchTemplate`, `updateLunchTemplate`, `deleteLunchTemplate` en `src/api/lunch.ts`

## 2. Página de gestión

- [x] 2.1 Crear `src/pages/LunchTemplatesPage.tsx`: carga async (IIFE), tabla `ui/Table` con nombre/fecha/platos base/nº ingredientes y estados loading/error/vacío
- [x] 2.2 Modal de edición (nombre + platos base) con `PATCH` y refresco del listado
- [x] 2.3 Modal de confirmación de borrado con `DELETE`; mostrar error si la plantilla está referenciada

## 3. Navegación y acceso

- [x] 3.1 Añadir ruta `inventario/plantillas` en `App.tsx`
- [x] 3.2 Añadir entrada "Plantillas" al grupo Inventario en `NavBar.tsx`
- [x] 3.3 Añadir `'/inventario/plantillas': ['SUPER_ADMIN','ADMIN']` en `routeAccess.ts`

## 4. Validación

- [ ] 4.1 Verificar listar/editar/eliminar end-to-end (requiere backend)
- [x] 4.2 Build verde: `npm run build`
