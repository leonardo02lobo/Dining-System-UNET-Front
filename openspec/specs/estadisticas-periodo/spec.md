# estadisticas-periodo Specification

## Purpose
TBD - created by syncing change add-attendance-statistics. Update Purpose after archive.
## Requirements
### Requirement: Consulta de asistencia por rango de fechas

La app SHALL ofrecer una sección "Estadísticas por período" que consulte
`GET /api/v1/statistics/attendance/by-period` con `start_date` y `end_date` obligatorios. El
backend SHALL agregar asistencia real combinando `beneficiaries` (AccesoDirecto) y
`external_people` (ExternalPerson) mediante una única query de agregación, sin enviar registros
individuales al frontend.

#### Scenario: Fechas obligatorias

- **WHEN** el usuario intenta consultar sin fecha inicial o sin fecha final
- **THEN** la consulta no se ejecuta y se muestra "Debe seleccionar una fecha inicial y una fecha final."

#### Scenario: Rango inválido

- **WHEN** la fecha inicial es posterior a la fecha final
- **THEN** la consulta no se ejecuta y se muestra "La fecha inicial no puede ser posterior a la fecha final."

#### Scenario: Consulta exitosa incluye ambos límites

- **WHEN** el usuario consulta un rango válido
- **THEN** el backend incluye la asistencia de la fecha inicial y de la fecha final completas (00:00:00 a 23:59:59)

### Requirement: Filtros demográficos combinados

La sección SHALL permitir filtrar el resultado por tipo de persona (`STUDENT`, `TEACHER`,
`ADMINISTRATIVE`, `WORKER`, `JUBILADO`, `EXTERNO` o "Todos"), por género (`M`, `F` o "Todos") y por
una carrera del catálogo (`catalogo-carreras`), aplicados server-side sobre la misma consulta de
agregación.

#### Scenario: Filtrar por tipo de persona

- **WHEN** el usuario selecciona un tipo de persona distinto de "Todos"
- **THEN** las tarjetas y gráficas reflejan solo la asistencia de ese tipo

#### Scenario: Carrera solo aplica a resultados con estudiantes

- **WHEN** el usuario filtra por una carrera específica
- **THEN** el resultado incluye únicamente asistencia cuyo `career` coincide (normalizado) con esa
  carrera, sin importar si el tipo de persona filtrado es "Todos" o `STUDENT`

### Requirement: Selector de carrera condicional a estudiantes

El selector de carrera SHALL mostrarse únicamente cuando el tipo de persona seleccionado es
`STUDENT` o "Todos". Cuando el usuario cambie el tipo de persona a un valor distinto de `STUDENT`
o "Todos", el filtro de carrera SHALL limpiarse y no SHALL enviarse en la siguiente consulta.

#### Scenario: Ocultar carrera al elegir un tipo no estudiantil

- **WHEN** el usuario cambia el tipo de persona a `TEACHER`
- **THEN** el selector de carrera se oculta y su valor seleccionado se limpia

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

### Requirement: Estado sin resultados

Cuando la consulta no devuelva registros para el período y filtros seleccionados, la sección SHALL
mostrar "No se encontraron registros para el período y los filtros seleccionados." en lugar de
gráficas vacías o con valores en cero inventados.

#### Scenario: Período sin asistencia

- **WHEN** el rango de fechas y filtros seleccionados no tienen asistencia registrada
- **THEN** se muestra el mensaje de sin resultados y no se renderizan las gráficas

### Requirement: Consulta manual, no automática

La sección SHALL requerir que el usuario presione el botón "Consultar" para ejecutar la consulta.
Los cambios en los campos de fecha o en los filtros demográficos NO SHALL disparar una consulta
automática al backend.

#### Scenario: Cambiar un filtro no dispara la consulta

- **WHEN** el usuario cambia el tipo de persona sin presionar "Consultar"
- **THEN** los resultados mostrados siguen siendo los de la última consulta ejecutada

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
