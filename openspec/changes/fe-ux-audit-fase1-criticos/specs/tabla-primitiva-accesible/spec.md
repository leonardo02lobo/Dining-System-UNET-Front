## ADDED Requirements

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
