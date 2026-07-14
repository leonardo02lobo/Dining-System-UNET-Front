## Context

`CreateLunchPage` usa `grid xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]`: a la izquierda
`LunchDetailsForm` + `LunchIngredientsTable` + `LunchFooterActions`; a la derecha
`LunchRecalculationPanel` (que contiene el botón "Agregar ingrediente", el control de platos
Inicial→Deseada, la lista compacta de previews y "Aplicar recálculo"). `LunchIngredientsTable`
usa `ui/Table`; el panel de recálculo usa una lista custom. El recálculo en vivo viene de
`previews` (`getRecalculationPreview`) calculado en la página. `LunchRecalculationPanel`
también lo usa `LunchTestPage`.

## Goals / Non-Goals

**Goals:**
- Dos tablas 50/50 con el mismo estilo visual (`ui/Table`).
- Botón "Agregar Ingrediente" centrado debajo de ambas.
- Conservar el recálculo en vivo y el propósito de cada tabla.

**Non-Goals:**
- No cambiar la lógica de recálculo ni los contratos de datos.
- No tocar `LunchRecalculationPanel` (lo usa `LunchTestPage`).
- No unificar en un único componente ambas tablas (tienen columnas/propósito distintos);
  la igualdad es de estilo vía `ui/Table`.

## Decisions

### D1 — Nuevo `LunchRecalculationTable` sobre `ui/Table`

Se crea un componente que renderiza `previews` con `ui/Table` (columnas Ingrediente / `Base·N`
/ `Nuevo·N`, resaltando en azul los cambios), con el control Inicial→Deseada arriba y "Aplicar
recálculo" abajo. Así ambas tablas comparten el estilo de `ui/Table`. Alternativa (extraer un
único componente de tabla para las dos) rechazada: sus columnas/propósito difieren; basta con
el mismo primitivo de tabla.

### D2 — Layout 50/50 con botón central

`CreateLunchPage` pasa a: `LunchDetailsForm` (ancho completo) → grid `xl:grid-cols-2` con las
dos tablas → botón "Agregar Ingrediente" centrado (`flex justify-center`) → `saveError` →
`LunchFooterActions`. El botón sale del panel de recálculo y queda en la región central.

### D3 — Preservar el recálculo en vivo

El flujo `previews`/`desiredPlateCount`/`handleApplyRecalculation` se mantiene; solo cambia su
presentación. `onAddIngredient` deja de pasarse al recálculo y se cablea al nuevo botón central
(`openAddModal`).

## Risks / Trade-offs

- **Romper el recálculo en vivo al refactorizar** → se conserva el flujo de datos; validar que
  al cambiar platos/ingredientes la tabla derecha se actualiza.
- **Tablas al 50% se ven apretadas** (4 columnas en ingredientes) → `ui/Table` ya envuelve en
  `overflow-x-auto`; aceptable y es el pedido explícito del cliente.
- **Colisión con #13** (misma pantalla) → #13 ya está aplicado (solo rótulo); sin conflicto real.

## Open Questions

- ¿"Iguales" exige exactamente las mismas columnas? Se interpretó como mismo estilo de tabla
  conservando el propósito (columnas propias de cada una).
