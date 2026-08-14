## Why

`/comedor/consultar` y `/comedor/registrar` son la misma pantalla escrita dos veces, y la copia peor
es la que el operador usa para *decidir*.

Las dos hacen lo mismo —escanear un carnet y mirar quién es esa persona, si ya comió y si está
sancionada— pero lo resuelven con llamadas distintas, y por eso **responden cosas distintas a la
misma cédula**:

| | `/comedor/consultar` (`CheckConsumes`) | `/comedor/registrar` (`RegisterDining`) |
|---|---|---|
| Búsqueda de la persona | `externalStudentApi.lookup` → **solo el padrón** | `studentApi.lookup` → padrón + acceso directo + gente externa |
| Consumo del día | `check/{acceso_directo_id}` → exige acceso directo | `checkByDocument` → resuelve por cédula |
| Qué dice del consumo | hora suelta | hora + sede + taquilla/manual (`previousConsumptionMessage`) |
| Sesión | `openList()`: "hay alguna abierta en algún sitio" | la sesión de **su** sede |
| Acciones | ninguna | registrar, suspender, limpiar |

Las consecuencias no son estéticas:

- **Una persona externa que sí comió aparece como "no hay registro de consumo asociado".** La
  consulta la busca solo en el padrón y, aunque la encontrara, resuelve el consumo por
  `acceso_directo_id`, que ella no tiene. La pantalla que existe para responder "¿ya comió?" es
  incapaz de responderlo justo para el grupo que se añadió después (`fe-gente-externa`).
- **Un acceso directo que no está en el padrón sale como "no se encontró".** El registro lo
  encuentra. El taquillero aprende que la consulta miente y deja de usarla.
- **Consultar obliga a cambiar de pantalla y perder a la persona escaneada.** Ver que está
  sancionada no lleva a ninguna parte: la consulta no ofrece ninguna acción.

Y en la que sí funciona hay el defecto inverso: **el registro no afirma nada bueno**. Sin sanción y
sin consumo previo no dibuja nada, así que "todo en orden" es algo que el operador tiene que
*deducir de una ausencia*, con el lector en la mano y la fila esperando. Eso —afirmar el estado en
positivo— es exactamente lo que la consulta hace bien y lo que hay que llevarse al registro.

Además, las dos pantallas están llenas de **huecos que ocupan sitio sin decir nada**: cinco campos
grises en blanco, un contador vacío, una caja de estado cuyo contenido es un espacio (`' '`), una
ficha entera de marcadores `—` y dos avisos neutros que repiten "consulta una cédula". En una
pantalla que además debe caber sin scroll a 1366×768, ese alto está pagado y no compra nada.

## What Changes

- **Una sola pantalla de comedor, en `/comedor/registrar`.** Consultar deja de ser un destino y pasa
  a ser lo que ocurre en cada búsqueda: toda consulta muestra la ficha completa; registrar es la
  acción que se ofrece encima. `CheckConsumes.tsx` se elimina.
- **`/comedor/consultar` sobrevive como permiso, no como pantalla.** Ocho endpoints del backend lo
  aceptan en su `require_any_permission`; borrarlo dejaría sin acceso a quien solo lo tenga. La ruta
  del frontend redirige a `/comedor/registrar` y el permiso pasa a conceder **modo consulta**: misma
  pantalla, sin botón de registrar, sin suspender y sin contador de turno. **El backend ya modela
  esto exactamente** —`POST /consumptions/` exige `/comedor/registrar`, las búsquedas admiten
  `/comedor/consultar`—, así que **no hace falta ningún cambio de backend**.
- **Buscar deja de exigir sede y sesión abierta.** Hoy el campo de cédula del registro está
  `disabled` sin sesión: es la razón por la que hacía falta otra pantalla para consultar fuera del
  horario de servicio. Buscar es siempre posible; lo que la falta de sesión bloquea es **registrar**.
- **La ficha del registro pasa a ser la de la consulta.** Los cinco `InlineField` grises se
  sustituyen por `StudentResultCard` —la ficha compartida que ya usan consulta y registro manual— con
  las dos cajas de estado explícitas de `CheckConsumes`: **consumo del día** y **sanción**, ambas
  afirmando en verde cuando la respuesta es buena.
