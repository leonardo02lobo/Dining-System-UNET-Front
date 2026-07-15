## Context

Tres pantallas muestran un `Student` consultado con maquetados distintos:

- `RegisterDining`: `Card` con `Avatar` cuadrado, `Badge` de estado, grid documento/nombre/email,
  aviso acceso directo vs. alta implícita, aviso de sanción, y acciones ("Suspender"/"Registrar").
- `CheckConsumes`: `Card` similar + estado de consumo del día y sanción.
- `ManualRegistrationPage`: bloque propio, sin avatar, con estado y nombre/email en filas.

El tipo `Student` (`types/user.ts`) ya trae `name`, `cedula`, `email`, `avatar_url`,
`is_acceso_directo`, `acceso_directo_id`, `is_suspended`.

## Goals / Non-Goals

**Goals:**
- Un componente de ficha reutilizable, usado al menos por el registro manual.
- Diferencias por props/slots (acciones, avisos opcionales), sin duplicar el maquetado.

**Non-Goals:**
- No cambiar la lógica de búsqueda/registro de cada pantalla.
- No unificar los estados/《hooks》 de las páginas; sólo la presentación.

## Decisions

### D1 — `StudentResultCard` presentacional + slots

Componente sin estado que recibe `student: Student` y flags/nodos opcionales:
`variant`/`showConsumo`, `sanction?`, y un slot `actions?: ReactNode` para los botones específicos
de cada pantalla. Toma como base el maquetado de `RegisterDining`/`CheckConsumes` (el más completo).

### D2 — Migración incremental

Primero se introduce el componente y se migra `ManualRegistrationPage` (lo que pide el cliente).
Después, opcionalmente, se migran `RegisterDining` y `CheckConsumes` para dejar una sola fuente.
Cada migración se valida con `npm run build` (TS estricto detecta props faltantes).

### D3 — Acciones como slot, no acopladas

Los botones "Registrar"/"Suspender"/"Guardar" quedan fuera del componente (slot `actions`) para no
acoplar la ficha a la lógica de cada pantalla.

## Risks / Trade-offs

- **Regresiones visuales** en pantallas migradas → mitigado migrando de a una y comparando.
- **Sobre-parametrización** del componente → se limita a los slots realmente necesarios.

## Open Questions

- ¿La ficha del registro manual debe incluir **avatar** y el aviso de acceso directo/alta como en
  el registro al comedor? Se asume que sí (unificación); si el cliente quiere una variante compacta
  se expone vía prop `variant`.
