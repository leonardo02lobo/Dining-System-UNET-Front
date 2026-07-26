## ADDED Requirements

### Requirement: Pestañas de asistencia en Reportes de Consumo

La pantalla "Reportes de Consumo" (`/inventario/reportes-consumo`) SHALL ofrecer tres pestañas:
"Consumo de Insumos" (el reporte de insumos que ya existía, sin cambios de comportamiento),
"Asistencia por Período" y "Asistencia por Almuerzo" (las estadísticas de asistencia del comedor
por rango de fechas y por turno de servicio, respectivamente). Estas dos últimas pestañas NO SHALL
duplicarse en ninguna otra pantalla del sistema.

#### Scenario: Cambiar de pestaña conserva cada sección independiente

- **WHEN** el usuario cambia entre las pestañas de Reportes de Consumo
- **THEN** los filtros y resultados de cada pestaña se mantienen independientes entre sí (cambiar
  de pestaña no dispara ni limpia las consultas de las otras)

#### Scenario: Las estadísticas de asistencia no aparecen en Reportes del Comedor

- **WHEN** el usuario visita "Reportes del Comedor" (`/comedor/reporte`)
- **THEN** solo ve el reporte de consumo de insumos, sin pestañas de asistencia por período ni por
  almuerzo

### Requirement: Reutilización de los paneles de asistencia existentes

Las pestañas "Asistencia por Período" y "Asistencia por Almuerzo" SHALL reutilizar sin modificar su
lógica interna los componentes `PeriodAttendancePanel` y `LunchSessionAttendancePanel`
(`src/components/reports/`), incluyendo sus filtros, validaciones, estados de carga/error/sin
resultados y gráficas ya especificados en `estadisticas-periodo` y `estadisticas-almuerzo`.

#### Scenario: Comportamiento idéntico al ya especificado

- **WHEN** el usuario usa la pestaña "Asistencia por Período" o "Asistencia por Almuerzo" dentro de
  Reportes de Consumo
- **THEN** el comportamiento (filtros, validaciones, mensajes, gráficas) es exactamente el mismo
  que documentan `estadisticas-periodo` y `estadisticas-almuerzo`, sin importar en qué pantalla
  estén montados los paneles
