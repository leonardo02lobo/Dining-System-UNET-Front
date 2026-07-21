## ADDED Requirements

### Requirement: La UI muestra "Servicio de alimentación" en lugar de "Almuerzo"

Todo el texto **visible al usuario** (títulos, encabezados, etiquetas, botones, mensajes de
toast/error, texto de PDF y labels de navegación) SHALL usar "Servicio de alimentación" (sustantivo
capitalizado) o "servicio de alimentación" (minúscula a mitad de frase) en lugar de "Almuerzo" /
"almuerzo", preservando mayúsculas/minúsculas y acentos.

Los identificadores de código, rutas de import, clases CSS, **slugs de URL** (p. ej.
`/inventario/pruebas-almuerzo`), nombres de archivo descargable (slugs kebab como
`prueba-almuerzo.pdf`) y los valores/enums enviados al backend (que sigue usando "lunch") SHALL
permanecer sin cambios.

#### Scenario: Texto visible renombrado

- **WHEN** el usuario navega por el menú, abre la sesión, crea o consulta un servicio de alimentación,
  o descarga un PDF
- **THEN** ve el término "Servicio de alimentación" / "servicio de alimentación" y **no** ve la
  palabra "Almuerzo" / "almuerzo" en ningún texto de interfaz

#### Scenario: Slugs y datos del backend intactos

- **WHEN** el usuario navega a `/inventario/pruebas-almuerzo` o descarga un archivo con nombre slug
- **THEN** la ruta y el nombre de archivo conservan el slug `almuerzo` y las peticiones al backend
  siguen usando los valores originales en inglés ("lunch"), sin romper el enrutado ni el contrato de API
