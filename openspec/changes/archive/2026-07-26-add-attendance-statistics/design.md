## Context

Dos documentos de planificación (`PLANIFICACION_GRAFICAS_POR_PERIODO.md` y
`PLANIFICACION_GRAFICAS_POR_ALMUERZO.md`) proponían un modelo de datos (`access_records`,
`beneficiaries.user_type/gender/career`, `lunches` con `lunch_id` referenciado desde asistencia,
`LunchStatus` con `DRAFT/SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED`) que **no coincide** con el
esquema real del backend (`Dining-System-UNET-Backend`):

- `Consumption` (tabla `consumptions`) es el único registro real de asistencia. Se relaciona con
  `lunch_session_id → LunchSession` (turno de servicio abierto/cerrado por sede), **no** con
  `Lunch` (el menú planificado con receta/ingredientes). `Lunch` y `LunchSession` son entidades
  independientes que solo pueden cruzarse por fecha, sin garantía 1:1.
- `Consumption` referencia exactamente una de dos tablas de persona vía constraint XOR:
  `beneficiary_id → beneficiaries` (alias de `AccesoDirecto`, con `user_type` ∈
  `STUDENT/TEACHER/ADMINISTRATIVE/WORKER`) o `external_person_id → external_people` (con
  `person_type` ∈ `JUBILADO/EXTERNO`). No existe un valor `EXTERNAL` dentro de `UserType`.
- `gender` es `String(10)` libre en ambas tablas de persona (valores reales: `"M"`/`"F"`, a veces
  variantes de texto), no un enum.
- `career` es `String(100)` libre en `beneficiaries`, `external_people` y `students`; no hay tabla
  catálogo hoy. El frontend ya mitiga esto para el modal de gráficas de Historial de Sesiones con
  una constante fija de 8 carreras (`CAREER_SET` en `src/utils/sessionStats.ts`) y una función de
  normalización (`careerKeyOf`).
- Ningún endpoint existente agrega asistencia combinando `beneficiaries` + `external_people`, ni
  filtra (solo agrupa) por género/carrera, ni acepta `lunch_session_id`/`user_type` como filtro.

El usuario confirmó explícitamente, ante estas divergencias:
1. "Almuerzo" = `LunchSession` (única entidad enlazada realmente a `Consumption`).
2. Las estadísticas deben incluir **todos** los accesos que pueden usar el comedor según su rol:
   `beneficiaries` (AccesoDirecto) **y** `external_people` (ExternalPerson).
3. Los filtros combinados (fecha/sesión + tipo de persona + género + carrera) se resuelven con
   **endpoints nuevos server-side** (agregación en backend, no client-side).
4. El catálogo de carreras pasa a ser una **tabla en base de datos**, administrable por CRUD, en
   vez de una constante en código o texto libre sin control.

Este documento define cómo implementar esas cuatro decisiones sobre el esquema real.

## Goals / Non-Goals

**Goals:**
- Endpoint `GET /api/v1/statistics/attendance/by-period` que agrega asistencia real
  (`consumptions`) en un rango de fechas, filtrando por tipo de persona, género y carrera, y
  cubriendo tanto `beneficiaries` como `external_people`.
- Endpoint `GET /api/v1/statistics/attendance/by-lunch-session/{lunch_session_id}` con los mismos
  filtros demográficos, scoped a un único turno de servicio, más el resumen
  planificado/servido/restante de ese turno.
- Endpoint `GET /api/v1/lunch-sessions/?date=` (o reutilizar `from_date=to_date=` sobre el ya
  existente `listByRange`) para poblar el selector de turnos por fecha.
- CRUD de catálogo `careers` (`GET/POST/PATCH/DELETE /api/v1/careers`), con carga inicial (seed)
  de las 13 carreras listadas en los documentos de planificación.
