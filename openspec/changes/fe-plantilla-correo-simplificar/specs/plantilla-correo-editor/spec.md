## ADDED Requirements

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
