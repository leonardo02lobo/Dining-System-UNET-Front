## Context

`EmailTemplatePage` edita asunto y cuerpo de la plantilla de sanción vía `api/emailTemplate.ts`
contra el backend, que guarda la plantilla editable y, si no hay, usa un default. El render real
(sustitución de marcadores y conversión a HTML) lo hace el backend (`build_sanction_email`); el
frontend sólo edita el texto y sus marcadores. El conjunto de marcadores soportados es el contrato
compartido con el backend.

## Goals / Non-Goals

**Goals:**
- Editor alineado con los marcadores soportados, con inserción y previsualización.
- Guardado/reset con feedback y validación de marcadores no soportados.

**Non-Goals:**
- No implementar el render definitivo en el FE (lo hace el backend); la previsualización es
  aproximada con valores de ejemplo.
- No definir el contenido por defecto canónico (vive en el backend).

## Decisions

### D1 — Marcadores soportados como fuente compartida

La lista de marcadores que el editor ofrece insertar debe coincidir con la del backend
(`be-plantilla-correo-contenido`). Se mantiene esa lista en un solo lugar del FE y, si el backend la
expone por API, se consume de ahí para evitar divergencias.

### D2 — Previsualización con valores de ejemplo

La previsualización sustituye los marcadores por valores de muestra y aplica un formato simple
(texto → HTML) equivalente al del backend, dejando claro que es una aproximación. Ayuda a validar la
redacción sin enviar un correo real.

### D3 — Validación de marcadores no soportados

Al guardar, si el texto contiene un marcador con forma `{...}` que no pertenece al conjunto
soportado, se advierte (no bloquea necesariamente, ya que el backend tolera llaves sueltas, pero se
avisa para evitar errores de redacción).

## Risks / Trade-offs

- **Previsualización distinta del render real** → mitigado replicando el formato simple del backend
  y etiquetándola como aproximada.
- **Divergencia de marcadores FE/BE** → mitigado con lista compartida / consumo del contrato.

## Open Questions

- ¿El backend expondrá la lista de marcadores por API o se mantiene duplicada y documentada en el
  FE? (Se asume duplicada+documentada salvo que el gemelo de backend ofrezca el endpoint.)
- ¿La redacción por defecto nueva la fija el backend? (Sí; el FE sólo refleja placeholder/ayuda.)
