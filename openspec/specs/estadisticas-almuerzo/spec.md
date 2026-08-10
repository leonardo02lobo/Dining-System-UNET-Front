# estadisticas-almuerzo Specification

## Purpose
TBD - created by syncing change add-attendance-statistics. Update Purpose after archive.
## Requirements
### Requirement: Selección de turno de servicio (LunchSession) por fecha

La app SHALL ofrecer una sección "Estadísticas por almuerzo" donde el usuario primero selecciona
una fecha y el sistema carga los turnos (`LunchSession`) de esa fecha vía
`GET /api/v1/lunch-sessions/?from_date=&to_date=` (mismo valor en ambos). El usuario SHALL elegir
un turno específico por su `id` antes de ver cualquier estadística demográfica.

#### Scenario: Fecha sin turnos

- **WHEN** la fecha seleccionada no tiene turnos de servicio registrados
- **THEN** se muestra "No existen almuerzos registrados para la fecha seleccionada." y el selector
  de turno queda vacío

#### Scenario: Cambiar la fecha limpia el turno seleccionado

- **WHEN** el usuario cambia la fecha después de haber seleccionado un turno
- **THEN** el turno seleccionado y las estadísticas mostradas se limpian, y se cargan los turnos de
  la nueva fecha

#### Scenario: Sin turno seleccionado no hay estadísticas

- **WHEN** el usuario aún no ha seleccionado un turno
- **THEN** se muestra "Seleccione un almuerzo para visualizar sus estadísticas." y no se realiza
  ninguna consulta de estadísticas

### Requirement: Resumen del turno seleccionado

Al seleccionar un turno, la app SHALL consultar
`GET /api/v1/statistics/attendance/by-lunch-session/{lunch_session_id}` y mostrar una tarjeta de
resumen con: fecha, estado (`OPEN`/`CLOSED`), nombre del menú (best-effort, `null` si no hay
`Lunch` con la misma fecha), cantidad planificada, cantidad servida (conteo real de
`consumptions` de ese turno) y cantidad restante.

#### Scenario: Menú no identificado

- **WHEN** no existe ningún `Lunch` con la misma fecha que el turno seleccionado
- **THEN** la tarjeta de resumen muestra "Menú no especificado" en vez de un error o dato inventado

#### Scenario: Servidos no exceden planificados

- **WHEN** la cantidad servida es menor o igual a la planificada
- **THEN** se muestra `restante = planificado - servido`, nunca un valor negativo

#### Scenario: Servidos exceden planificados

- **WHEN** la cantidad servida es mayor que la planificada
- **THEN** se muestra un excedente (`servido - planificado`) en vez de una cantidad restante negativa

#### Scenario: Planificados en cero

- **WHEN** la cantidad planificada del turno es cero o nula
- **THEN** el porcentaje de cumplimiento se muestra como no disponible, sin dividir por cero

### Requirement: Filtros demográficos scoped al turno

La sección SHALL permitir filtrar la asistencia del turno seleccionado por tipo de persona
(`STUDENT`, `TEACHER`, `ADMINISTRATIVE`, `WORKER`, `JUBILADO`, `EXTERNO` o "Todos"), género y
carrera del catálogo (`catalogo-carreras`), sin mezclar registros de otros turnos.

#### Scenario: Filtrar asistencia de un turno específico

- **WHEN** el usuario aplica un filtro de tipo de persona sobre un turno seleccionado
- **THEN** las gráficas muestran únicamente asistencia de ese `lunch_session_id` que cumple el filtro

### Requirement: Selector de carrera condicional a estudiantes

Igual que en `estadisticas-periodo`, el selector de carrera SHALL mostrarse únicamente cuando el
tipo de persona sea `STUDENT` o "Todos", y limpiarse al cambiar a cualquier otro tipo.

#### Scenario: Ocultar carrera al elegir un tipo no estudiantil

- **WHEN** el usuario cambia el tipo de persona a `WORKER` dentro de la sección por almuerzo
- **THEN** el selector de carrera se oculta y su valor seleccionado se limpia

### Requirement: Turno sin asistencia registrada

Cuando el turno seleccionado no tenga registros de `consumptions`, la sección SHALL mostrar "Este
almuerzo no posee registros de personas atendidas." en vez de gráficas vacías.

#### Scenario: Turno recién abierto sin consumos

- **WHEN** el turno seleccionado tiene estado `OPEN` y cero consumos registrados
- **THEN** se muestra el mensaje de sin registros y no se renderizan las gráficas demográficas

### Requirement: Chips de filtros activos


La sección SHALL mostrar los filtros demográficos activos (tipo de persona, género, carrera) del
turno seleccionado como chips individuales, cada uno con una acción para quitar ese filtro
específico sin afectar a los demás ni al turno/fecha seleccionados.

#### Scenario: Quitar un filtro desde su chip

- **WHEN** el usuario quita el chip de "Tipo de persona: Estudiantes" con un turno seleccionado
- **THEN** el filtro de tipo de persona vuelve a "Todos", las gráficas se actualizan, y el turno
  seleccionado no cambia

### Requirement: Limpieza de filtros con dos acciones


La sección SHALL ofrecer dos acciones de limpieza distintas:

- "Limpiar filtros": restablece tipo de persona, género y carrera a "Todos", sin afectar la fecha
  ni el turno seleccionado.
- "Reiniciar consulta": restablece todo — fecha, turno seleccionado, filtros demográficos y
  resultados — al estado inicial de la sección.

#### Scenario: Limpiar filtros conserva el turno

- **WHEN** el usuario presiona "Limpiar filtros" con un turno seleccionado y filtros aplicados
- **THEN** los filtros demográficos vuelven a "Todos" y las gráficas se actualizan con la
  asistencia completa del turno, que sigue siendo el mismo

#### Scenario: Reiniciar consulta limpia todo

- **WHEN** el usuario presiona "Reiniciar consulta"
- **THEN** la fecha vuelve a hoy, el turno seleccionado se limpia, los filtros demográficos vuelven
  a "Todos" y no se muestra ningún resultado hasta seleccionar un turno de nuevo

### Requirement: Gráfica planificados vs servidos


La sección SHALL mostrar una gráfica de barras comparando la cantidad planificada y la cantidad
servida del turno seleccionado, independiente de los filtros demográficos activos (refleja el
turno completo, no el subconjunto filtrado), con una etiqueta que aclare que no está filtrada.

#### Scenario: Gráfica visible con un turno seleccionado

- **WHEN** el usuario selecciona un turno con datos de planificación
- **THEN** se muestra la gráfica de barras planificados-vs-servidos junto a las demás gráficas

#### Scenario: La gráfica no cambia con los filtros demográficos

- **WHEN** el usuario aplica un filtro de tipo de persona sobre el turno seleccionado
- **THEN** la gráfica planificados-vs-servidos sigue mostrando los totales del turno completo, sin
  aplicar ese filtro
