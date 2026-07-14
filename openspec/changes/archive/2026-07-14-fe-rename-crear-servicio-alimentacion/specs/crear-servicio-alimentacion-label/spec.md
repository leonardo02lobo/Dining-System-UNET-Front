## ADDED Requirements

### Requirement: Rótulo "Crear servicio de alimentación"

La sección de creación de almuerzos SHALL mostrarse como "Crear servicio de alimentación"
tanto en la navegación como en el encabezado de la página, manteniendo la ruta
`/inventario/crear`.

#### Scenario: Etiqueta en la navegación

- **WHEN** el usuario ve el menú lateral en el grupo Inventario
- **THEN** el ítem que enlaza a `/inventario/crear` muestra "Crear servicio de alimentación"
  en lugar de "Crear Almuerzo"

#### Scenario: Título de la página

- **WHEN** el usuario navega a `/inventario/crear`
- **THEN** el encabezado de la página muestra "Crear servicio de alimentación"

#### Scenario: La ruta no cambia

- **WHEN** se aplica el renombrado
- **THEN** la ruta sigue siendo `/inventario/crear` y los enlaces existentes siguen funcionando
