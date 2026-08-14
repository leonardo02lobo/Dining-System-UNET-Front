## ADDED Requirements

### Requirement: La ventana no se desplaza en ninguna pantalla

La aplicación SHALL ocupar exactamente el alto de la ventana y NO SHALL producir desplazamiento
vertical del documento en ninguna de sus pantallas, a partir de **1366×768** de área de contenido del
navegador.

La resolución objetivo SHALL quedar escrita aquí y no descrita como "la resolución objetivo". Un
requisito que no nombra su umbral no se puede comprobar, y el intento anterior de este mismo cambio
se perdió exactamente por eso.

El contenedor de contenido principal (`main`) SHALL declarar `overflow-hidden`. Mientras desplace, una
pantalla puede crecer sin consecuencias y este requisito es una recomendación.

Por debajo de la resolución objetivo, el desplazamiento SHALL reaparecer. NO SHALL recortarse
contenido con alturas fijas: perder información es peor que desplazarla.

#### Scenario: Registro al comedor a la resolución objetivo

- **GIVEN** una ventana de 1366×768 y una persona ya consultada
- **WHEN** el taquillero mira la pantalla de registro
- **THEN** la ficha, el estado, el contador del turno, el aviso de consumo previo y el botón de
  registrar están visibles a la vez
- **AND** el documento no se desplaza

#### Scenario: Ninguna pantalla desborda

- **WHEN** se abre cualquiera de las pantallas de la aplicación a 1366×768
- **THEN** el documento no se desplaza

#### Scenario: Por debajo del objetivo se degrada, no se recorta

- **WHEN** la ventana es más baja que 768px
- **THEN** puede reaparecer el desplazamiento
- **AND** ningún contenido queda oculto por una altura fija

#### Scenario: El contenedor principal no es la válvula de escape

- **WHEN** se inspecciona el contenedor `main` del cascarón
- **THEN** declara `overflow-hidden` y no `overflow-y-auto`

### Requirement: El desplazamiento vive dentro de los paneles

Cuando el contenido de una pantalla no quepa —un listado, una tabla—, el desplazamiento SHALL ocurrir
**dentro del panel** que lo contiene y no en la página.

La cabecera de la pantalla, sus filtros, el encabezado de columnas de la tabla y su paginación SHALL
permanecer visibles mientras se recorre el contenido. Volver arriba para cambiar un filtro es el
gesto que este requisito elimina.

Ninguna pantalla SHALL resolver su alto recortando filas con una altura fija sin desplazamiento
interno.

#### Scenario: El padrón de estudiantes

- **GIVEN** el padrón con miles de filas a 1366×768
- **WHEN** el usuario recorre la tabla
- **THEN** se desplaza el cuerpo de la tabla
- **AND** la búsqueda, los filtros, el encabezado de columnas y la paginación siguen visibles
- **AND** el documento no se desplaza

#### Scenario: Un listado que sí cabe

- **GIVEN** una tabla cuyas filas caben en el alto disponible
- **WHEN** se muestra
- **THEN** no aparece ningún desplazamiento, ni de página ni de panel

#### Scenario: Los filtros no se pierden de vista

- **GIVEN** una tabla larga recorrida hasta el final
- **WHEN** el usuario quiere cambiar un filtro
- **THEN** el filtro sigue en pantalla, sin necesidad de volver arriba

### Requirement: El alto del marco no compite con el contenido

La escala tipográfica raíz SHALL ser **16px** en todos los anchos. La escala que la subía a 18px en
tablet y a **20px en escritorio** SHALL eliminarse.

Toda utilidad de Tailwind es relativa a `rem`, de modo que la raíz multiplica alturas, paddings, gaps
e iconos a la vez. Los 20px de escritorio inflaban el sistema entero un 25% justo en las pantallas
donde el alto es más escaso: a 1366×768 el marco consumía ~356px de los 768 antes de pintar contenido,
de los cuales 180 eran el logo institucional.

Donde la legibilidad a distancia lo exija —los campos de la ficha del taquillero— el tamaño SHALL
subirse con clases explícitas sobre esos elementos, no moviendo la raíz.

La cabecera SHALL presentarse compacta dentro de la aplicación y SHALL conservar su tamaño
institucional completo en `/login`, donde el alto no compite con nada.

#### Scenario: La raíz no cambia con el ancho

- **WHEN** se inspecciona el tamaño de fuente raíz a 1366px de ancho
- **THEN** es 16px, igual que en móvil

#### Scenario: La cabecera de trabajo es compacta

- **GIVEN** cualquier pantalla dentro de la aplicación
- **WHEN** se mide el alto de la cabecera
- **THEN** es el de una barra de trabajo y no el de una cabecera institucional

#### Scenario: El login conserva su cabecera

- **WHEN** se abre `/login`
- **THEN** la cabecera institucional se muestra completa, como hasta ahora

#### Scenario: La ficha del taquillero sigue siendo legible

- **GIVEN** la pantalla de registro a 1366×768
- **WHEN** el taquillero lee la ficha de pie, a la distancia habitual del mostrador
- **THEN** el documento, el nombre y el estado se leen sin acercarse

### Requirement: Un único patrón de contención de alto

Las pantallas SHALL componerse con una primitiva de layout compartida que fije el patrón —cabecera
fija, cuerpo que se encoge, pie fijo— en lugar de que cada una declare su propia contención.

La cadena `min-h-0 flex-1 overflow-hidden` es la que permite que un hijo flex se encoja por debajo de
su contenido. Basta con que falte `min-h-0` en un eslabón para que el alto se escape, y es justo la
parte que se olvida. Escrita una vez, no se olvida en cada pantalla.

#### Scenario: Una pantalla nueva hereda el patrón

- **WHEN** se crea una pantalla usando la primitiva
- **THEN** su cabecera y su pie quedan fijos y su cuerpo se encoge
- **AND** no necesita declarar contención propia

#### Scenario: El patrón no se declara dos veces

- **WHEN** se revisan las pantallas
- **THEN** ninguna reimplementa la cadena de contención por su cuenta

### Requirement: El contrato se comprueba de forma automática

El proyecto SHALL incluir una prueba de regresión que falle cuando una pantalla rompa el contrato de
alto.

La prueba SHALL comprobar lo que puede comprobarse de forma fiable en el entorno de pruebas: que
ninguna pantalla introduzca un contenedor desplazable en la cadena hasta la raíz, que la cadena de
contención esté completa, y que cada pantalla entre por la primitiva de layout.

La prueba SHALL declarar en su propio texto que **no mide píxeles**: el entorno de pruebas no calcula
layout. La comprobación visual a 1366×768 SHALL constar como verificación manual. Presentar una
prueba que no mide alturas como si las midiera repetiría el fallo del intento anterior con otro
disfraz.

Una pantalla nueva que no use la primitiva SHALL hacer fallar la prueba.

#### Scenario: Una pantalla que rompe el contrato

- **GIVEN** una pantalla que declara un contenedor desplazable hasta la raíz
- **WHEN** se ejecuta la suite
- **THEN** la prueba falla nombrando esa pantalla

#### Scenario: Una pantalla nueva sin la primitiva

- **WHEN** se añade una pantalla que no usa la primitiva de layout
- **THEN** la prueba falla

#### Scenario: La prueba dice lo que no comprueba

- **WHEN** se lee la prueba
- **THEN** declara explícitamente que la comprobación de píxeles es manual
