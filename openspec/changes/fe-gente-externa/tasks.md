## 1. Tipos y API

- [x] 1.1 `src/types/externalPerson.ts` (ExternalPerson, Create, Update, enums)
- [x] 1.2 `src/api/externalPerson.ts` (list con filtros, get, create, update, remove)

## 2. Página de gestión

- [x] 2.1 `ExternalPeoplePage`: tabla + filtros (búsqueda, tipo, estado), estados loading/error/vacío
- [x] 2.2 Modal alta/edición (cédula inmutable en edición; 409 duplicado) con selector de tipo
- [x] 2.3 Modal de eliminación con confirmación

## 3. Navegación y acceso

- [x] 3.1 Ruta `/gente-externa` en `App.tsx`
- [x] 3.2 Entrada "Gente Externa" en el grupo Comedor del `NavBar`
- [x] 3.3 `'/gente-externa': ['SUPER_ADMIN','ADMIN']` en `routeAccess`

## 4. Validación

- [ ] 4.1 Verificar CRUD end-to-end (requiere backend)
- [ ] 4.2 Sub-entrega 2: opción de registrar consumo de un externo en la pantalla de comedor (pendiente)
- [x] 4.3 Build verde: `npm run build`
