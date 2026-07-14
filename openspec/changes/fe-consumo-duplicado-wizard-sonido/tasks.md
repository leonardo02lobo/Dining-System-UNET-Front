## 1. Sonido

- [x] 1.1 Añadir el asset `public/sounds/duplicate-alert.wav`
- [x] 1.2 Crear `src/utils/sound.ts` con `playSound(src)` best-effort y `DUPLICATE_ALERT_SOUND`

## 2. Aviso en el registro al comedor

- [x] 2.1 En `handleRegister`, distinguir `err.status === 409` (duplicado) del resto de errores
- [x] 2.2 Al detectar duplicado: reproducir el sonido y abrir el modal
- [x] 2.3 Modal con la ficha del usuario (`StudentResultCard` bare) + aviso "ya consumió"
- [x] 2.4 Cerrar el aviso limpia la búsqueda; una nueva consulta también lo cierra
- [x] 2.5 Al terminar el sonido (`onEnded`), cerrar el aviso automáticamente

## 3. Validación

- [x] 3.1 Typecheck estricto: `npx tsc --noEmit`
- [x] 3.2 Build verde y asset servido en `/sounds/duplicate-alert.wav`: `npm run build`
- [ ] 3.3 Prueba manual: registrar dos veces al mismo usuario dispara modal + sonido
