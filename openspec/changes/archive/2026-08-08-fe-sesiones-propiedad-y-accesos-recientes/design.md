# Diseño — Panel de ingresos recientes y pantalla de sesión por rol

El contrato de servidor es normativo y vive en
`../Dining-System-UNET-Backend/openspec/changes/be-sesiones-propiedad-y-accesos-recientes/design.md`.
Aquí solo se decide cómo lo consume el cliente.

---

## 1. Capa de API y tipos

### `src/types/acceso_directo.ts`

```typescript
export interface AccesoDirectoRecentEntry {
  consumption_id: number
  acceso_directo_id: number
  document_id: string
  first_name: string
  last_name: string
  user_type: UserType | null
  career: string | null
  /** Nombre del motivo de acceso, no el id. */
  access_reason: string | null
  is_priority: boolean
  registered_at: string
  consumption_date: string
  is_manual: boolean
  lunch_session_id: number
  /** Nulos en un registro manual: su sesión no cuelga de ninguna sede. */
  sede_id: number | null
  sede_name: string | null
}
```

### `src/api/acceso_directo.ts`

```typescript
recentEntries: (limit = 10, onlyPriority = false) =>
  apiClient.get<{ total: number; items: AccesoDirectoRecentEntry[] }>(
    `/accesos_directos/recent-entries?limit=${limit}&only_priority=${onlyPriority}`,
  ),
```

### `src/api/lunchSession.ts`

```typescript
openableSedes: () => apiClient.get<{ total: number; items: Sede[] }>(
  '/lunch-sessions/openable-sedes',
),

forceClose: (id: number, reason: string) =>
  apiClient.put<LunchSession>(`/lunch-sessions/${id}/force-close`, { reason }),
```

### `src/types/lunchSession.ts`

`LunchSession` gana `opened_by_name: string | null` y `closed_by_name: string | null`.

---

## 2. Panel de ingresos recientes

Vive en `AccesoDirectoPage`, entre el `PageHeader` y la fila de filtros del padrón. Es una `Card`
`variant="outlined"` con un `Table` compacto de los primitivos existentes — nada nuevo en
`components/ui/`.

| Columna | Contenido |
|---|---|
| Persona | `first_name last_name`, y debajo la cédula en `text-slate-500` |
| Tipo | `Badge` con `USER_TYPE_LABEL`, reutilizando el mapa de variantes que la página ya tiene |
| Motivo | `Badge variant="info"` con `access_reason`, o `—` |
| Sede | `sede_name`, o `—` cuando es nulo |
| Origen | `Badge`: "Taquilla" si `!is_manual`, "Manual" si `is_manual` |
| Hora | `registered_at` formateado a hora local |

Cabecera del panel: *"Últimos ingresos"* + `{items.length} de {total}`, un conmutador **"Solo
prioritarios"** y un botón de refrescar. El estado vacío dice *"Todavía no hay ingresos
registrados."*.

**Carga.** Efecto propio, independiente del `refetch` de la tabla del padrón: los filtros de esa
tabla (búsqueda, estado, tipo, motivo) **no** afectan al panel. Son dos preguntas distintas —"quién
está dado de alta" y "quién acaba de entrar"— y mezclarlas haría que el panel cambiara al escribir en
el buscador. Se recarga al alternar "Solo prioritarios", al pulsar refrescar y después de cualquier
alta, edición o borrado que ya dispare `refetch`.

**Sin *polling*.** `RegisterDining` refresca cada 15 s porque es la pantalla de mostrador y varias
taquillas comparten sesión. Esta es una pantalla de gestión: un botón de refrescar basta y evita otra
petición periódica contra la API.

**Error.** `notify.error(err)` y el panel queda vacío. Un fallo aquí no debe impedir trabajar con el
padrón, que es la función principal de la pantalla.

---

## 3. `LunchSessionPage` por rol

Derivaciones, todas a partir de `useAuth()`:

```typescript
const role     = user?.role.name
const isAdmin  = role === 'SUPER_ADMIN' || role === 'ADMIN'
const canOpen  = isAdmin || role === 'TAQUILLERO'
const isOwner  = (s: LunchSession) => s.opened_by_id != null && s.opened_by_id === user?.id
const canClose = (s: LunchSession) => isOwner(s) || (isAdmin && s.opened_by_id == null)
const canForce = (s: LunchSession) => role === 'SUPER_ADMIN' && !canClose(s)
```

