## ADDED Requirements

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
