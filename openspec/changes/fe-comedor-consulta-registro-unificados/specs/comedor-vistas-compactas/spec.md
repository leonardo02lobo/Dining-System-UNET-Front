## MODIFIED Requirements

### Requirement: Vistas de comedor operables sin scroll

La vista de comedor (`/comedor/registrar`, que consulta y registra) SHALL presentar toda la
información y las acciones de forma operable sin requerir scroll vertical a **1366×768** de área de
contenido del navegador, sin recortar contenido.

Ya no hay una segunda vista de consulta que cumplir: `/comedor/consultar` redirige a la pantalla
unificada.

El presupuesto vertical que antes se gastaba en campos vacíos, marcadores y cajas de relleno SHALL
quedar libre; la contención de alto NO SHALL apoyarse en ocultar controles operativos.

El cumplimiento SHALL apoyarse en la comprobación automática de la capacidad `layout-sin-scroll` y en
una verificación manual a esa resolución, con el estado más alto posible: persona consultada, aviso
de consumo previo, estado de sanción y aviso de configuración del turno a la vez.

#### Scenario: Consulta y registro sin scroll

- **WHEN** el usuario abre `/comedor/registrar` a 1366×768 y consulta una cédula
- **THEN** la ficha, los dos estados (consumo del día y sanción), el contador del turno y el botón de
  registrar quedan visibles a la vez, sin scroll

#### Scenario: El registro no obliga a soltar el lector

- **GIVEN** el taquillero con el lector en la mano y una persona recién escaneada
- **WHEN** necesita confirmar el estado de la persona y registrar el consumo
- **THEN** puede hacerlo sin tocar la rueda del ratón ni el teclado de navegación

#### Scenario: No se recorta contenido

- **WHEN** la vista se muestra en una resolución menor a la objetivo
- **THEN** el contenido no queda recortado (no se oculta con alturas fijas + overflow); a lo
  sumo reaparece el scroll como degradación aceptable
