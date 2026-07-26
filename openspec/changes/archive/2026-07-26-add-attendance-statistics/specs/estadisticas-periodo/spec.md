## ADDED Requirements

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
persona, más una gráfica de barras (por tipo de persona o por carrera, según el filtro activo) y
una gráfica circular (distribución por género). Las gráficas SHALL basarse exclusivamente en los
datos devueltos por el backend, sin agregar categorías o valores no presentes en la respuesta.

#### Scenario: Resultado con datos

- **WHEN** la consulta devuelve asistencia
- **THEN** las tarjetas y ambas gráficas se actualizan con los valores agregados del backend

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
