## ADDED Requirements

### Requirement: La etiqueta se elige de un catálogo y se puede crear sin salir del formulario

El formulario de alta y edición de una persona externa SHALL presentar un campo **Etiqueta** que
SHALL ser un desplegable alimentado por el catálogo del servidor, y NO SHALL ofrecer una lista fija de
valores escritos en el cliente.

El desplegable SHALL incluir una última opción **«+ Nueva etiqueta…»** que SHALL sustituirlo por un
campo de texto con las acciones *Crear* y *Cancelar*. Al crear, la etiqueta nueva SHALL quedar
seleccionada sin recargar la pantalla ni perder lo ya escrito en el resto del formulario.

Cuando el servidor rechace la creación por nombre repetido, el cliente SHALL seleccionar la etiqueta
que ya existía y SHALL avisar de que ya estaba, en lugar de mostrar un error: elegirla es lo que la
persona quería.

Cuando el servidor rechace el nombre por estar reservado, el cliente SHALL mostrar el motivo junto al
campo y SHALL mantener abierto el modo de creación.

La etiqueta SHALL ser obligatoria: no se SHALL poder guardar una persona externa sin ella.

El cliente SHALL NOT mantener ningún mapa de nombres de etiqueta a rótulos. El nombre se muestra tal
como el servidor lo devuelve.

#### Scenario: Elegir una etiqueta existente

- **WHEN** se abre el formulario de alta
- **THEN** el desplegable de etiqueta trae las etiquetas del catálogo
- **AND** `Jubilado` y `Externo` están entre ellas

#### Scenario: Crear una etiqueta desde el formulario

- **GIVEN** el formulario de alta con nombre y cédula ya escritos
- **WHEN** se elige «+ Nueva etiqueta…», se escribe `Congreso Julio 2026` y se pulsa *Crear*
- **THEN** la etiqueta queda creada y seleccionada
- **AND** el nombre y la cédula siguen escritos

#### Scenario: Cancelar la creación

- **WHEN** se entra en el modo de creación y se pulsa *Cancelar*
- **THEN** vuelve el desplegable con la selección que había antes

#### Scenario: Nombre repetido

- **GIVEN** una etiqueta `Congreso Julio 2026` ya existente
- **WHEN** se intenta crear `congreso julio 2026`
- **THEN** el formulario selecciona la etiqueta existente
- **AND** avisa de que ya estaba, sin mostrar un error

#### Scenario: Nombre reservado

- **WHEN** se intenta crear una etiqueta llamada `worker`
- **THEN** el motivo del rechazo aparece junto al campo
- **AND** el modo de creación sigue abierto para corregirlo

#### Scenario: Guardar sin etiqueta

- **WHEN** se intenta registrar una persona externa sin elegir etiqueta
- **THEN** el formulario lo impide y lo señala en el campo

#### Scenario: Editar la etiqueta de alguien

- **GIVEN** una persona externa etiquetada como `Externo`
- **WHEN** se edita su ficha y se elige otra etiqueta
- **THEN** el cambio se guarda y la tabla lo refleja

### Requirement: El listado se filtra y se rotula por etiqueta

La barra de filtros de la pantalla de gente externa SHALL ofrecer un filtro por **etiqueta**
alimentado por el catálogo, en lugar del filtro por tipo de persona.

La columna que hoy muestra el tipo SHALL titularse **Etiqueta** y SHALL mostrar el nombre guardado.

El filtro SHALL combinarse con la búsqueda por nombre o cédula y con el filtro de estado, como hoy.

#### Scenario: Filtrar por etiqueta

- **GIVEN** personas repartidas entre `Jubilado` y `Congreso Julio 2026`
- **WHEN** se filtra por `Congreso Julio 2026`
- **THEN** la tabla muestra únicamente a esa gente

#### Scenario: La columna muestra el nombre guardado

- **GIVEN** una persona etiquetada como `Congreso Julio 2026`
- **WHEN** se mira su fila
- **THEN** la celda de etiqueta dice `Congreso Julio 2026`

#### Scenario: Filtros combinados

