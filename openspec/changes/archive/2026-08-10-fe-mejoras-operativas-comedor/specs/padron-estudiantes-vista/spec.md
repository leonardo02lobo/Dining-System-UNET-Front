## ADDED Requirements

### Requirement: Pantalla de consulta del padrón de estudiantes

El panel SHALL ofrecer una pantalla en `/estudiantes` (SUPER_ADMIN/ADMIN) con el listado paginado del
padrón, con búsqueda por cédula o nombre, filtro por estado en el padrón, filtro por carrera y filtro
**"Sin sexo asignado"**.

El filtro de sexo sin asignar SHALL existir porque el padrón se importa sin sexo: sin él, clasificar
8.380 estudiantes obligaría a buscarlos a ciegas de uno en uno.

La ruta SHALL declararse tanto en el enrutador de la aplicación como en el mapa de acceso por rol.

#### Scenario: Listado con filtros

- **WHEN** el administrador abre `/estudiantes`
- **THEN** ve el padrón paginado con sus filtros de búsqueda, estado, carrera y sexo sin asignar

#### Scenario: Cola de trabajo de clasificación

- **WHEN** se activa el filtro "Sin sexo asignado"
- **THEN** el listado muestra únicamente los estudiantes cuyo sexo aún no se ha clasificado

#### Scenario: Acceso restringido

- **WHEN** un usuario con rol TAQUILLERO intenta abrir `/estudiantes`
- **THEN** el panel le niega el acceso igual que con el resto de rutas administrativas

### Requirement: Detalle del estudiante separado en secciones y de solo lectura

Al seleccionar un estudiante, el panel SHALL mostrar su ficha dividida en las secciones
**Identificación**, **Datos académicos**, **Contacto**, **Estado** y **Sexo**.

Todos los campos SHALL ser de solo lectura excepto el sexo. El resto de los datos proviene del CSV
oficial de Control de Estudios y se corrige reimportando, no editándolo a mano.

#### Scenario: Los datos del padrón no se pueden editar

- **WHEN** se abre la ficha de un estudiante
- **THEN** los campos de identificación, datos académicos, contacto y estado se muestran como solo
  lectura
- **AND** no ofrecen ningún control de edición

#### Scenario: Secciones visibles

- **WHEN** se abre la ficha de un estudiante
- **THEN** sus datos aparecen agrupados en las cinco secciones nombradas

### Requirement: Clasificación del sexo con tres estados

El control de sexo SHALL ofrecer las opciones **Masculino** y **Femenino** como excluyentes, sobre un
estado inicial **sin clasificar**, y SHALL permitir volver a ese estado.

SHALL NOT implementarse como una única casilla de verificación: dos estados no pueden representar un
dominio de tres, y una casilla sin marcar sería indistinguible de una clasificación real, lo que
haría imposible saber cuántos estudiantes faltan por revisar.

El guardado SHALL enviar únicamente el sexo al backend.

#### Scenario: Marcar el sexo

- **WHEN** el administrador selecciona "Femenino" en la ficha de un estudiante
- **THEN** el panel guarda el cambio y refleja el nuevo valor en la ficha y en el listado

#### Scenario: Estado inicial distinguible

- **GIVEN** un estudiante recién importado
- **WHEN** se abre su ficha
- **THEN** ninguna de las dos opciones aparece seleccionada
- **AND** el estudiante figura en el filtro "Sin sexo asignado"

#### Scenario: Deshacer una clasificación

- **GIVEN** un estudiante clasificado como "Masculino"
- **WHEN** el administrador vuelve a dejarlo sin clasificar
- **THEN** el panel guarda el cambio y el estudiante reaparece en el filtro "Sin sexo asignado"
