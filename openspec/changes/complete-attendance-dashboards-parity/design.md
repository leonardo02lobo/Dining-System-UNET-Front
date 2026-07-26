## Context

Este change cierra la brecha detectada al auditar `PeriodAttendancePanel.tsx` y
`LunchSessionAttendancePanel.tsx` contra los documentos originales (ver `proposal.md`). Todos los
datos necesarios ya están disponibles en las respuestas actuales de los endpoints backend
(`byDate`, `plannedCount`, `servedCount`) — este change es **puramente frontend**.

## Goals / Non-Goals

**Goals:**
- Chips de filtros activos removibles individualmente (Período y Almuerzo).
- Botón de limpiar en Período; las dos acciones de limpieza (parcial/completa) en Almuerzo.
- Gráfica de asistencia diaria en Período, con la lógica condicional exacta de la sección 10 del
  documento.
- Gráfica planificados-vs-servidos en Almuerzo.
- Filtros de Período reflejados en la URL (compartibles).

**Non-Goals:**
- No se toca el backend — toda la data ya existe en las respuestas actuales.
- No se agrega selección múltiple de carreras (decisión ya tomada en el change anterior).
- No se agrega exportar/imprimir (ambos documentos lo marcan como "fase posterior").
- No se agrega persistencia de filtros en la URL para Almuerzo (el documento de período lo pide
  explícitamente en su sección de optimización; el de almuerzo no lo menciona).
- No se tocan los estados `DRAFT/SCHEDULED/IN_PROGRESS/CANCELLED` de `LunchStatus` — decisión ya
  tomada: `LunchSession` real solo tiene `OPEN/CLOSED`.

## Decisions

### 1. Chips de filtros activos: componente compartido, sin quitar los `Select` existentes

Se agrega un componente pequeño `ActiveFilterChips` (`src/components/statistics/`) que recibe una
lista de `{ label: string; onRemove?: () => void }` y renderiza chips con `×` solo cuando
`onRemove` está presente (el chip de rango de fechas no lo tiene, porque las fechas son
obligatorias y no tiene sentido "quitarlas" sin dejar el formulario en un estado inválido). Los
`Select` de tipo/género/carrera se mantienen tal cual — los chips son un atajo visual adicional,
no reemplazan los controles.

**Alternativa descartada**: permitir quitar el chip de fechas restaurando los valores por defecto.
Se descarta porque el documento las trata igual que un chip removible, pero funcionalmente las
fechas son obligatorias en este formulario (a diferencia de los filtros demográficos, que son
opcionales) — quitar solo una fecha dejaría un estado que la propia validación ya rechaza.

### 2. Botones de limpiar

- **Período**: un único botón "Limpiar" junto a "Consultar" (igual que el wireframe de la sección
  3 del documento), que resetea `dateFrom`/`dateTo` a los valores iniciales (últimos 30 días),
  `personType`/`gender`/`career` a vacío, y limpia `result`/`hasQueried`.
- **Almuerzo**: dos botones, siguiendo literalmente la sección 16 del documento:
  - "Limpiar filtros" → resetea `personType`/`gender`/`career` a vacío, sin tocar `lunchDate` ni
    `selectedSessionId` (el `useEffect` existente ya re-consulta automáticamente al cambiar estos
    valores, así que no hace falta lógica adicional).
  - "Reiniciar consulta" → resetea todo: `lunchDate` a hoy, `selectedSessionId` a `null`,
    `sessions` a `[]`, filtros demográficos a vacío, `result` a `null`.

### 3. Gráfica de asistencia diaria: lógica condicional fiel a la sección 10 del documento

Se agrega `AttendanceByDateChart` (barras, eje X = fecha, eje Y = cantidad), construido igual que
los demás componentes de `src/components/statistics/` (mismo patrón `Card` + `BarChart`). La
lógica de qué gráficas mostrar en `PeriodAttendancePanel` se reescribe así:

```
personType === '' (Todos)         → AttendanceByPersonTypeChart + AttendanceByGenderChart
personType === 'STUDENT' && !career → AttendanceByCareerChart + AttendanceByDateChart + AttendanceByGenderChart
personType === 'STUDENT' && career  → AttendanceByDateChart + AttendanceByGenderChart
otro personType (TEACHER/...)      → AttendanceByDateChart + AttendanceByGenderChart
```

