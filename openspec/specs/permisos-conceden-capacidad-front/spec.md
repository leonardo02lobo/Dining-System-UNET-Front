# permisos-conceden-capacidad-front Specification

## Purpose
TBD - created by archiving change fe-permisos-conceden-capacidad. Update Purpose after archive.
## Requirements
### Requirement: La interfaz decide por permiso de pantalla


Las pantallas SHALL decidir qué acciones ofrecen consultando el **permiso de ruta** del usuario, y NO
su rol, salvo en las operaciones que el servidor también gobierna por rol.

El sistema SHALL ofrecer un helper que responda `can(ruta)` y `canAny(...rutas)` a partir del contexto
de autenticación.

La resolución SHALL reutilizar la que ya usa el guardado de rutas —permiso explícito por usuario y, a
falta de él, la lista estática por rol—, y NO SHALL reimplementarla. Dos implementaciones de la misma
precedencia acaban divergiendo, y la divergencia se manifiesta como botones que dan 403.

`canAny` SHALL existir porque el servidor tiene endpoints compartidos entre pantallas: el cliente debe
poder preguntar exactamente lo que va a preguntar la guarda.

#### Scenario: Un permiso concedido habilita la acción

- **GIVEN** un usuario con rol `ACCESO_DIRECTO` al que se le concedió `/comedor/sesion`
- **WHEN** abre la pantalla de sesión
- **THEN** la acción de abrir sesión está disponible

#### Scenario: Sin el permiso no se ofrece la acción

- **GIVEN** ese mismo usuario sin esa ruta concedida
- **WHEN** abre la pantalla
- **THEN** la acción de abrir sesión no se ofrece

#### Scenario: Los valores por defecto del rol siguen valiendo

- **GIVEN** un TAQUILLERO sin ajustes explícitos de permisos
- **WHEN** abre la pantalla de sesión
- **THEN** la acción de abrir sesión está disponible, por sus rutas por defecto

#### Scenario: Cualquiera de varias rutas habilita una vista compartida

- **GIVEN** un usuario con `/comedor/registrar` pero sin `/comedor/sesion`
- **WHEN** la pantalla necesita la sesión del día de su sede
- **THEN** la consulta se realiza, porque el endpoint admite cualquiera de las dos

### Requirement: Las operaciones del suelo por rol se siguen comprobando por rol


Las acciones que el servidor gobierna por rol —eliminar usuarios, editar cuentas ajenas, eliminar
accesos directos o personas externas, y forzar el cierre de una sesión— SHALL seguir condicionadas al
rol SUPER_ADMIN en la interfaz.

El criterio SHALL ser siempre el mismo: **el cliente comprueba lo que comprueba el servidor**.
Ofrecer una acción a quien va a recibir un 403 reproduce el problema original por el otro lado.

#### Scenario: Borrado no ofrecido a quien no puede

- **GIVEN** un ADMIN con `/usuarios` concedida
- **WHEN** consulta el directorio de usuarios
- **THEN** puede listar y crear
- **AND** la acción de eliminar no se ofrece

#### Scenario: El cierre forzado sigue siendo del SUPER_ADMIN

- **GIVEN** un ADMIN viendo una sesión abierta por otro usuario
- **WHEN** se muestra esa sesión
- **THEN** no aparece ninguna acción de cierre forzado

### Requirement: La interfaz nunca es más restrictiva que el servidor


Ante la duda, la interfaz SHALL mostrar la acción y dejar que el servidor conteste.

Un botón que devuelve 403 es un fallo recuperable y explicable. Una acción que el usuario tiene
derecho a ejecutar y que no aparece en ninguna parte es indistinguible de una avería, y no hay forma
de diagnosticarla desde la pantalla.

Cuando el servidor responda 403, la interfaz SHALL mostrar su mensaje tal cual y SHALL recargar los
datos afectados, en lugar de sustituirlo por un texto propio que pueda contradecirlo.

#### Scenario: El servidor rechaza una acción que la interfaz ofrecía

- **GIVEN** una acción visible cuyo permiso se retiró desde otra sesión
- **WHEN** el usuario la ejecuta y el servidor responde 403
- **THEN** se muestra el mensaje del servidor
- **AND** los datos de la pantalla se vuelven a consultar

### Requirement: Un fallo de permisos no se disfraza de ausencia de datos


Cuando una consulta falle con 403, la pantalla SHALL indicar que **no hay acceso**, y NO SHALL
mostrar el estado vacío propio de "no hay datos".

Confundir "no tienes permiso" con "no hay nada" es lo que hizo que conceder una pantalla pareciera
funcionar cuando no lo hacía: la vista anunciaba que no había sesiones abiertas mientras la petición
devolvía 403.

El mensaje de acceso denegado SHALL nombrar la pantalla que hay que conceder, para que quien
administra sepa qué activar sin leer el código.

#### Scenario: 403 al cargar el listado

- **GIVEN** un usuario sin la ruta de la pantalla de sesión
- **WHEN** la consulta del listado responde 403
- **THEN** se indica que no tiene acceso a las sesiones de servicio
- **AND** se nombra la pantalla que debe concedérsele
- **AND** NO se muestra "no tienes ninguna sesión abierta"

#### Scenario: Listado vacío legítimo

- **GIVEN** un usuario con la ruta concedida y ninguna sesión propia
- **WHEN** la consulta responde correctamente con una lista vacía
- **THEN** se muestra el estado vacío de "no tienes ninguna sesión abierta"
- **AND** no se menciona ningún problema de acceso

#### Scenario: Error distinto de 403

- **WHEN** la consulta falla por un error de servidor
- **THEN** se muestra el mensaje del servidor
- **AND** no se atribuye el fallo a los permisos
