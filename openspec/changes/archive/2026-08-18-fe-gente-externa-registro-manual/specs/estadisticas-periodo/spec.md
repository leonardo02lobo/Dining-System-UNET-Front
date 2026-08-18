## MODIFIED Requirements

### Requirement: Filtros demográficos combinados

La sección SHALL permitir filtrar el resultado por tipo de persona, por género (`M`, `F` o "Todos") y
por una carrera del catálogo (`catalogo-carreras`), aplicados server-side sobre la misma consulta de
agregación.

Las opciones de tipo de persona SHALL ser "Todos", los cuatro tipos del padrón (`STUDENT`, `TEACHER`,
`ADMINISTRATIVE`, `WORKER`) y **las etiquetas de gente externa del catálogo del servidor**
(`GET /external-people/labels`). SHALL NOT ser una lista fija escrita en el cliente: desde que las
etiquetas las crea quien administra el comedor, una lista fija no puede ofrecer la etiqueta que se
creó ayer, y el servidor ya admite en este filtro cualquier nombre del catálogo.

Los cuatro tipos del padrón SHALL seguir escritos en el cliente con su rótulo traducido —son un
enumerado del servidor—, mientras que el nombre de una etiqueta SHALL mostrarse tal como se guardó,
sin pasar por ningún mapa de rótulos.

Si la consulta del catálogo de etiquetas falla, el desplegable SHALL quedarse con "Todos" y los cuatro
tipos del padrón, y el panel SHALL seguir funcionando. Perder las etiquetas del filtro es un
desperfecto; no cargar la pantalla es una avería.

#### Scenario: Filtrar por tipo de persona

- **WHEN** el usuario selecciona un tipo de persona distinto de "Todos"
- **THEN** las tarjetas y gráficas reflejan solo la asistencia de ese tipo

#### Scenario: Carrera solo aplica a resultados con estudiantes

- **WHEN** el usuario filtra por una carrera específica
- **THEN** el resultado incluye únicamente asistencia cuyo `career` coincide (normalizado) con esa
  carrera, sin importar si el tipo de persona filtrado es "Todos" o `STUDENT`

#### Scenario: Filtrar por una etiqueta creada por el administrador

- **GIVEN** una etiqueta «Jornada Deportiva» creada en la pantalla de gente externa
- **WHEN** se abre el panel de asistencia por período
- **THEN** el filtro de tipo de persona ofrece «Jornada Deportiva»
- **AND** al elegirla, la consulta se envía con ese nombre y el resultado se acota a esa gente

#### Scenario: El catálogo no responde

- **WHEN** la consulta del catálogo de etiquetas falla
- **THEN** el filtro ofrece "Todos" y los cuatro tipos del padrón
- **AND** el panel consulta y muestra resultados con normalidad

#### Scenario: La carrera sigue siendo cosa de estudiantes

- **WHEN** el usuario elige una etiqueta de gente externa como tipo de persona
- **THEN** el selector de carrera se oculta y su valor se limpia, igual que con un tipo no estudiantil