Esto reemplaza el `personType === 'STUDENT' ? <Career> : <PersonType>` binario actual por una
función `pickPrimaryCharts(personType, career)` que decide el set de gráficas a mostrar, testeable
de forma aislada.

**Alternativa descartada**: mostrar siempre las 3 gráficas (tipo, carrera, día) a la vez. Se
descarta porque el documento es explícito en qué combinación corresponde a cada filtro (sección
10), y mostrar gráficas vacías o sin sentido (p. ej. "por carrera" cuando el tipo es `TEACHER`)
viola la regla 6.6 del propio documento ("Las gráficas no deben mostrar valores inventados ni
categorías con datos falsos").

### 4. Gráfica planificados-vs-servidos: siempre visible, independiente de filtros demográficos

`AttendanceServedVsPlannedChart` (barras: "Planificados" vs "Servidos", usando
`summary.plannedCount`/`summary.servedCount` de `result.lunchSession`) se muestra siempre que hay
un turno seleccionado, sin importar el filtro demográfico activo — porque planificado/servido es
una propiedad del turno completo, no del subconjunto filtrado (coherente con la sección 13.1 del
documento, que la ubica junto al resumen general "sin filtros demográficos").

### 5. Filtros de Período en la URL: `useSearchParams`, sincronización en cada cambio de filtro

`PeriodAttendancePanel` usa `useSearchParams` de `react-router-dom` (ya es dependencia del
proyecto). Al montar, si hay parámetros en la URL (`from`, `to`, `personType`, `gender`, `career`),
inicializan el estado; en cada cambio de filtro, se actualizan los parámetros de la URL con
`setSearchParams` (sin recargar ni disparar la consulta — la consulta sigue disparándose solo con
"Consultar", igual que hoy). Esto mantiene "no consultar automáticamente por cada cambio de fecha"
(ya cumplido) y agrega "mantener los filtros en la URL" sin contradecirlo.

**Alternativa descartada**: disparar la consulta automáticamente si la URL ya trae parámetros al
cargar. Se descarta porque el documento no lo pide (solo pide que la URL refleje los filtros para
compartir la vista, no que la carga inicial dispare la consulta) y sería inconsistente con la regla
de "no auto-consultar".

## Risks / Trade-offs

- **[Riesgo] `useSearchParams` dentro de un componente que no es un elemento de ruta (está montado
  como pestaña dentro de `ConsumptionReportPage`)** → Mitigación: `useSearchParams` funciona en
  cualquier componente dentro del árbol de `BrowserRouter` (no requiere ser un elemento de
  `<Route>`), y la app ya envuelve todo en `BrowserRouter` en `App.tsx`.
- **[Riesgo] Cambiar los parámetros de la URL en cada cambio de filtro podría generar entradas
  excesivas en el historial del navegador** → Mitigación: usar `setSearchParams(params, {replace:
  true})` para no apilar entradas de historial por cada cambio de filtro.
- **[Trade-off] La gráfica planificados-vs-servidos no respeta el filtro demográfico activo** →
  Es intencional (Decisión 4); se documenta con un subtítulo claro ("Total del turno, sin filtros")
  para que no se confunda con las demás gráficas, que sí están filtradas.

## Migration Plan

1. `AttendanceByDateChart` y `AttendanceServedVsPlannedChart` (componentes nuevos, sin dependencias
   de los paneles).
2. `ActiveFilterChips` (componente nuevo, genérico).
3. `PeriodAttendancePanel.tsx`: botón limpiar, chips, lógica condicional de gráficas,
   `useSearchParams`.
4. `LunchSessionAttendancePanel.tsx`: chips, dos acciones de limpieza, gráfica
   planificados-vs-servidos.
5. Verificación: `tsc --noEmit`, `vitest run`, revisión manual de los 5 puntos contra los
   documentos originales.

Todo es aditivo dentro de dos componentes ya existentes; no hay cambios de contrato con el backend
ni de rutas/navegación.
