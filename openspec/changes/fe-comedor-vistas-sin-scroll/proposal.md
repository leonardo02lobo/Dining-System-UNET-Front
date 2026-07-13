## Why

Las vistas de **consulta de consumo** (`CheckConsumes`, `/comedor/consultar`) y **registro de
comedor** (`RegisterDining`, `/comedor/registrar`) requieren desplazamiento vertical para ver
todos los datos y acciones. El cliente pidió que toda la información y las acciones sean
visibles y operables desde el primer momento, **sin scroll**, en la resolución objetivo del
comedor (issue **#1** de `issues_reunion.md`).

## What Changes

- Se reorganiza el layout de `CheckConsumes.tsx` y `RegisterDining.tsx` para reducir el alto
  total: encabezado compacto, tarjeta de búsqueda más ajustada, y la ficha del resultado en
  disposición de columnas (datos + foto/estado + acciones) con menos padding/gaps.
- Se prioriza "above the fold" lo imprescindible: cédula, estado y botón de acción siempre
  visibles.
- **No** se usa `overflow-hidden` con alturas fijas que puedan **recortar** contenido; el
  objetivo es densificar el layout para que quepa, no ocultar información.

## Capabilities

### New Capabilities
- `comedor-vistas-compactas`: layout compacto de las vistas de consulta y registro de comedor
  para operar sin scroll en la resolución objetivo, con estado y acción siempre visibles.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Archivos afectados:** `src/pages/CheckConsumes.tsx`, `src/pages/RegisterDining.tsx`.
- Sin cambios de backend.
- **Dependencia abierta (Fase 0):** la resolución mínima real de las máquinas del comedor no
  está confirmada. La verificación final de "sin scroll" requiere probar la app en esa
  resolución (no es verificable solo con build).
