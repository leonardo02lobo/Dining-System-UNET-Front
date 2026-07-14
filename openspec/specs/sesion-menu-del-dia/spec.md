# sesion-menu-del-dia Specification

## Purpose
TBD - created by archiving change fe-sesion-menu-del-dia. Update Purpose after archive.
## Requirements
### Requirement: Menú del día en el detalle de sesión

El detalle de una sesión SHALL mostrar el menú planificado de ese día (nombre del almuerzo e
ingredientes con cantidad y unidad), obtenido por la fecha de la sesión (`GET /lunches?date=`).

#### Scenario: Día con almuerzo

- **WHEN** el usuario abre una sesión cuyo día tiene un almuerzo registrado
- **THEN** ve el nombre del almuerzo y su lista de ingredientes con cantidades

#### Scenario: Día sin almuerzo

- **WHEN** el día de la sesión no tiene almuerzo registrado
- **THEN** se indica claramente que no hay menú, sin error

