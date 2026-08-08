> **Requisito previo:** `be-permisos-conceden-capacidad` aplicado. Sin las guardas migradas, el
> cliente ofrecería acciones que el servidor sigue rechazando por rol.

## 1. Helper de permisos

- [x] 1.1 `src/hooks/useCan.ts` con `can(ruta)` y `canAny(...rutas)` sobre `AuthContext`
- [x] 1.2 Se apoya en `canAccess` — **no** reimplementar la precedencia permiso/rol, que es la misma
      que aplica el servidor y dos copias acabarían divergiendo
- [x] 1.3 `can` devuelve `false` sin usuario cargado, para no ofrecer acciones durante la carga

## 2. `LunchSessionPage`

- [x] 2.1 `canOpen` pasa de `isAdmin || role === 'TAQUILLERO'` a `can('/comedor/sesion')`
- [x] 2.2 `canClose` compone permiso + autoría; `isAdmin` sobrevive **solo** en la excepción de las
      sesiones sin propietario, que es como razona el servidor
- [x] 2.3 `canForce` sigue siendo `role === 'SUPER_ADMIN'` (suelo por rol en el backend)
- [x] 2.4 `isOwner` intacto: la propiedad del cierre nunca dependió del rol
- [x] 2.5 Texto de "sin permisos" nombrando la pantalla que hay que conceder

## 3. El vacío deja de mentir

- [x] 3.1 `fetchOpenSessions` distingue `403` del resto de errores en lugar de tragárselos todos
- [x] 3.2 403 ⇒ mensaje de acceso denegado nombrando la pantalla; **no** el estado vacío
- [x] 3.3 Otro error ⇒ mensaje del servidor, sin atribuirlo a los permisos
- [x] 3.4 Lista vacía legítima ⇒ estado vacío de siempre, distinto de los dos anteriores
- [x] 3.5 El calendario de historial se pide según `can('/comedor/historial')` en lugar de por
      `isAdmin`. **Corregido durante la aplicación**: el mapa original admitía también
      `/comedor/sesion`, y eso le habría devuelto a quien no administra el historial de todas las
      sedes — el panorama que `GET /open` le retira. La prueba del taquillero lo cazó

## 4. Barrido del resto de pantallas

- [x] 4.1 `AccesoDirectoPage` → `can('/accesos_directos')`; borrado sigue SUPER_ADMIN
- [x] 4.2 `StudentsPage` → `can('/estudiantes')`
- [x] 4.3 `ListUser` → `can('/usuarios')`; editar y borrar cuentas siguen SUPER_ADMIN
- [x] 4.4 `ExternalPeoplePage` → `can('/gente-externa')`; borrado sigue SUPER_ADMIN
- [x] 4.5 `SedesPage` → `can('/sedes')`
- [x] 4.6 `CareerCatalogPage` → `can('/admin/carreras')`
- [x] 4.7 `SuspendedListPage` → `can('/suspendidos')`
- [x] 4.8 Rejilla final: `grep -rn "role.name ===" src/pages` no debe devolver más comprobaciones que
      las del suelo por rol

## 5. Validación

- [x] 5.1 `openspec validate fe-permisos-conceden-capacidad --strict`
- [x] 5.2 `npm run build` en verde
- [x] 5.3 `npm test` sin **nuevas** regresiones (la suite arrastra dos fallos preexistentes:
      `rosterRealFiles.verify.test.ts` y `lunch.test.ts::creates a template only when saveAsTemplate
      is true`)
- [x] 5.4 Pruebas nuevas:
      - un `ACCESO_DIRECTO` con `/comedor/sesion` ve la acción de abrir; sin ella, no
      - un TAQUILLERO con sus defaults sigue viendo la acción de abrir
      - un 403 en el listado muestra el mensaje de acceso y **no** "no tienes ninguna sesión abierta"
      - una lista vacía legítima sí muestra el estado vacío
      - el cierre forzado sigue apareciendo solo para SUPER_ADMIN
      - el borrado sigue apareciendo solo para SUPER_ADMIN en las tres pantallas con borrado
- [x] 5.5 Actualizar las pruebas existentes que fijaban `canOpen` por rol: lo que se afirma pasa a ser
      el permiso, **no** se relaja la afirmación
- [ ] 5.6 Verificación manual del caso que originó el cambio: crear un usuario `ACCESO_DIRECTO`,
      concederle `/comedor/sesion`, abrir una sesión, comprobar que solo ve la suya, cerrarla, y
      comprobar que un SUPER_ADMIN puede forzar el cierre de una que él no abrió
