## Why

Se da de alta a una persona externa, se la consulta en «Registro Manual», su ficha aparece con su
etiqueta… y al pulsar Guardar la pantalla contesta que **el registro manual todavía no admite
personas externas**. Ese corte lo puso `fe-gente-externa-en-comedor` a propósito, porque enviar el
alta al vuelo (`person`) habría duplicado a esa persona como acceso directo. Era el mal menor, y
dejó el caso sin resolver: al invitado de una jornada al que se le sirvió el plato el martes y se
apuntó en papel no hay forma de registrarlo, porque el registro manual es precisamente la pantalla
de los días pasados y es la que lo rechaza.

Y donde sí aparece, aparece sin clasificar. La gente externa ya se cuenta en tres listados y en
ninguno se sabe de dónde salió:

- **«Ingresos del día»** muestra la columna *Tipo* con un guion para todo externo: la pantalla que
  existe para no registrar dos veces a la misma persona no puede decir quién es la mitad de la gente
  que enseña.
- **Los entrantes de una sesión** filtran por rol sobre `user_type`, que en un externo viene nulo:
  elegir cualquier rol lo **hace desaparecer de la tabla**, y la gráfica «Por rol» amontona a todos
  los externos —los de un congreso, los jubilados, una comisión de visita— en un único sector
  llamado «Externo».
- **El filtro *Tipo de persona* de «Reporte al Comedor»** sigue siendo una lista fija de seis valores
  con `JUBILADO` y `EXTERNO` escritos en el cliente. Desde `fe-etiquetas-gente-externa` las etiquetas
  las inventa quien administra: la etiqueta de la jornada deportiva que se creó ayer **no se puede
  elegir**, y el propio cambio que introdujo las etiquetas dejó dicho que el cliente no debe mantener
  ningún mapa de etiquetas.

Los tres son el mismo error de fondo: el cliente clasifica a una persona por `user_type` y la gente
externa no lo tiene. Su clasificación viaja en `person_type` y nadie la lee.

## What Changes

- **«Registro Manual» guarda a una persona externa.** Desaparece el corte: cuando
  `person_kind === 'external'`, el guardado envía `external_person_id` y **no** envía `person`,
  apoyándose en el `POST /consumptions/manual` que añade `be-gente-externa-registro-manual`.
- **La clasificación se lee de un sitio único.** Un helper `personTypeLabel(row)` resuelve
  `user_type ?? person_type`: el tipo del padrón traducido para un acceso directo y el nombre de la
  etiqueta tal cual para un externo. Se usa en la tabla de las dos pestañas y en el PDF del listado,
  con un distintivo visible para la fila de gente externa.
- **El filtro por rol de los entrantes deja de esconder a la gente externa.** Sus opciones se
  componen de los cuatro roles del padrón más **las etiquetas presentes en los entrantes cargados**,
  y el filtrado compara contra la clasificación efectiva de la fila, no contra `user_type`.
- **La gráfica «Por rol» agrupa por etiqueta.** `roleStats` deja de volcar a todo el que no es del
  padrón en un sector «Externo» y crea un sector por etiqueta.
- **El filtro *Tipo de persona* de las estadísticas se alimenta del catálogo.** Los cuatro tipos del
  padrón se conservan escritos en el cliente —son un enumerado del servidor— y las etiquetas se piden
  a `GET /external-people/labels`. `PersonType` deja de ser una unión cerrada de seis literales.
- **Editar una fila manual de gente externa funciona**: la cédula nueva se resuelve con la misma
  búsqueda de tres orígenes y se envía el identificador que corresponda.

## Capabilities

### New Capabilities
- `gente-externa-registro-manual-front`: «Registro Manual» registra el consumo de una persona externa
  en una fecha, la lista con el resto y la clasifica por su etiqueta en la tabla y en el PDF.

### Modified Capabilities
- `historial-sesiones-filtro-rol`: el filtro por rol de los entrantes y la gráfica que lo acompaña
  clasifican también a la gente externa, por su etiqueta.
- `estadisticas-periodo`: el filtro de tipo de persona deja de ser una lista fija.

## Impact

- **Archivos modificados:** `src/pages/ManualRegistrationPage.tsx`, `src/types/consumption.ts`
  (`ManualConsumption`, `ManualConsumptionCreate`, `ManualConsumptionUpdate`, `Consumption`),
  `src/utils/printManual.ts`, `src/utils/labels.ts` (helper de clasificación),
  `src/utils/sessionStats.ts` (`roleStats`), `src/pages/SessionHistoryPage.tsx`,
  `src/types/statistics.ts` (`PersonType`, `PERSON_TYPE_OPTIONS`),
  `src/components/reports/PeriodAttendancePanel.tsx`,
  `src/components/reports/LunchSessionAttendancePanel.tsx`.
- **Dependencia dura del backend:** consume `be-gente-externa-registro-manual`. Cliente y servidor
  SHALL desplegarse juntos: contra un servidor anterior, el guardado de una persona externa responde
  404 o 422.
- **Degradación:** las filas sin `person_type` (servidor anterior) SHALL mostrarse como hasta ahora,
  con el guion. La clasificación se pierde; la pantalla no.
- **Sin cambios de permisos.** `GET /external-people/labels` ya admite las pantallas de comedor.

## Non-goals

- Dar de alta personas externas desde el registro manual. Se dan de alta en su pantalla, que es donde
  se les asigna la etiqueta.
- Sancionar gente externa: la ficha sigue sin contador de suspensiones ni botón de suspender.
- Un selector de carrera para la gente externa. Un externo puede traer `career`, pero el filtro de
  carrera es de estudiantes por especificación y no lo pide nadie.
- Rehacer las gráficas de género ni las tarjetas de resumen del reporte.
