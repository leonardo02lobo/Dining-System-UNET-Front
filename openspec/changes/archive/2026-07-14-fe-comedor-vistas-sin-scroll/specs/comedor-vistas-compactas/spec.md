## ADDED Requirements

### Requirement: Vistas de comedor operables sin scroll

Las vistas de consulta de consumo y registro de comedor SHALL presentar toda la información y
las acciones de forma operable sin requerir scroll vertical en la resolución objetivo, sin
recortar contenido.

#### Scenario: Consulta sin scroll

- **WHEN** el usuario abre `/comedor/consultar` en la resolución objetivo y consulta una cédula
- **THEN** los datos del resultado y las acciones son visibles y operables sin scroll

#### Scenario: Registro sin scroll

- **WHEN** el usuario abre `/comedor/registrar` en la resolución objetivo con un estudiante consultado
- **THEN** el estado (activo/suspendido) y el botón de registrar quedan visibles sin scroll

#### Scenario: No se recorta contenido

- **WHEN** la vista se muestra en una resolución menor a la objetivo
- **THEN** el contenido no queda recortado (no se oculta con alturas fijas + overflow); a lo
  sumo reaparece el scroll como degradación aceptable
