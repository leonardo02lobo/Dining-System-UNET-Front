## Why

Se registra a una persona en «Gente Externa» para darle acceso al comedor, llega a la taquilla, se
teclea su cédula y **el sistema no la encuentra**. Hay que pulsar Enter otra vez por si acaso, y la
flecha abajo —el atajo con el que se registra sin soltar el lector— no hace nada.

Los tres síntomas son el mismo fallo. `studentApi.lookup` consulta el padrón y los accesos directos
**en paralelo** y, si el padrón responde 404, **lanza**:

```typescript
if (extResult.status === 'rejected') throw extResult.reason
```

Nunca consulta `/external-people/lookup`, que existe en el servidor desde hace meses y que las
pantallas de comedor ya tienen permiso para invocar. Sin ficha en pantalla no hay botón activo, y el
atajo de flechas está condicionado a `canRegister`, así que tampoco se arma el escuchador: la flecha
abajo "no hace nada" porque no hay a quién registrar.

El fallo alcanza a las tres pantallas que comparten esa búsqueda: registro al comedor, registro
manual y suspensión.

## What Changes

- **`studentApi.lookup` consulta también a la gente externa.** Pasa a lanzar tres búsquedas en
  paralelo (padrón, acceso directo, persona externa) y solo falla cuando **las tres** fallan. Hoy
  falla en cuanto falla la primera.
- **`Student` gana `external_person_id` y `person_kind`**, de modo que la ficha en pantalla sepa qué
  clase de persona es y el registro sepa qué identificador enviar.
- **El registro envía `external_person_id`** cuando la persona es externa, en vez del alta al vuelo
  (`person`), que crearía un acceso directo duplicado de alguien que ya está registrado.
- **La ficha de una persona externa no promete lo que no hay:** sin conteo de suspensiones, sin
  botón de suspender —a la gente externa no se la sanciona— y con la etiqueta en el lugar donde un
  estudiante muestra su tipo de usuario.
- **El aviso de "ya comió hoy" funciona para gente externa**, apoyándose en los campos que añade
  `be-gente-externa-en-comedor` a `check-by-document`.
- **El atajo de flecha abajo queda cubierto por una prueba** que registra a una persona externa, para
  que el síntoma que se reportó no pueda volver en silencio.
- **En «Suspender»**, una persona externa se muestra con la acción deshabilitada y el motivo escrito,
  en vez de un formulario que terminaría en un error del servidor.

## Capabilities

### New Capabilities
- `gente-externa-en-comedor-front`: la búsqueda de las pantallas de comedor resuelve también gente
  externa, y el registro de su consumo usa su propio identificador.

### Modified Capabilities
- `registro-atajo-arrowdown`: el atajo SHALL funcionar para cualquier persona registrable, incluida
  una persona externa.

## Impact

- **Archivos modificados:** `src/api/student.ts` (`lookup` y `registerDining`),
  `src/api/externalPerson.ts` (añadir `lookup`), `src/types/user.ts` (`Student`),
  `src/types/consumption.ts`, `src/pages/RegisterDining.tsx`,
  `src/pages/ManualRegistrationPage.tsx`, `src/pages/SuspendStudent.tsx`,
  `src/components/StudentResultCard.tsx`.
- **Dependencia del backend:** el registro y la búsqueda ya funcionan hoy en el servidor; el aviso
  previo de duplicado necesita `be-gente-externa-en-comedor`. Sin él, la persona externa se puede
  consultar y registrar, pero el duplicado se descubre por el 409 en vez de por el aviso.
- **Interacción con `fe-etiquetas-gente-externa`:** la ficha muestra la etiqueta. Si ese cambio aún no
  está desplegado, muestra lo que traiga el campo de clasificación.
- **Sin cambios de permisos.** `/external-people/lookup` ya admite `/comedor/registrar`,
  `/comedor/consultar` y `/comedor/registro-manual`.

## Non-goals

- Registrar personas externas al vuelo desde la taquilla. Se dan de alta en su pantalla, que es donde
  se les asigna la etiqueta.
- Sancionar gente externa.
- Refundir las tres búsquedas del servidor en un endpoint único.
