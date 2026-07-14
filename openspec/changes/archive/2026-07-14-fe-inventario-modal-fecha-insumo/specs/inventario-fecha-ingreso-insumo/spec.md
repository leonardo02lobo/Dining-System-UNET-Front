## ADDED Requirements

### Requirement: Fecha de ingreso al cargar un insumo

El modal de "Cargar Insumo" SHALL ofrecer un input de fecha de ingreso (default hoy, sin
fechas futuras) y registrar el stock inicial como una entrada con esa fecha vía
`POST /inventory/items/{id}/stock/increase`.

#### Scenario: Cargar insumo con fecha elegida

- **WHEN** el usuario crea un insumo con stock inicial y selecciona una fecha de ingreso
- **THEN** el insumo queda con ese stock y la entrada se registra con la fecha seleccionada

#### Scenario: Sin seleccionar fecha

- **WHEN** el usuario crea un insumo sin cambiar la fecha (default hoy)
- **THEN** la entrada se registra con la fecha actual

#### Scenario: No se permiten fechas futuras

- **WHEN** el usuario intenta seleccionar una fecha futura
- **THEN** el input lo impide (max = hoy) y el backend también la rechazaría

#### Scenario: Alta sin stock inicial

- **WHEN** el usuario crea un insumo con stock inicial 0
- **THEN** no se registra ninguna entrada de stock y el insumo se crea correctamente
