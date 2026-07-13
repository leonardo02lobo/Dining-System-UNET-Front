## Why

Al cargar un insumo no se podía indicar la fecha de ingreso; se usaba la fecha automática. El
cliente pidió un input de fecha en el modal de "cargar insumo" (issue **#7**). Fase 0 (1.8): la
fecha aplica a la **entrada de stock**, default hoy, sin fechas futuras. Change gemela backend
`be-inventario-fecha-movimiento` (implementada): `POST /inventory/items/{id}/stock/increase`
acepta `entryDate` opcional (default hoy, rechaza futuras).

## What Changes

- Se añade `inventoryApi.increaseStock(itemId, { quantity, reason, entryDate })` (endpoint de
  entrada de stock) y el tipo `StockIncreasePayload`.
- En el modal "Cargar Insumo" de `InventoryPage` se añade un input **"Fecha de ingreso"** (solo
  al crear), con default hoy y `max` = hoy (sin futuras).
- Al crear un insumo con stock inicial > 0, se registra ese stock como una **entrada con fecha**
  vía el endpoint de increase (se crea el ítem con stock 0 y luego se registra el movimiento
  datado), de modo que la fecha de ingreso quede en el historial de movimientos.

## Capabilities

### New Capabilities
- `inventario-fecha-ingreso-insumo`: registro de la fecha de ingreso al cargar un insumo, como
  movimiento de entrada de stock.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos:** `src/types/inventory.ts` (`StockIncreasePayload`), `src/api/inventory.ts`
  (`increaseStock`), `src/pages/InventoryPage.tsx` (input + flujo de creación). Backend: sin
  cambios. Riesgo: medio (cambia el flujo de creación a dos pasos crear+entrada).
