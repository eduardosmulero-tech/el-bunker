# EL BÚNKER — Especificación de la GALERÍA del VAULT
> "Al menos 2x mejor que cualquier galería del mercado, premium o no."
> La galería no es un file browser — es un MUSEO emocional de la relación.

---

## 📐 Métricas objetivas: ¿qué significa "2x mejor"?

| Métrica | Mercado (Google/Apple Photos) | El Bunker |
|---|---|---|
| **Modos de navegación** | 1-2 (grid, mapa) | 6 (WALL, CINEMA, MAP, DIALOGUE, REEL, EXHIBITION) |
| **Densidad de contexto** | Metadatos técnicos (F4.0, ISO 100, 12MP) | Metadatos emocionales (quién, dónde, qué sonaba, qué Era, qué mood) |
| **Perspectivas** | 1 (tu álbum) | 3 (Edu, David, dual/Dialogue) |
| **Capa ambiental** | Fondo blanco fijo | Color reactivo por Era + pulso acústico con la música + scanlines |
| **Fricción de inmersión** | Navegación por carpetas y menús | 0 clicks al contenido — todo responde a `--vibe-accent` |
| **Sincronía entre usuarios** | No existe | Live Sync: ambos viendo la misma foto al mismo tiempo |
| **Edge cases** | Icono roto genérico | [DATOS DAÑADOS / ARTEFACTO PERDIDO] con glitch estético |
| **Rendimiento** | Native optimizado | Virtualización agresiva para PWA Android sin OOM |

---

## 🎨 Capa ambiental (compartida por todos los modos)

### Paleta reactiva por Era
Cada Era tiene una paleta dominante extraída de sus fotos. La galería se tiñe con ella:
- Fondo: nunca blanco — gradiente oscuro basado en la paleta de la Era
- Bordes, glows, scanlines: colores de la Era
- Si no hay fotos aún → paleta por defecto de la Era (`era.color`)

### Reactividad acústica
Si MusicLab está reproduciendo mientras se navega la galería:
- Los glows del glassmorphism laten al BPM (AnalyserNode)
- El padding del grid respira sutilmente con la música
- Toggle: ON/OFF en la cabecera de la galería

### Música ambiente de Era (CINEMA y EXHIBITION)
- Playlist generada automáticamente con los tracks más escuchados durante esa Era
- Volumen bajo (20-30%), opcional, desactivable
- No interfiere con la reproducción activa de MusicLab

---

## 🧭 Los 6 modos de navegación

### Selector de modos
Barra horizontal en cabecera con 6 iconos. Animación `layoutId` de Framer Motion entre modos. El modo activo tiene glow.

```
[▦ WALL] [▣ CINEMA] [◎ MAP] [◈ DIALOGUE] [▸ REEL] [⬡ EXHIBITION]
```

---

## 1. ▦ WALL — El mosaico denso

### Concepto
Masonry grid infinito. La vista por defecto. No es un simple grid — es un **tapiz vivo**.

### Qué lo hace 2x mejor que un grid normal
- **Zoom de densidad por pinch**: 3 niveles (denso / cómodo / aireado). Sin menús. Los dedos controlan cuánto ves.
- **Cada celda respira**: no son thumbnails estáticos. Tienen micro-animaciones al aparecer (fade-in escalonado), brillo sutil al hacer hover.
- **Badges de contexto** superpuestos en cada foto:
  - Indicador de quién la tomó (iniciales o color: Edu = verde, David = púrpura)
  - Icono de música si había track sonando
  - Candado ⧖ si pertenece a una cápsula bloqueada (se ve pixelada/glitcheada)
- **Long press** → preview rápido + ribbon de contexto sin salir del grid
- **Virtualización agresiva**: solo se renderizan las celdas visibles + buffer de 2 filas. Sin OOM en Android con cientos de fotos.

### Ribbon de contexto (long press)
```
┌────────────────────────────────────────────┐
│  [foto ampliada brevemente]                 │
│  ───────────────────────────────────────── │
│  📍 Barcelona · ☀ 14:32 · 📅 15 mar 2025   │
│  👤 David · 🏛️ Era ORIGEN                   │
│  🎵 Sonaba: Bicep - Glue                   │
│  [ver entrada] [ir al mapa] [compartir]    │
└────────────────────────────────────────────┘
```

---

