## ADDED Requirements

### Requirement: Catálogo de rutas del frontend alineado

El catálogo de rutas del frontend (`ROUTE_ACCESS`) SHALL reflejar las rutas reales de la aplicación
y mantener paridad con el catálogo del backend: SHALL incluir las rutas existentes con sus roles por
defecto y SHALL excluir las rutas retiradas (por ejemplo `/suspendStudent`).

#### Scenario: Ruta retirada fuera del catálogo

- **WHEN** se revisa `ROUTE_ACCESS` tras retirar el apartado de suspender usuario
- **THEN** `/suspendStudent` no figura en el catálogo y no aparece en la navegación

#### Scenario: Ruta real presente en el catálogo

- **WHEN** una ruta existe en la navegación/rutas de la app
- **THEN** figura en `ROUTE_ACCESS` con sus roles por defecto y su acceso se controla por catálogo/override

### Requirement: Gestión de permisos clara

La pantalla de gestión de permisos SHALL permitir seleccionar un usuario, ver el catálogo de rutas
con su estado (por defecto según rol u override) y editar y guardar los overrides por usuario, con
feedback del resultado.

#### Scenario: Editar y guardar overrides

- **WHEN** un SUPER_ADMIN activa o desactiva rutas para un usuario y guarda
- **THEN** los overrides se persisten y se refleja el resultado del guardado

#### Scenario: Estado por defecto vs. override

- **WHEN** se muestra una ruta sin override para el usuario
- **THEN** su estado corresponde al rol por defecto del usuario
