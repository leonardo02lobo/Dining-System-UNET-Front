> **Requisito previo:** `StudentsPage` la entrega el cambio activo `fe-mejoras-operativas-comedor`.
> Debe estar aplicado antes de empezar este.

## 1. Capa de API y tipos

- [x] 1.1 `StudentGenderBulkRow` y `StudentGenderBulkResult` en `src/types/student.ts`, con las
      formas de `design.md` §4
- [x] 1.2 `externalStudentApi.bulkSetGender(items)` → `PATCH /students/bulk/gender`
- [x] 1.3 **Conservar** `setGender`: el panel de detalle sigue siendo la vía de la ficha suelta

## 2. Selección en el primitivo `Table`

- [x] 2.1 Props opcionales `selectedKeys` / `onSelectionChange`; la columna de casillas se renderiza
      **solo** si llegan ambas
- [x] 2.2 Casilla de cabecera que marca o desmarca las filas visibles, con `indeterminate` en
      selección parcial
- [x] 2.3 `stopPropagation` en la casilla para no disparar `onRowClick` (misma regla que la columna
      de acciones)
- [x] 2.4 `aria-label` por casilla con el contenido identificatorio de su fila; cabecera identificada
      como "seleccionar todas las visibles"
- [x] 2.5 Sin estado interno de selección: se eleva al padre
- [x] 2.6 Verificar que las ocho pantallas que ya usan `Table` siguen igual — la prop es opcional y
      sin ella no debe cambiar ni una columna

## 3. `StudentsPage` — clasificación desde la lista

- [x] 3.1 `onlyUnassigned` inicializado en **`true`**
- [x] 3.2 Estado `pending: Map<number, StudentGender | null>` y `selectedIds`
- [x] 3.3 Columna "Sexo" con control segmentado M/F (`<button type="button">` + `aria-pressed`),
      mostrando `pending.get(id) ?? row.gender`
- [x] 3.4 Distintivo visual de la fila con valor pendiente frente a la ya guardada
- [x] 3.5 Elegir sexo marca la casilla de esa fila automáticamente
- [x] 3.6 Desmarcar la casilla descarta el valor pendiente de esa fila
- [x] 3.7 Fila marcada sin valor: no se envía y no genera aviso

## 4. Barra de acciones y guardado

- [x] 4.1 Barra pegajosa visible solo con `pending.size > 0`: "N cambios pendientes", Guardar,
      Descartar
- [x] 4.2 Guardar ⇒ **una sola** llamada a `bulkSetGender`; deshabilitado mientras dura
- [x] 4.3 Éxito ⇒ `notify.success` con `result.updated` (lo realmente actualizado, no lo enviado),
      limpiar `pending` y `selectedIds`, recargar
- [x] 4.4 `result.failed > 0` ⇒ además `notify.error` enumerando las filas fallidas
- [x] 4.5 Fallo total ⇒ `notify.error` y **conservar** `pending` para reintentar
- [x] 4.6 Descartar limpia sin preguntar

## 5. Protección de los cambios sin guardar

- [x] 5.1 Cambio de página, de cualquier filtro o del conmutador "Sin sexo asignado" con
      `pending.size > 0` ⇒ `Modal` de confirmación indicando cuántos se pierden
- [x] 5.2 Cancelar deja la pantalla y los cambios intactos; confirmar descarta y continúa
- [x] 5.3 Cero diálogos nativos (`confirm`/`alert`/`prompt`)

## 6. Validación

- [x] 6.1 `openspec validate fe-padron-sexo-masivo --strict`
- [x] 6.2 `npm run build` en verde
- [x] 6.3 `npm test` sin **nuevas** regresiones, con `nativeDialogs.guard.test.ts` en verde.
      Nota: la suite arrastra dos fallos preexistentes (`rosterRealFiles.verify.test.ts` por el CSV
      ausente y `lunch.test.ts::creates a template only when saveAsTemplate is true`); comprobar que
      siguen siendo esos dos y nada más
- [x] 6.4 Pruebas nuevas:
      - la pantalla arranca con "Sin sexo asignado" activado
      - elegir M en una fila la deja pendiente, marca su casilla y no llama al servidor
      - desmarcar la casilla descarta el valor pendiente
      - fila marcada sin valor no viaja en el lote
      - la casilla de cabecera marca las filas visibles y muestra indeterminado en selección parcial
      - Guardar emite **una** petición con todas las filas pendientes
      - el aviso de éxito usa `result.updated`, no el número de filas enviadas
      - `failed > 0` avisa además del error
      - un fallo total conserva los cambios pendientes
      - cambiar de página con cambios pendientes pide confirmación; cancelar los conserva
      - `Table` sin las props de selección no renderiza la columna de casillas
      - la casilla no dispara `onRowClick`
- [ ] 6.5 Verificación manual contra el backend de `be-padron-sexo-masivo` ya aplicado: clasificar
      una página completa, guardar, y comprobar que las filas desaparecen y que la gráfica de género
      del historial de sesiones deja de contarlas como "No especificado"
