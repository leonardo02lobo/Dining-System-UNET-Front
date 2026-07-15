## Context

`routeAccess.ts` exporta `ROUTE_ACCESS` (mapa ruta → roles), `DEFAULT_ROUTE` por rol y `canAccess`
(devuelve el override del usuario si existe, si no el default por rol). El `NavBar` filtra sus ítems
con `canAccess(item.to, role, permissions)`. `PermissionsPage` edita los overrides por usuario vía
`api/permissions.ts` contra el backend (`/{user_id}/permissions`).

Hoy hay rutas en el `NavBar`/`App.tsx` que **no** están en `ROUTE_ACCESS` (para ellas `canAccess`
devuelve `true` por defecto, sin control), y una ruta (`/suspendStudent`) que se retira.

## Goals / Non-Goals

**Goals:**
- `ROUTE_ACCESS` refleja exactamente las rutas reales, en paridad con el backend.
- `PermissionsPage` presenta y edita overrides de forma clara.

**Non-Goals:**
- No cambiar el mecanismo `canAccess` ni el modelo de overrides.
- No duplicar lógica de autorización del backend (el backend es la fuente del contrato).

## Decisions

### D1 — Paridad 1:1 con el backend

`ROUTE_ACCESS` se alinea ruta a ruta con el catálogo del backend (`be-permisos-catalogo-rutas`).
Se documenta que el backend es la fuente del contrato; el FE lo refleja para el gating de UI.

### D2 — Auditar rutas faltantes desde el NavBar

Se recorre `navGroups` del `NavBar` y las rutas de `App.tsx` para detectar rutas ausentes en
`ROUTE_ACCESS` y añadirlas con sus roles por defecto. Se retira `/suspendStudent`.

### D3 — Mejora de `PermissionsPage`

Agrupar rutas por sección (Comedor/Inventario/Administración), permitir buscar, mostrar el estado
por defecto vs. override y dar feedback claro al guardar. Se mantiene el flujo actual de
selección de usuario → edición → guardado.

## Risks / Trade-offs

- **Añadir una ruta con roles por defecto incorrectos** podría exponer u ocultar de más → se toman
  los roles del catálogo del backend/`ROUTE_ACCESS` existente como referencia y se revisa.
- **Divergencia FE/BE** → se ejecutan ambas changes juntas.

## Open Questions

- ¿La mejora de `PermissionsPage` incluye cambios de UX concretos pedidos por el cliente o basta con
  reflejar el catálogo sincronizado de forma clara? (Se asume lo segundo salvo indicación.)
