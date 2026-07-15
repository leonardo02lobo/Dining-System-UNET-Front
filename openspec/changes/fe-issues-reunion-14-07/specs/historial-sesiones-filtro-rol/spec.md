## ADDED Requirements

### Requirement: Filtro por rol en los entrantes de la sesión

El detalle de entrantes de una sesión SHALL ofrecer un control para **filtrar por rol**
(estudiante / administrativo / docente / obrero, más "Todos"). El filtrado SHALL aplicarse en el
cliente sobre `user_type` de los entrantes ya cargados y SHALL convivir con el filtro existente
"Solo acceso directo".

#### Scenario: Filtrar por un rol concreto

- **WHEN** el usuario elige el rol "Docente"
- **THEN** la tabla muestra únicamente los entrantes cuyo `user_type` es docente

#### Scenario: Opción "Todos"

- **WHEN** el usuario elige "Todos"
- **THEN** se muestran todos los entrantes y el filtro sigue combinándose con "Solo acceso directo"
