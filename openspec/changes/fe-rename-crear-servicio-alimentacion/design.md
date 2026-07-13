## Context

`NavBar.tsx` define el ítem `{ to: '/inventario/crear', label: 'Crear Almuerzo' }` y
`CreateLunchPage.tsx` usa `<PageHeader title="Crear Almuerzo" />`. El issue #13 pide
renombrar la sección a "Crear servicio de alimentación".

## Goals / Non-Goals

**Goals:**
- Rótulo visible "Crear servicio de alimentación" en navegación y encabezado.

**Non-Goals:**
- No se renombra la ruta `/inventario/crear` (decisión de Fase 0).
- No se cambian entidades de backend (`Lunch`) ni otros textos con la palabra "almuerzo"
  que no sean el título de esta sección.

## Decisions

### D1 — Solo rótulo, ruta intacta

Se cambian únicamente los dos textos visibles (label de `NavBar` y title de `PageHeader`).
Alternativa (renombrar también la ruta y entidades) rechazada: innecesaria y arriesgada para
un cambio de nomenclatura.

## Risks / Trade-offs

- **Inconsistencia si quedan otros textos "Crear almuerzo"** → se revisa que no haya otro
  rótulo de la misma sección; los mensajes internos que mencionan "almuerzo" (validaciones,
  historial) quedan fuera de alcance.
