---
name: api-contracts
description: Desajustes entre tipos TypeScript frontend y lo que el backend realmente devuelve (nullable fields, camelCase)
metadata:
  type: project
---

## Backend usa alias_generator=to_camel en schemas de Inventario y ConsumptionReport

Los schemas del backend (`InventorySchema`, `ConsumptionReportSchema`, `UserConsumptionStatsSchema`) usan `alias_generator=to_camel` con `populate_by_name=True`. Esto significa:
- Las respuestas JSON siempre vienen en camelCase (`currentStock`, `minimumStock`, `categoryId`, etc.)
- Los payloads de request aceptan TANTO snake_case como camelCase
- Los tipos frontend (`InventoryItem`, `ConsumptionReportItem`) ya están en camelCase — correcto ✓

## Desajustes de tipos nullable conocidos (2026-06-28)

### `Sanction.end_date` — CRÍTICO
- Archivo: `src/types/sanction.ts:11`
- Frontend: `end_date: string` (no nullable)
- Backend `SanctionResponse.end_date: Optional[date] = None` → puede devolver `null`
- Impacto: `SuspendStudent.tsx:278` renderiza `{s.end_date}` — JSX renderiza null como vacío pero el tipo está mal
- Corrección: cambiar a `end_date: string | null`

### `InventoryCategory.updatedAt` — MEDIO
- Archivo: `src/types/inventory.ts:28`
- Frontend: `updatedAt: string` (no nullable)
- Backend `InventoryCategoryResponse.updated_at: datetime | None = None` → puede devolver `null`
- Corrección: cambiar a `updatedAt: string | null`

### `InventoryItem.updatedAt` — BAJO
- Archivo: `src/types/inventory.ts:44`
- Backend `InventoryItemResponse.updated_at: datetime | None = None` → puede devolver `null`
- En `InventoryPage.tsx`, `mapInventoryItem` usa `item.updatedAt || item.createdAt` que maneja null en runtime, pero el tipo sigue siendo incorrecto.

## UserConsumptionStats (camelCase correcto)

El backend `UserConsumptionStatsResponse` usa `alias_generator=to_camel`:
- `gender_stats` → `genderStats`
- `career_stats` → `careerStats`  
- `daily_stats` → `dailyStats`

El tipo frontend `UserConsumptionStats` en `api/consumption.ts` ya usa camelCase — correcto ✓

## Endpoint /user-stats filtra por `from`/`to` (no `from_date`/`to_date`)

El endpoint `GET /consumptions/user-stats?from=...&to=...` usa parámetros `from` y `to` (no `from_date`/`to_date`).
El frontend `consumptionApi.userStats({ from, to })` construye esto correctamente.

## External Students API (servicio externo)

- URL base: `VITE_STUDENTS_API_URL` (no documentada en `.env.example`, fallback: `http://localhost:3000/api`)
- Endpoint: `GET /api/users/:cedula`
- Respuesta: `{ id, nombre, documento, email, is_active, foto_perfil }` (campos en español/snake_case)
- El `mapExternalToStudent` convierte al tipo `Student`
- Este servicio NO usa `apiClient` (tiene URL distinta) y NO tiene soporte de refresh token
