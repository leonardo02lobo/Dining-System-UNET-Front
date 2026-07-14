# almuerzos-editar-historial Specification

## Purpose
TBD - created by archiving change fe-almuerzos-editar-historial. Update Purpose after archive.
## Requirements
### Requirement: Editar un almuerzo en borrador desde su detalle

Desde el detalle de un almuerzo creado, la app SHALL permitir editar su nombre, fecha y
cantidad de platos cuando el almuerzo está en estado editable (`DRAFT`), persistiendo vía
`PATCH /lunches/{id}`.

#### Scenario: Editar un borrador

- **WHEN** el usuario abre un almuerzo en estado DRAFT y edita nombre/fecha/platos y guarda
- **THEN** los cambios se persisten y el detalle se actualiza

#### Scenario: Almuerzo no editable

- **WHEN** el usuario abre un almuerzo confirmado (no editable)
- **THEN** no se ofrece la edición y se indica que solo los borradores son editables

#### Scenario: Rechazo del backend

- **WHEN** el backend rechaza la edición con 409
- **THEN** la UI muestra un mensaje claro de que el almuerzo no es editable

