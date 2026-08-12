# DISEÑO — ADMIN DENTRO DE LA APP (tema, marco y entrada)

> **Estado: 🟡 PROPUESTA** (Opus, 12-ago-2026). Tarjeta `t_30e8a891`, carril `opus`.
> **Origen:** directiva de Edu (8-ago, viendo `/admin` en escritorio): *"Quiero admin en la app,
> con el diseño de la app."* Quejas literales: la HUD del admin es fea y muy limitada, no se ve el
> reproductor, no sigue la temática.
> **Canon leído antes de diseñar:** `docs/Nucleo/CONTRATO.md` (29 ADRs), `REGLAS.md`, `ESTADO.md`,
> `docs/spec/INDEX.md` y, por enrutado de ese índice, la spec del área tocada —vibe y transiciones—
> `docs/spec/el_bunker_reproductor_spec_v2.md` (`VB8`-`VB10`, `T1`-`T11`).
> Diseños previos: `DISENO_PANEL_ADMIN_2026-08-04.md` (🟢 canónico),
> `DISENO_B1_ADMIN_CORE_2026-08-05.md`, `DISENO_HUD_DESKTOP_2026-08-07.md` (ADR-029).
> **Alcance:** diseño y especificación. Cero código.

---

## 0. Reto a la tarjeta: qué decía y qué dice el código

La tarjeta se escribió el 9-ago, **antes** de que el marco de escritorio de ADR-029 entrara en
master. Cuatro de sus afirmaciones se contrastaron una a una contra el árbol principal:

| Afirmación de la tarjeta | Veredicto | Evidencia |
|---|---|---|
| «B1 NO aplicó el tema de el-bunker (admin-core neutro)» | **Falsa, y del revés** | `src/admin/core/AdminShell.jsx:4` importa `ACID, BG, FONT_MONO` de `../../tokens`. El core **no es neutro**: está acoplado por import. Lo que le falta no es tema, es vocabulario: `admin-core-boundaries.test.js:81-93` fija su paleta entera en **cuatro escalares**. |
| «No hay entrada visible en la UI hacia /admin» | **Cierta** | Cero coincidencias de `/admin` en `src/layout/`. Solo se llega escribiendo la URL. |
| «El reproductor no estaba en el diseño del panel» | **Cierta, pero no es el problema** | El problema es de orden de montaje: `App.jsx:111-117` devuelve el panel **antes** de `PlayerProvider` (`App.jsx:120`). Hoy `/admin` no puede enseñar el reproductor aunque se quiera: no hay provider encima. |
| «Coordinar con la implementación de la HUD desktop (t_504a2707)» | **Caducada** | Ya no hay nada que coordinar: el marco está en master (`Layout.jsx:419-571`, `index.css:101-160`). Este diseño ya no propone, se **enchufa** a lo que existe. |

Y un hueco de canon que la tarjeta no ve: **ADR-030 nunca entró en `CONTRATO.md`**. Existe como
BORRADOR dentro de un diseño (`DISENO_PANEL_ADMIN_2026-08-04.md:120`) y el plan de carriles asignó
a Edu subirlo junto con ADR-029 (`PLAN_CARRILES_ELBUNKER_2026-08-04.md:72`). Solo subió el 029. El
panel lleva días en producción (commit `b84088c`) **sin ADR firmado**. Este diseño cierra el hueco:
el §6 trae el texto completo de ADR-030, no una enmienda a un ADR que no existe.

**Veredicto: la tarjeta pasa el reto.** La directiva de Edu es real y el trabajo hace falta. Lo que
cambia es el diagnóstico — y con él, la solución.

---

## 1. «Admin en la app» sin romper los 3 tabs

ADR-017 🔒-4 fija tres tabs. La directiva de Edu no pide un cuarto: pide dejar de sentir que
`/admin` es otra aplicación. Son cosas distintas y la distinción es toda la arquitectura:

- **Lo que NO se toca:** `/admin` sigue siendo una **ruta**, no un tab. No aparece en la navegación
  inferior de móvil, no responde a los atajos `1`/`2`/`3` (`Layout.jsx:504-514`), no está en
  `destinations` (`Layout.jsx:420-424`). 🔒-4 intacta, literal.
