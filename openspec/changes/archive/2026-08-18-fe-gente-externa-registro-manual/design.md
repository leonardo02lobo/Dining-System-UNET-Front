# Diseño

## Una sola regla de clasificación, en un solo sitio

El fallo se repite en tres pantallas porque la regla está escrita tres veces y ninguna contempla a la
gente externa. La corrección es un helper en `src/utils/labels.ts`:

```typescript
/** Clasificación efectiva de una fila: tipo del padrón o etiqueta de la persona externa. */
export function personClassLabel(row: { user_type?: string | null; person_type?: string | null }) {
  if (row.user_type) return userTypeLabel(row.user_type)
  return row.person_type ?? null
}
```

`userTypeLabel` se aplica solo al primero: los cuatro tipos del padrón son un enumerado y se traducen;
el nombre de la etiqueta lo escribió una persona y se pinta tal cual. Pasarlo por el mapa lo dejaría
intacto por el respaldo al valor crudo, pero invitaría a que alguien añadiera entradas al mapa para
etiquetas inventadas, que es exactamente lo que `fe-etiquetas-gente-externa` prohíbe.

El helper devuelve `null` y no `'—'`: el guion es decisión de cada vista (la tabla lo pinta, el PDF lo
escribe, el filtro lo ignora).

## El filtro por rol de los entrantes

Hoy `roleFilter` compara `(e.user_type ?? '').toUpperCase() === roleFilter`. Con eso, elegir «Docente»
esconde a la gente externa, y elegir cualquier otra cosa también: no hay valor de `roleFilter` que la
muestre salvo «Todos».

Las opciones pasan a ser los cuatro roles **más una por etiqueta presente en los entrantes cargados**.
Se derivan de las filas y no de `GET /external-people/labels` a propósito: un desplegable que ofrece
la etiqueta de un congreso del año pasado en una sesión donde no entró nadie de ese congreso solo
produce filtros que devuelven una tabla vacía. Las opciones describen lo que hay delante.

El valor de la opción de etiqueta es el nombre de la etiqueta, sin transformar. Para que no colisione
con un rol del padrón, el servidor ya rechaza crear una etiqueta que se llame `STUDENT`, `TEACHER`,
`ADMINISTRATIVE` u `OBRERO`/`WORKER` (`be-etiquetas-gente-externa`, §2.3), así que la comparación no
necesita prefijos ni desambiguación en el cliente.

## `roleStats` agrupa por etiqueta

```typescript
const ut = (e.user_type ?? '').toUpperCase()
if (ut in counts) counts[ut]++
else externo++              // ← todo lo que no es del padrón, en un sector
```

Ese `else` es de cuando había dos tipos de externo fijos. Con etiquetas libres, agrupa en un sector
llamado «Externo» a los jubilados, a los cuarenta de la jornada deportiva y a la comisión de visita:
la gráfica dice «hubo 47 externos» cuando la pregunta que se le hace es de qué grupo eran.

Pasa a acumular por `person_type`, un sector por etiqueta, ordenados después de los cuatro del padrón
para que la lectura de la gráfica no cambie de forma. Las filas sin ninguna de las dos
clasificaciones —que no deberían existir— caen en un sector «Sin clasificar» en vez de desaparecer del
recuento: una gráfica cuyos sectores no suman el total miente peor que una con un sector feo.

## `PersonType` deja de ser una unión cerrada

`export type PersonType = 'STUDENT' | ... | 'JUBILADO' | 'EXTERNO'` era correcto cuando el servidor
validaba contra esa misma lista. Desde `be-etiquetas-gente-externa` el servidor admite los cuatro
`UserType` más cualquier nombre del catálogo, así que el tipo cerrado en el cliente solo puede
quedarse corto.

Pasa a `type PersonType = UserTypeValue | string`, es decir `string` con el enumerado documentado. Se
pierde el autocompletado de los dos literales de externo; se gana que el filtro pueda enviar la
etiqueta que se creó ayer. `personTypeAllowsCareer` no cambia: sigue devolviendo `true` solo para
`STUDENT` y para «Todos», y una etiqueta nunca es `STUDENT`.

Las opciones del desplegable se piden una vez por montaje del panel. Si la petición falla, el
desplegable se queda con los cuatro tipos del padrón y el panel funciona: perder las etiquetas del
filtro es peor que hoy solo para quien iba a filtrar por una, y mejor que una pantalla que no carga.

## Por qué el guardado no reintenta con `person`

Cuando el servidor rechace el registro de una persona externa, la pantalla SHALL mostrar el error y
**no** SHALL reintentar con el alta al vuelo. Ese reintento es justamente lo que
`fe-gente-externa-en-comedor` cortó: crearía un acceso directo con la cédula de alguien que ya está
registrado como externo, y la misma persona quedaría en dos padrones, contada dos veces en las
estadísticas de las que trata la otra mitad de esta propuesta.

## Lo que no cambia

- La ficha compartida (`StudentResultCard`), que ya muestra la etiqueta y ya oculta el contador de
  suspensiones para la gente externa.
- El atajo de flecha ↓, que registra lo que la pantalla sepa registrar y ahora sabe una cosa más.
- «Registro al Comedor», que ya resuelve y registra a la gente externa.
- La pantalla de gente externa y su catálogo de etiquetas.
