## Why

No existe una pantalla dedicada para administrar las plantillas de almuerzo; hoy solo se
listan/cargan desde "Crear servicio de alimentación". El cliente pidió una **ventana en la
sección de inventario para el CRUD de plantillas** para mantener el orden, sobre todo con la
creación automática de plantillas del issue #11 (issue **#12** de `issues_reunion.md`).

El backend ya expone el CRUD de `/lunch-templates` (`list/get/create/patch/delete`), así que
esta change es de frontend (más completar los métodos de API que falten en `src/api/lunch.ts`).

Decisiones de Fase 0 (plan `plan-issues-reunion`): campos editables **nombre, platos base e
ingredientes**; **bloquear el borrado** de una plantilla referenciada (regla del backend; la
UI muestra el error).

## What Changes

- Se completan en `src/api/lunch.ts` los métodos `getLunchTemplate`, `updateLunchTemplate` y
  `deleteLunchTemplate` sobre `/lunch-templates`.
- Se crea la página `LunchTemplatesPage` (ruta `/inventario/plantillas`) con:
  - **Listado** de plantillas (`ui/Table`): nombre, fecha, platos base, nº de ingredientes.
  - **Editar** nombre y platos base vía `Modal` (`PATCH`).
  - **Eliminar** con confirmación (`Modal`); si el backend rechaza por estar referenciada,
    se muestra el mensaje de error.
- Se añade la ruta en `App.tsx`, la entrada en el grupo "Inventario" del `NavBar` y el acceso
  por rol en `routeAccess` (igual que las demás rutas de inventario: `SUPER_ADMIN`, `ADMIN`).

**Fuera de alcance de esta primera entrega** (documentado): crear una plantilla desde cero y
la edición completa de ingredientes, que reutilizarían el editor de ingredientes de
`CreateLunchPage` (mayor esfuerzo, solapa con #10/#11). Se entregan como sub-entrega posterior.

## Capabilities

### New Capabilities
- `plantillas-crud-inventario`: ventana en inventario para listar, editar (nombre/platos base)
  y eliminar plantillas de almuerzo, consumiendo el CRUD existente de `/lunch-templates`.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos afectados:** `src/types/lunch.ts` (payload de update), `src/api/lunch.ts`
  (get/update/delete), nueva `src/pages/LunchTemplatesPage.tsx`, `src/App.tsx` (ruta),
  `src/components/ui/NavBar.tsx` (entrada), `src/config/routeAccess.ts` (acceso).
- **Backend:** sin cambios (CRUD ya existe). Riesgo: bajo-medio.
