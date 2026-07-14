## 1. API y tipos

- [x] 1.1 `LunchUpdatePayload` en `src/types/lunch.ts` y corregir `LunchStatus` a incluir `CONFIRMED`
- [x] 1.2 `lunchApi.updateLunch(id, data)` (`PATCH /lunches/{id}`)

## 2. UI de edición

- [x] 2.1 Mostrar estado (Borrador/Confirmado) en el detalle del almuerzo
- [x] 2.2 Botón "Editar" (solo DRAFT) con inputs nombre/fecha/platos y guardado vía PATCH
- [x] 2.3 Bloqueo/aviso para no editables y manejo del 409

## 3. Validación

- [ ] 3.1 Verificar edición de un DRAFT y bloqueo de un CONFIRMED (requiere backend)
- [x] 3.2 Build verde: `npm run build`
