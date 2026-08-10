## MODIFIED Requirements

### Requirement: Gestión de personas externas

La app SHALL ofrecer una ventana para gestionar personas externas consumiendo el recurso
`/external-people`, accesible para `SUPER_ADMIN`/`ADMIN`.

#### Scenario: Listar con filtros

- **WHEN** el usuario abre la ventana de gente externa y aplica búsqueda/etiqueta/estado
- **THEN** la lista muestra las personas que cumplen los filtros

#### Scenario: Registrar una persona externa

- **WHEN** el usuario registra una persona con sus campos y su etiqueta
- **THEN** se crea vía `POST /external-people` y aparece en el listado

#### Scenario: Cédula duplicada

- **WHEN** el usuario registra una persona con una cédula ya existente
- **THEN** la UI muestra un error claro (409) y no duplica

#### Scenario: Editar y dar de baja

- **WHEN** el usuario edita (sin cambiar la cédula) o da de baja una persona externa
- **THEN** el cambio se persiste vía `PUT`/`DELETE /external-people/{id}` y se refleja en la lista
- **AND** la baja deja a la persona **inactiva**, conservando su historial de consumos

## REMOVED Requirements

### Requirement: Tipo de persona externa

**Reason**: La clasificación en dos valores fijos —jubilado / persona externa— es justo lo que impedía
agrupar a la gente por su procedencia real (un congreso, una jornada) y, con ello, retirarles el
acceso en lote. Un dominio cerrado escrito en el cliente no puede representar grupos que se inventan
cada semestre.

**Migration**: Sustituido por «La etiqueta se elige de un catálogo y se puede crear sin salir del
formulario» y «El listado se filtra y se rotula por etiqueta», en la capacidad
`etiquetas-gente-externa-front`. Las personas ya registradas quedan con las etiquetas sembradas
*Jubilado* y *Externo*, así que ninguna pierde su clasificación.
