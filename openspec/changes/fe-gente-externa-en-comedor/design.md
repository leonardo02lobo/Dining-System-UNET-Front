## Context

`studentApi.lookup(q)` lanza dos búsquedas en paralelo con `Promise.allSettled` y luego hace:

```typescript
if (extResult.status === 'rejected') throw extResult.reason   // padrón
const student = mapExternalToStudent(extResult.value)
if (adResult.status === 'fulfilled') { /* fusiona el acceso directo */ }
```

El paralelismo es una optimización de latencia, no de tolerancia: el padrón es obligatorio y el
acceso directo opcional. Una persona externa no está en el padrón, así que la búsqueda **siempre**
lanza y ninguna de las tres pantallas que la usan —`RegisterDining`, `ManualRegistrationPage`,
`SuspendStudent`— llega nunca a ver la ficha.

El servidor ya está listo: `GET /external-people/lookup?q=` admite las pantallas de comedor y
`POST /consumptions/` tiene su rama para `external_person_id`. Lo único que falta en el servidor es
el aviso previo de duplicado, que cubre `be-gente-externa-en-comedor`.

El atajo de flechas de `RegisterDining` está condicionado a `canRegister`, que exige `student`. Con
la búsqueda arreglada, el atajo empieza a funcionar sin tocarlo: no hay un fallo aparte que corregir,
hay un síntoma que dejará de darse y que conviene fijar con una prueba.

## Goals / Non-Goals

**Goals:**

- Que una persona externa se consulte y se registre desde las pantallas de comedor.
- Que el registro use su identificador propio y no la dé de alta como acceso directo.
- Que la ficha no prometa acciones que no existen para ella.
- Que el atajo de flecha abajo quede bajo prueba con una persona externa.

**Non-Goals:**

- Alta al vuelo de gente externa desde la taquilla.
- Sanciones para gente externa.
- Refundir los tres endpoints de búsqueda.

## Decisions

### 1. Las tres búsquedas son opcionales; se falla solo si fallan todas

`lookup` pasa a `Promise.allSettled` de tres promesas y el fallo deja de ser "el padrón falló" para
ser "no está en ninguna parte". Ese es el significado que la pantalla necesita.

Orden de precedencia al fusionar:

1. **Padrón** — base de la ficha, y **fuente autoritativa de `career`** (se recarga del CSV oficial
   cada semestre). Sin cambios respecto a hoy.
2. **Acceso directo** — manda en `user_type` e impone `acceso_directo_id`. Sin cambios.
3. **Persona externa** — solo se usa como base cuando las otras dos fallaron.

Una persona externa que además existiera como acceso directo se registra como acceso directo. Es la
misma precedencia que el servidor aplica en `check-by-document`, y el motivo es el mismo: es la clase
de persona que puede tener sanciones.

*Alternativa considerada:* consultar gente externa solo si el padrón falla, en cascada. Descartada:
suma una ida y vuelta al caso más frecuente de la taquilla —la persona externa— para ahorrar una
consulta indexada sobre una tabla pequeña.

### 2. `person_kind` en `Student`, no una inferencia

`Student` gana `external_person_id?: number` y `person_kind: 'roster' | 'acceso_directo' | 'external'`.

Deducir "es externa" de `!is_acceso_directo && !career` es el tipo de inferencia que funciona hasta
que alguien registra a una persona externa con carrera. La ficha, el registro y la pantalla de
suspensión toman tres decisiones distintas sobre lo mismo, así que el dato viaja explícito.

### 3. El registro envía el identificador, nunca el alta al vuelo

`registerDining` decide en este orden:

```
external_person_id  →  si person_kind === 'external'
acceso_directo_id   →  si lo hay
person (alta al vuelo) → resto
```

Enviar `person` para una persona externa crearía un `AccesoDirecto` con su misma cédula: la misma
persona en dos padrones, contada dos veces en las estadísticas y con dos fichas que mantener. El alta
al vuelo existe para el estudiante del padrón que aún no es acceso directo, no para quien ya está
registrado en otro sitio.

### 4. La ficha de una persona externa no ofrece lo que no existe

- Sin conteo de suspensiones y sin consulta de sanción activa: no se lanzan esas peticiones.
- Sin botón de suspender (`canSuspend` ya exige `is_acceso_directo`, así que basta con no añadirlo).
- Donde un estudiante muestra su tipo de usuario, una persona externa muestra su **etiqueta**.
- Un distintivo visible que diga que es una persona externa, para que quien atiende sepa por qué la
  ficha tiene menos cosas.

En `SuspendStudent` la persona externa **se muestra** con el formulario deshabilitado y el motivo
escrito. Ocultarla del todo devolvería el "no la encuentra" que este cambio existe para eliminar; lo
que hay que decir es que no se la puede sancionar, no que no existe.

### 5. El atajo de flechas no se toca: se prueba

`canRegister` ya es la condición correcta y `registro-atajo-arrowdown` ya especifica el
comportamiento. Lo único que cambia es que ahora habrá una ficha de persona externa que lo cumpla. Se
añade un escenario a esa capacidad y una prueba que lo cubre, para que el síntoma reportado no pueda
volver sin que algo se ponga rojo.

### 6. Degradación si el servidor aún no trae `person_kind`

Mientras `be-gente-externa-en-comedor` no esté desplegado, `check-by-document` devuelve
`has_consumed: false` para gente externa. El cliente SHALL seguir mostrando la ficha y permitiendo el
registro; el duplicado lo atrapa el 409, que ya tiene su modal y su alarma. La única pérdida es el
aviso previo. El cliente SHALL NOT romperse por la ausencia de los campos nuevos.

## Risks / Trade-offs

- **Una consulta más por búsqueda** → Va en paralelo; no añade latencia percibida.
- **Una cédula en dos padrones** → Precedencia documentada e igual a la del servidor, y con prueba.
- **Sin el backend desplegado, el aviso previo no cubre a la gente externa** → El 409 sigue siendo la
  red; consta arriba y en las tareas.
- **`mapExternalToStudent` sirve hoy al padrón y su nombre ya confunde** → No se renombra en este
  cambio; se añade una función hermana con nombre propio para la persona externa en vez de sobrecargar
  la existente.

## Open Questions

- ¿Debe `CheckConsumes` (`/comedor/consultar`) resolver también gente externa? Usa su propio flujo y
  no `studentApi.lookup`. Queda fuera de este cambio; si el mismo síntoma aparece ahí, es una tarea
  aparte de una línea.
