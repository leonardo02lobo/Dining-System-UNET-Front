## MODIFIED Requirements

### Requirement: Los logos institucionales son proporcionales al contexto

Los logos de la cabecera SHALL mostrarse a tamaño completo en `/login`, y a tamaño reducido en el
shell autenticado (todas las demás pantallas), para no consumir una porción desproporcionada del
alto disponible.

La bandera que distingue los dos contextos SHALL llamarse por lo que hace. Hoy se llama `isLogin` y
el cascarón autenticado la pasa como `true`, mientras que la pantalla de login no la pasa: el
comportamiento es el correcto, pero el nombre dice lo contrario. Quien vaya a acotar el alto de la
cabecera tropieza con eso antes que con nada.

#### Scenario: Logos reducidos fuera del login

- **WHEN** el usuario navega por cualquier pantalla autenticada
- **THEN** los logos de la cabecera ocupan menos espacio vertical que en la pantalla de login

#### Scenario: La bandera de contexto se lee como lo que hace

- **WHEN** se lee la llamada al componente de cabecera desde el cascarón autenticado
- **THEN** la bandera indica que la cabecera es compacta
- **AND** no afirma que la pantalla sea la de login
