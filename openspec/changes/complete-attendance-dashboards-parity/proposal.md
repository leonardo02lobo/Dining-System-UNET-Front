## Why

Al comparar la implementación actual de "Asistencia por Período" y "Asistencia por Almuerzo"
(dentro de Reportes de Consumo) contra los dos documentos de planificación originales
(`PLANIFICACION_GRAFICAS_POR_PERIODO.md`, `PLANIFICACION_GRAFICAS_POR_ALMUERZO.md`), el núcleo
funcional (filtros, validaciones de fecha, carrera condicional, resumen planificado/servido,
mensajes de estado) sigue los documentos fielmente, pero faltan 5 elementos que ambos documentos
pedían explícitamente y que no se implementaron en los cambios anteriores: chips de filtros
activos, botones de limpiar filtros, la gráfica de asistencia diaria (el backend ya devuelve el
dato `byDate`, solo falta graficarlo), la gráfica comparativa planificados-vs-servidos, y la
persistencia de filtros en la URL para compartir la vista.

## What Changes

- **Chips de filtros activos** en ambos paneles (`PeriodAttendancePanel`,
  `LunchSessionAttendancePanel`): muestran los filtros demográficos activos (tipo de persona,
  género, carrera) como chips removibles individualmente; el rango de fechas se muestra como chip
  informativo (sin ×, porque es obligatorio).
- **Botones de limpiar filtros**:
  - Período: un botón "Limpiar" que resetea fechas, tipo de persona, género y carrera a sus
    valores iniciales y limpia el resultado mostrado.
  - Almuerzo: dos acciones distintas, tal como pide el documento — "Limpiar filtros" (mantiene
    fecha y almuerzo seleccionados, limpia solo tipo/género/carrera) y "Reiniciar consulta" (limpia
    todo, incluida la fecha y el almuerzo seleccionado).
- **Gráfica de asistencia diaria** (Período), usando el campo `byDate` que el backend ya devuelve
  y que hoy no se grafica. Se agrega lógica condicional fiel a la sección 10 del documento:
  - Tipo de persona "Todos": barras por tipo de persona + circular por género (sin cambios).
  - `STUDENT` sin carrera seleccionada: barras por carrera + circular por género + barras
    secundarias de asistencia diaria.
  - `STUDENT` con una carrera específica seleccionada: barras de asistencia diaria de esa carrera
    (reemplaza el gráfico de carrera, que ya no aporta información con una sola carrera) + circular
    por género.
  - Otros tipos de persona (`TEACHER`, `ADMINISTRATIVE`, `WORKER`, `JUBILADO`, `EXTERNO`): barras
    de asistencia diaria + circular por género.
- **Gráfica planificados-vs-servidos** (Almuerzo): gráfico de barras comparativo (2 barras:
  Planificados, Servidos) del turno seleccionado, complementando (no reemplazando) las tarjetas de
  texto ya existentes.
- **Filtros en la URL** (Período): el rango de fechas y los filtros demográficos se reflejan en los
  parámetros de consulta de la URL, para poder compartir un enlace con la vista ya filtrada; al
  cargar la página con parámetros en la URL, los filtros se inicializan desde ahí.

## Capabilities

### Modified Capabilities
- `estadisticas-periodo`: agrega chips de filtros activos, botón de limpiar, gráfica de asistencia
  diaria con lógica condicional por tipo de persona/carrera, y persistencia de filtros en la URL.
- `estadisticas-almuerzo`: agrega chips de filtros activos, las dos acciones de limpieza
  (parcial y reinicio completo), y la gráfica planificados-vs-servidos.

## Impact

**Frontend** (este repo), sin cambios de backend (toda la data ya existe en las respuestas actuales
de `/statistics/attendance/by-period` y `/statistics/attendance/by-lunch-session/{id}`):
- `src/components/reports/PeriodAttendancePanel.tsx`: chips, botón limpiar, lógica de gráficas
  condicional, sincronización con `useSearchParams`.
- `src/components/reports/LunchSessionAttendancePanel.tsx`: chips, dos acciones de limpieza.
- `src/components/statistics/`: nuevo componente `AttendanceByDateChart` (barras por fecha) y
  `AttendanceServedVsPlannedChart` (barras comparativas planificado/servido).
- `src/types/statistics.ts`: sin cambios de forma (ya expone `byDate`, `plannedCount`,
  `servedCount`).
