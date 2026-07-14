## Why

El panel **"Plantilla de Correo"** (`EmailTemplatePage`, ruta `/admin/plantilla-correo`) edita el
asunto y cuerpo del correo de sanción que el backend renderiza. El cliente pidió **modificar la
plantilla de correo** tanto en su **contenido** como en la **forma de editarla**. Es el lado
frontend de "Modificar plantilla de correo", gemelo de `be-plantilla-correo-contenido`.

## What Changes

- Se **alinea el editor** con el conjunto de marcadores soportados por el backend (`{nombre}`,
  `{motivo}`, `{descripcion}`, `{fecha_inicio}`, `{fecha_fin}` y los nuevos que defina el gemelo de
  backend): se ofrece **insertar marcadores** (chips/botones) y se documenta qué significa cada uno.
- Se añade una **previsualización** del correo con valores de ejemplo, para que el editor vea el
  resultado renderizado antes de guardar.
- Se mejora el flujo de **edición/guardado/reset a por defecto** (validación de marcadores no
  soportados, feedback de guardado) contra `api/emailTemplate.ts`.
- Si el cliente aportó una **redacción por defecto** nueva, se refleja como texto inicial/placeholder
  (el contenido por defecto canónico vive en el backend).

## Capabilities

### New Capabilities
- `plantilla-correo-editor`: editor de la plantilla de correo de sanción con inserción de marcadores
  soportados, previsualización y guardado, alineado con el contrato del backend.

## Impact

- **Archivos afectados:** `src/pages/EmailTemplatePage.tsx`, `src/api/emailTemplate.ts`,
  tipos asociados.
- **Coordinación:** gemelo de `be-plantilla-correo-contenido` (fuente del conjunto de marcadores y
  del contenido por defecto). El editor debe ofrecer exactamente los marcadores soportados.
- Riesgo: bajo; la pantalla ya existe y el contrato lo fija el backend.
