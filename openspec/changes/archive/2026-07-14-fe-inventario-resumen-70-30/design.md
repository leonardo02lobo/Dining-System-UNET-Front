## Context

`InventoryPage` y `GeneralInventoryPage` usan `flex flex-col gap-6 xl:flex-row xl:items-start`
con la tabla en `min-w-0 flex-1` y `<InventorySummaryPanel>` al costado. El panel tiene ancho
fijo `xl:w-[267px]`. El repo ya usa grids con fracciones (`CreateLunchPage`: `xl:grid-cols-[7fr_3fr]`).

## Goals / Non-Goals

**Goals:**
- Tabla 70% / resumen 30% en `xl`, apilado en angosto.
- Panel de resumen llena su columna (sin ancho fijo).

**Non-Goals:**
- No se cambia el contenido del resumen ni de la tabla.
- No se tocan otras páginas (el panel solo se usa en estas dos).

## Decisions

### D1 — Grid `xl:grid-cols-[7fr_3fr]`

Se reemplaza el `flex xl:flex-row` por `grid grid-cols-1 gap-6 xl:grid-cols-[7fr_3fr]
xl:items-start`, consistente con `CreateLunchPage`. Alternativa (`w-[70%]`/`w-[30%]`)
rechazada por ser menos consistente con el repo.

### D2 — Panel `w-full` en lugar de ancho fijo

`InventorySummaryPanel` cambia su `aside` de `w-full flex-shrink-0 xl:w-[267px]` a `w-full`
para llenar la columna 3fr. Es seguro: el componente solo se usa en las dos páginas objetivo.

## Risks / Trade-offs

- **Contenido del resumen se ve disperso al ensancharse** → aceptable; el pedido es agrandarlo.
  Si hace falta, un ajuste fino de espaciado interno queda para una iteración posterior.
- **Regresión responsiva** → se mantiene `grid-cols-1` por defecto (apilado) y `xl:` para el 70/30.
