## Context

`RegisterDining.tsx` ya consulta con `Enter` (`handleKeyDown` en el input) y registra con
`handleRegister` (botón deshabilitado por `isSuspended || registrationBlocked`). El escaneo
usa `useBarcodeScanner`, que escucha `keydown` global y finaliza con `Enter` (no usa
`ArrowDown`). El botón "Registrar Consumo" también depende de `saving`.

## Goals / Non-Goals

**Goals:**
- `ArrowDown` dispara `handleRegister` cuando el registro es válido.
- No interferir con el escaneo (`Enter`) ni con la navegación de `select`/`textarea`.

**Non-Goals:**
- No se extiende `useBarcodeScanner` (se mantiene desacoplado el escaneo de los atajos).
- No se cambia la lógica de habilitación del registro (se reutiliza la del botón).

## Decisions

### D1 — Listener a nivel de ventana con guardas, no dentro de `useBarcodeScanner`

Se añade un `useEffect` que registra un `keydown` en `window` y, solo si el registro es
válido, ejecuta `handleRegister` en `ArrowDown` con `preventDefault`. Alternativa (extender
el hook del lector) rechazada: acopla escaneo con atajos.

**Condición de disparo** (reusa la habilitación del botón):
`!!student && !isSuspended && !registrationBlocked && !saving`, y además `!suspendOpen`.

**Guardas de foco:** si `e.target` es `SELECT` o `TEXTAREA`, no se intercepta (se preserva su
navegación por flechas). El input de cédula (`INPUT`) sí permite el atajo, coherente con
"al ingresar la cédula del estudiante".

### D2 — Alcance del atajo: toda la vista

El atajo aplica en toda la pantalla (no solo con foco en el campo cédula), lo que da la
operación sin ratón que pide el issue. Las guardas evitan efectos colaterales.

## Risks / Trade-offs

- **Conflicto con navegación por flechas en controles** → mitigado excluyendo `SELECT`/`TEXTAREA`.
- **Doble disparo / registro mientras guarda** → mitigado con `!saving` en la condición.
- **Interferencia con el lector** → el lector usa `Enter`, no `ArrowDown`; sin conflicto.

## Open Questions

- ¿El atajo debería limitarse al foco del campo cédula? (Se optó por toda la vista con guardas;
  fácil de acotar si el cliente lo prefiere).
