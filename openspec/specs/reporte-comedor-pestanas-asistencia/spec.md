# reporte-comedor-pestanas-asistencia Specification

## Purpose
TBD - created by archiving change move-attendance-dashboard-to-comedor-report. Update Purpose after archive.
## Requirements
### Requirement: Pestañas de asistencia en Reporte al Comedor


La pantalla "Reporte al Comedor" (`/comedor/reporte`) SHALL ofrecer únicamente dos pestañas:
"Asistencia por Período" y "Asistencia por Almuerzo" (las estadísticas de asistencia del comedor
por rango de fechas y por turno de servicio, respectivamente). El reporte de consumo de insumos NO
SHALL vivir en esta pantalla — pertenece exclusivamente a "Reportes de Consumo"
(`/inventario/reportes-consumo`), bajo el menú Inventario. Ninguna de las dos pestañas de
asistencia SHALL duplicarse en ninguna otra pantalla del sistema.

#### Scenario: Cambiar de pestaña conserva cada sección independiente

- **WHEN** el usuario cambia entre las pestañas de Reporte al Comedor
- **THEN** los filtros y resultados de cada pestaña se mantienen independientes entre sí (cambiar
  de pestaña no dispara ni limpia las consultas de las otras)

#### Scenario: El consumo de insumos no aparece en Reporte al Comedor

- **WHEN** el usuario visita "Reporte al Comedor" (`/comedor/reporte`)
- **THEN** solo ve las pestañas de asistencia por período y por almuerzo, sin ningún reporte de
  consumo de insumos

#### Scenario: Las estadísticas de asistencia no aparecen en Reportes de Consumo

- **WHEN** el usuario visita "Reportes de Consumo" (`/inventario/reportes-consumo`)
- **THEN** solo ve el reporte de consumo de insumos, sin pestañas de asistencia por período ni por
  almuerzo

### Requirement: Reutilización de los paneles de asistencia existentes


Las pestañas "Asistencia por Período" y "Asistencia por Almuerzo" SHALL reutilizar sin modificar su
lógica interna los componentes `PeriodAttendancePanel` y `LunchSessionAttendancePanel`
(`src/components/reports/`), incluyendo sus filtros, validaciones, estados de carga/error/sin
resultados, chips de filtros activos, botones de limpiar, y gráficas ya especificados en
`estadisticas-periodo` y `estadisticas-almuerzo`.

#### Scenario: Comportamiento idéntico al ya especificado

- **WHEN** el usuario usa la pestaña "Asistencia por Período" o "Asistencia por Almuerzo" dentro de
  Reporte al Comedor
- **THEN** el comportamiento (filtros, validaciones, mensajes, gráficas) es exactamente el mismo
  que documentan `estadisticas-periodo` y `estadisticas-almuerzo`, sin importar en qué pantalla
  estén montados los paneles
