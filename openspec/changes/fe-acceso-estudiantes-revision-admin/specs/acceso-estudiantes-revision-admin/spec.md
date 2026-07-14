## ADDED Requirements

### Requirement: Pantalla de acceso de estudiantes funcional

La pantalla administrativa de acceso de estudiantes SHALL listar los accesos, permitir búsqueda por
cédula o nombre, filtrar por rango de fechas, paginar los resultados y mostrar el detalle de un
acceso, con estados de carga, error y vacío coherentes.

#### Scenario: Listado inicial

- **WHEN** un administrador abre la pantalla de acceso de estudiantes
- **THEN** se muestran los accesos registrados con su total y estado de carga adecuado

#### Scenario: Búsqueda

- **WHEN** el administrador escribe una cédula o nombre en el buscador
- **THEN** el listado se filtra por ese criterio y la paginación se reinicia

#### Scenario: Filtro por rango de fechas

- **WHEN** el administrador fija *desde* y/o *hasta*
- **THEN** el listado muestra sólo los accesos dentro del rango y reinicia la paginación

#### Scenario: Paginación

- **WHEN** el administrador cambia de página
- **THEN** se cargan los accesos de esa página y los botones de anterior/siguiente se habilitan según corresponda

#### Scenario: Detalle del acceso

- **WHEN** el administrador abre el detalle de un acceso
- **THEN** se muestran los datos del estudiante (foto o inicial, tipo, cédula, correo, carrera, fecha y hora)
