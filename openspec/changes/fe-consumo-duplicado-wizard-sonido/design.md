## Context

`RegisterDining.handleRegister` llama a `studentApi.registerDining(...)`. El `apiClient` lanza
`ApiError = { message, status, details }`; para consumo duplicado el backend responde `409`
("Acceso directo has already consumed today"). Hasta ahora el `catch` mapeaba cualquier error a un
toast (`errorMessage(err, { 409: CONFLICT.consumptionToday }, …)`).

Existe ya `StudentResultCard` (ficha compartida) y el componente `Modal`. Vite sirve `public/` en la
raíz, por lo que un archivo en `public/sounds/x.wav` queda accesible en `/sounds/x.wav`.

## Goals / Non-Goals

**Goals:**
- Aviso claro (modal con datos del usuario) + sonido cuando el consumo está duplicado.
- Sonido servido desde una ruta pública del frontend, reproducible por URL.
- No romper el flujo si el audio no puede reproducirse.

**Non-Goals:**
- No cambiar el backend ni el contrato del `409`.
- No añadir el aviso sonoro al registro manual (posible extensión futura).
- No un "wizard" de varios pasos: es un aviso de un paso (modal) con los datos del usuario.

## Decisions

### D1 — Rama específica para el `409` en `handleRegister`

Se distingue `err.status === 409` (duplicado) del resto: en ese caso se abre el modal y se dispara
el sonido; los demás errores (incl. `403` de sanción) siguen con el toast/`setError` actuales.

### D2 — Reutilizar `StudentResultCard`

El modal muestra los datos del usuario con la misma ficha compartida (`bare`, sin el aviso de acceso
directo), con el aviso "ya consumió" inyectado por el slot `notice`. Coherencia visual y cero
duplicación de maquetado.

### D3 — Sonido como asset público + utilidad best-effort

El sonido vive en `public/sounds/duplicate-alert.wav` (alerta corta: dos beeps + tono grave). La
utilidad `playSound(src)` crea un `Audio`, ajusta el volumen y captura cualquier fallo
(autoplay bloqueado, archivo ausente) sin propagarlo. Se expone `DUPLICATE_ALERT_SOUND` como la ruta
pública.

### D4 — Limpieza al cerrar y cierre automático al terminar el sonido

"Entendido" limpia cédula/estudiante/estado para atender al siguiente; una nueva consulta o escaneo
también cierra un aviso previo (`triggerSearch` pone `duplicateOpen=false`).

Además, el aviso se **cierra solo cuando termina el sonido**: `playSound` acepta un callback
`onEnded` que se dispara con el evento `ended` (o `error`) del `Audio`, y se enlaza a
`closeDuplicate`. Si el autoplay queda bloqueado no hay reproducción que "termine", así que en ese
caso no se auto-cierra (evita que el modal parpadee) y el cierre queda manual.

## Risks / Trade-offs

- **Autoplay bloqueado** por políticas del navegador → el registro ocurre tras un clic/escaneo (hay
  interacción del usuario), y de todos modos el fallo es silencioso; el modal siempre se muestra.
- **Formato de audio**: WAV PCM por máxima compatibilidad; pesa ~45 KB (aceptable para un asset local).

## Open Questions

- ¿Debe aplicarse el mismo aviso sonoro al **registro manual** (`409` de duplicado por fecha)? Por
  ahora se limita al registro al comedor; fácil de extender reutilizando `playSound` y el modal.
- ¿El cliente quiere poder **silenciar** el sonido o ajustar el volumen desde la configuración?
