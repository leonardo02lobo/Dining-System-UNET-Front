## MODIFIED Requirements

### Requirement: Catálogo de rutas del frontend alineado

El catálogo de rutas del frontend (`ROUTE_ACCESS`) SHALL reflejar las rutas reales de la aplicación
y mantener paridad con el catálogo del backend: SHALL incluir las rutas existentes con sus roles por
defecto y SHALL excluir las rutas retiradas (por ejemplo `/suspendStudent`).

El catálogo SHALL incluir `/auditoria/procesos` con `SUPER_ADMIN` y `ADMIN` por defecto, gemela de la
entrada del backend, y SHALL mantenerla separada de `/auditoria`: conceder la auditoría de accesos NO
SHALL conceder el historial de procesos.

La paridad SHALL admitir una excepción explícita: una ruta abierta a **cualquier sesión activa**, cuyo
endpoint el servidor ya acota al propio usuario, SHALL quedar **fuera** del catálogo. Catalogarla la
haría revocable desde la gestión de permisos sin que el servidor respete esa revocación, y el
resultado sería una pantalla negada por el cliente sobre datos que la API sigue entregando. La
excepción SHALL constar como comentario en `ROUTE_ACCESS`, para que una revisión posterior de paridad
no la deshaga. `/mi-actividad` es esa ruta.

#### Scenario: Ruta retirada fuera del catálogo

- **WHEN** se revisa `ROUTE_ACCESS` tras retirar el apartado de suspender usuario
- **THEN** `/suspendStudent` no figura en el catálogo y no aparece en la navegación

#### Scenario: Ruta real presente en el catálogo

- **WHEN** una ruta existe en la navegación/rutas de la app
- **THEN** figura en `ROUTE_ACCESS` con sus roles por defecto y su acceso se controla por catálogo/override

#### Scenario: Historial de procesos catalogado

- **WHEN** se revisa `ROUTE_ACCESS`
- **THEN** `/auditoria/procesos` figura con `SUPER_ADMIN` y `ADMIN` por defecto
- **AND** coincide con la entrada del catálogo del backend

#### Scenario: Auditoría de accesos e historial de procesos por separado

- **GIVEN** una cuenta con permiso sobre `/auditoria` y sin permiso sobre `/auditoria/procesos`
- **WHEN** abre la navegación
- **THEN** ve la entrada de Auditoría de Acceso y no la de Historial de Procesos

#### Scenario: Ruta abierta fuera del catálogo

- **WHEN** se revisa `ROUTE_ACCESS`
- **THEN** `/mi-actividad` no figura en él
- **AND** la razón queda escrita junto al catálogo
- **AND** cualquier sesión activa puede abrirla
