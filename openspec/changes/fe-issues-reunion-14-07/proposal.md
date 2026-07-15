## Why

En la reunión del 14/07 (ver `issues_reunion_14_07.md`) se acordó un lote de 10 mejoras de
frontend sobre el Sistema de Comedor UNET. Todas se apoyan en datos y componentes que ya existen
en la app (`SessionHistoryPage`, `RegisterDining`, `ManualRegistrationPage`, `StudentResultCard`,
`Chart`, `Modal`, `Table`), por lo que se agrupan en un único cambio coordinado. Dos issues (#3 y
#8-B) dependen de campos que expone el backend en el cambio hermano `be-issues-reunion-14-07`
(`gender` en el listado de consumos y `sanction_count` en el lookup de acceso directo).

## What Changes

- **#1** Mostrar hora de **apertura** y **cierre** en la tabla del Historial de Sesiones
  (`opened_at`/`closed_at`; "En curso" cuando la sesión sigue abierta).
- **#2** Añadir el **menú del día** (nombre del platillo, cantidad de platos e ingredientes usados)
  al **PDF descargable** de la sesión.
- **#3** **Modal de gráficas** de la sesión: género, carrera (solo estudiantes, set fijo) y rol.
- **#4** **Filtro por rol** (estudiante/administrativo/docente/obrero) en los entrantes de la sesión.
- **#5** Alargar a **~10 s** la **alarma** de registro duplicado.
- **#6** **Contador de registros** de la sede/sesión en la esquina superior de Registro al Comedor.
- **#7** Ventana emergente con las **últimas 10 personas** registradas, que se actualiza al registrar.
- **#8** **Contador de suspensiones** ("Suspendido N veces") en la ficha compartida del usuario.
- **#9** **Eliminar** la pantalla "Acceso Estudiantes" del área de Administración.
- **#10** **Registro Manual** en una sola vista sin scroll + **guardar con la flecha ↓** (como en
  Registro al Comedor).

## Capabilities

### New Capabilities
- `historial-sesiones-horas`: apertura/cierre en la tabla de sesiones (#1).
- `pdf-sesion-menu`: sección de menú del día en el PDF de la sesión (#2).
- `historial-sesiones-graficas`: modal con gráficas de género/carrera/rol de la sesión (#3).
- `historial-sesiones-filtro-rol`: filtro por rol de los entrantes de la sesión (#4).
- `registro-alarma-duplicado-duracion`: duración ~10 s de la alarma de duplicado (#5).
- `registro-comedor-contador-recientes`: contador de sesión + últimas 10 personas (#6, #7).
- `ficha-usuario-contador-suspensiones`: conteo de suspensiones en la ficha del usuario (#8).
- `registro-manual-vista-unica-atajo`: vista única sin scroll + guardar con ↓ (#10).

### Removed Capabilities
- `acceso-estudiantes-admin`: se elimina la pantalla "Acceso Estudiantes" (#9).

## Impact

- **Archivos principales:** `src/pages/SessionHistoryPage.tsx` (#1,#2,#3,#4),
  `src/utils/pdfSessionEntrants.ts` (#2), nuevo `src/utils/sessionStats.ts` (#3),
  `src/utils/sound.ts` + `src/pages/RegisterDining.tsx` (#5,#6,#7),
  `src/components/StudentResultCard.tsx` + pantallas que la usan (#8),
  `src/components/ui/NavBar.tsx` + `src/App.tsx` + `src/pages/StudentAccessPage.tsx` (#9),
  `src/pages/ManualRegistrationPage.tsx` (#10).
- **Tipos:** `src/types/consumption.ts` gana `gender?` y `user_type?` (#3,#4); `src/types/user.ts`
  o el lookup gana el conteo de suspensiones (#8).
- **Dependencia backend:** #3 requiere `gender` en `GET /consumptions`; #8 (opción B) usa
  `sanction_count` del lookup — ambos entregados por `be-issues-reunion-14-07`. Si el backend no
  está listo, #8 cae a la Opción A (`sanctionApi.history(id).total`, una llamada por persona).
- **Build:** mantener verde `npx tsc --noEmit` y `npm run build` (TS estricto: `noUnusedLocals`).
