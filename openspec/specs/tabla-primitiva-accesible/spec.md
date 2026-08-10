# tabla-primitiva-accesible Specification

## Purpose
TBD - created by archiving change fe-ux-audit-fase1-criticos. Update Purpose after archive.
## Requirements
### Requirement: Las acciones de fila no disparan el clic de fila

En la primitiva `Table`, cuando una fila tiene `onRowClick` y también `actions`, un clic dentro de
la celda de acciones SHALL detener la propagación del evento y SHALL NOT disparar `onRowClick` de
esa fila.

#### Scenario: Pulsar un botón de acción no abre el detalle de la fila

- **WHEN** una tabla tiene `onRowClick` y `actions` definidos, y el usuario pulsa un botón dentro de
  la celda de acciones
- **THEN** se ejecuta solo la acción del botón, sin disparar `onRowClick`

### Requirement: Las filas clicables son alcanzables por teclado

Cuando `Table` recibe `onRowClick`, cada fila SHALL ser focalizable (`tabIndex={0}`) y SHALL
activarse con `Enter` o `Espacio`, además del clic de ratón.

#### Scenario: Activar una fila con el teclado

- **WHEN** el usuario navega con `Tab` hasta una fila con `onRowClick` y presiona `Enter` o
  `Espacio`
- **THEN** se ejecuta `onRowClick` para esa fila

### Requirement: El primitivo de tabla admite selección de filas


`Table` SHALL aceptar las props opcionales `selectedKeys` y `onSelectionChange`, y SHALL renderizar
una columna de casillas **solo** cuando reciba ambas.

Sin esas props el componente SHALL comportarse exactamente igual que antes: misma cabecera, mismas
columnas y ningún cambio de aspecto. `Table` lo consumen ocho pantallas y ninguna de ellas SHALL
verse afectada por este añadido.

La cabecera SHALL incluir una casilla que marque o desmarque las filas visibles, y SHALL mostrarse en
estado **indeterminado** cuando solo algunas lo estén.

El componente NO SHALL guardar el estado de la selección: SHALL elevarlo al padre a través de
`onSelectionChange`. Quien consume la selección necesita cruzarla con otros datos de la pantalla, y
una copia interna acabaría divergiendo.

#### Scenario: Sin las props de selección no hay columna de casillas

- **WHEN** se renderiza una tabla sin `selectedKeys` ni `onSelectionChange`
- **THEN** no aparece ninguna columna de selección
- **AND** el número de columnas es el de siempre

#### Scenario: La casilla de cabecera marca lo visible

- **GIVEN** una tabla con selección y ninguna fila marcada
- **WHEN** se pulsa la casilla de cabecera
- **THEN** se notifican como seleccionadas todas las filas visibles

#### Scenario: Estado indeterminado

- **GIVEN** una tabla con parte de sus filas marcadas
- **WHEN** se observa la casilla de cabecera
- **THEN** se muestra en estado indeterminado, ni marcada ni vacía

#### Scenario: El padre es el dueño del estado

- **WHEN** se marca una fila
- **THEN** el componente notifica la nueva selección completa
- **AND** no muestra la fila como marcada hasta que el padre le devuelva esa selección

### Requirement: La casilla de selección no dispara el clic de fila


Un clic sobre la casilla de selección NO SHALL disparar `onRowClick`.

Es la misma regla que ya rige para la columna de acciones, y por el mismo motivo: en una tabla cuyas
filas abren un detalle, marcar una casilla abriría además el panel de esa fila.

#### Scenario: Marcar una fila en una tabla con filas clicables

- **GIVEN** una tabla con `onRowClick` y selección activada
- **WHEN** se pulsa la casilla de una fila
- **THEN** la fila queda marcada
- **AND** no se invoca `onRowClick`

### Requirement: Las casillas de selección son identificables con lector de pantalla


Cada casilla de fila SHALL llevar un texto accesible que identifique **a qué fila pertenece**, y no
una etiqueta genérica repetida.

Una columna de cincuenta casillas anunciadas todas como "Seleccionar" es inservible con lector de
pantalla: no permite saber cuál se está marcando.

La casilla de cabecera SHALL identificarse como la de seleccionar todas las filas visibles.

#### Scenario: Casilla de fila

- **WHEN** un lector de pantalla llega a la casilla de una fila
- **THEN** anuncia a qué fila corresponde

#### Scenario: Casilla de cabecera

- **WHEN** un lector de pantalla llega a la casilla de la cabecera
- **THEN** la anuncia como la de seleccionar todas las filas visibles
