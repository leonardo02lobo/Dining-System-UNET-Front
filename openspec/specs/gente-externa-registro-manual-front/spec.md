# gente-externa-registro-manual-front Specification

## Purpose
TBD - created by archiving change fe-gente-externa-registro-manual. Update Purpose after archive.
## Requirements
### Requirement: «Registro Manual» registra el consumo de una persona externa

La pantalla «Registro Manual» SHALL guardar el consumo de una persona externa en la fecha
seleccionada. El corte que hoy responde «el registro manual todavía no admite personas externas»
SHALL desaparecer.

Cuando la persona consultada tenga `person_kind === 'external'`, el cuerpo del guardado SHALL llevar
`external_person_id` y SHALL NOT llevar `person`. Enviar `person` daría de alta un acceso directo con
la cédula de alguien que ya está registrado como persona externa: la misma persona en dos padrones,
contada dos veces.

El orden de resolución del cuerpo SHALL ser: `external_person_id` si la persona es externa; en su
defecto `acceso_directo_id`; y solo si no hay ninguno, el alta al vuelo con `person`.

Un rechazo del servidor SHALL mostrarse como error y SHALL NOT provocar un reintento con `person`.

El atajo de flecha ↓ SHALL guardar el registro de una persona externa igual que el de cualquier otra,
sin condiciones añadidas.

#### Scenario: Guardar el consumo de una persona externa

- **GIVEN** una persona externa consultada en «Registro Manual» y una fecha seleccionada
- **WHEN** el usuario pulsa Guardar
- **THEN** la petición lleva su `external_person_id` y la fecha
- **AND** la petición NO lleva el objeto `person`
- **AND** al responder el servidor se avisa del registro y el listado de la fecha se recarga

#### Scenario: El atajo ↓ también registra a una persona externa

- **GIVEN** una persona externa consultada
- **WHEN** el usuario pulsa la flecha ↓ fuera de un SELECT/TEXTAREA
- **THEN** se guarda el registro sin usar el ratón

#### Scenario: El acceso directo sigue registrándose como antes

- **GIVEN** un acceso directo consultado
- **WHEN** el usuario guarda
- **THEN** la petición lleva su `acceso_directo_id` y ningún `external_person_id`

#### Scenario: Quien no está en ninguna de las dos tablas sigue dándose de alta al vuelo

- **GIVEN** una persona que no es acceso directo ni persona externa
- **WHEN** el usuario guarda
- **THEN** la petición lleva el objeto `person` con sus datos

#### Scenario: Un rechazo no se reintenta con el alta al vuelo

- **GIVEN** una persona externa consultada
- **WHEN** el servidor rechaza el registro
- **THEN** se muestra el mensaje del error
- **AND** NO se envía una segunda petición con `person`

### Requirement: El listado de la fecha clasifica a la gente externa

Las dos pestañas del listado de la fecha —«Registros manuales» e «Ingresos del día»— SHALL clasificar
cada fila por su **clasificación efectiva**: el tipo de usuario traducido cuando la fila es de un
acceso directo, y el **nombre de la etiqueta tal como se guardó** cuando es de una persona externa.

La regla SHALL vivir en un único helper compartido, `user_type ?? person_type`, y SHALL usarse tanto
en la tabla como en el PDF del listado. El nombre de la etiqueta SHALL NOT pasar por ningún mapa de
rótulos del cliente: las etiquetas las crea quien administra y un mapa solo puede quedarse corto.

La fila de una persona externa SHALL llevar un distintivo visible que la separe de un acceso directo,
para que la etiqueta no se lea como un tipo del padrón.

Una fila sin ninguna de las dos clasificaciones SHALL mostrarse con el guion actual y SHALL NOT
romper la tabla ni la generación del PDF.

#### Scenario: La etiqueta se muestra en la tabla

- **GIVEN** un ingreso de una persona externa con etiqueta «Jornada Deportiva»
- **WHEN** se muestra el listado de esa fecha
- **THEN** su columna de tipo dice «Jornada Deportiva»
- **AND** la fila lleva un distintivo de persona externa

#### Scenario: El acceso directo conserva su rótulo traducido

- **GIVEN** un ingreso de un acceso directo con `user_type: "TEACHER"`
- **WHEN** se muestra el listado
- **THEN** su columna de tipo dice «Docente»

#### Scenario: El PDF clasifica igual que la tabla

- **GIVEN** un listado con un acceso directo y una persona externa
- **WHEN** se genera el PDF del listado
- **THEN** la columna Tipo escribe «Docente» y «Jornada Deportiva» respectivamente

#### Scenario: Servidor anterior sin la clasificación

- **GIVEN** un servidor que no envía `person_type`
- **WHEN** se muestra el listado
- **THEN** las filas de gente externa muestran el guion
- **AND** la tabla y el PDF siguen funcionando

### Requirement: Editar una fila manual de gente externa

El modal de edición de un registro manual SHALL admitir una fila de persona externa: SHALL abrirse con
su cédula y su fecha, y SHALL resolver la cédula nueva con la misma búsqueda de tres orígenes que la
consulta de la pantalla.

Al guardar, el cuerpo SHALL llevar `external_person_id` cuando la persona resuelta sea externa y
`acceso_directo_id` cuando sea un acceso directo, nunca los dos.

Cambiar solo la fecha de una fila de persona externa SHALL enviar únicamente la fecha, sin reasignar
la persona.

#### Scenario: Cambiar la fecha de un registro de gente externa

- **GIVEN** un registro manual de una persona externa
- **WHEN** el usuario cambia solo la fecha y confirma
- **THEN** la petición lleva la fecha y ningún identificador de persona

#### Scenario: Reasignar la fila a una persona externa

- **GIVEN** un registro manual de un acceso directo
- **WHEN** el usuario escribe la cédula de una persona externa activa y confirma
- **THEN** la petición lleva su `external_person_id`

#### Scenario: Reasignación rechazada

- **WHEN** el servidor rechaza la reasignación
- **THEN** se muestra el mensaje del error y el modal permanece abierto

