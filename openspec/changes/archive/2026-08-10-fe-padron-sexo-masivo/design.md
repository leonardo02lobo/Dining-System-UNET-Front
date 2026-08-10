# Diseño — Clasificación masiva del sexo desde la lista del padrón

El contrato de servidor es normativo y vive en
`../Dining-System-UNET-Backend/openspec/changes/be-padron-sexo-masivo/design.md`.

---

## 1. Cómo se combinan la casilla y el control de sexo

Hay dos mecanismos en la misma fila y conviene fijar qué hace cada uno, porque de eso depende que la
pantalla se entienda sola:

| Gesto | Efecto |
|---|---|
| Elegir **M** o **F** en una fila | Deja la fila *pendiente* y **marca su casilla automáticamente** |
| **Desmarcar** la casilla de una fila | Descarta su valor pendiente |
| **Marcar** la casilla sin elegir sexo | No hace nada al guardar: no hay valor que escribir |
| Casilla de **cabecera** | Marca o desmarca las 50 filas visibles |

Elegir el sexo **es** la declaración de intención, así que exigir además una marca sería un paso
vacío que solo produce trabajo perdido ("le puse M a treinta filas y no guardó ninguna"). La casilla
existe para lo contrario: **retirar** filas del lote y ver de un vistazo cuáles van a viajar.

Una fila marcada sin valor no es un error ni se avisa: simplemente no entra en el lote. El contador
de la barra cuenta **cambios pendientes**, no filas marcadas.

---

## 2. Primitivo `Table`: selección opcional

`Table` lo consumen ocho pantallas. La selección se añade como prop **opcional** y sin ella el
componente renderiza exactamente lo mismo que hoy — misma cabecera, mismas columnas, misma altura.

```typescript
interface TableProps<T extends object> {
  // …props actuales, sin cambios…
  /** Claves de las filas marcadas. Su presencia activa la columna de selección. */
  selectedKeys?: Array<string | number>
  /** Nueva selección completa; el padre es el dueño del estado. */
  onSelectionChange?: (keys: Array<string | number>) => void
}
```

- La columna de casillas solo se renderiza cuando llegan **ambas** props.
- La casilla de cabecera marca o desmarca **las filas visibles**, y usa `indeterminate` cuando solo
  algunas lo están.
- Un clic en la casilla **no** dispara `onRowClick`: mismo `stopPropagation` que ya aplica la
  columna de acciones — la regla existe justamente porque este choque ya ocurrió antes.
- Cada casilla lleva un `aria-label` con el contenido identificatorio de su fila; una columna de
  cincuenta casillas llamadas todas "Seleccionar" es inservible con lector de pantalla.
- El componente **no** guarda estado de selección: lo levanta al padre. `StudentsPage` necesita
  cruzar selección y valores pendientes, y una copia interna divergiría.

---

## 3. `StudentsPage`

### Estado nuevo

```typescript
// id -> sexo pendiente de guardar. Es la única fuente del "hay cambios sin guardar".
const [pending, setPending] = useState<Map<number, StudentGender | null>>(new Map())
const [selectedIds, setSelectedIds] = useState<number[]>([])
const [saving, setSaving] = useState(false)
```

`onlyUnassigned` pasa a inicializarse en **`true`**.

### Columna "Sexo"

Sustituye al `Badge` de solo lectura por un control segmentado de dos botones (M / F). El valor
mostrado es `pending.get(row.id) ?? row.gender`. Una fila con valor pendiente se distingue
visualmente del valor ya guardado — si no, no hay forma de saber qué falta por guardar.

Los botones son `<button type="button">` con `aria-pressed`, no un `Select`: dos opciones no
justifican un desplegable, y el objetivo es un clic por fila.

### Barra de acciones

Aparece únicamente con `pending.size > 0`, pegada al fondo del contenedor:

```
N cambios pendientes            [Descartar]  [Guardar]
```

`Guardar` deshabilitado mientras `saving`. `Descartar` limpia `pending` y `selectedIds` sin
preguntar: descartar es la acción reversible (basta volver a marcarlos), guardar es la que no.

### Guardado

```typescript
const items = [...pending].map(([id, gender]) => ({ id, gender }))
const result = await externalStudentApi.bulkSetGender(items)
```

Una sola llamada. Después:

- `notify.success` con `result.updated` — el número que importa es el de filas realmente cambiadas,
  no el de enviadas.
- Si `result.failed > 0`, `notify.error` enumerando las cédulas que fallaron. Un lote parcialmente
  aplicado que se anuncie como éxito es peor que un error.
- `pending` y `selectedIds` se limpian y se recarga la lista. Con el filtro por defecto, las filas
  guardadas **desaparecen**, que es el efecto que se busca.

El lote máximo del servidor es 200 y una página son 50, así que `pending` no puede rebasarlo mientras
la selección esté acotada a la página visible.

### Salir con cambios pendientes

Cambiar de página, tocar cualquier filtro o desactivar "Sin sexo asignado" con `pending.size > 0`
abre un `Modal` de confirmación: *"Tienes N cambios sin guardar. Si continúas se perderán."*, con
**Descartar y continuar** / **Cancelar**.

`confirm()` nativo está prohibido en el proyecto —falla en silencio dentro del *webview* de Tauri— y
`nativeDialogs.guard.test.ts` lo vigila.

---

## 4. Capa de API

```typescript
// src/api/externalStudent.ts
bulkSetGender: (items: Array<{ id: number; gender: StudentGender | null }>) =>
  apiClient.patch<StudentGenderBulkResult>('/students/bulk/gender', { items }),
```

```typescript
// src/types/student.ts
export interface StudentGenderBulkRow {
  row: number
  id: number
  status: 'updated' | 'unchanged' | 'error'
  error?: string | null
}

export interface StudentGenderBulkResult {
  total: number
  updated: number
  unchanged: number
  failed: number
  results: StudentGenderBulkRow[]
}
```

`setGender` (la ficha individual) **se conserva**: el panel de detalle sigue siendo la vía correcta
para corregir una ficha suelta a la que se ha llegado buscándola.

---

## 5. Errores

| Situación | Respuesta de la UI |
|---|---|
| El lote falla entero | `notify.error`; `pending` **se conserva** para poder reintentar sin volver a clasificar a mano |
| `failed > 0` con el resto aplicado | Éxito por las aplicadas + error enumerando las fallidas; se recarga |
| 422 por un lote fuera de rango | No debería ocurrir con la selección acotada a la página; si ocurre, el mensaje del servidor tal cual |
