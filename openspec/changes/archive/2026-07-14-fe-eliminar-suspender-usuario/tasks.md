## 1. Eliminar la pantalla y su ruta

- [x] 1.1 Buscar referencias a `SuspendStudent` y `/suspendStudent` en el proyecto
- [x] 1.2 Eliminar la ruta (y cualquier alias/redirect) de `src/App.tsx`
- [x] 1.3 Borrar `src/pages/SuspendStudent.tsx`

## 2. Navegación y catálogo

- [x] 2.1 Retirar el ítem "Suspender Usuario" de `src/components/ui/NavBar.tsx`
- [x] 2.2 Quitar la entrada `/suspendStudent` de `src/config/routeAccess.ts`

## 3. Limpieza

- [x] 3.1 Eliminar `SuspendConfirmModal`/helpers sólo si no los usa otra vista (verificado por referencias)
- [x] 3.2 Confirmar que se conservan `/suspendidos` y la suspensión rápida de `RegisterDining`

## 4. Validación

- [x] 4.1 Verificar que no quedan imports colgantes ni `NavLink` a `/suspendStudent`
- [x] 4.2 Build verde: `npm run build`
