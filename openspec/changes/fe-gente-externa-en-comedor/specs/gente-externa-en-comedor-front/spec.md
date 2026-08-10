## ADDED Requirements

### Requirement: La búsqueda de las pantallas de comedor resuelve también gente externa

`studentApi.lookup(q)` SHALL consultar **tres** orígenes en paralelo —padrón de estudiantes, acceso
directo y persona externa— y SHALL fallar únicamente cuando **los tres** fallen.

Hoy lanza en cuanto falla el padrón, de modo que una persona externa —que por definición no está en el
padrón— nunca llega a mostrarse. Ese es el fallo que este requisito elimina.

La fusión SHALL respetar esta precedencia:

- El **padrón** es la base de la ficha y la fuente autoritativa de `career`.
- El **acceso directo** impone `acceso_directo_id` y manda en `user_type`.
- La **persona externa** se usa como base únicamente cuando los otros dos no resolvieron.

Cuando una misma cédula exista como acceso directo y como persona externa, SHALL resolverse como
acceso directo: es la misma precedencia que aplica el servidor y la única clase de persona que puede
arrastrar una sanción.

El objeto `Student` que devuelve SHALL incluir `person_kind` (`'roster'`, `'acceso_directo'` o
`'external'`) y `external_person_id` cuando corresponda. La clase de persona SHALL viajar explícita y
NO SHALL deducirse de qué campos vinieron vacíos.

El mensaje de "no encontrado" SHALL seguir siendo uno solo, referido a que la persona no está en
ningún padrón, y NO SHALL revelar cuál de las tres búsquedas falló.

#### Scenario: Se consulta a una persona externa desde el registro al comedor

- **GIVEN** una persona registrada en Gente Externa y no presente en el padrón
- **WHEN** se teclea su cédula en `/comedor/registrar` y se consulta
- **THEN** su ficha aparece en pantalla
- **AND** `person_kind` es `'external'` con su `external_person_id`

#### Scenario: El estudiante del padrón no cambia de comportamiento

- **GIVEN** un estudiante del padrón que no es acceso directo
- **WHEN** se le consulta
- **THEN** la ficha se compone igual que hasta ahora, con su carrera del padrón

#### Scenario: El acceso directo tiene precedencia

- **GIVEN** una misma cédula presente como acceso directo y como persona externa
- **WHEN** se la consulta
- **THEN** la ficha resuelve el acceso directo
- **AND** `person_kind` es `'acceso_directo'`

#### Scenario: Nadie la conoce

- **WHEN** se consulta una cédula que no está en el padrón, ni como acceso directo, ni como persona
  externa
- **THEN** la pantalla informa de que no se encontró a la persona
- **AND** el mensaje no menciona cuál de las búsquedas falló

#### Scenario: Una persona externa dada de baja no aparece

- **GIVEN** una persona externa en estado inactivo
- **WHEN** se la consulta desde la taquilla
- **THEN** la pantalla informa de que no se encontró a la persona

#### Scenario: Las tres pantallas que comparten la búsqueda

- **WHEN** se consulta a una persona externa desde registro al comedor, desde registro manual o desde
  la pantalla de suspensión
- **THEN** las tres muestran su ficha

### Requirement: El consumo de una persona externa se registra con su propio identificador

Al registrar el consumo, el cliente SHALL enviar `external_person_id` cuando `person_kind` sea
`'external'`, y SHALL NOT enviar el objeto `person` del alta al vuelo.

El alta al vuelo existe para el estudiante del padrón que todavía no es acceso directo. Usarla con una
persona externa crearía un acceso directo con su misma cédula: la misma persona en dos padrones,
contada dos veces en las estadísticas.

El orden de resolución SHALL ser: `external_person_id` si la persona es externa; en su defecto
`acceso_directo_id`; y solo si no hay ninguno de los dos, el alta al vuelo.

Un consumo duplicado SHALL seguir tratándose como hoy —aviso con alarma a partir del 409— sea cual sea
la clase de persona.

#### Scenario: Registro de una persona externa

