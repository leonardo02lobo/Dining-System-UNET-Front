# modal-accesible Specification

## Purpose
TBD - created by archiving change fe-ux-audit-fase1-criticos. Update Purpose after archive.
## Requirements
### Requirement: El componente Modal implementa el patrón WAI-ARIA de diálogo

La primitiva `Modal` SHALL atrapar el foco de teclado dentro del panel mientras está abierta,
SHALL enfocar un elemento del panel al abrirse, SHALL devolver el foco al elemento que abrió el
modal al cerrarse, SHALL asociar el título con `aria-labelledby`, y SHALL bloquear el scroll del
`body` mientras está abierta.

#### Scenario: Foco atrapado dentro del modal

- **WHEN** el modal está abierto y el usuario presiona `Tab` desde el último elemento focalizable
  del panel
- **THEN** el foco vuelve al primer elemento focalizable del panel, sin alcanzar contenido de la
  página de fondo

#### Scenario: Foco inicial al abrir

- **WHEN** el modal se abre
- **THEN** el foco se mueve al primer elemento focalizable del panel (o al panel mismo si no hay
  ninguno)

#### Scenario: Retorno de foco al cerrar

- **WHEN** el modal se cierra (Escape, backdrop, botón de cierre o acción del footer)
- **THEN** el foco vuelve al elemento que tenía el foco antes de abrirse

#### Scenario: Título anunciado por lector de pantalla

- **WHEN** un lector de pantalla anuncia el modal al abrirse y el modal tiene `title`
- **THEN** anuncia el texto del título mediante `aria-labelledby`

#### Scenario: Scroll de fondo bloqueado

- **WHEN** el modal está abierto
- **THEN** la página de fondo no se desplaza; al cerrarse, el scroll del `body` se restaura

