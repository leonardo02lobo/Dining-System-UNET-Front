---
name: arch-gotchas
description: Trampas no obvias de arquitectura backend/frontend del Comedor UNET (naming de rutas, doble auditoría, doble reporte, mocks residuales con lógica real)
metadata:
  type: project
---

Conjunto de detalles arquitectónicos no obvios que cuestan tiempo si se redescubren cada vez.

**Naming de rutas inconsistente (backend).** Conviven dos convenciones: español + snake_case (`/accesos_directos`, `/sedes`) e inglés + kebab-case (`/access-reasons`, `/lunch-sessions`, `/lunch-templates`, `/consumption-reports`, `/audit-logs`). El frontend espeja cada una literalmente, así que cualquier "normalización" obliga a tocar ambos lados a la vez.
**Why:** se fueron añadiendo módulos en fases distintas sin convención fija.
**How to apply:** al diseñar un módulo nuevo, elegir explícitamente una convención y declararla; no asumir que existe una única.

**Dos subsistemas de auditoría distintos (no son duplicado).** `LoginAudit` = auditoría de logins, expuesto en `/auth/audit-logs` (lo consume el frontend, página de auditoría). `AuditLog` = auditoría de acciones genéricas, expuesto en `/audit-logs` con `require_permission("/auditoria")`, actualmente SIN consumidor en el frontend.
**How to apply:** si piden "logs", aclarar si es de accesos (login) o de acciones; no mezclarlos.

**Dos subsistemas de reportes con nombres confusamente similares (no son duplicado).** `/reports/*` (ReportsPage, ruta `/comedor/reporte`) = consumos/entradas de personas + sanciones. `/consumption-reports/*` (ConsumptionReportPage, ruta `/inventario/reportes-consumo`) = consumo de INSUMOS de inventario por categoría. La palabra "consumption" está sobrecargada (entrada de persona vs uso de insumo).
**How to apply:** al hablar de reportes, desambiguar "consumo de comensales" vs "consumo de insumos".

**Mocks residuales con lógica real adentro.** `src/data/mockLunch.ts` está MAL NOMBRADO: contiene lógica de negocio real de recálculo (`getRecalculationPreview`, `recalculateIngredients`, `buildIngredientFromTemplate`) que usa la página productiva `CreateLunchPage`. Debería vivir en `utils/` o un hook, no en `data/`. Además `InventorySummaryPanel` (renderizado en `InventoryPage` y `GeneralInventoryPage` reales) sigue tomando datos de `data/mockInventory.ts` → el panel resumen/alertas muestra datos ficticios en producción.
**How to apply:** no confiar en el nombre "mock"; verificar quién importa el archivo antes de borrarlo. Migrar el resumen de inventario a datos reales y mover la lógica de lunch a utils.

**CLAUDE.md (frontend) está desactualizado.** Describe como "mock" cosas ya reales (`api/user.ts` → `/users/` real; `CheckConsumes`/`SuspendStudent` ya usan `consumption.ts` real) y menciona `Dashboard.tsx` que ya no existe.
**How to apply:** verificar el código actual antes de citar el estado de integración del CLAUDE.md.