- **Lo que sí cambia:** esa ruta pasa a pintarse **dentro del marco de la app** en escritorio, con
  su atmósfera, su barra superior, su raíl y su dock de reproductor.

Dicho de otra manera: hoy el admin es una pantalla que sustituye a la app; pasa a ser una pantalla
que la app contiene. Es la diferencia entre abrir otro programa y abrir otra sala del mismo búnker.

---

## 2. El tema: invertir la dependencia, no añadir colores

### 2.1 El problema real

`AdminShell` pinta un rectángulo plano de `BG` a pantalla completa (`AdminShell.jsx:32`) con un
acento y una tipografía. Eso es todo lo que puede pintar: cuatro tokens no dan para cristal, glow,
scanlines ni reactividad. **«Fea y muy limitada» no es una opinión sobre el gusto del implementador:
es la consecuencia exacta del contrato que se le puso.**

Y el contrato además está roto por el otro lado: el core importa `../../tokens`, que es un fichero
de el-bunker. El día que `admin-core` viaje a `vinos-carta-app` —que es el motivo nº1 por el que
este panel existe (`DISENO_PANEL_ADMIN_2026-08-04.md:20-21`)— hay que llevarse un `tokens.js` con
nombres del Búnker o tocar el core. Cualquiera de las dos cosas mata la reutilización.

### 2.2 La decisión: el core declara, la app define

`admin-core` **deja de importar tokens** y pasa a consumir *custom properties* de CSS con valor de
respaldo. El core no sabe de qué color es nada; declara qué necesita.

```css
/* Contrato de tema de admin-core. El core solo usa var(--admin-*, <fallback>). */
--admin-accent        /* acento primario                */
--admin-accent-soft   /* acento al 40% para inactivos   */
--admin-danger        /* destructivo (RED)              */
--admin-bg            /* fondo cuando el shell es dueño */
--admin-surface       /* superficie de tarjeta/cristal  */
--admin-border        /* filete                         */
--admin-text          /* texto principal                */
--admin-text-dim      /* texto secundario               */
--admin-font          /* familia tipográfica            */
--admin-radius        /* radio                          */
--admin-glow          /* sombra de brillo               */
```

- **el-bunker las define en `src/index.css`** y ata `--admin-accent: var(--vibe-accent)`.
- **vinos-carta-app definirá las suyas** y heredará el core sin tocar una línea.

**`VB9` decide cuáles de esas variables NO siguen al vibe**, y no es opcional: la spec del
reproductor excluye del vibe *"botones destructivos, estados de error e indicadores de sistema"*
(`docs/spec/el_bunker_reproductor_spec_v2.md:109`), y ADR-029 dejó `VB9` expresamente sin enmendar.
Traducido a este panel: `--admin-danger` queda **fijo** —un botón de borrado no puede cambiar de
color con la canción— y los indicadores de la consola de SALUD (verde/ámbar/rojo de estado) tampoco
entran en el vibe, porque son exactamente los "indicadores de sistema" de los que habla `VB9`. Lo
que sí sigue al vibe es el acento, el filete, el brillo y el texto —`VB10` incluye texto e iconos en
el vibe, con contraste mínimo garantizado, que en tablas densas de administración hay que respetar
de verdad.

### 2.3 Por qué esto da la reactividad al vibe gratis

`Layout.jsx:516-520` ya publica `--vibe-accent` en `:root` y la actualiza cuando cambia lo que
suena. `index.css:114` ya la consume con `color-mix`. **El idioma ya existe en esta base de código**;
el admin simplemente deja de ser el único que no lo habla. Consecuencia directa: el panel cambia de
color con la canción, sin un solo import, sin prop-drilling y sin re-render de React — la repinta el
navegador.

Un objeto de tema por props haría lo mismo peor: obligaría a atravesar todos los componentes del
core con una prop y a re-renderizar el árbol del admin durante toda la transición. Y la transición
de vibe **es una animación temporizada, no un salto**: arranca 2s después del track nuevo (`T4`), se
cancela y reencadena si entra otro (`T5`) y hace un fundido de 1s al color base cuando el
reproductor para (`T6`). Eso es trabajo de CSS, no de estado de React.

