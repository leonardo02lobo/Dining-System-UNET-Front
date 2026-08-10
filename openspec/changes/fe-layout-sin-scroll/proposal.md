## Why

Registrar un consumo obliga a hacer scroll. El taquillero atiende una fila con el lector en la mano
y, para ver si el botón se encendió o si la persona está suspendida, tiene que soltar el lector y
mover la rueda. Es el gesto de más en la operación que más veces se repite al día.

**Esto ya se intentó y volvió.** `fe-comedor-vistas-sin-scroll` está archivado y su spec exige que las
vistas sean "operables sin scroll **en la resolución objetivo**" — sin decir cuál. Un requisito que no
nombra la resolución no se puede comprobar, así que nadie lo comprobó y la pantalla volvió a crecer.

Y hay una causa estructural que aquel cambio no tocó. `src/index.css` escala el tamaño de fuente raíz
por ancho de pantalla: 16px en móvil, 18px en tablet y **20px a partir de 1024px**. Como todas las
utilidades de Tailwind son relativas a `rem`, en el escritorio de la taquilla cada medida del sistema
crece un 25%. El presupuesto vertical a 1366×768 queda así:

| Región | Alto a 20px de raíz |
|---|---|
| Cabecera (logos a `lg:h-16` = 4rem, más paddings) | ~151px |
| Pie | ~45px |
| Padding de `main` (`p-6` = 1.5rem) | 60px |
| **Disponible para la pantalla** | **~512px de 768** |

Un tercio del alto se va en el marco, y **todo lo que queda dentro está inflado un 25%** por esa raíz
de 20px. Ajustar márgenes dentro de esos 512px es reordenar los muebles; el multiplicador es el que
convierte un diseño que cabía en uno que no.

## What Changes

- **Contrato de layout explícito y verificable**: la ventana NO SHALL desplazarse en ninguna
  pantalla. Lo que sea largo —una tabla, un listado— SHALL desplazarse dentro de su propio panel,
  con cabecera, filtros, acciones y paginación siempre a la vista.
- **`main` deja de ser el que hace scroll.** Hoy es `overflow-y-auto`: es la válvula de escape que
  permite que cualquier pantalla crezca sin que nadie se entere. Pasa a `overflow-hidden`, y cada
  pantalla se hace responsable de su propio alto.
- **La escala tipográfica de escritorio baja de 20px a 16px** y se recupera donde de verdad hace
  falta con tamaños explícitos. Los 20px inflaban el sistema entero para arreglar la legibilidad de
  unos pocos textos.
- **La cabecera de trabajo se encoge un poco más**: al bajar la raíz, sus 151px pasan solos a ~121px;
  el resto se recupera ajustando sus paddings. En `/login` se queda como está — ahí el espacio sobra.
  De paso se corrige el nombre del prop `isLogin` del `Header`, que hoy hace lo contrario de lo que
  dice: el cascarón autenticado lo pasa como `true` y la pantalla de login no lo pasa. El
  comportamiento es el correcto; el nombre miente, y quien toque la cabecera tropezará con ello.
- **Primitiva `ScreenLayout`** que fija el patrón: cabecera fija, cuerpo que se encoge
  (`min-h-0 flex-1 overflow-hidden`) y pie fijo. Las pantallas dejan de inventarse cada una su
  contención, que es de donde salen las diferencias.
- **`RegisterDining` cabe entera a 1366×768** con la ficha, el estado, el contador, el aviso de
  consumo previo y el botón visibles a la vez, sin ningún desplazamiento.
- **Prueba de regresión automática** que renderiza cada pantalla a 1366×768 y falla si el documento
  desborda. Es lo que faltó la vez anterior: sin ella, esto se vuelve a romper en el siguiente
  cambio de UI y nadie lo nota hasta que un taquillero se queja.

## Capabilities

### New Capabilities
- `layout-sin-scroll`: contrato de alto de la aplicación —la ventana no se desplaza, el
  desplazamiento vive dentro de los paneles— y su comprobación automática a una resolución nombrada.

### Modified Capabilities
- `comedor-vistas-compactas`: el requisito deja de apoyarse en una "resolución objetivo" sin nombre y
  pasa a exigir 1366×768 con una comprobación que puede fallar.
- `cabecera-institucional-corregida`: la cabecera de las pantallas de trabajo se acota en alto.

## Impact

- **Archivos nuevos:** `src/components/layout/ScreenLayout.tsx`,
  `src/test/viewport.ts` (utilidad que fija el viewport), `src/pages/noScroll.guard.test.tsx`.
- **Archivos modificados:** `src/index.css` (escala tipográfica), `src/pages/Index.tsx` (`main`),
  `src/components/layout/Header.tsx`, y las pantallas que hoy dependen de que `main` las desplace.
- **Alcance real:** toca las 27 pantallas. Las que ya caben no necesitan cambios de maquetación, solo
  entrar por `ScreenLayout`; las de tabla necesitan que su tabla sea la que se desplaza.
- **Riesgo visible:** bajar la raíz de 20px a 16px cambia el aspecto de **toda** la aplicación. No es
  un ajuste local y así SHALL comunicarse antes de desplegar.
- **Sin cambios de backend.**

## Non-goals

- Rediseñar las pantallas. Es contención de alto, no una revisión visual.
- Soportar por debajo de 1366×768 sin scroll. Por debajo del objetivo, que reaparezca el
  desplazamiento es una degradación aceptable y preferible a recortar contenido.
- Tocar la pantalla de login, que no tiene el problema.
