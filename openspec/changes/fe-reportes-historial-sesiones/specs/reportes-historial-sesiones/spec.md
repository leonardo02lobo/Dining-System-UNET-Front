## ADDED Requirements

### Requirement: Historial de sesiones por rango de fechas

La app SHALL ofrecer una vista que liste las sesiones de comedor dentro de un rango de fechas
seleccionable, consumiendo `GET /lunch-sessions/?from_date&to_date` con envelope `{total, items}`.

#### Scenario: Listar sesiones del rango

- **WHEN** el usuario selecciona un rango de fechas
- **THEN** la vista muestra solo las sesiones de ese rango, ordenadas por fecha descendente

#### Scenario: Rango sin sesiones

- **WHEN** no hay sesiones en el rango
- **THEN** se muestra un estado vacío sin error

### Requirement: Detalle de entrantes de una sesión

Al seleccionar una sesión, la vista SHALL mostrar la lista de entrantes de ese día
(`GET /consumptions/?session_id=`) con cédula, apellido, nombre y carrera.

#### Scenario: Ver entrantes

- **WHEN** el usuario selecciona una sesión
- **THEN** se muestran los entrantes de esa sesión con sus datos

### Requirement: Descargar PDF de entrantes por sesión

La vista SHALL permitir descargar un PDF de los entrantes de la sesión seleccionada con las
columnas cédula, apellido, nombre y carrera.

#### Scenario: Exportar PDF

- **WHEN** el usuario presiona "Descargar PDF" con una sesión seleccionada
- **THEN** se genera un PDF con los entrantes (cédula, apellido, nombre, carrera)

#### Scenario: Sesión sin entrantes

- **WHEN** la sesión no tiene entrantes
- **THEN** el botón de PDF permanece deshabilitado y la vista no falla
