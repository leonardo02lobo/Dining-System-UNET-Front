## Why

El frontend tiene un apartado dedicado **"Suspender Usuario"** (`SuspendStudent.tsx`, ruta
`/suspendStudent`, ítem de navegación en el grupo *Comedor*). El cliente pidió **eliminarlo**: la
suspensión ya se realiza de forma más directa desde el **registro al comedor** (suspensión rápida)
y desde la gestión de accesos, por lo que la pantalla dedicada es redundante y confunde.

## What Changes

- Se **elimina la pantalla** `SuspendStudent.tsx` y su **ruta** `/suspendStudent` en `App.tsx`
  (incluyendo cualquier alias/redirect que apunte a ella).
- Se **retira el ítem de navegación** "Suspender Usuario" del `NavBar`.
- Se **quita la entrada** `/suspendStudent` de `config/routeAccess.ts` (queda sincronizado con el
  catálogo del backend, gemelo `be-permisos-catalogo-rutas`).
- Se **conserva** "Usuarios Suspendidos" (`/suspendidos`) —consulta del listado de suspendidos— y
  la **suspensión rápida** dentro de `RegisterDining` (no forman parte del apartado eliminado).

## Capabilities

### New Capabilities
- `eliminar-suspender-usuario`: retirar del frontend el apartado dedicado de suspensión de usuario
  (pantalla, ruta y navegación), manteniendo el listado de suspendidos y la suspensión rápida del
  registro.

## Impact

- **Archivos afectados:** `src/pages/SuspendStudent.tsx` (borrado), `src/App.tsx` (ruta/redirect),
  `src/components/ui/NavBar.tsx` (ítem), `src/config/routeAccess.ts` (entrada). Revisar imports
  colgantes (`SuspendConfirmModal` si sólo lo usaba esta pantalla).
- **Coordinación:** alineado con `be-permisos-catalogo-rutas` (retira `/suspendStudent` del
  catálogo) y con `fe-permisos-sincronizar-catalogo`.
- Sin cambios de backend en esta change (la ruta era sólo de UI).
