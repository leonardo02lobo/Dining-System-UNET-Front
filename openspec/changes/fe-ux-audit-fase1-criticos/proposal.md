## Why

La auditoría UX/UI del 20-07-2026 (`AUDITORIA_UX_UI.md`, 40 hallazgos: 5 críticos, 14 altos, 15
medios, 6 bajos) identificó que el frontend tiene una base técnica sólida pero carece de
terminación en los flujos que el usuario realmente toca: pantallas sin salida, pérdida de trabajo
sin aviso, un modal inaccesible que afecta a toda la aplicación, y barreras de accesibilidad
bloqueantes (WCAG 2.1 nivel A/AA) en las pantallas de mayor uso. Este cambio implementa los 5
hallazgos críticos y los "quick wins" que el propio informe identifica como la intervención de
mayor retorno (~120 líneas, resuelve 2 críticos + 6 altos + 3 medios).

Dos hallazgos (UX-004 y UX-015) revierten comportamiento pedido explícitamente por el cliente en
cambios previos ya archivados (`registro-atajo-arrowdown`, `registro-alarma-duplicado-duracion`).
Se resolvieron en un punto intermedio, decidido con el usuario: se conserva la funcionalidad
pedida pero se corrige el problema de accesibilidad/control que señalaba el audit (ver
Requirements de esas capacidades más abajo).

## What Changes

- **Modal accesible** (`Modal.tsx`): focus trap, foco inicial, retorno de foco al cerrar,
  `aria-labelledby`, bloqueo de scroll del body. Corrige la barrera de accesibilidad más extendida
  del sistema (afecta a todos los modales de confirmación y edición).
- **`Toggle` con nombre accesible obligatorio** (`label` prop) — hace utilizable con lector de
  pantalla la pantalla de Gestión de Permisos.
- **`Table`**: `stopPropagation` en la celda de acciones (ya no dispara `onRowClick` al pulsar un
  botón de fila) y filas clicables alcanzables por teclado (`tabIndex`, `Enter`/`Espacio`).
- **Registro al Comedor** (`RegisterDining.tsx`):
  - Botón "Cancelar / Consultar otra persona" en la ficha del estudiante (ya no hay callejón sin
    salida tras un escaneo erróneo) + franja compacta con la sede/sesión visible mientras hay una
    persona consultada.
  - El escáner de código de barras se deshabilita mientras cualquier modal esté abierto
    (duplicado, suspensión, últimos registros), y la persona objetivo de una suspensión rápida
    queda congelada al abrir el modal — un escaneo detrás del modal ya no puede hacer que se
    suspenda a la persona equivocada.
  - El atajo `ArrowDown` para registrar consumo se conserva (pedido explícito del cliente), pero
    deja de escuchar en `window`: solo actúa cuando el foco está dentro de la ficha del estudiante
    (que recibe el foco automáticamente al consultar), y ya no intercepta cuando el foco está en un
    `INPUT` (antes solo excluía `SELECT`/`TEXTAREA`). Ya no interfiere con el scroll de página ni
    con la navegación de un lector de pantalla en el resto de la aplicación.
  - El aviso de consumo duplicado sigue sonando ~10 s como antes, pero el modal ya **no** se cierra
    solo al terminar el sonido: permanece abierto hasta que el usuario pulse "Entendido".
  - Se elimina el `setError` duplicado junto al toast en el registro fallido (un solo canal de
    feedback por evento).
- **Gestión de Permisos** (`PermissionsPage.tsx`): estado sucio (`isDirty`) contra un snapshot de
  los permisos cargados; cambiar de usuario con cambios pendientes abre una confirmación
  (Guardar y continuar / Descartar / Cancelar) en vez de descartar en silencio; aviso
  `beforeunload` si se intenta cerrar/recargar la pestaña con cambios sin guardar; el botón
  "Guardar" se deshabilita sin cambios y muestra cuántos hay; las filas modificadas se marcan
  visualmente.
- **Login** (`LoginPage.tsx`): el backend solo autentica por correo (`crud_user.authenticate` usa
  `get_by_email`, no acepta cédula) — se corrigen los mensajes de validación y de error 401 para
  decir "correo" en vez de "usuario o cédula", consistentes con `type="email"`.
- **Filtros de rol completos**: `ListUser.tsx` y `LoginAuditPage.tsx` derivan las opciones de rol
  desde el mapa de etiquetas único (antes omitían `ACCESO_DIRECTO`), y sus `Select` de filtro
  reciben `label` visible.
- **Cabecera institucional** (`Header.tsx`): corrige "ACADEMICO" → "ACADÉMICO"; el reloj se
  actualiza cada 30 s (antes se congelaba al montar); logos institucionales reducidos en la barra
  del shell autenticado (se mantienen grandes en `/login`); saludo reescrito como una sola cadena
  sin emoji ni "Bienvenid@".