La prop `accentColor` que hoy tienen `AdminShell` y `ResourceConsole` **se conserva** por
compatibilidad: cuando llega, el shell la escribe como `--admin-accent` en su nodo raíz por estilo
en línea. Los tests existentes siguen valiendo tal cual.

### 2.4 El efecto lateral que más se nota

Al renderizar dentro del marco (§3), el admin hereda `GridBackground`, `AmbientGlows`,
`NoiseOverlay` y `ScanlineOverlay` (`Layout.jsx:527-533`) **sin implementar nada**. La atmósfera no
se copia al admin: el admin se mete dentro de la atmósfera. Eso es lo que cierra la queja (3).

### 2.5 El DoD de portabilidad sube de nivel

El test 7 de `admin-core-boundaries.test.js` hoy dice «solo consume cuatro tokens». Pasa a decir
**«no importa `../../tokens` en absoluto»**, y `ALLOWED_IMPORT` (`:18`) pierde la entrada
`\.\.\/\.\.\/tokens`. Es una regla más dura que la de hoy, verificable con un grep, y es el único
sitio del diseño donde la reutilización se demuestra en vez de prometerse.

---

## 3. El marco: el admin dentro del `PlayerProvider`

### 3.1 El hecho que decide el diseño

```jsx
// src/layout/App.jsx:111
if (window.location.pathname.startsWith("/admin")) {
  return (<ToastProvider><AdminPanel /></ToastProvider>);   // ← sale aquí
}
return (<PlayerProvider …>…</PlayerProvider>);               // ← nunca llega
```

El panel se monta fuera del provider. **No es un problema de estilo: no hay reproductor que enseñar
porque no hay contexto de reproducción.** Cualquier diseño que no mueva esta rama es cosmética.

### 3.2 La decisión

La rama de `/admin` pasa **dentro** de `PlayerProvider`, y el contenido del panel se convierte en el
**lienzo** del mismo marco de escritorio que usan los 3 tabs:

```
┌──────────────────────────────────────────────────────────────────┐
│ EL BÚNKER / ADMIN            partner · offline        12 AUG 21:04│  topbar 44px
├────────────┬────────────────────────────────────┬────────────────┤
│ VAULT      │                                    │  ▶ WINAMP      │
│ MUSIC LAB  │        CONTENIDO / SALUD /         │    cola [3]    │  dock 336px
│ CAPSULES   │        AUDITORÍA / ACCESOS         │    historial   │
│ ─────────  │                                    │                │
│ ▸ ADMIN    │   (único elemento con scroll)      │                │
│ 1/2/3      │                                    │                │
├────────────┴────────────────────────────────────┴────────────────┤
│ status 28px                                                       │
└──────────────────────────────────────────────────────────────────┘
   raíl 208px
```

Geometría exacta ya existente, no se inventa nada: topbar 44px (`index.css:104-107`), raíl 208px
(`:126-137`), dock 336px (`:144-153`), línea de estado 28px (los `inset` de raíl y dock la reservan).

**ADR-018 y 🔒-3 quedan intactas.** El dock pinta el mando; los elementos `<audio>` siguen viviendo
en `PlayerProvider`, que ahora está *por encima* del admin en el árbol. Es palabra por palabra el
mismo razonamiento que ADR-029 hizo para las tres pestañas.

### 3.3 `AdminShell` aprende a no ser dueño de la pantalla

Prop nueva `chrome`:

- `chrome="own"` (**por defecto**): comportamiento de hoy — contenedor a `100dvh`, fondo propio,
  cabecera propia, navegación de recursos en `aside`. **Es lo que se lleva vinos**, que no tiene
  marco. Cero regresión.
- `chrome="host"`: el shell renuncia a `minHeight/background/header` (`AdminShell.jsx:32-36`) y a su
  `aside` de recursos; se limita al área de trabajo. La navegación entre las cuatro consolas sube al
  raíl, como hijos de la entrada ADMIN — exactamente el patrón que el raíl ya usa para los modos de
  galería y las sub-tabs (`Layout.jsx:438-443`), y que ADR-029 §3 firmó para la galería.

el-bunker usa `host` a partir de 1280px y `own` por debajo.

### 3.4 Por debajo de 1280px: el reproductor también

