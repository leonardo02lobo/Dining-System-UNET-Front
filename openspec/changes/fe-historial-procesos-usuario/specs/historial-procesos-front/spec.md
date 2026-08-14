## ADDED Requirements

### Requirement: Pantalla de historial de procesos por persona

La aplicación SHALL ofrecer la pantalla `/auditoria/procesos` — *Historial de Procesos* — que muestra
las acciones registradas por el servidor, ordenadas de la más reciente a la más antigua.

La pantalla SHALL permitir seleccionar a una persona y, con una seleccionada, SHALL mostrar
únicamente sus entradas. **Sin** persona seleccionada SHALL mostrar el movimiento de todas las
cuentas, no una pantalla vacía: quien audita a menudo llega sabiendo cuándo pasó algo y no quién lo
hizo.

La persona seleccionada SHALL viajar en la URL como `?usuario=<id>`, de modo que el enlace pueda
compartirse y la navegación hacia atrás funcione.

La pantalla SHALL ser distinta de `/auditoria`, que sigue mostrando los inicios de sesión. Ninguna de
las dos SHALL absorber a la otra.

#### Scenario: Historial de una persona

- **WHEN** se selecciona a una persona en el historial de procesos
- **THEN** la tabla muestra solo sus entradas, de la más reciente a la más antigua
- **AND** la URL pasa a incluir `?usuario=<id>`

#### Scenario: Sin persona seleccionada

- **WHEN** se abre `/auditoria/procesos` sin parámetros
- **THEN** se muestra el movimiento de todas las cuentas

#### Scenario: Enlace directo a una persona

- **WHEN** se abre `/auditoria/procesos?usuario=7` directamente
- **THEN** la pantalla arranca con esa persona seleccionada y su historial cargado

#### Scenario: La auditoría de accesos permanece

- **WHEN** se abre `/auditoria`
- **THEN** sigue mostrando los inicios de sesión con su IP y su navegador, sin cambios

### Requirement: Cada entrada resume en la fila y explica en el detalle

La fila de la tabla SHALL mostrar: fecha y hora, persona (nombre y rol), acción, recurso con su
identificador, y un resumen de una línea.

Cada fila SHALL poder abrirse para ver el detalle, que SHALL incluir —cuando el servidor los aporte—
el antes y el después de cada campo modificado, el detalle en prosa, el método y la ruta, la IP y el
dispositivo.

El detalle SHALL abrirse **dentro de la tabla**, sin sacar al usuario de la lista: auditar consiste en
comparar entradas seguidas, y obligar a cerrar y reabrir para pasar a la siguiente entorpece la única
tarea de la pantalla.

Los valores que el servidor entrega redactados SHALL mostrarse tal como llegan, marcados como
redactados. La interfaz NO SHALL ocultar que ese campo cambió.

Una entrada sin detalle enriquecido SHALL seguir siendo legible: el resumen SHALL construirse con la
acción y el recurso cuando no haya texto que mostrar.

#### Scenario: Abrir el detalle de una entrada

- **WHEN** se abre una entrada que registra un cambio de rol
- **THEN** se muestra el campo modificado con su valor anterior y el nuevo
- **AND** la lista permanece visible

#### Scenario: Entrada sin detalle enriquecido

- **GIVEN** una entrada que solo trae método, ruta y recurso
- **WHEN** se muestra en la tabla
- **THEN** el resumen se compone con la acción y el recurso
- **AND** la fila no aparece vacía

#### Scenario: Campo redactado

- **WHEN** el detalle incluye un campo de contraseña redactado por el servidor
- **THEN** se muestra que ese campo cambió, con la marca de redactado
- **AND** no se muestra ningún valor de contraseña

### Requirement: Filtros combinables alimentados por el servidor

La pantalla SHALL ofrecer filtros de persona, acción, tipo de recurso, rango de fechas y búsqueda de
texto, combinables entre sí.

Las opciones de acción y de recurso SHALL obtenerse del catálogo que expone el servidor, y NO SHALL
escribirse a mano en el cliente: una lista fija queda desalineada en cuanto el servidor registra un
recurso nuevo, y ofrecer una opción sin resultados es peor que no ofrecerla.

Los rótulos legibles de cada acción y recurso SHALL vivir en el cliente. Un código sin rótulo conocido
SHALL mostrarse **en crudo** y NO SHALL ocultarse.

Al cambiar cualquier filtro, la paginación SHALL volver a la primera página.

#### Scenario: Filtros combinados

- **WHEN** se filtra por una persona, la acción "Eliminación" y un rango de fechas
- **THEN** la tabla muestra solo las eliminaciones de esa persona en ese rango
- **AND** el contador de resultados refleja el total filtrado, no el de la página