- Dos páginas de frontend (`Estadísticas por período`, `Estadísticas por almuerzo`) y una página de
  administración del catálogo de carreras, reutilizando `DateInput`, `Select`, `BarChart`/
  `PieChart`, `Card`, `PageHeader`, `Table` y el patrón de `reportsApi`/`consumptionApi` ya
  existentes.
- Normalización de `gender`/`career` consistente con la ya usada en `sessionStats.ts`, ahora
  aplicada también server-side para el filtrado.

**Non-Goals:**
- No se migra `beneficiaries.career`/`external_people.career`/`students.career` a una FK contra
  `careers`. Siguen siendo texto libre; el filtrado empareja por nombre normalizado (ver
  Decisiones). Migrar los formularios de alta para que usen el catálogo queda fuera de alcance
  (fast-follow sugerido en Open Questions).
- No se modela `LunchStatus` extendido (`SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED`) porque
  `LunchSession` solo tiene `OPEN/CLOSED` en el esquema real; no se introduce ese estado ampliado.
- No se agrega `lunch_id` a `Consumption` ni se fuerza una relación 1:1 entre `Lunch` y
  `LunchSession`. El nombre del menú en "Estadísticas por almuerzo" es puramente informativo y
  best-effort.
- No se implementa exportación PDF/CSV de estas dos nuevas secciones en esta fase (los documentos
  originales lo marcan como "fase posterior"); se deja como fast-follow.
- No se toca la lógica existente del modal de gráficas de Historial de Sesiones
  (`historial-sesiones-graficas`), que sigue usando su propio `CAREER_SET` client-side.

## Decisions

### 1. Unificar `beneficiaries` + `external_people` con una CTE `UNION ALL`

Se crea `app/crud/attendance_stats.py` con una CTE base que proyecta columnas comunes desde ambas
fuentes:

```sql
WITH attendance AS (
  SELECT c.id, c.lunch_session_id, c.consumption_date,
         b.user_type::text AS person_type, b.gender, b.career
  FROM consumptions c
  JOIN beneficiaries b ON b.id = c.beneficiary_id
  WHERE c.beneficiary_id IS NOT NULL

  UNION ALL

  SELECT c.id, c.lunch_session_id, c.consumption_date,
         e.person_type::text AS person_type, e.gender, e.career
  FROM consumptions c
  JOIN external_people e ON e.id = c.external_person_id
  WHERE c.external_person_id IS NOT NULL
)
SELECT person_type, gender, career, COUNT(*) AS value
FROM attendance
WHERE <filtros>
GROUP BY <columna>
```

`person_type` en la respuesta acepta 6 valores posibles: `STUDENT, TEACHER, ADMINISTRATIVE, WORKER,
JUBILADO, EXTERNO`. El parámetro de filtro `person_type` acepta cualquiera de esos 6 valores o se
omite para "todos". El filtro de `career` solo tiene efecto práctico cuando el resultado incluye
`STUDENT` (igual que en el documento original), pero no se bloquea a nivel de query — un
`ADMINISTRATIVE` con `career` no nulo simplemente no tendrá match si se filtra por una carrera
específica.

**Alternativa descartada**: dos queries separadas (una por tabla) combinadas en Python. Se
descarta porque duplica la lógica de filtros/agrupación y complica la paginación/orden; la CTE
`UNION ALL` + `GROUP BY` en una sola query es más simple de mantener y de indexar.

### 2. `LunchSession` como clave de "almuerzo", `Lunch` solo para el nombre del menú (best-effort)

El endpoint `by-lunch-session/{id}` filtra `attendance.lunch_session_id = :id`. Para mostrar el
nombre del menú, se hace un `SELECT name FROM lunches WHERE date = :session.date ORDER BY id LIMIT
1` — si no hay resultado, `menuName` es `null` y el frontend muestra "Menú no especificado" sin
error. Si hay más de un `Lunch` esa fecha, se toma el primero por `id` de forma determinística (no
se intenta resolver ambigüedad).

