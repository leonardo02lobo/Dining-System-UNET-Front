## Context

`/lunch-templates` ya tiene CRUD completo en backend. En `src/api/lunch.ts` solo están
`listLunchTemplates` y `createLunchTemplate`; faltan `get/update/delete`. Los tipos de lunch
usan camelCase (`platesQuantity`, `basePlatesQuantity`) y `apiClient` no transforma llaves, por
lo que se mantiene camelCase en payloads (consistente con `LunchTemplateCreatePayload`). El
grupo "Inventario" del `NavBar` y `ROUTE_ACCESS` gobiernan navegación/acceso; las rutas de
inventario son `SUPER_ADMIN`/`ADMIN`. Patrón de CRUD por página con `ui/Table` + `Modal` ya
existe (`InventoryPage`).

## Goals / Non-Goals

**Goals:**
- Ventana en inventario para listar, editar (nombre/platos base) y eliminar plantillas.
- Reusar `ui/Table`, `Modal`, `Button`, `Input` y el patrón IIFE de carga async.
- Manejar el rechazo de borrado de plantilla referenciada mostrando el error del backend.

**Non-Goals (primera entrega):**
- Crear plantilla desde cero y edición completa de ingredientes (reutilizarían el editor de
  `CreateLunchPage`; se difieren a una sub-entrega).
- Cambios de backend (el CRUD ya existe).

## Decisions

### D1 — Entrega R-U-D primero; C e ingredientes después

Se implementan listar/editar(nombre, platos base)/eliminar, que cubren el "manejo y orden" que
motiva el issue #12 (las plantillas se generan desde almuerzos, #11). Crear desde cero y editar
ingredientes requieren el editor de ingredientes (stock, recálculo) y se difieren. Alternativa
(construir todo el editor ahora) rechazada por esfuerzo y solape con #10/#11.

### D2 — API en camelCase, nuevo `LunchTemplateUpdatePayload`

Se añaden `getLunchTemplate(id)`, `updateLunchTemplate(id, data)`, `deleteLunchTemplate(id)`.
`LunchTemplateUpdatePayload = { name?: string; basePlatesQuantity?: number; platesQuantity?: number }`,
enviando solo los campos editados (parcial).

### D3 — Ruta, navegación y acceso

Ruta `/inventario/plantillas` en `App.tsx`; entrada "Plantillas" en el grupo Inventario del
`NavBar`; `ROUTE_ACCESS['/inventario/plantillas'] = ['SUPER_ADMIN','ADMIN']` (igual que el
resto de inventario).

## Risks / Trade-offs

- **Esquema exacto de `PATCH /lunch-templates/{id}`** no verificado desde este repo → se envían
  campos parciales en camelCase (consistentes con el create); si el backend difiere, se ajusta
  al integrar.
- **Borrado de plantilla referenciada** → la regla vive en backend; la UI captura el error
  (p. ej. 409) y lo muestra sin romper la lista.
- **Entrega parcial (sin crear/ingredientes)** → documentado como sub-entrega para no bloquear.

## Open Questions

- ¿El `PATCH` acepta actualizar ingredientes en un solo payload o requiere endpoints de
  ingredientes aparte? (define el alcance de la sub-entrega de edición de ingredientes).
- ¿Qué código devuelve el backend al borrar una plantilla referenciada (409/400)?
