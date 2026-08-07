## ADDED Requirements

### Requirement: El rol de acceso directo se muestra con su etiqueta legible

En toda pantalla que muestre el rol de una cuenta —creación y edición de usuarios, directorio de
usuarios, gestión de permisos y cabecera— el rol de acceso directo SHALL presentarse como
**"Acceso Directo"**.

Hoy el desplegable de creación de usuarios muestra el valor crudo del rol, el directorio deja la
celda vacía y la gestión de permisos renderiza un valor indefinido junto al nombre de la persona.

#### Scenario: Selección de rol al crear un usuario

- **WHEN** el administrador abre el formulario de nuevo usuario y despliega el selector de rol
- **THEN** el rol de acceso directo aparece como "Acceso Directo"
- **AND** no se muestra ningún identificador interno

#### Scenario: Directorio de usuarios

- **WHEN** el administrador lista las cuentas
- **THEN** las que tienen rol de acceso directo muestran su etiqueta legible en la columna de rol
- **AND** el filtro por rol ofrece esa misma etiqueta

#### Scenario: Gestión de permisos

- **WHEN** el administrador selecciona una cuenta con rol de acceso directo
- **THEN** el panel muestra su rol con la etiqueta legible y sin valores indefinidos

### Requirement: Una única definición de las etiquetas de rol

Las etiquetas de rol SHALL definirse una sola vez y compartirse entre todas las pantallas que las
usan.

Actualmente hay cuatro definiciones duplicadas que además divergen entre sí en el texto de un mismo
rol; esa duplicación es el mecanismo por el que el rol de acceso directo quedó sin etiqueta en unas
pantallas y con ella en otras.

Un valor de rol desconocido SHALL seguir mostrándose tal cual en lugar de romper la pantalla, para
tolerar el intervalo en que el servidor aún no ha aplicado el renombrado.

#### Scenario: Etiquetas coherentes entre pantallas

- **WHEN** se compara el texto de un mismo rol en el directorio, la cabecera y la gestión de permisos
- **THEN** las tres muestran exactamente la misma etiqueta

#### Scenario: Valor de rol desconocido

- **GIVEN** un servidor que todavía devuelve el valor antiguo del rol
- **WHEN** el panel muestra una cuenta con ese rol
- **THEN** muestra el valor recibido sin romper la pantalla
