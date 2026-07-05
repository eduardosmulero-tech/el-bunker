# COLA DE DECISIONES FABLE — el_bunker

> Decisiones de diseño/producto no resueltas por el plan `auditoria_fable_1.0.md` §7 (FASE B y C).
> Generado por deepseek, S145, 2026-07-05 (corregido).
> ✅ **RESUELTO POR FABLE (S145, 2026-07-05)** — las 6 decisiones abajo en "RESOLUCIÓN FABLE".
> Evidencia reverificada contra código real antes de decidir (Regla de Oro). Los 6 planteamientos
> originales de deepseek se conservan más abajo como contexto.

---

## ✅ RESOLUCIÓN FABLE (S145, 2026-07-05)

Criterio único aplicado: **"¿esto hace que Edu y David dejen Spotify/Google Photos?"**
Cada verdicto incluye notas de implementación vinculantes para el pliego que lo ejecute.

### 1. Carátula-first → **OPCIÓN B**: carátula como capa base permanente, visualizador encima

- La carátula (`track.thumbnail`, resolver R2 key → URL absoluta con el patrón ya existente en
  `PlayerContext.jsx:1121`) es el fondo permanente del área del visualizador (~250px), `object-cover`,
  con scrim oscuro inferior para legibilidad del canvas.
- Reproduciendo: las barras se pintan encima (canvas transparente sobre la imagen). En pausa el canvas
  se limpia — el comportamiento actual de `AudioVisualizer.jsx:158` pasa de bug a feature: queda la
  carátula limpia. Sin transición brusca (rechazo de A) y con paridad Spotify (rechazo de C).
- **Sin thumbnail** (campo nullable en schema): fallback degradado del color de vibe + icono de vibe.
  Nunca más negro vacío.
- Ajuste fino (atenuar carátula a ~0.5-0.7 mientras suena si las barras no se leen) queda a criterio
  visual en implementación, verificado en dispositivo real.
- Nota: el contenedor ya es opaco `#0a0a0a` (PLIEGO-230, `WinampPlayer.jsx:608`) — la carátula vive
  dentro de él; no reintroduce el problema de transparencia que ese pliego arregló.

### 2. CRT sobre el arte → **OPCIÓN B**: CRT global reducido + arte grande en portales (limpio)

- **Hallazgo técnico que invalida la opción A tal como estaba planteada:** `<main>` es
  `relative z-20` (`Layout.jsx:603-604`) → crea stacking context. Subir el z-index de nada dentro de
  `<main>` puede escapar de los overlays z-40/z-50 que están a nivel raíz. La única vía limpia es
  `createPortal` a `document.body` (patrón ya establecido: `TrackCard.jsx:68`).
- Verdicto en dos piezas:
  1. **Global:** bajar scanlines de `rgba(0,0,0,0.25)` a **~0.10-0.12** (`Layout.jsx:22`). El CRT
     sigue en toda la app (identidad intacta) pero deja de ensuciar. Noise (0.03) no se toca.
  2. **Arte grande** (lightbox unificado de la decisión 6, zoom modals): se renderiza vía
     `createPortal` + z ≥ 60 → queda automáticamente libre de CRT, gratis.
- La carátula in-player (decisión 1) convive con scanlines al 0.10. Si tras verlo en dispositivo
  sigue ensuciando → plan B: portal solo para el contenedor de carátula.
- Rechazo de C (no tocar nada): P2.8 está confirmado con capturas reales; el arte es justo lo que
  esta app vende.

### 3. Cola peek → **OPCIÓN A** + mantener el gesto swipe-up existente

- Línea "A CONTINUACIÓN: [título — artista]" bajo la seek bar, ~20px, truncada, **tappable** →
  dispara el mismo `bunker_swipe_up_queue` (`WinampPlayer.jsx:257`) que abre la cola completa.
  Peek pasivo (paridad Spotify) + acceso deliberado (gesto ya existente). B sola no es un peek.
- **Vinculante:** el "siguiente" mostrado debe salir de la MISMA lógica que `skipDir(1)` en
  `PlayerContext.jsx` (cola manual primero, luego contexto). Exponer un `peekNextTrack` desde
  PlayerContext — NO duplicar la lógica en WinampPlayer. Un peek que miente es peor que ninguno.
