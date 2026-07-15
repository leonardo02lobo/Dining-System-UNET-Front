## Why

En "Registro al Comedor" (`RegisterDining.tsx`), tras **consultar** una cédula y mostrar la
tarjeta del estudiante, los controles de **sede** (selector) y **cédula** (barra de búsqueda)
siguen ocupando espacio en pantalla y distraen del gesto de registrar. El cliente pidió
**ocultar los campos de sede y cédula cuando se consulta un usuario** y que **vuelvan a aparecer
al guardar** (registrar) o limpiar, para que la vista quede centrada en la tarjeta del estudiante
durante el registro.

## What Changes

- Cuando hay un estudiante consultado (`student != null`), se **ocultan**:
  - la tarjeta del **selector de sede** (`SedeSelector`) y su badge de estado de sesión,
  - la **barra de búsqueda** de cédula (input + botón "Consultar" + ayuda del lector).
- Al **registrar consumo** (guardar) —que ya limpia `student`— o al no haber estudiante, ambos
  controles **reaparecen**.
- La **sede seleccionada se preserva** en estado/`localStorage` mientras está oculta (no se pierde
  el contexto de la sesión); sólo cambia su visibilidad.
- El **lector de código de barras** sigue activo; al ocultarse el input no se rompe el escaneo (el
  hook escucha `window`), pero se revisa que el flujo de un nuevo escaneo tras registrar funcione.

## Capabilities

### New Capabilities
- `registro-comedor-ocultar-campos-consulta`: en la pantalla de registro al comedor, ocultar los
  controles de sede y cédula mientras se muestra un estudiante consultado y restaurarlos al
  guardar o limpiar.

## Impact

- **Archivo afectado:** `src/pages/RegisterDining.tsx` (render condicional de las dos `Card`).
- Sin cambios de backend. Riesgo: bajo; se conserva el estado de sede y el escaneo.
