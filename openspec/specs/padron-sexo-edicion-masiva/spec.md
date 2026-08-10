# padron-sexo-edicion-masiva Specification

## Purpose
TBD - created by archiving change fe-padron-sexo-masivo. Update Purpose after archive.
## Requirements
### Requirement: La cola de clasificación es el estado de origen de la pantalla


`/estudiantes` SHALL arrancar con el filtro **"Sin sexo asignado"** activado.

Quien entra al padrón entra a clasificar: es el único campo que la pantalla puede escribir, y el CSV
oficial no lo trae. Arrancar con las 8.380 filas mezcladas obliga a recordar el filtro y deja a la
vista lo que se acaba de clasificar.

El filtro SHALL seguir siendo desactivable para consultar el padrón completo.

El filtro SHALL resolverse en el servidor, de modo que el total mostrado sea el de lo que falta por
clasificar y no el de la página en pantalla.

#### Scenario: Entrada a la pantalla

- **WHEN** un administrador abre `/estudiantes`
- **THEN** el filtro "Sin sexo asignado" aparece activado
- **AND** el listado contiene solo estudiantes sin sexo

#### Scenario: Consultar el padrón completo

- **WHEN** se desactiva el filtro
- **THEN** el listado incluye también a los ya clasificados

#### Scenario: Las filas guardadas desaparecen

- **GIVEN** el filtro por defecto y varias filas clasificadas sin guardar
- **WHEN** se guarda
- **THEN** esas filas ya no aparecen en el listado recargado

### Requirement: El sexo se asigna desde la lista, fila a fila


La columna "Sexo" SHALL ofrecer un control de dos opciones (M / F) en cada fila, en lugar del
indicador de solo lectura actual.

Elegir un valor SHALL dejar la fila **pendiente** y NO SHALL guardarla.

Cada fila SHALL llevar su propio valor: los sexos vienen mezclados y un valor único para toda la
selección obligaría a recorrer cada página dos veces.

Una fila con valor pendiente SHALL distinguirse visualmente de una con el valor ya guardado.

El control SHALL construirse con botones y `aria-pressed`, no con un desplegable: dos opciones no lo
justifican y el objetivo es un clic por fila.

#### Scenario: Asignar el sexo de una fila

- **WHEN** se pulsa M en una fila
- **THEN** la fila queda marcada como pendiente con el valor M
- **AND** no se emite ninguna petición al servidor

#### Scenario: Cambiar de opinión antes de guardar

- **GIVEN** una fila pendiente con M
- **WHEN** se pulsa F en esa misma fila
- **THEN** el valor pendiente pasa a F

#### Scenario: Distinguir lo pendiente de lo guardado

- **GIVEN** una fila ya clasificada y otra recién marcada
- **WHEN** se miran ambas
- **THEN** la pendiente se distingue visualmente de la guardada

### Requirement: Selección de filas acotada a la página visible


La lista SHALL ofrecer una casilla por fila y una casilla de cabecera que marque o desmarque **las
filas visibles**, con estado indeterminado cuando la selección sea parcial.

La selección NO SHALL poder extenderse más allá de la página visible. El sexo se deduce leyendo el
nombre; una acción que escriba sobre miles de filas que nadie ha mirado no sería clasificar.

Elegir un sexo en una fila SHALL marcar su casilla automáticamente: elegir el valor ya es la
declaración de intención, y exigir además una marca solo produciría trabajo perdido.

Desmarcar la casilla de una fila SHALL descartar su valor pendiente.

Una fila marcada **sin** valor elegido NO SHALL producir ninguna escritura ni ningún aviso: no hay
nada que guardar.

#### Scenario: Marcar toda la página

- **GIVEN** una página con 50 estudiantes
- **WHEN** se pulsa la casilla de cabecera
- **THEN** quedan marcadas las 50 filas visibles
- **AND** no se marca ninguna fila de otras páginas

#### Scenario: Selección parcial

- **GIVEN** algunas filas marcadas y otras no
- **WHEN** se observa la casilla de cabecera
- **THEN** se muestra en estado indeterminado

#### Scenario: Elegir el sexo marca la fila

- **GIVEN** una fila sin marcar
- **WHEN** se pulsa F en esa fila
- **THEN** su casilla queda marcada

#### Scenario: Desmarcar descarta el valor pendiente

