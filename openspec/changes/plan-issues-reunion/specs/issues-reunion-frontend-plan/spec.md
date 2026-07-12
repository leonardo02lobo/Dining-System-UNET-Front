## ADDED Requirements

### Requirement: Mapa de changes de frontend derivado del plan maestro

El plan del frontend SHALL enumerar las changes OpenSpec de UI a proponer en
`Dining-System-UNET-Front`, cubriendo los issues frontend-puros y la parte de UI de los
issues mixtos, cada una con nombre kebab-case, el issue que cubre, la pantalla/archivo
principal afectado, y —cuando el issue es mixto— el nombre de su change gemela de backend.

#### Scenario: Issue frontend-puro tiene una única change en este repo

- **WHEN** un issue está clasificado como Frontend / UX sin contrato de backend nuevo
  (issues #1, #2, #6, #8, #13, y #12 que reutiliza `/lunch-templates` existente)
- **THEN** el plan asigna una única change en `Dining-System-UNET-Front` y no declara gemela
  de backend

#### Scenario: Parte de UI de un issue mixto se enlaza a su gemela de backend

- **WHEN** un issue requiere endpoint/campo/migración además de UI
  (issues #3, #4, #5, #7, #10, #11, #14, #15)
- **THEN** el plan define la change de frontend correspondiente y cita el nombre de su change
  de backend gemela y el contrato de API que consume

#### Scenario: Cada change de UI queda nombrada y ubicada en su pantalla

- **WHEN** se lee el mapa de entrega del frontend
- **THEN** cada change tiene nombre kebab-case, issue cubierto, pantalla/archivo principal, y
  (si aplica) su gemela de backend

### Requirement: Orden de propuesta del frontend con contrato-primero

El plan SHALL fijar el orden en que se proponen y aplican las changes de UI, alineado a las
olas del plan maestro del backend, de forma que ninguna change de frontend consumidora se
proponga o aplique antes de que su change de backend gemela haya fijado el contrato del que
depende.

#### Scenario: Quick wins de frontend primero

- **WHEN** se define la primera tanda de trabajo del frontend
- **THEN** contiene las changes de UI de bajo riesgo sin gate de backend (#8, #13, #1, #6, #2)
  antes de los grupos que dependen de contratos o migraciones

#### Scenario: La change de UI espera el contrato de su gemela de backend

- **WHEN** un grupo tiene change de backend y change de frontend (p. ej. #3, #4, #7, #5, #15)
- **THEN** el plan ordena la change de frontend después de que la change de backend gemela
  esté propuesta y su contrato fijado

#### Scenario: Dependencia de menú del día sobre detalle de sesión

- **WHEN** se ordena la change de UI de #14 (menú/consumo del día)
- **THEN** el plan la coloca después de la change de UI de #4 (historial y detalle de sesión),
  sobre cuyo detalle se construye

### Requirement: Contrato de backend consumido por cada change de frontend

Para cada change de UI ligada a un issue mixto, el plan SHALL documentar el contrato de
backend que la UI consume: endpoints, campos de response, filtros/parámetros y formato de
exportación, tomándolo del plan maestro del backend sin redefinirlo en este repo.

#### Scenario: Listado consumido usa el envelope estándar

- **WHEN** una change de UI consume un endpoint de listado paginable (p. ej. entrantes por
  sesión en #3/#4)
- **THEN** el plan indica que la UI espera el envelope `{total, items}` y respeta la
  paginación por servidor

#### Scenario: Exportación PDF preferentemente desde backend

- **WHEN** una change de UI necesita exportar PDF (p. ej. entrantes por sesión en #4)
- **THEN** el plan indica consumir el endpoint de export del backend siguiendo el patrón
  existente, y solo usar utilidades PDF del frontend (`src/utils/`) si se acuerda branding a
  medida

#### Scenario: El frontend no define contratos de backend

- **WHEN** el plan documenta el contrato de un grupo mixto
- **THEN** lo cita como consumido desde la change de backend gemela y no altera ni inventa
  endpoints/campos en este repo

### Requirement: Protocolo de trabajo del frontend con OpenSpec

El plan SHALL definir cómo se ejecuta cada grupo de UI en este repo: en qué directorio se
corre `/opsx:propose`, cómo se enlaza cada change a su gemela de backend, qué decisiones de
Fase 0 con impacto en UI deben resolverse antes de proponer, y qué convenciones del frontend
hereda cada change hija.

#### Scenario: Proponer una change de UI en su repo destino

- **WHEN** llega el turno de un grupo de frontend en la secuencia
- **THEN** el plan indica ejecutar `/opsx:propose` dentro de `Dining-System-UNET-Front`, no de
  forma cruzada contra el backend

#### Scenario: Decisiones de Fase 0 con impacto en UI resueltas antes de proponer

- **WHEN** un grupo de UI tiene preguntas abiertas que afectan la interfaz (p. ej. orientación
  70/30 en #6, definición de "acceso directo" en #3, branding del PDF en #4, renombrar ruta en
  #13)
- **THEN** el plan las lista como bloqueantes de Fase 0 y exige resolverlas antes de redactar
  los specs de ese grupo

#### Scenario: Cada change hija respeta las convenciones del frontend

- **WHEN** se propone una change de UI hija
- **THEN** el plan exige heredar las convenciones del proyecto (primitivos `ui/`, patrón IIFE
  de carga async, estados loading/error/vacío, `useAuth`/`ProtectedRoute`, `apiClient`/
  `src/api/*`, utilidades PDF de `src/utils/`) y mantener el build verde bajo TypeScript strict

#### Scenario: Esta change no implementa issues

- **WHEN** se aplica la change `plan-issues-reunion` de este repo
- **THEN** no se modifica código, componentes, rutas ni estilos del frontend; solo se produce
  y valida la documentación de planificación
