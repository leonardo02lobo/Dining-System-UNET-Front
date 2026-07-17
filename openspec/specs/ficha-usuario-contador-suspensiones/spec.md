# ficha-usuario-contador-suspensiones Specification

## Purpose
TBD - created by archiving change fe-issues-reunion-14-07. Update Purpose after archive.
## Requirements
### Requirement: Contador de suspensiones en la ficha del usuario

La ficha compartida del usuario (`StudentResultCard`) SHALL mostrar **cuántas veces ha sido
suspendida** la persona ("Suspendido N veces" / "Sin suspensiones"), visible en cualquier pantalla
que la use (Registro al Comedor, Consulta de Consumo, Registro Manual). El conteo SHALL provenir del
`sanction_count` del lookup de acceso directo cuando el backend lo exponga; en su defecto, de
`sanctionApi.history(acceso_directo_id).total`. Solo aplica a personas con `acceso_directo_id`.

#### Scenario: Persona con sanciones

- **WHEN** aparece la ficha de una persona con N sanciones históricas
- **THEN** se muestra "Suspendido N veces" (o equivalente)

#### Scenario: Persona sin sanciones

- **WHEN** aparece la ficha de una persona sin sanciones
- **THEN** se muestra 0 / "Sin suspensiones"

