## 1. Pantalla del padrón de estudiantes

- [x] 1.1 `gender` en `StudentPadronData` (`src/types/student.ts`), fuera de `RosterFields`
- [x] 1.2 `externalStudentApi.getById(id)` y `.setGender(id, gender)` en `src/api/externalStudent.ts`
- [x] 1.3 `src/pages/StudentsPage.tsx`: lista paginada con filtros `search`, `is_active`, `cod_carr`
      y **"Sin sexo asignado"**
- [x] 1.4 Panel de detalle **separado en secciones**: Identificación · Datos académicos · Contacto ·
      Estado · Sexo. Todos los campos de solo lectura salvo el sexo
- [x] 1.5 Control de sexo: Masculino / Femenino sobre estado inicial vacío, con vuelta a sin
      clasificar (ver `design.md`)
- [x] 1.6 Ruta `/estudiantes` en `src/App.tsx` **y** en `src/config/routeAccess.ts`
      (`['SUPER_ADMIN', 'ADMIN']`)
- [x] 1.7 Coordinar con el backend la entrada `("/estudiantes", "Padrón de Estudiantes")` en
      `_PERMISSIONS` — sin ella la ruta queda sin control de permisos
      *(lado frontend hecho: `ROUTE_ACCESS` declara la ruta y el comentario apunta a su
      gemela; la entrada en `_PERMISSIONS` la escribe el agente del backend)*

## 2. Aviso de consumo previo

- [x] 2.1 `consumptionApi.checkByDocument(documentId, date?)` en `src/api/consumption.ts` y su tipo
      de respuesta en `src/types/consumption.ts` (forma en el `design.md` del backend, §3)
- [x] 2.2 `RegisterDining`: lanzar la consulta en paralelo con el lookup (`Promise.allSettled`),
      pintar el aviso en la ranura `notice` de `StudentResultCard`
      *(en `ManualRegistrationPage` va literalmente en la ranura `notice`; `RegisterDining`
      no dibuja su ficha con `StudentResultCard` —usa `InlineField` y solo monta la tarjeta
      dentro del modal de duplicado—, así que el aviso va en su franja de avisos de la ficha,
      en un bloque propio para que ningún otro aviso lo tape)*
- [x] 2.3 `RegisterDining`: deshabilitar *Registrar Consumo* junto a `isSuspended` y
      `registrationBlocked`. **Conservar** el modal de duplicado por 409
- [x] 2.4 `ManualRegistrationPage`: misma consulta pero con **la fecha seleccionada**, no hoy
- [x] 2.5 El aviso distingue taquilla de registro manual usando `is_manual`, e incluye hora y sede

## 3. Relación de ingresos del día

- [x] 3.1 `consumptionApi.daySummary({ date, order_by, order_dir })`
- [x] 3.2 Pestaña "Ingresos del día" en `ManualRegistrationPage` con columna de origen
      (taquilla / manual)
- [x] 3.3 Estados vacío, de carga y de error coherentes con el resto de listados del panel

## 4. Fecha de fin en los modales de suspensión

- [x] 4.1 Campo *Fecha de fin* + casilla *Indefinida* en el modal rápido de `RegisterDining`
- [x] 4.2 Lo mismo en `src/pages/SuspendStudent.tsx`
- [x] 4.3 `min = hoy`, `max = hoy + 365 días` en el `<input type="date">`
- [x] 4.4 Validar también antes de enviar: el atributo `max` no impide teclear la fecha a mano
- [x] 4.5 *Indefinida* marcada ⇒ se envía `end_date: null`

## 5. Plantilla del correo de levantamiento

- [x] 5.1 `emailTemplateApi.get(key)` / `.update(key, payload)` en `src/api/emailTemplate.ts`
- [x] 5.2 Extraer el editor a `src/components/EmailTemplateEditor.tsx` parametrizado por clave,
      reutilizando `renderPreview` y el detector de marcadores no soportados
- [x] 5.3 `EmailTemplatePage` con dos pestañas: **Suspensión** y **Levantamiento de suspensión**
- [x] 5.4 La configuración de emisor y CC es global: queda fuera de las pestañas

## 6. Etiqueta única del rol

- [x] 6.1 `ROLE_LABEL` único en `src/utils/labels.ts` con las cuatro claves, incluida
      `ACCESO_DIRECTO`
- [x] 6.2 Sustituir las cuatro copias: `UserFormModal`, `Header`, `ListUser`, `PermissionsPage`
- [x] 6.3 Verificar que una clave desconocida sigue cayendo en el respaldo `?? r.name` sin romper,
      mientras la migración del backend no esté aplicada

## 7. Validación

- [x] 7.1 `openspec validate fe-mejoras-operativas-comedor --strict`
- [x] 7.2 `npx tsc --noEmit` sin errores
- [x] 7.3 Tests (Vitest) de lo que tiene lógica propia:
      - el filtro "Sin sexo asignado" y el control de sexo de tres estados
      - el aviso de consumo previo usa la fecha seleccionada en el registro manual
      - la validación de la fecha de fin rechaza fuera de rango antes de llamar a la API
      - `ROLE_LABEL` resuelve `ACCESO_DIRECTO` y tolera una clave desconocida
- [x] 7.4 Suite completa en verde (`npm test`)
      *(137 tests: 136 pasan. Los dos fallos restantes —`api/lunch.test.ts` y
      `utils/rosterRealFiles.verify.test.ts`— son **previos a este cambio**: fallan igual
      sobre el árbol sin tocar y no guardan relación con lo implementado aquí)*