#### Scenario: Desplegables completos

- **WHEN** se abre el desplegable de acciones
- **THEN** contiene las acciones que el servidor declara, más la opción de no filtrar

#### Scenario: Acción sin rótulo conocido

- **GIVEN** una acción registrada por el servidor para la que el cliente no tiene rótulo
- **WHEN** aparece en la tabla o en el desplegable
- **THEN** se muestra su código tal cual

#### Scenario: Cambiar un filtro reinicia la paginación

- **GIVEN** la página 3 del historial
- **WHEN** se cambia el rango de fechas
- **THEN** la vista vuelve a la primera página del nuevo resultado

### Requirement: Se llega al historial desde la lista de usuarios

Cada fila de la Lista de Usuarios SHALL ofrecer la acción *Ver historial*, que abre
`/auditoria/procesos` con esa persona ya seleccionada.

La acción SHALL mostrarse únicamente a quien pueda abrir la pantalla de historial: ofrecer un camino
que termina en un rebote a la ruta por defecto es peor que no ofrecerlo.

#### Scenario: Ver historial desde la ficha

- **GIVEN** una cuenta con permiso sobre `/auditoria/procesos`
- **WHEN** usa *Ver historial* en la fila de una persona
- **THEN** se abre el historial de procesos con esa persona seleccionada

#### Scenario: Sin permiso, sin acción

- **GIVEN** una cuenta sin permiso sobre `/auditoria/procesos`
- **WHEN** abre la Lista de Usuarios
- **THEN** la acción *Ver historial* no se muestra

### Requirement: Cada quien puede ver su propia actividad

La aplicación SHALL ofrecer `/mi-actividad`, que muestra el historial del usuario de la sesión leyendo
el endpoint que el servidor ya acota a quien pregunta.

La pantalla SHALL estar disponible para **cualquier sesión activa**, con independencia del rol y de
los permisos concedidos, y SHALL usar la misma tabla y el mismo detalle que el historial por persona.

`/mi-actividad` NO SHALL incorporarse a `ROUTE_ACCESS`: catalogarla la haría revocable desde la
gestión de permisos, y quitarle a alguien el ver lo que él mismo hizo no es una decisión que el
sistema deba ofrecer.

#### Scenario: Un taquillero revisa lo suyo

- **GIVEN** una sesión con rol `TAQUILLERO`
- **WHEN** abre `/mi-actividad`
- **THEN** ve su propio historial de procesos
- **AND** no necesita ningún permiso de pantalla para ello

#### Scenario: No es una puerta al historial ajeno

- **WHEN** se manipula la URL de `/mi-actividad` para pedir otra persona
- **THEN** la pantalla sigue mostrando únicamente la actividad del usuario de la sesión

### Requirement: El historial mostrado se exporta

La pantalla SHALL permitir exportar el historial a CSV y a PDF.

La exportación SHALL respetar **los filtros activos** y SHALL abarcar todo el resultado filtrado, no
solo la página visible: quien exporta mientras mira la página 3 no está pidiendo la página 3.

Mientras la exportación está en curso, la acción SHALL indicarlo y SHALL evitar disparos repetidos. Un
fallo SHALL comunicarse con el aviso de error habitual de la aplicación y NO SHALL dejar la pantalla
en estado de carga.

#### Scenario: Exportar con filtros aplicados

- **GIVEN** el historial filtrado por una persona y un rango de fechas
- **WHEN** se exporta a CSV
- **THEN** el archivo contiene todas las entradas de ese filtro
- **AND** no solo las de la página en pantalla

#### Scenario: Fallo al exportar

- **WHEN** la exportación falla
- **THEN** se muestra el aviso de error
- **AND** la acción vuelve a quedar disponible

### Requirement: Estados vacío, de carga y de error explícitos

La pantalla SHALL distinguir entre estar cargando, no haber resultados y haber fallado, cada uno con
su mensaje.

El estado sin resultados SHALL decir que no hay procesos registrados **para esos filtros** y SHALL
ofrecer limpiarlos. Recién desplegado el sistema el historial está legítimamente vacío, y un vacío que
parece un error manda a buscar una avería que no existe.

Una entrada cuya cuenta ya fue eliminada SHALL mostrarse con el nombre guardado en el registro y una
marca de cuenta eliminada, sin enlace a una ficha que ya no existe.

#### Scenario: Sin resultados

- **WHEN** los filtros no devuelven entradas
- **THEN** se indica que no hay procesos registrados para esos filtros
- **AND** se ofrece limpiar los filtros

#### Scenario: Historial recién estrenado

- **GIVEN** un sistema sin entradas registradas todavía
- **WHEN** se abre la pantalla
- **THEN** el mensaje describe el vacío y no sugiere un fallo

