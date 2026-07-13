## ADDED Requirements

### Requirement: Distribución 70/30 en las vistas de inventario

Las vistas Registrar Inventario e Inventario General SHALL disponer la tabla y el panel de
resumen en una proporción 70/30 (tabla 70%, resumen 30%) en pantallas anchas, con apilado
responsivo en pantallas angostas.

#### Scenario: Proporción en pantalla ancha

- **WHEN** el usuario abre Inventario General o Registrar Inventario en una pantalla ancha (`xl`)
- **THEN** la tabla ocupa ~70% del ancho y el panel de resumen ~30%

#### Scenario: Apilado en pantalla angosta

- **WHEN** el usuario abre cualquiera de las dos vistas en una pantalla angosta
- **THEN** la tabla y el resumen se apilan verticalmente sin romperse

#### Scenario: El resumen llena su columna

- **WHEN** se muestra el panel de resumen en pantalla ancha
- **THEN** ocupa todo el ancho de su columna del 30% (sin quedar limitado a un ancho fijo estrecho)