- **GIVEN** la ficha de una persona externa en pantalla y una sesión abierta
- **WHEN** se registra su consumo
- **THEN** la petición lleva `external_person_id`
- **AND** no lleva el objeto `person`

#### Scenario: No se crea un acceso directo duplicado

- **WHEN** se registra el consumo de una persona externa
- **THEN** no se da de alta ningún acceso directo con su cédula

#### Scenario: El estudiante del padrón conserva su alta al vuelo

- **GIVEN** un estudiante del padrón que aún no es acceso directo
- **WHEN** se registra su consumo
- **THEN** la petición lleva el objeto `person` con su carrera y su tipo, como hasta ahora

#### Scenario: Duplicado de una persona externa

- **GIVEN** una persona externa que ya comió hoy
- **WHEN** se intenta registrar su consumo y el servidor responde 409
- **THEN** aparece el aviso de duplicado con su alarma, igual que para un acceso directo

### Requirement: La ficha de una persona externa no ofrece lo que no existe para ella

La tarjeta de resultado SHALL distinguir visiblemente a una persona externa, y para ella SHALL:

- NO mostrar el conteo histórico de suspensiones ni consultar la sanción activa. A la gente externa no
  se la sanciona, y esas peticiones no SHALL lanzarse.
- NO ofrecer la acción de suspender.
- Mostrar su **etiqueta** en el lugar donde un estudiante muestra su tipo de usuario.

En la pantalla de suspensión, una persona externa SHALL mostrarse con la acción deshabilitada y el
motivo escrito —que a la gente externa no se la sanciona—, y NO SHALL ocultarse ni tratarse como no
encontrada. Ocultarla devolvería el "no la encuentra" que este cambio elimina.

#### Scenario: Ficha sin promesas vacías

- **WHEN** se consulta a una persona externa desde el registro al comedor
- **THEN** su ficha no muestra conteo de suspensiones
- **AND** no ofrece el botón de suspender

#### Scenario: Sin peticiones inútiles

- **WHEN** se consulta a una persona externa
- **THEN** no se piden ni su sanción activa ni su histórico de suspensiones

#### Scenario: La etiqueta ocupa el lugar del tipo de usuario

- **GIVEN** una persona externa etiquetada como `Congreso Julio 2026`
- **WHEN** se mira su ficha
- **THEN** ese nombre aparece donde un estudiante mostraría su tipo de usuario

#### Scenario: Una persona externa en la pantalla de suspensión

- **WHEN** se consulta a una persona externa desde `/comedor/suspender`
- **THEN** su ficha se muestra
- **AND** la acción de suspender está deshabilitada con el motivo a la vista

#### Scenario: El acceso directo conserva su ficha completa

- **WHEN** se consulta a un acceso directo
- **THEN** su ficha sigue mostrando el conteo de suspensiones y la acción de suspender

### Requirement: El aviso previo de consumo del día cubre a la gente externa

La consulta SHALL seguir preguntando por `check-by-document` en paralelo con la búsqueda, y SHALL
mostrar el aviso de "ya comió hoy" —y apagar el botón de registrar— también cuando la persona sea
externa.

El cliente SHALL tolerar que el servidor no traiga aún los campos `person_kind` y
`external_person_id` en esa respuesta: en ese caso SHALL mostrar la ficha y permitir el registro, y el
duplicado lo atrapará el 409 con su aviso y su alarma. La ausencia de un campo nuevo SHALL NOT romper
la pantalla.

#### Scenario: Persona externa que ya comió

- **GIVEN** una persona externa con consumo registrado hoy y un servidor que lo informa
- **WHEN** se la consulta en la taquilla
- **THEN** el aviso de consumo previo aparece **antes** de intentar registrarla
- **AND** el botón de registrar queda apagado

#### Scenario: Servidor sin los campos nuevos

- **GIVEN** un servidor que aún responde sin `person_kind`
- **WHEN** se consulta a una persona externa
- **THEN** su ficha se muestra y el registro sigue disponible
- **AND** la pantalla no falla por la ausencia del campo
