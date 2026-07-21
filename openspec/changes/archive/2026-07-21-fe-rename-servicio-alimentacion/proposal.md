## Why

El término "Almuerzo" en la interfaz ya no describe correctamente el alcance del sistema: el comedor
UNET presta un **servicio de alimentación** que no se limita al almuerzo. El cliente solicitó
reemplazar el término visible "Almuerzo"/"almuerzo" por "Servicio de alimentación"/"servicio de
alimentación" en todo el texto que ve el usuario, sin tocar identificadores de código, slugs de ruta
ni valores enviados al backend (que sigue usando "lunch" en inglés como dato).

## What Changes

- Reemplazar el texto **visible** "Almuerzo" → "Servicio de alimentación" y "almuerzo" → "servicio de
  alimentación" en títulos, etiquetas, botones, mensajes (toasts/errores), texto de PDF y labels de
  navegación, preservando mayúsculas/minúsculas y acentos.
- **No** se modifican: identificadores de código (tipos, variables, funciones), rutas de import,
  clases CSS, **slugs de URL** (`/inventario/pruebas-almuerzo` en `App.tsx` y `routeAccess.ts`),
  nombres de archivo descargable (slugs kebab como `prueba-almuerzo.pdf`, `lista-almuerzo-*.pdf`) ni
  valores/enums enviados al backend.
- Los **comentarios** de código que mencionan "almuerzo" se dejan como están (bajo valor, no visibles).

## Capabilities

### New Capabilities
- `terminologia-servicio-alimentacion`: la UI muestra "Servicio de alimentación" en lugar de
  "Almuerzo" en todo el texto visible al usuario.

## Impact

- **Archivos:** `src/pages/LunchSessionPage.tsx`, `src/pages/LunchTestPage.tsx`,
  `src/pages/LunchTemplatesPage.tsx`, `src/pages/CreateLunchPage.tsx`, `src/pages/RegisterDining.tsx`,
  `src/pages/CheckConsumes.tsx`, `src/components/lunch/LunchDetailsForm.tsx`,
  `src/components/lunch/LunchIngredientsTable.tsx`, `src/components/lunch/PreloadedLunchBar.tsx`,
  `src/components/ui/NavBar.tsx`, `src/utils/pdfLunch.ts`.
- **Sin cambios de datos ni de contrato con el backend.** Solo texto de UI.
- **Build:** mantener verde `npx tsc --noEmit` y `npm run build`.
