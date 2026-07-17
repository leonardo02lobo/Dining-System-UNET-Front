## ADDED Requirements

### Requirement: Contador de registros de la sesión

La pantalla Registro al Comedor SHALL mostrar en la parte superior derecha un **contador** con el
total de registros de la sede/sesión actual. El contador SHALL inicializarse con el total del
backend al seleccionar sede/sesión (`consumptionApi.list({ session_id })`), SHALL incrementarse en 1
por cada registro exitoso y SHALL recargarse al cambiar de sede o de sesión.

#### Scenario: El contador sube al registrar

- **WHEN** el usuario registra un consumo en una sesión abierta
- **THEN** el contador aumenta en 1

#### Scenario: Cambio de sede/sesión recarga el contador

- **WHEN** el usuario cambia de sede o de sesión
- **THEN** el contador se recarga con el total de esa sesión

### Requirement: Ventana de las últimas 10 personas registradas

Registro al Comedor SHALL ofrecer una ventana emergente con las **últimas 10 personas** registradas
en la sesión actual, ordenadas de la más reciente a la más antigua
(`consumptionApi.list({ session_id, limit: 10 })`). La lista SHALL actualizarse tras cada registro
exitoso y al abrir la ventana.

#### Scenario: Ver las últimas 10

- **WHEN** el usuario abre la ventana de últimos registros
- **THEN** ve las 10 personas más recientes de la sesión, la más nueva primero

#### Scenario: Se actualiza al registrar

- **WHEN** el usuario registra una nueva persona
- **THEN** la lista se actualiza conservando solo las últimas 10
