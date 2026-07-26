## 1. Backend — Catálogo de carreras

- [x] 1.1 Crear modelo `Career` (`app/models/career.py`): `id`, `name` (único, case-insensitive),
      `is_active`, `created_at`, `updated_at`. Registrado en `app/models/__init__.py`.
- [x] 1.2 Migración Alembic (`a1c2d3e4f5b6`, `down_revision=b7c8d9e0f1a2`, head real verificado con
      `alembic heads`): crea tabla `careers` + seed de las 13 carreras del documento de
      planificación.
- [x] 1.3 Migración Alembic (misma revisión): índices nuevos `idx_beneficiaries_user_type`,
      `idx_beneficiaries_gender`, `idx_beneficiaries_career`, `idx_external_people_person_type`,
      `idx_external_people_gender`, `idx_external_people_career`.
- [x] 1.4 `app/schemas/career.py`: `CareerResponse`, `CareerCreate`, `CareerUpdate`. Snake_case
      plano (`from_attributes=True`), no camelCase — se siguió el patrón real de los catálogos
      simples ya existentes (`access_reasons`, `sedes`, `lunch_sessions`), no el de
      `user_consumption_stats`; camelCase se reservó para `attendance_stats` (tarea 2.4), que sí es
      la familia "stats" con ese convenio.
- [x] 1.5 `app/crud/career.py`: `get_by_id`, `get_by_name` (case-insensitive vía
      `app/utils/text.py::normalize_text`), `get_all`, `create`, `update`, `delete`.
- [x] 1.6 `app/api/v1/endpoints/careers.py`: `GET /careers` (cualquier usuario autenticado),
      `POST/PATCH/DELETE /careers` (`require_role(SUPER_ADMIN, ADMIN)`, 409 en nombre duplicado).
      Registrado en `app/api/v1/router.py`.
- [x] 1.7 Tests backend (`tests/test_career_catalog.py`, 4 tests, SQLite en memoria): creación,
      listado, `get_by_name` case/espacio-insensitive, edición, borrado.

## 2. Backend — Estadísticas de asistencia (período)

- [x] 2.1 `app/crud/attendance_stats.py`: `_attendance_cte()` — CTE `UNION ALL` sobre
      `beneficiaries`/`external_people` unidas a `consumptions`, con `person_type` casteado a
      `String` en ambas ramas para evitar choque de tipos ENUM en Postgres (ver design.md,
      Decisión 1).
- [x] 2.2 `get_attendance_by_period(db, start_date, end_date, person_type?, gender?, career?)`:
      agrega `total`, `by_person_type`, `by_gender` (con `percentage`), `by_career` (limitado a
      `STUDENT`, con bucket "Sin carrera catalogada" para no-matches — decisión explícita para no
      contaminar el bucket con no-estudiantes sin carrera, documentada en el código), `by_date`.
- [x] 2.3 Normalización de `career`: `app/utils/text.py::normalize_text` (lower+trim) comparado
      contra `lower(trim(careers.name))` en SQL — sin `unaccent` (no portable a SQLite, usado en
      los tests); limitación de acentos documentada en el docstring del helper.
- [x] 2.4 `app/schemas/attendance_stats.py`: `AttendanceStatsResponse` compartido (ver design.md,
      Decisión 4), camelCase vía `alias_generator=to_camel` (reutiliza el `to_camel` de
      `user_consumption_stats.py`).
- [x] 2.5 Endpoint `GET /api/v1/statistics/attendance/by-period` en
      `app/api/v1/endpoints/statistics.py`, `require_role(SUPER_ADMIN, ADMIN)`, valida
      `start_date <= end_date` (422) y `person_type`/`gender` contra los valores válidos (422).
- [x] 2.6 Registrado router de `statistics` en `app/api/v1/router.py`.
- [x] 2.7 Tests backend (`tests/test_attendance_stats.py`): combina beneficiarios+externos, excluye
      fuera de rango, límites inclusive, filtro por tipo/género/carrera, carrera case-insensitive,
      carrera solo cuenta estudiantes, carrera aplica sin importar tipo de persona.

## 3. Backend — Estadísticas de asistencia (por almuerzo/turno)

- [x] 3.1 `get_lunch_session_summary(db, lunch_session)`: `planned_count` (desde
      `LunchSession.plates_quantity`), `served_count` (`COUNT(*)` de consumos del turno),
      `remaining_count`/`surplus_count` según corresponda, `served_percentage` (`None` si
      planificado es 0/null), `menu_name` best-effort (`Lunch` con misma fecha, primero por `id`).
- [x] 3.2 `get_attendance_by_lunch_session(db, lunch_session_id, person_type?, gender?, career?)`:
      mismo shape de agregación que 2.2, scoped a `lunch_session_id` (sin join a `LunchSession`,
      filtro directo sobre el CTE).
