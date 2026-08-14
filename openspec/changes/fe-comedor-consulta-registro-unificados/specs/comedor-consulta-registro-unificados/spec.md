## ADDED Requirements

### Requirement: Una sola pantalla de comedor para consultar y registrar

El sistema SHALL ofrecer **una única** pantalla de comedor, en `/comedor/registrar`, donde toda
búsqueda muestra la ficha completa de la persona —quién es, si ya consumió hoy y su estado de
sanción— y donde registrar el consumo es una acción sobre esa misma ficha.

`/comedor/consultar` NO SHALL renderizar una pantalla propia: SHALL redirigir a `/comedor/registrar`.

Las dos pantallas anteriores resolvían la misma pregunta con llamadas distintas y **respondían cosas
distintas a la misma cédula**. Mantener dos implementaciones de la misma consulta garantiza que
vuelvan a divergir.

La búsqueda SHALL resolverse contra los tres padrones (estudiantes, accesos directos y gente externa)
y SHALL fallar solo si fallan los tres.

El estado del día SHALL resolverse **por cédula**, de modo que responda también por quien todavía no
es acceso directo y por la gente externa.

#### Scenario: La misma cédula da la misma respuesta

- **GIVEN** una persona externa que ya registró consumo hoy
- **WHEN** el operador escanea su carnet
- **THEN** se muestra su ficha con sus datos
- **AND** se indica que ya registró su consumo, con la hora, la sede y el origen

#### Scenario: Acceso directo fuera del padrón de estudiantes

- **GIVEN** una persona registrada como acceso directo que no aparece en el padrón
- **WHEN** el operador consulta su cédula
- **THEN** su ficha se muestra igualmente

#### Scenario: La ruta antigua sigue llevando a alguna parte

- **WHEN** un usuario abre `/comedor/consultar` (por marcador o enlace guardado)
- **THEN** se le redirige a `/comedor/registrar`

### Requirement: Consultar no depende de la sede ni de la sesión abierta

La pantalla SHALL permitir buscar a una persona **siempre**, con independencia de que haya una sede
seleccionada o una sesión de servicio abierta.

Lo que la falta de sesión SHALL bloquear es **registrar el consumo**, no consultarlo. Que el campo de
cédula estuviera deshabilitado sin sesión es lo que obligaba a existir a una segunda pantalla para
consultar fuera del horario de servicio.

Cuando el registro esté bloqueado, la pantalla SHALL decir cuál es el motivo (sin sede, sin sesión o
sin permiso), en lugar de limitarse a apagar el botón.

#### Scenario: Consulta fuera del horario de servicio

- **GIVEN** ninguna sesión abierta en la sede del operador
- **WHEN** consulta una cédula
- **THEN** la ficha se muestra completa, con su estado de consumo y de sanción
- **AND** el botón de registrar está deshabilitado, indicando que no hay sesión abierta

#### Scenario: Escaneo sin sede seleccionada

- **WHEN** se pasa un carnet por el lector sin haber elegido sede
- **THEN** la búsqueda se realiza y la ficha se muestra

### Requirement: El estado de la persona se afirma, no se deduce de una ausencia

Con una persona en pantalla, la vista SHALL mostrar **siempre** dos estados explícitos: **consumo del
día** y **sanción**, incluido cuando la respuesta es favorable.

Un estado favorable dibujado como "nada en pantalla" obliga al operador a interpretar una ausencia
con el lector en la mano; y es indistinguible de un fallo de carga.

Cuando la comprobación del consumo no pueda completarse, la vista SHALL decirlo como tal. Un fallo NO
SHALL presentarse como "no ha consumido".

El conteo histórico de suspensiones SHALL mostrarse en la ficha de la persona, fuera de la cascada
del "aviso más grave", de modo que no lo tape otro aviso.

Una persona sin sanción activa pero inactiva en el padrón SHALL distinguirse de una sancionada: son
dos hechos distintos con dos explicaciones distintas.

#### Scenario: Todo en orden

- **WHEN** se consulta a alguien sin consumo hoy y sin sanción activa
- **THEN** se muestra "No ha consumido en la sesión de hoy"
- **AND** se muestra "Sin sanción activa"

#### Scenario: La comprobación de consumo falla

