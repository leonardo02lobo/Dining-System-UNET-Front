## Context

Este repo (`Dining-System-UNET-Front`, React 19 + Tauri 2 + Vite + Tailwind, OpenSpec
`schema: spec-driven`, `openspec/specs/` vacío) es uno de los dos gobernados por los 15
issues de la reunión. El **backend** (`Dining-System-UNET-Backend`, FastAPI) ya tiene su
plan maestro `plan-issues-reunion` (capability `issues-reunion-delivery-plan`) con:

- El **mapa completo de changes hijas** de ambos repos (grupos G1–G15, gemelas `aX`=backend
  / `bX`=frontend).
- La **secuencia global en 7 olas** con el invariante contrato-primero.
- Los **contratos de API** que cruzan la frontera por cada grupo mixto.

Este `design.md` NO reinventa ese mapa: lo **proyecta al frontend**. Toma los grupos que se
proponen en este repo, y para cada uno fija qué pantalla/archivo de UI cambia y qué contrato
del backend consume. Ambos repos van en rama `develop`.

Convenciones vigentes del frontend (verificadas en `CLAUDE.md` y el código): primitivos en
`src/components/ui/` (`Table`, `Modal`, `Button`, `Card`, `FilterPanel`, `Select`,
`SearchInput`, `Badge`, `Chart`, `DateInput`), composición de clases por array-join, patrón
IIFE `void (async () => {…})()` en `useEffect` para cargar datos, auth por cookie vía
`useAuth()`/`AuthContext` + `ProtectedRoute`/`routeAccess`, HTTP por `apiClient`
(`credentials: 'include'`), utilidades PDF/impresión en `src/utils/` (`pdfLunch.ts`,
`pdfLogos.tsx`, `printManual.ts`), y rutas en `App.tsx` con navegación filtrada por rol en
`NavBar`.

## Goals / Non-Goals

**Goals:**
- Enumerar las changes de UI a proponer en este repo, cada una ligada a su issue y a su
  gemela de backend.
- Fijar el orden de propuesta/aplicación del frontend alineado a las olas del backend,
  con contrato-primero como invariante.
- Documentar, por change de UI, el contrato de backend que consume y la pantalla/archivo que
  la implementa.
- Listar las decisiones de Fase 0 que bloquean cada grupo de frontend.

**Non-Goals:**
- No implementa ningún issue ni escribe JSX/TS, estilos, ni servicios de API.
- No redacta los `proposal/design/specs/tasks` de las changes hijas (eso ocurre en cada
  `/opsx:propose` posterior en este repo).
- No decide detalles finos de UI (paddings, breakpoints exactos): quedan al design de cada
  change hija.
- No define ni altera contratos de backend: eso vive en las changes `aX` del backend; aquí
  solo se **consumen** y se citan.

## Decisions

### D1 — Espejo del mapa de entrega, filtrado al frontend

Se adopta el mapa del plan maestro del backend (D1 de su `design.md`). Este repo propone las
changes FE-puras y las gemelas `bX` de los issues mixtos. Cada gemela `bX` se enlaza por
nombre a su `aX` de backend.

**Changes de frontend a proponer en este repo:**