## 2. ▣ CINEMA — La experiencia inmersiva

### Concepto
Full-bleed, una pieza a la vez. Swipe horizontal. Música ambiente de la Era. La experiencia "sentarse a recordar".

### Qué lo hace 2x mejor que Apple Photos Memories
- **No es un slideshow automático** — tú controlas el ritmo con swipe. La app sugiere, no impone.
- **Audioguía (Curator Notes)**: voz grabada por Edu o David anclada a una foto. Como las audioguías de un museo. Se reproduce al llegar a esa foto.
- **Subtítulos emocionales**: overlay inferior con metadatos narrativos, no técnicos:
  ```
  ┌────────────────────────────────────────────┐
  │                                              │
  │              [FOTO FULL-BLEED]                │
  │                                              │
  │  ────────────────────────────────────────── │
  │  "Atardecer en la playa"                     │
  │  David · 15 marzo 2025 · Era ORIGEN          │
  │  Sonaba: Bicep - Glue · 📍 Barcelona          │
  │  🎤 Audioguía de Edu (0:42)                  │
  └────────────────────────────────────────────┘
  ```
- **Transiciones entre fotos**: no son slides secos. Son crossfades, zooms suaves, o Ken Burns sutiles según la relación entre las fotos (mismo día = crossfade suave, distinta Era = transición más marcada con wipe de color).
- **Pausa contemplativa**: si dejas el dedo quieto 3 segundos, la foto respira con un Ken Burns lento. Al soltar, continúa el swipe.
- **Música ambiente de la Era**: auto-playlist de tracks más escuchados en esa Era, volumen bajo. Se detiene si MusicLab ya está reproduciendo.

---

## 3. ◎ MAP — La geografía de la relación

### Concepto
Fotos pineadas en un mapa. Líneas que conectan ubicaciones en orden cronológico. La historia contada por dónde estuvisteis.

### Qué lo hace 2x mejor que Apple Photos Map
- **Líneas de viaje**: no solo pines sueltos. Las ubicaciones se conectan con líneas curvas animadas que trazan vuestra ruta. Cada línea tiene gradiente de color según la Era.
- **Clusters con narrativa**: varias fotos en el mismo sitio no son un número. Son un cluster expandible: "Barcelona: 12 fotos, 3 días, 2 cartas, 1 drop."
- **Timeline slider en el mapa**: barra inferior que filtra las fotos por rango de fechas. Arrastrar el slider = las fotos aparecen/desaparecen del mapa en tiempo real.
- **Tap en pin** → carrusel horizontal de fotos de esa ubicación
- **Distancias**: "Recorristeis 340km en este viaje" — calculado entre pines consecutivos
- **Capas**: toggle entre "Todos los viajes" / "Solo esta Era" / "Solo este año"

---

## 4. ◈ DIALOGUE — La conversación visual (KILLER FEATURE)

### Concepto
Las fotos de Edu y David intercaladas como una conversación. Dos perspectivas del mismo momento, cara a cara.

### Por qué ningún otro producto puede hacer esto
Apple/Google no asumen una relación de exactamente 2 personas. No tienen concepto de "la foto de él" vs "la foto de mí" como diálogo. Esta es LA feature diferencial.

### Layout
Dos columnas alternadas, estilo chat:
```
┌────────────────────────────────────────────┐
│                                              │
│  ┌──────────┐                                │
│  │          │  Edu · 14:30                   │
│  │ Foto Edu │  "Salida del tren"             │
│  │          │                                │
│  └──────────┘                                │
│                                              │
│                    ┌──────────┐              │
│   David · 14:31    │          │              │
│   "Y yo aquí"      │Foto David│              │
│                    │          │              │
│                    └──────────┘              │
│                                              │
│  ┌──────────┐                                │
│  │          │  Edu · 14:32                   │
│  │ Foto Edu │  "Tu cara al verlo jaja"       │
│  │          │                                │
│  └──────────┘                                │
│                                              │
└────────────────────────────────────────────┘
```

### Sincronización temporal
Cuando dos fotos se tomaron con <5 minutos de diferencia, aparecen **emparejadas** — una al lado de la otra — con un conector visual entre ellas: un hilo de luz que las une.

### Asimetría (edge case)
Si Edu tiene 40 fotos y David 0 en un período, no se muestra un muro vacío. En su lugar:
- Las fotos de Edu ocupan el centro con un sutil eco en el lado vacío
- Un mensaje estético: *"Solo un eco en la sala — David no capturó este momento."*
- Sin culpa, sin presión. Solo poesía visual.

