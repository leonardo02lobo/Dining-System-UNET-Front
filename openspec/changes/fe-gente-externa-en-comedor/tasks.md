## 1. Capa de API y tipos

- [x] 1.1 Añadir `lookup(q)` a `src/api/externalPerson.ts` sobre `GET /external-people/lookup?q=`
- [x] 1.2 En `src/types/user.ts`, añadir a `Student` los campos `person_kind: 'roster' |
      'acceso_directo' | 'external'` y `external_person_id?: number`
- [x] 1.3 Escribir `mapExternalPersonToStudent(p)` —función propia, **sin** sobrecargar
      `mapExternalToStudent`, que sirve al padrón y ya tiene un nombre confuso
- [x] 1.4 En `src/types/consumption.ts`, admitir `external_person_id` en el cuerpo del registro y los
      campos opcionales `person_kind` / `external_person_id` en la respuesta de `check-by-document`

## 2. Búsqueda de tres orígenes

- [x] 2.1 Reescribir `studentApi.lookup` con `Promise.allSettled` de las tres búsquedas
- [x] 2.2 Fallar solo cuando las tres fallen, con un mensaje único de "no encontrada" que no revele
      cuál falló
- [x] 2.3 Aplicar la precedencia: padrón como base y fuente de `career`; acceso directo impone
      `acceso_directo_id` y `user_type`; persona externa solo como base si las otras dos fallaron
- [x] 2.4 Rellenar `person_kind` y `external_person_id` en el `Student` resultante
- [x] 2.5 Actualizar `src/api/student.test.ts`: los casos existentes deben seguir en verde tal cual

## 3. Registro con el identificador correcto

- [x] 3.1 En `studentApi.registerDining`, resolver en este orden: `external_person_id` si
      `person_kind === 'external'`; en su defecto `acceso_directo_id`; y solo si no hay ninguno, el
      alta al vuelo (`person`)
- [x] 3.2 Comprobar que para una persona externa **no** se envía el objeto `person`
- [x] 3.3 `RegisterDining.handleRegister` pasa `person_kind` y `external_person_id` al payload

## 4. La ficha dice la verdad

- [x] 4.1 En `RegisterDining.triggerSearch`, no lanzar `consumptionApi.check` ni `sanctionApi.history`
      cuando `person_kind === 'external'`
- [x] 4.2 En `StudentResultCard`, ocultar el conteo de suspensiones para gente externa y mostrar su
      etiqueta donde un estudiante muestra su tipo de usuario
- [x] 4.3 Añadir un distintivo visible de "persona externa" en la tarjeta
- [x] 4.4 En `SuspendStudent`, mostrar la ficha de una persona externa con la acción deshabilitada y
      el motivo escrito, en vez de tratarla como no encontrada
- [x] 4.5 En `ManualRegistrationPage`, la ficha de una persona externa se muestra. **El guardado
      queda bloqueado con un mensaje explícito**: `POST /consumptions/manual` no admite
      `external_person_id` —solo resuelve por acceso directo o alta al vuelo—, y enviar `person`
      la duplicaría como acceso directo. Admitirlo exige tocar `ManualConsumptionResponse`
      (`acceso_directo_id` y `user_type` pasarían a opcionales) y con ello el listado manual y sus
      PDFs: queda fuera de esta propuesta y necesita la suya

## 5. Aviso previo y degradación

- [x] 5.1 Leer `person_kind` / `external_person_id` de `check-by-document` cuando vengan, y mostrar el
      aviso de consumo previo también para gente externa
- [x] 5.2 Tolerar su ausencia sin romper: si el servidor no los trae, la ficha se muestra y el
      registro sigue disponible

## 6. Pruebas

- [x] 6.1 `studentApi.lookup`: resuelve una persona externa; falla solo si fallan las tres; el acceso
      directo tiene precedencia sobre la persona externa
- [x] 6.2 `registerDining` envía `external_person_id` y **no** envía `person` para una persona externa
- [x] 6.3 `RegisterDining.test.tsx`: consultada una persona externa, `ArrowDown` dispara el registro y
      la petición lleva su `external_person_id` — la prueba que fija el síntoma reportado
- [x] 6.4 La ficha de una persona externa no pide sanción activa ni histórico, y no ofrece suspender
- [x] 6.5 `SuspendStudent`: la persona externa se muestra con la acción deshabilitada
- [x] 6.6 El aviso previo de duplicado aparece para gente externa, y la pantalla aguanta una respuesta
      sin los campos nuevos
- [x] 6.7 `npm test` y `npm run build` en verde

## 7. Cierre

- [x] 7.1 Actualizar `CLAUDE.md` (§7, fila de `student.ts`: la búsqueda pasa a tener tres orígenes)
- [ ] 7.2 Verificación manual del caso que originó el cambio: registrar una persona en Gente Externa,
      ir a `/comedor/registrar`, teclear su cédula, comprobar que la ficha aparece con **un** Enter y
      que la flecha abajo registra el consumo