- **WHEN** se filtra por una etiqueta y se busca por cédula a la vez
- **THEN** la tabla aplica las dos condiciones

### Requirement: Baja en lote de todas las personas de una etiqueta

La pantalla SHALL ofrecer la acción **«Dar de baja a todos los de esta etiqueta»**, que SHALL abrir un
modal de confirmación antes de hacer nada.

El modal SHALL mostrar el **nombre de la etiqueta** y **cuántas personas** alcanza, y SHALL exigir que
se teclee el nombre exacto de la etiqueta para habilitar el botón de confirmación. Con el campo vacío
o con un texto distinto, el botón SHALL permanecer deshabilitado.

El modal SHALL decir explícitamente que las personas quedan **inactivas**, que dejan de poder acceder
al comedor y que **su historial de consumos se conserva**.

La acción SHALL mostrarse únicamente a un usuario con rol `SUPER_ADMIN`, que es lo que el servidor
exige. Ocultarla al resto es informativo: el 403 del servidor sigue siendo la autoridad y el cliente
SHALL mostrar su mensaje si llega.

Al terminar, la pantalla SHALL informar del recuento **devuelto por el servidor** —cuántas se
desactivaron y cuántas ya lo estaban— y SHALL recargar el listado con los filtros vigentes.

La etiqueta SHALL seguir disponible en el catálogo tras la baja: vaciarla no es borrarla.

El modal SHALL construirse con el `Modal` de la aplicación. `confirm()` y `prompt()` SHALL NOT usarse.

#### Scenario: Baja de un grupo completo

- **GIVEN** una etiqueta con cuarenta personas
- **WHEN** un SUPER_ADMIN abre la acción de baja en lote
- **THEN** el modal indica que alcanza a cuarenta personas

#### Scenario: La confirmación exige el nombre

- **GIVEN** el modal de baja en lote de `Congreso Julio 2026`
- **WHEN** el campo de confirmación está vacío o dice otra cosa
- **THEN** el botón de confirmar está deshabilitado

#### Scenario: Confirmación correcta

- **WHEN** se teclea `Congreso Julio 2026` y se confirma
- **THEN** el cliente invoca la baja en lote de esa etiqueta
- **AND** al terminar informa de cuántas quedaron inactivas y cuántas ya lo estaban

#### Scenario: El listado se recarga

- **GIVEN** el filtro de estado en «Activo» y el de etiqueta en la etiqueta dada de baja
- **WHEN** termina la baja en lote
- **THEN** la tabla se recarga y queda vacía

#### Scenario: La etiqueta sobrevive

- **WHEN** termina la baja en lote
- **THEN** la etiqueta sigue disponible en el desplegable del formulario

#### Scenario: La acción no se ofrece a quien no puede

- **GIVEN** un usuario con `/gente-externa` y rol distinto de `SUPER_ADMIN`
- **WHEN** entra en la pantalla
- **THEN** la acción de baja en lote no aparece
- **AND** la baja individual y el resto de la pantalla siguen disponibles

#### Scenario: Rechazo del servidor

- **WHEN** el servidor responde 403 a la baja en lote
- **THEN** el modal muestra el mensaje del servidor y no deja el listado en un estado falso

#### Scenario: Sin diálogos nativos

- **WHEN** se revisan las páginas
- **THEN** no hay ninguna llamada a `confirm()`, `alert()` ni `prompt()`

### Requirement: La pantalla dice qué hace realmente una baja

Los textos de la baja individual y de la baja en lote SHALL describir el efecto real: la persona pasa
a **inactiva**, deja de poder acceder al comedor y **sus consumos ya registrados se conservan**.

La pantalla SHALL NOT decir «eliminada» a secas para una operación que no borra nada. Quien cree que
ha borrado registros y luego los ve en un reporte deja de fiarse de lo que la pantalla le dice.

#### Scenario: Texto de la baja individual

- **WHEN** se abre la confirmación de baja de una persona
- **THEN** el texto dice que quedará inactiva y que su historial se conserva

#### Scenario: Mensaje posterior

- **WHEN** la baja termina correctamente
- **THEN** el aviso dice que la persona quedó inactiva, no que fue eliminada