- Rechazo de C (drawer ~120px): caveat abierto del ADDENDUM S145 — el player ya creció ~48px con
  PLIEGO-237; en pantallas de ~640px de alto un drawer arriesga empujar el player fuera de viewport.

### 4. WALL como museo → **OPCIÓN B**: agrupación curatorial por eras ("salas")

- Headers de sección por era (nombre + rango de fechas + color de era como acento) separando el
  masonry actual en "salas". Dentro de cada sala se conserva todo lo maduro: masonry, 3 densidades
  con pinch-zoom, stagger. Las eras son los capítulos de la relación — esa ES la curaduría.
- La opción C (modo inmersivo al tap) **no se descarta: es exactamente el detalle full-bleed de
  FASE C**, resuelto en la decisión 6. Elegirla aquí duplicaría esa pieza.
- Rechazo de A (marcos + fichas): baja la densidad, y la ficha técnica ya existe como
  `LongPressPreview` (`WallView.jsx:210`) — no hace falta pegarla debajo de cada thumbnail.
- Badges legibles (tamaño/contraste) es tarea del plan, no decisión — va en el mismo pliego.
- **Caveat técnico vinculante:** WALL está virtualizado — los headers de sección deben integrarse
  sin romper la virtualización (agrupar por era ANTES de la ventana de render).

### 5. DEMO_ENTRIES_GEO → **OPCIÓN A**: cero demo en producción

- Quitar el default `entries = DEMO_ENTRIES_GEO` (`VaultGallery.jsx:868`). Sin coordenadas →
  estado vacío elegante que ya existe.
- **Mismo criterio para `DEMO_TRACKS` (`MusicLab.jsx:60`) y `DEMO_ERAS` (`Vault.jsx:31`)** — cierra
  P3.11 entero, no solo el mapa. Si se quieren conservar para desarrollo, gate `import.meta.env.DEV`;
  si no, borrarlos.
- Rechazo de B (demo como onboarding): esta app tiene exactamente 2 usuarios reales que ya pasaron
  el onboarding para siempre. Pines falsos de Madrid/Lisboa en una bóveda de memoria real es lo
  contrario del propósito emocional del producto.

### 6. Lightbox unificado → **OPCIÓN B acotada**: un `EntryLightbox` único vía portal; la identidad de cada modo vive FUERA del lightbox

- **Un** componente: full-bleed, swipe horizontal sobre la lista que el modo le pasa
  (`entries` + `startIndex`), pinch-zoom, metadata emocional (quién/era/fecha/nota), cierre por
  swipe-down/tap, `createPortal` a body + z-[100] (→ libre de CRT gratis, por decisión 2).
- Sin sistema de slots: props simples. Es la B con la simplicidad de la A — la "variante por modo"
  es qué lista pasa cada modo y cuándo lo abre, no lógica dentro del lightbox.
- Lo adoptan: **WALL** (sustituye `ZoomModal`, `WallView.jsx:292`), **DIALOGUE** (sustituye su modal
  `zoomImage`, `VaultGallery.jsx:269` — que además hoy está dentro del stacking context de main),
  **EXHIBITION** y **REEL**. **CINEMA no se toca por dentro** (Ken Burns + auto-avance ES el modo,
  no un lightbox); su prop `onZoom` existente abre el mismo `EntryLightbox`.
- `LongPressPreview` de WALL se queda tal cual (es un peek, no un lightbox).
- Este componente **ES** el "detalle de foto full-bleed" de FASE C — una sola pieza cubre dos
  bullets del plan. Orden recomendado dentro de FASE C: construir `EntryLightbox` primero.

### Orden de ejecución recomendado

- **FASE B** (un pliego, `WinampPlayer.jsx` + `AudioVisualizer.jsx` + `Layout.jsx` overlay +
  `PlayerContext.jsx` peekNext): decisiones 1 + 2(global) + 3.
- **FASE C** (dos pliegos): primero `EntryLightbox` + adopción (decisión 6 + 2-arte), después
  WALL museo + cero DEMO (decisiones 4 + 5).

---

