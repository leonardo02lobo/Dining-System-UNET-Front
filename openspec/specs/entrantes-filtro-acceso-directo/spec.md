# entrantes-filtro-acceso-directo Specification

## Purpose
TBD - created by archiving change fe-entrantes-filtro-acceso-directo. Update Purpose after archive.
## Requirements
### Requirement: Filtro "Solo acceso directo" en entrantes de sesión

La vista de entrantes por sesión SHALL ofrecer un filtro para mostrar solo los entrantes de
acceso directo (`is_priority`), aplicado por servidor vía `GET /consumptions/?is_priority=true`.

#### Scenario: Activar el filtro

- **WHEN** el usuario activa "Solo acceso directo" en una sesión con entrantes mixtos
- **THEN** la lista muestra solo los entrantes marcados como acceso directo

#### Scenario: Desactivar el filtro

- **WHEN** el usuario desactiva el filtro
- **THEN** la lista vuelve a mostrar todos los entrantes de la sesión

#### Scenario: Indicador por fila

- **WHEN** un entrante es de acceso directo
- **THEN** la fila lo señala visualmente (badge/columna)

