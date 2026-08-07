## Why

Cinco necesidades operativas del Decanato que hoy no tienen pantalla en el panel:

1. **No hay ninguna vista del padrón.** `StudentImportPage` importa 8.380 estudiantes y ahí termina
   el recorrido: no existe forma de verlos ni de corregir un dato. Y como el CSV de Control de
   Estudios no trae sexo, la gráfica de género del historial de sesiones clasifica hoy a todo el
   mundo como "No especificado".
2. **El taquillero descubre que alguien ya comió después de intentar registrarlo.** El aviso actual
   nace del 409 del POST. Además `ManualRegistrationPage` solo lista los registros manuales de la
   fecha, así que quien entró por taquilla es invisible ahí — que es exactamente cómo se acaba
   registrando dos veces a la misma persona.
3. **El modal de suspensión no tiene campo de fecha.** Ni el rápido de `RegisterDining` ni
   `SuspendStudent`. El contrato del backend acepta `end_date` desde siempre; la UI nunca la expuso.
4. **Levantar una suspensión no avisa a nadie**, y `EmailTemplatePage` edita una única plantilla con
   el título fijo "Plantilla de Correo de Sanción".
5. **El desplegable de rol muestra `BENEFICIARIO` en crudo.** Es la punta visible de un desajuste
   mayor: la API envía `BENEFICIARIO` y el frontend indexa por `ACCESO_DIRECTO` en cuatro mapas
   `ROLE_LABEL` duplicados, en `ROUTE_ACCESS` y en `DEFAULT_ROUTE`. Ninguno resuelve: `ListUser`
   pinta la celda vacía y `PermissionsPage` renderiza literalmente "Nombre — undefined".

## What Changes

- **Pantalla `/estudiantes`** (`StudentsPage`): lista paginada del padrón con los filtros que
  `GET /students` ya expone (`search`, `is_active`, `cod_carr`), más un filtro **"Sin sexo
  asignado"** que la convierte en cola de trabajo. Al seleccionar una fila, panel de detalle
  **separado en secciones** (Identificación · Datos académicos · Contacto · Estado · Sexo) con todos
  los campos de solo lectura salvo el sexo.
- **Aviso de consumo previo** en `RegisterDining` y `ManualRegistrationPage`: consulta a
  `check-by-document` en paralelo con el lookup, resultado pintado en la ranura `notice` que
  `StudentResultCard` ya expone, y botón de registrar deshabilitado. En el registro manual la
  consulta usa **la fecha seleccionada**, no hoy.
- **Pestaña "Ingresos del día"** en `ManualRegistrationPage`, alimentada por `day-summary`, con
  columna que distingue taquilla de registro manual.
- **Fecha de fin en los dos modales de suspensión**, con `min`/`max` nativos y casilla "Indefinida"
  que envía `end_date: null` de forma explícita.
- **`EmailTemplatePage` con dos pestañas** (Suspensión · Levantamiento), extrayendo el editor a un
  `EmailTemplateEditor` reutilizable parametrizado por clave.
- **Un único `ROLE_LABEL`** en `src/utils/labels.ts`, junto al `USER_TYPE_LABEL` que ya cumple ese
  papel para los tipos de persona, sustituyendo a las cuatro copias divergentes.

## Capabilities

### New Capabilities
- `padron-estudiantes-vista`: pantalla de consulta del padrón y clasificación del sexo.
- `consumo-dia-aviso`: aviso anticipado de consumo previo y relación de ingresos del día.
- `suspension-fecha-limite`: campo de fecha de fin acotado en los modales de suspensión.
- `plantilla-correo-levantamiento`: edición de la plantilla del correo de levantamiento.
- `rol-acceso-directo-etiqueta`: etiqueta única y correcta del rol de acceso directo.

## Impact

- **Archivos nuevos:** `src/pages/StudentsPage.tsx`, `src/components/EmailTemplateEditor.tsx`.
- **Archivos modificados:** `src/App.tsx`, `src/config/routeAccess.ts`, `src/utils/labels.ts`,
  `src/api/externalStudent.ts`, `src/api/consumption.ts`, `src/api/emailTemplate.ts`,
  `src/types/student.ts`, `src/types/consumption.ts`, `src/types/user.ts`,
  `src/pages/RegisterDining.tsx`, `src/pages/ManualRegistrationPage.tsx`,
  `src/pages/SuspendStudent.tsx`, `src/pages/EmailTemplatePage.tsx`, `src/pages/ListUser.tsx`,
  `src/pages/PermissionsPage.tsx`, `src/components/UserFormModal.tsx`,
  `src/components/layout/Header.tsx`.
- **Dependencia dura del backend:** este cambio consume el contrato definido en
  `be-mejoras-operativas-comedor/design.md`. Ambos se desarrollan en paralelo, así que las formas de
  ese documento son normativas y no se negocian sobre la marcha.
- **Coordinación obligatoria:** la ruta `/estudiantes` necesita su entrada en `_PERMISSIONS`
  (backend `app/db/init_db.py`) **y** en `ROUTE_ACCESS`. Si falta cualquiera de las dos, la pantalla
  queda inaccesible o sin control de permisos. Es el paso que más se olvida en este proyecto.
- **Alcance (acotado):** NO se toca el flujo de registro de consumo ni el modal de duplicado por
  409, que se conserva como red para la condición de carrera entre dos taquillas.

## Non-goals

- Editar cualquier dato del padrón que no sea el sexo. El resto llega del CSV oficial y se corrige
  reimportando, no a mano.
- Dar de alta estudiantes desde la pantalla nueva.
