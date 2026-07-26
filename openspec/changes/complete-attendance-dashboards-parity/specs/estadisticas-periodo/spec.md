## MODIFIED Requirements

### Requirement: Tarjetas de resumen y gráficas

La sección SHALL mostrar tarjetas con el total de personas atendidas y el desglose por tipo de
persona. Las gráficas mostradas SHALL depender del tipo de persona y de la carrera filtrados:

- Tipo de persona "Todos": gráfica de barras por tipo de persona + gráfica circular por género.
- `STUDENT` sin carrera seleccionada: gráfica de barras por carrera + gráfica de barras de
  asistencia diaria (secundaria) + gráfica circular por género.
- `STUDENT` con una carrera específica seleccionada: gráfica de barras de asistencia diaria de esa
  carrera (reemplaza la de carrera, que deja de aportar información con una sola carrera
  seleccionada) + gráfica circular por género.
- Cualquier otro tipo de persona (`TEACHER`, `ADMINISTRATIVE`, `WORKER`, `JUBILADO`, `EXTERNO`):
  gráfica de barras de asistencia diaria + gráfica circular por género.

Las gráficas SHALL basarse exclusivamente en los datos devueltos por el backend (incluyendo
`byDate`), sin agregar categorías o valores no presentes en la respuesta.

#### Scenario: Resultado con datos, tipo "Todos"

- **WHEN** la consulta devuelve asistencia con el tipo de persona en "Todos"
- **THEN** se muestran las tarjetas, la gráfica de barras por tipo de persona y la circular de género

#### Scenario: Resultado con datos, estudiantes sin carrera

- **WHEN** la consulta devuelve asistencia con tipo de persona `STUDENT` y sin carrera filtrada
- **THEN** se muestran la gráfica de barras por carrera, la gráfica de asistencia diaria y la circular de género

#### Scenario: Resultado con datos, estudiantes con carrera específica

- **WHEN** la consulta devuelve asistencia con tipo de persona `STUDENT` y una carrera filtrada
- **THEN** se muestra la gráfica de asistencia diaria de esa carrera (no la de carrera) y la circular de género

#### Scenario: Resultado con datos, otro tipo de persona

- **WHEN** la consulta devuelve asistencia con un tipo de persona distinto de "Todos" y `STUDENT`
- **THEN** se muestra la gráfica de asistencia diaria y la circular de género

## ADDED Requirements

### Requirement: Chips de filtros activos

La sección SHALL mostrar los filtros demográficos activos (tipo de persona, género, carrera) como
chips individuales, cada uno con una acción para quitar ese filtro específico sin afectar a los
demás. El rango de fechas SHALL mostrarse también como chip informativo, sin acción de quitar (las
fechas son obligatorias).

#### Scenario: Quitar un filtro desde su chip

- **WHEN** el usuario quita el chip de "Género: Femenino"
- **THEN** el filtro de género vuelve a "Todos" y el chip desaparece; los demás filtros no cambian

#### Scenario: Sin filtros demográficos activos

- **WHEN** no hay ningún filtro de tipo de persona, género o carrera aplicado
- **THEN** solo se muestra el chip informativo del rango de fechas

### Requirement: Botón de limpiar filtros

La sección SHALL ofrecer un botón "Limpiar" junto al de "Consultar" que restablece el rango de
fechas a su valor inicial y los filtros demográficos a "Todos", y limpia el resultado mostrado.

#### Scenario: Limpiar restablece el formulario

- **WHEN** el usuario presiona "Limpiar" tras haber consultado con filtros aplicados
- **THEN** las fechas vuelven a su rango por defecto, los filtros demográficos vuelven a "Todos", y
  los resultados/gráficas dejan de mostrarse hasta la siguiente consulta

### Requirement: Filtros persistidos en la URL

Los filtros de la sección (fechas y demográficos) SHALL reflejarse en los parámetros de consulta de
la URL en cada cambio, sin disparar una consulta automática al backend ni agregar una entrada nueva
al historial de navegación por cada cambio. Si la página se carga con parámetros de filtro en la
URL, el formulario SHALL inicializarse con esos valores.

#### Scenario: Compartir un enlace con filtros

- **WHEN** el usuario copia la URL actual después de ajustar los filtros y la abre en otra pestaña
- **THEN** el formulario se inicializa con los mismos filtros (sin ejecutar la consulta
  automáticamente)

#### Scenario: Cambiar un filtro no agrega entradas al historial

- **WHEN** el usuario cambia varios filtros seguidos
- **THEN** el botón "Atrás" del navegador no tiene que presionarse una vez por cada cambio de
  filtro para salir de la página
