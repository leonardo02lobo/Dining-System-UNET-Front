## ADDED Requirements

### Requirement: El botón de mostrar/ocultar contraseña es alcanzable por teclado

El botón que alterna la visibilidad de la contraseña en `Input` SHALL estar en el orden natural de
tabulación (sin `tabIndex={-1}`).

#### Scenario: Alternar visibilidad solo con teclado

- **WHEN** un usuario navega con `Tab` desde el campo de contraseña
- **THEN** puede alcanzar el botón de mostrar/ocultar contraseña y activarlo con `Enter` o
  `Espacio`
