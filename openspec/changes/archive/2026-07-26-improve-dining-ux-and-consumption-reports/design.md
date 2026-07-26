## Context

Investigación del código actual (previa a este diseño):

- **`StudentResultCard.tsx`** (`src/components/StudentResultCard.tsx`) es el único componente que
  renderiza los campos base de la persona consultada (Documento, Nombre, **Email** — línea 78-80
  actual) y es compartido literalmente por 4 pantallas: `CheckConsumes.tsx`, el modal de "consumo
  duplicado" dentro de `RegisterDining.tsx` (línea 681), `ManualRegistrationPage.tsx` (línea 360) y
  `SuspendStudent.tsx` (línea 204). No muestra `career` hoy. Tres specs archivadas documentan
  explícitamente "correo" como parte de este contrato: `registro-manual-tarjeta-usuario-compartida`
  (la más general — "identificación, nombre, correo y estado... en todas las pantallas que la
  usan"), y `consumo-duplicado-aviso` (restablece el mismo trío específicamente para el modal de
  duplicado). Un solo fix en `StudentResultCard.tsx` resuelve las 4 pantallas a la vez.
- La ficha *propia* de `RegisterDining.tsx` (fuera del modal, líneas 587-605) ya muestra `career`
  vía su propio `InlineField` interno — **no usa `StudentResultCard`** para la vista principal, solo
  para el modal de duplicado. No requiere cambios ahí.
- **Atajo de `RegisterDining.tsx`** (líneas 401-415): escucha `keydown` en `window` y descarta el
  evento si `document.activeElement` es `SELECT`, `TEXTAREA` **o `INPUT`**. El campo de cédula
  (`id="cedula-register"`, un `<Input>` que renderiza un `<input>` nativo) cae en esa exclusión, y
  es justamente donde el foco permanece tras escanear o consultar — por eso el atajo "no funciona"
  en la práctica. La spec `registro-atajo-arrowdown` documenta esta exclusión de `INPUT` como
  intencional, y además afirma que el listener "SHALL acotarse al contenedor de la ficha del
  estudiante consultado (no a `window`)" — afirmación que **ya no coincide con el código actual**
  (el comentario del propio código dice explícitamente "Escucha en `window`"). Es decir, la
  implementación ya divergió de esa spec en el pasado (probablemente en un rediseño posterior de la
  pantalla) sin que la spec se actualizara.
- **Atajo de `ManualRegistrationPage.tsx`**: existen **dos `useEffect` casi idénticos** (líneas
  82-97 y 223-237) que registran el mismo listener `onArrowDownSave` de forma duplicada — con
  arrays de dependencias ligeramente distintos (`[student, date, saving, editTarget, deleteTarget]`
  vs `[canSave, saving, editTarget, deleteTarget]`). El primero tiene un
  `// eslint-disable-next-line react-hooks/exhaustive-deps` que sugiere que ya se sabía de un
  problema. Registrar el mismo listener dos veces provoca que `handleSave()` se invoque dos veces
  por cada pulsación de `ArrowDown`, con closures potencialmente desincronizados entre sí (uno
  puede referenciar `student`/`canSave` de un render distinto al otro) — esto explica que el atajo
  falle o se comporte de forma inconsistente para el usuario, obligándolo a usar siempre el botón.
  A diferencia de `RegisterDining.tsx`, aquí el guard **no excluye `INPUT`** (solo `SELECT`/
  `TEXTAREA`), así que el problema no es de foco sino puramente la duplicación del listener. La
  spec `registro-manual-vista-unica-atajo` ya documenta el comportamiento correcto (un único
  listener); este cambio es una corrección de bug, no una modificación de esa spec.