Requisito de Edu, literal: **el reproductor debe estar siempre disponible.** No a partir de 1280px:
siempre. Por debajo del corte no hay marco (ADR-029 no se toca), así que el admin conserva su shell
propio — y **monta el mini-player**, igual que las tres pestañas.

Lo que hoy lo impide no es arquitectura, es dónde está escrito el código: el mini-player es un
componente ya autónomo (`MiniPlayer`, `Layout.jsx:270-405`) pero vive **dentro** de `Layout.jsx`, y
el admin no monta `Layout`. Montar `Layout` entero no vale: traería la navegación inferior de los 3
tabs a una pantalla que no es un tab, que es la confusión que 🔒-4 evita.

**Se extrae `MiniPlayer` a su propio módulo** (`src/musiclab/MiniPlayer.jsx`) y lo montan los dos:
`Layout` para las pestañas y el shell del admin. Es una mudanza literal, sin tocar una línea de su
cuerpo: ya recibe todo por props (`accentColor`, `bottomNavHeight`) y todo lo demás lo saca de
`usePlayer()` y `useVault()`. El admin lo monta con `bottomNavHeight={0}`, porque ahí no hay nav
inferior, y reserva ese alto de relleno al final de su área de trabajo cuando hay track activo, para
que no tape la última fila de la tabla.

Y encaja solo con el §3.2: la clase `mobile-mini-player` ya está oculta a partir de 1280px
(`index.css:103`), justo donde entra el dock. Un solo requisito —«siempre disponible»— y dos piezas
que se relevan en el mismo punto de corte, sin condicionales nuevos.

**Dónde vive:** `src/musiclab/`, no `src/layout/`. ADR-018 🔒-3 dice que el playback es de
MusicLab/PlayerProvider; el mando de reproducción es suyo, y el shell visual solo lo coloca. La
extracción **acerca** el código a la regla en vez de alejarlo.

### 3.5 El vibe, en el admin, a cualquier ancho

Mismo patrón, mismo problema, misma solución. El efecto que publica `--vibe-accent` en `:root` está
escrito dentro de `Layout` (`Layout.jsx:516-520`), así que sin `Layout` nadie lo actualiza y el admin
se quedaría con el color base — que es exactamente la queja de Edu, «no sigue el vibe», sobreviviendo
al rediseño.

**Se extrae a un `VibeAccentBridge`**: un componente de ~8 líneas, sin marcado, que consume
`usePlayer()` y publica la variable. Se monta **una sola vez dentro de `PlayerProvider`, en
`App.jsx`**, de modo que lo heredan las pestañas y el admin, en móvil y en escritorio, sin que
ninguno de los dos tenga que acordarse. `Layout` deja de hacerlo.

Se hace así, y no moviendo el efecto dentro de `PlayerContext.jsx`, porque ese fichero está
congelado (D7, y la tabla de límites del diseño del panel). Un consumidor del provider no es el
provider: el puente lee `trackVibe` y escribe una variable CSS; no toca playback, ni refs, ni
`<audio>`. 🔒-3 intacta.

---

## 4. La entrada visible, y la que hoy corta la música

### 4.1 Entrada en el raíl

Cuarta entrada del raíl, **separada por un filete** de las tres destinaciones, sobre la pista de
atajos: `ADMIN`, icono `shield` del registro (`src/core/ui/Icon.jsx:105` — cero emoji, regla del
6-ago). Sus hijos, cuando está activa: `CONTENIDO · SALUD · AUDITORÍA · ACCESOS`.

Se muestra solo si `user.id === "admin"`. **Ocultarla no es seguridad y no se vende como tal**: la
autorización la sigue dando el Worker con `requireAdmin`, y Edu o David con su sesión normal reciben
403 aunque escriban la URL (`DISENO_PANEL_ADMIN_2026-08-04.md:59-63`). La entrada se oculta porque
un botón que siempre da 403 es ruido, no por defensa.

Sin atajo de teclado: `1`/`2`/`3` siguen siendo las tres zonas y la pista del raíl no cambia.

### 4.2 El routing tiene que dejar de recargar la página

`App.jsx:111` decide por `window.location.pathname`. Con eso, entrar en `/admin` desde el raíl sería
una navegación dura: recarga completa, `PlayerProvider` se desmonta, **la música se para**. Se
habría montado el reproductor en el admin para que aparezca siempre en silencio.

