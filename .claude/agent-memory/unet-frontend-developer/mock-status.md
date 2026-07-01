---
name: mock-status
description: Estado actual de qué páginas/APIs usan datos reales del backend vs. mocks pendientes (revisado 2026-06-28)
metadata:
  type: project
---

## Conectado al backend real

- `api/user.ts` — `userApi.list/create/update/remove` + `roleApi.list` — endpoints `/users/` y `/roles/`
- `CheckConsumes` — usa `externalStudentApi` + `accesoDirectoApi` + `consumptionApi.check`
- `SuspendStudent` — usa `externalStudentApi` + `accesoDirectoApi` + `sanctionApi.history/create/revoke`
- `InventoryPage` — usa `inventoryApi` (categorías + items)
- `CreateLunchPage` — usa `inventoryApi` + `lunchApi`
- `ReportsPage` — usa `reportsApi.consumptionReports` + `consumptionApi.userStats`
- `ConsumptionReportPage` — usa `reportsApi.consumptionReports`
- `ManualRegistrationPage` — usa `studentApi.lookup` + `consumptionApi.registerManual/listManual/updateManual/deleteManual`
- `RegisterDining` — usa `studentApi.lookup` + `consumptionApi.check` + `sanctionApi.quickCreate` + `lunchSessionApi.today`
- `SuspendedListPage` — usa `sanctionApi.suspended/lift`
- `LoginAuditPage` — usa `auditApi.getLogs`
- `LunchSessionPage` — usa `lunchSessionApi.today/open/close/list`
- `AccesoDirectoPage` — usa `accesoDirectoApi`
- `VerifyAccesoDirectoPage` — usa `accesoDirectoApi.verify`
- `SedesPage` / `PermissionsPage` — usan sus respectivos APIs

## Dashboard

La página `/dashboard` ya NO existe — la ruta redirige a `/` (página de inicio con marca de agua del logo). No hay componente Dashboard.

## Dead code en archivos mock (no se usan en producción)

- `data/mockConsumptionReport.ts` — No importado en ningún archivo. Puede eliminarse.
- `data/mockInventory.ts` — `MOCK_INVENTORY_ITEMS`, `MOCK_STOCK_ALERTS` son dead code. `getInventorySummary` SÍ se usa en `InventorySummaryPanel.tsx` (función utilitaria, no mock).
- `data/mockLunch.ts` — `MOCK_PANTRY`, `MOCK_PRELOADED_LUNCHES`, `MOCK_INITIAL_INGREDIENTS`, `BASE_PLATES` son dead code. Las funciones `buildIngredientFromTemplate`, `getRecalculationPreview`, `recalculateIngredients` SÍ se usan en `CreateLunchPage` y `LunchTestPage`.

## Tipo legacy sin usar (pendiente de limpieza)

- `types/consumptionReport.ts` define `ConsumptionReportRow` (tipo viejo con snake_case/español: `supply_name`, `consumed_amount`). Solo se usa en `ConsumptionReportPage.tsx` mediante un adaptador `toReportRow()`. Debería migrarse a `ConsumptionReportItem` directo.
