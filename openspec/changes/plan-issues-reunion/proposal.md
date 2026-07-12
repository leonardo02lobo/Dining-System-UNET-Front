## Why

La reunión con el cliente dejó 15 issues (`issues_reunion.md`, en el backend, y su
espejo `problematicas_clasificadas_frontend_backend.md` en este repo) que tocan de
forma entrelazada dos repositorios con OpenSpec instalado: `Dining-System-UNET-Backend`
(FastAPI) y `Dining-System-UNET-Front` (React + Tauri). El backend ya tiene su plan
maestro de coordinación (`plan-issues-reunion` → capability `issues-reunion-delivery-plan`).
Este repo necesita su **plan maestro gemelo desde la perspectiva del frontend**, para que
cada repositorio quede autocontenido y se pueda **aplicar por separado**, como pidió el
usuario.

Sin un plan del lado frontend, las changes hijas de UI se abrirían sin saber qué contrato
del backend esperan, cuándo pueden empezar (contrato-primero), ni cómo enlazarse a su
gemela de backend — produciendo retrabajo (UI bloqueada esperando endpoints) y colisiones
de merge en pantallas compartidas (`CreateLunchPage`, detalle de sesión, `InventoryPage`).

## What Changes

- Se define el **mapa de entrega del frontend**: qué changes OpenSpec de UI se propondrán
  en este repo (las FE-puras G1–G6 y las gemelas `bX` de los issues mixtos), con nombre
  kebab-case y el issue que cubren.
- Se fija la **secuencia de ejecución de las changes de frontend** alineada con las olas del
  plan maestro del backend, respetando el invariante **contrato-primero**: ninguna change de
  UI consumidora se propone/aplica antes de que su change de backend gemela haya liberado el
  contrato.
- Se documenta, por grupo mixto, **qué contrato de API consume el frontend** (endpoints,
  campos de response, filtros, formato de PDF) y el **archivo/pantalla del frontend** que lo
  implementa, tomando como fuente los "Hechos confirmados" de cada issue.
- Se establece el **protocolo de trabajo del frontend**: correr `/opsx:propose` dentro de
  este repo para cada grupo FE, enlazar cada change al nombre de su gemela de backend, y
  respetar las convenciones de UI del proyecto (composición de clases Tailwind, primitivos
  `ui/`, patrón IIFE de carga async, `useAuth`/`ProtectedRoute`, utilidades PDF de `src/utils/`).
- Se listan las **decisiones abiertas de Fase 0 con impacto en frontend** que deben
  resolverse antes de proponer el grupo afectado.

## Capabilities

### New Capabilities
- `issues-reunion-frontend-plan`: plan maestro del lado frontend que gobierna cómo los issues
  de la reunión se descomponen en changes OpenSpec de UI en `Dining-System-UNET-Front`, su
  orden de propuesta/aplicación, el contrato de backend que cada una consume, el enlace a su
  change gemela de backend, y el protocolo de trabajo para aplicar este repo por separado.

### Modified Capabilities
<!-- Ninguna: openspec/specs/ de este repo está vacío; esta change no modifica requisitos existentes. -->

## Impact

- **Alcance de esta change:** solo planificación/documentación del frontend. No modifica
  código, componentes, rutas ni estilos.
- **Artefactos producidos:** `proposal.md`, `design.md`, `specs/`, `tasks.md` bajo
  `openspec/changes/plan-issues-reunion/` en este repo; el `design.md` contiene el mapa de
  changes de UI a proponer y el contrato que cada una consume.
- **Relación con el backend:** gemelo de `plan-issues-reunion` del backend. El plan del
  backend es la fuente del orden global y de los contratos; este plan es la vista frontend de
  ese mismo mapa. Discrepancias se resuelven a favor del plan del backend.
- **Fuente de verdad de issues:** `issues_reunion.md` (backend, primaria) y
  `problematicas_clasificadas_frontend_backend.md` (este repo, complementaria).
- **Consumidores del plan:** las futuras invocaciones de `/opsx:propose` en este repo (una
  por grupo de UI) tomarán este plan como fuente del orden, nombres, contratos y enlaces.
