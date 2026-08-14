## Context

Lo que existe hoy y de lo que se parte:

- `LoginAuditPage` (`/auditoria`) — la referencia visual y de comportamiento: `PageHeader`, filtros de
  fecha y rol, `Table`, `Badge` por rol, paginación de 50 con el sobre `{total, items}`, y
  `parseBrowser()` para leer el `user_agent`. Lo que se necesita es lo mismo con otro eje.
- `src/api/audit.ts` — un único método, `getLogs`, contra `/auth/audit-logs`.
- `src/types/audit.ts` — `LoginAuditEntry` y su lista.
- `canAccess()` en `routeAccess.ts` devuelve **`true` para una ruta que no está en `ROUTE_ACCESS`**.
  Es la pieza que permite tener una pantalla abierta a cualquier sesión sin inventar un permiso.
- Primitivas: `Table` (con `ColumnDef`), `FilterPanel`, `SearchInput`, `Select`, `DateInput`, `Badge`,
  `Modal`. Utilidades: `downloadBlob`, `labels`, la familia `pdf*` y `apiErrors`.
- El backend de este cambio: `GET /audit-logs` (sobre `{total, items}` con el actor proyectado),
  `/audit-logs/me`, `/audit-logs/filters` y `/audit-logs/export/{csv,pdf}`.

## Goals / Non-Goals

**Goals:**

- Que la pregunta "¿qué hizo esta persona?" se conteste sin salir de la aplicación.
- Que se llegue desde donde la pregunta nace: la ficha de la persona en la Lista de Usuarios.
- Que cada quien pueda ver lo suyo sin depender de un permiso.
- Que la pantalla siga siendo legible cuando el historial tenga miles de entradas.

**Non-Goals:**

- Tiempo real, deshacer, o fusionar la auditoría de accesos con esta.

## Decisions

### 1. Pantalla nueva, no una pestaña de `/auditoria`

*Auditoría de Acceso* contesta **quién entró**; esta contesta **qué hizo**. Sus columnas no coinciden
(IP y navegador contra acción, recurso y cambios), sus filtros tampoco, y su unidad de lectura es
distinta: allí una fila es un ingreso; aquí una fila es un proceso, y a veces hay que abrirla.

Una pestaña dentro de la misma pantalla obligaría a que las dos compartan filtros y tabla, y la
solución habitual a eso —columnas que aparecen y desaparecen según la pestaña— es exactamente lo que
hace ilegible una tabla. Dos rutas, dos permisos, dos entradas en el navbar.

### 2. El eje es la persona, pero no es obligatorio

La pantalla se llama *Historial de Procesos por Persona* y el selector de persona es lo primero que
se ve. Pero sin persona seleccionada muestra **todo el movimiento**, no una pantalla vacía: quien
audita a menudo no sabe todavía a quién buscar, y llega con "algo pasó el martes".

La persona seleccionada viaja en la URL (`?usuario=7`), de modo que el enlace es compartible y la
vuelta atrás del navegador funciona. El resto de filtros vive en el estado del componente, como en el
resto de pantallas del proyecto.

### 3. La fila resume, el detalle explica

La tabla lleva: **fecha y hora**, **persona** (nombre + rol, con `Badge`), **acción** (`Badge` con
color por familia), **recurso** (tipo + identificador) y un **resumen** de una línea. Cinco columnas
caben sin desbordar; el resto —el antes/después, la ruta y el método, la IP y el dispositivo— vive en
el detalle que se abre desde la fila.

El detalle se abre en un **panel expandible dentro de la tabla**, no en un modal. Auditar es comparar
entradas seguidas, y un modal obliga a cerrar y volver a abrir para hacerlo. El modal se reserva para
lo que interrumpe una tarea; leer el historial *es* la tarea.

La expansión se añadió a la **primitiva `Table`** como prop opcional `renderExpanded`, siguiendo el
mismo precedente que la columna de selección: se renderiza solo cuando llega, así que las ocho
pantallas que ya la consumen se comportan exactamente igual. Una tabla propia para esta pantalla
habría duplicado el orden, la cabecera, el estado vacío y el spinner, y con ellos la garantía de que
un día divergieran.

La prosa del `details` **no** se repite en el detalle: la columna Resumen ya la muestra entera, y
verla dos veces al abrir la fila hace pensar que son dos cosas distintas. Lo que el detalle añade es
el antes/después y el contexto técnico.

