## 1. Componente compartido

- [x] 1.1 Crear `src/components/StudentResultCard.tsx` a partir de la tarjeta de `RegisterDining`/`CheckConsumes`
- [x] 1.2 Definir props: `student`, avisos opcionales (`sanction?`, acceso directo/alta), y slot `actions?`

## 2. Adopción en registro manual

- [x] 2.1 Reemplazar el bloque ad-hoc de `ManualRegistrationPage` por `StudentResultCard`
- [x] 2.2 Pasar el botón "Guardar Registro"/"Limpiar" por el slot `actions`

## 3. Adopción en las demás pantallas (recomendado)

- [x] 3.1 Migrar `RegisterDining` a `StudentResultCard` (acciones Registrar/Suspender por slot)
- [x] 3.2 Migrar `CheckConsumes` a `StudentResultCard` (aviso de consumo/sanción)

## 4. Validación

- [x] 4.1 Verificar la ficha en registro manual (datos y estado correctos)
- [x] 4.2 Verificar que no hay regresiones visuales en las pantallas migradas
- [x] 4.3 Build verde: `npm run build`
