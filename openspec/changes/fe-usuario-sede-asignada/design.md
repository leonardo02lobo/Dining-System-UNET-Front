## Context

`RegisterDining` arranca leyendo la sede del navegador:

```ts
const SEDE_STORAGE_KEY = 'selected_sede_id'
const [sedeId, setSedeId] = useState<number | null>(readStoredSedeId)
```

y de ahí cuelga media pantalla: `handleSedeChange`, `handleSedesLoaded` (que autoselecciona si solo
hay una sede activa), el efecto que consulta la sesión del día, y `registrationBlocked`, que hoy
mezcla tres causas distintas —sin sede, sin sesión, cargando— en una sola bandera.

`SedeSelector` lo usan dos pantallas: el registro y la de sesión. La segunda ya sabe acotarse
(`source: 'openable'`).

`CLAUDE.md` §6 dice que `selected_sede_id` es la **única** clave persistida del proyecto. Tras este
cambio no queda ninguna, y esa frase hay que corregirla.

## Goals / Non-Goals

**Goals:**

- Que la sede se muestre y no se elija donde no es una elección.
- Que la falta de asignación se explique en la pantalla, no en un 403 críptico.
- Quitar el estado de sede del registro, no esconderlo.

**Non-Goals:**

- Cambiar de sede «solo por hoy».
- Acotar reportes, historial o estadísticas.
- Soportar varias sedes por persona.

## Decisions

### 1. Rótulo, no un selector de una sola opción

Un `<select>` con una opción sigue siendo un control: se puede enfocar, invita a abrirlo y ocupa el
alto de un campo. La sede pasa a ser un rótulo junto al turno y la fecha, que es donde el taquillero
ya mira para saber en qué contexto está.

### 2. La sede sale de `AuthContext`, no de una consulta propia

`GET /users/me` ya trae la sede y `AuthContext` ya carga esa ficha al montar. Pedirla otra vez sería
una consulta extra por pantalla para un dato que no cambia dentro de una sesión.

Cambiarla exige que un administrador edite la cuenta; el usuario verá la nueva al volver a entrar.
Reflejarlo en caliente pediría un sondeo permanente para un evento que ocurre una vez al año.

### 3. Sin sede: se bloquea y se dice por qué, sin selector de respaldo

El campo de cédula se deshabilita y el aviso explica qué hacer. **No** se ofrece un selector como
alternativa: el servidor va a responder 403 igualmente, así que ofrecerlo sería fabricar un camino que
termina en error — el mismo fallo que ya costó media hora en `fe-permisos-conceden-capacidad`, donde
la pantalla ofrecía acciones que el servidor rechazaba.

`registrationBlocked` se separa en causas con su propio mensaje, en vez de una bandera que las
confunde:

| Causa | Qué dice la pantalla |
|---|---|
| Sin sede asignada | «Tu cuenta no tiene una sede asignada. Pídele a un administrador que te asigne la tuya.» |
| Sede sin sesión abierta | «No hay una sesión de servicio activa en {sede}.» |
| Cargando | Indicador de carga |

### 4. `/comedor/sesion` conserva su selector, acotado

Ahí la sede **es** el objeto de la operación: abrir una sesión en una sede concreta. Sustituirlo por
un rótulo escondería lo que se está haciendo. Lo que cambia es el alcance: para quien no administra el
selector solo ofrece su sede; para un administrador, todas.

Para el no administrador con una sola opción, el selector se muestra deshabilitado con su sede
elegida: dice qué se va a hacer sin fingir que hay algo que decidir.

### 5. La clave de `localStorage` se elimina, no se ignora

Dejarla escribiéndose «por si acaso» garantiza que dentro de un año alguien la lea y reintroduzca la
elección de sede por la puerta de atrás. Fuera el `SEDE_STORAGE_KEY`, sus lectores y sus escritores, y
corregida la frase de `CLAUDE.md` §6.

No hace falta limpiar la clave de los navegadores existentes: queda huérfana y nadie la lee.

### 6. El campo Sede en usuarios se muestra por rol

El servidor reserva la asignación al SUPER_ADMIN (`permisos-suelo-por-rol`), así que el formulario lo
muestra solo a él. Es el mismo criterio que el servidor, no una traducción suya; el 403 sigue siendo
la autoridad.

Para un ADMIN el campo se muestra **en lectura** dentro de la ficha: necesita saber dónde está
asignada una persona aunque no pueda cambiarlo.

## Risks / Trade-offs

- **El día del despliegue, sin asignaciones, la taquilla queda parada** → Es la contrapartida
  aceptada. La pantalla lo explica en lugar de fallar en seco, y la asignación previa está en las
  tareas de los dos cambios.
- **Un taquillero que hoy cubre dos sedes se queda con una** → El modelo es de una sola y está
  declarado. Si aparece el caso, es otra propuesta.
- **La sede no se refresca hasta volver a entrar** → Aceptado: cambia una vez al año y sondear
  permanentemente por eso no se paga.
- **Quitar el selector libera alto** → Ayuda a `fe-layout-sin-scroll`, pero ese cambio no SHALL
  contar con ello: son independientes y pueden entrar en cualquier orden.

## Open Questions

- ¿Debe la sede aparecer también en la cabecera, junto al nombre y el rol? Sería útil en todas las
  pantallas, pero la cabecera es justo lo que `fe-layout-sin-scroll` quiere encoger. Se deja fuera y
  se decide cuando ese cambio haya asentado el alto.
