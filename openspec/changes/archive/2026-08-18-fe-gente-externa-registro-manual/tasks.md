## 1. Tipos y helper de clasificación

- [x] 1.1 En `src/types/consumption.ts`, pasar `ManualConsumption.acceso_directo_id` y `.user_type` a
      opcionales y añadir `external_person_id?: number | null` y `person_type?: string | null`
- [x] 1.2 Revisar `DayConsumption`, que hoy deriva de `ManualConsumption` con `Omit`: debe seguir
      describiendo lo mismo tras la relajación, y añadir `person_type`
- [x] 1.3 Añadir `external_person_id?: number` a `ManualConsumptionCreate` y a
      `ManualConsumptionUpdate`
- [x] 1.4 Añadir `person_type?: string | null` y `external_person_id?: number | null` a `Consumption`
      (el entrante de una sesión)
- [x] 1.5 En `src/utils/labels.ts`, escribir `personClassLabel(row)` = `user_type` traducido, en su
      defecto `person_type` tal cual, en su defecto `null`; documentar por qué la etiqueta **no** pasa
      por `USER_TYPE_LABEL`

## 2. El guardado admite gente externa

- [x] 2.1 En `ManualRegistrationPage.handleSave`, eliminar el corte de `person_kind === 'external'` y
      resolver el cuerpo: `external_person_id` → `acceso_directo_id` → `person`
- [x] 2.2 Comprobar que para una persona externa **no** se envía `person` por ninguna rama
- [x] 2.3 No reintentar con `person` cuando el servidor rechace: se muestra el error y se para
- [x] 2.4 Verificar que el atajo ↓ no tiene ninguna condición que excluya a la gente externa

## 3. Clasificación en las dos pestañas y en el PDF

- [x] 3.1 Usar `personClassLabel` en la columna de tipo de `baseColumns`, con el guion cuando devuelva
      `null`
- [x] 3.2 Añadir el distintivo visible de persona externa en la fila (mismo criterio visual que el de
      la ficha en `StudentResultCard`)
- [x] 3.3 Usar `personClassLabel` en `src/utils/printManual.ts`, para que el PDF y la tabla no puedan
      divergir
- [x] 3.4 Comprobar que una fila sin ninguna de las dos clasificaciones no rompe la tabla ni el PDF

## 4. Edición de una fila de gente externa

- [x] 4.1 En `confirmEdit`, resolver la cédula nueva con `studentApi.lookup` y enviar
      `external_person_id` o `acceso_directo_id` según `person_kind`
- [x] 4.2 Cambiar solo la fecha no debe enviar ningún identificador de persona
- [x] 4.3 Mantener el modal abierto y mostrar el mensaje cuando el servidor rechace

## 5. Los entrantes de la sesión

- [x] 5.1 Componer las opciones del filtro por rol: los cuatro del padrón más una por cada
      `person_type` distinto presente en `entrants`. `labelsPresentIn` y `matchesTypeFilter` viven
      en `src/utils/entrantTypeFilter.ts`, no en la página: así se prueban sin montar una pantalla
      que depende de cinco APIs
- [x] 5.2 Cambiar el filtrado para que compare contra la clasificación efectiva de la fila en vez de
      contra `user_type`
- [x] 5.3 Hacer lo mismo con `CHART_TYPE_OPTIONS` y con el filtro de la población graficada
- [x] 5.4 Reescribir `roleStats` en `src/utils/sessionStats.ts`: un sector por etiqueta, ordenados
      detrás de los cuatro del padrón, y un sector «Sin clasificar» para las filas sin ninguna de las
      dos, de modo que los sectores sumen el total
- [x] 5.5 Comprobar que la opción de carrera de la gráfica sigue apareciendo solo para estudiantes

## 6. El filtro de tipo de persona de las estadísticas

- [x] 6.1 En `src/types/statistics.ts`, abrir `PersonType` (los cuatro `UserType` documentados más
      cualquier nombre de etiqueta) y dejar `PERSON_TYPE_OPTIONS` con solo los cuatro del padrón
- [x] 6.2 Escribir un hook o helper que pida `externalPersonLabelApi.list()` una vez y devuelva las
      opciones combinadas, con los cuatro del padrón como respaldo si la petición falla
- [x] 6.3 Usarlo en `PeriodAttendancePanel` y en `LunchSessionAttendancePanel`
- [x] 6.4 Comprobar que `personTypeAllowsCareer` sigue ocultando y limpiando la carrera para una
      etiqueta, igual que para `TEACHER`
- [x] 6.5 Comprobar que el chip de filtro activo muestra el nombre de la etiqueta y que su ✕ la quita
- [x] 6.6 Comprobar que el filtro persistido en la URL (`personType`) admite un nombre de etiqueta

## 7. Pruebas

- [x] 7.1 `ManualRegistrationPage`: guardar una persona externa envía `external_person_id` y **no**
      `person`
- [x] 7.2 El atajo ↓ registra a una persona externa
- [x] 7.3 Un rechazo del servidor no dispara una segunda petición con `person`
- [x] 7.4 El acceso directo y el alta al vuelo siguen enviando lo de siempre (regresión)
- [x] 7.5 La tabla clasifica: «Docente» para el acceso directo, el nombre de la etiqueta para la
      persona externa, guion cuando no hay ninguna
- [x] 7.6 `printManual`: el PDF escribe las dos clasificaciones
- [x] 7.7 Edición: reasignar a una persona externa envía `external_person_id`; cambiar solo la fecha no
      envía identificador
- [x] 7.8 `entrantTypeFilter`: las opciones son las etiquetas presentes (no el catálogo), el filtro
      compara contra la clasificación efectiva, y elegir un rol del padrón no deja fuera a la gente
      externa al volver a «Todos»
- [x] 7.9 `roleStats`: un sector por etiqueta, orden detrás del padrón, y los sectores suman el total
- [x] 7.10 `usePersonTypeOptions`: las etiquetas del catálogo van detrás de los cuatro del padrón con
      su propio nombre por rótulo; con el catálogo caído queda solo el padrón
- [x] 7.11 `npm test` y `npm run build` en verde

## 8. Cierre

- [x] 8.1 Actualizar `CLAUDE.md` (§7: la clasificación de una fila de consumo pasa por
      `personClassLabel`; el filtro de tipo de persona ya no es una lista fija)
- [x] 8.2 Verificación manual del caso que originó el cambio: dar de alta una persona externa con una
      etiqueta nueva, registrarle un consumo de una fecha pasada desde «Registro Manual», verla en el
      listado con su etiqueta, filtrarla en el historial de sesiones y filtrar por su etiqueta en
      «Reporte al Comedor»

## 9. Fuera del plan, encontrado al aplicarlo

- [x] 9.1 El rótulo del campo de la edición decía «Cédula del acceso directo»: dejó de ser cierto en
      cuanto la reasignación admite a una persona externa. Pasa a «Cédula de la persona»
- [x] 9.2 `DayConsumption` deja de derivarse de `ManualConsumption` con `Omit`: los dos tipos ya
      describen lo mismo, y mantener el `Omit` habría vuelto a separarlos en el próximo cambio