Por tanto, y aunque la tarjeta no lo pide: **`/admin` pasa a routing de cliente**. Estado de ruta en
`App`, `history.pushState` al entrar y salir, y un `popstate` que lo sincroniza para que atrás y
adelante funcionen. La URL sigue siendo real y el enlace directo sigue entrando en el panel: el
rewrite de Vercel para la SPA ya está puesto (commit `b84088c`, DoD 4 de INT-Ola2).

Sin esto, el §3 entero es decorativo.

---

## 5. Lo que este diseño NO hace

| No hace | Por qué |
|---|---|
| Cuarto tab | ADR-017 🔒-4: `/admin` es ruta, no entra en nav móvil ni en `1`/`2`/`3` |
| Tocar `PlayerContext`, `WinampPlayer` o `AudioVisualizer` | ADR-018 🔒-3 y D7: el player está congelado. El admin lo *contiene*, no lo modifica |
| Colores del Búnker dentro de `src/admin/core/` | Es lo que rompería vinos. El core declara variables; la app las define |
| Cambiar el cuerpo de `MiniPlayer` al extraerlo | La mudanza es literal: mismo componente, mismas props, otro fichero. Si cambia algo, deja de ser una extracción y se convierte en un rediseño del player, que está congelado |
| Un agregador de stats propio para la consola de auditoría | ADR-019 🔒-5 |

---

## 6. ADR-030 — texto firmable (sustituye al BORRADOR del 4-ago)

> **ADR-030 — El panel de administración es una ruta dentro de la app, no otra aplicación**
> (propuesto 12-ago-2026; sustituye al BORRADOR de `DISENO_PANEL_ADMIN_2026-08-04.md:120`, que
> nunca llegó a `CONTRATO.md`).
>
> La administración vive en la ruta `/admin`, fuera de VAULT · MUSIC LAB · CAPSULES. **ADR-017 🔒-4
> intacta**: no es un cuarto tab, no aparece en la navegación de móvil ni en los atajos `1`/`2`/`3`.
> El acceso lo autoriza el Worker (`user_id === "admin"`, ADR-028); la ocultación de la entrada en
> la UI es higiene visual, nunca defensa.
>
> El panel se construye como `admin-core` **reutilizable** + descriptores declarativos por recurso,
> para que `vinos-carta-app` herede el núcleo. Es cliente del motor de eventos (ADR-019), no un
> agregador nuevo, y toda mutación administrativa emite un evento `admin_*`.
>
> **El tema es un contrato, no un import.** `admin-core` no importa tokens de ninguna app: declara
> *custom properties* `--admin-*` con valores de respaldo y las define la aplicación anfitriona. En
> el-bunker, `--admin-accent` se ata a `--vibe-accent`, de modo que el panel sigue a lo que suena
> (ley del vibe) sin acoplarse a el-bunker. Quedan **fuera del vibe**, por `VB9`, el color
> destructivo, los estados de error y los indicadores de sistema de la consola de SALUD.
>
> **El reproductor está disponible en el panel a cualquier ancho.** A partir de 1280px el panel se
> pinta dentro del marco de ADR-029 —barra superior, raíl donde vive la entrada ADMIN y sus cuatro
> consolas, dock de reproductor y línea de estado—; por debajo conserva su shell propio y monta el
> mini-player, igual que las tres pestañas. Para que ambas cosas sean posibles, la ruta `/admin` se
> monta **dentro de `PlayerProvider`** y se navega por routing de cliente, sin recarga.
>
> **ADR-018 y 🔒-3 no se alteran**: los elementos `<audio>` siguen encapsulados en el provider, que
> está por encima del panel en el árbol; lo que se mueve es dónde se pinta el mando. Como corolario,
> el mando de reproducción y el puente que publica el vibe (`--vibe-accent`) dejan de vivir dentro
> del shell visual y pasan a ser piezas propias, montables por cualquier pantalla que cuelgue del
> provider. Ningún fichero congelado del player (`PlayerContext`, `WinampPlayer`, `AudioVisualizer`)
> se modifica.

---

## 7. Plan de ejecución y ACEPTACIÓN por artefacto

Seis fases. F1, F2 y F3a no dependen unas de otras y pueden ir en carriles paralelos; F3b las
espera a las tres.