El antes/después se pinta como dos columnas por campo, con el valor viejo en tono apagado y el nuevo
destacado. Los valores redactados por el servidor se muestran tal cual llegan —el hueco marcado es
información— y **no** se enmascaran otra vez ni se ocultan.

### 4. Los desplegables se llenan del servidor

`GET /audit-logs/filters` da las acciones y los recursos que realmente existen. Escribirlos a mano en
el cliente los dejaría viejos en cuanto el backend registre un recurso nuevo, y ofrecer una opción sin
resultados es peor que no ofrecerla. Los rótulos legibles sí viven en el cliente
(`src/utils/auditLabels.ts`): la acción `ELIMINAR` es un código estable del servidor y "Eliminación"
es texto de interfaz.

Una acción o un recurso que llegue **sin rótulo conocido** se muestra con su código en crudo, no se
esconde: un historial que oculta lo que no sabe nombrar deja de ser un historial.

### 5. `/mi-actividad` fuera del catálogo de rutas

`canAccess()` devuelve `true` para lo que no está en `ROUTE_ACCESS`, así que basta con no catalogarla.
Es deliberado: catalogarla la haría revocable desde *Gestión de Permisos*, y quitarle a alguien la
posibilidad de ver lo que él mismo hizo no es una decisión que este sistema deba poner sobre la mesa.
El servidor sostiene la misma regla: `GET /audit-logs/me` solo exige sesión activa y siempre devuelve
lo del que pregunta.

Queda escrito en `routeAccess.ts` como comentario, junto a las excepciones que ya viven ahí, para que
la siguiente revisión de paridad con el backend no la "arregle" añadiéndola.

### 6. Exportar lo filtrado, no lo paginado

Los dos botones de exportación llaman a los endpoints del servidor con **los filtros activos y sin la
ventana de paginación**, y bajan el archivo con `downloadBlob`. Generar el PDF en el cliente con
`jsPDF` a partir de las 50 filas visibles sería exportar la página, no el historial —y el usuario que
pulsa "Exportar" mientras mira la página 3 no está pidiendo la página 3.

No se escribió ningún `pdfAuditTrail.ts` en el cliente: la exportación de verdad es la del servidor y
un segundo generador solo habría servido para exportar la página en vez del historial.

### 7. Paginación de 50, como en la auditoría de accesos

Mismo `PAGE_SIZE` y mismo patrón de "reiniciar a la página 0 cuando cambia un filtro" que
`LoginAuditPage`. No hay razón para que dos pantallas hermanas se paginen distinto, y el `total` del
sobre ya da lo que hace falta para los controles.

## Risks / Trade-offs

- **Un historial vacío al principio.** El día del despliegue no hay nada registrado. El estado vacío
  SHALL decir eso —"no hay procesos registrados en este periodo"— y no parecer un error.
- **Entradas genéricas los primeros días.** Mientras el backend va enriqueciendo recurso por recurso,
  muchas filas dirán poco más que el método y la ruta. La columna de resumen se construye para
  degradar bien: con `details` lo muestra; sin él, arma el texto con la acción y el recurso.
- **Personas borradas.** Las entradas de una cuenta eliminada llegan con la instantánea del actor y
  sin `user_id`. La tabla las muestra con el nombre guardado y una marca de "cuenta eliminada"; no se
  ofrece el enlace a su ficha, que no existe.
- **Tabla ancha en pantallas pequeñas.** Cinco columnas más el expandible obligan a decidir qué se
  esconde primero. El proyecto ya tiene el criterio en `comedor-vistas-compactas` y en la primitiva
  `Table`; se sigue ese, no uno nuevo.

## Migration Plan

1. Tipos y `src/api/audit.ts` (la parte del historial se añade junto a la de accesos existente).
2. `auditLabels.ts` y los componentes de `src/components/audit/`.
3. `ProcessHistoryPage` y `MyActivityPage`; rutas en `App.tsx`.
4. `ROUTE_ACCESS` + navbar + la acción *Ver historial* en `ListUser`.
5. Pruebas y actualización de `CLAUDE.md`.

Se despliega junto a `be-historial-procesos-usuario`.

## Resolved Questions

- **La entrada del navbar se llama *Historial de Procesos***, que es el nombre con el que se pidió el
  cambio.
- ***Mi Actividad* va en el pie del navbar, junto a *Cerrar Sesión***, y no en un grupo. No es solo
  que "lo mío" encaje ahí: la ruta no está catalogada, así que `canOpen` la daría por visible a
  cualquiera y el grupo Administración aparecería para un taquillero con esa única entrada dentro.