`servedCount` = `COUNT(*)` de `attendance` para esa sesión (sin filtros demográficos, para el
resumen); `plannedCount` = `LunchSession.plates_quantity` (puede ser `null` si nunca se fijó);
`remainingCount = max(planned - served, 0)` cuando `planned` no es null; si `served > planned` se
expone `surplusCount = served - planned` en vez de un restante negativo, igual que pedía el
documento original.

### 3. Catálogo `careers`: tabla nueva, sin FK contra columnas de texto libre existentes

```python
class Career(Base):
    __tablename__ = "careers"
    id: int primary_key
    name: str(150) unique, not null
    is_active: bool default True
    created_at, updated_at
```

CRUD estándar (`app/crud/career.py`, `app/schemas/career.py` con `alias_generator=to_camel`,
`app/api/v1/endpoints/careers.py`), protegido con `require_role(SUPER_ADMIN, ADMIN)` para
crear/editar/eliminar; lectura (`GET /careers`) abierta a cualquier usuario autenticado para
poblar el `Select` de filtros. Migración Alembic incluye un `seed` de las 13 carreras del documento
de planificación (`Ingeniería Industrial`, `Ingeniería Mecánica`, `Ingeniería en Informática`,
`Ingeniería Civil`, `Ingeniería Electrónica`, `Ingeniería Ambiental`, `Ingeniería Agronómica`,
`Ingeniería Agroindustrial`, `Ingeniería de Producción Animal`, `Arquitectura`, `Licenciatura en
Música`, `Licenciatura en Psicología`, `TSU en Entrenamiento Deportivo`).

El filtro por carrera en los endpoints de estadísticas recibe el `career.name` seleccionado (no un
ID) y hace match normalizado contra el texto libre: `lower(unaccent(career)) = lower(unaccent(:name))`
(o `TRIM`+`LOWER` si `unaccent` no está disponible como extensión; confirmar en la migración). Los
registros cuyo `career` no matchea ningún nombre del catálogo se agrupan bajo una categoría
explícita `"Sin carrera catalogada"` en `by_career`, análoga a `CAREER_OTHER_KEY` del frontend
actual, para que la suma de categorías siga cuadrando con el total (criterio de aceptación de los
documentos originales).

**Alternativa descartada**: agregar FK `career_id` a `beneficiaries`/`external_people` y migrar los
datos existentes. Se descarta para esta fase por el riesgo de mapear mal texto libre inconsistente
sin una revisión manual previa de los datos; queda como *Open Question* / fast-follow.

### 4. Contrato de respuesta compartido entre ambos endpoints de estadísticas

Ambos endpoints devuelven el mismo shape de agregación (camelCase vía `alias_generator=to_camel`,
igual que `UserConsumptionStatsResponse`):

```ts
interface AttendanceStatsResponse {
  filters: { personType: string | null; gender: string | null; career: string | null /* + startDate/endDate o lunchSessionId según endpoint */ }
  summary: { total: number }
  byPersonType: { key: string; label: string; value: number }[]
  byGender: { key: string; label: string; value: number; percentage: number }[]
  byCareer: { key: string; label: string; value: number }[]
  byDate?: { date: string; value: number }[]        // solo by-period
  lunchSession?: {                                   // solo by-lunch-session
    id: number; date: string; status: 'OPEN' | 'CLOSED'
    sedeId: number | null; menuName: string | null
    plannedCount: number | null; servedCount: number
    remainingCount: number | null; surplusCount: number | null
    servedPercentage: number | null
  }
}
```

Reutilizar el mismo shape simplifica el frontend: un único `src/types/statistics.ts` y una única
familia de componentes de gráficas (`AttendanceByPersonTypeChart`, `AttendanceByGenderChart`,
`AttendanceByCareerChart`) consumidos por ambas páginas, en vez de duplicar tipos/gráficas por
sección como sugerían los documentos originales (`BeneficiaryTypeBarChart` vs
`LunchPersonTypeBarChart`, etc.).

