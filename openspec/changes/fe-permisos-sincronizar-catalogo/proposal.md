## Why

La gestión de permisos del frontend se apoya en `config/routeAccess.ts` (`ROUTE_ACCESS`, catálogo
de rutas + roles por defecto) y en `PermissionsPage` (editor de overrides por usuario). El catálogo
quedó **desalineado** con las rutas reales: hay rutas nuevas sin registrar y una ruta que se retira
(`/suspendStudent`, ver `fe-eliminar-suspender-usuario`). Además, el cliente pidió **mejorar la
pantalla de permisos**. Es el lado frontend de "Actualizar la gestión de permisos".

## What Changes

- **Sincronizar el catálogo** `ROUTE_ACCESS` con las rutas reales de la app:
  - **Quitar** `/suspendStudent`.
  - **Añadir** las rutas presentes en el `NavBar`/rutas de `App.tsx` que falten en `ROUTE_ACCESS`
    (p. ej. `/comedor/registro-manual`, `/inventario/general`, `/inventario/reportes-consumo`,
    `/inventario/pruebas-almuerzo`, `/inventario/plantillas`, `/admin/plantilla-correo`, `/sedes`,
    etc.), con sus roles por defecto, en paridad con el catálogo del backend (`be-permisos-catalogo-rutas`).
- **Mejorar `PermissionsPage`**: presentación clara del catálogo, edición y guardado de overrides
  por usuario (agrupar por sección, buscar ruta, estado por defecto vs. override, feedback de
  guardado), consumiendo `api/permissions.ts`.
- Mantener `canAccess` como está (rol por defecto + override), asegurando que no ofrezca rutas
  retiradas.

## Capabilities

### New Capabilities
- `permisos-sincronizar-catalogo`: catálogo de rutas del frontend alineado con las rutas reales y
  con el backend, y una pantalla de gestión de permisos clara para editar overrides por usuario.

## Impact

- **Archivos afectados:** `src/config/routeAccess.ts`, `src/pages/PermissionsPage.tsx`,
  `src/api/permissions.ts`, `src/components/ui/NavBar.tsx` (verificar paridad de rutas).
- **Coordinación:** gemelo de `be-permisos-catalogo-rutas` (fuente del contrato) y alineado con
  `fe-eliminar-suspender-usuario`.
- Riesgo: bajo/medio; el catálogo es declarativo y la pantalla ya existe.
