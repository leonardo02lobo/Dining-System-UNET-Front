## MODIFIED Requirements

### Requirement: Filtro por rol en los entrantes de la sesión

El detalle de entrantes de una sesión SHALL ofrecer un control para **filtrar por rol**
(estudiante / administrativo / docente / obrero, más "Todos"). El filtrado SHALL aplicarse en el
cliente sobre `user_type` de los entrantes ya cargados y SHALL convivir con el filtro existente
"Solo acceso directo".

Las opciones SHALL incluir además **una por cada etiqueta de gente externa presente en los entrantes
cargados**. Se derivan de las filas que se están mostrando y NO del catálogo completo de etiquetas:
ofrecer la etiqueta de un evento por el que no entró nadie en esa sesión solo produce un filtro que
devuelve una tabla vacía.

El filtrado SHALL comparar contra la **clasificación efectiva** de la fila —`user_type` para un acceso
directo, `person_type` para una persona externa— y NO solo contra `user_type`. Comparando solo
`user_type`, cualquier rol seleccionado hace desaparecer de la tabla a toda la gente externa, que lo
tiene nulo: no habría ningún valor del filtro capaz de mostrarla.

La gráfica que acompaña al detalle SHALL agrupar a la gente externa **por etiqueta**, un sector por
etiqueta, y SHALL NOT reunirlas todas en un único sector «Externo». Los sectores de las etiquetas
SHALL ordenarse después de los cuatro roles del padrón. Las filas sin ninguna de las dos
clasificaciones SHALL contarse en un sector propio y SHALL NOT quedar fuera del recuento: una gráfica
cuyos sectores no suman el total de entrantes engaña más que una con un sector sobrante.

#### Scenario: Filtrar por un rol concreto

- **WHEN** el usuario elige el rol "Docente"
- **THEN** la tabla muestra únicamente los entrantes cuyo `user_type` es docente

#### Scenario: Opción "Todos"

- **WHEN** el usuario elige "Todos"
- **THEN** se muestran todos los entrantes y el filtro sigue combinándose con "Solo acceso directo"

#### Scenario: Filtrar por una etiqueta de gente externa

- **GIVEN** una sesión con entrantes de accesos directos y de personas externas con etiqueta
  «Jornada Deportiva»
- **WHEN** el usuario elige «Jornada Deportiva» en el filtro
- **THEN** la tabla muestra únicamente a las personas externas con esa etiqueta

#### Scenario: Las opciones describen lo que hay en la sesión

- **GIVEN** un catálogo con las etiquetas «Jubilado», «Externo» y «Congreso», y una sesión donde solo
  entraron jubilados
- **WHEN** se abre el detalle de esa sesión
- **THEN** el filtro ofrece los cuatro roles del padrón y «Jubilado», y no las otras dos

#### Scenario: Elegir un rol del padrón no borra la información de la gente externa

- **GIVEN** una sesión con entrantes de las dos clases
- **WHEN** el usuario elige «Estudiante» y después vuelve a «Todos»
- **THEN** la gente externa reaparece en la tabla

#### Scenario: La gráfica separa las etiquetas

- **GIVEN** una sesión con jubilados y con personas de la etiqueta «Congreso»
- **WHEN** se abre la gráfica por rol
- **THEN** hay un sector «Jubilado» y otro «Congreso», con sus recuentos separados
- **AND** los sectores suman el total de entrantes graficados
