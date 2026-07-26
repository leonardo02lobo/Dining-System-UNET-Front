## 1. Ficha de persona compartida (Email → Carrera)

- [x] 1.1 `src/components/StudentResultCard.tsx`: reemplazado el `ReadOnlyField` de "Email"
      (`student.email ?? '—'`) por uno de "Carrera" (`student.career || '—'`), misma posición
      (`sm:col-span-2`).
- [x] 1.2 Verificado: las 4 pantallas usan `StudentResultCard` sin maquetado propio de este campo
      (`CheckConsumes`, modal de duplicado de `RegisterDining`, `ManualRegistrationPage`,
      `SuspendStudent`), por lo que reflejan el cambio automáticamente.
- [x] 1.3 Confirmado con `grep -n "\.email" src/pages/{CheckConsumes,RegisterDining,ManualRegistrationPage,SuspendStudent}.tsx`
      → sin resultados: ningún otro lugar de estas 4 pantallas muestra `student.email`.

## 2. Registro al Comedor — atajo de teclado

- [x] 2.1 `src/pages/RegisterDining.tsx`: quitado `active?.tagName === 'INPUT'` de la condición de
      exclusión del guard `onArrowRegister`, dejando solo `SELECT`/`TEXTAREA`. Comentario del bloque
      actualizado para explicar por qué ya no se excluye `INPUT`.
- [x] 2.2 Verificado por lectura de código (sin navegador disponible en este entorno, ver 7.3): con
      el guard corregido, el foco en `id="cedula-register"` (un `<input>`) ya no cae en la
      exclusión, así que `ArrowDown`/`ArrowUp` ejecuta `handleRegister()` normalmente.
- [x] 2.3 Confirmado: el guard conserva `SELECT`/`TEXTAREA`; el selector de sede sigue siendo
      `SELECT` y el motivo de suspensión sigue siendo `TEXTAREA`, ambos siguen exentos.

## 3. Registro Manual — atajo de teclado duplicado

- [x] 3.1 `src/pages/ManualRegistrationPage.tsx`: eliminado el primer `useEffect` de atajo
      `ArrowDown` (el que dependía de `[student, date, saving, editTarget, deleteTarget]` con el
      `eslint-disable-next-line react-hooks/exhaustive-deps`), dejando solo el segundo (el que usa
      `canSave` derivado). Verificado con `grep -n "onArrowDownSave"` → un solo listener registrado.
- [x] 3.2 Verificado por lectura de código: con un solo `useEffect`, `handleSave()` se invoca una
      única vez por pulsación de `ArrowDown`.
- [x] 3.3 Confirmado: el listener restante sigue respetando `SELECT`/`TEXTAREA` y los estados
      inválidos (`editTarget`/`deleteTarget`/`saving`) sin cambios de esa lógica.

## 4. Reportes de Consumo — pestañas de asistencia

- [x] 4.1 `src/pages/ConsumptionReportPage.tsx`: agregado estado de pestaña
      (`insumos`/`periodo`/`almuerzo`) y la barra de pestañas, mismo patrón visual que
      `ReportsPage.tsx` (botones con `border-b-2`, sin librería de tabs).
- [x] 4.2 Contenido existente de la página (filtros de fecha/categoría, tabla, gráficas,
      exportación PDF/CSV) envuelto en `{tab === 'insumos' && (...)}`, sin modificar su lógica.
- [x] 4.3 `PeriodAttendancePanel` montado en la pestaña `periodo` y `LunchSessionAttendancePanel`
      en la pestaña `almuerzo`, importados desde `src/components/reports/` sin modificarlos.
- [x] 4.4 Título de la página normalizado a "Reportes de Consumo" (antes "Reportes de consumo",
      minúscula inconsistente con el nombre de nav); sin subtítulo porque esta página no usa el
      componente `PageHeader` (usa un `<h1>` simple, a diferencia de `ReportsPage.tsx`).

## 5. Reportes del Comedor — revertir pestañas

- [x] 5.1 `src/pages/ReportsPage.tsx`: quitada la barra de pestañas y las secciones `periodo`/
      `almuerzo`, dejando únicamente el contenido de consumo de insumos (equivalente a su forma
      previa a `add-attendance-statistics`); se conservó la validación de fechas incompletas
      (`!dateFrom || !dateTo || dateFrom > dateTo`) agregada en la conversación anterior, ya que es
      una corrección de bug independiente de las pestañas.
- [x] 5.2 Quitados los imports de `PeriodAttendancePanel`/`LunchSessionAttendancePanel` de
      `ReportsPage.tsx` (los archivos siguen existiendo, ahora solo se importan desde
      `ConsumptionReportPage.tsx`).

## 6. Reconciliación de specs

- [x] 6.1 Confirmado con `openspec validate improve-dining-ux-and-consumption-reports --strict` →
      válido: las 4 specs delta (`registro-manual-tarjeta-usuario-compartida`,
      `consumo-duplicado-aviso`, `registro-atajo-arrowdown`, `eliminar-suspender-usuario`) y la
      nueva (`reportes-consumo-pestanas-asistencia`) están correctamente escritas.

## 7. Verificación end-to-end

- [x] 7.1 `npx tsc --noEmit` → 0 errores.
- [x] 7.2 `npx vitest run` → 76/78 tests pasan; los 2 fallos (`src/api/lunch.test.ts`,
      `src/utils/csvImport.test.ts`) son preexistentes y no relacionados con este cambio (mismos
      fallos ya presentes antes de tocar ningún archivo de este change).
- [x] 7.3 **Parcial** — no se pudo levantar `npm run tauri dev`/navegador real en este entorno
      (mismo sandbox sin Postgres ni Tauri de la sesión anterior). Verificado en su lugar por
      lectura de código + `tsc`/`vitest` limpios. **Pendiente**: confirmar visualmente en un
      navegador real contra un backend con Postgres: las 4 fichas sin email, el atajo con foco en
      cédula en Registro al Comedor, el atajo sin doble disparo en Registro Manual, las 3 pestañas
      en Reportes de Consumo, y que Reportes del Comedor ya no tiene pestañas de asistencia.
