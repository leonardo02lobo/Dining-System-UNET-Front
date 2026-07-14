## Why

Al registrar un consumo en "Registro al Comedor", si la persona **ya consumió hoy** el backend
responde `409` y hoy sólo se muestra un *toast* fácil de pasar por alto en un flujo rápido de
escaneo. El cliente pidió un aviso más claro: un **cuadro con los datos del usuario** indicando que
ya consumió, acompañado de un **sonido** para que el taquillero lo note sin mirar la pantalla.

## What Changes

- Cuando `registrar consumo` recibe un `409` (consumo duplicado del día), en lugar del toast se abre
  un **modal** con la ficha del usuario (avatar, cédula, nombre, correo, estado) y el mensaje "Ya
  registró su consumo hoy". Se reutiliza el componente compartido `StudentResultCard`.
- Al abrirse el aviso se **reproduce un sonido de alerta** servido desde una ruta pública del
  frontend (`/sounds/duplicate-alert.wav`, en `public/sounds/`).
- Se añade una utilidad `playSound(src)` *best-effort* (no rompe si el navegador bloquea el
  autoplay o falta el archivo) y la constante `DUPLICATE_ALERT_SOUND`.
- Al cerrar el aviso ("Entendido") se **limpia** la búsqueda para atender al siguiente; una nueva
  consulta/escaneo también cierra un aviso previo.

## Capabilities

### New Capabilities
- `consumo-duplicado-aviso`: aviso visual (modal con datos del usuario) y sonoro cuando se intenta
  registrar un consumo que ya existe para el día.

## Impact

- **Archivos afectados:** `src/pages/RegisterDining.tsx`, nuevo `src/utils/sound.ts`, nuevo asset
  `public/sounds/duplicate-alert.wav`.
- **Backend:** sin cambios (ya devuelve `409` con "already consumed today").
- **Alcance:** la pantalla de registro al comedor (flujo de escaneo). El registro manual mantiene su
  propio manejo (`409` → toast) salvo que se decida unificarlo más adelante.
- **Autoplay:** el navegador puede requerir interacción previa del usuario para reproducir audio; el
  registro se hace por clic/escaneo, así que normalmente ya hubo interacción. El sonido es
  best-effort y nunca bloquea el flujo.