- **WHEN** la consulta de consumo del día no puede completarse
- **THEN** la caja de consumo indica que no se pudo comprobar
- **AND** no afirma que la persona no haya consumido
- **AND** el registro sigue siendo posible, con el rechazo del servidor como último guardia

#### Scenario: Suspensiones visibles junto a otro aviso

- **GIVEN** una persona sin acceso directo con tres suspensiones históricas
- **WHEN** se la consulta
- **THEN** se ve el aviso de alta al vuelo **y** el conteo de suspensiones

#### Scenario: Inactiva en el padrón no es lo mismo que sancionada

- **GIVEN** una persona sin sanción activa y marcada como no activa en el padrón
- **WHEN** se la consulta
- **THEN** el motivo del bloqueo dice que no está activa en el padrón, no que esté sancionada

### Requirement: Modo de solo consulta gobernado por permiso

La pantalla SHALL abrirse para quien tenga `/comedor/registrar` **o** `/comedor/consultar`.

Con `/comedor/consultar` y sin `/comedor/registrar`, la pantalla SHALL funcionar en **modo consulta**:
sin acción de registrar, sin suspensión rápida, sin atajo de teclado de registro y sin el contador
del turno ni la relación de últimos registros —cuyo endpoint no admite ese permiso y respondería 403
en cada refresco.

La capacidad de registrar SHALL resolverse con el permiso `/comedor/registrar` exacto y NO SHALL
heredarse del permiso de consulta. Es el mismo permiso que exige `POST /consumptions/` en el
servidor; concederlo en el cliente solo adelanta el 403.

La pantalla SHALL indicar que está en modo consulta, en lugar de mostrar acciones apagadas sin
explicación.

#### Scenario: Usuario de solo consulta

- **GIVEN** un usuario con `/comedor/consultar` y sin `/comedor/registrar`
- **WHEN** abre `/comedor/registrar`
- **THEN** la pantalla se muestra y puede buscar personas
- **AND** no se ofrece registrar consumo ni suspender
- **AND** no se muestran el contador del turno ni los últimos registros

#### Scenario: No hay bucle de redirección

- **GIVEN** ese mismo usuario
- **WHEN** entra en la aplicación y es enviado a su ruta por defecto
- **THEN** llega a una pantalla que puede abrir, sin rebotes sucesivos

#### Scenario: El operador de taquilla no pierde nada

- **GIVEN** un usuario con `/comedor/registrar`
- **WHEN** abre la pantalla
- **THEN** dispone de registro, suspensión rápida, contador del turno, últimos registros y atajo de
  teclado

### Requirement: Ningún campo vacío en pantalla

La pantalla NO SHALL dibujar campos, cajas ni marcadores sin valor.

Sin persona consultada, la zona de la persona SHALL reducirse a **una** indicación de qué hacer, y NO
SHALL mostrarse una ficha con campos en blanco, guiones de relleno ni insignias de estado
desconocido. Un campo vacío ocupa alto —escaso, en una pantalla que debe caber sin scroll— y enseña a
mirar sin leer.

La caja de estado de la última acción SHALL mostrarse únicamente cuando haya un mensaje. La
estabilidad de la maquetación SHALL conseguirse con el contenedor, no rellenando contenido con
espacios.

El contador del turno y la fecha del turno SHALL mostrarse solo cuando exista sesión; sin ella, el
aviso de sesión es lo que corresponde mostrar.

Las acciones SHALL ocupar una posición fija y deshabilitarse cuando no procedan, en lugar de aparecer
y desaparecer moviendo el resto de la interfaz.

#### Scenario: Pantalla recién abierta

- **WHEN** el operador abre la pantalla sin haber consultado a nadie
- **THEN** no hay ningún campo de datos en blanco, ni ficha de marcadores, ni caja de estado vacía
- **AND** una sola línea indica que escanee un carnet o escriba una cédula

#### Scenario: Persona consultada

- **WHEN** hay una persona en pantalla
- **THEN** todo campo visible de su ficha tiene valor

#### Scenario: Sin sesión abierta

- **WHEN** no hay sesión de servicio en la sede seleccionada
- **THEN** no se muestran un contador vacío ni una fecha de turno con un guion
- **AND** el aviso de sesión explica la situación

#### Scenario: Las acciones no saltan

- **WHEN** el operador pasa de no tener persona a tenerla y vuelve a limpiar
- **THEN** los botones permanecen en el mismo sitio, cambiando solo su estado habilitado
