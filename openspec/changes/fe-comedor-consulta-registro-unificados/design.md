# Diseño — Consulta y registro de comedor en una sola pantalla

## 1. Qué se unifica y qué se conserva

La unificación no es "meter una pantalla dentro de otra": es reconocer que **consultar es el primer
paso de registrar**, y que la pantalla de consulta era una copia degradada de ese paso. Por eso la
que sobrevive es `RegisterDining` —tiene la búsqueda buena, la comprobación buena y las acciones— y
lo que se importa de `CheckConsumes` es **cómo enseña a la persona**.

| Pieza | De dónde sale | Por qué esa y no la otra |
|---|---|---|
| Búsqueda de la persona | `studentApi.lookup` (registro) | Busca en los tres padrones y falla solo si fallan los tres. El de la consulta solo mira el padrón de estudiantes. |
| Estado del día + sanción | `consumptionApi.checkByDocument` (registro) | Resuelve por cédula: contesta también por quien todavía no es acceso directo y por la gente externa. Y ya trae `active_sanction`. |
| Redacción del consumo previo | `previousConsumptionMessage` (registro) | Dice hora, sede y si fue taquilla o manual. La consulta solo daba la hora. |
| **Presentación de la persona** | **`StudentResultCard` + cajas de estado (consulta)** | **Afirma en positivo. El registro solo dibujaba avisos negativos.** |
| Sesión y sede | `lunchSessionApi.today(sedeId)` (registro) | La sesión de *su* sede. `openList()` solo decía si había alguna abierta en algún sitio. |
| Contador y últimos registros | registro | Solo tienen sentido con sesión; se ocultan en modo consulta (además el endpoint los deniega). |
| Suspender | registro | La consulta enseñaba la sanción y no dejaba hacer nada. |

## 2. Modos: una pantalla, dos capacidades

No se introduce ningún interruptor de modo en la interfaz. El modo **lo decide el permiso**, igual
que ya hace el resto de la aplicación (`permisos-conceden-capacidad-front`).

```
puedeRegistrar = can('/comedor/registrar')     // acción
puedeAbrir     = puedeRegistrar || can('/comedor/consultar')   // pantalla
```

`canAccess` se queda **estricta** —es la que responde por la capacidad— y se añade aparte:

```typescript
// src/config/routeAccess.ts
/**
 * Rutas que abren la misma pantalla. El permiso alternativo concede *ver*, nunca operar:
 * quién puede registrar lo sigue decidiendo `canAccess('/comedor/registrar')`, que es lo
 * mismo que exige `POST /consumptions/` en el servidor.
 */
export const ROUTE_ALIASES: Record<string, string[]> = {
  '/comedor/registrar': ['/comedor/consultar'],
}

export function canOpen(path, roleName, permissions): boolean {
  return canAccess(path, roleName, permissions)
      || (ROUTE_ALIASES[path] ?? []).some((alt) => canAccess(alt, roleName, permissions))
}
```

`ProtectedRoute` y `NavBar` pasan a `canOpen`; el botón de registrar sigue con `can`. La separación
importa: mezclarlas en `canAccess` convertiría el permiso de consulta en permiso de registro en el
cliente, y el 403 del servidor sería la primera noticia.

**Esto ya está modelado en el backend y no hay que tocarlo:**

| Endpoint | Permiso |
|---|---|
| `POST /consumptions/` | `require_permission("/comedor/registrar")` |
| `GET /consumptions/check-by-document` | `registrar` · `consultar` · `registro-manual` · `suspender` |
| `GET /students/lookup`, `/accesos_directos/lookup`, `/external-people/lookup` | idem con `consultar` |
| `GET /sanctions/history` | `consultar` · `registrar` · `suspender` · `accesos_directos` |
| `GET /lunch-sessions/today` | `sesion` · `registrar` · `consultar` · `registro-manual` |
| `GET /consumptions/session/{id}/recent` | `registrar` · `historial` — **no** `consultar` |

La última fila es la que obliga a ocultar contador y "Últimos registros" en modo consulta: pedirlos
daría 403 en bucle cada 15 s.

## 3. Inventario de vacíos (el "quitar todos los vacíos" del encargo)

Cada uno con lo que lo sustituye. Es la lista que se comprueba al cerrar el cambio.

### 3.1 Vacíos visuales

