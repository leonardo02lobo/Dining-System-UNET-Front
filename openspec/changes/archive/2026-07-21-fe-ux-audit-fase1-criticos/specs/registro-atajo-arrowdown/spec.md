## MODIFIED Requirements

### Requirement: Atajo ArrowDown para registrar consumo

La pantalla de registro de comedor SHALL disparar la acción "Registrar consumo" al presionar
`ArrowDown` cuando el registro es válido, reutilizando la misma condición de habilitación del
botón, sin interferir con el escaneo de código de barras ni con la navegación de campos. El
listener SHALL acotarse al contenedor de la ficha del estudiante consultado (no a `window`): la
ficha SHALL recibir el foco automáticamente al consultar una persona, y el atajo SHALL ignorarse si
el objetivo del evento no está dentro de ese contenedor. El atajo SHALL respetar también el foco en
un `INPUT`, además de `SELECT`/`TEXTAREA`.

#### Scenario: Registro válido con ArrowDown

- **WHEN** hay un estudiante consultado y el registro es válido (sesión abierta, sede
  seleccionada, sin sanción y sin guardado en curso), el foco está dentro de la ficha del
  estudiante, y el usuario presiona `ArrowDown`
- **THEN** se ejecuta "Registrar consumo"

#### Scenario: ArrowDown fuera de la ficha no registra

- **WHEN** el foco está fuera del contenedor de la ficha del estudiante (p. ej. en la barra
  lateral, en la cabecera, o sin nada enfocado en un punto de la página distinto a la ficha) y el
  usuario presiona `ArrowDown`
- **THEN** no se registra ningún consumo y la tecla se comporta con su función habitual (p. ej.
  desplazamiento de página o navegación de un lector de pantalla)

#### Scenario: Estado inválido

- **WHEN** el registro no es válido (suspendido, sin sesión, sin sede, o guardando) y el
  usuario presiona `ArrowDown`
- **THEN** no se registra el consumo

#### Scenario: Convivencia con el escaneo

- **WHEN** el lector de código de barras finaliza un escaneo con `Enter`
- **THEN** el atajo `ArrowDown` no interfiere con el escaneo

#### Scenario: No interferir con navegación de controles

- **WHEN** el foco está en un `select`, `textarea` o `input` y el usuario presiona `ArrowDown`
- **THEN** el atajo no intercepta la tecla y el control mantiene su navegación por flechas
