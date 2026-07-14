## 1. Implementación del atajo

- [x] 1.1 Añadir un `useEffect` con listener `keydown` en `window` en `RegisterDining.tsx`
- [x] 1.2 Disparar `handleRegister` en `ArrowDown` solo si `student && !isSuspended && !registrationBlocked && !saving && !suspendOpen`, con `preventDefault`
- [x] 1.3 Excluir `SELECT`/`TEXTAREA` como `e.target` para no romper su navegación por flechas

## 2. Validación

- [ ] 2.1 Verificar que ArrowDown registra con estado válido y no hace nada con estado inválido
- [ ] 2.2 Verificar convivencia con `useBarcodeScanner` (Enter) y con el `Enter` de consulta
- [x] 2.3 Build verde: `npm run build`
