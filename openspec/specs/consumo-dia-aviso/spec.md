# consumo-dia-aviso Specification

## Purpose
TBD - created by archiving change fe-mejoras-operativas-comedor. Update Purpose after archive.
## Requirements
### Requirement: Aviso de consumo previo al consultar a la persona


Al consultar una cédula en el registro al comedor, el panel SHALL informar si esa persona ya registró
consumo, **antes** de que el operador intente registrarla.

La consulta SHALL lanzarse en paralelo con la búsqueda de la persona y SHALL mostrarse en la ficha de
resultado, no en un diálogo: el operador necesita el dato mientras mira la ficha, no interrumpiendo
su trabajo.

El aviso SHALL indicar la hora del consumo, la sede y si se registró en taquilla o manualmente. Un
aviso genérico no permitiría al taquillero explicarle a la persona qué ocurrió.

Cuando haya consumo previo, el botón de registrar SHALL quedar deshabilitado.

El diálogo actual de consumo duplicado disparado por el rechazo del servidor SHALL conservarse: es lo
que atrapa el caso en que dos taquillas registran a la misma persona simultáneamente, que ninguna
consulta previa puede prevenir.

#### Scenario: La persona ya comió hoy

- **WHEN** el taquillero consulta la cédula de alguien que ya registró consumo hoy
- **THEN** la ficha muestra el aviso con la hora, la sede y el origen del consumo
- **AND** el botón de registrar consumo queda deshabilitado

#### Scenario: La persona no ha comido

- **WHEN** el taquillero consulta la cédula de alguien sin consumo hoy
- **THEN** no se muestra ningún aviso de consumo previo
- **AND** el botón de registrar consumo permanece disponible

#### Scenario: Persona que aún no es acceso directo

- **WHEN** el taquillero consulta a alguien que nunca ha comido y no está registrado como acceso
  directo
- **THEN** la consulta se resuelve sin error y sin aviso de consumo previo
- **AND** el flujo de alta al vuelo sigue disponible

#### Scenario: La consulta falla

- **WHEN** la consulta de consumo previo no puede completarse
- **THEN** la ficha se muestra igualmente con los datos de la persona
- **AND** el registro sigue siendo posible, quedando el rechazo del servidor como último guardia

### Requirement: El aviso del registro manual usa la fecha seleccionada


En el registro manual, la comprobación de consumo previo SHALL hacerse sobre **la fecha seleccionada
en el formulario**, no sobre el día actual.

Esa pantalla registra consumos de fechas pasadas; avisar de lo que la persona comió hoy mientras se
le registra un consumo de otro día sería ruido y entrenaría al operador a ignorar el aviso.

#### Scenario: Registro manual de una fecha pasada

- **GIVEN** una persona con consumo registrado hoy y sin consumo el día 3
- **WHEN** el operador selecciona el día 3 y consulta su cédula
- **THEN** no se muestra aviso de consumo previo

#### Scenario: Cambio de fecha con la persona ya consultada

- **GIVEN** una persona ya consultada en el registro manual
- **WHEN** el operador cambia la fecha del formulario
- **THEN** la comprobación se rehace sobre la nueva fecha

### Requirement: Relación de ingresos del día


El registro manual SHALL ofrecer una vista con **todos** los ingresos de la fecha seleccionada,
indicando por fila si el consumo se registró en taquilla o manualmente.

El listado actual solo muestra los registros manuales, de modo que quien entró por taquilla resulta
invisible en esa pantalla; esa omisión es la que lleva a registrar dos veces a la misma persona.

#### Scenario: Ambos orígenes en la misma relación

- **GIVEN** una fecha con un consumo de taquilla y otro manual
- **WHEN** el operador abre la relación de ingresos de esa fecha
- **THEN** ve las dos filas
- **AND** cada una indica su origen

#### Scenario: Fecha sin ingresos

- **WHEN** el operador abre la relación de una fecha sin consumos
- **THEN** el panel muestra el estado vacío correspondiente y ningún error
