# plantilla-correo-editor Specification

## Purpose
TBD - created by archiving change fe-plantilla-correo-editor. Update Purpose after archive.
## Requirements
### Requirement: Editor de plantilla de correo con marcadores y previsualización

El panel de plantilla de correo SHALL permitir editar el asunto y el cuerpo del correo de sanción,
ofrecer la inserción de los marcadores soportados por el backend, previsualizar el resultado con
valores de ejemplo y guardar los cambios con feedback del resultado.

#### Scenario: Insertar un marcador

- **WHEN** el editor inserta un marcador soportado (p. ej. `{nombre}`)
- **THEN** el marcador se añade al texto en la posición de edición

#### Scenario: Previsualización

- **WHEN** el editor abre la previsualización
- **THEN** se muestra el correo con los marcadores sustituidos por valores de ejemplo

#### Scenario: Guardar la plantilla

- **WHEN** el editor guarda los cambios
- **THEN** la plantilla se persiste vía la API y se muestra el resultado del guardado

#### Scenario: Aviso de marcador no soportado

- **WHEN** el texto contiene un marcador con forma `{...}` que no pertenece al conjunto soportado
- **THEN** el editor advierte del marcador no soportado antes o al guardar

#### Scenario: Paridad con el backend

- **WHEN** el editor ofrece marcadores para insertar
- **THEN** esos marcadores coinciden con los que el backend sabe renderizar

### Requirement: La página de plantilla no gestiona el correo del suspendido

La página de plantilla de correo SHALL limitarse a la configuración del emisor/CC y al editor de la
plantilla. NO SHALL incluir un apartado para buscar una persona por cédula ni para editar su correo,
porque el correo del acceso directo se gestiona en su propio módulo y el correo de sanción se envía
automáticamente al suspender, renderizando la plantilla con los datos del usuario.

#### Scenario: No hay apartado de correo del suspendido

- **WHEN** un administrador abre la página de plantilla de correo
- **THEN** solo ve la configuración del emisor/CC y el editor de la plantilla
- **AND** no ve ningún apartado para buscar por cédula ni editar el correo de la persona a suspender

#### Scenario: El correo se envía automáticamente al suspender

- **WHEN** se suspende a un usuario con acceso directo desde la app
- **THEN** el backend envía el correo de sanción renderizando la plantilla con los datos del usuario,
  sin ningún paso manual en la página de plantilla

