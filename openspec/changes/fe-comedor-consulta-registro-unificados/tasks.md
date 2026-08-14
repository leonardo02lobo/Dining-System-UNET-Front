## 1. Antes de tocar código

- [ ] 1.1 Comprobar en `/admin/permisos` si hay usuarios con `/comedor/consultar` concedida y
      `/comedor/registrar` denegada (pregunta abierta 2 del `design.md`)
- [ ] 1.2 Confirmar con Leonardo la entrada única de menú "Comedor: Consulta y Registro"
      (pregunta abierta 1)
- [x] 1.3 Verificar que `fe-layout-sin-scroll` ya está aplicado; si lo está, la maquetación de este
      cambio se monta sobre `ScreenLayout` y no sobre el `flex h-full` actual
      → **No está aplicado**: `src/components/layout/` solo tiene `Header` y `Footer`. La
      maquetación se monta sobre el `flex h-full` actual, y `fe-layout-sin-scroll` tendrá que
      absorber esta pantalla cuando llegue.

## 2. Permisos: una pantalla, dos capacidades

- [x] 2.1 En `src/config/routeAccess.ts`, añadir `ROUTE_ALIASES` y `canOpen()`, dejando `canAccess`
      **estricta** (documentar en el propio archivo por qué no se mezclan)
- [x] 2.2 `src/components/ProtectedRoute.tsx`: usar `canOpen` en lugar de `canAccess`
- [x] 2.3 `src/components/ui/NavBar.tsx`: filtrar con `canOpen`; fundir las dos entradas de comedor
      en una sola, "Comedor: Consulta y Registro", apuntando a `/comedor/registrar`
- [x] 2.4 Prueba: un usuario con solo `/comedor/consultar` abre `/comedor/registrar` y **no** entra
      en bucle de redirección contra `DEFAULT_ROUTE`

## 3. La ruta

- [x] 3.1 `src/App.tsx`: `comedor/consultar` pasa a `<Navigate to="/comedor/registrar" replace />`;
      el redirect histórico `checkConsumes` se reapunta a `/comedor/registrar`
- [x] 3.2 Eliminar el import y el archivo `src/pages/CheckConsumes.tsx`
- [x] 3.3 Dejar `/comedor/consultar` en `ROUTE_ACCESS` con su lista de roles: sigue siendo un permiso
      real, con un comentario que diga que ya no nombra una pantalla propia

## 4. Búsqueda unificada

- [x] 4.1 Quitar `disabled={registrationBlocked}` del campo de cédula y del botón de buscar: buscar
      no depende de sede ni de sesión
- [x] 4.2 Retirar la llamada `consumptionApi.check(acceso_directo_id)` de `triggerSearch`: la sanción
      activa la trae `checkByDocument` (vacío C1)
- [x] 4.3 Guardar el resultado completo de `checkByDocument` (no solo `consumption`), para poder
      distinguir "no ha comido" de "no se pudo comprobar"
- [x] 4.4 Conservar `sanctionApi.history` como tercera llamada best-effort, solo con
      `acceso_directo_id`

## 5. La ficha: traer la vista de la consulta

- [x] 5.1 Sustituir la rejilla de `InlineField` y `PersonPhoto` por `StudentResultCard`
      (`bare`, dentro de la tarjeta), con `suspensionCount` y `showAccesoDirectoNotice`
- [x] 5.2 Portar `StatusBox` desde `CheckConsumes` a un componente propio y montar las dos cajas —
      consumo del día y sanción— con los cuatro estados de `design.md` §6
- [x] 5.3 El texto del consumo previo sale de `previousConsumptionMessage`, sin redacción propia
- [x] 5.4 Separar "sancionado" de "no activo en el padrón": hoy `isSuspended` los mezcla
- [x] 5.5 Retirar de `StudentResultCard` el modo `student={null}` y sus marcadores
      (`EMPTY_FIELD_PLACEHOLDER`, badge "Sin consultar", badge "Suspensiones: —"), junto con los
      comentarios que apuntan a `CheckConsumes` (vacíos V6, C3)

## 6. Quitar los vacíos

- [x] 6.1 V1/V5 — sin persona no se monta ficha ni foto: una sola línea de estado vacío con la
      instrucción de escanear
- [x] 6.2 V2 — la caja de estado de la última acción se muestra solo cuando hay mensaje; el alto se
      reserva en el contenedor, no con `' '`
- [x] 6.3 V3/V4 — contador y fecha del turno solo con sesión; sin ella manda el aviso de sesión
- [x] 6.4 V7 — un único texto de estado vacío en toda la pantalla
- [x] 6.5 V8 — la botonera vive siempre en el pie de la tarjeta; los botones se deshabilitan en lugar
      de desmontarse, y cada uno explica por qué está apagado (`title`/`aria-describedby`)
