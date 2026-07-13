## Why

El emisor y las copias (CC) del correo estaban fijados por variables de entorno; no se podían
configurar desde la interfaz. El cliente pidió configurarlos desde el panel de administración
(junto a la plantilla de correo) — issue **#5**. Change gemela backend
`be-email-settings-emisor-cc` (implementada): `GET`/`PUT /email-settings` (SUPER_ADMIN) con
`from_name`, `from_address`, `cc`; `services/email.py` los usa con fallback a config.

Fase 0 (1.10): la UI edita solo "From" (nombre + dirección) y CC; las credenciales SMTP siguen
en `.env`; CC es global.

## What Changes

- Se añade `emailSettingsApi` (`get`/`update`) en `src/api/emailTemplate.ts` con los tipos
  `EmailSettings`/`EmailSettingsUpdate`.
- En `EmailTemplatePage` (ya protegida solo para `SUPER_ADMIN`) se añade una sección/`Card`
  **"Configuración del correo"** con nombre del emisor, correo del emisor y CC (lista separada
  por comas), cargada y guardada vía la API.

## Capabilities

### New Capabilities
- `panel-config-correo`: configuración del emisor (nombre/dirección) y CC del correo desde el
  panel de administración.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos:** `src/api/emailTemplate.ts` (email settings), `src/pages/EmailTemplatePage.tsx`
  (sección de configuración). Backend: sin cambios. No expone credenciales SMTP. Riesgo: bajo.
