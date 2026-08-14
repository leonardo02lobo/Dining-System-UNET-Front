## Why

La única ventana de trazabilidad del sistema es *Auditoría de Acceso* (`/auditoria`), y solo enseña
**entradas**: quién inició sesión, desde qué IP y con qué navegador. Lo que esa persona hizo después
—borrar una cuenta, levantar una suspensión, editar un consumo manual, exportar el padrón, cambiarle
los permisos a otro— no aparece en ninguna pantalla.

Cuando hay que averiguar qué pasó, no existe camino por la interfaz. Hay que pedirle a alguien que
mire la base de datos, y ni siquiera ahí está todo, porque el servidor casi no lo registra.

También falta la mitad amable del asunto: una persona no puede ver lo que ella misma hizo. Ante un
"tú registraste esto", la respuesta hoy es la memoria de cada quien.

Y el punto de partida natural de la pregunta —la Lista de Usuarios, donde está la persona por la que
se pregunta— no lleva a ninguna parte: se ve el nombre, el rol y el estado, y ahí termina.

## What Changes

- **Pantalla nueva `/auditoria/procesos` — "Historial de Procesos"**, centrada en la persona: se
  elige a alguien y se ve, en orden cronológico inverso, qué hizo, sobre qué, cuándo y desde dónde.
- **Cada entrada se puede abrir** y muestra el detalle: el antes y el después de los campos que
  cambiaron, el detalle en prosa cuando lo hay, la ruta y el método, la IP y el dispositivo.
- **Filtros combinables**: persona, acción, tipo de recurso, rango de fechas y búsqueda de texto. Los
  desplegables de acción y recurso se llenan del catálogo que da el servidor, no de una lista escrita
  a mano que se queda vieja al primer recurso nuevo.
- **Desde la Lista de Usuarios se llega en un clic**: cada fila gana la acción *Ver historial*, que
  abre la pantalla con esa persona ya seleccionada (`/auditoria/procesos?usuario=<id>`).
- **Pantalla `/mi-actividad` para cualquier usuario**, con su propio historial y sin exigir permiso:
  el servidor ya acota `GET /audit-logs/me` a quien pregunta. **No** entra en `ROUTE_ACCESS`, porque
  una ruta catalogada es una ruta que un administrador puede revocar, y revocarle a alguien el ver lo
  que él mismo hizo no es una decisión que este sistema deba ofrecer.
- **Exportación a CSV y PDF** del historial mostrado, respetando los filtros activos y no solo la
  página visible.
- **`ROUTE_ACCESS` gana `/auditoria/procesos`** (`SUPER_ADMIN`, `ADMIN`), gemela de la entrada del
  backend, y el navbar gana las dos entradas nuevas.
- **`/auditoria` se queda como está.** Sigue siendo la auditoría de accesos, sobre `login_audits`.
  Son dos preguntas distintas —quién entró y qué hizo— y mezclarlas en una tabla haría ilegibles las
  dos.

## Capabilities

### New Capabilities

- `historial-procesos-front`: la pantalla de historial por persona, su detalle, sus filtros, su
  exportación y la vista propia de cada usuario.

### Modified Capabilities

- `permisos-sincronizar-catalogo`: el catálogo del frontend gana `/auditoria/procesos`, y se escribe
  la excepción de `/mi-actividad` — una ruta abierta a cualquier sesión, deliberadamente fuera del
  catálogo.

## Impact

- **Archivos nuevos:** `src/pages/ProcessHistoryPage.tsx`, `src/pages/MyActivityPage.tsx`,
  `src/components/audit/ProcessHistoryTable.tsx`,
  `src/components/audit/ProcessHistoryFilters.tsx`,
  `src/components/audit/AuditEntryDetail.tsx`, `src/utils/auditLabels.ts`, y sus pruebas.
- **Archivos modificados:** `src/api/audit.ts` (la parte nueva del historial, junto a la de accesos
  que ya existe), `src/types/audit.ts`, `src/config/routeAccess.ts`,
  `src/components/ui/NavBar.tsx`, `src/pages/ListUser.tsx`, `src/App.tsx`,
  `src/components/ui/Table.tsx` (prop `renderExpanded`, aditiva) y
  `src/pages/LoginAuditPage.tsx` (pasa a usar el `parseBrowser` compartido).
- **Dependencia dura del backend:** consume `be-historial-procesos-usuario`
  (`GET /audit-logs`, `/audit-logs/me`, `/audit-logs/filters`, `/audit-logs/export/*`). Los dos SHALL
  desplegarse juntos: sin el servidor la pantalla no tiene nada que leer.
- **`CLAUDE.md`:** §1 (26 pantallas → 28), §3 (archivos nuevos) y §5 (tabla de rutas) dejan de ser
  exactos.

## Non-goals

- **Fusionar `/auditoria` y `/auditoria/procesos`.** Responden preguntas distintas y comparten poco
  más que la palabra "auditoría".
- **Un historial por *persona atendida*** (qué le pasó a un estudiante). Aquí la persona es la que
  usa el sistema, no la que come. El otro historial es útil y es otro cambio.
- **Deshacer nada desde la pantalla.** El detalle enseña el antes y el después para leerlo; revertir
  desde ahí es otro proyecto, con reglas de dominio propias de cada recurso.
- **Tiempo real.** Se consulta cuando se abre la pantalla y cuando se pulsa recargar. Un historial que
  se refresca solo compite con la lectura de quien lo está mirando.
- **Escribir eventos de navegación desde el navegador.** Lo que no pasa por el servidor no se registra;
  fabricarlo desde el cliente sería un rastro que el propio auditado escribe.
