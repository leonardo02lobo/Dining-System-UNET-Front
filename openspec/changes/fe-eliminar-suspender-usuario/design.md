## Context

El apartado a eliminar es la pantalla dedicada `SuspendStudent.tsx` (ruta `/suspendStudent`),
listada en `NavBar` como "Suspender Usuario" y en `routeAccess.ts`. La suspensión también existe
en dos sitios que **permanecen**: la **suspensión rápida** dentro de `RegisterDining` (modal con
motivo) y el listado **"Usuarios Suspendidos"** (`/suspendidos`, `SuspendedListPage`). El backend de
sanciones (`sanctionApi`) no cambia.

## Goals / Non-Goals

**Goals:**
- Quitar por completo la pantalla, ruta y navegación del apartado "Suspender Usuario".
- Mantener el resto del sistema de suspensión intacto y sin imports rotos.

**Non-Goals:**
- No tocar la suspensión rápida de `RegisterDining` ni el listado de suspendidos.
- No eliminar endpoints de sanción del backend.

## Decisions

### D1 — Borrado limpio, no ocultar

Se elimina el archivo de la pantalla y su ruta, en vez de sólo ocultar el ítem del menú, para no
dejar código muerto ni una ruta accesible por URL directa.

### D2 — Revisar componentes compartidos

`SuspendConfirmModal` u otros helpers: si sólo los usaba `SuspendStudent`, se eliminan; si los
comparte la suspensión rápida u otra vista, se conservan. Se verifica con una búsqueda de
referencias antes de borrar.

### D3 — Sincronía con el catálogo de permisos

Quitar `/suspendStudent` de `routeAccess.ts` para no ofrecer una ruta inexistente en la gestión de
permisos; el gemelo de backend hace lo propio en su catálogo.

## Risks / Trade-offs

- **Enlaces/planillas que apunten a `/suspendStudent`** → tras el borrado dan 404 de router; se
  revisa que no haya `NavLink`/redirect restante.
- **Import colgante** de la pantalla borrada → el build en modo estricto lo detecta.

## Open Questions

- ¿"Usuarios Suspendidos" (`/suspendidos`) debe permanecer? Se asume que **sí** (es consulta, no el
  apartado de suspender). Confirmar si también debe retirarse.
