## Context

Backend: `GET/PUT /email-settings` (SUPER_ADMIN), payload `{ from_name, from_address, cc? }`
donde `cc` es una lista separada por comas (el backend valida cada correo). `EmailTemplatePage`
vive en `/admin/plantilla-correo`, ya restringida a `SUPER_ADMIN` en `routeAccess`.

## Goals / Non-Goals

**Goals:** editar emisor (nombre/correo) y CC desde el panel, con carga/guardado y validación
básica.
**Non-Goals:** no se editan credenciales SMTP (host/usuario) desde la UI; CC es global (no por
tipo de correo).

## Decisions

### D1 — Sección en `EmailTemplatePage`

Se añade un `Card` "Configuración del correo" sobre la plantilla existente. Como la ruta ya es
solo `SUPER_ADMIN`, no se requiere gating adicional. CC se maneja como string separado por comas
(igual que el contrato del backend).

### D2 — Validación mínima en cliente

Nombre y correo del emisor obligatorios; el backend valida el formato de correos y de cada CC,
y sus errores se muestran vía `notify`.

## Risks / Trade-offs

- **No exponer credenciales SMTP** → sólo se editan From y CC; las credenciales quedan en `.env`.
- **Formato de CC** → se delega la validación fina al backend; el cliente solo exige From válido.
