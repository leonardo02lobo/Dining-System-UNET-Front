## Why

`StudentsPage` clasifica el sexo **de uno en uno**: hay que hacer clic en una fila, esperar el panel
de detalle, pulsar M o F, y volver a la lista. Con **8.380 estudiantes importados sin sexo** —el CSV
de Control de Estudios no trae esa columna, y es el único campo que la pantalla puede escribir— eso
no es una cola de trabajo, es una condena.

Tres cosas faltan para que se pueda trabajar de verdad:

1. **El sexo no se ve ni se toca desde la lista.** La columna existe pero es un `Badge` de solo
   lectura ("Sin clasificar"); clasificar obliga a abrir la ficha.
2. **No hay forma de seleccionar filas.** El primitivo `Table` no tiene selección: ni casilla por
   fila, ni casilla de cabecera, ni concepto de "filas marcadas".
3. **El filtro "Sin sexo asignado" arranca apagado.** Quien entra a clasificar ve las 8.380 filas
   mezcladas y tiene que acordarse de activar el filtro; y como el filtro no está puesto, lo que
   acaba de clasificar se queda a la vista y se vuelve a mirar.

## What Changes

- **Filtro "Sin sexo asignado" activado de origen.** Es el estado natural de la pantalla: quien entra
  a `/estudiantes` entra a clasificar. Sigue siendo desactivable para consultar el padrón completo.
  Su efecto secundario es el que pide el flujo: al guardar, **las filas clasificadas desaparecen**.
- **Columna "Sexo" editable en la lista**, con un control segmentado M/F por fila. Elegir un valor
  deja la fila *pendiente*, no la guarda.
- **Selección de filas al estilo Odoo**: casilla por fila y casilla de cabecera que marca **las 50
  filas visibles** (con estado indeterminado cuando la selección es parcial). El alcance es la página
  a propósito: el sexo se deduce leyendo el nombre, y una acción que escriba sobre miles de filas que
  nadie ha mirado no es clasificar.
- **Barra de acciones pegajosa** cuando hay al menos un cambio pendiente: *"N cambios pendientes"*,
  **Guardar** y **Descartar**.
- **Un único guardado**: todos los cambios pendientes viajan en una sola llamada a
  `PATCH /students/bulk/gender`. Al volver, la lista se recarga y —con el filtro por defecto— las
  filas guardadas ya no están.
- **Aviso al abandonar cambios sin guardar**: cambiar de página o de filtro con cambios pendientes
  abre una confirmación. Perder en silencio veinte clasificaciones hechas a mano sería peor que no
  tener la función.
- **El primitivo `Table` gana selección opcional**, sin alterar a ninguno de sus consumidores
  actuales.

## Capabilities

### New Capabilities
- `padron-sexo-edicion-masiva`: clasificación del sexo desde la lista del padrón, por lotes, con un
  único guardado.

### Modified Capabilities
- `tabla-primitiva-accesible`: el primitivo `Table` admite selección de filas.

## Impact

- **Archivos modificados:** `src/pages/StudentsPage.tsx`, `src/components/ui/Table.tsx`,
  `src/api/externalStudent.ts`, `src/types/student.ts`.
- **Dependencia dura del backend:** consume el contrato de `be-padron-sexo-masivo/design.md`. Ambos
  se desarrollan en paralelo y esas formas son normativas.
- **Depende de una pantalla aún no archivada:** `StudentsPage` la entrega el cambio activo
  `fe-mejoras-operativas-comedor`. Este cambio la modifica, así que aquel debe estar aplicado antes
  de empezar.
- **`Table` es compartido.** La selección se añade como prop **opcional**; sin ella el componente se
  comporta exactamente igual. Sus consumidores actuales (accesos directos, inventario, reportes,
  usuarios, gente externa…) no se tocan ni deben cambiar de aspecto.
- **Alcance (acotado):** NO se toca la regla de que el resto del padrón es de solo lectura, ni el
  panel de detalle, que sigue siendo válido para clasificar una ficha suelta.

## Non-goals

- Seleccionar "los N que cumplen el filtro" más allá de la página visible. Descartado a conciencia:
  permitiría escribir sobre miles de filas sin haberlas leído.
- Un valor único aplicado a toda la selección. Los sexos vienen mezclados y obligaría a recorrer cada
  página dos veces; el control por fila resuelve la página en una pasada.
- Deducir el sexo a partir del nombre.
- Editar cualquier otro campo del padrón desde la lista.
