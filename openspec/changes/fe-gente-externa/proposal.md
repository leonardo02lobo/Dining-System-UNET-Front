## Why

Al comedor accede gente externa a la base de datos universitaria (jubilados, personas externas)
sin forma de registrarla. El cliente pidió un apartado paralelo para cargarlos, con los mismos
campos que un estudiante más el tipo jubilado/persona externa (issue **#15**). Change gemela
backend `be-gente-externa` (implementada): recurso `/external-people` (modelo `ExternalPerson`,
enum `ExternalPersonType` JUBILADO/EXTERNO) con CRUD; consumo integrado vía
`consumptions.external_person_id`.

Fase 0 (1.11): campos espejo de estudiante con carrera/foto opcionales; el externo consume por
el mismo flujo. Esta change entrega la **gestión/CRUD** (sub-entrega 1); la opción de registro
de consumo de un externo en la pantalla de comedor se aborda como sub-entrega 2.

## What Changes

- Se añaden `src/types/externalPerson.ts` y `src/api/externalPerson.ts` (list con filtros
  `search`/`person_type`/`status`, get, create, update, delete) sobre `/external-people`.
- Nueva página `ExternalPeoplePage` (ruta `/gente-externa`): tabla con filtros (búsqueda, tipo,
  estado), modal de alta/edición (nombre, apellido, cédula, carnet, tipo, género, carrera,
  correo, estado) y modal de eliminación con confirmación.
- Ruta en `App.tsx`, entrada "Gente Externa" en el grupo Comedor del `NavBar`, acceso
  `SUPER_ADMIN`/`ADMIN` en `routeAccess`.

**Fuera de alcance (sub-entrega 2, documentado):** opción de registrar el consumo de un externo
en la pantalla de registro al comedor.

## Capabilities

### New Capabilities
- `gente-externa-gestion`: gestión (CRUD) de personas externas (jubilado/persona externa) con
  filtros por tipo y estado.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos:** nuevos `src/types/externalPerson.ts`, `src/api/externalPerson.ts`,
  `src/pages/ExternalPeoplePage.tsx`; `src/App.tsx`, `src/components/ui/NavBar.tsx`,
  `src/config/routeAccess.ts`. Backend: sin cambios. Riesgo: medio (recurso nuevo).
