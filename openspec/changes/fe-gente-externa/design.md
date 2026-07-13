## Context

Backend `/external-people`: `GET /` (`{total, items}`, filtros `search`/`person_type`/`status`),
`POST /` (409 si document_id duplicado), `GET/PUT/DELETE /{id}`, `GET /lookup`. Campos:
first_name, last_name, document_id, card_code?, email?, gender?, person_type (JUBILADO/EXTERNO),
career?, photo_url?, status (ACTIVE/INACTIVE). Acceso SUPER_ADMIN/ADMIN. `ExternalPersonUpdate`
no incluye `document_id` (no se cambia). El patrón espejo es `AccesoDirectoPage`.

## Goals / Non-Goals

**Goals:** CRUD de personas externas con filtros y selector de tipo (jubilado/externo).
**Non-Goals (sub-entrega 2):** registro de consumo de un externo en la pantalla de comedor.

## Decisions

### D1 — Página CRUD autocontenida con primitivos `ui/`

Se construye `ExternalPeoplePage` con `Table` + `Modal` + `Input`/`Select`, siguiendo el patrón
del proyecto (en vez de acoplarse al componente de AccesoDirecto). Filtros por búsqueda, tipo y
estado que recargan la lista por servidor.

### D2 — Cédula inmutable en edición

En edición, `document_id` es de solo lectura (el backend no lo actualiza). Al crear es
obligatorio; 409 del backend se traduce a "ya existe una persona con esa cédula".

### D3 — Envelope `{total, items}` y camelCase

La lista usa `{total, items}`. El backend `external_person` usa snake_case en el payload
(schemas Pydantic sin alias camel), por lo que los tipos del frontend usan snake_case
(first_name, person_type, etc.), coherente con la respuesta.

## Risks / Trade-offs

- **Integración de consumo diferida** → la gestión no permite aún registrar consumo de un
  externo; se entrega en la sub-entrega 2 para no bloquear.
- **Género** → el backend lo trata como texto opcional; la UI ofrece M/F (o vacío).
- **Duplicado de cédula** entre externos y universitarios → lo controla el backend; la UI
  muestra el 409.

## Open Questions

- ¿Cómo se registra exactamente el consumo de un externo en la pantalla de comedor (sub-entrega 2)?
- ¿Qué valores de género se esperan (M/F vs otros)?
