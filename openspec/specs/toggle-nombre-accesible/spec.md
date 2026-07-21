# toggle-nombre-accesible Specification

## Purpose
TBD - created by archiving change fe-ux-audit-fase1-criticos. Update Purpose after archive.
## Requirements
### Requirement: Todo interruptor Toggle tiene nombre accesible

La primitiva `Toggle` SHALL requerir una prop `label` describiendo qué controla el interruptor y
SHALL exponerla como `aria-label` del botón `role="switch"`.

#### Scenario: Lector de pantalla anuncia el interruptor

- **WHEN** un lector de pantalla enfoca un `Toggle`
- **THEN** anuncia el `label` proporcionado y el estado actual (`aria-checked`)

#### Scenario: Gestión de Permisos usa un nombre específico por fila

- **WHEN** la pantalla de Gestión de Permisos renderiza el interruptor de una funcionalidad
- **THEN** el `label` incluye el nombre de la funcionalidad y si está permitida o denegada