| # | Fase | Ficheros | ACEPTACIÓN (verificable a mano) |
|---|---|---|---|
| **F1** | Contrato de tema en el core | `src/admin/core/*.jsx`, `admin-core-boundaries.test.js` | `grep -c "\.\./\.\./tokens" src/admin/core/*` **= 0** · test 7 reescrito a «cero imports de tokens» · `npx vitest run src/admin` verde · captura a 1280px **idéntica** a la de hoy (los fallbacks valen lo mismo que los tokens actuales) |
| **F2** | La app define las variables | `src/index.css` | Con una pista de vibe ácido sonando, `getComputedStyle(document.documentElement).getPropertyValue('--admin-accent')` **= el mismo valor que `--vibe-accent`** · al cambiar de vibe, el acento del panel cambia sin recargar |
| **F3a** | Extraer `MiniPlayer` y crear `VibeAccentBridge` | `src/musiclab/MiniPlayer.jsx` (nuevo, mudanza literal), `src/layout/Layout.jsx`, `src/layout/App.jsx` | `git diff` del cuerpo de `MiniPlayer` **vacío** salvo imports (si no, es un rediseño encubierto) · las 3 pestañas siguen enseñando el mini-player en móvil, sin cambio visual · `--vibe-accent` se sigue actualizando en las pestañas con `Layout` ya sin ese efecto |
| **F3b** | El admin dentro del provider, del marco y con reproductor | `src/layout/App.jsx`, `src/admin/core/AdminShell.jsx` | `App.admin-route.test.jsx` amplía: montando `/admin` existe el dock y el shell renderiza con `chrome="host"` · **prueba decisiva en escritorio:** reproducir una pista, entrar en `/admin`, `document.querySelector('audio').currentTime` **sigue creciendo** · **prueba decisiva en móvil (390x844):** el mini-player se ve en el panel, play/pausa y saltos responden, y no tapa la última fila de la tabla · a 1280px el mini-player desaparece y el dock ocupa su sitio |
| **F4** | Entrada en el raíl + routing de cliente | `src/layout/Layout.jsx`, `src/layout/App.jsx` | Con `user.id==="admin"` la entrada ADMIN aparece; con `edu` no · pulsarla no dispara `load` (sin recarga) · atrás del navegador vuelve al tab anterior · `https://…/admin` en frío entra al panel · JWT de `edu` contra `/api/admin/*` → **403** |
| **F5** | `chrome="own"` verificado como el modo de vinos | `src/admin/__tests__/AdminShell.test.jsx` | Test que monta `AdminShell` sin marco ni variables `--admin-*` definidas y comprueba que sigue siendo legible (fallbacks) — es el ensayo de la mudanza a vinos |

---

## 8. Riesgos

1. **Que el admin se convierta en un cuarto tab de facto.** Mitigación escrita en el ADR y
   verificable: no está en `destinations`, no está en la nav móvil, no responde a `1`/`2`/`3`.
2. **Que el marco tape el panel en pantallas justas.** El lienzo se queda en `1280 − 208 − 336 =
   736px` útiles. Las tablas de recursos del panel tienen que medirse ahí, no a pantalla completa.
   `tools/audit-ui` ya sabe medir truncados: la línea base del admin a 1280px se toma **antes** de
   F3b, para poder comparar.
3. **Que la extracción de `MiniPlayer` toque el player sin querer.** Es el único punto donde este
   trabajo roza código congelado. Mitigación dura y verificable: el diff del cuerpo del componente
   tiene que ser **vacío** (F3a). Si alguien "aprovecha para mejorarlo", se para.
4. **Que la reutilización se prometa y no se compruebe.** Por eso F1 endurece el test de fronteras y
   F5 ensaya el modo sin variables. Si esos dos no están verdes, el trabajo no está hecho, por
   bonito que se vea el panel.
5. **Reactividad al vibe en una pantalla de administración.** Que el acento cambie con la música es
   lo que Edu pide, pero hay una frontera y la marca la spec, no el gusto: `VB9` deja fuera del vibe
   los botones destructivos, los estados de error y los indicadores de sistema (§2.2). Si esa
   frontera se cruza, el panel deja de poder avisar de nada: todo sería del mismo color.
