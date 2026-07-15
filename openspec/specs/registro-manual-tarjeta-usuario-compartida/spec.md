# registro-manual-tarjeta-usuario-compartida Specification

## Purpose
TBD - created by archiving change fe-registro-manual-tarjeta-usuario-compartida. Update Purpose after archive.
## Requirements
### Requirement: Ficha de usuario consultada compartida

El frontend SHALL presentar al estudiante consultado mediante un componente único reutilizable, y
el registro manual SHALL usar ese mismo componente en lugar de un maquetado propio. La ficha SHALL
mostrar de forma consistente los datos del estudiante (identificación, nombre, correo y estado) y
permitir acciones específicas de cada pantalla mediante un slot.

#### Scenario: Registro manual usa la ficha compartida

- **WHEN** en el registro manual se consulta un estudiante existente
- **THEN** sus datos se muestran con el mismo componente de ficha que usan las demás pantallas de consulta

#### Scenario: Consistencia de datos mostrados

- **WHEN** se muestra la ficha de un estudiante
- **THEN** presenta identificación, nombre, correo y estado con el mismo formato en todas las pantallas que la usan

#### Scenario: Acciones por pantalla mediante slot

- **WHEN** una pantalla necesita botones propios (p. ej. "Guardar registro" en el manual)
- **THEN** esos botones se inyectan en el slot de acciones de la ficha sin duplicar su maquetado

