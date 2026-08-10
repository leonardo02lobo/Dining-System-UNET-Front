## MODIFIED Requirements

### Requirement: Atajo ArrowDown/ArrowUp para registrar consumo

La pantalla de registro de comedor SHALL disparar la acción "Registrar consumo" al presionar
`ArrowDown` o `ArrowUp` cuando el registro es válido, reutilizando la misma condición de
habilitación del botón, sin interferir con el escaneo de código de barras ni con la navegación
propia de `SELECT`/`TEXTAREA`. El listener SHALL escuchar en `window` (no acotado a un contenedor
específico de la ficha), evaluando en cada pulsación el estado actual del formulario. El atajo
SHALL respetar el foco en `SELECT`/`TEXTAREA` (para no interferir con su navegación por flechas),
pero NO SHALL bloquearse por el foco en el campo de cédula ni en ningún otro `INPUT` de texto libre
del formulario principal — es el campo donde el foco normalmente permanece tras escanear o
consultar, y bloquear el atajo ahí lo dejaba inutilizable en la práctica.

El atajo SHALL funcionar para **cualquier persona registrable**, sea del padrón, acceso directo o
persona externa. Su condición es la del botón y no la clase de persona.

Un atajo que "no hace nada" es indistinguible de un atajo roto. Cuando la búsqueda no resolvía a la
gente externa, no había ficha en pantalla, la condición del botón era falsa y ni siquiera se armaba el
escuchador: el síntoma que se reportó como "la flecha hacia abajo no hace nada" era ese. Por eso el
comportamiento con una persona externa SHALL estar cubierto por una prueba y no solo implicado por la
condición general.

#### Scenario: Registro válido con ArrowDown o ArrowUp

- **WHEN** hay un estudiante consultado y el registro es válido (sesión abierta, sede
  seleccionada, sin sanción y sin guardado en curso), y el usuario presiona `ArrowDown` o
  `ArrowUp` en cualquier parte de la pantalla (incluido el campo de cédula)
- **THEN** se ejecuta "Registrar consumo"

#### Scenario: El atajo funciona con una persona externa

- **GIVEN** una persona externa consultada, con sede seleccionada y sesión abierta
- **WHEN** el usuario presiona `ArrowDown`
- **THEN** se ejecuta "Registrar consumo" para esa persona
- **AND** la petición lleva su `external_person_id`

#### Scenario: Estado inválido

- **WHEN** el registro no es válido (suspendido, sin sesión, sin sede, o guardando) y el
  usuario presiona `ArrowDown`/`ArrowUp`
- **THEN** no se registra el consumo

#### Scenario: Convivencia con el escaneo

- **WHEN** el lector de código de barras finaliza un escaneo con `Enter`
- **THEN** el atajo `ArrowDown`/`ArrowUp` no interfiere con el escaneo

#### Scenario: No interferir con navegación de `SELECT`/`TEXTAREA`

- **WHEN** el foco está en un `select` o `textarea` (p. ej. el selector de sede o el motivo de
  suspensión) y el usuario presiona `ArrowDown`/`ArrowUp`
- **THEN** el atajo no intercepta la tecla y el control mantiene su navegación por flechas

#### Scenario: El campo de cédula no bloquea el atajo

- **WHEN** el foco está en el campo de cédula (donde normalmente queda tras escanear o consultar)
  y el registro es válido, y el usuario presiona `ArrowDown` o `ArrowUp`
- **THEN** se ejecuta "Registrar consumo" sin necesidad de mover el foco fuera del campo
