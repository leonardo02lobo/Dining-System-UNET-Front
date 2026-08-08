# sesion-cierre-propietario-front Specification

## Purpose
TBD - created by archiving change fe-sesiones-propiedad-y-accesos-recientes. Update Purpose after archive.
## Requirements
### Requirement: La acción de cerrar se ofrece solo a quien abrió la sesión

`LunchSessionPage` SHALL habilitar el botón "Cerrar" de una sesión únicamente cuando
`opened_by_id` coincida con el identificador del usuario en sesión, o cuando `opened_by_id` sea nulo
y el rol sea SUPER_ADMIN o ADMIN.

En cualquier otro caso el botón SHALL mostrarse deshabilitado y SHALL explicar el motivo, con el
nombre de quien abrió la sesión tomado de `opened_by_name`. Un botón apagado sin explicación se lee
como un fallo de la aplicación.

Esta derivación SHALL usarse **solo para rotular la interfaz**. La autoridad SHALL seguir siendo la
respuesta del servidor: ante una discrepancia, el mensaje del 403 SHALL mostrarse tal cual y el
listado SHALL recargarse.

#### Scenario: El dueño cierra su sesión

- **GIVEN** una sesión abierta por el usuario en sesión
- **WHEN** pulsa "Cerrar" y confirma
- **THEN** la sesión se cierra y se notifica el éxito

#### Scenario: Sesión ajena, botón explicado

- **GIVEN** una sesión abierta por Ana Rodríguez y un ADMIN distinto viendo la pantalla
- **WHEN** se muestra esa sesión
- **THEN** el botón "Cerrar" está deshabilitado
- **AND** se indica que solo Ana Rodríguez puede cerrarla

#### Scenario: Sesión histórica sin propietario

- **GIVEN** una sesión abierta cuyo `opened_by_id` es nulo
- **WHEN** la ve un ADMIN
- **THEN** el botón "Cerrar" está habilitado

#### Scenario: El servidor rechaza un cierre que la UI creía posible

- **GIVEN** una sesión que la pantalla mostraba como cerrable
- **WHEN** el servidor responde 403 al intentar cerrarla
- **THEN** se muestra el mensaje del servidor, que nombra a quien la abrió
- **AND** el listado de sesiones se vuelve a consultar

### Requirement: Cierre forzado de SUPER_ADMIN con motivo obligatorio

La pantalla SHALL ofrecer una acción secundaria "Cierre forzado" **solo** al rol SUPER_ADMIN y
**solo** sobre las sesiones que no puede cerrar por la vía normal.

La acción SHALL abrir un modal propio que muestre quién abrió la sesión, en qué sede y desde qué
hora, y que exija un motivo de al menos 10 caracteres. El motivo SHALL validarse en el cliente antes
de enviar; el 422 del servidor es la red, no la primera línea.

El modal SHALL advertir que la acción queda registrada en la auditoría del sistema.

Confirmada la acción, SHALL llamarse a `PUT /lunch-sessions/{id}/force-close` con el motivo y SHALL
recargarse el listado.

El modal SHALL construirse con el componente `Modal` del proyecto. NO SHALL usarse `confirm()`,
`alert()` ni `prompt()`: están prohibidos —fallan silenciosamente dentro del *webview* de Tauri— y
`nativeDialogs.guard.test.ts` es la prueba de regresión que lo vigila.

#### Scenario: SUPER_ADMIN fuerza el cierre de una sesión ajena

- **GIVEN** un SUPER_ADMIN viendo una sesión abierta por un taquillero
- **WHEN** pulsa "Cierre forzado", escribe un motivo válido y confirma
- **THEN** la sesión se cierra y el listado se recarga

#### Scenario: Motivo demasiado corto

- **WHEN** el SUPER_ADMIN escribe un motivo de menos de 10 caracteres
- **THEN** la confirmación permanece deshabilitada y se indica el mínimo
- **AND** no se emite ninguna petición al servidor

#### Scenario: El modal advierte de la auditoría

- **WHEN** se abre el modal de cierre forzado
- **THEN** se indica que la acción queda registrada en la auditoría del sistema
- **AND** se muestra quién abrió la sesión, la sede y la hora de apertura

#### Scenario: El ADMIN no dispone de la acción

- **GIVEN** un ADMIN viendo una sesión abierta por otro usuario
- **WHEN** se muestra esa sesión
- **THEN** no aparece ninguna acción de cierre forzado

#### Scenario: El taquillero no dispone de la acción

- **GIVEN** un TAQUILLERO viendo su propia sesión
- **WHEN** se muestra esa sesión
- **THEN** no aparece ninguna acción de cierre forzado, solo el cierre normal

#### Scenario: No se usan diálogos nativos

- **WHEN** se revisa la implementación del cierre forzado
- **THEN** la confirmación se hace con el componente `Modal`
- **AND** `nativeDialogs.guard.test.ts` sigue en verde

