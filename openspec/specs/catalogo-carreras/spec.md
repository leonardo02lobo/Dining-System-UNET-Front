# catalogo-carreras Specification

## Purpose
TBD - created by syncing change add-attendance-statistics. Update Purpose after archive.
## Requirements
### Requirement: Listado del catálogo de carreras

La app SHALL exponer una vista de administración ("Administración → Carreras") que liste todas las
carreras del catálogo (`GET /api/v1/careers`), accesible para cualquier usuario autenticado en modo
lectura, y con acciones de crear/editar/eliminar visibles únicamente para `SUPER_ADMIN`/`ADMIN`.

#### Scenario: Usuario no administrador ve el catálogo sin acciones

- **WHEN** un usuario `TAQUILLERO` visita la vista de carreras
- **THEN** ve el listado de carreras sin botones de crear, editar o eliminar

### Requirement: Crear carrera

Un `SUPER_ADMIN`/`ADMIN` SHALL poder crear una carrera nueva (`POST /api/v1/careers`) indicando un
nombre. El backend SHALL rechazar nombres duplicados (comparación case-insensitive) con un mensaje
de error claro.

#### Scenario: Crear carrera con nombre único

- **WHEN** un administrador crea una carrera con un nombre que no existe en el catálogo
- **THEN** la carrera se agrega al listado y queda disponible en los selectores de estadísticas

#### Scenario: Nombre duplicado

- **WHEN** un administrador intenta crear una carrera con un nombre ya existente (sin importar
  mayúsculas/minúsculas)
- **THEN** la creación se rechaza y se muestra un mensaje de error indicando que ya existe

### Requirement: Editar y eliminar carrera

Un `SUPER_ADMIN`/`ADMIN` SHALL poder editar el nombre de una carrera existente
(`PATCH /api/v1/careers/{id}`) y eliminarla (`DELETE /api/v1/careers/{id}`). Eliminar una carrera
del catálogo NO SHALL modificar ni borrar los valores de texto libre `career` ya almacenados en
`beneficiaries`/`external_people`/`students`.

#### Scenario: Editar nombre de carrera

- **WHEN** un administrador cambia el nombre de una carrera existente
- **THEN** el nuevo nombre se refleja en el listado y en los selectores de estadísticas

#### Scenario: Eliminar carrera no afecta datos históricos

- **WHEN** un administrador elimina una carrera del catálogo
- **THEN** los registros de asistencia con ese `career` en texto libre siguen existiendo y se
  agrupan bajo "Sin carrera catalogada" en las estadísticas por período y por almuerzo

### Requirement: Filtro de carrera en estadísticas consume el catálogo

Los selectores de carrera de `estadisticas-periodo` y `estadisticas-almuerzo` SHALL poblarse
exclusivamente desde `GET /api/v1/careers`, no desde una constante hardcodeada en el frontend.

#### Scenario: Selector de carrera refleja el catálogo actual

- **WHEN** un administrador agrega una carrera nueva al catálogo
- **THEN** esa carrera aparece disponible en los selectores de ambas secciones de estadísticas sin
  requerir un despliegue de frontend