- **Una sola llamada de estado por consulta.** `checkByDocument` ya devuelve `active_sanction`, así
  que la llamada extra a `check/{acceso_directo_id}` que hace hoy el registro sobra y se retira.
- **Se quitan todos los vacíos** (inventario completo y verificable en `design.md` §3): campos en
  blanco, contador vacío, caja de estado con un espacio, fecha `—`, foto fantasma, ficha de
  marcadores y avisos neutros duplicados. Sin persona consultada la pantalla muestra **un** estado
  vacío que dice qué hacer; con persona, todo campo visible tiene valor.
- **El menú deja de ofrecer dos entradas.** "Consultar Consumo" y "Registro al Comedor" se funden en
  **"Comedor: Consulta y Registro"**, visible para quien tenga cualquiera de las dos rutas.

## Capabilities

### New Capabilities
- `comedor-consulta-registro-unificados`: una única pantalla de comedor que consulta siempre y
  registra cuando se puede, con su modo de solo consulta gobernado por permiso y su contrato de
  "ningún campo vacío en pantalla".

### Modified Capabilities
- `consumo-dia-aviso`: el estado del día se afirma en los dos sentidos (comió / no ha comido) y se
  resuelve por cédula para **toda** persona que pueda comer, no solo para los accesos directos.
- `comedor-vistas-compactas`: desaparece el escenario de `/comedor/consultar`; queda una sola vista
  que cumplir.
- `permisos-conceden-capacidad-front`: se nombra el caso de dos permisos que abren la misma pantalla
  con capacidad distinta.

### Removed Capabilities
- `registro-comedor-ocultar-campos-consulta`: el requisito de ocultar sede y cédula al consultar
  queda sin objeto (y hoy **no está implementado**: el código nunca los oculta).

## Impact

- **Archivos eliminados:** `src/pages/CheckConsumes.tsx`.
- **Archivos modificados:** `src/pages/RegisterDining.tsx` (el grueso), `src/App.tsx` (ruta →
  redirección), `src/config/routeAccess.ts` (`ROUTE_ALIASES` + `canOpen`),
  `src/components/ProtectedRoute.tsx`, `src/components/ui/NavBar.tsx`,
  `src/components/StudentResultCard.tsx` (se retira el modo "ficha en blanco", que existía solo para
  `CheckConsumes`), `src/hooks/useCan.ts` (sin cambio de firma).
- **Archivos nuevos:** `src/pages/RegisterDiningUnified.test.tsx` (modo consulta, búsqueda sin sesión,
  gente externa, ausencia de campos vacíos).
- **Sin cambios de backend.** Sí conviene ajustar la etiqueta de `/comedor/consultar` en
  `_PERMISSIONS` (`app/db/init_db.py`) para que en la pantalla de permisos no prometa una pantalla
  que ya no existe: "Consultar Consumo" → "Comedor: solo consulta".
- **Riesgo:** `/comedor/registrar` es `DEFAULT_ROUTE.TAQUILLERO`. Si la redirección o el alias de
  permiso fallan, un usuario con solo `/comedor/consultar` entra en un bucle de redirección a una
  ruta que no puede abrir. Cubierto por prueba.
- **Coordinación:** `fe-layout-sin-scroll` (pendiente) modifica `comedor-vistas-compactas` y
  reconstruye `RegisterDining` sobre `ScreenLayout`. Ambos tocan la misma pantalla; **este cambio va
  después**, y su maquetación se monta sobre `ScreenLayout` en lugar del `flex h-full` actual.

## Non-goals

- Tocar el registro manual (`/comedor/registro-manual`), que registra por fecha y es otro flujo.
- Tocar `/comedor/suspender`, aunque comparta el patrón de búsqueda. Es una decisión aparte y con su
  propio riesgo; unificarla aquí ampliaría el alcance sin necesidad.
- Cambiar el modelo de permisos del backend ni añadir permisos nuevos.
- Rediseñar `StudentResultCard` más allá de retirarle el modo en blanco.
