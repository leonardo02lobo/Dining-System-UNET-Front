# eliminar-suspender-usuario Specification

## Purpose
TBD - created by archiving change fe-eliminar-suspender-usuario. Update Purpose after archive.
## Requirements
### Requirement: El apartado de suspender usuario no existe en el frontend

El frontend NO SHALL exponer una pantalla, ruta ni ítem de navegación dedicados a "Suspender
Usuario". El listado de usuarios suspendidos y la suspensión rápida integrada en el registro al
comedor SHALL permanecer disponibles.

#### Scenario: No hay ítem de navegación

- **WHEN** un usuario con permisos abre la navegación
- **THEN** no aparece el ítem "Suspender Usuario"

#### Scenario: La ruta ya no resuelve la pantalla

- **WHEN** se navega a `/suspendStudent`
- **THEN** no se renderiza la pantalla de suspender usuario (la ruta fue retirada)

#### Scenario: Se conserva el listado de suspendidos

- **WHEN** un usuario con permisos abre "Usuarios Suspendidos"
- **THEN** el listado de suspendidos sigue funcionando

#### Scenario: Se conserva la suspensión rápida

- **WHEN** en el registro al comedor se consulta un acceso directo suspendible
- **THEN** la suspensión rápida desde esa pantalla sigue disponible

