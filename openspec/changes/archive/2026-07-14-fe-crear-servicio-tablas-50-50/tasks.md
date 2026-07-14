## 1. Componente de tabla de recálculo

- [x] 1.1 Crear `src/components/lunch/LunchRecalculationTable.tsx` sobre `ui/Table` (columnas Ingrediente / Base·N / Nuevo·N; resaltar cambios), con control Inicial→Deseada y botón "Aplicar recálculo"

## 2. Layout de la pantalla

- [x] 2.1 En `CreateLunchPage.tsx`, `LunchDetailsForm` a ancho completo arriba
- [x] 2.2 Grid `xl:grid-cols-2` con `LunchIngredientsTable` (izq) y `LunchRecalculationTable` (der)
- [x] 2.3 Mover "Agregar Ingrediente" a un contenedor centrado (`flex justify-center`) debajo de ambas tablas
- [x] 2.4 Conservar `saveError` y `LunchFooterActions` debajo

## 3. Validación

- [ ] 3.1 Verificar recálculo en vivo al cambiar platos/ingredientes y "Aplicar recálculo"
- [ ] 3.2 Verificar responsivo (apilado en angosto) y que `LunchTestPage` sigue usando `LunchRecalculationPanel`
- [x] 3.3 Build verde: `npm run build`
