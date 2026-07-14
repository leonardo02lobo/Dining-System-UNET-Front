## Context

`CheckConsumes` y `RegisterDining` apilan verticalmente: `PageHeader`, banner de sesión,
tarjeta de búsqueda, y una ficha de resultado con varias filas `Input` apiladas (documento,
nombre, email, estado…) más avisos. En pantallas de baja resolución (equipos del comedor) esto
desborda y obliga a hacer scroll. El shell (`Index.tsx`) monta Header + NavBar + Outlet +
Footer, que consumen alto disponible. La resolución objetivo **no está confirmada** (pregunta
abierta del issue #1).

## Goals / Non-Goals

**Goals:**
- Reducir el alto total de ambas vistas para que quepan sin scroll en la resolución objetivo.
- Mantener estado y botón de acción siempre visibles.

**Non-Goals:**
- No recortar contenido con `overflow-hidden` + alturas fijas (peor que el scroll).
- No cambiar la lógica de negocio ni los datos mostrados.
- No fijar breakpoints/paddings exactos aquí (se afinan en implementación).

## Decisions

### D1 — Densificar, no clipear

Se reduce padding/gap y se pasa la ficha de resultado a columnas (datos a la izquierda, foto +
estado + acciones a la derecha), en lugar de filas apiladas de ancho completo. Alternativa
(container `h-[calc(100vh-...)]` + `overflow-hidden`) rechazada como enfoque principal: en
resoluciones menores a la objetivo recortaría datos/acciones.

### D2 — Verificación visual dependiente de la resolución objetivo

El criterio "sin scroll" solo se valida ejecutando la app en la resolución objetivo. Como esa
resolución es una pregunta abierta de Fase 0, la implementación entrega la densificación y la
verificación final queda como paso manual una vez confirmada la resolución.

## Risks / Trade-offs

- **Resolución objetivo desconocida** → no se puede garantizar "cero scroll" sin ese dato;
  se densifica de forma segura y se marca la verificación como manual.
- **Regresión visual en otras resoluciones** → probar en varias; evitar clipping.
- **Menos aire visual** → aceptable: el pedido prioriza operar sin scroll.

## Open Questions

- ¿Cuál es la resolución mínima real de las máquinas del comedor? (bloquea la verificación
  final de "sin scroll").
- ¿Qué elementos son imprescindibles above-the-fold vs. secundarios?
