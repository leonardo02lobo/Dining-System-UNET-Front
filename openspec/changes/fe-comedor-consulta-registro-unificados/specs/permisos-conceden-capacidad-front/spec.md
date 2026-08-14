## ADDED Requirements

### Requirement: Dos permisos que abren la misma pantalla con capacidad distinta

Cuando una pantalla admita varios permisos de ruta, el sistema SHALL distinguir **abrirla** de
**operar en ella**.

El sistema SHALL declarar esas equivalencias en un único sitio (`ROUTE_ALIASES` en
`src/config/routeAccess.ts`) y SHALL exponer `canOpen(ruta)` para la guarda de navegación y el menú.

`canAccess` SHALL permanecer estricta y seguir respondiendo por la **capacidad**. Ampliarla con los
alias convertiría un permiso de solo consulta en permiso de operación dentro del cliente, y el 403
del servidor sería la primera noticia de la diferencia.

Cada acción SHALL seguir preguntando por su permiso exacto, el mismo que exige el endpoint que va a
invocar.

#### Scenario: El permiso alternativo abre la pantalla

- **GIVEN** un usuario con `/comedor/consultar` y sin `/comedor/registrar`
- **WHEN** navega a `/comedor/registrar`
- **THEN** la guarda le deja entrar

#### Scenario: El permiso alternativo no concede la acción

- **GIVEN** ese mismo usuario dentro de la pantalla
- **WHEN** consulta a una persona
- **THEN** no se le ofrece registrar el consumo

#### Scenario: El menú no ofrece pantallas duplicadas

- **GIVEN** un usuario con los dos permisos
- **WHEN** abre el menú
- **THEN** ve una sola entrada para la pantalla de comedor