- [x] 3.3 Endpoint `GET /api/v1/statistics/attendance/by-lunch-session/{lunch_session_id}`: 404 si
      el turno no existe; combina resumen (3.1) + agregación filtrada (3.2) en un único
      `AttendanceStatsResponse` con el campo `lunchSession` poblado.
- [x] 3.4 Confirmado (lectura de `app/api/v1/endpoints/lunch_sessions.py::list_sessions`):
      `from_date`/`to_date` son `Query` independientes sin validación cruzada, así que
      `from_date == to_date` ya funciona sin cambios.
- [x] 3.5 Tests backend (`tests/test_attendance_stats.py`): turno sin consumos, scoping (no filtra
      entre turnos del mismo día), excedente cuando servido > planificado, porcentaje `None` con
      planificado nulo/cero, nombre de menú best-effort con y sin `Lunch` coincidente.

## 4. Frontend — Tipos y API

- [x] 4.1 `src/types/career.ts`: `Career`, `CareerCreatePayload`, `CareerUpdatePayload`.
- [x] 4.2 `src/api/career.ts`: `careerApi.list/create/update/remove`.
- [x] 4.3 `src/types/statistics.ts`: `PersonType` (6 valores, `''` representa "Todos" en el
      frontend), `AttendanceQueryFilters`/`AttendanceFilters`, `AttendanceStatsResponse`,
      `LunchSessionSummary` (mirror del contrato camelCase de design.md), más
      `PERSON_TYPE_OPTIONS`/`GENDER_OPTIONS`/`personTypeAllowsCareer` compartidos por ambas páginas.
- [x] 4.4 `src/api/statistics.ts`: `statisticsApi.byPeriod(startDate, endDate, filters?)`,
      `statisticsApi.byLunchSession(lunchSessionId, filters?)`.
- [x] 4.5 Componentes de gráficas compartidos: `AttendanceByPersonTypeChart`,
      `AttendanceByGenderChart`, `AttendanceByCareerChart` (bajo `src/components/statistics/`),
      construidos sobre `BarChart`/`PieChart` + `piePercentOptions` existentes.

## 5. Frontend — Catálogo de carreras (Administración)

- [x] 5.1 `CareerCatalogPage.tsx`: listado (`Table`) + modal editar + confirmación de borrado,
      inspirado en el patrón de gestión de categorías de `InventoryPage.tsx` (formulario de alta
      inline en vez de modal, ya que aquí es la página completa y no un modal secundario).
- [x] 5.2 Acciones de crear/editar/eliminar ocultas para roles distintos de `SUPER_ADMIN`/`ADMIN`
      vía `useAuth()`; el listado es visible para cualquier usuario autenticado que tenga acceso a
      la ruta (la ruta en sí sigue restringida a `SUPER_ADMIN`/`ADMIN`, ver tarea 8.2).
- [x] 5.3 Error de nombre duplicado (409 del backend) mostrado inline bajo el campo `Input` del
      formulario correspondiente (creación/edición), no vía `notify.error` genérico, para que quede
      asociado al campo.

## 6. Frontend — Estadísticas por período

- [x] 6.1 `PeriodAttendancePanel.tsx` (`src/components/reports/`, no es página — se monta como
      pestaña "Asistencia por Período" dentro de `ReportsPage.tsx`, ver sección 8): filtros
      `DateInput` (desde/hasta) + `Select` de tipo de persona + `Select` de género + `Select` de
      carrera (condicional, poblado desde `careerApi.list`) + botón "Consultar" (sin auto-fetch —
      la consulta solo se dispara al pulsar el botón).
- [x] 6.2 Validaciones cliente: fechas obligatorias, `dateFrom <= dateTo`, mensajes exactos del
      spec (`estadisticas-periodo`).
- [x] 6.3 Selector de carrera oculto/limpiado cuando el tipo de persona no sea `STUDENT`/"Todos"
      (`personTypeAllowsCareer`).
- [x] 6.4 Tarjetas de resumen (total + un card por bucket de `byPersonType`) + gráficas: barras de
      carrera cuando `personType === 'STUDENT'`, barras de tipo de persona en cualquier otro caso
      (`byPersonType`/`byCareer` "según el filtro activo"), más el circular de género.
- [x] 6.5 Estados de carga (`Spinner`), error (`notify.error`) y "sin resultados" (mensaje exacto
      del spec, solo tras una consulta ejecutada con `total === 0`).

## 7. Frontend — Estadísticas por almuerzo

