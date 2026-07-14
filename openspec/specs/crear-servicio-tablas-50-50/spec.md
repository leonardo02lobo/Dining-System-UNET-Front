# crear-servicio-tablas-50-50 Specification

## Purpose
TBD - created by archiving change fe-crear-servicio-tablas-50-50. Update Purpose after archive.
## Requirements
### Requirement: Dos tablas paralelas 50/50 en Crear servicio de alimentación

La pantalla de creación de servicio de alimentación SHALL mostrar la tabla de ingredientes y
la de recálculo automático como dos tablas paralelas con el mismo estilo visual, ocupando cada
una ~50% del ancho en pantallas anchas, manteniendo el propósito propio de cada tabla.

#### Scenario: Disposición 50/50 con mismo estilo

- **WHEN** el usuario abre "Crear servicio de alimentación" en pantalla ancha
- **THEN** ve dos tablas de igual apariencia al 50/50: ingredientes a un lado y recálculo
  automático al otro

#### Scenario: Apilado responsivo

- **WHEN** el usuario abre la pantalla en un ancho reducido
- **THEN** las dos tablas se apilan verticalmente sin romperse

### Requirement: Botón "Agregar Ingrediente" centrado bajo ambas tablas

El botón "Agregar Ingrediente" SHALL ubicarse en la región central, debajo de ambas tablas, y
abrir el modal de alta de ingrediente.

#### Scenario: Ubicación del botón

- **WHEN** el usuario mira ambas tablas
- **THEN** el botón "Agregar Ingrediente" aparece centrado debajo de ambas

#### Scenario: El botón abre el modal de alta

- **WHEN** el usuario presiona "Agregar Ingrediente"
- **THEN** se abre el modal para agregar un ingrediente

### Requirement: Recálculo en vivo preservado

La tabla de recálculo SHALL seguir actualizándose en vivo al cambiar la cantidad de platos o
los ingredientes, y permitir aplicar el recálculo.

#### Scenario: Actualización en vivo

- **WHEN** el usuario cambia la cantidad de platos deseada o los ingredientes
- **THEN** la tabla de recálculo refleja las nuevas cantidades

#### Scenario: Aplicar recálculo

- **WHEN** hay un recálculo válido y el usuario presiona "Aplicar recálculo"
- **THEN** se aplican las cantidades recalculadas a los ingredientes