### Filtro de diálogo
- "Ver solo conversaciones" (momentos donde ambos tienen fotos)
- "Ver todo" (incluye monólogos)

---

## 5. ▸ REEL — La historia curada

### Concepto
Secuencias auto-generadas que agrupan contenido relacionado. Un viaje, un día especial, una celebración. Fotos + mapa + música + carta del mismo momento, todo en una narrativa.

### Anatomía de un REEL
```
[REEL: "Barcelona · Marzo 2025"]

  1. Foto portada (mejor foto del viaje) — 3s, Ken Burns lento
  2. Mapa animado: trazado de la ruta — 2s
  3. Foto 1: "Llegada al hotel" — 3s
  4. Carta de Edu: "Hoy empezamos la aventura..." — tipografía overlay
  5. Foto 2: "Playa al atardecer" — 3s
  6. Drop de David: "Este momento es perfecto" — overlay
  7. Foto 3: "Última cena" — 3s
  8. Mapa de cierre con resumen: 340km, 3 días, 12 fotos — 3s
  9. Créditos: "Era ORIGEN · Barcelona · Marzo 2025"
```

### Controles
- ▶ Reproducir / ⏸ Pausar
- ⏩ Saltar escena
- 🎵 Banda sonora: track más escuchado del período o playlist de la Era
- 📌 Pin: "Guardar este REEL como inmutable" — se convierte en una entrada del VAULT tipo `reel`
- 🔄 Regenerar: si no te gusta la secuencia, la app intenta otra combinación

### Generación
- **Automática**: al alcanzar 5+ fotos en una misma ubicación o día
- **Manual**: "Crear REEL de..." seleccionando un rango de fechas o una ubicación
- Toast al generarse: "Tienes un nuevo REEL de Barcelona."

---

## 6. ⬡ EXHIBITION — La galería por vibes

### Concepto
Navegación no cronológica. Las fotos se agrupan por afinidad semántica: mismo vibe, mismo tag, mismo mood. Como las salas temáticas de un museo.

### Salas (clusters)
| Sala | Agrupación | Ejemplo |
|---|---|---|
| 🌿 420_chill | Fotos tomadas mientras sonaba música con tag `420_chill` | Atardeceres, naturaleza, humo |
| 💜 romantiqueo | Fotos con track `romantiqueo` de fondo | Cenas, abrazos, velas |
| ⚡ gaming | Fotos en sesiones gaming | Screenshots, setups |
| 🥁 dnb | Fotos con drum & bass sonando | Festivales, noche, energía |
| 📍 Viajes | Fotos con ubicación a >50km de casa | Barcelona, playa, montaña |
| 🎂 Celebraciones | Fotos en fechas de aniversario/cumpleaños | Tartas, regalos, gente |
| 🌙 Noche | Fotos tomadas 22:00-06:00 | Barras, fiestas, estrellas |
| ☀️ Día | Fotos tomadas 06:00-22:00 | Playas, paseos, comidas |

### Layout
Canvas 2D desplazable (tipo Figma/Miro). Cada sala es un clúster circular con:
- Foto representativa en el centro
- Fotos relacionadas orbitando
- Líneas curvas conectando fotos que comparten tags
- Zoom in/out para explorar

### Interacción
- Pinch para zoom out → ves todas las salas
- Pinch para zoom in sobre una sala → ves las fotos individuales
- Tap en foto → preview + contexto
- Las salas se reorganizan solas al añadir nuevas fotos

---

## 🔍 Panel de detalle (al hacer tap en cualquier foto en cualquier modo)

```
┌────────────────────────────────────────────┐
│                                              │
│            [FOTO A PANTALLA COMPLETA]         │
│            Swipe horizontal → más fotos       │
│                                              │
│  ────────────────────────────────────────── │
│  📍 Barcelona, Playa Barceloneta             │
│  📅 15 marzo 2025 · 14:32                    │
│  👤 David · 🏛️ Era ORIGEN                     │
│  🎵 Sonaba: Bicep - Glue (dnb)              │
│  🏷️ playa · atardecer · barcelona            │
│  🎤 Audioguía de Edu (0:42)                  │
│  ────────────────────────────────────────── │
│  Entrada vinculada:                          │
│  ✍️ "Carta desde Barcelona" — Edu            │
│  ────────────────────────────────────────── │
│  Fotos cercanas (mismo día):                 │
│  [foto] [foto] [foto] →                      │
│  ────────────────────────────────────────── │
│  Acciones:                                   │
│  [ver en mapa] [ver en timeline]              │
│  [enviar drop] [editar] [eliminar]           │
└────────────────────────────────────────────┘
```

