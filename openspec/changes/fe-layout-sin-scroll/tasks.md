## 1. Medir antes de tocar

- [ ] 1.1 Arrancar la aplicación y abrir `/comedor/registrar` con el navegador a **1366×768** de área
      de contenido; anotar `document.documentElement.scrollHeight` con y sin persona consultada
- [ ] 1.2 Anotar el alto real de cabecera, pie y padding de `main` en ese estado, para saber después
      qué recuperó cada paso
- [ ] 1.3 Confirmar con Leonardo si la taquilla usa el navegador a pantalla completa: con barra de
      pestañas y marcadores se pierden ~120px y el presupuesto real baja a ~648px (pregunta abierta
      del `design.md`)

## 2. El marco

- [ ] 2.1 En `src/index.css`, eliminar las reglas de 18px y 20px: la raíz queda en 16px en todos los
      anchos
- [ ] 2.2 Recorrer la aplicación buscando lo que se haya quedado pequeño de verdad y subirlo con
      clases explícitas sobre esos elementos, **no** devolviendo la escala a la raíz
- [ ] 2.3 Renombrar el prop `isLogin` del `Header` a `compact`, invirtiendo el valor en las dos
      llamadas (`Index` pasa `compact`, `LoginPage` no)
- [ ] 2.4 Ajustar los paddings de la barra de trabajo (no el tamaño de los logos) para bajar la
      cabecera a ~100px
- [ ] 2.5 Volver a medir `/comedor/registrar` y anotar lo recuperado

## 3. La primitiva de layout

- [ ] 3.1 `src/components/layout/ScreenLayout.tsx`: cabecera fija, `ScreenLayout.Body`
      (`min-h-0 flex-1 overflow-hidden`) y `ScreenLayout.Footer` fijo
- [ ] 3.2 Documentar en el propio archivo por qué `min-h-0` es imprescindible: sin él un hijo flex no
      se encoge por debajo de su contenido y el alto se escapa
- [ ] 3.3 En `src/pages/Index.tsx`, cambiar `main` de `overflow-y-auto` a `overflow-hidden` y
      sustituir el comentario que hoy dice que las páginas altas «desbordan y `main` las desplaza»

## 4. Registro al comedor, iterando hasta que quepa

- [ ] 4.1 Reconstruir `RegisterDining` sobre `ScreenLayout`
- [ ] 4.2 Medir; si no cabe, comprimir por este orden: separaciones → tamaños de campo → reagrupar
      columnas. **No** recortar información ni esconderla tras un despliegue
- [ ] 4.3 Repetir 4.2 hasta que `scrollHeight === clientHeight` a 1366×768, con persona consultada,
      aviso de consumo previo visible y botón activo
- [ ] 4.4 Comprobar los estados que más alto ocupan: persona suspendida + aviso de consumo previo +
      aviso de configuración del turno a la vez
- [ ] 4.5 Comprobar la pestaña «Últimos registros» en el mismo alto
- [ ] 4.6 Comprobar que el atajo de flecha abajo y el lector siguen funcionando tras la reconstrucción

## 5. El resto de pantallas

- [ ] 5.1 Migrar a `ScreenLayout` las pantallas que ya caben (solo cambio de contenedor)
- [ ] 5.2 Pantallas de tabla (`StudentsPage`, `AccesoDirectoPage`, `ExternalPeoplePage`, `ListUser`,
      `SuspendedListPage`, `SessionHistoryPage`, `LoginAuditPage`, inventario): el cuerpo de la tabla
      es lo que se desplaza; búsqueda, filtros, encabezado de columnas y paginación quedan fijos
- [ ] 5.3 `ManualRegistrationPage` y `CheckConsumes`: mismo tratamiento que el registro
- [ ] 5.4 Pantallas con gráficas (`ReportsPage`, `ConsumptionReportPage`): las gráficas se ajustan al
      alto disponible en vez de imponerlo
- [ ] 5.5 Modales: comprobar que un modal alto se desplaza por dentro y no arrastra la página
- [ ] 5.6 Repasar que `/login` no ha cambiado

## 6. La prueba que impide que vuelva

- [ ] 6.1 `src/test/viewport.ts`: utilidad que fija `innerWidth`/`innerHeight` a 1366×768
- [ ] 6.2 `src/pages/noScroll.guard.test.tsx`: por cada pantalla, comprobar que entra por
      `ScreenLayout` y que no introduce un contenedor desplazable hasta la raíz
- [ ] 6.3 Escribir en la cabecera del archivo que **no mide píxeles** y que la comprobación visual es
      manual; sin esa nota, la prueba da una falsa sensación de cobertura
- [ ] 6.4 Comprobar que la prueba falla de verdad: añadir temporalmente una pantalla sin
      `ScreenLayout` y verificar el rojo
- [ ] 6.5 `npm test` y `npm run build` en verde

## 7. Cierre

- [ ] 7.1 Actualizar `CLAUDE.md` (§9 Styling: la escala tipográfica ya no varía con el ancho; §3:
      `ScreenLayout`)
- [ ] 7.2 Avisar de que bajar la raíz cambia el aspecto de toda la aplicación, antes de fusionar
- [ ] 7.3 Verificación manual final: recorrer las 27 pantallas a 1366×768 y confirmar que
      `document.scrollingElement.scrollTop` no se mueve en ninguna
