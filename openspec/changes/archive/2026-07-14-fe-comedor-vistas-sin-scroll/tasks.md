## 1. Fase 0

- [ ] 1.1 Confirmar la resolución mínima objetivo de las máquinas del comedor (bloquea la verificación final)

## 2. Densificación del layout

- [x] 2.1 `CheckConsumes.tsx`: encabezado y tarjeta de búsqueda más compactos; ficha de resultado en columnas (datos + estado/acciones) con menos padding/gap
- [x] 2.2 `RegisterDining.tsx`: misma densificación, priorizando cédula + estado + botón de registrar above-the-fold
- [x] 2.3 No usar `overflow-hidden` con alturas fijas que recorten contenido

## 3. Validación

- [ ] 3.1 Verificar sin scroll en la resolución objetivo (prueba manual con la app corriendo/Tauri)
- [ ] 3.2 Verificar que no hay recorte en resoluciones menores
- [x] 3.3 Build verde: `npm run build`
