## ADDED Requirements

### Requirement: Los mensajes de login son consistentes con la autenticación por correo

Dado que `POST /auth/login` solo autentica por correo electrónico, la pantalla de login SHALL usar
"correo electrónico" en el mensaje de validación de campo requerido y en el mensaje de error de
credenciales incorrectas (401), consistente con la etiqueta, `type="email"` y `autoComplete="email"`
del campo.

#### Scenario: Campo vacío

- **WHEN** el usuario envía el formulario sin escribir el campo de usuario
- **THEN** ve el mensaje "El correo electrónico es requerido"

#### Scenario: Credenciales incorrectas

- **WHEN** el backend responde 401 a un intento de login
- **THEN** el usuario ve "Correo o contraseña incorrectos"