### 5. Frontend: pestañas dentro de `ReportsPage` existente, no páginas/rutas nuevas

**Corrección de alcance (post-implementación inicial)**: la primera versión de este change creó
`StatisticsByPeriodPage`/`LunchSessionStatisticsPage` como páginas independientes con rutas propias
(`/comedor/estadisticas-periodo`, `/comedor/estadisticas-almuerzo`) e ítems de menú nuevos bajo
"Comedor". El usuario corrigió explícitamente: las estadísticas de asistencia del comedor
**pertenecen a la vista "Reporte de Comedor" ya existente** (`ReportsPage.tsx`, ruta
`/comedor/reporte`, ya en el menú) y no debían crear un apartado nuevo. Se migró así:

- `ReportsPage.tsx` gana una barra de pestañas (`Consumo de Insumos` | `Asistencia por Período` |
  `Asistencia por Almuerzo`), con estado local `tab` (mismo patrón sin librería usado ya en
  `RegisterDining.tsx` para su propio par de pestañas). Los filtros de fecha, las tarjetas y el
  botón "Actualizar Reporte"/"Descargar PDF" del reporte de insumos solo se muestran en la pestaña
  `insumos` (siguen siendo exclusivos de ese reporte, no aplican a las otras dos).
- Las secciones antiguas de "Reporte por Género/Carrera/Días/Tipo de Persona" (basadas en
  `consumptionApi.userStats` + `reportsApi.consumption`, sin filtro de tipo de persona/turno y sin
  cubrir externos) se **eliminaron** de `ReportsPage`, reemplazadas por la pestaña "Asistencia por
  Período" — estrictamente más capaz (mismos desgloses + filtros + externos).
- El contenido de cada pestaña de asistencia vive en un componente de panel dedicado, no en una
  página: `src/components/reports/PeriodAttendancePanel.tsx` y
  `src/components/reports/LunchSessionAttendancePanel.tsx` (misma lógica de filtros/estado descrita
  arriba — `DateInput`×2 + `Select`×3 + botón "Consultar" para período;
  fecha→sesión→filtros→gráficas para almuerzo — solo que sin su propio `PageHeader`, montados
  directamente dentro de `ReportsPage`).
- `CareerCatalogPage.tsx` **sí sigue siendo una página independiente** bajo Administración (no es
  un "reporte", es gestión de catálogo): ruta `/admin/carreras` (no `/administracion/carreras` —
  se corrigió al prefijo real ya usado por las rutas hermanas de Administración,
  `admin/permisos`, `admin/plantilla-correo`), agregada a `NavBar.tsx` (grupo "Administración") y a
  `routeAccess.ts`, restringida a `SUPER_ADMIN`/`ADMIN`.
- No se agregó ninguna ruta ni ítem de menú nuevo para las estadísticas de asistencia — viven
  enteramente dentro de `/comedor/reporte`, que ya estaba en el menú.

### 6. Índices nuevos

Para que las agregaciones UNION+GROUP BY no degraden con volumen, se agregan en la misma migración
del catálogo (o una migración hermana):

```sql
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_type ON beneficiaries(user_type);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_gender ON beneficiaries(gender);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_career ON beneficiaries(career);
CREATE INDEX IF NOT EXISTS idx_external_people_person_type ON external_people(person_type);
CREATE INDEX IF NOT EXISTS idx_external_people_gender ON external_people(gender);
CREATE INDEX IF NOT EXISTS idx_external_people_career ON external_people(career);
```

(`consumptions.consumption_date` y `consumptions.lunch_session_id` ya están indexados por las
constraints existentes; no requieren índice nuevo.)

## Risks / Trade-offs

- **[Riesgo] El catálogo de carreras no fuerza consistencia sobre el texto libre existente** →
  registros con typos/variantes no matchean ninguna carrera del catálogo y caen en "Sin carrera
  catalogada". Mitigación: bucket explícito visible en la gráfica (no se pierden silenciosamente),
  y se documenta como limitación conocida + fast-follow (migrar formularios de alta a usar el
  catálogo).
