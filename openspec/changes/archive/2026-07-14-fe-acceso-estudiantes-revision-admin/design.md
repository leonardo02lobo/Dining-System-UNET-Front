## Context

`StudentAccessPage` mantiene estado local: `rows`, `total`, `page`, `search`, `fromDate`, `toDate`,
`selected`. En un `useEffect` llama a `studentAccessApi.list({ skip, limit, search, from, to })` y
espera `{ items, total }`; resetea `page` al cambiar filtros; calcula `totalPages`. El modal de
detalle muestra `photo_url`, `full_name`, `user_type`, `document_id`, `email`, `career`,
`consumption_date`, `registered_at`, `is_manual`.

Al no haber un defecto único descrito, la change es de **verificación dirigida + corrección**: se
comprueba cada comportamiento y se corrige lo que falle.

## Goals / Non-Goals

**Goals:**
- Que listado, búsqueda, filtros de fecha, paginación y detalle funcionen correctamente y con
  estados de carga/error/vacío coherentes.

**Non-Goals:**
- No rediseñar la pantalla ni añadir funciones nuevas más allá de corregir lo existente.
- No cambiar el modelo de datos del backend (sólo señalar si el contrato es la causa).

## Decisions

### D1 — Checklist de verificación como guía

Verificar en este orden: (1) carga inicial y forma de la respuesta; (2) búsqueda por cédula/nombre
con debounce; (3) filtros *desde/hasta* (inclusividad y reseteo de página); (4) paginación (límites,
`total`, botones deshabilitados); (5) modal de detalle (todos los campos, foto ausente, registro
manual). Cada punto que falle se corrige.

### D2 — Contrato como dependencia, no como alcance oculto

Si la falla viene de la API (campo ausente, `total` incorrecto, formato de fecha), se documenta como
dependencia hacia el backend y se abre una nota; el fix de FE se limita al consumo y presentación.

## Risks / Trade-offs

- **La causa real puede estar en el backend** → se detecta al verificar el contrato; se coordina una
  change de backend si hace falta (fuera de esta).

## Open Questions

- ¿Cuál es el **síntoma exacto** que motivó la tarea (no lista, filtros no aplican, detalle
  incompleto, paginación rota)? Determina el punto del checklist a priorizar.
