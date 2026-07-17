## ADDED Requirements

### Requirement: El PDF de la sesión incluye el menú del día

El PDF descargable de una sesión (`generateSessionEntrantsPdf`) SHALL incluir, además de los
entrantes, una **sección de menú del día** con el nombre del platillo, la cantidad de platos
(`platesQuantity`) y la lista de ingredientes usados (cada uno con `calculatedQuantity` y `unit`).
El menú SHALL pasarse desde la pantalla (dato ya cargado) sin llamadas adicionales.

#### Scenario: Sesión con menú

- **WHEN** el usuario descarga el PDF de una sesión que tiene menú registrado
- **THEN** el PDF incluye el nombre del platillo, la cantidad de platos y la lista de ingredientes
  (cantidad + unidad), además de la tabla de entrantes

#### Scenario: Sesión sin menú

- **WHEN** el usuario descarga el PDF de una sesión sin menú (`menu` nulo)
- **THEN** el PDF se genera igualmente, omitiendo la sección o indicando "Sin menú registrado", sin
  romper el layout ni la paginación
