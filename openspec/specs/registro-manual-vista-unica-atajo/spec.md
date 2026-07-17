# registro-manual-vista-unica-atajo Specification

## Purpose
TBD - created by archiving change fe-issues-reunion-14-07. Update Purpose after archive.
## Requirements
### Requirement: Registro Manual en vista única y guardado con flecha ↓

La pantalla Registro Manual SHALL guardar el registro al presionar la **flecha hacia abajo (↓)**,
replicando el atajo de Registro al Comedor: solo cuando hay una persona consultada y el guardado es
válido, y respetando SELECT/TEXTAREA y estados (no guardar mientras se guarda o con un modal de
edición abierto). Además, la pantalla SHALL presentarse en **una sola vista sin scroll de página** en
la resolución objetivo; si el listado es largo, SHALL desplazarse en su propio contenedor.

#### Scenario: Guardar con la flecha ↓

- **WHEN** hay una persona consultada y el usuario presiona ↓ fuera de un SELECT/TEXTAREA
- **THEN** se guarda el registro sin usar el ratón

#### Scenario: No guardar en estados inválidos

- **WHEN** no hay persona consultada, se está guardando, o hay un modal de edición abierto
- **THEN** la flecha ↓ no guarda

#### Scenario: Vista sin scroll de página

- **WHEN** se muestra Registro Manual en la resolución objetivo
- **THEN** la vista se ve completa sin scroll de página; el listado, si es largo, scrollea en su
  propio contenedor