## 1. Carátula-first: ¿qué muestra el reproductor cuando no hay visualizador?

**Dónde:** `src/musiclab/WinampPlayer.jsx:609` (wrapper de AudioVisualizer), `src/musiclab/AudioVisualizer.jsx:158` (canvas vacío si `!isPlaying`)

**La frase del plan que lo esconde:** "Now-playing carátula-first (arte grande cuando no está el visualizador; visualizador a fullscreen por tap, ya existe UX6)"

**Por qué es una decisión, no una tarea:** Hoy el reproductor muestra un canvas negro de ~250px cuando está en pausa (`AudioVisualizer` limpia el canvas si `!isPlaying`). No existe ningún componente de carátula/artwork en `WinampPlayer.jsx`. "Carátula-first" puede significar al menos 3 cosas distintas, y cada una cambia la experiencia y la complejidad técnica: ¿la carátula reemplaza al visualizador cuando está pausado? ¿convive con él como fondo? ¿el visualizador es un overlay sobre la carátula? Spotify usa carátula siempre visible + controls overlay; Winamp clásico era visualizador-first. Esta app tiene identidad Winamp pero aspira a paridad premium.

**Opciones concretas:**
- **A. Carátula reemplaza visualizador en pausa:** cuando `!isPlaying`, mostrar `track.thumbnail` a tamaño completo (~250px) en lugar del canvas vacío. Al reproducir, el visualizador vuelve. Simple, mínimo riesgo. Pero: transición visual brusca entre carátula y visualizador.
- **B. Carátula como capa de fondo del visualizador:** artwork semi-transparente debajo del canvas, visible sobre todo en pausa y en momentos de baja energía. El visualizador siempre está presente. Look más "premium" pero más complejo (dos capas, opacidad dinámica).
- **C. Visualizador idle animado:** en lugar de canvas negro en pausa, mostrar una animación idle (respiración de barras, ecualizador estático con pulso). Sin artwork. Fiel a la identidad Winamp pero sin paridad Spotify ("¿dónde está la carátula?").

**Bloquea:** PLIEGO FASE B — no se puede implementar "now-playing carátula-first" sin definir qué significa.

---

## 2. CRT sobre el arte: ¿cuánto scanline/noise encima de la carátula?

**Dónde:** `src/layout/Layout.jsx:16-25` (ScanlineOverlay `fixed inset-0 z-50 mixBlendMode:overlay`), `src/layout/Layout.jsx:29-37` (NoiseOverlay `fixed inset-0 z-40`), `src/musiclab/WinampPlayer.jsx:609` (zona de carátula/visualizador dentro de `<main>` con z-20)

**La frase del plan que lo esconde:** "sacar scanline/noise de encima del arte (bajar z o excluir la zona de carátula)" + "Decisión de producto de Edu: ¿cuánto CRT sobre el arte?"

**Por qué es una decisión, no una tarea:** El plan ya reconoce que esto es una decisión. Los overlays CRT (`z-50` scanlines + `z-40` noise) cubren TODO el viewport, incluido el reproductor. El efecto "ensucia" las carátulas (confirmado en capturas reales, P2.8 de la auditoría). Pero el CRT es parte de la identidad visual de la app — quitarlo del todo pierde el carácter Cyber-Vandal. La pregunta real es dónde trazar la línea: ¿cero CRT sobre el arte del reproductor? ¿CRT sutil (opacidad reducida) solo en la zona del player? ¿CRT completo excepto en fullscreen del visualizador?

**Opciones concretas:**
- **A. Cero CRT en zona de reproductor:** subir el z-index del player por encima de z-50 para que los overlays no lo cubran. La carátula se ve nítida, pero el player queda visualmente "desconectado" del resto de la app (sin CRT mientras todo lo demás sí lo tiene).
- **B. CRT reducido en player:** mantener overlays pero bajar opacidad de scanlines (hoy ~25% negro) en la zona del player, o excluir noise del área de carátula. Compromiso: algo de carácter CRT sin ensuciar el arte.
- **C. CRT completo, sin cambios:** el CRT es la identidad. Spotify/YTM no tienen scanlines — eso es justo lo que diferencia a El Búnker. Si al usuario le molesta, que use otra app.