#### Scenario: Actor de una cuenta eliminada

- **WHEN** una entrada corresponde a una cuenta ya eliminada
- **THEN** se muestra el nombre guardado en el registro con la marca de cuenta eliminada
- **AND** no se ofrece enlace a su ficha

### Requirement: Auditoría de Acceso despliega cada sesión con lo que se hizo en ella

En `/auditoria`, cada inicio de sesión SHALL poder desplegarse para ver **los procesos de esa
sesión**, dentro de la propia lista.

El detalle SHALL encabezarse con la IP, el dispositivo y el agente de usuario completo del
ingreso: son lo que distingue una sesión de otra de la misma persona, y sin ellos dos filas
seguidas del mismo nombre son indistinguibles.

Los procesos SHALL pedirse **al desplegar** y no al cargar el listado: cincuenta sesiones por
página serían cincuenta consultas para ver, casi siempre, una sola.

Los procesos SHALL pedirse por el **identificador de la sesión** y NO SHALL deducirse de un
rango de fechas alrededor del ingreso.

Cada fila SHALL mostrar cuántos procesos tuvo la sesión sin necesidad de desplegarla, para
distinguir de un vistazo una jornada de trabajo de un ingreso en el que no se hizo nada.

#### Scenario: Desplegar una sesión

- **WHEN** se despliega un inicio de sesión
- **THEN** se piden los procesos de esa sesión por su identificador
- **AND** se muestran con la IP, el dispositivo y el agente de usuario del ingreso
- **AND** la lista de inicios de sesión sigue visible

#### Scenario: Los procesos no se piden hasta que hacen falta

- **WHEN** se carga la lista de inicios de sesión
- **THEN** no se consulta ningún proceso hasta que se despliega una fila

#### Scenario: Recuento visible sin desplegar

- **WHEN** se carga la lista
- **THEN** cada fila indica cuántos procesos tuvo su sesión

### Requirement: Una sesión sin procesos atados explica por qué

Cuando una sesión no tenga procesos, la interfaz SHALL decir que puede tratarse de un ingreso
en el que no se hizo nada **o** de una sesión anterior al registro de procesos por sesión, y
SHALL ofrecer el enlace al historial completo de esa persona.

Un hueco sin explicación se lee como un fallo de la pantalla, y manda a buscar una avería que
no existe.

Cuando la sesión tenga más procesos de los que se traen al desplegar, la interfaz SHALL
decir cuántos muestra de cuántos y SHALL ofrecer el mismo enlace.

#### Scenario: Sesión sin procesos

- **WHEN** se despliega una sesión sin procesos atados
- **THEN** se explican las dos razones posibles
- **AND** se ofrece el enlace al historial completo de la persona

#### Scenario: Sesión con más procesos de los mostrados

- **GIVEN** una sesión con más procesos que el tope que se trae al desplegar
- **WHEN** se despliega
- **THEN** se indica cuántos se muestran de cuántos hay
- **AND** se ofrece el enlace al historial completo de la persona

### Requirement: Desplegar una sesión exige el permiso del historial

Desplegar un ingreso muestra el rastro de procesos de otra persona, así que SHALL exigir el
permiso `/auditoria/procesos`, el mismo que la pantalla que lo muestra en grande.

Una cuenta con `/auditoria` y sin `/auditoria/procesos` SHALL ver la lista de ingresos sin
control de despliegue, y SHALL leer una nota que explique qué permiso falta. Ofrecer el
despliegue y dejar que el servidor responda 403 sería fabricar un camino que termina en error.

#### Scenario: Con los dos permisos

- **GIVEN** una cuenta con `/auditoria` y `/auditoria/procesos`
- **WHEN** abre la auditoría de acceso
- **THEN** cada fila se puede desplegar

#### Scenario: Solo con la auditoría de accesos

- **GIVEN** una cuenta con `/auditoria` y sin `/auditoria/procesos`
- **WHEN** abre la auditoría de acceso
- **THEN** no se ofrece desplegar ninguna fila
- **AND** una nota explica que ver qué se hizo requiere el permiso del Historial de Procesos

### Requirement: Un ingreso de una cuenta eliminada sigue en el panel

El listado de inicios de sesión SHALL mostrar los ingresos de las cuentas ya eliminadas, con
el nombre guardado en el registro y una marca de cuenta eliminada, conservando su IP y su
dispositivo.

#### Scenario: Ingreso de una cuenta eliminada

- **WHEN** el listado incluye el ingreso de una cuenta ya eliminada
- **THEN** se muestra con el nombre guardado y la marca de cuenta eliminada
- **AND** no se ofrece enlace a una ficha que ya no existe
