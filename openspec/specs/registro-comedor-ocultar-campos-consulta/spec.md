# registro-comedor-ocultar-campos-consulta Specification

## Purpose
TBD - created by archiving change fe-registro-comedor-ocultar-campos-consulta. Update Purpose after archive.
## Requirements
### Requirement: Ocultar sede y cédula con un estudiante consultado

La pantalla de registro al comedor SHALL ocultar los controles de sede y de cédula mientras se
muestra un estudiante consultado, y SHALL restaurarlos cuando no hay estudiante en pantalla (tras
guardar el registro, cancelar la consulta, o limpiar). La sede seleccionada y el estado de la
sesión SHALL preservarse mientras los controles están ocultos, y SHALL permanecer visibles en una
franja compacta mientras hay una persona consultada. La ficha del estudiante SHALL ofrecer una
acción explícita de cancelar que restaura los campos sin registrar consumo.

#### Scenario: Consultar oculta los campos

- **WHEN** el usuario consulta una cédula y se muestra la tarjeta del estudiante
- **THEN** el selector de sede y la barra de búsqueda de cédula dejan de mostrarse, pero la sede
  activa y el estado de la sesión siguen visibles en una franja compacta

#### Scenario: Guardar restaura los campos

- **WHEN** el usuario registra el consumo (o limpia) y ya no hay estudiante en pantalla
- **THEN** el selector de sede y la barra de búsqueda de cédula vuelven a mostrarse

#### Scenario: Cancelar sin registrar restaura los campos

- **WHEN** el usuario consultó a una persona por error (o quiere verificar otra cédula) y pulsa
  "Cancelar / Consultar otra persona"
- **THEN** la ficha se limpia sin registrar ningún consumo y el selector de sede y la barra de
  búsqueda de cédula vuelven a mostrarse

#### Scenario: La sede se conserva

- **WHEN** los controles se ocultan al consultar y luego reaparecen
- **THEN** la sede seleccionada y el estado de la sesión siguen siendo los mismos

#### Scenario: Escaneo tras registrar

- **WHEN** tras registrar reaparece la barra de cédula y se pasa un nuevo carnet por el lector
- **THEN** se inicia una nueva consulta con normalidad

