## Why

Tres huecos del panel sobre el control de turno y el módulo de accesos directos:

1. **`/accesos_directos` no dice quién entró.** La pantalla es un CRUD del padrón de personas con
   acceso directo y nada más. Para saber quién de ellas pasó hoy por taquilla hay que irse al reporte
   de comedor, filtrar y volver. La pregunta operativa ("¿quién acaba de entrar?") no tiene respuesta
   en el sitio donde se hace.

2. **`LunchSessionPage` le enseña a cada taquillero lo que hacen las demás taquillas.** La pantalla
   pinta la lista completa de sesiones abiertas —sede, hora de apertura, platos planificados— para
   cualquiera que entre, y `/comedor/sesion` está concedida al TAQUILLERO en `ROUTE_ACCESS`. Encima,
   `canManage` es `SUPER_ADMIN || ADMIN`, así que el taquillero ve ese panorama completo y **no puede
   hacer nada con él**: ni abrir, ni cerrar. Es la peor combinación posible de las dos.

3. **Nada distingue al dueño de una sesión.** El botón "Cerrar" aparece igual para cualquier ADMIN,
   sin decir quién abrió la sesión ni que existe una regla al respecto — porque hoy no existe.

De paso, el subtítulo de la pantalla sigue anunciando un *"Cooldown de 12h por sede entre cierres y
aperturas"* que se eliminó del backend hace tiempo: describe una regla que ya no rige.

## What Changes

- **Panel "Ingresos recientes" en `AccesoDirectoPage`**: tarjeta sobre la tabla del padrón con los
  **últimos 10** ingresos de personas del módulo (persona, cédula, tipo, motivo de acceso, sede,
  origen taquilla/manual y hora), un conmutador **"Solo prioritarios"** y un botón de refrescar.
  Alimentado por el nuevo `GET /accesos_directos/recent-entries`.
- **`LunchSessionPage` consciente del rol**:
  - `canOpen` pasa a incluir `TAQUILLERO`, que ya puede abrir sesiones en el backend.
  - El taquillero ve **solo la sesión que él abrió**. El listado llega ya filtrado del servidor; el
    cliente no reproduce la regla, solo deja de pedir lo que no le corresponde.
  - El calendario de historial (`lunchSessionApi.list`) **no se carga** para el taquillero: es un
    endpoint ADMIN+ cuyo 403 hoy se traga un `catch {}` vacío.
  - El selector de sede del modal de apertura se alimenta de `GET /lunch-sessions/openable-sedes` en
    lugar de calcular el complemento con `excludeIds`. Con la lista de sesiones abiertas ya filtrada
    por rol, ese cálculo dejaría al taquillero eligiendo una sede ocupada y chocando contra el 409.
- **Cierre solo para el que abrió**: el botón "Cerrar" queda deshabilitado y rotulado
  *"Solo {nombre} puede cerrar esta sesión"* cuando `opened_by_id` no es el usuario en sesión. El 403
  del servidor sigue siendo la autoridad; la UI solo evita el intento inútil.
- **Cierre forzado para SUPER_ADMIN**: acción secundaria sobre las sesiones ajenas, con modal de
  motivo obligatorio (mínimo 10 caracteres) y aviso de que la acción queda registrada en auditoría.
- **Subtítulo corregido**: fuera la mención al cooldown de 12 h; en su lugar, la regla que sí rige
  (una sesión abierta por sede; la cierra quien la abrió).

## Capabilities

### New Capabilities
- `accesos-directos-ingresos-recientes-front`: panel de últimos ingresos dentro del módulo de accesos
  directos.
- `sesion-vista-taquillero`: qué ve y qué puede hacer cada rol en la pantalla de sesión.
- `sesion-cierre-propietario-front`: cierre restringido al autor y cierre forzado auditado.

## Impact

- **Archivos modificados:** `src/pages/AccesoDirectoPage.tsx`, `src/pages/LunchSessionPage.tsx`,
  `src/api/acceso_directo.ts`, `src/api/lunchSession.ts`, `src/types/acceso_directo.ts`,
  `src/types/lunchSession.ts`, `src/components/SedeSelector.tsx`.
- **Sin cambios en `ROUTE_ACCESS`.** `/comedor/sesion` ya incluye a `TAQUILLERO`, y su gemela de
  `_PERMISSIONS` en el backend también. Lo que cambia es lo que la pantalla *hace* con ese rol, no
  quién entra.
- **Dependencia dura del backend:** este cambio consume el contrato de
  `be-sesiones-propiedad-y-accesos-recientes/design.md`. Ambos se desarrollan en paralelo, así que
  esas formas son normativas y no se negocian sobre la marcha. En particular, la UI **no** replica la
  regla de autoría como lógica de negocio: la deriva de `opened_by_id` solo para explicar el bloqueo.
- **Alcance (acotado):** NO se toca `RegisterDining` —ya llama a `lunchSessionApi.today(sedeId)` con
  la sede seleccionada, que es lo que el backend pasa a exigir al taquillero—, ni `SessionHistoryPage`
  (ya era ADMIN+), ni el flujo de registro de consumo.

## Non-goals

- Ocultarle al taquillero el catálogo de sedes. `GET /sedes` sigue abierto y el `SedeSelector` de las
  pantallas de taquilla depende de él; la fuga residual que eso deja está asumida y razonada en el
  `design.md` del backend, §2.
- Paginar o filtrar por fecha el panel de ingresos recientes. Son los últimos diez; el reporte de
  comedor es el sitio para consultas históricas.
- Dar al taquillero ninguna vía de cerrar sesiones ajenas, ni siquiera de su misma sede.
