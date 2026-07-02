---
name: tauri-issues
description: Problemas específicos de compatibilidad con Tauri desktop (no afectan el navegador web)
metadata:
  type: project
---

## confirm() y alert() no funcionan bien en Tauri

**Dónde:**
- `src/pages/InventoryPage.tsx:304` — `confirm()` para eliminar insumo
- `src/pages/InventoryPage.tsx:362` — `confirm()` para eliminar categoría
- `src/pages/CreateLunchPage.tsx:398` — `confirm()` para quitar ingrediente del almuerzo
- `src/pages/CreateLunchPage.tsx:538` — `alert()` para confirmar éxito al guardar almuerzo
- `src/pages/LunchTestPage.tsx:273` — `confirm()` para quitar ingrediente

**Por qué:** En Tauri, las APIs de diálogo nativas del navegador (`window.confirm`, `window.alert`) pueden estar deshabilitadas o devolver siempre `false`. Esto significa que las eliminaciones nunca se confirman (confirm siempre false) o la notificación de éxito nunca aparece.

**Corrección:** Reemplazar por:
- `confirm()` → usar `Modal` del proyecto con botones Cancelar/Confirmar
- `alert()` exitoso → usar `notify.success()` de `src/utils/toast.ts`

## window.open en printManual.ts puede fallar en Tauri

**Dónde:** `src/utils/printManual.ts:34`

**Por qué:** Tauri puede bloquear el popup de `window.open('', '_blank', ...)`. El código hace `if (!win) return` silenciosamente sin notificar al usuario.

**Corrección:** Agregar un `notify.error('No se pudo abrir la ventana de impresión.')` cuando `win` es null.

## LunchTestPage usa confirm() también

`src/pages/LunchTestPage.tsx:273` — misma situación que CreateLunchPage.
