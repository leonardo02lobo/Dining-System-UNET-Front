---
name: duplicate-patterns
description: Patrones duplicados en el codebase que deberían extraerse (revisado 2026-06-28)
metadata:
  type: project
---

## Scanner de código de barras (duplicado x3)

El mismo bloque de ~30 líneas (useRef + useEffect + bufferRef + lastKeyAtRef) está copiado en:
- `src/pages/RegisterDining.tsx:42-84`
- `src/pages/CheckConsumes.tsx:28-63`
- `src/pages/SuspendStudent.tsx:41-70`

**Por qué:** Se necesita filtrar el foco (INPUT/TEXTAREA) y acumular chars con gap < 60ms.
**Corrección:** Extraer a `src/hooks/useBarcodeScanner.ts`:
```typescript
function useBarcodeScanner(onScan: (value: string) => void, minLength = 6) { ... }
```

## USER_TYPE_LABEL (duplicado x4)

```typescript
const USER_TYPE_LABEL: Record<string, string> = {
  STUDENT: 'Estudiante', TEACHER: 'Docente',
  ADMINISTRATIVE: 'Administrativo', WORKER: 'Obrero',
}
```
Duplicado en:
- `src/utils/printManual.ts:3`
- `src/pages/AccesoDirectoPage.tsx:28` (typed as `Record<UserType, string>`)
- `src/pages/ManualRegistrationPage.tsx:21`
- `src/pages/SuspendedListPage.tsx:14`

**Corrección:** Mover a `src/utils/labels.ts` (o `src/constants/userTypes.ts`).

## Dos tipos RoleName con definiciones distintas

- `src/types/auth.ts:1` — `RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'TAQUILLERO' | 'ACCESO_DIRECTO'` (4 valores)
- `src/types/user.ts:1` — `RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'TAQUILLERO'` (3 valores, sin ACCESO_DIRECTO)

`ListUser.tsx` importa de `types/user`, el resto de `types/auth`.
**Corrección:** Eliminar `RoleName` de `types/user.ts` e importar de `types/auth.ts` donde se necesite.

## loadImageData/loadPdfImage duplicado

La misma función utilitaria para escalar imágenes para PDF está copiada en:
- `src/pages/CreateLunchPage.tsx` (como `loadPdfImage`)
- `src/pages/ConsumptionReportPage.tsx` (como `loadImageData`)

Tienen la misma lógica. Debería extraerse a `src/utils/pdfLogos.ts` (que ya existe para los logos).