- [x] 7.1 `LunchSessionAttendancePanel.tsx` (`src/components/reports/`, no es página): `DateInput`
      de fecha → `Select` de turnos de esa fecha
      (`lunchSessionApi.listByRange({from_date: date, to_date: date})`) → tarjeta de resumen del
      turno (`LunchSessionSummary`) al seleccionar.
- [x] 7.2 Cambiar la fecha limpia turno seleccionado + resultados (`useEffect` sobre `lunchDate`
      resetea `selectedSessionId`/`result` antes de recargar turnos).
- [x] 7.3 Filtros demográficos (mismos componentes que la sección de período) scoped al
      `lunch_session_id` seleccionado, con el mismo comportamiento condicional de carrera.
      **Desviación deliberada de diseño**: a diferencia de la sección por período, aquí los
      filtros SÍ disparan la consulta automáticamente al cambiar (`useEffect` sobre
      `[selectedSessionId, personType, gender, career]`) — el dataset está acotado a un solo turno
      (no a un rango abierto de fechas), y el documento de planificación original de "por
      almuerzo" no pide el mismo botón "Aplicar filtros" que sí pide explícitamente el de
      "por período" (sección 12, Optimización). No está cubierto por un Scenario del spec, así
      que es una decisión de implementación razonable, no una violación de spec.
- [x] 7.4 Tarjeta de resumen: planificado/servido/restante o excedente, porcentaje de cumplimiento
      (o "No disponible" si planificado es 0/null), nombre del menú o "Menú no especificado".
- [x] 7.5 Estados: sin fecha, fecha sin turnos, sin turno seleccionado, turno sin registros
      (mensajes exactos del spec `estadisticas-almuerzo`).

## 8. Navegación y control de acceso

**Corrección de alcance (post-implementación inicial)**: la primera versión de las tareas 8.1-8.3
agregó rutas/ítems de menú nuevos para "Estadísticas por Período" y "Estadísticas por Almuerzo"
bajo "Comedor". El usuario corrigió: esas dos vistas debían integrarse como pestañas dentro de la
vista "Reporte de Comedor" ya existente (`/comedor/reporte`), no como un apartado nuevo. Se
revirtieron esas rutas/ítems (ver sección 6/7 arriba, ahora paneles montados en `ReportsPage.tsx`)
y solo queda navegación nueva para el catálogo de carreras, que sí es una vista de administración
distinta.

- [x] 8.1 Ruta agregada en `src/App.tsx`: `admin/carreras` (única ruta nueva). Prefijo real `admin/`
      (no `administracion/` como decía la primera versión de design.md) porque es la convención ya
      usada por las rutas hermanas (`admin/permisos`, `admin/plantilla-correo`).
- [x] 8.2 Entrada en `src/config/routeAccess.ts` restringida a `SUPER_ADMIN`/`ADMIN` para
      `/admin/carreras`.
- [x] 8.3 Ítem agregado en `src/components/ui/NavBar.tsx`: grupo "Administración" → "Catálogo de
      Carreras". Sin cambios de nav para las estadísticas de asistencia (viven dentro de la pestaña
      existente "Reporte de Comedor").

## 9. Verificación end-to-end

- [x] 9.1 **Parcial** — no se pudo levantar `npm run tauri dev`/navegador real en este entorno
      (sandbox sin Postgres ni Tauri disponibles). Se verificó en su lugar: `tsc --noEmit` limpio
      para todos los archivos nuevos/modificados, y la lógica de agregación completa vía los tests
      de backend (`test_attendance_stats.py`, `test_career_catalog.py`). **Pendiente**: probar los
      tres flujos en un navegador real contra un backend con Postgres antes de dar por buena la UX.
- [x] 9.2 `npx tsc --noEmit`: **0 errores en los archivos de este change**. Persisten 5 errores
      preexistentes en `src/pages/RegisterDining.tsx` (variable `recentOpen` no definida, `student`
      posiblemente `null`) ya presentes en `develop` antes de este cambio y no tocados por él —
      bloquean `npm run build` de punta a punta hasta que se corrijan aparte. También hay 2 tests
      preexistentes fallando (`src/api/lunch.test.ts`, `src/utils/csvImport.test.ts`), igualmente
      no relacionados con este change.
- [x] 9.3 Verificado mediante `test_attendance_stats.py` (backend): los tests de agregación
      confirman que `by_person_type`/`by_gender` suman al `total` en los escenarios cubiertos
      (combinación beneficiarios+externos, filtros individuales). No se hizo una verificación
      manual adicional en UI por la limitación de entorno de 9.1.
- [x] 9.4 Verificado con tests dedicados: `test_by_period_range_boundaries_are_inclusive` (límite
      exacto incluido) y `test_by_lunch_session_does_not_leak_other_sessions` (no mezcla turnos del
      mismo día).
