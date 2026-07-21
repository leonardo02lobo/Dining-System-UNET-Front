## ADDED Requirements

### Requirement: Los filtros de rol incluyen todos los roles reales del sistema

Los filtros de rol de Directorio de Usuarios y Auditoría de Acceso SHALL derivar sus opciones de
una única fuente de verdad (el mapa de etiquetas de rol de cada pantalla) que incluye los 4 roles
reales del sistema (`SUPER_ADMIN`, `ADMIN`, `TAQUILLERO`, `ACCESO_DIRECTO`), en vez de una lista
manual que pueda quedar desincronizada.

#### Scenario: Filtrar por Acceso Directo

- **WHEN** un administrador abre el filtro de rol en Directorio de Usuarios o en Auditoría de
  Acceso
- **THEN** puede seleccionar "Acceso Directo" además de los otros tres roles

### Requirement: Los filtros de tipo Select tienen etiqueta visible

Los controles `Select` usados como filtro en Directorio de Usuarios y Auditoría de Acceso SHALL
tener una etiqueta visible (`label`) que identifique qué dimensión filtran, incluso cuando el
usuario ya seleccionó un valor distinto de "Todos".

#### Scenario: Etiqueta visible tras filtrar

- **WHEN** el usuario selecciona un valor concreto en el filtro de Estado o de Rol
- **THEN** la etiqueta ("Estado" / "Rol") sigue visible sobre el control, además de mostrarse en el
  `aria-label`/`label` asociado