| # | Dónde | Hoy | Después |
|---|---|---|---|
| V1 | `RegisterDining.tsx:654-670` | Cinco `InlineField` grises con `value=''` sin persona | La ficha **no se monta** sin persona; en su lugar, un solo estado vacío con instrucción |
| V2 | `RegisterDining.tsx:687` | Caja de estado cuyo contenido es `' '` (un espacio) reservando alto | La caja aparece **al haber mensaje** y el alto se reserva en el contenedor, no con contenido falso |
| V3 | `RegisterDining.tsx:598` | `CounterBox` con `''` mientras no hay sesión | Sin sesión no hay contador: se muestra el estado de la sesión, no una caja vacía |
| V4 | `RegisterDining.tsx:590` | Fecha `'—'` sin sesión | La fecha del turno solo con turno; si no, el aviso de sesión ya lo explica |
| V5 | `RegisterDining.tsx:649` | `PersonPhoto` con `?` sin persona | Sin persona no hay foto |
| V6 | `CheckConsumes.tsx:196` | `StudentResultCard student={null}`: ficha completa de marcadores `—`, avatar vacío, badge "Sin consultar", badge "Suspensiones: —" | Se retira el modo en blanco de la ficha (existía solo para esta pantalla) |
| V7 | `CheckConsumes.tsx:112,132` | Dos cajas neutras que repiten "Consulta una cédula para ver…" | Una sola línea de estado vacío, una vez |
| V8 | `RegisterDining.tsx:716` | La botonera entera aparece/desaparece con `{student && …}`, y el pie salta | La botonera vive en el pie fijo de la tarjeta; los botones se deshabilitan, no se desmontan |

> El criterio general: **un campo sin valor no se dibuja**. La estabilidad de maquetación se consigue
> con la rejilla y el alto del contenedor, no rellenando huecos con `—` y espacios. La razón que
> justificaba los marcadores ("que la zona no aparezca de golpe") deja de aplicar cuando la zona
> vacía es una sola línea y no una ficha entera.

### 3.2 Vacíos de información

| # | Qué falta hoy | Después |
|---|---|---|
| I1 | La consulta no encuentra gente externa ni accesos directos fuera del padrón | Búsqueda única en los tres padrones |
| I2 | La consulta da falso negativo de consumo a quien no es acceso directo ("no hay registro de consumo asociado") aunque haya comido | `checkByDocument` resuelve por cédula |
| I3 | La consulta no dice sede ni origen del consumo | Redacción única de `utils/consumptionNotice.ts` |
| I4 | La consulta habla de "alguna sesión abierta en alguna sede" | Sede y sesión del operador |
| I5 | **El registro no afirma el estado bueno**: sin sanción y sin consumo, nada | Dos cajas siempre presentes con persona: consumo del día y sanción, en verde cuando procede |
| I6 | El conteo de suspensiones solo se ve si es >0, y encima detrás de la cascada del "aviso más grave": alguien sin acceso directo con tres suspensiones solo ve el aviso de alta al vuelo | El conteo vive en la ficha (`StudentResultCard`), fuera de la cascada de avisos |
| I7 | Ver una sanción en la consulta no lleva a ninguna acción | Suspender/registrar disponibles según permiso |
| I8 | Buscar exige sesión abierta (`disabled={registrationBlocked}` en el campo de cédula) | Buscar siempre; registrar es lo que se bloquea |

### 3.3 Vacíos de código y de spec

- **C1** — `consumptionApi.check(acceso_directo_id)` en `triggerSearch` es redundante:
  `checkByDocument` ya devuelve `active_sanction`. Una petición y una rama de error menos por
  consulta.
- **C2** — La spec `registro-comedor-ocultar-campos-consulta` exige ocultar sede y cédula al mostrar
  una persona. **El código no lo hace desde hace tiempo.** Es una spec que nadie cumple y nadie
  comprueba; se retira en lugar de arrastrarla.
- **C3** — El modo `student={null}` de `StudentResultCard` documenta en su propio comentario que
  existe "ver `CheckConsumes`". Muere con esa pantalla.

## 4. Maquetación

Restricción heredada: `comedor-vistas-compactas` (y `fe-layout-sin-scroll`) exigen que quepa a
1366×768 sin scroll de ventana. La ficha `StudentResultCard` es más alta que la rejilla de campos
grises que sustituye, así que la pantalla pasa a **dos columnas** a partir de `lg`:

