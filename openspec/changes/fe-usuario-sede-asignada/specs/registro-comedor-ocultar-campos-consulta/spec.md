## MODIFIED Requirements

### Requirement: Ocultar sede y cédula con un estudiante consultado

La pantalla de registro al comedor SHALL ocultar la barra de búsqueda de cédula mientras se muestra
una persona consultada, y SHALL restaurarla cuando no hay persona en pantalla (tras guardar el
registro, cancelar la consulta, o limpiar). El rótulo de la sede y el estado de la sesión SHALL
permanecer visibles en todo momento, también mientras hay una persona consultada. La ficha SHALL
ofrecer una acción explícita de cancelar que restaura la barra sin registrar consumo.

Ya no hay un selector de sede que ocultar: la sede la fija la cuenta del usuario y se muestra como
rótulo. Lo que este requisito protegía —que el operador no pierda de vista en qué sede y en qué turno
está mientras atiende a alguien— se cumple ahora por construcción, porque el rótulo no se oculta
nunca.

#### Scenario: Consultar oculta la barra de cédula

- **WHEN** el usuario consulta una cédula y se muestra la ficha de la persona
- **THEN** la barra de búsqueda de cédula deja de mostrarse
- **AND** el rótulo de la sede y el estado de la sesión siguen visibles

#### Scenario: Guardar restaura la barra

- **WHEN** el usuario registra el consumo (o limpia) y ya no hay persona en pantalla
- **THEN** la barra de búsqueda de cédula vuelve a mostrarse

#### Scenario: Cancelar sin registrar restaura la barra

- **WHEN** el usuario consultó a una persona por error (o quiere verificar otra cédula) y pulsa
  "Cancelar / Consultar otra persona"
- **THEN** la ficha se limpia sin registrar ningún consumo y la barra de búsqueda vuelve a mostrarse

#### Scenario: La sede nunca desaparece

- **WHEN** se consulta a una persona y después se limpia la ficha
- **THEN** el rótulo de la sede ha permanecido visible durante todo el proceso
- **AND** la sede mostrada es siempre la de la cuenta del usuario

#### Scenario: Escaneo tras registrar

- **WHEN** tras registrar reaparece la barra de cédula y se pasa un nuevo carnet por el lector
- **THEN** se inicia una nueva consulta con normalidad