**Bloquea:** PLIEGO FASE B — "sacar scanline/noise de encima del arte" no se puede implementar sin decidir cuánto.

---

## 3. Cola "a continuación": ¿cómo se asoma la cola en el reproductor?

**Dónde:** `src/musiclab/WinampPlayer.jsx:257` (evento `bunker_swipe_up_queue` como gesto de swipe-up), `src/core/PlayerContext.jsx` (la cola existe como `localQueue` pero no se muestra en el player)

**La frase del plan que lo esconde:** "\"a continuación\"/cola peek"

**Por qué es una decisión, no una tarea:** La cola existe en el contexto pero es invisible en el reproductor. "Peek" sugiere una vista parcial, no la cola completa. Pero hay varias formas de "asomarla" con implicaciones de espacio muy distintas en mobile (ya ajustado tras PLIEGO-237 que añadió una segunda fila de controles). La cola completa ya tiene un gesto swipe-up (`bunker_swipe_up_queue` en `WinampPlayer.jsx:257`) pero eso es una acción deliberada, no un "peek" pasivo.

**Opciones concretas:**
- **A. Mini-peek inline de 1 track:** debajo de la seek bar, una línea sutil con "A continuación: [título]" del siguiente track. Mínimo espacio (~20px), informativo, no interactivo. Siempre visible.
- **B. Swipe-up reveal:** mantener el gesto existente (`bunker_swipe_up_queue`) como único acceso a la cola. Cero espacio adicional. Pero no es un "peek" — el usuario no ve nada sin interactuar.
- **C. Panel deslizable desde abajo:** un drawer que se abre con swipe-up mostrando 3-4 tracks siguientes + "ver cola completa". Más ambicioso, requiere ~120px extra. Riesgo de empujar el player fuera de pantalla en dispositivos pequeños.

**Bloquea:** PLIEGO FASE B — no se puede implementar "cola peek" sin decidir el mecanismo de interacción y cuánto espacio consume.

---

## 4. WALL como museo: ¿qué separa un "museo" de un "file browser"?

**Dónde:** `src/vault/WallView.jsx:406` (export de WallView, ~534 líneas totales), `src/vault/VaultGallery.jsx:1164` (delegación a `<WallView>`)

**La frase del plan que lo esconde:** "WALL como museo (densidad, badges legibles, stagger)"

**Por qué es una decisión, no una tarea:** WallView actual tiene masonry layout, 3 densidades con pinch-zoom, badges básicos (inicial del usuario, punto de era, icono de categoría), y stagger animation. Es funcional pero no transmite "museo" — se parece más a un explorador de archivos con thumbnails. "Museo" es una metáfora aspiracional que no está definida: ¿implica encuadres/"marcos" alrededor de cada pieza? ¿Fichas técnicas visibles sin hover? ¿Agrupación curatorial por era con separadores? ¿Tipografía y espaciado de sala de exposición? Sin definición, el desarrollador puede implementar cualquier cosa y llamarlo "museo".

**Opciones concretas:**
- **A. Museo = encuadres + fichas técnicas:** cada imagen con un marco sutil (borde + padding generoso), y debajo una "ficha" mini con título, fecha, autor. Layout más espaciado, menos densidad. Look de sala de exposición.
- **B. Museo = agrupación curatorial:** las entradas se agrupan visualmente por era con encabezados de sección (nombre de era + fechas), como salas de un museo. Navegación por "salas" además del scroll libre.
- **C. Museo = modo inmersivo:** al hacer tap en una entrada, transición a una vista "de pared de museo" con la imagen en grande, metadata a un lado como una placa, y navegación swipe entre piezas de la misma "sala". El WALL actual (masonry) es solo la vista de catálogo.

**Bloquea:** PLIEGO FASE C — "WALL como museo" no se puede implementar sin definir la metáfora visual.

---

## 5. DEMO_ENTRIES_GEO: ¿deben los usuarios reales ver datos demo?

**Dónde:** `src/vault/VaultGallery.jsx:868` (parámetro default `entries = DEMO_ENTRIES_GEO` en MapView), `src/vault/VaultGallery.jsx:780` (definición de `DEMO_ENTRIES_GEO` con 9 ubicaciones hardcodeadas)