- **[Riesgo] `Lunch`/`LunchSession` sin relación garantizada** → el nombre del menú puede faltar o
  ser ambiguo (varios `Lunch` el mismo día). Mitigación: campo `menuName` nullable, sin bloquear
  la consulta de estadísticas; UI muestra "Menú no especificado" en vez de error.
- **[Riesgo] Query UNION ALL + GROUP BY sobre dos tablas puede ser costosa sin índices** →
  mitigado con los índices nuevos de la sección 6 y porque las agregaciones ocurren en backend
  (no se envían registros individuales al frontend), replicando la recomendación de los
  documentos originales.
- **[Trade-off] Un solo shape de respuesta compartido entre period/lunch-session** simplifica el
  frontend pero obliga a que `by-period` siempre incluya un `byDate` opcional y `by-lunch-session`
  un `lunchSession` opcional — ambos endpoints deben documentar claramente cuál campo aplica.
- **[Riesgo] `require_role(SUPER_ADMIN, ADMIN)` en lectura de `careers`** se relaja a "cualquier
  usuario autenticado" porque un `TAQUILLERO` también podría necesitar ver el catálogo si en el
  futuro se usa en otros formularios; mitigación: el catálogo es de solo lectura para roles fuera
  de `SUPER_ADMIN/ADMIN`, sin datos sensibles.

## Migration Plan

1. Backend: migración Alembic `careers` (tabla + seed de 13 carreras) + índices nuevos.
2. Backend: CRUD + endpoint `/api/v1/careers`.
3. Backend: `app/crud/attendance_stats.py` + schemas + los dos endpoints de estadísticas.
4. Frontend: `src/api/career.ts`, `src/api/statistics.ts`, `src/types/career.ts`,
   `src/types/statistics.ts`.
5. Frontend: `CareerCatalogPage` (para poder poblar/curar el catálogo antes de depender de él en
   los filtros) + su ruta/nav bajo Administración.
6. Frontend: `PeriodAttendancePanel`, luego `LunchSessionAttendancePanel` (reutilizando los
   componentes de gráficas creados para el primero) — montados directamente en `ReportsPage.tsx`,
   sin ruta propia.
7. Frontend: `ReportsPage.tsx` reestructurada con pestañas (`insumos`/`periodo`/`almuerzo`),
   eliminando las secciones antiguas de género/carrera/día/tipo que las nuevas pestañas
   reemplazan. Sin cambios de `NavBar.tsx`/`routeAccess.ts` para estadísticas de asistencia — solo
   la entrada de `CareerCatalogPage` del paso 5.

No requiere rollback especial: todo es aditivo (tabla nueva, endpoints nuevos) salvo la
reestructuración interna de `ReportsPage.tsx`, que reemplaza secciones existentes por otras
estrictamente más capaces; no se elimina ninguna ruta ni endpoint ya consumido por otras pantallas.

## Open Questions

- ¿Se debe permitir seleccionar **múltiples** carreras a la vez (como sugieren ambos documentos con
  `careers: string[]`) o alcanza con una sola carrera por consulta en esta primera fase? Este
  diseño asume selección única por simplicidad de query (`career = :name`); pasar a múltiple es un
  cambio menor (`career IN (:names)`) si se confirma que se necesita desde el inicio.
- ¿Vale la pena, como fast-follow inmediato (no en esta fase), migrar los formularios de alta de
  `AccesoDirecto`/`ExternalPerson` para que el campo carrera use un `Select` contra el catálogo en
  vez de texto libre? Mejoraría la tasa de match del filtro con el tiempo.
- ¿La exportación PDF/CSV de estas dos secciones (mencionada como "fase posterior" en ambos
  documentos) debe entrar en el alcance de `tasks.md` de este change, o se deja explícitamente para
  un change futuro?
