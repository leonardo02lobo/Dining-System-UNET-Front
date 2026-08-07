## ADDED Requirements

### Requirement: Fecha de fin acotada en los modales de suspensión

Los dos formularios que crean una suspensión —el modal rápido del registro al comedor y la pantalla
de suspender usuario— SHALL ofrecer un campo **Fecha de fin** con el calendario acotado entre el día
actual y el día actual más 365 días.

El formulario SHALL ofrecer además una casilla **Indefinida** que envía la suspensión sin fecha de
fin. La suspensión indefinida SHALL ser una elección explícita del operador y no el efecto
secundario de dejar el campo vacío.

#### Scenario: Suspensión con fecha de fin

- **WHEN** el operador elige una fecha de fin dentro del rango permitido y confirma
- **THEN** la suspensión se crea con esa fecha de fin

#### Scenario: Suspensión indefinida

- **WHEN** el operador marca "Indefinida" y confirma
- **THEN** la suspensión se crea sin fecha de fin
- **AND** el campo de fecha queda deshabilitado mientras la casilla está marcada

#### Scenario: El calendario no ofrece fechas fuera del rango

- **WHEN** el operador despliega el calendario del campo
- **THEN** no puede seleccionar una fecha anterior a hoy ni posterior a hoy más 365 días

### Requirement: La validación del rango no depende solo del calendario

El panel SHALL validar la fecha de fin antes de enviar la petición, además de acotar el calendario.

Los atributos de límite de un campo de fecha restringen el selector pero no impiden escribir la fecha
a mano, de modo que sin esta validación el formulario dependería del servidor para un error que puede
señalar en el sitio.

#### Scenario: Fecha fuera de rango escrita a mano

- **WHEN** el operador teclea una fecha de fin posterior al límite y confirma
- **THEN** el formulario muestra el error junto al campo
- **AND** no se envía ninguna petición

#### Scenario: Rechazo del servidor

- **WHEN** el servidor rechaza el rango por cualquier motivo
- **THEN** el formulario muestra el mensaje de error recibido y la suspensión no se crea
