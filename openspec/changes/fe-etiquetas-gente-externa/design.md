## Context

`ExternalPeoplePage` mantiene su propio estado (búsqueda, filtro de tipo, formulario, modal de borrado)
y clasifica con un `<Select>` de dos opciones alimentado por el tipo TypeScript
`ExternalPersonType = 'JUBILADO' | 'EXTERNO'`, más un mapa `TYPE_LABEL` para rotularlo. El borrado
individual llama a `externalPersonApi.remove(id)`, que en el servidor es una baja lógica a `INACTIVE`
aunque la pantalla diga "eliminada".

El proyecto ya tiene un patrón para "elige del catálogo o escribe": `CareerInput`, un `<input>` con
`datalist`. Y tiene una regla dura: `confirm()`/`alert()`/`prompt()` están prohibidos y hay un test de
regresión (`nativeDialogs.guard.test.ts`) que falla si reaparecen.

## Goals / Non-Goals

**Goals:**

- Que crear una etiqueta cueste lo mismo que elegirla.
- Que dar de baja a un grupo entero sea una acción deliberada y una sola.
- Que la pantalla diga la verdad sobre qué hace la baja.

**Non-Goals:**

- Pantalla de administración de etiquetas.
- Varias etiquetas por persona.
- Cambiar la clasificación de accesos directos.

## Decisions

### 1. `<Select>` con «+ Nueva etiqueta…», no un `datalist` como `CareerInput`

`CareerInput` usa `datalist` porque la carrera es **texto libre** con sugerencias: un docente puede
escribir un departamento que el catálogo no contempla y eso es correcto. La etiqueta es lo contrario:
es una clave foránea, y dos grafías del mismo grupo lo parten en dos, con la mitad de la gente fuera
de la baja en lote. Por eso el control es un `<Select>` cerrado sobre el catálogo, más una opción
final que abre un campo para crear.

Al elegir «+ Nueva etiqueta…» el selector se sustituye por un `<Input>` con botones *Crear* y
*Cancelar*. Crear llama al catálogo, y la etiqueta recién creada queda seleccionada. Un 409 por
nombre repetido no es un error que mostrar: SHALL seleccionar la etiqueta que ya existía y avisar de
que ya estaba, porque eso es lo que la persona quería.

*Alternativa considerada:* un combobox que crea al perder el foco. Descartada: crear registros como
efecto secundario de salir de un campo es exactamente cómo se llena un catálogo de basura.

### 2. La confirmación del lote exige teclear el nombre de la etiqueta

El modal de la baja individual se confirma con un botón. El de lote, no: muestra el recuento real
—obtenido del listado filtrado por esa etiqueta— y pide escribir el nombre exacto de la etiqueta para
habilitar el botón.

Es fricción deliberada. La acción alcanza a decenas de personas, está en la misma pantalla que la
baja individual y no tiene un deshacer de un clic. El recuento va en el modal y no solo en el mensaje
posterior, porque después de pulsar ya no sirve de nada.

Sigue siendo el `Modal` de la aplicación: `prompt()` está prohibido y el guard test lo vigila.

### 3. La acción de lote se muestra por rol, y el servidor sigue mandando

`useCan()` resuelve por permiso de pantalla, pero la baja en lote no está gobernada por ninguna
pantalla: `permisos-suelo-por-rol` la reserva al rol SUPER_ADMIN y la declara inconcedible. El
cliente comprueba por tanto `user.role.name === 'SUPER_ADMIN'`, que es el mismo criterio que el
servidor, no una traducción suya.

Ocultarla a los demás es informativo, no una defensa: el 403 sigue siendo la autoridad.

### 4. El rótulo es el nombre guardado, sin mapa intermedio

`TYPE_LABEL` desaparece. Con etiquetas que inventa el usuario, cualquier mapa en el cliente sería una
lista incompleta el día siguiente. El servidor guarda el nombre tal como se escribió y el cliente lo
pinta tal cual.

### 5. La pantalla deja de decir "eliminar" a secas

Textos: la acción individual pasa a «Dar de baja», y ambos modales dicen que la persona queda
**inactiva**, que deja de poder acceder al comedor y que **su historial de consumos se conserva**. No
es cosmética: alguien que cree que borra registros y luego los ve en un reporte deja de fiarse del
sistema entero.

### 6. Refresco tras la baja en lote

Al terminar, la pantalla recarga el listado con los filtros vigentes y muestra el recuento devuelto
por el servidor (`deactivated` / `unchanged`), no el que se calculó antes de pulsar. Entre el modal y
la respuesta puede haberse dado de alta a alguien más con esa etiqueta.

## Risks / Trade-offs

- **Un desplegable que crece hasta cincuenta etiquetas** → El `<Select>` nativo aguanta y el filtro
  ayuda; si molesta, el paso siguiente es un buscador dentro del selector, no un rediseño.
- **Escribir el nombre de la etiqueta molesta cuando el nombre es largo** → Es el precio de una acción
  masiva sin deshacer. El nombre está visible en el propio modal para poder copiarlo.
- **Desfase entre cliente y servidor durante el despliegue** → 422 en el alta mientras dura. Ambos
  despliegues SHALL ir juntos; consta en las notas.
- **El recuento del modal puede quedar obsoleto** → Se muestra el del servidor al terminar, que es el
  que cuenta.

## Open Questions

- ¿Debe la pantalla ofrecer «Reactivar todos los de esta etiqueta»? Se deja fuera; la ficha individual
  ya permite volver a `ACTIVE` y nadie lo ha pedido en lote.
