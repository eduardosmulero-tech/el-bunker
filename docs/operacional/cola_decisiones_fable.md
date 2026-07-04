# COLA DE DECISIONES FABLE — el_bunker

> Decisiones de diseño/producto no resueltas por el plan `auditoria_fable_1.0.md` §7 (FASE B y C).
> Generado por deepseek, S145, 2026-07-05 (corregido). Pendiente de revisión por Fable.

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
