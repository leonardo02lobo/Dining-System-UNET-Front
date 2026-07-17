# historial-sesiones-graficas Specification

## Purpose
TBD - created by archiving change fe-issues-reunion-14-07. Update Purpose after archive.
## Requirements
### Requirement: Modal de gráficas de la sesión

El Historial de Sesiones SHALL ofrecer un botón que abra un **modal con gráficas** de la sesión
seleccionada, calculadas en el cliente sobre los entrantes ya cargados. El modal SHALL incluir tres
gráficas: (a) **género** (hombre/mujer/no especificado), (b) **carrera** contando únicamente a los
estudiantes (`user_type === STUDENT`) y normalizando contra el set fijo [informatica, civil,
mecanica, psicologia, electronica, arquitectura, musica, produccion animal] con el resto agrupado
como "Otras", y (c) **rol** (estudiante/administrativo/docente/obrero). Los no-estudiantes SHALL
tener carrera nula y no aportar a la gráfica de carreras.

#### Scenario: Modal muestra las tres gráficas

- **WHEN** el usuario abre el modal de gráficas de una sesión con entrantes
- **THEN** ve una gráfica de género, una de carreras (solo estudiantes) y una de rol

#### Scenario: No-estudiante no aporta a carreras

- **WHEN** un entrante no es estudiante
- **THEN** su carrera es nula y no cuenta en la gráfica de carreras

#### Scenario: Carrera fuera del set fijo

- **WHEN** un estudiante tiene una carrera que no está en el set pedido
- **THEN** se contabiliza en la categoría "Otras"

