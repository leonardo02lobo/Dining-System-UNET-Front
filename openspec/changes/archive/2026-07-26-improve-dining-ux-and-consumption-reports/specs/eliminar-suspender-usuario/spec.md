## REMOVED Requirements

### Requirement: El apartado de suspender usuario no existe en el frontend

**Reason**: Esta spec quedó desactualizada: en algún cambio posterior a su archivo, la pantalla
"Suspender Usuario" fue reintroducida (ruta `/comedor/suspender`, ítem de navegación,
`SuspendStudent.tsx`) sin que se revirtiera formalmente esta spec. La pantalla está activa, en uso,
y es una de las que este mismo cambio (`improve-dining-ux-and-consumption-reports`) modifica —
mantener esta spec como está haría que las specs del proyecto contradigan el comportamiento real.

**Migration**: Ver el requirement "La pantalla Suspender Usuario existe y está disponible" más
abajo, que documenta el estado actual.

## ADDED Requirements

### Requirement: La pantalla Suspender Usuario existe y está disponible

La app SHALL exponer la pantalla "Suspender Usuario" en la ruta `/comedor/suspender`, con su ítem
de navegación correspondiente bajo el grupo "Comedor", visible para los roles `SUPER_ADMIN`,
`ADMIN` y `TAQUILLERO`. La pantalla SHALL permitir consultar una persona por cédula y suspenderla o
reactivar su acceso, mostrando sus datos mediante la ficha compartida (ver
`registro-manual-tarjeta-usuario-compartida`).

#### Scenario: La ruta resuelve la pantalla

- **WHEN** se navega a `/comedor/suspender`
- **THEN** se renderiza la pantalla de suspender usuario

#### Scenario: El ítem de navegación está visible

- **WHEN** un usuario con rol `SUPER_ADMIN`, `ADMIN` o `TAQUILLERO` abre la navegación
- **THEN** aparece el ítem "Suspender Usuario" bajo "Comedor"

#### Scenario: Consultar y suspender una persona

- **WHEN** el usuario consulta a una persona por cédula y confirma la suspensión
- **THEN** la persona queda suspendida y ya no puede registrar consumo hasta que se reactive su
  acceso