---

## 🔗 Integración con el ecosistema

| Feature | Cómo se integra |
|---|---|
| **Eras** | Cada Era es una sala de museo. Las fotos heredan el color de la Era. El filtro primario de la galería es la Era activa. |
| **Timeline** | Las fotos añadidas generan eventos en el feed: "📸 Nueva foto en Era ORIGEN". |
| **RECAP** | Las fotos con más interacciones (vistas, compartidas, marcadas) alimentan la portada del RECAP anual. |
| **Cápsulas del Tiempo** | Fotos pertenecientes a cápsulas bloqueadas aparecen en el grid pero **glitcheadas/pixeladas**. Al tocarlas: "⧖ Bloqueado hasta 15 junio 2030." |
| **MusicLab** | Las Eras pasan un `contextPlaylist` invisible al reproductor para la música ambiente del CINEMA. Las fotos referencian el track que sonaba. |
| **Tags** | Tags de contexto (`playa`, `atardecer`, `barcelona`) vs tags de vibe (`dnb`, `romantiqueo`). Ambos enriquecen la galería. EXHIBITION usa ambos para agrupar. |
| **Drops** | Desde el panel de detalle de una foto: "Enviar drop en esta foto" → abre DropCompose con la foto como contexto visual. |
| **Live Sync** | Ambos usuarios pueden sincronizar la vista: "Edu está viendo esta foto" → opción de seguir su navegación. |

---

## 🔴 Edge Cases

| Caso | Comportamiento |
|---|---|
| **Era sin fotos** | "The Empty Room" — paleta de la Era, scanlines, mensaje: *Esta sala aguarda sus memorias.* Sin empty state genérico. Es parte de la estética. |
| **Foto corrupta (404 R2)** | Glitch estético: `[DATOS DAÑADOS / ARTEFACTO PERDIDO]` con ruido de scanlines, como un VHS viejo. Sin icono roto. Ocupa su lugar en el grid con estética cyber-vandal. |
| **Asimetría en DIALOGUE** | Si un usuario no tiene fotos en un período: eco visual en el lado vacío + mensaje poético. Sin culpa. |
| **Cientos de fotos (OOM Android)** | Virtualización agresiva en WALL y CINEMA. Solo se renderizan celdas visibles + buffer de 2 filas. Imágenes con `loading="lazy"` y `decoding="async"`. Thumbnails generados por R2 (variants). |
| **Sin ubicación** | Las fotos sin GPS no aparecen en MAP. No se fuerza una ubicación falsa. |
| **Cápsula bloqueada** | Fotos de cápsulas futuras visibles en el grid pero glitcheadas/pixeladas. No navegables. |
| **Subida de archivos** | Integración con FileUploadService. Pre-signed URL a R2. Al subir, se emite evento a Timeline. |
| **Soporte HEIC/RAW** | Fase A: JPEG, PNG, WebP. Fase C: HEIC, RAW, Live Photos convertidas. |
| **Modo offline** | Fotos cacheadas en Service Worker. Thumbnails siempre disponibles. Full-res bajo demanda. |

---

## 📐 Fases de implementación

### Fase A — Núcleo
- WALL con masonry grid + virtualización + zoom de densidad
- Panel de detalle con metadatos emocionales
- Integración básica con Eras (filtro por Era activa)
- Subida de archivos vía FileUploadService
- Badges de contexto (quién, Era, música)

### Fase B — Modos avanzados
- CINEMA con swipe + música ambiente de Era
- MAP con pines + líneas de viaje
- DIALOGUE (killer feature)
- Capa ambiental (paleta reactiva, reactividad acústica)
- Audioguías (Curator Notes)

### Fase C — Refinamiento
- EXHIBITION con canvas 2D por vibes
- REEL con generación automática + pinning manual
- Live Sync (navegación compartida)
- HEIC/RAW
- Animaciones avanzadas de transición entre modos
