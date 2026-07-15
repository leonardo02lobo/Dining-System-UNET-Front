## 1. Render condicional

- [x] 1.1 Envolver la `Card` del `SedeSelector` (+ badge de sesión) en `{!student && ( … )}`
- [x] 1.2 Envolver la `Card` de la barra de búsqueda de cédula en `{!student && ( … )}`
- [x] 1.3 Ocultar también los banners de sede/sesión mientras hay estudiante (mantener el banner de error de registro)

## 2. Preservar contexto

- [x] 2.1 Verificar que `sedeId`/`session` no se pierden al ocultar/reaparecer (viven en estado, no en las Card)

## 3. Validación

- [x] 3.1 Verificar: consultar oculta sede+cédula; registrar/limpiar las restaura
- [x] 3.2 Verificar: escaneo de un nuevo carnet tras registrar reinicia la consulta
- [x] 3.3 Build verde: `npm run build`
