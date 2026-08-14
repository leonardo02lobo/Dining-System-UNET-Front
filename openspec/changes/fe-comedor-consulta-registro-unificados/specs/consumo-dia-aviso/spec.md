## MODIFIED Requirements

### Requirement: Aviso de consumo previo al consultar a la persona

Al consultar una cédula en la pantalla de comedor, el panel SHALL informar del estado de consumo de
esa persona **antes** de que el operador intente registrarla, y SHALL hacerlo **en los dos sentidos**:
tanto cuando ya consumió como cuando no.

La versión anterior solo exigía el aviso cuando había consumo previo. Con la pantalla de consulta
fundida en la de registro, "no ha comido" pasa a ser una respuesta que el operador pide
explícitamente, y dejarla como ausencia de aviso la vuelve indistinguible de un fallo de carga.

La consulta SHALL resolverse **por cédula** y SHALL lanzarse en paralelo con la búsqueda de la
persona. Resolverla por `acceso_directo_id` deja fuera a la gente externa y a quien todavía no está
dado de alta —que son justamente quienes producen los falsos "no hay registro de consumo asociado".

La respuesta SHALL mostrarse en la ficha de resultado, no en un diálogo.

El aviso de consumo previo SHALL indicar la hora, la sede y si se registró en taquilla o manualmente,
con la redacción compartida de `utils/consumptionNotice.ts`. Dos pantallas describiendo el mismo
hecho con dos textos distintos es lo que ese módulo existe para impedir.

Cuando el consumo haya ocurrido en una **sede distinta** de aquella en la que se consulta, el aviso
SHALL decirlo de forma destacada y SHALL nombrar esa sede al principio de la frase.

Es lo único de todo el aviso que el operador no puede averiguar por su cuenta: tiene delante a una
persona que en su comedor no ha comido. Con la sede enterrada al final de la frase —entre la hora y
el origen— el aviso se lee igual que el de un duplicado de la propia sede, y la diferencia entre "ya
te serví" y "comiste en otro municipio" es justo la conversación que hay que poder tener.

La afirmación SHALL apoyarse en los **dos** nombres de sede. Si falta cualquiera de ellos, el aviso
NO SHALL decir que fue en otra sede: no saber una de las dos no es saber que son distintas.

Cuando la comprobación no pueda completarse, la vista SHALL decirlo explícitamente y NO SHALL
presentar el fallo como "no ha consumido".

Cuando haya consumo previo, el botón de registrar SHALL quedar deshabilitado.

El diálogo actual de consumo duplicado disparado por el rechazo del servidor SHALL conservarse: es lo
que atrapa el caso en que dos taquillas registran a la misma persona simultáneamente, que ninguna
consulta previa puede prevenir.

#### Scenario: La persona ya comió hoy

- **WHEN** el taquillero consulta la cédula de alguien que ya registró consumo hoy
- **THEN** la ficha muestra el aviso con la hora, la sede y el origen del consumo
- **AND** el botón de registrar consumo queda deshabilitado

#### Scenario: La persona no ha comido

- **WHEN** el taquillero consulta la cédula de alguien sin consumo hoy
- **THEN** la ficha afirma explícitamente que no ha consumido en la sesión de hoy
- **AND** el botón de registrar consumo permanece disponible

#### Scenario: Consumió en otro municipio

- **GIVEN** un operador atendiendo en la sede Paramillo
- **WHEN** consulta a alguien que ya registró consumo hoy en la sede San Cristóbal
- **THEN** el aviso dice que ya consumió **en otra sede** y la nombra
- **AND** se distingue visualmente del aviso de duplicado dentro de la propia sede
- **AND** el botón de registrar queda deshabilitado

#### Scenario: Consumió en la propia sede

- **WHEN** el consumo previo ocurrió en la misma sede desde la que se consulta
- **THEN** el aviso conserva la redacción de siempre y no habla de otra sede

#### Scenario: El servidor no trae la sede del consumo

- **WHEN** el consumo previo llega sin nombre de sede
- **THEN** el aviso informa del consumo sin afirmar que ocurriera en otra sede

#### Scenario: Persona externa que ya comió

- **GIVEN** una persona externa con consumo registrado hoy
- **WHEN** se consulta su cédula
- **THEN** se muestra el aviso de consumo previo con su hora, sede y origen
- **AND** no se afirma que no exista registro de consumo para ella

#### Scenario: Persona que aún no es acceso directo

- **WHEN** el taquillero consulta a alguien que nunca ha comido y no está registrado como acceso
  directo
- **THEN** la consulta se resuelve sin error, afirmando que no ha consumido
- **AND** el flujo de alta al vuelo sigue disponible

#### Scenario: La consulta falla

- **WHEN** la consulta de consumo previo no puede completarse
- **THEN** la ficha se muestra igualmente con los datos de la persona
- **AND** la vista indica que no pudo comprobarse el consumo, sin afirmar que no lo haya
- **AND** el registro sigue siendo posible, quedando el rechazo del servidor como último guardia
