## Why

Varias pantallas del flujo de comedor (Consultar Consumo, Registro al Comedor, Registro Manual,
Suspender Usuario) muestran el correo electrónico de la persona consultada — un dato que el
personal del comedor no usa — en vez de su carrera, que sí es relevante para identificarla y para
las estadísticas. Además, dos atajos de teclado pensados para agilizar el registro sin ratón están
rotos en la práctica: en Registro al Comedor el atajo de flecha se bloquea justo cuando el foco
está donde normalmente queda tras escanear (el campo de cédula), y en Registro Manual dos
`useEffect` casi idénticos registran el mismo listener duplicado, lo que hace que el atajo falle o
se comporte de forma inconsistente y obligue a usar siempre el botón. Por último, el dashboard de
estadísticas de asistencia (por período y por almuerzo) construido en el cambio anterior
(`add-attendance-statistics`, archivado) quedó integrado en "Reportes del Comedor"; tras revisar de
nuevo los documentos de planificación originales, el usuario pidió que viva en "Reportes de
Consumo" (`/inventario/reportes-consumo`) en su lugar.

## What Changes

- **Ficha de persona compartida (`StudentResultCard`)**: reemplaza el campo "Email" por "Carrera"
  en el bloque de datos base (Documento/Nombre/Email → Documento/Nombre/Carrera). Como este
  componente es compartido, el cambio aplica automáticamente a las 4 pantallas que lo usan:
  Consultar Consumo, el modal de "consumo duplicado" de Registro al Comedor, Registro Manual y
  Suspender Usuario. Esto **corrige tres specs existentes** que documentaban explícitamente
  "correo" como parte del contrato de estas pantallas (ver Capabilities).
- **Registro al Comedor — atajo de teclado**: el atajo `ArrowDown`/`ArrowUp` que dispara "Registrar
  consumo" deja de bloquearse cuando el foco está en el campo de cédula (donde normalmente queda
  tras un escaneo o una consulta manual); sigue respetando el foco en `SELECT`/`TEXTAREA` para no
  interferir con su navegación propia por flechas.
- **Registro Manual — atajo de teclado**: se elimina la duplicación de `useEffect` que registra dos
  veces el mismo listener de `ArrowDown` (bug de refactor, no un cambio de comportamiento
  documentado), dejando un único listener correcto — restaura el comportamiento que la spec
  `registro-manual-vista-unica-atajo` ya exige mas hoy no cumple de forma confiable.
- **Reportes de Consumo (`/inventario/reportes-consumo`)**: gana dos pestañas nuevas —
  "Asistencia por Período" y "Asistencia por Almuerzo" — junto a la pestaña existente de consumo de
  insumos, reutilizando sin cambios los paneles ya construidos
  (`PeriodAttendancePanel`/`LunchSessionAttendancePanel`) y sus endpoints backend
  (`/statistics/attendance/*`, catálogo `/careers`) del cambio archivado
  `add-attendance-statistics`.
- **Reportes del Comedor (`/comedor/reporte`)**: pierde las pestañas de asistencia agregadas en el
  cambio anterior — vuelve a mostrar únicamente el reporte de consumo de insumos, sin pestañas.
- **Reconciliación de spec obsoleta**: la spec `eliminar-suspender-usuario` (de un cambio archivado
  anterior) afirma que la pantalla "Suspender Usuario" no debería existir en el frontend, pero la
  pantalla sigue activa en el código (ruta `/comedor/suspender`, ítem de navegación, uso normal por
  el usuario) y es una de las pantallas que este cambio modifica. Se marca esa spec como superada.

## Capabilities

### New Capabilities
- `reportes-consumo-pestanas-asistencia`: Reportes de Consumo (`/inventario/reportes-consumo`)
  ofrece pestañas de asistencia por período y por almuerzo, además de la de insumos.

### Modified Capabilities
- `registro-manual-tarjeta-usuario-compartida`: la ficha compartida del estudiante muestra
  identificación, nombre y **carrera** (no correo) de forma consistente en todas las pantallas que
  la usan.
- `consumo-duplicado-aviso`: el aviso modal de consumo duplicado muestra identificación, nombre,
  **carrera** y estado (no correo).
- `registro-atajo-arrowdown`: el atajo ya no se bloquea por el foco en el campo de cédula; se
  corrige además la descripción del alcance del listener para reflejar la implementación real
  (`window`, no un contenedor acotado a la ficha — drift detectado entre la spec y el código
  vigente).
- `eliminar-suspender-usuario`: superada — la pantalla "Suspender Usuario" sigue existiendo y en
  uso; esta spec ya no aplica.

## Impact

**Frontend** (este repo):
- `src/components/StudentResultCard.tsx`: campo Email → Carrera.
- `src/pages/RegisterDining.tsx`: condición del atajo de teclado (ya no excluye `INPUT`
  genéricamente; exime específicamente el campo de cédula).
- `src/pages/ManualRegistrationPage.tsx`: elimina el `useEffect` de atajo duplicado.
- `src/pages/ConsumptionReportPage.tsx`: gana pestañas (Insumos | Asistencia por Período |
  Asistencia por Almuerzo), reutilizando `PeriodAttendancePanel`/`LunchSessionAttendancePanel` de
  `src/components/reports/` (sin cambios en esos dos componentes).
- `src/pages/ReportsPage.tsx`: revierte a su forma sin pestañas (solo consumo de insumos).
- Sin cambios de rutas/nav: `/inventario/reportes-consumo` y `/comedor/reporte` ya existen y están
  en el menú; no se agrega ni quita ningún ítem de navegación.

**Backend**: sin cambios — reutiliza íntegramente los endpoints y el catálogo de carreras ya
implementados en `add-attendance-statistics` (`/statistics/attendance/by-period`,
`/statistics/attendance/by-lunch-session/{id}`, `/careers`).
