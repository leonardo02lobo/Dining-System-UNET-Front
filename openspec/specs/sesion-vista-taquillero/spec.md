# sesion-vista-taquillero Specification

## Purpose
TBD - created by archiving change fe-sesiones-propiedad-y-accesos-recientes. Update Purpose after archive.
## Requirements
### Requirement: El taquillero puede abrir sesiones desde la pantalla de sesión

`LunchSessionPage` SHALL ofrecer la acción "Abrir Sesión" al rol `TAQUILLERO`, además de a
SUPER_ADMIN y ADMIN.

La condición que hoy gobierna las acciones de la pantalla (`canManage = SUPER_ADMIN || ADMIN`) SHALL
separarse en dos: la de **abrir**, que incluye al taquillero, y la de **cerrar**, que depende de la
autoría de cada sesión y se especifica en `sesion-cierre-propietario-front`.

El texto "Solo los administradores pueden abrir o cerrar sesiones" SHALL desaparecer para el
taquillero, porque deja de ser cierto.

#### Scenario: El taquillero ve el botón de abrir

- **GIVEN** un usuario con rol `TAQUILLERO` en `/comedor/sesion`
- **WHEN** la pantalla termina de cargar
- **THEN** el botón "Abrir Sesión" está disponible

#### Scenario: El taquillero abre una sesión

- **GIVEN** una sede disponible
- **WHEN** el taquillero la selecciona y confirma la apertura
- **THEN** se notifica el éxito y la sesión aparece en su listado

### Requirement: El taquillero solo ve las sesiones que abrió

La pantalla SHALL mostrar al `TAQUILLERO` únicamente las sesiones abiertas por él mismo, tal y como
las devuelve `GET /lunch-sessions/open` para ese rol.

El cliente NO SHALL filtrar por su cuenta el listado recibido. El servidor ya lo acota; duplicar la
regla en la UI crearía una segunda fuente de verdad que puede divergir.

Cuando el taquillero no tenga ninguna sesión abierta, la pantalla SHALL mostrar un estado vacío que
NO SHALL sugerir que existan sesiones abiertas de otros usuarios.

La pantalla SHALL indicar al taquillero que solo se muestran las sesiones que él abrió, para que un
listado vacío no se lea como "no hay servicio en ninguna sede".

#### Scenario: Taquillero con una sesión propia

- **GIVEN** tres sedes con sesión abierta, una de ellas abierta por el taquillero
- **WHEN** el taquillero entra en la pantalla
- **THEN** ve una única sesión, la suya
- **AND** no ve la sede, la hora de apertura ni los platos de las otras dos

#### Scenario: Taquillero sin sesión propia

- **GIVEN** dos sedes con sesión abierta por otros usuarios
- **WHEN** el taquillero entra en la pantalla
- **THEN** ve el estado vacío y la nota de que solo se muestran sus sesiones
- **AND** el estado vacío no menciona ni insinúa las sesiones ajenas

#### Scenario: El administrador conserva el panorama completo

- **GIVEN** tres sedes con sesión abierta
- **WHEN** un ADMIN entra en la pantalla
- **THEN** ve las tres sesiones, como hasta ahora

### Requirement: El historial no se pide para roles que no pueden verlo

La pantalla SHALL cargar el calendario de historial (`GET /lunch-sessions/`) **solo** cuando el rol
sea SUPER_ADMIN o ADMIN.

Ese endpoint es ADMIN+ y hoy su 403 lo absorbe un bloque `catch` vacío, dejando el calendario en
blanco sin explicación. La pantalla NO SHALL emitir peticiones que sabe de antemano que serán
rechazadas.

Para el `TAQUILLERO`, la sección de historial SHALL sustituirse por la nota de alcance de su vista.

#### Scenario: El taquillero no dispara la petición del historial

- **WHEN** un `TAQUILLERO` entra en la pantalla
- **THEN** no se emite ninguna petición a `GET /lunch-sessions/`
- **AND** en lugar del calendario se muestra la nota de que solo ve sus sesiones

#### Scenario: El administrador sigue viendo el calendario

- **WHEN** un ADMIN entra en la pantalla
- **THEN** el calendario de historial se carga y marca las sesiones pasadas

### Requirement: El selector de apertura usa el catálogo de sedes disponibles

El modal de apertura SHALL alimentar su selector de sede con
`GET /lunch-sessions/openable-sedes` y NO SHALL calcular las sedes libres restando las sesiones
abiertas del catálogo completo.

Ese cálculo era correcto mientras el listado de sesiones abiertas lo traía todo. Con el listado ya
acotado por rol, un taquillero vería como libre una sede ocupada por otro y solo se enteraría al
recibir el 409 tras confirmar.

Cuando no haya ninguna sede disponible, el modal SHALL indicarlo explícitamente y SHALL deshabilitar
la confirmación.

Un 409 al abrir SHALL mostrarse dentro del modal y SHALL provocar una recarga del catálogo de sedes
disponibles, para que el siguiente intento parta de la realidad.

#### Scenario: El taquillero solo ve sedes realmente libres

- **GIVEN** tres sedes activas, dos ocupadas por sesiones de otros usuarios
- **WHEN** un taquillero abre el modal de apertura
- **THEN** el selector ofrece únicamente la sede libre

#### Scenario: No hay sedes disponibles

- **GIVEN** todas las sedes activas con sesión abierta
- **WHEN** se abre el modal
- **THEN** se indica que no hay sedes disponibles porque todas tienen una sesión abierta
- **AND** el botón de abrir queda deshabilitado

#### Scenario: Carrera con otra taquilla

- **GIVEN** una sede que aparecía disponible al abrir el modal
- **WHEN** otro usuario abre una sesión en ella y luego se confirma la apertura
- **THEN** el error de conflicto se muestra dentro del modal
- **AND** el catálogo de sedes disponibles se vuelve a consultar

### Requirement: El subtítulo describe las reglas vigentes

El subtítulo de la pantalla SHALL dejar de anunciar un "Cooldown de 12h por sede entre cierres y
aperturas", regla que ya no rige: el backend la eliminó y una sede puede cerrar y reabrir el mismo
día.

En su lugar SHALL enunciar las reglas que sí aplican: a lo sumo una sesión abierta por sede, y la
cierra quien la abrió.

#### Scenario: El subtítulo ya no menciona el cooldown

- **WHEN** se carga la pantalla con cualquier rol
- **THEN** el subtítulo no menciona ningún cooldown
- **AND** enuncia la regla de una sesión abierta por sede y la de que cierra quien abre

