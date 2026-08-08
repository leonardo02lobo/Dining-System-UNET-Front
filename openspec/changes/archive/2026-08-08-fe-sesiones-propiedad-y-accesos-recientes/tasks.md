## 1. Capa de API y tipos

- [x] 1.1 `AccesoDirectoRecentEntry` en `src/types/acceso_directo.ts`, con las formas de
      `design.md` §1 (`sede_id`/`sede_name`/`user_type`/`career`/`access_reason` nullables)
- [x] 1.2 `accesoDirectoApi.recentEntries(limit = 10, onlyPriority = false)` en
      `src/api/acceso_directo.ts`
- [x] 1.3 `opened_by_name` y `closed_by_name` en `LunchSession` (`src/types/lunchSession.ts`)
- [x] 1.4 `lunchSessionApi.openableSedes()` y `lunchSessionApi.forceClose(id, reason)` en
      `src/api/lunchSession.ts`

## 2. Panel de ingresos recientes en `/accesos_directos`

- [x] 2.1 Tarjeta "Últimos ingresos" entre el `PageHeader` y los filtros, con `Card` + `Table`
      compacto — sin componentes nuevos en `components/ui/`
- [x] 2.2 Columnas: Persona (nombre + cédula), Tipo, Motivo, Sede, Origen (Taquilla/Manual), Hora
- [x] 2.3 Cabecera con `{items.length} de {total}`, conmutador "Solo prioritarios" y botón de
      refrescar
- [x] 2.4 Efecto de carga **propio**, desacoplado del `refetch` del padrón: los filtros de la tabla
      no tocan el panel
- [x] 2.5 Recarga del panel tras alta, edición y borrado
- [x] 2.6 Guiones en Sede y Motivo cuando llegan nulos; estado vacío
      "Todavía no hay ingresos registrados."
- [x] 2.7 Error ⇒ `notify.error` y panel vacío; la tabla del padrón sigue operativa
- [x] 2.8 Reutilizar `USER_TYPE_LABEL` de `utils/labels.ts` y el mapa de variantes que la página ya
      tiene — no duplicar etiquetas

## 3. `LunchSessionPage` por rol

- [x] 3.1 Sustituir `canManage` por `isAdmin` / `canOpen` / `isOwner` / `canClose` / `canForce`
      según `design.md` §3
- [x] 3.2 `canOpen` incluye `TAQUILLERO`; retirar el texto "Solo los administradores pueden abrir o
      cerrar sesiones" para ese rol
- [x] 3.3 **No** filtrar en cliente el listado de `openList()`: llega ya acotado por el servidor
- [x] 3.4 `fetchHistory()` solo si `isAdmin`; para el taquillero, nota
      "Solo se muestran las sesiones que abriste." en lugar del calendario
- [x] 3.5 Estado vacío del taquillero redactado para no insinuar sesiones ajenas
- [x] 3.6 Subtítulo: fuera el "Cooldown de 12h"; enunciar una sesión abierta por sede + cierra quien
      abre

## 4. Selector de sedes disponibles

- [x] 4.1 `SedeSelector` gana `source?: 'all' | 'openable'`, por defecto `'all'` para no alterar sus
      usos actuales en las pantallas de taquilla
- [x] 4.2 Con `'openable'` carga `lunchSessionApi.openableSedes()`; su estado vacío dice
      "No hay sedes disponibles: todas tienen una sesión abierta."
- [x] 4.3 El modal de apertura usa `source="openable"` y **deja de pasar `excludeIds`**
- [x] 4.4 409 al abrir ⇒ mensaje dentro del modal (`CONFLICT.sessionAlreadyOpen`) **y** recarga del
      catálogo de sedes disponibles

## 5. Cierre y cierre forzado

- [x] 5.1 Botón "Cerrar" habilitado según `canClose`; deshabilitado con `title` y texto visible
      "Solo {opened_by_name} puede cerrar esta sesión"
- [x] 5.2 403 al cerrar ⇒ `notify.error` con el mensaje del servidor + recarga del listado
- [x] 5.3 Acción "Cierre forzado" visible solo si `canForce`
- [x] 5.4 `Modal` de cierre forzado: quién abrió + sede + hora, `textarea` de motivo con contador,
      mínimo 10 caracteres validado en cliente, aviso de auditoría
- [x] 5.5 Confirmar ⇒ `forceClose(id, reason)` + recarga de listado y calendario
- [x] 5.6 Cero diálogos nativos (`confirm`/`alert`/`prompt`)

## 6. Validación

- [x] 6.1 `openspec validate fe-sesiones-propiedad-y-accesos-recientes --strict`
- [x] 6.2 `npm run build` en verde (`tsc` con `noUnusedLocals` rompe ante un import huérfano al
      retirar `excludeIds` y `canManage`)
- [x] 6.3 `npm test`: 155/156 y `nativeDialogs.guard.test.ts` en verde. Quedan **dos fallos
      preexistentes**, ajenos a este cambio y verificados idénticos antes de tocarlo:
      `rosterRealFiles.verify.test.ts` (ENOENT de `Activos.csv`, debería saltarse y no lo hace) y
      `lunch.test.ts::creates a template only when saveAsTemplate is true` (afirma que el cliente
      crea la plantilla, cuando la crea el backend al confirmar). Ninguno toca los archivos de este
      cambio; corregirlos es trabajo aparte
- [x] 6.4 Pruebas nuevas:
      - el panel de ingresos no cambia al escribir en el buscador del padrón
      - el conmutador "Solo prioritarios" vuelve a consultar
      - un fallo del panel no impide usar la tabla del padrón
      - con rol `TAQUILLERO` no se llama a `lunchSessionApi.list`
      - "Cerrar" deshabilitado y explicado en una sesión ajena; habilitado en la propia
      - "Cierre forzado" ausente para ADMIN y TAQUILLERO, presente para SUPER_ADMIN en sesión ajena
      - el motivo de menos de 10 caracteres no llega a emitir petición
- [ ] 6.5 Verificación manual con los tres roles contra el backend de
      `be-sesiones-propiedad-y-accesos-recientes` ya aplicado: abrir con taquillero, comprobar que no
      ve la sesión del otro, intentar cerrar la ajena, y forzar el cierre como SUPER_ADMIN
      comprobando la fila en `/auditoria`
