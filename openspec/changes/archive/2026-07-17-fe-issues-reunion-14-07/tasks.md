## 1. Hora de apertura/cierre en el historial (Issue #1)

- [x] 1.1 Añadir helper `formatTime` (es-VE, `HH:mm`) junto a `formatDate` en `SessionHistoryPage.tsx`
- [x] 1.2 Añadir columnas "Apertura" y "Cierre" a `sessionColumns` usando `opened_at`/`closed_at`
- [x] 1.3 Sesión abierta (`closed_at === null`) → mostrar "—"/"En curso" en la columna de cierre

## 2. Menú del día en el PDF de la sesión (Issue #2)

- [x] 2.1 Extender `SessionEntrantsPdfParams` con `menu?: LunchResponse | null` en `pdfSessionEntrants.ts`
- [x] 2.2 Renderizar sección de menú (nombre, `platesQuantity`, ingredientes con `calculatedQuantity`+`unit`)
- [x] 2.3 Pasar `menu` desde `handleDownloadPdf` en `SessionHistoryPage.tsx`
- [x] 2.4 Sesión sin menú (`menu === null`) → omitir la sección o imprimir "Sin menú registrado"

## 3. Modal de gráficas de la sesión (Issue #3)

- [x] 3.1 Añadir `gender?: string | null` y `user_type?: string` a `Consumption` (`src/types/consumption.ts`)
- [x] 3.2 Crear `src/utils/sessionStats.ts`: conteo por género, por carrera (solo `STUDENT`, set fijo
      [informatica, civil, mecanica, psicologia, electronica, arquitectura, musica, produccion animal]
      + "Otras") y por rol (STUDENT/TEACHER/ADMINISTRATIVE/WORKER)
- [x] 3.3 Normalizar `gender`/`career` (acentos, mayúsculas) contra los valores reales de la BD
- [x] 3.4 Botón "Ver gráficas" en el detalle de la sesión → `Modal` con 3 gráficas (`PieChart`/`BarChart`)
- [x] 3.5 Manejar no-estudiantes (no aportan a carrera) y externos (excluidos/aparte en la gráfica de rol)

## 4. Filtro por rol en el historial (Issue #4)

- [x] 4.1 Estado `roleFilter` + `Select`/chips (Todos + 4 roles) en `SessionHistoryPage.tsx`
- [x] 4.2 Filtrar `entrants` por `user_type` (client-side) antes de pasarlos a la `Table`
- [x] 4.3 Convivir con el filtro existente "Solo acceso directo"

## 5. Alarma de duplicado a ~10 s (Issue #5)

- [x] 5.1 Extender `playSound` (`src/utils/sound.ts`) con opción de duración/loop (p. ej. `durationMs`)
- [x] 5.2 En `RegisterDining.tsx` (409 duplicado) pedir ~10 s; al alcanzarlos, `pause()` + `onEnded`
- [x] 5.3 Cancelar el audio anterior si se registra otro antes de los 10 s (sin fugas de `Audio`)

## 6. Contador de registros de la sesión (Issue #6)

- [x] 6.1 Estado `sessionCount`; al setear `session`, cargar total vía `consumptionApi.list({ session_id })`
- [x] 6.2 Incrementar en cada `handleRegister` exitoso; recargar al cambiar de sede/sesión
- [x] 6.3 Mostrarlo arriba a la derecha (`PageHeader` slot / badge) en Registro al Comedor

## 7. Ventana "últimas 10 personas" (Issue #7)

- [x] 7.1 Estado `recentEntrants` + `loadRecent()` con `consumptionApi.list({ session_id, limit: 10 })`
- [x] 7.2 Botón "Últimos registros" → `Modal` con `Table` (Cédula, Nombre, Hora), más nueva primero
- [x] 7.3 Llamar `loadRecent()` tras cada `handleRegister` exitoso y al abrir el modal

## 8. Contador de suspensiones en la ficha (Issue #8)

- [x] 8.1 Añadir prop `suspensionCount` (o similar) a `StudentResultCard.tsx` → "Suspendido N veces" / "Sin suspensiones"
- [x] 8.2 Poblarla en las pantallas que usan la ficha (RegisterDining, CheckConsumes, ManualRegistrationPage)
- [x] 8.3 Opción B: usar `sanction_count` del lookup si el backend lo expone; si no, Opción A:
      `sanctionApi.history(acceso_directo_id).total`. Solo aplica a personas con `acceso_directo_id`

## 9. Eliminar pantalla "Acceso Estudiantes" (Issue #9)

- [x] 9.1 Quitar el ítem del menú en `NavBar.tsx` (`/admin/acceso-estudiantes`)
- [x] 9.2 Quitar la ruta y el import de `StudentAccessPage` en `App.tsx`
- [x] 9.3 Borrar `src/pages/StudentAccessPage.tsx`
- [x] 9.4 `grep` de referencias y borrar `api/studentAccess.ts` / `types/studentAccess.ts` si quedan huérfanos
- [x] 9.5 Confirmar build limpio (sin imports/vars sin usar en modo estricto)

## 10. Registro Manual: vista única + guardar con ↓ (Issue #10)

- [x] 10.1 Añadir listener `keydown` (patrón de `RegisterDining` 222-239): `ArrowDown` → `handleSave`,
       respetando SELECT/TEXTAREA y estados (no guardar sin persona / guardando / con modal abierto)
- [x] 10.2 Compactar el layout a una sola vista sin scroll de página (paddings, columnas, listado con
       scroll interno propio)
- [ ] 10.3 (Opcional) Extraer hook compartido `useSaveOnArrowDown` reutilizado por ambas pantallas

## 11. Validación

- [x] 11.1 Typecheck estricto: `npx tsc --noEmit`
- [x] 11.2 Build verde: `npm run build`
- [ ] 11.3 Pruebas manuales por issue (sesión abierta vs cerrada, PDF con/sin menú, gráficas con datos
       mixtos, filtro por rol, alarma ~10 s, contador incremental, últimas 10, ficha con/sin sanciones,
       menú sin "Acceso Estudiantes", guardar con ↓ sin scroll)
