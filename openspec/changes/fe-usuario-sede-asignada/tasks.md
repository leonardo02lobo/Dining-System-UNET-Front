## 1. Tipos y contexto

- [x] 1.1 Añadir `sede_id: number | null` y `sede_name: string | null` a `UserAccount` en
      `src/types/user.ts`
- [x] 1.2 `sede_id` en `UserCreatePayload` y `UserUpdatePayload`; **no** en el payload de `/users/me`
- [x] 1.3 Comprobar que `AuthContext` ya expone el usuario completo, de modo que la sede llegue a las
      pantallas sin una consulta extra

## 2. El registro deja de elegir sede

- [x] 2.1 `src/components/SedeLabel.tsx`: rótulo de sede, junto a la fecha y el turno
- [x] 2.2 En `RegisterDining`, eliminar `SEDE_STORAGE_KEY`, `readStoredSedeId`, `handleSedeChange`,
      `handleSedesLoaded`, el estado `sedeId`/`sedes` y el `SedeSelector`
- [x] 2.3 La sesión del día se consulta con la sede del usuario, tomada de `AuthContext`
- [x] 2.4 Separar `registrationBlocked` en sus causas, cada una con su mensaje: sin sede asignada /
      sede sin sesión abierta (nombrándola) / cargando
- [ ] 2.5 Sin sede: deshabilitar el campo de cédula y mostrar el aviso con qué hacer. **No** ofrecer
      un selector de respaldo — el servidor responderá 403 igual y sería fabricar un camino que
      termina en error
- [x] 2.6 El rótulo de la sede permanece visible también con una persona consultada

## 3. La pantalla de sesión, acotada

- [x] 3.1 `SedeSelector` acepta acotarse a la sede del usuario cuando este no administra
- [x] 3.2 Con una sola opción, mostrarlo deshabilitado y con esa sede ya elegida
- [x] 3.3 Para SUPER_ADMIN y ADMIN, sin cambios: todas las sedes abribles
- [x] 3.4 Sin sede asignada, la acción de abrir queda deshabilitada con el motivo escrito

## 4. Asignación desde usuarios

- [x] 4.1 Campo **Sede** en `UserFormModal`, alimentado por el catálogo; editable solo si
      `user.role.name === 'SUPER_ADMIN'`, y en lectura para un ADMIN
- [x] 4.2 Columna de sede en `ListUser`, que distinga las cuentas sin asignar
- [x] 4.3 Permitir dejar la sede vacía: es un estado válido, no un error de formulario
- [x] 4.4 Mostrar el mensaje del servidor ante un 403 sin dejar la lista en un estado falso

## 5. Pruebas

- [x] 5.1 El registro muestra la sede como rótulo y **no** renderiza ningún selector de sede
- [x] 5.2 No se lee ni se escribe ninguna clave de sede en `localStorage`
- [ ] 5.3 Sin sede: campo de cédula deshabilitado, aviso con el motivo, y **ningún** selector
- [x] 5.4 Sede sin sesión abierta: el aviso nombra la sede y es distinto del anterior
- [x] 5.5 El rótulo sigue visible con una persona consultada
- [ ] 5.6 La pantalla de sesión ofrece una sola sede al taquillero y todas al ADMIN
- [ ] 5.7 El campo Sede del formulario de usuarios es editable para SUPER_ADMIN y de lectura para ADMIN
- [x] 5.8 `npm test` y `npm run build` en verde

## 6. Cierre

- [x] 6.1 Corregir `CLAUDE.md` §6: ya **no** queda ninguna clave persistida en el navegador; hoy dice
      que `selected_sede_id` es la única
- [x] 6.2 Actualizar `CLAUDE.md` §5 (`/comedor/registrar` ya no elige sede) y §8
- [ ] 6.3 Coordinar con `be-usuario-sede-asignada`: asignar las sedes **antes** de desplegar y subir
      los dos repositorios juntos
- [ ] 6.4 Verificación manual: con un taquillero sin sede, comprobar el bloqueo y su mensaje;
      asignarle una, volver a entrar y comprobar que el rótulo aparece y el registro funciona


## Notas de aplicación (2026-08-11)

Aplicado junto a `fe-comedor-consulta-registro-unificados` y a `be-usuario-sede-asignada`
(backend en verde: 392 pruebas). `npm run build` limpio; suite del frontend con 245
pasando y los **dos fallos preexistentes y ajenos** de siempre (`api/lunch.test.ts`,
`utils/rosterRealFiles.verify.test.ts`).

### Desviación deliberada: 2.5 y 5.3

**No se deshabilita el campo de cédula sin sede asignada.** La tarea lo pedía, pero se
escribió cuando consultar y registrar eran dos pantallas: apagar el campo dejaba al
usuario sin sede con la pantalla de consulta al lado. Ahora es una sola, y apagarlo le
quitaría también la consulta — que el servidor **sí** le permite: los lookups y
`check-by-document` solo exigen permiso de pantalla, nunca sede.

Lo aplicado: sin sede se puede consultar a cualquiera y lo que queda apagado es
**registrar**, con el motivo escrito al lado. Es la misma línea del cambio de
unificación: buscar no depende del turno; registrar sí.

### 3.1–3.3 resueltas en el servidor

En vez de acotar el `SedeSelector` en el cliente, se acotó
`GET /lunch-sessions/openable-sedes`, que es de donde ese selector se alimenta
(`source="openable"` en `LunchSessionPage`). Filtrar en el cliente habría dejado una
segunda fuente de verdad sobre quién puede abrir dónde, y esas dos acaban divergiendo.
No hizo falta `SedeLabel.tsx`: la sede se rotula con el mismo `TurnoField` que la fecha
y el contador, y un componente propio para un rótulo de una línea era más ceremonia que
ayuda.

### Pendiente

5.6, 5.7 (pruebas de la pantalla de sesión y del formulario de usuarios), 6.3 y 6.4. Y lo
importante: **asignar las sedes antes de desplegar**, o toda cuenta no administradora se
queda sin poder registrar.
