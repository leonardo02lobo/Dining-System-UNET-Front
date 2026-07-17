## 1. Simplificar la página (`src/pages/EmailTemplatePage.tsx`)

- [x] 1.1 Eliminar la Card "Correo de la persona a suspender" (búsqueda por cédula + edición del
      correo del acceso directo)
- [x] 1.2 Eliminar el estado y handlers asociados (`cedula`, `person`, `email`, `searching`,
      `savingEmail`, `handleSearchPerson`, `handleSaveEmail`)
- [x] 1.3 Limpiar imports que quedan sin uso (`accesoDirectoApi`, tipo `AccesoDirecto`,
      `normalizeCedula`, iconos `Search`/`Mail`, `Badge`)
- [x] 1.4 Ajustar el subtítulo de la página

## 2. Verificación

- [x] 2.1 Typecheck estricto: `npx tsc --noEmit`
- [x] 2.2 Build verde: `npm run build`
- [x] 2.3 `openspec validate fe-plantilla-correo-simplificar --strict`