- [x] 6.6 I6 — el conteo de suspensiones sale de la cascada de `personNotice` y vive en la ficha
- [ ] 6.7 Repasar la pantalla en los estados: sin sede · sin sesión · consultando · persona normal ·
      persona que ya comió · persona sancionada · persona externa · persona no encontrada. **Ningún
      campo vacío, ninguna caja sin texto, ningún `—` de relleno**

## 7. Modo consulta

- [x] 7.1 `puedeRegistrar = can('/comedor/registrar')`; sin él, no se montan los botones de registrar
      ni de suspender, ni el atajo `ArrowDown`/`ArrowUp`
- [x] 7.2 Sin `puedeRegistrar` no se montan el contador, la pestaña "Últimos registros" ni el polling
      de 15 s (`session/{id}/recent` exige `/comedor/registrar` y daría 403 en bucle)
- [x] 7.3 La pantalla dice, en una línea, que está en modo consulta y por qué no ofrece registrar

## 8. Maquetación a dos columnas

- [x] 8.1 Montar la rejilla de `design.md` §4: turno + búsqueda a la izquierda, persona a la derecha
      desde `lg`; apilada por debajo
- [ ] 8.2 Medir a 1366×768 con el estado más alto (persona externa que ya comió, sancionada, con
      aviso de sesión): `scrollHeight === clientHeight`
- [ ] 8.3 Comprobar que la pestaña "Últimos registros" sigue cabiendo con su tabla desplazándose
      dentro

## 9. Pruebas

- [x] 9.1 `RegisterDiningUnified.test.tsx`: modo consulta (sin botón de registrar, sin contador,
      sin llamada a `session/{id}/recent`)
- [x] 9.2 Buscar sin sede ni sesión abierta devuelve la ficha completa
- [x] 9.3 Persona externa que ya comió: sale su ficha **y** el aviso de consumo previo con sede y
      origen (el caso que hoy `CheckConsumes` responde mal)
- [x] 9.4 Persona sin sanción y sin consumo: las dos cajas verdes están presentes
- [x] 9.5 `checkByDocument` falla: la ficha se muestra, la caja de consumo dice "no se pudo
      comprobar" y el registro sigue disponible
- [x] 9.6 Guarda de vacíos: con persona en pantalla ningún `input` visible tiene `value === ''`
- [x] 9.7 `RegisterDiningExternalPerson.test.tsx` sigue verde
- [x] 9.8 `npm test` y `npm run build` (con `noUnusedLocals`, los imports que deja `CheckConsumes` al
      irse rompen la compilación si no se limpian)

## 10. Backend (opcional, cosmético)

- [x] 10.1 En `app/db/init_db.py`, renombrar la etiqueta de `/comedor/consultar` a
      "Comedor: solo consulta"; **no** tocar la ruta ni los `require_any_permission`
- [x] 10.2 Confirmar que ningún endpoint pierde su gate al renombrar la etiqueta (es solo el texto de
      la pantalla de permisos)

## 11. Cierre

- [x] 11.1 Actualizar `CLAUDE.md`: la tabla de rutas pierde `/comedor/consultar` como pantalla y
      `RegisterDining` pasa a describirse como consulta + registro
- [x] 11.2 Recorrer el inventario de `design.md` §3 marcando cada vacío como cerrado
- [ ] 11.3 Validar el cambio con OpenSpec y archivarlo


## Notas de aplicación (2026-08-11)

**Hecho y verificado:** `npm run build` limpio y `npx tsc --noEmit` sin errores. Pruebas nuevas:
`RegisterDiningUnified.test.tsx` (12) y `routeAccess.test.ts` (6), ambas en verde;
`RegisterDiningExternalPerson.test.tsx` (6) sigue en verde tras adaptar su punto de sincronización
—esperaba a que el botón de buscar dejara de estar deshabilitado, y ahora nunca lo está.

**Pendiente de navegador o de decisión humana:** 1.1, 1.2, 6.7, 8.2, 8.3 y el archivado (11.3).

**Dos fallos de `npm test` ajenos a este cambio**, presentes antes de tocar nada:

- `src/api/lunch.test.ts` — "creates a template only when saveAsTemplate is true". La prueba espera
  que `createConfirmedLunch` cree la plantilla; el propio `CLAUDE.md` documenta que ya no lo hace
  (la crea el backend al confirmar). Prueba desactualizada respecto al código.
- `src/utils/rosterRealFiles.verify.test.ts` — `describe.skipIf(!available)` no impide que el cuerpo
  del `describe` se ejecute, así que `load()` intenta leer unos CSV que no están en el repo y
  revienta al recolectar en vez de saltarse.

Ninguno de los dos importa nada que este cambio toque (`api/lunch`, `utils/csvImport`,
`utils/rosterMerge`). Quedan fuera de alcance y merecen su propio arreglo.
