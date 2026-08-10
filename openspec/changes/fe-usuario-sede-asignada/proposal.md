## Why

En Registro al Comedor lo primero que hay que hacer cada día es elegir la sede en un desplegable. La
respuesta es siempre la misma —el taquillero trabaja donde trabaja— así que no es una elección: es
una configuración puesta en el sitio equivocado, y con ella la posibilidad de equivocarse.

Cuando alguien se equivoca, no hay aviso. Media fila queda registrada en el comedor que no es, y el
reporte de esa sede sale mal sin que nadie lo note hasta el cierre.

Lo único que hoy recuerda esa elección es una clave del navegador (`localStorage.selected_sede_id`).
Se pierde al limpiar el navegador, no viaja con la persona a otro equipo, y no la conoce nadie más
que ese navegador.

## What Changes

- **El selector de sede desaparece de `/comedor/registrar`** y lo sustituye un **rótulo** con la sede
  en la que está el usuario, tomada de su cuenta.
- **`localStorage.selected_sede_id` se elimina.** Dejaba de significar nada en cuanto la sede la manda
  la cuenta, y era la única clave que el proyecto guardaba en el navegador: con ella desaparece esa
  excepción entera.
- **Sin sede asignada, la pantalla lo dice y se bloquea.** El campo de cédula queda deshabilitado y un
  aviso explica que hay que pedir la asignación a un administrador. No se ofrece un selector de
  respaldo: sería devolver por la interfaz lo que el servidor acaba de retirar.
- **`/comedor/sesion` conserva su selector**, acotado: para quien no administra solo ofrece su propia
  sede; para un administrador, todas. Ahí la sede sí es una elección real.
- **La pantalla de usuarios gana el campo Sede**, visible solo para SUPER_ADMIN, que es quien el
  servidor deja asignarla.
- **La sede viaja en `AuthContext`**, junto al usuario y sus permisos, para que cualquier pantalla
  pueda mostrarla sin volver a pedirla.

## Capabilities

### New Capabilities
- `sede-del-usuario-front`: la sede se muestra, no se elige; la pantalla se bloquea con un motivo
  legible cuando falta; la asignación se gestiona desde la administración de usuarios.

### Modified Capabilities
- `registro-comedor-ocultar-campos-consulta`: ya no hay selector de sede que ocultar al consultar a
  alguien; el rótulo de la sede pasa a estar visible siempre.

## Impact

- **Archivos nuevos:** `src/components/SedeLabel.tsx`.
- **Archivos modificados:** `src/pages/RegisterDining.tsx` (fuera el selector, el estado de sede y la
  clave de `localStorage`), `src/components/SedeSelector.tsx` (acotado por sede propia),
  `src/pages/LunchSessionPage.tsx`, `src/components/UserFormModal.tsx`, `src/pages/ListUser.tsx`,
  `src/context/AuthContext.tsx`, `src/types/user.ts`.
- **Dependencia dura del backend:** consume `be-usuario-sede-asignada`. Los dos SHALL desplegarse
  juntos, y **las sedes SHALL asignarse antes**: sin asignar, la taquilla queda parada por diseño.
- **Interacción con `fe-layout-sin-scroll`:** quitar el selector libera una fila del registro. Es una
  ayuda para el otro cambio, no su solución.
- **`CLAUDE.md` §6 deja de ser cierto**: dice que `selected_sede_id` es la única clave persistida.
  Tras esto no queda ninguna.

## Non-goals

- Permitir cambiar de sede desde la interfaz «solo por hoy». Sería reintroducir el error que el cambio
  elimina.
- Acotar por sede los reportes, el historial o las estadísticas.
- Un selector para quien tenga varias sedes: el modelo es de una sola.
