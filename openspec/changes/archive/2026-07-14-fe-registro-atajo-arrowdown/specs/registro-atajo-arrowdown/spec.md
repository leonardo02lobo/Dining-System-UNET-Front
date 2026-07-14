## ADDED Requirements

### Requirement: Atajo ArrowDown para registrar consumo

La pantalla de registro de comedor SHALL disparar la acción "Registrar consumo" al presionar
`ArrowDown` cuando el registro es válido, reutilizando la misma condición de habilitación del
botón, sin interferir con el escaneo de código de barras ni con la navegación de campos.

#### Scenario: Registro válido con ArrowDown

- **WHEN** hay un estudiante consultado y el registro es válido (sesión abierta, sede
  seleccionada, sin sanción y sin guardado en curso) y el usuario presiona `ArrowDown`
- **THEN** se ejecuta "Registrar consumo"

#### Scenario: Estado inválido

- **WHEN** el registro no es válido (suspendido, sin sesión, sin sede, o guardando) y el
  usuario presiona `ArrowDown`
- **THEN** no se registra el consumo

#### Scenario: Convivencia con el escaneo

- **WHEN** el lector de código de barras finaliza un escaneo con `Enter`
- **THEN** el atajo `ArrowDown` no interfiere con el escaneo

#### Scenario: No interferir con navegación de controles

- **WHEN** el foco está en un `select` o `textarea` y el usuario presiona `ArrowDown`
- **THEN** el atajo no intercepta la tecla y el control mantiene su navegación por flechas
