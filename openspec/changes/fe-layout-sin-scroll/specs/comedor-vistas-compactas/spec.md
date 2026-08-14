## MODIFIED Requirements

### Requirement: Vistas de comedor operables sin scroll

Las vistas de consulta de consumo y registro de comedor SHALL presentar toda la información y
las acciones de forma operable sin requerir scroll vertical a **1366×768** de área de contenido del
navegador, sin recortar contenido.

La resolución SHALL ir nombrada. La redacción anterior decía "en la resolución objetivo" sin decir
cuál: un umbral sin número no se puede comprobar, así que nadie lo comprobó y las vistas volvieron a
crecer hasta necesitar scroll.

El cumplimiento SHALL apoyarse en la comprobación automática de la capacidad `layout-sin-scroll` y en
una verificación manual a esa resolución. La comprobación automática no mide píxeles y esa limitación
SHALL constar; una prueba que aparenta medir alturas sin medirlas deja el requisito tan desprotegido
como estaba.

#### Scenario: Consulta sin scroll

- **WHEN** el usuario abre `/comedor/consultar` a 1366×768 y consulta una cédula
- **THEN** los datos del resultado y las acciones son visibles y operables sin scroll

#### Scenario: Registro sin scroll

- **WHEN** el usuario abre `/comedor/registrar` a 1366×768 con una persona consultada
- **THEN** la ficha, el estado (activo/suspendido), el contador del turno, el aviso de consumo previo
  y el botón de registrar quedan visibles a la vez, sin scroll

#### Scenario: El registro no obliga a soltar el lector

- **GIVEN** el taquillero con el lector en la mano y una persona recién escaneada
- **WHEN** necesita confirmar el estado de la persona y registrar el consumo
- **THEN** puede hacerlo sin tocar la rueda del ratón ni el teclado de navegación

#### Scenario: No se recorta contenido

- **WHEN** la vista se muestra en una resolución menor a la objetivo
- **THEN** el contenido no queda recortado (no se oculta con alturas fijas + overflow); a lo
  sumo reaparece el scroll como degradación aceptable
