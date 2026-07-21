## ADDED Requirements

### Requirement: El texto informativo cumple contraste AA

El texto que comunica información al usuario (etiquetas, mensajes de estado vacío, instrucciones,
texto de tablas y fichas) SHALL usar un color con relación de contraste de al menos 4,5:1 sobre su
fondo (`text-slate-500` o superior), en vez de `text-slate-400` (2,56:1). Se exceptúan los iconos
puramente decorativos y el texto de `placeholder` de los campos de formulario.

#### Scenario: Mensaje de estado vacío legible

- **WHEN** una tabla o ficha no tiene datos que mostrar
- **THEN** el mensaje de estado vacío se muestra con contraste AA (`text-slate-600` o superior)

#### Scenario: Iconos decorativos sin cambios

- **WHEN** un icono decorativo (p. ej. un chevron o un icono de acción con su propio `aria-label`)
  usa `text-slate-400`
- **THEN** no se considera un fallo de este requisito, ya que no es texto informativo
