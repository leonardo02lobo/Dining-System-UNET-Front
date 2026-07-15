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

