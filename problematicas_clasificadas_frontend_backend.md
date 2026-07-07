# Problemáticas clasificadas por Frontend y Backend

## Criterio usado

- **Frontend:** cambios visuales, pantallas, formularios, botones, modales, navegación, tablas, impresión desde navegador, experiencia de usuario y comportamiento visible.
- **Backend:** reglas de negocio, endpoints, validaciones, persistencia en base de datos, permisos, reportes agregados, concurrencia y sesiones.
- **Frontend + Backend:** requiere cambios visibles y también lógica/API/base de datos.
- **No realizable directamente:** requiere intervención externa: CETI, autoridades, Recursos Humanos, hardware físico, red, equipos o decisiones institucionales.

---

# 1. Problemáticas realizables

## 1.1 Pantalla de registro y experiencia de uso

> **Leyenda de estado (Backend):** ✅ Hecho en esta fase · ☑️ Ya estaba implementado · ➖ No aplica al backend (tarea de Frontend).
>
> **Leyenda de estado (Frontend):** ✅ Hecho en esta fase · ☑️ Ya estaba implementado · ⚠️ Requiere backend pendiente (no realizable solo con frontend) · ➖ No aplica.

| # | Problemática / cambio solicitado | Clasificación | Frontend | Backend |
|---|---|---|---|---|
| 1 | Agrandar la foto del estudiante y moverla hacia la derecha. | Frontend | ☑️ La foto usa `Avatar` grande (`h-80 w-80`) ubicado a la derecha de los datos en `RegisterDining`. | ➖ No aplica al backend (tarea de Frontend). El registro consume datos vía `studentApi.lookup`; la API entrega los campos correctos. |
| 2 | Aumentar el tamaño de letras, nombres y datos importantes. | Frontend | ☑️ Jerarquía visual aplicada (etiquetas, `PageHeader`, campos `Input`). Ajuste fino de tamaños es opcional. | ➖ No aplica al backend (tarea de Frontend). |
| 3 | Aprovechar mejor los espacios vacíos de la interfaz. | Frontend | ☑️ Layout en dos columnas (datos + foto) y tarjetas `Card` distribuidas en `RegisterDining`. | ➖ No aplica al backend (tarea de Frontend). |
| 4 | Hacer la interfaz más cómoda para el taquillero. | Frontend | ☑️ Flujo de una sola búsqueda + acción; redirección directa al registro al iniciar sesión (ver #12). | ☑️ Ya estaba: el flujo ya está consolidado. `POST /consumptions/` valida sesión + duplicado + sanción en una sola llamada y `GET /consumptions/check/{id}` combina consumo + sanción activa, evitando consultas múltiples. No requiere cambios. |
| 5 | Permitir uso fluido con teclado. | Frontend | ☑️ Búsqueda con `Enter` + captura global del lector de código de barras; `autoFocus` en la pantalla de verificación. | ➖ No aplica al backend (tarea de Frontend). |
| 6 | Separar visualmente lo que ve el taquillero de lo que ve acceso directo. | Frontend + Backend | ☑️ `routeAccess`/`ProtectedRoute` filtran por rol; el rol `ACCESO_DIRECTO` solo accede a la pantalla kiosko `VerifyAccesoDirectoPage`. | ✅ Hecho. Permisos validados por rol: `GET /accesos_directos/verify/{doc}` (único endpoint para rol `ACCESO_DIRECTO`) devuelve el schema reducido `AccesoDirectoVerifyResponse` (solo nombre, cédula, estado, prioridad). Se cerró la fuga de datos restringiendo `lookup`, `POST /consumptions/`, `consumptions/check` y `user-stats` para excluir al rol kiosko `ACCESO_DIRECTO`, que ya no puede obtener el registro completo (email, carrera, etc.). |

---

## 1.2 Registro del comedor

| # | Problemática / cambio solicitado | Clasificación | Frontend | Backend |
|---|---|---|---|---|
| 7 | Mostrar claramente si el estudiante está suspendido. | Frontend + Backend | ☑️ `RegisterDining`/`ManualRegistrationPage` muestran banner y `Badge` de estado y deshabilitan el botón de registrar. | ☑️ Ya estaba: `POST /consumptions/` valida la sanción activa (paso 4) y `GET /consumptions/check/{id}` devuelve `active_sanction` para mostrar el estado antes de registrar. |
| 8 | Bloquear registro si el estudiante está suspendido. | Backend | ☑️ El frontend captura el `403` con la sanción y muestra el aviso; botón deshabilitado. | ☑️ Ya estaba: `POST /consumptions/` rechaza con `403` (`get_active_for_acceso_directo`) si hay sanción activa, devolviendo el detalle de la sanción. |
| 9 | Mostrar claramente si el usuario no tiene acceso directo. | Frontend + Backend | ☑️ Mensaje verde/ámbar en `RegisterDining` y aviso en `VerifyAccesoDirectoPage`. | ☑️ Ya estaba: `GET /accesos_directos/verify/{doc}` consulta y devuelve `status`/`is_priority`; un `404` indica que no es acceso directo. |
| 10 | Mostrar aviso de acceso directo como pop-up de 5 segundos. | Frontend | ✅ Pop-up a pantalla completa en `VerifyAccesoDirectoPage` que se autocierra a los 5 s (`POPUP_MS`). | No aplica. |
| 11 | Diferenciar acceso directo por color: rojo si no tiene, verde si tiene. | Frontend | ✅ El pop-up usa borde/ícono/texto verde (acceso permitido) o rojo (denegado/no encontrado). | No aplica, solo debe devolver el estado correcto. |
| 12 | Redirigir al registro al iniciar sesión. | Frontend + Backend | ✅ Tras el login se redirige por rol vía `DEFAULT_ROUTE`; el `TAQUILLERO` cae directo en `/comedor/registrar`. | ☑️ Ya estaba: el login expone el rol (cookie `unet_user_role` + `GET /users/me`) y `GET /lunch_sessions/today` informa la sesión activa para decidir la pantalla. |
| 13 | Mantener confirmación al cerrar sesión o cerrar almuerzo. | Frontend | ☑️ Modal de confirmación en `NavBar` (logout) y en `LunchSessionPage` (cierre de almuerzo). | ➖ No aplica: cerrar sesión (`POST /auth/logout`) y cerrar almuerzo (`PUT /lunch_sessions/{id}/close`) son endpoints independientes; el logout no cierra el almuerzo. |
| 14 | Cerrar almuerzo y bloquear nuevos registros. | Frontend + Backend | ☑️ `LunchSessionPage` cierra la sesión; `RegisterDining`/`ManualRegistrationPage` bloquean cuando no hay sesión abierta. | ✅ Hecho. `PUT /lunch_sessions/{id}/close` cambia el estado a `CLOSED`; al no quedar sesión abierta, `POST /consumptions/` rechaza con `400 No open lunch session`. |
| 15 | Mostrar aviso si no hay sesión de almuerzo activa. | Frontend + Backend | ☑️ Banner ámbar "No hay sesión activa" e inputs/botones deshabilitados. | ✅ Hecho. `POST /consumptions/` resuelve la sesión abierta (`get_open`) y devuelve `400` si no existe; `GET /lunch_sessions/today` devuelve `404` cuando no hay sesión activa. |

---

## 1.3 Acceso directo / beneficiarios

| # | Problemática / cambio solicitado | Clasificación | Frontend | Backend |
|---|---|---|---|---|
| 16 | Cambiar el término “VIP” por “Acceso directo”. | Frontend + Backend | ✅ Eliminado todo uso de "VIP" en la UI; el indicador de prioridad ahora se rotula "Prioritario" (`AccesoDirectoPage`, `VerifyAccesoDirectoPage`, `AccesoDirectoFormModal`). | ☑️ Ya estaba: el modelo no usa "VIP"; la prioridad se modela con el booleano `is_priority` y los enums son `UserType`/`AccesoDirectoStatus`. |
| 17 | Cambiar “beneficiario” por “acceso directo” donde corresponda. | Frontend + Backend | ☑️ Interfaz ya renombrada a "Acceso Directo"; sin referencias a "beneficiario" en `src/`. | ☑️ Ya estaba: modelo `AccesoDirecto`, schemas y rutas `/accesos_directos`; no existe campo `beneficiario`. Solo persiste el nombre interno de tabla `beneficiaries` (no expuesto en la API). |
| 18 | Mostrar foto en la verificación de acceso directo. | Frontend + Backend | ✅ Hecho. `VerifyAccesoDirectoPage` muestra la foto (`popup.data.photo_url`) en el pop-up de verificación. | ✅ Hecho. `AccesoDirectoVerifyResponse` incluye `photo_url`; el modelo `AccesoDirecto` tiene la columna `photo_url`. |
| 19 | Eliminar o autocompletar el campo carnet. | Frontend + Backend | ✅ Carnet ahora es opcional en `AccesoDirectoFormModal`; si se deja vacío se autocompleta con la cédula. | ☑️ Ya estaba: `card_code` es `nullable=True` y `AccesoDirectoCreate` lo acepta opcional (el frontend lo autocompleta con la cédula). |
| 20 | Clasificar acceso directo por tipo de persona: estudiante, docente, administrativo, obrero. | Frontend + Backend | ☑️ Selector de tipo en el formulario y filtro + columna por tipo en `AccesoDirectoPage`. | ✅ Hecho. Columna/enum `UserType` (STUDENT/TEACHER/ADMINISTRATIVE/WORKER) en el modelo y filtro `user_type` en `GET /accesos_directos/`. |
| 21 | Agregar rol o motivo de acceso directo: fútbol, básquet, dependencia, autorización, etc. | Frontend + Backend | ✅ Hecho. Selector "Motivo / Rol de acceso directo" en `AccesoDirectoFormModal` y columna "Motivo" en `AccesoDirectoPage`. | ✅ Hecho. Nuevo modelo `AccessReason` (tabla `access_reasons`) con CRUD en `/access_reasons`; `AccesoDirecto.access_reason_id` lo asocia a cada persona. |
| 22 | Buscar acceso directo por grupo o rol. | Frontend + Backend | ✅ Hecho. Además de nombre/cédula y filtros tipo/estado, hay filtro por motivo/rol en `AccesoDirectoPage`. | ✅ Hecho. `GET /accesos_directos/` acepta el parámetro `access_reason_id` para filtrar por motivo/rol. |

---

## 1.4 Registro manual

| # | Problemática / cambio solicitado | Clasificación | Frontend | Backend |
|---|---|---|---|---|
| 23 | Seleccionar fecha antes de registrar manualmente. | Frontend + Backend | ⚠️ Pendiente de backend: `ConsumptionCreate` ata el registro a la sesión del día (no acepta fecha arbitraria). | Guardar cada registro manual asociado a la fecha seleccionada. |
| 24 | Mostrar listado de registros manuales cargados. | Frontend + Backend | ⚠️ Pendiente de backend: `GET /consumptions/` no filtra por `is_manual`; falta exponerlo para listar. | Endpoint para listar registros manuales por fecha. |
| 25 | Editar registros manuales. | Frontend + Backend | ⚠️ Pendiente de backend: no existe endpoint para actualizar un consumo. | Endpoint para actualizar registro manual. |
| 26 | Eliminar registros manuales. | Frontend + Backend | ⚠️ Pendiente de backend: no existe endpoint para eliminar/anular un consumo. | Endpoint para eliminar o anular registro manual. |
| 27 | Imprimir listado manual como respaldo. | Frontend | ⚠️ Depende de #24 (no hay listado que imprimir todavía). | Solo aplica si se necesita endpoint PDF; si es impresión del navegador, no. |
| 28 | Ordenar impresión/listado por número de cédula. | Frontend + Backend | ⚠️ Depende de #24. La tabla `Table` ya soporta orden por columna cuando exista el listado. | Devolver registros ordenados por cédula o permitir parámetro de ordenamiento. |

---

## 1.5 Suspensión de usuarios

| # | Problemática / cambio solicitado | Clasificación | Frontend | Backend |
|---|---|---|---|---|
| 29 | Suspender desde la pantalla de registro para ahorrar tiempo. | Frontend + Backend | ⚠️ Pendiente de frontend: el backend ya soporta `sanctionApi.create`; falta el botón rápido en `RegisterDining`. La gestión completa ya existe en `SuspendStudent`. | Endpoint para crear suspensión desde el flujo de registro. |
| 30 | Pedir motivo de suspensión en una ventana rápida. | Frontend + Backend | ☑️ `SuspendConfirmModal` con textarea de motivo obligatorio y confirmación en `SuspendStudent`. | Validar y guardar motivo de suspensión. |
| 31 | Usar sección de suspendidos para consultar y quitar suspensión. | Frontend + Backend | ☑️ `SuspendStudent` consulta el historial de sanciones y permite revocar (reactivar) la sanción activa. | Endpoint para listar suspendidos y quitar suspensión. |
| 32 | Deshabilitar temporalmente el botón de desregistrar. | Frontend | ➖ No aplica: no existe botón de "desregistrar" en la interfaz actual. | Opcional: bloquear también el endpoint si existe. |

---

## 1.6 Sedes

| # | Problemática / cambio solicitado | Clasificación | Frontend | Backend |
|---|---|---|---|---|
| 33 | Conectar sede con el registro del comedor. | Frontend + Backend | ⚠️ Pendiente de backend: `ConsumptionCreate`/`LunchSession` no asocian `sede_id`. | Asociar cada registro de entrada con una sede. |
| 34 | Mostrar selección de sede arriba en el registro. | Frontend | ⚠️ Depende de #33 (el registro aún no maneja sede). | No aplica directamente. |
| 35 | Permitir crear nuevas sedes. | Frontend + Backend | ☑️ `SedesPage` con CRUD completo (crear/editar/desactivar) sobre `/sedes`. | Endpoint y modelo de sedes. |

---

## 1.7 Reportes y estadísticas

| # | Problemática / cambio solicitado | Clasificación | Frontend | Backend |
|---|---|---|---|---|
| 36 | Crear gráficas de entradas al comedor. | Frontend + Backend | ☑️ `ReportsPage` renderiza gráficos de torta/barra (Chart.js). | Endpoint de estadísticas de entradas. |
| 37 | Clasificar gráficas por carrera. | Frontend + Backend | ☑️ Gráfico "Reporte por Carrera" desde `consumptionApi.userStats`. | Consulta agregada por carrera. |
| 38 | Clasificar gráficas por sexo. | Frontend + Backend | ☑️ Gráfico "Reporte por Género" desde `consumptionApi.userStats`. | Consulta agregada por sexo. |
| 39 | Clasificar gráficas por tipo de persona. | Frontend + Backend | ✅ Nuevo gráfico "Reporte por Tipo de Persona" en `ReportsPage` usando `reports/consumption` (`by_user_type`). | Consulta agregada por tipo de persona. |
| 40 | Filtrar reportes por día, semana, mes y año. | Frontend + Backend | ☑️ Selector de rango de fechas (`Desde`/`Hasta`) que cubre día, semana, mes y año. | Parámetros de fecha/rango en endpoint de reportes. |
| 41 | Mostrar cantidades y porcentajes en las gráficas. | Frontend + Backend | ☑️ Parcial: se muestran cantidades y totales; los porcentajes salen en el tooltip de Chart.js. | Devolver totales y porcentajes calculados, o devolver totales para calcular en frontend. |

---

## 1.8 Recálculo de almuerzos

| # | Problemática / cambio solicitado | Clasificación | Frontend | Backend |
|---|---|---|---|---|
| 42 | Evitar que el recálculo ocupe demasiado espacio vertical. | Frontend | ☑️ `CreateLunchPage` usa grid de dos columnas (`xl:grid-cols-[7fr_3fr]`). | No aplica. |
| 43 | Mostrar cálculo base y recálculo lado a lado. | Frontend | ☑️ `LunchRecalculationPanel` muestra base vs. recálculo en columnas comparativas. | No aplica si el cálculo ya se hace en frontend. |
| 44 | Actualizar comparación en tiempo real. | Frontend + Backend | ☑️ `getRecalculationPreview` recalcula en vivo al cambiar platos/ingredientes. | Solo aplica si el cálculo debe validarse o persistirse desde backend. |

---

## 1.9 Seguridad y acceso

| # | Problemática / cambio solicitado | Clasificación | Frontend | Backend |
|---|---|---|---|---|
| 45 | Eliminar opción “Olvidaste tu contraseña”. | Frontend | ✅ Texto "¿Olvidaste tu contraseña?" eliminado de `LoginPage`. | No aplica si no existe flujo backend; si existe, mantenerlo protegido o eliminarlo. |
| 46 | Mantener usuarios separados por función. | Frontend + Backend | ☑️ `routeAccess` + `NavBar` filtran rutas/menú por rol; `ProtectedRoute` redirige a la ruta por defecto del rol. | Controlar permisos por rol en backend. |

---

## 1.10 Pruebas técnicas y concurrencia

| # | Problemática / cambio solicitado | Clasificación | Frontend | Backend |
|---|---|---|---|---|
| 47 | Soportar varias sesiones activas al mismo tiempo. | Backend | ☑️ El frontend usa sesión por cookie y maneja respuestas por usuario de forma independiente. | Manejar concurrencia, sesiones, transacciones y validaciones. |
| 48 | Evitar pérdida, choque o duplicación de datos al registrar simultáneamente. | Backend | ☑️ El frontend muestra mensajes claros ante conflictos (`409` duplicado, `403` sanción). | Usar restricciones, transacciones y validaciones contra duplicados. |
| 49 | Probar funcionamiento web con varias ventanas o usuarios. | Frontend + Backend | ☑️ App web (SPA) operable en varias ventanas/navegadores; auth por cookie por sesión. | Verificar que API/base de datos soporten solicitudes simultáneas. |

---

# 2. Problemáticas no realizables directamente

Estas tareas pueden tener preparación técnica desde el sistema, pero no pueden completarse únicamente desde el desarrollo porque dependen de terceros, autorizaciones o condiciones físicas.

## 2.1 Datos institucionales y CETI

| # | Problemática / dependencia externa | Clasificación | Qué puede preparar Frontend | Qué puede preparar Backend | Motivo de no realizable directamente |
|---|---|---|---|---|---|
| 50 | Obtener data oficial de CETI. | No realizable directamente | No aplica, salvo mostrar estados de sincronización cuando exista integración. | Preparar estructura de importación/integración. | Requiere autorización, credenciales o entrega formal de datos por CETI/institución. |
| 51 | Integrarse directamente con CETI. | No realizable directamente | Diseñar pantalla de estado de integración. | Crear capa de integración preparada para consumir API/archivo. | No se puede implementar sin acceso, documentación, permisos o ambiente de pruebas. |
| 52 | Validar automáticamente estudiantes nuevos, activos o inactivos desde CETI. | No realizable directamente | Mostrar estado del estudiante si backend lo tiene. | Guardar y actualizar estado cuando exista fuente oficial. | Sin CETI no hay fuente confiable para esa validación. |
| 53 | Evitar carga manual de datos usando sincronización oficial. | No realizable directamente | Pantalla de importación/sincronización. | Endpoints de importación/sync. | Depende de que CETI o la institución entreguen la data o permitan conexión. |

---

## 2.2 Data de Recursos Humanos

| # | Problemática / dependencia externa | Clasificación | Qué puede preparar Frontend | Qué puede preparar Backend | Motivo de no realizable directamente |
|---|---|---|---|---|---|
| 54 | Obtener data del personal desde Recursos Humanos. | No realizable directamente | Pantalla para importar o visualizar personal. | Modelo y endpoint para cargar personal. | Depende de que RRHH entregue la información. |
| 55 | Mantener actualizada automáticamente la data de personal. | No realizable directamente | Mostrar última fecha de actualización. | Crear proceso de sincronización si existe fuente. | Si RRHH solo entrega archivos manuales, no habrá sincronización automática real. |

---

## 2.3 Reportes reales sin data suficiente

| # | Problemática / dependencia externa | Clasificación | Qué puede preparar Frontend | Qué puede preparar Backend | Motivo de no realizable directamente |
|---|---|---|---|---|---|
| 56 | Mostrar reportes reales sin registros cargados. | No realizable directamente | Mostrar estados vacíos o datos de prueba. | Preparar endpoints de reportes. | Sin datos reales, las gráficas no tendrán información útil. |
| 57 | Mostrar estadísticas confiables por carrera, sexo o tipo de persona. | No realizable directamente | Crear gráficos y filtros. | Preparar agregaciones. | Depende de que esos datos existan completos y correctos. |

---

## 2.4 Hardware, red y entorno físico

| # | Problemática / dependencia externa | Clasificación | Qué puede preparar Frontend | Qué puede preparar Backend | Motivo de no realizable directamente |
|---|---|---|---|---|---|
| 58 | Verificar si los lectores físicos funcionan. | No realizable directamente | No aplica directamente. | No aplica directamente. | Requiere revisar físicamente los lectores y su conexión. |
| 59 | Probar lectores con el sistema real. | No realizable directamente | Pantalla preparada para recibir lectura. | Endpoint preparado para procesar el dato leído. | Requiere hardware disponible y funcional. |
| 60 | Probar con dos computadoras físicas del comedor. | No realizable directamente | App web lista para usarse en varias máquinas. | API preparada para múltiples sesiones. | Requiere equipos, red, electricidad y acceso al espacio físico. |
| 61 | Garantizar funcionamiento en computadoras viejas. | No realizable directamente | Optimizar interfaz y compatibilidad del navegador. | Mantener API liviana. | Depende del estado real del hardware y navegador disponible. |

---

## 2.5 Autorizaciones institucionales de acceso directo

| # | Problemática / dependencia externa | Clasificación | Qué puede preparar Frontend | Qué puede preparar Backend | Motivo de no realizable directamente |
|---|---|---|---|---|---|
| 62 | Definir oficialmente quién tiene acceso directo. | No realizable directamente | Formularios para asignar acceso directo. | Guardar reglas, roles y vencimientos. | La decisión debe venir del cliente o autoridad correspondiente. |
| 63 | Validar accesos por profesor, deporte o dependencia. | No realizable directamente | Campos para registrar motivo/autorización. | Modelo para guardar autorización y responsable. | Requiere confirmación de una fuente autorizada. |

---

## 2.6 Clave maestra

| # | Problemática / dependencia externa | Clasificación | Qué puede preparar Frontend | Qué puede preparar Backend | Motivo de no realizable directamente |
|---|---|---|---|---|---|
| 64 | Implementar clave maestra para taquillero y acceso directo. | No realizable directamente / Seguridad | No mostrarla como opción normal de login. | Técnicamente posible, pero debe diseñarse con auditoría, permisos y restricciones. | Requiere aprobación institucional porque representa riesgo de seguridad. |
| 65 | Definir quién puede usar la clave maestra y cuándo. | No realizable directamente | No aplica. | No aplica hasta definir política. | Es una decisión administrativa y de seguridad, no solo técnica. |

---

# 3. Resumen por área

## Frontend puro

- Agrandar foto del estudiante.
- Aumentar tamaño de letras.
- Reorganizar espacios vacíos.
- Mejorar navegación con teclado.
- Crear pop-ups temporales.
- Aplicar colores de estado.
- Crear confirmaciones visuales.
- Deshabilitar botón de desregistrar.
- Ubicar selector de sede arriba.
- Vista imprimible desde navegador.
- Vista de recálculo lado a lado.
- Eliminar enlace “Olvidaste tu contraseña”.

## Backend puro

- Bloquear registros de estudiantes suspendidos.
- Manejar concurrencia de registros simultáneos.
- Evitar duplicados o pérdida de datos.
- Validar sesión de almuerzo activa.
- Cerrar almuerzo y rechazar registros posteriores.
- Controlar permisos por rol.
- Preparar endpoints de reportes y agregaciones.

## Frontend + Backend

- Separar vistas por rol.
- Validar y mostrar suspensión.
- Consultar acceso directo por cédula.
- Mostrar foto en acceso directo.
- Cambiar “VIP/beneficiario” por “Acceso directo” en interfaz y modelo.
- Registro manual por fecha.
- Listado manual con editar, eliminar e imprimir.
- Suspensión rápida desde registro.
- Gestión de sedes en registro.
- Reportes por carrera, sexo, tipo de persona y período.
- Roles/motivos de acceso directo.
- Redirección al registro al iniciar sesión.

## No realizable directamente

- Obtener acceso a CETI.
- Integrarse oficialmente con CETI sin permisos.
- Obtener data de Recursos Humanos.
- Garantizar reportes confiables sin data real.
- Validar lectores físicos sin hardware.
- Probar en computadoras reales sin acceso al comedor.
- Definir oficialmente quién tiene acceso directo.
- Aprobar uso de clave maestra.

---

# 4. Recomendación de implementación

Para avanzar sin depender de terceros, conviene priorizar primero las tareas **Frontend + Backend realizables** que no requieren CETI:

1. Registro del comedor con sesión activa/inactiva.
2. Suspensión y bloqueo de estudiantes.
3. Acceso directo manual con foto, tipo de persona y rol/motivo.
4. Registro manual por fecha con listado editable e imprimible.
5. Selección de sede en registro.
6. Reportes usando la data interna disponible.
7. Pruebas de concurrencia desde web con varias sesiones.

La integración con CETI, Recursos Humanos, lectores físicos y clave maestra debe dejarse como bloque dependiente de aprobación externa.
