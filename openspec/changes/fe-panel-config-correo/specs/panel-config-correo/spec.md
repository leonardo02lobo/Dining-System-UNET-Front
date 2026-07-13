## ADDED Requirements

### Requirement: Configurar emisor y CC del correo desde el panel

El panel de administración de correo SHALL permitir a un `SUPER_ADMIN` configurar el nombre y
la dirección del emisor y las copias (CC), persistiendo vía `PUT /email-settings` y cargando el
estado con `GET /email-settings`.

#### Scenario: Guardar configuración

- **WHEN** un SUPER_ADMIN edita nombre/correo del emisor y CC y guarda
- **THEN** la configuración se persiste y se muestra al recargar

#### Scenario: Emisor obligatorio

- **WHEN** el usuario intenta guardar sin nombre o sin correo del emisor
- **THEN** se muestra un error y no se guarda

#### Scenario: CC opcional y validado

- **WHEN** el usuario deja el CC vacío o ingresa correos separados por comas
- **THEN** se acepta vacío, o se validan los correos (errores del backend mostrados al usuario)

#### Scenario: No se exponen credenciales SMTP

- **WHEN** el usuario ve la configuración
- **THEN** solo puede editar emisor y CC; las credenciales SMTP no se muestran ni editan
