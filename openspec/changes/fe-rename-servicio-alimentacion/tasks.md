## 1. Navegación y sesión

- [x] 1.1 `NavBar.tsx`: label "Sesión de Almuerzo" y "Pruebas de Almuerzo" → "Servicio de alimentación"
      (mantener slugs `/comedor/sesion` y `/inventario/pruebas-almuerzo`)
- [x] 1.2 `LunchSessionPage.tsx`: títulos "Sesión/Abrir/Cerrar Sesión de Almuerzo" y mensaje "sesión de
      almuerzo activa" → "servicio de alimentación"

## 2. Creación y plantillas

- [x] 2.1 `LunchDetailsForm.tsx`: label "Nombre del almuerzo"
- [x] 2.2 `LunchIngredientsTable.tsx`: `emptyMessage` "Agrega ingredientes al almuerzo."
- [x] 2.3 `PreloadedLunchBar.tsx`: "Almuerzo Precargado", "Seleccionar almuerzo guardado", "Cargar almuerzo"
- [x] 2.4 `CreateLunchPage.tsx`: todos los textos visibles (títulos, labels, botones, toasts, errores)
- [x] 2.5 `LunchTemplatesPage.tsx`: título "Plantillas de almuerzo" y mensaje 409 de plantilla en uso
- [x] 2.6 `LunchTestPage.tsx`: heading, botones y textos visibles + texto de PDF (dejar slug de archivo)

## 3. Registro / consulta / PDF

- [x] 3.1 `RegisterDining.tsx`: mensaje "sesión de almuerzo activa"
- [x] 3.2 `CheckConsumes.tsx`: mensaje "sesión de almuerzo activa"
- [x] 3.3 `pdfLunch.ts`: texto del pie "Lista de preparación de almuerzo" (dejar slug del archivo)

## 4. Verificación

- [x] 4.1 `grep` de "Almuerzo\|almuerzo" y confirmar que solo quedan comentarios y slugs deliberados
- [x] 4.2 Typecheck estricto: `npx tsc --noEmit`
- [x] 4.3 Build verde: `npm run build`
