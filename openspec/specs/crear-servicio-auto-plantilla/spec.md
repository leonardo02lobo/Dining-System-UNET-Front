# crear-servicio-auto-plantilla Specification

## Purpose
TBD - created by archiving change fe-crear-servicio-quitar-toggle-plantilla. Update Purpose after archive.
## Requirements
### Requirement: Toda creación de servicio genera su plantilla sin opción manual

La pantalla de creación de servicio de alimentación SHALL confirmar el almuerzo sin ofrecer una
opción manual de "guardar como plantilla"; la plantilla la genera siempre el backend al confirmar.

#### Scenario: No existe el toggle de plantilla

- **WHEN** el usuario está en la pantalla de creación
- **THEN** no aparece la opción "Guardar como plantilla"

#### Scenario: Al confirmar se guarda la plantilla

- **WHEN** el usuario confirma un servicio de alimentación
- **THEN** el backend genera/actualiza su plantilla y el frontend refresca la lista de plantillas

#### Scenario: Sin doble creación

- **WHEN** se confirma un servicio
- **THEN** el frontend no crea la plantilla por su cuenta (evita duplicados con la del backend)

