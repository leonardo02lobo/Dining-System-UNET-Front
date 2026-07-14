# gente-externa-gestion Specification

## Purpose
TBD - created by archiving change fe-gente-externa. Update Purpose after archive.
## Requirements
### Requirement: Gestión de personas externas

La app SHALL ofrecer una ventana para gestionar personas externas (jubilado / persona externa)
consumiendo el recurso `/external-people`, accesible para `SUPER_ADMIN`/`ADMIN`.

#### Scenario: Listar con filtros

- **WHEN** el usuario abre la ventana de gente externa y aplica búsqueda/tipo/estado
- **THEN** la lista muestra las personas que cumplen los filtros

#### Scenario: Registrar una persona externa

- **WHEN** el usuario registra una persona con sus campos y tipo (jubilado/persona externa)
- **THEN** se crea vía `POST /external-people` y aparece en el listado

#### Scenario: Cédula duplicada

- **WHEN** el usuario registra una persona con una cédula ya existente
- **THEN** la UI muestra un error claro (409) y no duplica

#### Scenario: Editar y eliminar

- **WHEN** el usuario edita (sin cambiar la cédula) o elimina una persona externa
- **THEN** el cambio se persiste vía `PUT`/`DELETE /external-people/{id}` y se refleja en la lista

### Requirement: Tipo de persona externa

El registro SHALL permitir clasificar a la persona como **jubilado** o **persona externa** y
mostrar ese tipo en el listado.

#### Scenario: Selección de tipo

- **WHEN** el usuario crea o edita una persona externa
- **THEN** puede elegir el tipo jubilado o persona externa, y el listado lo muestra