```
┌─ Comedor: Consulta y Registro ──────────── [REGISTRO] [ÚLTIMOS] ─┐
│ ┌── Turno y búsqueda (≈360px) ──┐ ┌── Persona ─────────────────┐ │
│ │ Fecha · Sede · Consumos       │ │ StudentResultCard          │ │
│ │ [aviso de sesión, si bloquea] │ │  (avatar, badges, datos)   │ │
│ │ ─────────────────────────────  │ │ ┌ Consumo del día ───────┐ │ │
│ │ Cédula / Carnet   [ Buscar ]  │ │ │ verde | ámbar          │ │ │
│ │ (lector siempre activo)       │ │ └────────────────────────┘ │ │
│ │                               │ │ ┌ Sanción ───────────────┐ │ │
│ │                               │ │ │ verde | rojo           │ │ │
│ │                               │ │ └────────────────────────┘ │ │
│ └───────────────────────────────┘ └────────────────────────────┘ │
│ [estado de la última acción, solo si lo hay]                      │
│                        [Limpiar] [Suspender] [Registrar Consumo]  │
└───────────────────────────────────────────────────────────────────┘
```

Sin persona consultada, la columna derecha es **una sola línea**: *"Escanea un carnet o escribe una
cédula para ver a la persona."* Ni ficha en blanco ni marcadores.

Debajo de `lg` las columnas se apilan y el scroll interno de la tarjeta sigue siendo la válvula, como
hoy.

## 5. Flujo de datos de una consulta

```
triggerSearch(cedula)
  ├─ Promise.allSettled
  │    ├─ studentApi.lookup(cedula)            → persona (3 padrones)
  │    └─ consumptionApi.checkByDocument(cedula) → has_consumed + consumption + active_sanction
  ├─ si lookup falla en los tres → error visible, sin ficha
  └─ si la persona tiene acceso_directo_id → sanctionApi.history(id).total   (best-effort, #8)
```

Dos peticiones en paralelo y una tercera opcional, frente a las hasta cuatro en cadena de hoy. Las
reglas que ya existen se conservan: el fallo de `checkByDocument` no impide mostrar la ficha (el
rechazo del servidor sigue siendo el último guardia), y el conteo de suspensiones nunca bloquea.

## 6. Estados de las dos cajas

Con persona en pantalla, **siempre** se dibujan las dos. Es lo que convierte "no hay aviso" en una
afirmación comprobable.

**Consumo del día**
- ámbar — `Ya registró su consumo a las HH:mm en la sede X (registrado en taquilla|manualmente).`
- verde — `No ha consumido en la sesión de hoy.`
- gris — `No se pudo comprobar el consumo de hoy.` (solo si `checkByDocument` falló; nunca se
  presenta un fallo como un "no ha comido")

**Sanción**
- roja — `Sanción activa: <motivo>.`
- roja — `No está activo en el padrón de la UNET.` (`is_suspended` sin sanción: no es lo mismo, y
  hoy se cuentan como el mismo estado)
- verde — `Sin sanción activa.`
- gris — `A la gente externa no se la sanciona.` (`person_kind === 'external'`: no se promete un
  historial que no existe)

El aviso de "no tiene acceso directo, se dará de alta al registrar" deja de competir por el hueco del
"aviso más grave" y vuelve a su sitio natural: `StudentResultCard` ya sabe dibujarlo
(`showAccesoDirectoNotice`).

## 7. Qué se conserva intacto

- El modal de duplicado por 409 con su sonido de 10 s: es lo que atrapa dos taquillas registrando a
  la vez, que ninguna consulta previa puede prevenir.
- El atajo `ArrowDown`/`ArrowUp` para registrar, con sus guardas de modal.
- `useBarcodeScanner` deshabilitado tras modal o pestaña de últimos registros.
- El polling de 15 s del contador — **solo** cuando hay sesión y permiso de registro.
- `selected_sede_id` en `localStorage`.
- La suspensión rápida con su persona objetivo congelada.

## 8. Preguntas abiertas

1. **¿El menú conserva alguna entrada llamada "Consultar Consumo"?** La propuesta funde las dos en
   "Comedor: Consulta y Registro". Si el personal tiene memorizada la entrada antigua, la
   alternativa es dejar las dos apuntando a la misma ruta durante un tiempo — a costa de reintroducir
   la duda de "¿cuál abro?" que este cambio elimina. **Recomendación: una sola entrada.**
2. **¿Existe algún usuario real con `/comedor/consultar` y sin `/comedor/registrar`?** Si no existe
   ninguno, el modo consulta sigue haciendo falta (el permiso se puede conceder mañana), pero deja de
   ser urgente y su prueba es la única red. Conviene consultarlo en la tabla de permisos antes de
   desplegar.