- **Contraste de texto**: reemplazo de `text-slate-400` → `text-slate-500` (texto informativo) o
  `text-slate-600` (mensajes de estado vacío) en ~24 nodos de texto detectados por la auditoría,
  preservando `text-slate-400` en iconos decorativos y `placeholder:` (excepciones que el propio
  informe acepta).
- **Contraseña visible por teclado** (`Input.tsx`): se quita `tabIndex={-1}` del botón de
  mostrar/ocultar contraseña.
- **Subtítulos corregidos**: gramática de "Registro al Comedor" y "Gestión de permisos".

## Capabilities

### New Capabilities
- `modal-accesible`: el componente `Modal` implementa el patrón WAI-ARIA de diálogo (focus trap,
  foco inicial/retorno, `aria-labelledby`, bloqueo de scroll).
- `tabla-primitiva-accesible`: la primitiva `Table` aísla las acciones de fila del clic de fila y
  permite activar filas clicables por teclado.
- `toggle-nombre-accesible`: `Toggle` exige un `label` que se expone como `aria-label`.
- `registro-comedor-escaner-modal-seguro`: el escáner de código de barras se desactiva con
  cualquier modal abierto en Registro al Comedor, y la persona objetivo de una suspensión rápida
  queda congelada al abrir el modal.
- `login-credenciales-correo`: los mensajes de validación y error del login son consistentes con
  que el backend solo autentica por correo electrónico.
- `filtros-selects-completos`: los filtros de rol de Directorio de Usuarios y Auditoría de Acceso
  incluyen los 4 roles reales y tienen etiqueta visible/accesible.
- `cabecera-institucional-corregida`: la cabecera muestra el nombre de la institución sin errores
  ortográficos, un reloj que refleja la hora real, y logos de tamaño reducido fuera de `/login`.
- `contraste-texto-legible`: el texto informativo de la aplicación cumple contraste AA (4,5:1).
- `input-password-accesible-teclado`: el botón de mostrar/ocultar contraseña es alcanzable con
  `Tab`.

### Modified Capabilities
- `registro-comedor-ocultar-campos-consulta`: se añade una acción de cancelar que restaura los
  campos sin registrar consumo, y una franja compacta con sede/sesión visible mientras hay una
  persona consultada.
- `registro-atajo-arrowdown`: el atajo deja de escuchar en `window` y se acota al contenedor de la
  ficha del estudiante (que recibe el foco al consultar); excluye también `INPUT` además de
  `SELECT`/`TEXTAREA`.
- `registro-alarma-duplicado-duracion`: el cierre del aviso deja de estar acoplado a la duración
  del sonido; el aviso permanece abierto hasta que el usuario lo cierra explícitamente.
- `consumo-duplicado-aviso`: se retira el escenario "el aviso se cierra solo al terminar el
  sonido" (ahora el cierre es siempre manual, ver `registro-alarma-duplicado-duracion`).
- `permisos-sincronizar-catalogo`: la gestión de permisos protege los cambios sin guardar (estado
  sucio, confirmación al cambiar de usuario, aviso de salida, botón de guardar condicionado).

## Impact

- **Archivos principales:** `src/components/ui/Modal.tsx`, `Toggle.tsx`, `Table.tsx`, `Input.tsx`,
  `src/pages/RegisterDining.tsx`, `PermissionsPage.tsx`, `LoginPage.tsx`, `ListUser.tsx`,
  `LoginAuditPage.tsx`, `src/components/layout/Header.tsx`, y ~20 archivos adicionales solo para el
  reemplazo de contraste de texto.
- **Sin cambios de API ni de contrato con el backend.** Todo el trabajo es de frontend.
- **Build:** `npx tsc --noEmit` y `npm run build` verdes. Suite de tests: 49/51 pasan; los 2 fallos
  (`src/api/lunch.test.ts`, `src/utils/csvImport.test.ts`) son preexistentes y no están relacionados
  con este cambio (no se tocó ningún archivo de esos módulos).
- **Fuera de alcance de este cambio** (documentado como backlog en el resto de fases del audit, no
  implementado aquí): dashboard de inicio (UX-001), componente `Alert` unificado (UX-009 completo),
  migas de pan navegables (UX-018), paginación de servidor en tablas de listado (UX-012 — el
  backend ya soporta paginación real en `sanctions/suspended`, `external-people` y
  `accesos_directos`; falta en `GET /users/` — ver `be-users-list-pagination`), reorganización de
  la barra lateral (UX-013), bloqueo de navegación de router con `useBlocker` (requiere migrar de
  `<BrowserRouter>` a un router de datos — cambio arquitectónico mayor, no incluido aquí).
