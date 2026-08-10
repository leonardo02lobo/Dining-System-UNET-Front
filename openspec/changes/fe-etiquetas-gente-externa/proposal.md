## Why

En «Registrar persona externa» el campo *Tipo de persona* es un desplegable de dos opciones fijas
—*Persona externa* y *Jubilado*— y no hay forma de añadir una tercera. Quien administra el comedor no
da acceso a "externos": da acceso a **grupos** —un congreso, una jornada deportiva, una comisión— y
necesita marcar de dónde salió cada persona para poder retirar el acceso a todo el grupo cuando el
evento termine.

Hoy esa retirada es una fila a la vez: abrir el menú, confirmar, esperar la recarga, repetir. Con
cuarenta invitados son cuarenta confirmaciones, y lo que ocurre en la práctica es que no se hace y la
lista de gente externa crece con gente que ya no debería entrar.

## What Changes

- **El desplegable deja de ser fijo.** *Tipo de persona* pasa a llamarse **Etiqueta** y se alimenta
  del catálogo del servidor, con una opción **«+ Nueva etiqueta…»** que la crea sin salir del
  formulario. Se siembra con *Jubilado* y *Externo*, así que nada de lo ya registrado cambia.
- **Filtro por etiqueta** en la barra de la pantalla, sustituyendo al filtro de tipo.
- **Acción «Eliminar todos los de esta etiqueta»**, visible solo para SUPER_ADMIN (es lo que el
  servidor exige). Abre un modal que dice **cuántas personas** se van a dar de baja y **exige teclear
  el nombre de la etiqueta** para confirmar.
- **La columna «Tipo» pasa a «Etiqueta»** y muestra el nombre tal como se guardó. Desaparece el mapa
  `TYPE_LABEL`: con etiquetas que inventa el usuario, un mapa de rótulos en el cliente solo puede
  quedarse corto.
- **La baja se llama baja.** El texto de la acción individual y el del lote SHALL decir que la persona
  queda **inactiva** y que su historial se conserva, en vez de "eliminada". Es lo que el servidor hace
  desde siempre y lo que la pantalla nunca dijo.
- **BREAKING** — `ExternalPersonType` desaparece de `src/types/externalPerson.ts`; `person_type` pasa
  a `label_id` + `label`.

## Capabilities

### New Capabilities
- `etiquetas-gente-externa-front`: el selector de etiqueta con creación en línea, el filtro por
  etiqueta y la baja en lote confirmada.

### Modified Capabilities
- `gente-externa-gestion`: la pantalla de gente externa deja de clasificar por un tipo fijo.

## Impact

- **Archivos nuevos:** `src/api/externalPersonLabel.ts`, `src/types/externalPersonLabel.ts`,
  `src/components/ExternalPersonLabelSelect.tsx`.
- **Archivos modificados:** `src/pages/ExternalPeoplePage.tsx`, `src/api/externalPerson.ts`,
  `src/types/externalPerson.ts`.
- **Dependencia dura del backend:** consume `be-etiquetas-gente-externa`. Los dos SHALL desplegarse
  juntos: entre un despliegue y otro, el cliente antiguo envía `person_type` y recibe 422.
- **Sin cambios de permisos.** La pantalla sigue detrás de `/gente-externa`; lo único que se comprueba
  por rol es la baja en lote, que el servidor reserva a SUPER_ADMIN.

## Non-goals

- Una pantalla de administración de etiquetas aparte. Se crean donde se usan; borrarlas y renombrarlas
  puede esperar a que alguien lo pida.
- Varias etiquetas por persona.
- Tocar los accesos directos o el padrón.