| Grupo | Issue | Change de frontend (este repo) | Gemela backend | Pantalla / archivo principal |
|---|---|---|---|---|
| G1 | #8 | `fe-inventario-general-pdf` | — (usa `GET /inventory/export/pdf` existente) | `GeneralInventoryPage.tsx`, `src/api/inventory.ts` |
| G2 | #13 | `fe-rename-crear-servicio-alimentacion` | — | `NavBar`, `CreateLunchPage.tsx` (`PageHeader`) |
| G3 | #1 | `fe-comedor-vistas-sin-scroll` | — | `CheckConsumes.tsx`, `RegisterDining.tsx` |
| G4 | #6 | `fe-inventario-resumen-70-30` | — | `GeneralInventoryPage.tsx`, `InventoryPage.tsx`, `InventorySummaryPanel.tsx` |
| G5 | #2 | `fe-registro-atajo-arrowdown` | — | `RegisterDining.tsx` (conviviendo con `useBarcodeScanner`) |
| G6 | #9 (+coord. #13) | `fe-crear-servicio-tablas-50-50` | — | `CreateLunchPage.tsx`, `LunchIngredientsTable`, `LunchRecalculationPanel` |
| G7b | #3 | `fe-entrantes-filtro-acceso-directo` | `be-consumptions-acceso-directo` | vista de entrantes por sesión, `src/api/consumption.ts`, `FilterPanel`/`Table` |
| G8b | #4 | `fe-reportes-historial-sesiones` | `be-lunch-sessions-rango-y-pdf` | `ReportsPage.tsx`/`ConsumptionReportPage.tsx`, `ReportDateRangeFilters`, `Table` |
| G9b | #14 | `fe-sesion-menu-del-dia` | `be-lunch-menu-del-dia` | detalle de sesión de G8b (panel "Menú del día") |
| G10b | #10 | `fe-almuerzos-editar-historial` | `be-lunches-regla-editabilidad` | "Ver almuerzos creados", `LunchDetailsForm`/`LunchIngredientsTable`, `src/api/lunch.ts` |
| G11b | #11 | `fe-crear-servicio-quitar-toggle-plantilla` | `be-lunch-auto-plantilla` | `CreateLunchPage.tsx` (quitar toggle), `createConfirmedLunch` |
| G12 | #12 | `fe-plantillas-crud-inventario` | — (CRUD `/lunch-templates` ya existe) | nueva `LunchTemplatesPage`, ruta en `App.tsx`, entrada en `NavBar`, `src/api/lunch.ts` |
| G13b | #7 | `fe-inventario-modal-fecha-insumo` | `be-inventario-fecha-movimiento` | `InventoryPage.tsx` (modal cargar insumo), `ui/DateInput`, `src/api/inventory.ts` |
| G14b | #5 | `fe-panel-config-correo` | `be-email-settings-emisor-cc` | `EmailTemplatePage.tsx`, `src/api/emailTemplate.ts` |
| G15b | #15 | `fe-gente-externa` | `be-gente-externa` | nueva página gestión (espejo `AccesoDirectoPage`/`AccesoDirectoFormModal`), ruta + `NavBar`, flujo de registro |

**Alternativa considerada:** una sola change gigante de frontend con todos los issues de UI.
Rechazada por las mismas razones que el backend: pierde granularidad de aplicación/rollback,
colisiona en merges de pantallas compartidas y contradice "aplicar cada uno por separado".

### D2 — Orden de propuesta/aplicación del frontend (alineado a las olas del backend)

Se siguen las 7 olas del plan maestro del backend, tomando solo los pasos de este repo:

1. **Ola 1 — Quick wins FE (sin gate de backend):** G1 → G2 → G3 → G4 → G5. Avanzan ya; G4
   requiere resolver la orientación 70/30 (Fase 0).
2. **Ola 2 — Pantalla "Crear servicio":** G6, después de G2 (misma pantalla, evita colisión).
3. **Ola 3 — Sesiones/reportes/menú (contrato-primero):** G7b tras `be-consumptions-acceso-directo`;
   G8b tras `be-lunch-sessions-rango-y-pdf`; G9b tras G8b y `be-lunch-menu-del-dia`.
4. **Ola 4 — Almuerzos y plantillas:** G10b tras `be-lunches-regla-editabilidad`;
   G11b tras `be-lunch-auto-plantilla`; G12 tras G11b (la auto-plantilla hace necesaria la
   ventana CRUD).
5. **Ola 5 — Inventario/fecha:** G13b tras `be-inventario-fecha-movimiento`.
6. **Ola 6 — Correo:** G14b tras `be-email-settings-emisor-cc`.
7. **Ola 7 — Gente externa (XL):** G15b tras `be-gente-externa`; se consume en dos sub-fases
   (primero gestión/CRUD, luego la opción en el registro al comedor).