- **GIVEN** una fila pendiente con M
- **WHEN** se desmarca su casilla
- **THEN** deja de contarse como cambio pendiente
- **AND** la fila recupera el valor que tenía guardado

#### Scenario: Fila marcada sin valor

- **GIVEN** una fila marcada a la que no se le eligió sexo
- **WHEN** se guarda
- **THEN** esa fila no se envía
- **AND** no se muestra ningún error por ella

### Requirement: Un único guardado para todos los cambios pendientes


La pantalla SHALL mostrar una barra de acciones cuando haya al menos un cambio pendiente, con el
número de cambios, **Guardar** y **Descartar**.

**Guardar** SHALL enviar todos los cambios pendientes en **una sola** petición a
`PATCH /students/bulk/gender`, y SHALL quedar deshabilitado mientras la petición esté en curso.

Tras un guardado correcto la pantalla SHALL informar del número de filas **realmente actualizadas**
que devuelve el servidor, SHALL limpiar los cambios pendientes y la selección, y SHALL recargar el
listado.

Cuando el servidor informe de filas fallidas, la pantalla SHALL avisarlo enumerándolas, aunque el
resto se haya aplicado. Un lote parcialmente aplicado anunciado como éxito es peor que un error.

**Descartar** SHALL limpiar los cambios pendientes y la selección sin pedir confirmación: descartar
es reversible —basta volver a marcarlos— y guardar no.

#### Scenario: La barra aparece con el primer cambio

- **GIVEN** ningún cambio pendiente
- **WHEN** se elige el sexo de una fila
- **THEN** aparece la barra indicando 1 cambio pendiente

#### Scenario: Guardado en una sola petición

- **GIVEN** doce filas pendientes
- **WHEN** se pulsa Guardar
- **THEN** se emite una única petición con las doce filas

#### Scenario: Se informa de lo realmente actualizado

- **GIVEN** un lote de diez filas de las que el servidor actualiza ocho e informa dos sin cambio
- **WHEN** termina el guardado
- **THEN** el aviso de éxito habla de ocho estudiantes clasificados

#### Scenario: Lote parcialmente fallido

- **GIVEN** un lote en el que el servidor informa de una fila fallida
- **WHEN** termina el guardado
- **THEN** además del éxito se avisa del fallo, enumerando la fila afectada

#### Scenario: Descartar

- **GIVEN** varios cambios pendientes
- **WHEN** se pulsa Descartar
- **THEN** desaparecen los cambios pendientes y la selección
- **AND** no se emite ninguna petición

### Requirement: Los cambios sin guardar no se pierden en silencio


Cambiar de página, modificar cualquier filtro o desactivar "Sin sexo asignado" con cambios
pendientes SHALL abrir una confirmación que indique cuántos se perderán, con la opción de continuar
descartándolos o de cancelar.

La confirmación SHALL usar el componente `Modal` del proyecto. NO SHALL usarse `confirm()`,
`alert()` ni `prompt()`: fallan en silencio dentro del *webview* de Tauri y
`nativeDialogs.guard.test.ts` es la prueba de regresión que lo vigila.

Si un guardado falla por completo, los cambios pendientes SHALL conservarse para poder reintentar sin
volver a clasificar a mano.

#### Scenario: Cambiar de página con cambios pendientes

- **GIVEN** seis cambios pendientes
- **WHEN** se pulsa la página siguiente
- **THEN** se pide confirmación indicando que se perderán seis cambios

#### Scenario: Cancelar la confirmación

- **WHEN** se cancela esa confirmación
- **THEN** la pantalla permanece en la misma página
- **AND** los cambios pendientes siguen ahí

#### Scenario: Continuar descartando

- **WHEN** se confirma continuar
- **THEN** se cambia de página y los cambios pendientes desaparecen

#### Scenario: Un guardado fallido conserva el trabajo

- **GIVEN** veinte cambios pendientes
- **WHEN** la petición de guardado falla por completo
- **THEN** se avisa del error
- **AND** los veinte cambios pendientes siguen disponibles para reintentar

#### Scenario: Sin diálogos nativos

- **WHEN** se revisa la implementación de la confirmación
- **THEN** se usa el componente `Modal`
- **AND** `nativeDialogs.guard.test.ts` sigue en verde
