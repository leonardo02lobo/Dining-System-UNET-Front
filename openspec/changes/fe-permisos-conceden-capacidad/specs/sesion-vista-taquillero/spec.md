## REMOVED Requirements

### Requirement: El taquillero puede abrir sesiones de servicio

**Reason**: El requisito ataba la acción de abrir a un rol concreto (`canOpen = isAdmin || role ===
'TAQUILLERO'`). Ese es exactamente el código que dejó a un usuario con `/comedor/sesion` concedida
mirando "No tienes permisos para abrir o cerrar sesiones". Con el permiso de pantalla concediendo
capacidad, quién puede abrir lo decide la ruta, no el rol.

**Migration**: Sustituido por "Abrir una sesión se ofrece a quien tiene la pantalla concedida", en
esta misma capacidad.

## ADDED Requirements

### Requirement: Abrir una sesión se ofrece a quien tiene la pantalla concedida

`LunchSessionPage` SHALL ofrecer la acción de abrir sesión a todo usuario que tenga concedida la ruta
`/comedor/sesion`, con independencia de su rol.

La condición NO SHALL enumerar roles. Enumerarlos es lo que hacía que conceder la pantalla a un rol no
previsto abriera una vista incapaz de operar.

Cuando el usuario no tenga la ruta, la pantalla SHALL explicar que le falta el permiso, en lugar de
afirmar que no tiene permisos "para abrir o cerrar sesiones" sin decir cuál.

#### Scenario: Un acceso directo con la pantalla concedida puede abrir

- **GIVEN** un usuario con rol `ACCESO_DIRECTO` y `/comedor/sesion` concedida
- **WHEN** entra en la pantalla de sesión
- **THEN** la acción de abrir sesión está disponible

#### Scenario: El taquillero sigue pudiendo abrir

- **GIVEN** un TAQUILLERO con sus rutas por defecto
- **WHEN** entra en la pantalla
- **THEN** la acción de abrir sesión está disponible

#### Scenario: Sin la ruta concedida

- **GIVEN** un usuario que llegó a la pantalla sin tener `/comedor/sesion`
- **WHEN** se muestra la pantalla
- **THEN** la acción de abrir no se ofrece
- **AND** se explica qué pantalla necesita que le concedan

## MODIFIED Requirements

### Requirement: El taquillero solo ve las sesiones que abrió

La pantalla SHALL mostrar a quien **no** es SUPER_ADMIN ni ADMIN únicamente las sesiones abiertas por
él mismo, tal y como las devuelve el servidor para ese usuario.

El criterio SHALL ser "administrador o no", y no la enumeración de un rol: desde que cualquier rol
puede recibir la pantalla, nombrar al taquillero deja fuera a los demás.

El cliente NO SHALL filtrar por su cuenta el listado recibido. El servidor ya lo acota; duplicar la
regla crearía una segunda fuente de verdad que puede divergir.

Cuando el usuario no tenga ninguna sesión abierta, la pantalla SHALL mostrar un estado vacío que NO
SHALL sugerir que existan sesiones abiertas de otros, y que SHALL distinguirse del mensaje de falta de
acceso.

La pantalla SHALL indicar a quien no administra que solo se muestran las sesiones que él abrió, para
que un listado vacío no se lea como "no hay servicio en ninguna sede".

#### Scenario: Usuario no administrador con una sesión propia

- **GIVEN** tres sedes con sesión abierta, una de ellas abierta por quien consulta
- **WHEN** entra en la pantalla
- **THEN** ve una única sesión, la suya
- **AND** no ve la sede, la hora de apertura ni los platos de las otras dos

#### Scenario: Acceso directo con la pantalla concedida

- **GIVEN** un usuario con rol `ACCESO_DIRECTO` y `/comedor/sesion`, que abrió una sesión
- **WHEN** entra en la pantalla
- **THEN** ve solo su sesión, igual que un taquillero

#### Scenario: Sin sesión propia

- **GIVEN** dos sedes con sesión abierta por otros usuarios
- **WHEN** un usuario no administrador entra en la pantalla
- **THEN** ve el estado vacío y la nota de que solo se muestran sus sesiones
- **AND** el estado vacío no menciona ni insinúa las sesiones ajenas

#### Scenario: El administrador conserva el panorama completo

- **GIVEN** tres sedes con sesión abierta
- **WHEN** un ADMIN entra en la pantalla
- **THEN** ve las tres sesiones
