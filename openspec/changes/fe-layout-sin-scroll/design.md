## Context

El cascarón ya intenta contener el alto:

```tsx
<div className="flex h-dvh flex-col overflow-hidden">   // Index.tsx
  <Header />                                            // flex-shrink-0
  <div className="flex min-h-0 flex-1 overflow-hidden">
    <aside … />
    <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">   // ← la válvula
      <div className="relative z-10 h-full"><Outlet /></div>
    </main>
  </div>
  <Footer />                                            // flex-shrink-0
</div>
```

El comentario que hay hoy sobre ese `h-full` lo dice sin rodeos: *"Las páginas más altas siguen
desbordando y `main` las desplaza"*. Esa es exactamente la válvula que permite que una pantalla crezca
sin que nadie se entere hasta que alguien la usa con una fila de gente delante.

Encima, `src/index.css` sube la raíz a 20px en ≥1024px. El marco cuesta ~256px de los 768 (cabecera
~151, pie ~45, padding de `main` 60) y, sobre los ~512px que quedan, **cada medida del contenido está
inflada un 25%** respecto al diseño.

Hubo un intento previo (`fe-comedor-vistas-sin-scroll`). Su spec pide "la resolución objetivo" sin
nombrarla, de modo que ningún test podía escribirse y ninguna revisión podía rechazarse.

## Goals / Non-Goals

**Goals:**

- Que la ventana no se desplace en ninguna pantalla.
- Que registrar un consumo no exija soltar el lector.
- Que el requisito se pueda **incumplir de forma visible**: una prueba que falle.

**Non-Goals:**

- Rediseño visual.
- Sin scroll por debajo de 1366×768.
- Tocar `/login`.

## Decisions

### 1. La resolución objetivo es 1366×768 y va escrita en la spec

Es la más común en los equipos de taquilla y la más exigente en alto de las candidatas. Un número en
la spec convierte "que no haga scroll" en algo que una prueba puede comprobar. Sin él, este cambio
tiene la misma esperanza de vida que el anterior.

Por debajo del objetivo reaparece el scroll a propósito: recortar contenido con alturas fijas es peor
que desplazarlo, y así lo dice ya el requisito heredado.

### 2. `main` pasa a `overflow-hidden`

Es el cambio que hace que todo lo demás sea obligatorio. Mientras `main` desplace, cualquier pantalla
puede crecer sin consecuencias y el contrato es una recomendación.

Contrapartida honesta: una pantalla que hoy desborda y se salva desplazándose pasará a **recortarse**
en el momento del cambio. Por eso la prueba de regresión entra en el mismo cambio y no después —
convierte ese recorte en un fallo rojo en vez de en contenido invisible.

### 3. La escala tipográfica de escritorio baja a 16px

```css
html { font-size: 16px }              /* móvil */
@media (min-width: 768px)  { 18px }   /* tablet */
@media (min-width: 1024px) { 20px }   /* escritorio  ← se elimina */
```

Los 20px inflan proporcionalmente **todo**: alturas, paddings, gaps, iconos. Es el multiplicador que
convierte un diseño que cabía en uno que no.

Donde la legibilidad de escritorio importe de verdad —los campos de la ficha del taquillero, que se
leen de pie y a distancia— se recupera con clases explícitas en esos elementos. Subir el tamaño de un
texto concreto es una decisión; subir la raíz es un efecto secundario sobre 27 pantallas.

*Alternativa considerada:* dejar 20px y comprimir cada pantalla. Descartada: obliga a pelear el mismo
25% en cada una de las 27, y la siguiente pantalla nueva vuelve a nacer rota.

### 4. La cabecera de trabajo se acota un poco más

El `Header` ya distingue los dos contextos y ya hace lo correcto: dentro de la aplicación los logos
van a `lg:h-16` (80px) y en el login a `lg:h-36` (180px). Con la raíz a 16px sus ~151px pasan solos a
~121px; el resto se recupera ajustando los paddings de la barra, no el tamaño de los logos.

