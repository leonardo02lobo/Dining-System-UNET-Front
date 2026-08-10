## Why

El panel decide qué se puede hacer mirando el **rol**, aunque la pantalla se haya concedido por
permiso. `LunchSessionPage` es el caso vivo:

```typescript
const canOpen = isAdmin || role === 'TAQUILLERO'
```

A un usuario con rol `ACCESO_DIRECTO` se le concedió `/comedor/sesion`, entró —porque `canAccess` da
prioridad al permiso explícito— y se encontró con "No tienes permisos para abrir o cerrar sesiones".
Peor todavía: la petición del listado devolvió 403, el `catch` se lo tragó y la pantalla anunció "No
tienes ninguna sesión abierta". Conceder la pantalla produjo una vista que **miente dos veces**.

El problema es de modelo, no de esa pantalla: `canAccess` ya resuelve por permiso, pero las decisiones
dentro de cada vista se toman con `user.role.name`. Son dos criterios distintos para la misma
pregunta.

## What Changes

- **Helper `useCan()`** sobre `AuthContext`, que ya tiene la lista de permisos: `can('/comedor/sesion')`
  y `canAny('/comedor/registrar', '/comedor/consultar')`. Resuelve con la misma precedencia que
  `canAccess` —permiso explícito por usuario, y si no, la lista estática de roles—, de modo que el
  cliente y el servidor contesten lo mismo.
- **`LunchSessionPage` deja de mirar el rol para abrir**: `canOpen` pasa a ser
  `can('/comedor/sesion')`. Lo que sigue mirando el rol es lo que el backend también mira por rol: el
  cierre forzado (SUPER_ADMIN) y la excepción de las sesiones sin propietario (administradores).
- **`isOwner` se mantiene tal cual**: la propiedad del cierre nunca dependió del rol y no cambia.
- **El vacío deja de mentir**: cuando el listado falle con 403, la pantalla SHALL decir que no hay
  acceso, no que no hay sesiones. Un estado vacío que confunde "no tienes permiso" con "no hay nada"
  hace perder media hora a quien configura el sistema — ya la hizo perder.
- **Barrido del resto de comprobaciones de rol en pantallas**: `canManage` y equivalentes en las vistas
  que las tengan pasan a permiso, para que ninguna vuelva a divergir del servidor.

## Capabilities

### New Capabilities
- `permisos-conceden-capacidad-front`: la interfaz decide por permiso de pantalla, no por rol.

### Modified Capabilities
- `sesion-vista-taquillero`: la pantalla de sesión deja de razonar por rol al decidir quién abre, y su
  estado vacío distingue "sin acceso" de "sin sesiones".

## Impact

- **Archivos nuevos:** `src/hooks/useCan.ts`.
- **Archivos modificados:** `src/pages/LunchSessionPage.tsx`, `src/config/routeAccess.ts` (extraer la
  resolución para reutilizarla), y las pantallas con comprobaciones de rol embebidas
  (`AccesoDirectoPage`, `StudentsPage`, `ListUser`, `ExternalPeoplePage`, `SedesPage`,
  `CareerCatalogPage`, `SuspendedListPage`).
- **Dependencia dura del backend:** consume el mapa de `be-permisos-conceden-capacidad/design.md`. Las
  rutas que el cliente comprueba SHALL ser exactamente las que el servidor exige; si divergen, la UI
  vuelve a ofrecer botones que dan 403 — el fallo que este cambio existe para eliminar.
- **Sin cambios visibles por defecto.** Los defaults por rol no se tocan, así que cada usuario ve
  exactamente lo mismo que hoy. Lo que cambia es que conceder una pantalla ahora también enciende sus
  acciones.
- **Alcance (acotado):** NO se toca `ProtectedRoute`, `NavBar` ni `canAccess`, que ya resuelven por
  permiso y funcionan.

## Non-goals

- Reproducir en el cliente la lógica de autoría del cierre. Ya se deriva de `opened_by_id` solo para
  rotular, y la autoridad sigue siendo el 403 del servidor.
- Ocultar acciones que el backend permita. El cliente puede ser **más** informativo, nunca más
  permisivo: ante la duda, muestra y deja que el servidor responda.
- Cambiar los valores por defecto de cada rol.
