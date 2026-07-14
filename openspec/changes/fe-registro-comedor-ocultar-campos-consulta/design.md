## Context

`RegisterDining.tsx` renderiza, en orden: (1) `Card` con `SedeSelector` + badge de sesión, (2)
avisos (sin sede / sin sesión / error), (3) `Card` con la barra de búsqueda de cédula, (4) spinner
de carga, (5) tarjeta del estudiante consultado. El estado `student` controla si hay resultado;
`handleRegister` lo pone a `null` al terminar (reaparecen los controles) y también hay un botón de
limpiar implícito en el flujo. La sede vive en `sedeId` (+`localStorage`), independiente de
`student`.

## Goals / Non-Goals

**Goals:**
- Ocultar sede y cédula mientras `student != null`; restaurarlas al guardar/limpiar.
- Preservar la sede seleccionada y el estado de sesión mientras están ocultos.

**Non-Goals:**
- No cambiar la lógica de registro, sanción ni escaneo.
- No eliminar el estado de sede; sólo su render.

## Decisions

### D1 — Render condicional por `student`, sin desmontar estado

Envolver la `Card` de sede y la `Card` de búsqueda en `{!student && ( … )}`. Como `sedeId` y
`session` viven en estado del componente (no dentro de esas `Card`), ocultarlas no pierde la sede ni
la sesión; al volver `student` a `null`, reaparecen con el mismo contexto.

### D2 — Avisos de sede/sesión también ocultos con estudiante

Los banners "selecciona sede"/"sin sesión" sólo tienen sentido antes de consultar; se ocultan
igualmente mientras hay estudiante para no fragmentar la vista. El aviso de **error** de registro sí
permanece visible.

### D3 — Escaneo tras registrar

Tras `handleRegister`, `student` vuelve a `null` y reaparece el input; el hook de escaneo sigue
escuchando `window`, así que un nuevo carnet reinicia el flujo. Se verifica manualmente.

## Risks / Trade-offs

- **El operador quiere cambiar de sede con un estudiante en pantalla** → debe limpiar/registrar
  primero; es coherente con "un registro a la vez". Si molesta, se puede exceptuar el selector de
  sede (Open Question).

## Open Questions

- ¿Ocultar **ambos** (sede y cédula) o sólo la cédula, dejando visible la sede? El pedido dice
  ambos; se implementa así, fácil de acotar si el cliente prefiere mantener la sede.