Lo que sí hay que arreglar es el **nombre** del prop: `Index` —el cascarón autenticado— llama a
`<Header isLogin={true} />` y `LoginPage` llama a `<Header />`. La bandera significa exactamente lo
contrario de lo que se lee, y quien toque la cabecera para acotarla va a tropezar con eso antes que
con nada. Se renombra a `compact` en este mismo cambio.

Esta decisión rebaja lo que se creía al empezar: los 180px del logo no están en la pantalla de
trabajo, están en el login, donde no molestan. El que sobra de verdad es el multiplicador de la raíz.

### 5. `ScreenLayout` en vez de que cada pantalla se lo invente

```tsx
<ScreenLayout title=… actions=…>        {/* cabecera fija */}
  <ScreenLayout.Body>…</ScreenLayout.Body>   {/* min-h-0 flex-1 overflow-hidden */}
  <ScreenLayout.Footer>…</ScreenLayout.Footer>
</ScreenLayout>
```

La cadena `min-h-0 flex-1 overflow-hidden` es la que hace que un hijo flex pueda encogerse por debajo
de su contenido. Es fácil de olvidar —`min-h-0` es justo la parte que nadie recuerda— y basta que
falte en un eslabón para que el alto se escape. Escrita una vez, no se olvida 27 veces.

### 6. Las tablas se desplazan por dentro

El padrón tiene más de 8.000 filas: no hay layout que las meta en 512px. Lo que se fija es el marco —
cabecera, filtros, encabezado de columnas y paginación siempre visibles— y lo que se desplaza es el
cuerpo de la tabla, dentro de su panel.

Es el patrón que el usuario eligió, y es también el que hace que los filtros sigan al alcance sin
volver arriba.

### 7. La prueba de regresión es lo que impide que esto vuelva

```ts
// Con jsdom a 1366×768, tras renderizar la pantalla:
expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(768)
```

**Limitación que hay que decir en voz alta:** jsdom no hace layout, así que no mide alturas reales.
La prueba comprueba lo que sí puede comprobarse de forma fiable —que ningún contenedor de la cadena
raíz declare `overflow` desplazable ni pierda el `min-h-0`, y que la pantalla entre por
`ScreenLayout`— que es donde estuvo el fallo real las dos veces.

La comprobación de píxeles es **manual y va en las tareas**: abrir cada pantalla a 1366×768 y
confirmar que `document.scrollingElement.scrollTop` no se mueve. Vender la prueba automática como si
midiera píxeles sería repetir el error de la vez anterior con otro disfraz.

### 8. Orden de trabajo: iterar sobre el registro hasta que quepa

El usuario pidió explícitamente iterar hasta conseguirlo. El orden es:

1. Marco (raíz tipográfica + cabecera + `main`). La raíz sola devuelve ~20% del alto de todo lo que
   se pinta; la cabecera aporta ~30px más.
2. `RegisterDining` sobre `ScreenLayout`, midiendo en el navegador real tras cada paso.
3. El resto de pantallas.
4. La prueba de regresión, cuando el patrón ya esté fijado.

Medir en el navegador tras cada paso y no al final: si se toca todo y luego se mide, no se sabe qué
recuperó qué.

## Risks / Trade-offs

- **Bajar la raíz cambia el aspecto de toda la aplicación** → Es el precio de que el alto vuelva a ser
  gobernable. Va en el primer paso, a propósito, para verlo desde el principio y no al final.
- **Con `main` en `overflow-hidden`, una pantalla que hoy desborda pasa a recortarse** → La prueba de
  regresión entra en el mismo cambio; sin ella, esto es cambiar scroll por contenido invisible.
- **La prueba automática no mide píxeles** → Declarado arriba y compensado con verificación manual
  listada en las tareas.
- **A 1280×720 o menos volverá a haber scroll** → Es la degradación acordada. Recortar sería peor.
- **27 pantallas es mucha superficie** → Las que ya caben solo cambian de contenedor. El trabajo real
  está en las de tabla y en el registro.

## Open Questions

- ¿La taquilla usa el navegador a pantalla completa? Con la barra de marcadores y la de pestañas se
  pierden ~120px sobre los 768. Si no es a pantalla completa, el presupuesto real es ~648px y hay que
  medirlo sobre el equipo de verdad antes de dar por bueno el paso 2.
