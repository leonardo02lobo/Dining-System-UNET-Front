## 1. Tipos y API

- [x] 1.1 En `src/types/audit.ts`, añadir `AuditEntry` (id, actor con nombre/correo/rol y su
      `user_id` nulable, acción, recurso, `resource_id`, método, ruta, `status_code`, IP, agente,
      `details`, `changes`, fecha) y `AuditListResponse` con el sobre `{total, items}`
- [x] 1.2 En `src/api/audit.ts`, junto a `getLogs` de accesos: `getProcessLogs`, `getMyProcessLogs`,
      `getFilterCatalog`, `exportProcessLogs(format)`
- [x] 1.3 Tipar `changes` como `Record<string, { antes: unknown; después: unknown }>` y decidir el
      formateo de valores nulos, booleanos y fechas en un solo sitio
- [x] 1.4 Exportaciones vía `downloadBlob`, como el resto de descargas del proyecto. **No** se
      escribió `pdfAuditTrail.ts`: la exportación de verdad es la del servidor y un segundo
      generador solo serviría para exportar la página en vez del historial

## 2. Rótulos

- [x] 2.1 `src/utils/auditLabels.ts`: mapa de acciones y de recursos a texto en español, más el color
      de `Badge` por familia (creación / modificación / eliminación / acceso / exportación)
- [x] 2.2 Un código sin rótulo conocido devuelve el código en crudo, nunca cadena vacía ni «—»
- [x] 2.3 `auditLabels.test.ts`: código conocido, código desconocido, mayúsculas y prefijo `CLIENTE_`

## 3. Componentes

- [x] 3.1 `src/components/audit/ProcessHistoryTable.tsx` sobre la primitiva `Table`: fecha y hora,
      persona (nombre + `Badge` de rol), acción, recurso con identificador, resumen
- [x] 3.2 Fila expandible con el detalle **dentro** de la tabla, no en `Modal`. La expansión se
      añadió a la primitiva como prop opcional `renderExpanded`, con el mismo precedente que la
      columna de selección: una tabla propia habría duplicado orden, cabecera, vacío y spinner
- [x] 3.3 `src/components/audit/AuditEntryDetail.tsx`: antes/después por campo (valor viejo apagado,
      nuevo destacado), detalle en prosa, método y ruta, IP y dispositivo con el mismo
      `parseBrowser()` que usa la auditoría de accesos —extraerlo a un módulo compartido en vez de
      duplicarlo
- [x] 3.4 Los campos redactados se muestran marcados como tales; no se ocultan ni se re-enmascaran
- [x] 3.5 Actor de cuenta eliminada: nombre guardado + marca de «cuenta eliminada», sin enlace a ficha
- [x] 3.6 `src/components/audit/ProcessHistoryFilters.tsx` sobre `FilterPanel`: persona, acción,
      recurso, rango de fechas y `SearchInput`; opciones de acción y recurso desde el catálogo del
      servidor

## 4. Pantallas

- [x] 4.1 `src/pages/ProcessHistoryPage.tsx`: `PageHeader`, filtros, tabla, paginación de 50 y los dos
      botones de exportación
- [x] 4.2 La persona seleccionada se lee y se escribe en la URL (`?usuario=<id>`); el resto de filtros
      vive en el estado del componente
- [x] 4.3 Reiniciar a la primera página al cambiar cualquier filtro, como en `LoginAuditPage`
- [x] 4.4 Estados separados con su mensaje: cargando / sin resultados para estos filtros (con acción de
      limpiarlos) / error. El vacío no debe parecer una avería
- [x] 4.5 `src/pages/MyActivityPage.tsx` reutilizando tabla y detalle, leyendo el endpoint propio y
      **sin** selector de persona
- [x] 4.6 Exportación: indicador de progreso, sin disparos repetidos, error por el aviso habitual

## 5. Rutas, navegación y entrada desde usuarios

- [x] 5.1 `/auditoria/procesos` en `ROUTE_ACCESS` con `SUPER_ADMIN` y `ADMIN`, gemela del backend
- [x] 5.2 `/mi-actividad` **fuera** de `ROUTE_ACCESS`, con el comentario que explica por qué, junto a
      las excepciones que ya viven en ese archivo
- [x] 5.3 Rutas en `App.tsx` dentro de `ProtectedRoute`
- [x] 5.4 Navbar: *Historial de Procesos* en el grupo Administración, junto a *Auditoría de Acceso*;
      decidir dónde va *Mi Actividad* (ver la pregunta abierta del diseño)
- [x] 5.5 Acción *Ver historial* en cada fila de `ListUser`, visible solo con permiso sobre
      `/auditoria/procesos`, navegando con la persona ya seleccionada

## 6. Pruebas

- [x] 6.1 Con persona seleccionada se pide su historial; sin ella, el general
- [x] 6.2 `?usuario=7` arranca con esa persona seleccionada
- [x] 6.3 El detalle se abre en la fila y la lista sigue visible
- [x] 6.4 Una entrada sin `details` ni `changes` muestra un resumen legible
- [x] 6.5 Un campo redactado se muestra marcado y sin valor
- [x] 6.6 Los desplegables se llenan del catálogo del servidor; un código desconocido sale en crudo
- [x] 6.7 Cambiar un filtro vuelve a la primera página
- [x] 6.8 La exportación envía los filtros activos y no el `skip`/`limit` de la página
- [x] 6.9 `/mi-actividad` se abre con rol `TAQUILLERO` sin permisos concedidos
- [x] 6.10 La acción *Ver historial* no aparece sin el permiso
- [x] 6.11 Estados vacío, de carga y de error, cada uno con su mensaje

## 7. Documentación

- [x] 7.1 `CLAUDE.md` §1: dos pantallas nuevas en el recuento y en la lista de lo que cubre la app
- [x] 7.2 `CLAUDE.md` §3: archivos nuevos (`components/audit/`, `utils/auditLabels.ts`, las páginas)
- [x] 7.3 `CLAUDE.md` §5: las dos rutas nuevas y quién las abre
- [ ] 7.4 `../docs/MANUAL_DE_USO.md`: cómo consultar el historial de una persona y cómo ver el propio

## 8. El panel dentro de Auditoría de Acceso

- [x] 8.1 `login_audit_id` en `AuditEntry` y en `ProcessHistoryFilters`; `process_count` y
      `user_id` nulable en `LoginAuditEntry`
- [x] 8.2 `src/components/audit/SessionProcesses.tsx`: cabecera con IP, dispositivo y agente
      completo, y la tabla de procesos de esa sesión
- [x] 8.3 Se pide **al desplegar**, no al cargar la lista: cincuenta sesiones por página serían
      cincuenta consultas para ver casi siempre una
- [x] 8.4 Se pide por `login_audit_id`, nunca por rango de fechas alrededor del ingreso
- [x] 8.5 `LoginAuditPage` usa `renderExpanded`; columna con el recuento de procesos
- [x] 8.6 Desplegar exige `/auditoria/procesos`: sin él no se ofrece el control y una nota dice
      qué permiso falta, en vez de un camino que termina en 403
- [x] 8.7 Sesión sin procesos: se explican las dos razones (no se hizo nada / sesión anterior al
      enlace) y se enlaza el historial completo de la persona
- [x] 8.8 Un ingreso de cuenta eliminada sigue en la lista, con su marca y sin enlace a ficha
- [x] 8.9 Pruebas de las seis conductas anteriores en `LoginAuditPage.test.tsx`
