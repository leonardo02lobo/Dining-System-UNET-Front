## ADDED Requirements

### Requirement: En el registro la sede se muestra, no se elige

La pantalla de registro al comedor SHALL mostrar la sede del usuario como **rótulo**, junto a la fecha
y el turno, y NO SHALL ofrecer ningún control para cambiarla.

La sede SHALL tomarse de la cuenta del usuario, servida en su ficha, y NO SHALL leerse ni escribirse
en el almacenamiento del navegador. La clave `selected_sede_id` SHALL eliminarse junto con todos sus
lectores y escritores: dejarla escribiéndose garantiza que alguien vuelva a leerla y reintroduzca la
elección de sede por la puerta de atrás.

Un desplegable cuya respuesta es siempre la misma no es una elección, es una configuración en el sitio
equivocado — y es la que permite registrar a media fila en el comedor que no es sin que nadie lo note
hasta el cierre.

#### Scenario: La sede se ve sin poder cambiarse

- **GIVEN** un taquillero asignado a Paramillo
- **WHEN** abre la pantalla de registro
- **THEN** la pantalla muestra «Paramillo» junto a la fecha y el turno
- **AND** no hay ningún control para elegir la sede

#### Scenario: No queda nada en el navegador

- **WHEN** se usa la pantalla de registro
- **THEN** no se lee ni se escribe ninguna clave de sede en el almacenamiento del navegador

#### Scenario: La sede sobrevive al cambio de equipo

- **GIVEN** un taquillero que entra desde otro ordenador
- **WHEN** abre la pantalla de registro
- **THEN** su sede es la misma, sin tener que elegirla

### Requirement: Sin sede asignada la pantalla se bloquea y explica por qué

Cuando la cuenta no tenga sede asignada y el usuario no administre, la pantalla de registro SHALL
deshabilitar el campo de cédula y SHALL mostrar un aviso que diga que su cuenta no tiene sede y que
debe pedírsela a un administrador.

La pantalla SHALL NOT ofrecer un selector de sede como alternativa. El servidor responderá 403 de
todos modos, así que ofrecerlo sería fabricar un camino que termina en error: el cliente puede ser
**más** informativo que el servidor, nunca más permisivo.

Las causas del bloqueo SHALL distinguirse, cada una con su mensaje, en lugar de una sola bandera que
las confunde:

| Causa | Mensaje |
|---|---|
| Sin sede asignada | Indica que falta la asignación y a quién pedirla |
| Sede sin sesión abierta | Indica que no hay sesión activa **en esa sede**, nombrándola |
| Consultando la sesión | Indicador de carga |

#### Scenario: Cuenta sin sede

- **GIVEN** un taquillero cuya cuenta no tiene sede asignada
- **WHEN** abre la pantalla de registro
- **THEN** el campo de cédula está deshabilitado
- **AND** el aviso dice que su cuenta no tiene sede y que debe pedirla a un administrador
- **AND** no aparece ningún selector de sede

#### Scenario: Sede sin sesión abierta

- **GIVEN** un taquillero asignado a Paramillo, sin sesión abierta allí
- **WHEN** abre la pantalla de registro
- **THEN** el aviso dice que no hay sesión activa en Paramillo, nombrando la sede

#### Scenario: Los dos avisos no se confunden

- **WHEN** se comparan los dos estados anteriores
- **THEN** cada uno muestra su propio mensaje y llevan a acciones distintas

#### Scenario: Asignada la sede, la pantalla funciona

- **GIVEN** un taquillero bloqueado por falta de sede
- **WHEN** un administrador le asigna una y el usuario vuelve a entrar
- **THEN** la pantalla muestra su sede y permite registrar

### Requirement: La pantalla de sesión conserva su selector, acotado

`/comedor/sesion` SHALL conservar el selector de sede: ahí la sede **es** el objeto de la operación
—abrir el servicio en un sitio concreto— y sustituirlo por un rótulo escondería lo que se está
haciendo.

Para un usuario que no administra, el selector SHALL ofrecer únicamente su sede asignada. Con una sola
opción SHALL mostrarse deshabilitado y con esa sede ya elegida: dice qué se va a hacer sin fingir que
hay algo que decidir.

Para SUPER_ADMIN y ADMIN el selector SHALL seguir ofreciendo todas las sedes en las que se pueda
abrir.

#### Scenario: El taquillero solo ve la suya

- **GIVEN** un usuario no administrador asignado a Paramillo, con `/comedor/sesion` concedida
- **WHEN** abre la pantalla de sesión
- **THEN** el selector muestra Paramillo, ya elegida y deshabilitada

#### Scenario: El administrador las ve todas

- **GIVEN** un ADMIN
- **WHEN** abre la pantalla de sesión
- **THEN** el selector ofrece todas las sedes donde se puede abrir

#### Scenario: Sin sede asignada no se abre

- **GIVEN** un usuario no administrador sin sede asignada
- **WHEN** abre la pantalla de sesión
- **THEN** la acción de abrir está deshabilitada con el motivo escrito

### Requirement: La sede se asigna desde la administración de usuarios

El formulario de usuarios SHALL incluir un campo **Sede**, editable únicamente para `SUPER_ADMIN`, que
es a quien el servidor reserva la asignación.

Para un ADMIN la sede SHALL mostrarse **en lectura**: necesita saber dónde está asignada una persona
aunque no pueda cambiarlo.

El listado de usuarios SHALL mostrar la sede de cada cuenta, para que localizar a quien falta por
asignar no exija abrir las fichas una por una.

Una cuenta SHALL poder quedarse sin sede: es un estado válido y visible, no un error de formulario.

#### Scenario: El SUPER_ADMIN asigna

- **GIVEN** un SUPER_ADMIN editando una cuenta
- **WHEN** elige una sede y guarda
- **THEN** la cuenta queda asignada y la lista lo refleja

#### Scenario: El ADMIN ve pero no cambia

- **GIVEN** un ADMIN editando una cuenta
- **WHEN** mira el campo Sede
- **THEN** ve la sede asignada y no puede modificarla

#### Scenario: Localizar lo que falta por asignar

- **GIVEN** varias cuentas, algunas sin sede
- **WHEN** se mira el listado de usuarios
- **THEN** la columna de sede distingue las asignadas de las que no lo están

#### Scenario: Rechazo del servidor

- **WHEN** el servidor responde 403 al asignar una sede
- **THEN** el formulario muestra su mensaje y no deja la lista en un estado falso
