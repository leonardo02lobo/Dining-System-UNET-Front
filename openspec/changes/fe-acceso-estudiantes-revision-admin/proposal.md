## Why

La pantalla administrativa **"Acceso Estudiantes"** (`StudentAccessPage`, ruta
`/admin/acceso-estudiantes`) lista los accesos de estudiantes (cédula, nombre, hora de ingreso) con
búsqueda, filtro por rango de fechas, paginación y un modal de detalle. El cliente pidió
**verificar y ajustar** esta pantalla porque su comportamiento no es el esperado (datos/filtros/
paginación o el detalle). Es la tarea "Verificar acceso a estudiantes".

## What Changes

- Se **revisa y corrige** el funcionamiento de `StudentAccessPage` contra su API
  (`studentAccessApi.list`): carga del listado, **búsqueda** por cédula/nombre, **filtros** de
  fecha *desde/hasta*, **paginación** (`skip`/`limit`, total y páginas) y **modal de detalle**
  (foto, tipo, carrera, fecha y hora).
- Se corrigen los defectos que se encuentren al verificar cada uno de esos comportamientos y sus
  estados de carga/error/vacío.
- Si la causa está en el **contrato de la API** (campos faltantes o formato), se documenta como
  dependencia hacia el backend; el alcance de esta change es la pantalla y su consumo.

## Capabilities

### New Capabilities
- `acceso-estudiantes-revision-admin`: la pantalla administrativa de acceso de estudiantes lista,
  busca, filtra por fecha, pagina y muestra el detalle de forma correcta y consistente.

## Impact

- **Archivos afectados:** `src/pages/StudentAccessPage.tsx`, `src/api/studentAccess.ts`,
  `src/types/studentAccess.ts`.
- **Dependencia posible:** endpoint de accesos del backend (verificar respuesta `{ total, items }`
  y campos del detalle). Se abre una nota si requiere cambios de contrato.
- Riesgo: bajo/medio; depende de la causa concreta, a confirmar al verificar.
