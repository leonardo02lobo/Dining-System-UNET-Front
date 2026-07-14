# plantillas-crud-inventario Specification

## Purpose
TBD - created by archiving change fe-plantillas-crud-inventario. Update Purpose after archive.
## Requirements
### Requirement: Ventana de gestión de plantillas en inventario

La sección de inventario SHALL ofrecer una ventana dedicada para gestionar las plantillas de
almuerzo, accesible desde la navegación (grupo Inventario) y protegida por los mismos roles que
el resto de inventario (`SUPER_ADMIN`, `ADMIN`).

#### Scenario: Listar plantillas

- **WHEN** un usuario autorizado abre la ventana de plantillas
- **THEN** ve el listado de todas las plantillas con nombre, fecha, platos base y nº de ingredientes

#### Scenario: Acceso por rol

- **WHEN** un usuario sin rol autorizado intenta acceder a la ruta de plantillas
- **THEN** se le impide el acceso según `routeAccess`

### Requirement: Editar y eliminar plantillas

La ventana SHALL permitir editar el nombre y la cantidad de platos base de una plantilla, y
eliminarla con confirmación, consumiendo el CRUD de `/lunch-templates`.

#### Scenario: Editar una plantilla

- **WHEN** el usuario edita el nombre o los platos base de una plantilla y guarda
- **THEN** el cambio se persiste vía `PATCH /lunch-templates/{id}` y se refleja en el listado

#### Scenario: Eliminar una plantilla

- **WHEN** el usuario confirma la eliminación de una plantilla no referenciada
- **THEN** la plantilla se elimina vía `DELETE /lunch-templates/{id}` y desaparece del listado

#### Scenario: Borrado bloqueado de plantilla referenciada

- **WHEN** el usuario intenta eliminar una plantilla referenciada y el backend lo rechaza
- **THEN** la UI muestra un mensaje de error claro y conserva el listado

### Requirement: Métodos de API de plantillas completos

La capa `src/api/lunch.ts` SHALL exponer los métodos `getLunchTemplate`, `updateLunchTemplate`
y `deleteLunchTemplate` sobre `/lunch-templates`, además de los existentes `list`/`create`.

#### Scenario: Métodos disponibles

- **WHEN** la página de plantillas necesita obtener, actualizar o eliminar una plantilla
- **THEN** dispone de los métodos correspondientes en `lunchApi` que llaman a los endpoints de
  `/lunch-templates`

