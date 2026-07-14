## 1. API y tipos

- [x] 1.1 `StockIncreasePayload` en `src/types/inventory.ts`
- [x] 1.2 `inventoryApi.increaseStock(itemId, data)` (`POST /inventory/items/{id}/stock/increase`)

## 2. UI del modal

- [x] 2.1 Input "Fecha de ingreso" (solo al crear), default hoy, `max` = hoy
- [x] 2.2 Crear ítem con stock 0 y registrar la entrada inicial datada vía `increaseStock`

## 3. Validación

- [ ] 3.1 Verificar fecha pasada y default con backend (requiere backend)
- [x] 3.2 Build verde: `npm run build`
