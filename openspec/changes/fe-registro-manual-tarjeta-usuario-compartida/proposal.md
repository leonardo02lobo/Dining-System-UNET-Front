## Why

La ficha del usuario consultado se muestra con **maquetados distintos** en cada pantalla: el
registro al comedor (`RegisterDining`) y la consulta (`CheckConsumes`) usan una tarjeta rica
(avatar, badge de estado, documento/nombre/email, avisos de acceso directo/sanción), mientras que
el **registro manual** (`ManualRegistrationPage`) arma su propio bloque más pobre e inconsistente.
El cliente pidió que el **registro manual use el mismo componente** para mostrar al usuario, para
unificar la presentación y evitar divergencias.

## What Changes

- Se **extrae un componente reutilizable** de presentación del estudiante (p. ej.
  `StudentResultCard` en `src/components/`) a partir de la tarjeta ya usada en `RegisterDining`/
  `CheckConsumes` (avatar, badge de estado, documento/nombre/email, aviso de acceso directo vs.
  alta implícita, aviso de sanción).
- Se **reemplaza el bloque ad-hoc** de `ManualRegistrationPage` por ese componente.
- Se **adopta el mismo componente** en `RegisterDining` y `CheckConsumes` (opcional pero
  recomendado) para que exista una sola fuente de la ficha, parametrizando las diferencias por
  props (p. ej. acciones/slots como "Registrar"/"Suspender").

## Capabilities

### New Capabilities
- `registro-manual-tarjeta-usuario-compartida`: un componente único de presentación del estudiante
  consultado, reutilizado por el registro manual (y las demás pantallas de consulta) para una
  ficha consistente.

## Impact

- **Archivos afectados:** nuevo `src/components/StudentResultCard.tsx` (o similar);
  `src/pages/ManualRegistrationPage.tsx` (consume el componente); opcionalmente
  `src/pages/RegisterDining.tsx` y `src/pages/CheckConsumes.tsx` (migran a él). Tipos en
  `src/types/user.ts` (`Student`).
- Sin cambios de backend. Riesgo: bajo/medio (refactor de UI); mitigado migrando pantalla por
  pantalla y validando con el build.
