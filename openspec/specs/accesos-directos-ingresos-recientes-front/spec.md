# accesos-directos-ingresos-recientes-front Specification

## Purpose
TBD - created by archiving change fe-sesiones-propiedad-y-accesos-recientes. Update Purpose after archive.
## Requirements
### Requirement: Panel de últimos ingresos en el módulo de accesos directos

La pantalla `/accesos_directos` SHALL mostrar un panel "Últimos ingresos" con los **últimos diez**
ingresos registrados por personas del módulo, obtenidos de `GET /accesos_directos/recent-entries`.

El panel SHALL ubicarse por encima de los filtros y de la tabla del padrón, y SHALL construirse con
los primitivos existentes (`Card`, `Table`, `Badge`) sin añadir componentes nuevos a
`components/ui/`.

Cada fila SHALL mostrar la persona (nombre completo y cédula), el tipo de persona, el motivo de
acceso, la sede, el origen del ingreso —**Taquilla** o **Manual**— y la hora en horario local.

La cabecera del panel SHALL indicar cuántos ingresos se muestran sobre el total (`{mostrados} de
{total}`), de modo que quede claro que es una ventana y no el listado completo.

#### Scenario: Se muestran los diez últimos ingresos

- **GIVEN** un administrador en `/accesos_directos`
- **WHEN** la pantalla termina de cargar
- **THEN** el panel lista diez ingresos, del más reciente al más antiguo
- **AND** cada fila muestra persona, cédula, tipo, motivo, sede, origen y hora

#### Scenario: La cabecera sitúa la ventana sobre el total

- **GIVEN** 1.483 ingresos registrados en total
- **WHEN** se carga el panel
- **THEN** la cabecera indica que se muestran 10 de 1.483

#### Scenario: Ingreso manual sin sede

- **GIVEN** un ingreso registrado manualmente, cuya sesión no tiene sede
- **WHEN** aparece en el panel
- **THEN** la columna de sede muestra un guion
- **AND** el origen se rotula "Manual"

#### Scenario: Persona sin motivo de acceso

- **WHEN** un ingreso corresponde a una persona sin motivo de acceso asignado
- **THEN** la columna de motivo muestra un guion, sin celda en blanco ni error

#### Scenario: Sin ingresos registrados

- **WHEN** no hay ningún ingreso que mostrar
- **THEN** el panel muestra "Todavía no hay ingresos registrados."
- **AND** la tabla del padrón se sigue mostrando con normalidad

### Requirement: Conmutador de solo prioritarios y refresco manual

El panel SHALL ofrecer un conmutador **"Solo prioritarios"** que, al activarse, vuelva a pedir el
listado con `only_priority=true`, y un botón de refresco que repita la consulta vigente.

El panel SHALL recargarse tras un alta, una edición o un borrado de acceso directo hechos desde la
misma pantalla.

El panel NO SHALL refrescarse de forma periódica. El *polling* de 15 s existe en el registro al
comedor porque varias taquillas comparten sesión; esta es una pantalla de gestión y una petición
periódica adicional no aporta nada.

#### Scenario: Filtrar por prioritarios

- **GIVEN** ingresos de personas prioritarias y no prioritarias
- **WHEN** se activa "Solo prioritarios"
- **THEN** el panel vuelve a consultar y muestra únicamente ingresos de personas prioritarias

#### Scenario: Refresco manual

- **WHEN** se pulsa el botón de refrescar
- **THEN** el panel vuelve a consultar con el conmutador tal y como esté

#### Scenario: Alta de una persona recarga el panel

- **WHEN** se crea un acceso directo desde la pantalla
- **THEN** además de la tabla del padrón, el panel se vuelve a consultar

### Requirement: Los filtros del padrón no alteran el panel

Los filtros de la tabla del padrón —búsqueda, estado, tipo de persona y motivo— NO SHALL afectar al
contenido del panel de ingresos recientes.

Son dos preguntas distintas: quién está dado de alta y quién acaba de entrar. Si el panel siguiera al
buscador, escribir en él cambiaría la lista de ingresos, que es un resultado que nadie pidió.

#### Scenario: Escribir en el buscador no toca el panel

- **GIVEN** el panel con diez ingresos cargados
- **WHEN** se escribe un nombre en el buscador del padrón
- **THEN** la tabla del padrón se filtra
- **AND** el panel de ingresos recientes conserva las mismas diez filas

#### Scenario: Cambiar el filtro de estado no toca el panel

- **WHEN** se selecciona el estado "Suspendido" en los filtros del padrón
- **THEN** el panel de ingresos recientes no cambia

### Requirement: Un fallo del panel no bloquea la pantalla

Cuando la consulta de ingresos recientes falle, la pantalla SHALL avisar mediante `notify.error` y
SHALL dejar el panel vacío, manteniendo operativa la tabla del padrón y sus acciones.

La gestión del padrón es la función principal de `/accesos_directos`; un panel informativo caído no
SHALL impedirla.

#### Scenario: El endpoint de ingresos falla

- **WHEN** `GET /accesos_directos/recent-entries` responde con error
- **THEN** se muestra una notificación de error
- **AND** la tabla del padrón se carga y se puede crear, editar y eliminar con normalidad