- **`ConsumptionReportPage.tsx`** (`/inventario/reportes-consumo`, ítem de nav "Reportes de
  Consumo" bajo "Inventario") hoy tiene: filtros de fecha + categoría, botón "Generar Reporte",
  descarga PDF/CSV, `ConsumptionReportTable` y `ReportChartsPanel` — todo enfocado en consumo de
  insumos. No tiene pestañas.
- **`ReportsPage.tsx`** (`/comedor/reporte`, "Reportes del Comedor") tiene hoy 3 pestañas
  (Consumo de Insumos | Asistencia por Período | Asistencia por Almuerzo) tras el cambio archivado
  `add-attendance-statistics`. Este change las retira, dejando solo el contenido de insumos (que
  es una superficie totalmente distinta a `ConsumptionReportPage.tsx`: `ReportsPage` usa
  `reportsApi.consumptionReports` con exportación PDF simple vía `jsPDF` inline;
  `ConsumptionReportPage` usa la misma API pero con exportación PDF/CSV vía el backend
  (`/consumption-reports/export/*`) y filtro de categoría — son dos vistas de insumos
  parcialmente redundantes entre sí, pero **eso es preexistente y no forma parte del alcance de
  este cambio**).
- `PeriodAttendancePanel.tsx` y `LunchSessionAttendancePanel.tsx` (`src/components/reports/`) ya
  existen, completos y sin dependencia de dónde se monten (no importan nada de `ReportsPage.tsx`).
  Moverlos es solo cuestión de dónde se renderizan.
- La spec `eliminar-suspender-usuario` (de un cambio archivado previo) afirma que la pantalla
  "Suspender Usuario" no debería existir. La ruta `/comedor/suspender`, el ítem de nav "Suspender
  Usuario" y `SuspendStudent.tsx` (290 líneas, plenamente funcional) existen y están en uso hoy —
  la spec quedó obsoleta en algún punto posterior a su archivo, sin que nadie la revirtiera.

## Goals / Non-Goals

**Goals:**
- Un único fix en `StudentResultCard.tsx` (Email → Carrera) que corrija las 4 pantallas a la vez.
- Que el atajo `ArrowDown`/`ArrowUp` de Registro al Comedor funcione con el foco en el campo de
  cédula, sin dejar de respetar `SELECT`/`TEXTAREA`.
- Que el atajo `ArrowDown` de Registro Manual funcione de forma consistente (un solo listener).
- Que el dashboard de asistencia (por período y por almuerzo) viva en Reportes de Consumo
  (`/inventario/reportes-consumo`) y ya no en Reportes del Comedor.
- Dejar las specs de OpenSpec consistentes con el comportamiento real resultante.

**Non-Goals:**
- No se unifican `ReportsPage.tsx` y `ConsumptionReportPage.tsx` (la redundancia parcial entre
  ambas vistas de insumos es preexistente y no se toca en este cambio).
- No se cambian los endpoints backend ni el catálogo de carreras — se reutilizan tal cual del
  cambio archivado `add-attendance-statistics`.
- No se agrega el campo `email` a ningún formulario nuevo ni se toca `ExternalPeoplePage.tsx` (su
  campo de correo es de una entidad distinta — persona externa — y no fue mencionado).
  No se cambia el tipo `Student` (`email` puede seguir existiendo en el tipo/API aunque ya no se
  muestre en la ficha).
- No se re-scopea el listener de `RegisterDining.tsx` de `window` a un contenedor acotado — se
  corrige únicamente la exclusión de `INPUT`; la corrección de la descripción del scoping en la
  spec es solo textual (documentar la realidad), no un cambio de comportamiento adicional.

## Decisions

### 1. `StudentResultCard.tsx`: Email → Carrera, sin tocar el resto del layout

Se reemplaza el bloque `ReadOnlyField label="Email" value={student.email ?? '—'}` por
`ReadOnlyField label="Carrera" value={student.career || '—'}`, manteniendo la misma posición
(`sm:col-span-2`) y el mismo patrón de fallback que ya usa `RegisterDining.tsx` para `career`
(`student?.career || '—'`, no `??`, porque `career` puede llegar como string vacío). No se toca
`Avatar`, badges de estado/suspensión, ni los slots `notice`/`actions` — el pedido del usuario
("solo nombre, cédula y carrera") se interpreta como "el trío de datos base", no como remover los
indicadores visuales de estado que cada pantalla ya usa con propósito distinto (suspensión,
sanciones).

**Alternativa descartada**: agregar `career` como un campo nuevo *además* de `email` (dejando 4
campos). Se descarta porque el usuario pidió explícitamente eliminar el email, y porque las 3 specs
afectadas ya fijan el trío como "identificación, nombre, correo/carrera y estado" (3-4 campos, no
5).

### 2. `RegisterDining.tsx`: excluir el atajo solo en `SELECT`/`TEXTAREA`, no en `INPUT`

Se cambia la condición de la línea 415 de:
```js
if (active?.tagName === 'SELECT' || active?.tagName === 'TEXTAREA' || active?.tagName === 'INPUT') return
```
a:
```js
if (active?.tagName === 'SELECT' || active?.tagName === 'TEXTAREA') return
```
Esto alinea el comportamiento con el que ya tiene `ManualRegistrationPage.tsx` (que nunca excluyó
`INPUT`) y con lo que pidió el usuario. El único `<input>` de texto libre visible en el flujo
principal de esta pantalla es el de cédula — no tiene semántica propia para `ArrowUp`/`ArrowDown`
(no es un `<input type="number">` ni tiene autocompletado con lista), así que no hay pérdida de
navegación nativa al dejar de excluirlo. Los `SELECT` (selector de sede) y el `TEXTAREA` (motivo de
suspensión, dentro de un modal ya cubierto aparte por `suspendOpen`) se siguen respetando.

**Alternativa descartada**: excluir `INPUT` solo si su `id` es distinto de `cedula-register` (lista
blanca por id en vez de lista negra por tag). Se descarta por ser más frágil (depende de que el id
no cambie) y porque no hay ningún otro `<input>` de texto libre visible en esta pantalla fuera de
modales ya cubiertos por sus propios guards (`suspendOpen`/`duplicateOpen`/`recentOpen`).

### 3. `ManualRegistrationPage.tsx`: eliminar el `useEffect` duplicado, no fusionar ambos

Se elimina el primer bloque (líneas 82-97, el que tiene el `eslint-disable` y depende de
`[student, date, saving, editTarget, deleteTarget]`), dejando únicamente el segundo (líneas
223-237, que depende de `canSave` ya derivado y verifica `modalOpen` de forma más directa). Se
elige conservar el segundo porque su condición de guarda es más simple y no requiere el
`eslint-disable`, señal de que es la versión "final" tras el refactor que introdujo la duplicación
por error.

**Alternativa descartada**: fusionar la lógica de ambos en un solo efecto nuevo. Se descarta porque
el segundo bloque ya es funcionalmente equivalente (mismo evento, misma tecla, mismo resultado) y
no aporta nada fusionar — eliminar el duplicado es el cambio mínimo correcto.

### 4. Mover los paneles de asistencia de `ReportsPage.tsx` a `ConsumptionReportPage.tsx`

`PeriodAttendancePanel`/`LunchSessionAttendancePanel` se importan sin cambios en
`ConsumptionReportPage.tsx`, agregando la misma barra de pestañas (`insumos` | `periodo` |
`almuerzo`) que hoy tiene `ReportsPage.tsx` — mismo patrón de `useState<Tab>` + botones con
`border-b-2`, sin librería de tabs. La pestaña `insumos` pasa a envolver el contenido *actual* de
`ConsumptionReportPage` (filtros de fecha/categoría, tabla, gráficas, exportación PDF/CSV) tal cual
está, sin modificarlo. `ReportsPage.tsx` revierte a su forma previa a `add-attendance-statistics`
(sin pestañas, sin `PeriodAttendancePanel`/`LunchSessionAttendancePanel`, solo el reporte de
insumos que ya tenía).

**Alternativa descartada**: dejar los paneles montados en ambas páginas (Comedor y Consumo). Se
descarta porque duplicaría la misma funcionalidad en dos lugares del menú, exactamente el tipo de
dispersión que el usuario ya pidió evitar en el cambio anterior.

### 5. Reconciliación de specs afectadas

- `registro-manual-tarjeta-usuario-compartida` → **MODIFIED**: "correo" pasa a "carrera" en el
  requirement y en el scenario "Consistencia de datos mostrados".
- `consumo-duplicado-aviso` → **MODIFIED**: mismo cambio textual, acotado al requirement del aviso
  de duplicado.
- `registro-atajo-arrowdown` → **MODIFIED**: se retira la cláusula "SHALL respetar también el foco
  en un INPUT" (ahora solo `SELECT`/`TEXTAREA`), y se corrige la descripción del alcance del
  listener de "acotado al contenedor de la ficha" a "en `window`", para que la spec documente la
  implementación real verificada en el código, no una versión más antigua.
- `eliminar-suspender-usuario` → **MODIFIED**: se reescribe para reflejar que la pantalla fue
  reintroducida y sigue vigente, marcando la spec anterior como superada (no se elimina el archivo
  para conservar el historial, pero su contenido deja de afirmar que la pantalla no existe).

## Risks / Trade-offs

- **[Riesgo] Quitar la exclusión de `INPUT` en `RegisterDining.tsx` podría, en teoría, interferir
  con algún otro `<input>` de texto libre que se agregue más adelante en esa pantalla** →
  Mitigación: hoy solo existe el campo de cédula fuera de modales (ya cubiertos por sus propios
  guards); si se agrega otro input de texto libre en el futuro con semántica propia de flechas
  (poco probable en este formulario), habrá que revisitar esta condición explícitamente.
- **[Riesgo] Eliminar uno de los dos `useEffect` duplicados en `ManualRegistrationPage.tsx` sin
  pruebas automatizadas previas** → Mitigación: ambos bloques son funcionalmente redundantes (mismo
  evento/tecla/acción), por lo que eliminar uno no cambia el comportamiento esperado, solo elimina
  el doble disparo; se verificará manualmente que `ArrowDown` guarda una sola vez.
- **[Riesgo] `ReportsPage.tsx` y `ConsumptionReportPage.tsx` seguirán siendo dos vistas de insumos
  parcialmente redundantes** → Fuera de alcance (Non-Goal); se deja documentado para una futura
  consolidación si el usuario la pide.
- **[Trade-off] Se reescribe `eliminar-suspender-usuario` en vez de archivarla como obsoleta sin
  contenido** → Se prefiere mantener el archivo con contenido actualizado (en vez de vaciarlo o
  dejarlo contradictorio) para que quien lo lea después entienda que fue reintroducida y por qué.

## Migration Plan

1. `StudentResultCard.tsx`: Email → Carrera (desbloquea la corrección de las 4 pantallas a la vez).
2. `RegisterDining.tsx`: ajustar condición del atajo de teclado.
3. `ManualRegistrationPage.tsx`: eliminar el `useEffect` duplicado.
4. `ConsumptionReportPage.tsx`: agregar pestañas y montar los paneles de asistencia.
5. `ReportsPage.tsx`: revertir a su forma sin pestañas.
6. Verificación manual de los 4 flujos (según limitaciones de entorno ya conocidas: sin Postgres ni
   Tauri disponibles en este sandbox — ver notas del cambio archivado anterior).

Todo es aditivo o reversible por `git`; no hay migraciones de base de datos ni cambios de contrato
de API en este change.

## Open Questions

- Ninguna bloqueante. La única decisión de alcance genuinamente ambigua (dónde vive el dashboard de
  asistencia) ya fue confirmada explícitamente por el usuario antes de escribir este documento.