`canClose` reproduce la regla del servidor **solo para rotular la UI**. La autoridad sigue siendo el
403: si las dos discrepan, gana el servidor y el mensaje del error se muestra tal cual.

| | SUPER_ADMIN | ADMIN | TAQUILLERO |
|---|---|---|---|
| Lista de sesiones abiertas | todas (del servidor) | todas (del servidor) | solo la suya (del servidor) |
| Botón "Abrir Sesión" | sí | sí | sí |
| Botón "Cerrar" | activo solo en las suyas | activo solo en las suyas | activo solo en la suya |
| "Cierre forzado" | sí, en las ajenas | no | no |
| Calendario de historial | sí | sí | **no se pide** |

El calendario se apoya en `lunchSessionApi.list`, que es ADMIN+. Hoy su 403 lo absorbe un `catch {}`
vacío y el calendario aparece en blanco sin explicación. Pasa a envolverse en `if (isAdmin)`: no se
pide lo que se sabe que va a fallar.

Para el taquillero, la sección de historial se sustituye por una nota:
*"Solo se muestran las sesiones que abriste."*

### Selector de sede al abrir

`SedeSelector` gana una prop opcional `source?: 'all' | 'openable'` (por defecto `'all'`, para no
tocar sus usos actuales en las pantallas de taquilla). Con `'openable'` carga
`lunchSessionApi.openableSedes()`.

El modal de apertura la usa con `'openable'` y **deja de pasar `excludeIds`**. El cálculo anterior
—catálogo completo menos las sedes de `openSessions`— era correcto mientras `openSessions` lo traía
todo; con el listado ya filtrado por rol, un taquillero vería como libres las sedes ocupadas por
otros y solo se enteraría al recibir el 409. El servidor es quien sabe cuáles están libres.

Si el catálogo vuelve vacío, el modal muestra *"No hay sedes disponibles: todas tienen una sesión
abierta."* y deshabilita el botón de abrir.

---

## 4. Cierre y cierre forzado

**Cerrar (dueño).** Igual que hoy: `Button variant="danger"` → modal de confirmación →
`lunchSessionApi.close(id)`.

**Cerrar (no dueño).** Botón deshabilitado con `title` = *"Solo {opened_by_name} puede cerrar esta
sesión"*, y la misma frase visible bajo la fila. Un botón apagado sin explicación se lee como un
fallo de la aplicación.

**Cierre forzado (SUPER_ADMIN sobre una sesión ajena).** Botón secundario *"Cierre forzado"* que abre
un `Modal` propio con:

- quién abrió la sesión, qué sede y desde qué hora;
- `textarea` de motivo, obligatorio, mínimo 10 caracteres, con contador y validación en cliente antes
  de enviar (el servidor responde 422, pero la corrección se pide antes);
- aviso: *"Esta acción queda registrada en la auditoría del sistema."*;
- confirmar → `lunchSessionApi.forceClose(id, reason)`.

Nada de `confirm()` nativo: está prohibido en el proyecto y `nativeDialogs.guard.test.ts` lo vigila.

Tras cualquier cierre se recarga el listado y, si el rol es ADMIN+, el calendario.

---

## 5. Manejo de errores

| Situación | Respuesta de la UI |
|---|---|
| 403 al cerrar (carrera: alguien cambió el estado, o la UI se desactualizó) | `notify.error` con el mensaje del servidor, que ya nombra a quien abrió, y recarga del listado |
| 409 al abrir (sede ocupada entre la carga del catálogo y el envío) | Mensaje en el modal reutilizando `CONFLICT.sessionAlreadyOpen`, y recarga del catálogo de sedes disponibles |
| 400 al cerrar una sesión ya cerrada | `notify.error` y recarga |
| 403 en el listado (rol sin acceso) | Lista vacía con la nota del rol; ya está cubierto por `ProtectedRoute`, es defensa en profundidad |

El `apiClient` desempaqueta `detail` tanto si es cadena como si es objeto, así que el `detail`
estructurado del 403 de cierre llega a `err.message` sin trabajo extra.
