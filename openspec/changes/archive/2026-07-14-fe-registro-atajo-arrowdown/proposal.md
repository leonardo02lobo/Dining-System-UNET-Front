## Why

En la pantalla de registro de comedor, "Consultar" ya se dispara con **Enter**, pero
"Registrar consumo" solo con clic. El cliente pidió que, tras consultar la cédula, el
registro se dispare con la tecla **flecha abajo (ArrowDown)** para operar sin ratón (issue
**#2** de `issues_reunion.md`).

## What Changes

- Se añade en `RegisterDining.tsx` un listener de teclado que, con un estudiante consultado y
  el registro **válido** (misma condición que habilita el botón), ejecuta "Registrar consumo"
  al presionar `ArrowDown`, con `preventDefault`.
- El atajo **convive** con `useBarcodeScanner` (que usa `Enter` para finalizar el escaneo):
  no captura teclas del lector.
- Guardas: no dispara si el registro no es válido, si el modal de suspensión está abierto, ni
  cuando el foco está en un `SELECT`/`TEXTAREA` (para no romper su navegación por flechas).

## Capabilities

### New Capabilities
- `registro-atajo-arrowdown`: atajo de teclado ArrowDown para disparar el registro de consumo
  cuando el registro es válido, sin interferir con el escaneo ni con la navegación de campos.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivo afectado:** `src/pages/RegisterDining.tsx`.
- Sin cambios de backend. Riesgo: bajo (convivencia con lector y navegación por teclado,
  mitigada con guardas).
