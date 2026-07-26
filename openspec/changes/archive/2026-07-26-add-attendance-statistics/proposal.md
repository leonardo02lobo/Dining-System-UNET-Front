## Why

El comedor solo cuenta hoy con reportes agregados de insumos y un endpoint de estadísticas de
usuario (`/consumptions/user-stats`) que agrupa por género/carrera sobre **todo** el rango de
fechas, sin filtrar por tipo de persona, sin permitir aislar un turno de servicio puntual, y sin
incluir a las personas externas/jubiladas (`ExternalPerson`). El personal administrativo necesita
poder analizar la asistencia real del comedor tanto por un período de fechas configurable como por
un turno de servicio específico, segmentando por tipo de persona, género y carrera, y sin perder de
vista a los externos que también consumen. Adicionalmente, "carrera" es hoy texto libre sin
catálogo, lo que impide filtrar de forma confiable y obliga a mantener listas duplicadas
hardcodeadas en el frontend.

## What Changes

- **Integradas dentro de la vista existente "Reporte de Comedor"** (`ReportsPage`, ruta
  `/comedor/reporte`, ya presente en el menú "Comedor") como dos pestañas nuevas junto a la
  pestaña de consumo de insumos que ya existía — **no se crean rutas ni ítems de menú nuevos para
  estas dos capacidades**. (Corrección de alcance: la primera implementación de este change creó
  por error páginas/rutas/ítems de navegación separados; el usuario pidió explícitamente que la
  asistencia del comedor viva dentro de "Reporte Comedor" y no como un apartado nuevo. Ver
  design.md, Decisión 5, para el detalle de la corrección.)
- Pestaña **"Asistencia por Período"**: filtros de fecha inicial/final + tipo de persona + género +
  carrera, tarjetas de resumen y gráficas (barras/circular), respaldada por un endpoint nuevo de
  agregación server-side que combina `beneficiaries` (AccesoDirecto) y `external_people` vía
  UNION, filtrando por rol real de cada uno.
- Pestaña **"Asistencia por Almuerzo"**: selector de fecha → selector de `LunchSession` (turno real
  de servicio, único vínculo existente con `Consumption`), tarjeta de resumen
  (planificados/servidos/restantes, con el nombre del menú mostrado en modo *best-effort* cruzando
  por fecha con `Lunch`, sin bloquear si no hay coincidencia), mismos filtros demográficos y
  gráficas, respaldada por un endpoint nuevo scoped a un `lunch_session_id`.
- **BREAKING (solo para el filtro de carrera)**: el filtro de carrera deja de usar la constante
  `CAREER_SET` hardcodeada en `src/utils/sessionStats.ts` y pasa a consumir un catálogo real desde
  backend.
- Nuevo **catálogo de carreras** (`careers`) administrable: tabla nueva en backend con CRUD
  (crear/editar/eliminar/listar), expuesta en una vista de administración del frontend
  (Administración → Catálogo de Carreras — esta sí es una vista nueva, no forma parte de "Reporte
  Comedor" porque es gestión de catálogo, no un reporte), consumida por los selectores de carrera
  de ambas pestañas de asistencia. Las columnas `career` de texto libre existentes
  (`beneficiaries`, `external_people`, `students`) no se migran ni se restringen por FK en esta
  fase; el filtrado normaliza/empareja contra el catálogo.
- Único ítem de navegación nuevo: "Catálogo de Carreras" bajo "Administración", con su entrada
  correspondiente en `routeAccess.ts` restringida a `SUPER_ADMIN`/`ADMIN`.

## Capabilities

### New Capabilities
- `estadisticas-periodo`: consulta y visualización de estadísticas de asistencia del comedor
  filtradas por rango de fechas, tipo de persona, género y carrera.
- `estadisticas-almuerzo`: consulta y visualización de estadísticas de asistencia de un turno de
  servicio (`LunchSession`) específico, con los mismos filtros demográficos y comparación
  planificado/servido.
- `catalogo-carreras`: gestión administrable (listar/crear/editar/eliminar) del catálogo de
  carreras usado por los filtros de estadísticas.

### Modified Capabilities
- (ninguna — no se identificaron specs existentes cuyo comportamiento cambie; las secciones nuevas
  no alteran el comportamiento de `historial-sesiones-graficas`, `reportes-historial-sesiones` ni
  de los reportes de insumos existentes)

## Impact

**Frontend** (este repo):
- `src/pages/ReportsPage.tsx` (existente, `/comedor/reporte`): reestructurada con pestañas
  (`Consumo de Insumos` | `Asistencia por Período` | `Asistencia por Almuerzo`); las secciones
  antiguas de género/carrera/día/tipo de persona basadas en `consumptionApi.userStats` +
  `reportsApi.consumption` se eliminaron, reemplazadas por la pestaña "Asistencia por Período"
  (estrictamente más capaz: agrega filtros y cubre externos).
- Página nueva: `CareerCatalogPage` bajo Administración (única página nueva de este change).
- Componentes de panel nuevos (no-página, montados como pestañas dentro de `ReportsPage`):
  `src/components/reports/PeriodAttendancePanel.tsx`,
  `src/components/reports/LunchSessionAttendancePanel.tsx`.
- API nuevas: `src/api/statistics.ts`, `src/api/career.ts`.
- Tipos nuevos: `src/types/statistics.ts`, `src/types/career.ts`.
- `src/utils/sessionStats.ts`: `CAREER_SET`/`careerKeyOf` dejan de ser la fuente de verdad para el
  filtro de carrera de las nuevas pestañas (se mantienen intactos para el modal de gráficas de
  Historial de Sesiones, que no forma parte de este cambio).
- `src/components/ui/NavBar.tsx`, `src/config/routeAccess.ts`, `src/App.tsx`: un único ítem/ruta
  nueva (`/admin/carreras`); sin cambios de navegación para las estadísticas de asistencia.

**Backend** (`Dining-System-UNET-Backend`, repo separado — contrato consumido por este frontend):
- Modelo + migración Alembic: tabla `careers` (`id`, `name` único, `created_at`, `updated_at`).
- Endpoints CRUD `/api/v1/careers`.
- Endpoint nuevo `GET /api/v1/statistics/attendance/period` (o similar) con filtros
  `start_date`, `end_date`, `user_type`/`person_type`, `gender`, `career`, agregando sobre UNION de
  `beneficiaries` + `external_people`.
- Endpoint nuevo `GET /api/v1/statistics/attendance/lunch-sessions/{lunch_session_id}` con los
  mismos filtros demográficos, scoped a un turno.
- Nuevo módulo `app/crud/attendance_stats.py` (o extensión de `user_consumption_stats.py`) con las
  queries UNION + agregación.
