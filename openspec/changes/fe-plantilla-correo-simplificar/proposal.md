## Why

La página "Plantilla de Correo de Sanción" mezclaba dos cosas: el editor de la plantilla (más la
configuración del emisor) y un apartado para **buscar una persona por cédula y editar su correo**
"para que reciba la notificación de sanción". Ese apartado es redundante:

- el correo del acceso directo ya se gestiona en su propio módulo (Accesos Directos) y llega en la
  importación CSV, y
- al pulsar **Suspender**, el backend ya envía el correo automáticamente en segundo plano
  (`POST /sanctions/quick` → `notify_sanction`), renderizando la plantilla con los datos del
  usuario (`{nombre}`, `{cedula}`, `{motivo}`, `{descripcion}`, `{fecha_inicio}`, `{fecha_fin}`).

Mantener ese apartado confunde: sugiere un paso manual que no hace falta.

## What Changes

- Eliminar de `EmailTemplatePage` la sección "Correo de la persona a suspender" (búsqueda por
  cédula + edición/guardado del correo del acceso directo), junto con su estado, handlers e
  imports asociados.
- La página queda con dos bloques: configuración del emisor/CC y editor de la plantilla.
- Ajustar el subtítulo para reflejar que el correo se envía automáticamente al suspender.

## Impact

- **Archivos:** `src/pages/EmailTemplatePage.tsx`.
- **Comportamiento:** ninguno en el envío — el correo de sanción ya se dispara solo al suspender.
  Solo se retira una herramienta manual redundante de la UI.
- **Backend:** sin cambios (el envío automático ya existe).