**La frase del plan que lo esconde:** "quitar DEMO_ENTRIES_GEO cuando no hay datos reales"

**Por qué es una decisión, no una tarea:** "Quitar" es ambiguo. El mapa actual cae en DEMO_ENTRIES_GEO cuando no hay entries con coordenadas reales. Pero hay una diferencia entre: (a) una cuenta nueva sin entradas de ningún tipo — donde los datos demo pueden servir como onboarding visual ("así se verá tu mapa"), y (b) una cuenta con entradas reales pero ninguna con geolocalización — donde mostrar Madrid/Lisboa/París cuando el usuario tiene contenido propio (aunque sin coordenadas) es engañoso. La decisión es si los datos demo cumplen una función legítima de producto o son solo un remanente de desarrollo que debe desaparecer en producción.

**Opciones concretas:**
- **A. Cero demo en producción:** `entries` sin default — si no hay datos con coordenadas, mostrar el estado vacío elegante que ya existe (`VaultGallery.jsx` fallback "🌍 MAPA · Geografía de la relación"). Los datos demo solo existen en desarrollo local.
- **B. Demo solo para cuentas nuevas:** mostrar DEMO_ENTRIES_GEO únicamente si el usuario tiene 0 entradas totales (no solo 0 con coordenadas). Si tiene entradas pero sin geolocalización, estado vacío. Demo como onboarding.
- **C. Demo siempre como fallback:** comportamiento actual. Los datos demo aseguran que el mapa nunca esté vacío. Confuso si el usuario tiene contenido real.

**Bloquea:** PLIEGO FASE C — no se puede "quitar DEMO" sin definir bajo qué condiciones.

---

## 6. Lightbox unificado: ¿una sola experiencia de zoom para todos los modos de galería?

**Dónde:** `src/vault/WallView.jsx:210` (LongPressPreview), `src/vault/WallView.jsx:292` (ZoomModal), `src/vault/VaultGallery.jsx:56` (CinemaView con Ken Burns + swipe inline), `src/vault/VaultGallery.jsx:269` (zoom modal de DialogueView), `src/vault/VaultGallery.jsx:551` (ExhibitionView expand inline con `expandedEra`)

**La frase del plan que lo esconde:** "lightbox unificado"

**Por qué es una decisión, no una tarea:** Hoy hay 4 experiencias de "ver en grande" diferentes, cada una con comportamientos distintos: WALL tiene LongPressPreview + ZoomModal con spring animation + metadata, Cinema tiene Ken Burns + swipe horizontal inline, Dialogue tiene un modal independiente con backdrop blur (`z-[100]`), Exhibition expande inline con grid. "Unificado" puede significar: un solo componente que reemplace todos (consistencia total, pero ¿pierde cada modo su carácter?), o una experiencia base compartida con variantes por modo. La decisión define la arquitectura de navegación de la galería entera.

**Opciones concretas:**
- **A. Lightbox único para toda la galería:** un componente `EntryLightbox` usado por WALL, Cinema, Dialogue, Exhibition, Reel. Comportamiento uniforme: swipe horizontal entre todas las entradas de la galería, pinch-zoom, metadata overlay. Máxima consistencia. Pero Cinema pierde su Ken Burns automático; Dialogue pierde su chat asimétrico.
- **B. Lightbox base + variantes por modo:** un componente compartido (`LightboxCore`) con slots para el comportamiento específico del modo. WALL usa swipe libre, Cinema usa auto-avance + Ken Burns, Dialogue mantiene pares. Más complejo pero preserva la identidad de cada modo.
- **C. No unificar — pulir cada modal por separado:** mantener los componentes independientes pero mejorarlos individualmente (pinch-zoom en todos, metadata consistente, mismos gestos de cierre). Menos ambicioso, menos riesgo, no rompe nada.

**Bloquea:** PLIEGO FASE C — "lightbox unificado" requiere decidir cuánta unificación y qué se sacrifica.

---

> Generado por deepseek, S145, 2026-07-05 (corregido y completado). Pendiente de revisión por Fable.
