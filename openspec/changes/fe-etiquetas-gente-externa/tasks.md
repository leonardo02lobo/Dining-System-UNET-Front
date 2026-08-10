## 1. Tipos y capa de API

- [ ] 1.1 `src/types/externalPersonLabel.ts`: `ExternalPersonLabel`, `ExternalPersonLabelCreate`,
      `LabelDeactivateResult` (`label_id`, `label`, `total`, `deactivated`, `unchanged`)
- [ ] 1.2 `src/api/externalPersonLabel.ts`: `list`, `create`, `rename`, `remove`, `deactivateAll`
      sobre `/external-people/labels`
- [ ] 1.3 En `src/types/externalPerson.ts`, sustituir `person_type` por `label_id` + `label` y
      **eliminar** el tipo `ExternalPersonType`
- [ ] 1.4 En `src/api/externalPerson.ts`, cambiar el parámetro de filtro `person_type` por `label_id`
- [ ] 1.5 Comprobar con `npm run build` que no queda ningún uso de `ExternalPersonType` (el `tsc` del
      build lo hace fallar si lo hay)

## 2. Selector de etiqueta con creación en línea

- [ ] 2.1 `src/components/ExternalPersonLabelSelect.tsx`: `<Select>` alimentado por el catálogo, con
      la opción final «+ Nueva etiqueta…»
- [ ] 2.2 Modo de creación: `<Input>` con *Crear* / *Cancelar*; al crear, la etiqueta queda
      seleccionada sin recargar ni perder lo escrito en el resto del formulario
- [ ] 2.3 409 por nombre repetido → seleccionar la etiqueta existente y avisar de que ya estaba, sin
      pintar un error
- [ ] 2.4 409 por nombre reservado → mensaje junto al campo, con el modo de creación abierto
- [ ] 2.5 Etiquetar el control con `label`/`id` propios para que sea navegable con teclado y legible
      por lector de pantalla

## 3. Pantalla de gente externa

- [ ] 3.1 Sustituir el `<Select>` de *Tipo de persona* del formulario por `ExternalPersonLabelSelect`
      y hacer la etiqueta obligatoria en la validación
- [ ] 3.2 Sustituir el filtro de tipo de la barra por un filtro de etiqueta alimentado por el catálogo
- [ ] 3.3 Renombrar la columna «Tipo» a «Etiqueta», mostrar `p.label` y **borrar el mapa `TYPE_LABEL`**
- [ ] 3.4 Reescribir los textos de la baja individual: «Dar de baja», la persona queda **inactiva**,
      deja de acceder al comedor y su historial se conserva
- [ ] 3.5 Actualizar el subtítulo de la cabecera, que hoy habla de «jubilados y personas externas»

## 4. Baja en lote

- [ ] 4.1 Acción «Dar de baja a todos los de esta etiqueta», visible solo si
      `user.role.name === 'SUPER_ADMIN'`
- [ ] 4.2 Modal de confirmación con el nombre de la etiqueta, el recuento de personas alcanzadas y el
      texto sobre inactividad e historial conservado
- [ ] 4.3 Campo de confirmación que exige teclear el nombre exacto; botón deshabilitado mientras no
      coincida
- [ ] 4.4 Al confirmar, llamar a `deactivateAll` y mostrar el recuento **devuelto por el servidor**
- [ ] 4.5 Recargar el listado con los filtros vigentes al terminar
- [ ] 4.6 Mostrar el mensaje del servidor ante un 403 sin dejar la tabla en un estado falso

## 5. Pruebas

- [ ] 5.1 `ExternalPeoplePage.test.tsx`: el desplegable se alimenta del catálogo y no de una lista fija
- [ ] 5.2 Creación en línea: crea, queda seleccionada y el resto del formulario conserva lo escrito
- [ ] 5.3 409 repetido → selecciona la existente; 409 reservado → mensaje junto al campo
- [ ] 5.4 Filtro por etiqueta y columna rotulada con el nombre guardado
- [ ] 5.5 Baja en lote: botón deshabilitado con el nombre mal escrito, habilitado con el correcto,
      recuento del servidor y recarga
- [ ] 5.6 La acción de lote no se renderiza para un ADMIN
- [ ] 5.7 `nativeDialogs.guard.test.ts` sigue en verde
- [ ] 5.8 `npm test` y `npm run build` en verde

## 6. Cierre

- [ ] 6.1 Actualizar `CLAUDE.md` (§5 fila de `/gente-externa`, §7 lista de módulos de API)
- [ ] 6.2 Verificación manual del caso que originó el cambio: crear la etiqueta de un evento, registrar
      tres personas con ella, dar de baja el lote y comprobar que ninguna de las tres es encontrada
      desde `/comedor/registrar`