**Regla invariante (contrato-primero):** ninguna change `bX` de este repo se propone antes de
que su `aX` de backend esté propuesta y haya fijado su contrato en el `design.md` de la `aX`.
Las FE-puras (G1–G6, G12) no tienen este gate.

### D3 — Contrato de backend que consume cada change de frontend

Lo que el frontend **espera recibir** por grupo mixto (fuente: D3 del plan maestro del
backend; el frontend no lo define, lo consume):

- **G7b (#3):** `ConsumptionResponse` con `is_priority` + datos de persona, y/o filtro
  `is_priority=true` en `GET /consumptions/`, conservando envelope `{total, items}`. La UI
  añade un toggle/filtro "Solo acceso directo" respetando la paginación por servidor.
- **G8b (#4):** filtro por rango de fechas en `GET /lunch-sessions/` + endpoint de export PDF
  de entrantes por sesión (columnas cédula/apellido/nombre/carrera). La UI arma historial →
  detalle (`Table`) → botón "Descargar PDF" (preferir PDF de backend; branding según Fase 0).
- **G9b (#14):** forma de obtener el `Lunch` del día de la sesión (por `date`, parámetro
  `GET /lunches?date=`, o incluido en el detalle de sesión). La UI añade un panel "Menú del
  día / consumo" en el detalle de sesión de G8b y maneja el caso "sin almuerzo".
- **G10b (#10):** `PATCH /lunches/{id}` + CRUD de ingredientes ya existen; el backend
  confirma qué `LunchStatus` son editables (`_ensure_editable`). La UI ofrece "Editar" en
  "Ver almuerzos creados" y bloquea estados no editables con mensaje claro.
- **G11b (#11):** el backend genera/actualiza la plantilla automáticamente al crear/confirmar
  el almuerzo. La UI **quita** el toggle "guardar como plantilla" y `createConfirmedLunch`
  deja de enviarlo.
- **G12 (#12):** `/lunch-templates` CRUD completo (`list/get/create/patch/delete`) ya existe;
  puede requerir completar métodos `create/patch/delete` en `src/api/lunch.ts`. Sin contrato
  nuevo de backend.
- **G13b (#7):** el endpoint de increase acepta la fecha de ingreso (default hoy). La UI
  añade `ui/DateInput` al modal de cargar insumo en `InventoryPage.tsx`.
- **G14b (#5):** endpoints `GET`/`PUT` de settings de correo (`from_name`, `from_address`,
  `cc`) protegidos `SUPER_ADMIN`, sin exponer credenciales SMTP. La UI añade una sección/`Card`
  "Configuración del correo" en `EmailTemplatePage.tsx`.
- **G15b (#15):** recurso `/external-people` (CRUD + verify/lookup, espejo de
  `/accesos_directos`) e integración de consumo. La UI espeja `AccesoDirectoPage`/
  `AccesoDirectoFormModal` con selector de tipo (jubilado / persona externa).

Sin contrato de backend nuevo (backend ya lo cubre): **G1** (`/inventory/export/pdf`),
**G12** (`/lunch-templates`). El resto de la Ola 1 es FE puro.

### D4 — Protocolo de trabajo del frontend

- Para cada grupo de este repo, correr `/opsx:propose` **dentro de** `Dining-System-UNET-Front`
  (no cruzado). Los grupos `aX` se proponen en el backend.
- **Enlace de gemelas:** el `proposal.md` de cada change `bX` cita el nombre de su change de
  backend gemela y el contrato de D3 que consume; así este repo se aplica por separado pero
  queda trazable hacia el backend.
- **Fase 0 por grupo:** resolver las decisiones abiertas con impacto en UI (ver Open
  Questions) antes de redactar los specs del grupo. Sin la decisión, el grupo no se propone.
- **Convenciones obligatorias** que cada change hija de UI hereda: primitivos `ui/`, patrón
  IIFE de carga async, manejo de estados loading/error/vacío, `useAuth`/`ProtectedRoute` +
  filtrado de `NavBar` por rol, llamadas vía `apiClient`/`src/api/*`, utilidades PDF de
  `src/utils/`, y build verde (`tsc && vite build`) bajo TypeScript strict (`noUnusedLocals`/
  `noUnusedParameters`). Mantener el puerto Vite 1420 (`strictPort`) para Tauri.

## Risks / Trade-offs

- **Frontend adelanta al contrato** (abrir una `bX` antes de que su `aX` fije el contrato) →
  invariante de secuencia D2 + enlace explícito D4; la `bX` no se propone sin su `aX` liberada.
- **Colisión en pantallas compartidas** (`CreateLunchPage` en G6/G11b; detalle de sesión en
  G8b/G9b; `GeneralInventoryPage`/`InventoryPage` en G1/G4/G13b) → se secuencian en la misma
  ola: G2 antes de G6; G8b antes de G9b; y los cambios de inventario se agrupan por pantalla.
- **Decisiones de Fase 0 sin resolver bloquean el grupo** → los quick wins avanzan; los grupos
  con gate esperan la decisión de Producto.
- **Divergencia de fuentes** (`issues_reunion.md` del backend vs.
  `problematicas_clasificadas_frontend_backend.md` de este repo) → `issues_reunion.md` es la
  fuente primaria; el archivo del frontend aporta estado "ya hecho/pendiente" y se anota en
  Fase 0 si discrepa.
- **Regresión visual/estados** al compactar vistas (G3) o refactorizar tablas (G6) → cada
  change hija valida estados loading/error/vacío y el flujo de recálculo en vivo.
- **#15 es XL** → G15b se consume en dos sub-entregas (gestión/CRUD primero, opción en el
  registro después) para no bloquear el resto.

## Migration Plan

Esta change no despliega código. "Aplicarla" significa dejar validados
proposal/design/specs/tasks del plan del frontend. La ejecución real ocurre grupo a grupo
según D2, cada uno con su propio ciclo `/opsx:propose` → `/opsx:apply` → `/opsx:archive` en
este repo, coordinado con la gemela de backend. Rollback del plan = descartar/rehacer esta
change sin efecto sobre el código.

## Open Questions

Decisiones de Fase 0 con impacto en el frontend (subconjunto de las del plan maestro que
afectan UI):

- **G4/#6:** ¿el 70% es la tabla o el resumen? (define el grid de `GeneralInventoryPage`/`InventoryPage`).
- **G7b/#3:** definición de "acceso directo" para el filtro (determina qué campo filtra la UI).
- **G8b/#4:** ¿PDF con branding institucional (logos UNET/Decanato)? ¿historial ordenado por
  fecha descendente por defecto?
- **G9b/#14:** ¿"consumo" = menú planificado (ingredientes) o consumo real? (define qué muestra
  el panel del detalle de sesión).
- **G6/#9:** ¿"iguales" = un componente reutilizable o solo mismo estilo? ¿las dos tablas
  comparten datos (base vs. recalculada)?
- **G10b/#10:** ¿se editan almuerzos confirmados o solo borradores? (define qué habilita la UI).
- **G11b/#11:** política de nombre repetido del backend (la UI solo refleja el resultado).
- **G12/#12:** ¿qué campos de plantilla se editan desde la UI? ¿se puede borrar una plantilla
  referenciada?
- **G13b/#7:** ¿se permite fecha futura? ¿aplica al alta del ítem, a la entrada de stock, o ambos?
- **G13/#13:** ¿renombrar también la ruta `/inventario/crear` o solo el rótulo?
- **G14b/#5:** ¿la UI edita host/usuario SMTP o solo "From" y CC? ¿CC global o por tipo de correo?
- **G15b/#15:** ¿qué campos aplican a externos (carrera, foto, sede)? ¿cómo se registra el
  consumo de un externo en el flujo de registro?
