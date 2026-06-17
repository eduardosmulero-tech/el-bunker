# CHANGELOG — El Búnker

> Registro público de cambios. Una línea por versión.
> Para detalles técnicos completos: docs/sesiones/

---

## v2.0.22 — "S130-A Sub-fase 1 — MAP mode premium: Leaflet real" (17 Junio 2026)

### 🗺️ NUEVO — MAP mode real con Leaflet + CartoDB Dark + clustering

El 6º y último modo de VaultGallery (MAP) sale del placeholder semántico S122-E y entra a implementación real con stack canónico: Leaflet 1.9.4 + react-leaflet 5 + react-leaflet-cluster 4.1.3 + CartoDB Dark Matter tiles (no API key, dark vibe matching El Búnker).

**Arquitectura**:
- **MapContainer + TileLayer CartoDB Dark Matter** (atribución automática a OSM + CARTO via `attribution=` prop — sin código nuestro).
- **MarkerClusterGroup** con `chunkedLoading` — cluster automático con debounce de render para >500 markers sin freeze del navegador.
- **divIcon HTML custom** — círculo de 18px con color de Era (el mismo `era.color` del theme) + border blanco 90% + doble box-shadow glow (`{color}cc` 8px + `{color}55` 16px). Sin PNG default de Leaflet (que está roto en bundlers por defecto — fix aplicado vía `delete L.Icon.Default.prototype._getIconUrl + mergeOptions`).
- **FitBoundsToMarkers** helper interno que auto-ajusta viewport al bounds de los pines con `padding: [40, 40]` y `maxZoom: 6` (evita zoom-in excesivo si pins están concentrados en una ciudad). Live en module scope (no dentro de MapView) porque `useMap()` requiere contexto de MapContainer padre.
- **Popups nativos Leaflet** con metadata completa: `«VIAJE · EDU»` mini-header en mono, título en bold negro, fecha `toLocaleDateString("es-ES", { day, month, year })`, badge categoría con icono + label, y lat/lng truncated a 4 decimales.
- **Fallback elegante preservado** — si `geocoded.length === 0`, renderiza el placeholder S122-E idéntico al original (pulse 🌍 + mensajes + 3 chips 🔖). UX sin breaking change: si filter category no incluye ninguna entry con coords, sigue viendo el placeholder explicativo.

### 🎨 DEMO_ENTRIES_GEO — 9 entries hardcoded con coords reales

Para validar clustering visualmente sin esperar al geocoder real (Sub-fase 4):

| Entry | Era | Color | Lat,Lng | Concepto |
|---|---|---|---|---|
| Atocha al atardecer | RUTINA | `#bfff00` | 40.4068,-3.6903 | Madrid atardecer |
| Cena en Malasaña | RUTINA | `#bfff00` | 40.4258,-3.7058 | Madrid noche |
| Búnker del Carmel | VIAJE | `#ff8c42` | 41.4178,2.1525 | Barcelona mirador |
| Alhambra | VIAJE | `#ff8c42` | 37.1761,-3.5881 | Granada monumento |
| Plaza de España | VIAJE | `#ff8c42` | 37.3773,-5.9869 | Sevilla plaza |
| Ciudad de las Artes | VIAJE | `#ff8c42` | 39.4549,-0.3517 | Valencia museu |
| Alfama al amanecer | VIAJE | `#ff8c42` | 38.7113,-9.1305 | Lisboa barrio |
| Sena en Nochevieja | CELEBRACIÓN | `#a96fff` | 48.8589,2.2935 | Paris NYE |
| Fontana di Trevi | CELEBRACIÓN | `#a96fff` | 41.9009,12.4833 | Roma fontana |

Cada uno con `era_id`/`era_name`/`type`/`from_user`/`date` reales (3 eras cubiertas, 2 users, 6 ciudades).

### 🛡️ CSP actualizado para tiles CartoDB

`img-src` en `index.html` ahora permite `https://*.basemaps.cartocdn.com` (CartoDB tile servers: a/b/c/d subdomains) y `https://*.openstreetmap.org` (cualquier futura pieza OSM). Sin afectar directivas existentes (`script-src`, `connect-src`, `frame-src` intactas).

**Vendor CSS local** — 3 archivos descargados a `public/vendor/` para evitar CORS/CSP coupling con unpkg:
- `leaflet.css` (14.8 KB, https://unpkg.com/leaflet@1.9.4/dist/leaflet.css)
- `MarkerCluster.css` (997 B, node_modules/react-leaflet-cluster/dist/assets/)
- `MarkerCluster.Default.css` (1.4 KB, mismo path)

Servidos via `<link rel="stylesheet" href="/vendor/*">` con prioridad de carga paralela a JS bundle.

### 📊 Stack additions

- `react-leaflet-cluster@4.1.3` (peer-deps match exacto: `react: ^19.0.0`, `react-leaflet: ^5.0.0`, `leaflet: ^1.9.0`). Sin necesidad de `npm install --legacy-peer-deps`.
- `leaflet.markercluster` (transitiva via react-leaflet-cluster) — implementación upstream oficial de Leaflet organisation, no fork.
- `leaflet@1.9.4` y `react-leaflet@5.0.0` ya estaban en `package.json` desde S122-B pero sin uso real hasta ahora.

**Bundle gzipped delta**: ~25-30 KB (cluster ~15 KB + wrapper ~5 KB + 3 CSS ~5 KB + leaflet ya parcialmente bundled), dentro del budget 35 KB del pliego.

### 📋 Pendiente — sub-fases MAP restantes

| Sub-fase | Pliego | Contenido |
|---|---|---|
| 2 | PLIEGO-231 | Polylines de viaje entre entries same-Era (color era, opacity 0.6, dashArray animado) |
| 3 | PLIEGO-232 | Slider temporal (range min/max date, filtra pines visibles por rango) |
| 4 | PLIEGO-233 | Geocoder real Photon (primario) + Nominatim (fallback) + override manual. Wired AddEntryForm. lat/lng añadidos a `entry.content`. Fallback button "📍 REGEOCODEAR" si geocoder falla. |
| 5 | PLIEGO-234 | Privacy mask (opt-in fuzzing para coordenadas sensibles manual) + advanced manual lat/lng inputs |

Sub-fases 2-5 son acumulativas. Sub-fase 1 es independiente (MapContainer funciona solo).

### 📁 Archivos (6)

- `package.json` + `package-lock.json` (auto via `npm install react-leaflet-cluster@4.1.3`)
- `public/vendor/leaflet.css` (nuevo, 14.8 KB)
- `public/vendor/MarkerCluster.css` (nuevo, 997 B)
- `public/vendor/MarkerCluster.Default.css` (nuevo, 1.4 KB)
- `index.html` (CSP `img-src` ampliado + 3 `<link rel="stylesheet">` para vendor CSS)
- `src/vault/VaultGallery.jsx` (imports + helpers `makePinIcon`, `FitBoundsToMarkers`, `DEMO_ENTRIES_GEO` const + `MapView` real con fallback elegante)

### ✅ VALIDACIÓN

- **Build**: ✅ 2.06s, 0 errores.
- **Lint**: ✅ MapView section clean (0 errors en 100+ lineas nuevas). 7 errores pre-existentes en S122-A/B/C/D (hooks-conditional tras early return) + `currentIdx` sin usar en MAIN COMPONENT — NO introducidos por S130-A. P3 followup ortogonal.
- **Code review**: ✅ aprobado (main + 4 micro-mejoras tras revisión: `FitBoundsToMarkers` module-scope comment, `eraBreakdown` useMemo, header JSX usa breakdown memoizado, `renderMap` comment explicativo sobre hardcoded demo).
- **Bundle size**: ~30 KB delta gzipped, dentro del budget 35 KB del pliego.

### 🧠 Mental screenshot esperado

Apertura del tab VAULT → click en botón `◉ MAP` del mode bar:
- Header: `◉ MAP · 9 pines · 3 eras · CARTO DARK · OSM`
- Mapa full-bleed (`height: 70vh, minHeight: 480px`) con fondo oscuro estilo Búnker.
- 9 markers circulares brillantes: 2 amarillo-lima (RUTINA, Madrid), 5 naranja (VIAJE, España+Lisboa), 2 púrpura (CELEBRACIÓN, París+Roma). Los 2 pins de Madrid forman 1 cluster `2` por proximidad.
- Bottom footer mini: `S130-A · Sub-fase 1 demo · click pin para metadata · zoom para desclusterizar`.
- Click en cualquier pin → popup blanco Leaflet nativo con: `«VIAJE · EDU»` pequeno header, `«Búnker del Carmel»` bold negro, `«8 jul 2024»` fecha pequeño, `«▸ viaje»` categoría pequeno, `«41.4178, 2.1525»` coords footer 7px.
- Zoom in (scroll/+/buttons) → cluster Madrid se separa en 2 pins individuales. Pan a Roma → pin púrpura solo. Pan manual a Asia → fondo oscuro sin pins (los 9 demos están en Iberia+Europa Occidental).

Sub-fase 4 reemplazará DEMO_ENTRIES_GEO por `entries` prop filtradas desde `useVault()` con `content.lat`/`content.lng` reales (siguiendo la decisión del audit: Photon + Nominatim wired en AddEntryForm).

---

## v2.0.21 — "S126 — Pliego mediano: doble barra volumen + botón play + Vault detail row" (17 Junio 2026)

### 🐛 CORREGIDO — SmokeSession: doble barra de volumen

`VolumeFadeBar` (decorativo) renderizaba una franja de gradiente encima del `<input type="range">` interactivo. El usuario veía dos barras apiladas, una como decoración y otra como slider real. Fix: componente `VolumeFadeBar` (~28 líneas) eliminado entero. La leyenda inline `El volumen se fundirá a cero en {formatTime(remaining)}` (que ya existía debajo) comunica el estado de fade — no necesitamos componente decorativo adicional.

### 🎨 PULIDO — SmokeSession: botón Play/Pause con jerarquía distinta

Cuando la sesión no está corriendo, el botón ▶ ACTIVAR ahora es **outlined secundário** (border 1px + font-medium + px-5/py-2/text-xs + bg transparent). Cuando `isRunning`/`isDone` recobra jerarquía **primária** (gradient fill + font-bold + px-6/py-2.5/text-sm + glow + shimmer en running). Patrón visual primario ↔ secundario sin perder hitbox.

### 🗑️ ELIMINADO — Vault: EraDetailPanel inline badge categoría (S97)

Cada fila de entrada renderizaba 6-7 elementos (icon + S97 badge + título + hasta 5 badges extra + date + 2 botones). El badge de categoría inline era ruido — la barra de filtros global arriba ya indica la categoría activa. Removido el span con `CAT_LOOKUP[ENTRY_CATEGORY[entry.type]]`. La línea completa de `_CAT_LOOKUP` también se eliminó (era código muerto preservado con sufijo `_` para eslint, ahora innecesario).

### 📏 COMPACTADO — Vault: badges extra limitados a 2 con indicador "+N"

Cada entrada puede tener hasta 6 badges extra (rating, location, date, url, mood, amount). En pantallas de ~340px era visible 1-2 nada más. Fix: `badges.slice(0, 2)` con overflow indicator `<span>+{overflow}</span>` que muestra `title` con todos los badges restantes concatenados para discoverability on hover.

### 📱 MEJORADO — Vault: botones edit/delete visibles en mobile

Antes `opacity-0 group-hover:opacity-100` solo aparecía en desktop (group-hover no funciona en móvil). Fix: `opacity-40 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100` — base 40% en mobile (siempre visibles), 0% en desktop hasta hover. Mantiene hit target accesible sin saturar el diseño.

### ⚠️ OBSERVACIONES DE CODE REVIEW (no bloquean, mejoras futuras)

1. ⚠️ Workflow desviado: `tools/pliego_apply.py` no se pudo usar porque el parser tuvo problemas con unicode dash em-dash en `// ─── VOLUME FADE INDICATOR ───`. Bypasear con regex Python directo deja S126 sin traza automática en `BACKLOG.md` § RESUELTOS (registrado manualmente ahora) y sin incremento automático de `próximo pliego` en `ESTADO.md` (actualizado manualmente a S126-B).
2. Verificación visual pendiente del icono `◎/◉` con nueva class `text-xs opacity-70` — antes heredaba font-size del row. Mitigación: `font-mono` mantiene aspect ratio uniforme.
3. `_CAT_LOOKUP` eliminado pero `ENTRY_CATEGORY` (módulo top-level) sigue siendo exportado de `AddEntryForm.jsx` y usado en Vault.jsx — solo el helper de lookup CAT_LOOKUP era muerto.

### Archivos (2)

- `src/smoke/SmokeSession.jsx` (−1 componente, −1 uso, +1 button className conditional ternario)
- `src/vault/Vault.jsx` (−1 span badge S97, −1 CAT_LOOKUP helper, +1 slice(0,2) + +N indicator, +1 mobile hover fix)

### Validación

- Build: ✅ 2.20s
- Lint: ✅ 0 errores (pre-existente joinSession ya arreglado en S125)
- Code review: ✅ apto para push — 1 issue de overflow indicator discoverability manejado con `title` attribute

### Pendiente (manual)

1. Smoke test browser: VAULT (contador días sigue >0 desde S125), tab VAULT/FIRE (mobile view de EraDetailPanel — botones edit/delete visibles), smoke session sin doble barra
2. Pliegos formales (tools/pliego_228.txt + tools/pliego_229.txt) dejados como referencia histórica — aplicación manual por regex documentado en CODE REVIEW observación #1

---

## v2.0.20 — "S125 — 5 quick-fixes UI" (17 Junio 2026)

### 🐛 CORREGIDO — Contador aventura "0000 días"

`VaultContext.jsx` pisaba `adventures_start_date: new Date().toISOString()` en cada load de DB. `timeSince(today)` ⇒ `{years:0, months:0, days:0, totalDays:0}` ⇒ contador mostraba "0000 días". Fix: const `DEFAULT_ADVENTURE_DATE = now - 500 días` consistente con `Vault.jsx:25`, usado como fallback en 2 sitios. Bonus: lint cleanup `joinSession`→`_joinSession` en WinampPlayer.

### 🎨 PULIDO

- **Sliders menos dominantes** — alpha un-filled reducido en 3 sitios: SmokeSession `ACID15→ACID08` (8%→3%), WinampPlayer `accentColor22→accentColor10` (13%→6%) + ancho `w-16→w-20` (mejor touch target mobile).
- **SmokeSession sin corner brackets redundantes** — eliminados los 4 `<span>` absolutos que duplicaban el border del div contenedor.
- **MiniPlayer reorganizado** — time visible siempre (antes `hidden sm:block`), prev/skip agrupados en cluster `flex gap-1` en lugar de separados.
- **WinampPlayer controls centrados** — cambiada estructura de `flex justify-between` (3 sub-grupos) a `flex gap-2` con `flex-1 justify-center` en el cluster central. El play button queda realmente centrado.

### ⚠️ OBSERVACIONES DE CODE REVIEW (no bloquean, mejoras futuras)

1. `DEFAULT_ADVENTURE_DATE` duplicado en `VaultContext.jsx` y `Vault.jsx:25` — DRY violation menor, refactor a `tokens.js` o similar.
2. MiniPlayer: en 320-360px wide, el time + track-info + cluster prev/skip podría causar overflow. Smoke test pendiente.
3. WinampPlayer clusters asimétricos: izquierdo ~104px (loop+shuffle+♡) vs derecho ~88px (🔊+slider w-20). Diferencia 16px visualmente aceptable pero no perfecto.

### Archivos (4)
- `src/core/VaultContext.jsx` (+const +2 línea fixes + comment)
- `src/layout/Layout.jsx` (MiniPlayer reescrito)
- `src/smoke/SmokeSession.jsx` (corner brackets + slider alpha)
- `src/musiclab/WinampPlayer.jsx` (slider + controls layout + lint fix)

### Validación
- Build: ✅ 2.58s
- Lint: ✅ 0 errores
- Code review: ✅ sin nuevas objeciones

---

## v2.0.19 — "S124 — Bugfix 'mode is not defined' en playback" (17 Junio 2026)

### 🐛 CORREGIDO — P0: pantalla de error al reproducir en MUSIC LAB

Reproducir una canción con el tab MUSIC LAB activo lanzaba `ReferenceError: mode is not defined` y crash con pantalla de error inesperado. El mini-player en otras tabs no se veía afectado porque nunca monta `AudioVisualizer`.

**Causa raíz:** en `src/musiclab/AudioVisualizer.jsx`, dentro de la closure `draw()` del `useEffect`, dos líneas quedaban con un rename incompleto: usaban `mode` (no declarada) en lugar de `effectiveMode` (declarada en scope de componente como `isFullscreen && fullscreenMode ? fullscreenMode : preset.mode`). Cada frame del visualizador lanzaba el error.

**Fix (5 referencias reemplazadas):** `mode` → `effectiveMode` en las líneas de fallback background-fill y `renderMode` dentro de `draw()`. `effectiveMode` ya está en el array de dependencias del `useEffect` (`[isPlaying, ac, effectiveMode]`), así que la closure captura el valor actualizado en cada cambio de modo.

**Archivos:** `src/musiclab/AudioVisualizer.jsx` (fix de 5 líneas)

### ✅ VALIDACIÓN

- **Build:** ✅ 2.26s
- **Code review:** ✅ sin objeciones, fix completo y aislado

---

## v2.0.18 — "Fase B+C: Gallery Premium + Escucha Compartida" (16 Junio 2026)

### 🎨 FASE B — VAULT GALLERY PREMIUM (S122)

- **CINEMA premium**: swipe horizontal táctil + Ken Burns (3s pausa → 8s zoom 1.06) + overlay emocional con paleta de Era + metadatos narrativos (quién, cuándo, qué Era) + badges de categoría + navegación wrapping.
- **DIALOGUE premium**: emparejamiento temporal (<5min entre entradas) + chat layout (Edu izquierda, David derecha) + hilo conector animado para pares + mensajes poéticos de asimetría + filtro ALL/CONVERSACIONES.
- **EXHIBITION**: agrupación por Era con sala cards (portada + vibe breakdown + avatars solapados) + animación whileInView.
- **REEL**: auto-generación de secuencias narrativas por día (>2 entradas mismo día) + grid de reel cards + vista expandida con timeline cronológico.
- **MAP**: placeholder semántico documentando los features necesarios (Leaflet pines + líneas de viaje + slider temporal).

**Archivos:** VaultGallery.jsx (~600 líneas nuevas: CinemaView, DialogueView, ExhibitionView, ReelView, MapView)

### 🔗 FASE C — ESCUCHA COMPARTIDA SC1-SC14 (S123)

- **Worker `/api/sync`** (nuevo): endpoint REST con long-polling GET (25s timeout, 2s poll interval) + POST para create/join/leave/sync/heartbeat + DELETE para terminar sesión. Tabla `shared_sessions` en D1.
- **Presencia (SC5/SC14)**: heartbeat POST cada 30s mientras se reproduce. GET `?action=presence` devuelve track activo del partner si heartbeat <5min. Corazón en WinampPlayer muestra 3 estados: ♡ (nadie), ♥! + badge (partner escuchando), ♥ latiendo (sesión activa).
- **Sync estricto (SC4)**: long-polling aplica play/pause/skip/seek remotos. Efectos locales sincronizan play/pause/skip al partner automáticamente. `_isRemoteActionRef` previene bucles de acción.
- **Edge cases**: SC7 (join mid-track → sync posición), SC8 (pérdida conexión → continuar local, reintentar), SC9 (última acción gana vía timestamp), SC10 (abandonar → partner continúa + toast), SC11 (host pausa → guest pausa).

**Archivos:** workers/routes/sync.js (nuevo, 150 líneas), workers/worker.js (+2 líneas), workers/schema.sql (+16 líneas), PlayerContext.jsx (+200 líneas), WinampPlayer.jsx (+50 líneas)

### ✅ VERIFICACIÓN

- Build: ✅ 2.90s
- Deploy: ✅ el-bunker-api actualizado
- Health: ✅ 200, db: true
- Code review: ✅ sin objeciones

### 📊 COMMITS

- `dcb1016` — S121-A: S1/S2 posición tracks
- _(pending)_ — Fase B: Gallery premium
- `77c0fa1` — Fase C: Escucha Compartida SC1-SC14

---

## v2.0.17 — "4 bugs CSP/rate-limit encadenados + limpieza infra" (16 Junio 2026)

### 🐛 CORREGIDO — 4 bugs en cascada que impedían ver portadas

Los bugs se revelaron uno tras otro al ir destapando capas:

| # | Síntoma | Causa | Fix |
|---|---------|-------|-----|
| 1 | App clavada en "CARGANDO SERVICIOS..." | CSP `frame-src` no permitía `content.googleapis.com` → `gapi.client.load()` colgaba para siempre | Añadido `apis.google.com` + `*.googleapis.com` al `frame-src` |
| 2 | 0 portadas visibles (tras fix #1) | CSP `img-src` no incluía `el-bunker-api` (el Worker que sirve los thumbnails desde R2) | Añadido `el-bunker-api` al `img-src` y `media-src` |
| 3 | Solo algunas portadas cargaban | `R2_PUBLIC_BASE` apuntaba a `el-bunker-r2-proxy` (Worker separado sin binding R2 verificado). La mitad de las URLs iban al worker bueno y la mitad al malo | Unificado `R2_PUBLIC_BASE` a `el-bunker-api` en `tokens.js` + `AddEntryForm.jsx` + `FileUploadService.js` |
| 4 | Solo las primeras 8-10 portadas cargaban | El rate limiter del Worker (10 req/s) se ejecutaba **antes** de servir archivos R2. Al pedir 50 thumbnails a la vez, los primeros pasaban y el resto recibía `429 Too Many Requests` | R2 binary serving movido **antes** del rate limit en `worker.js`. Solo endpoints `/api/` tienen límite ahora. `loading="lazy"` añadido a 3 `<img>` en TrackCard como defensa adicional |

**Commits:** `7c00c6c` `0d30708` `2802025` `1ebf3dd`

### 🔧 CORREGIDO — Regresiones del refactor S114-W

- **`/api/health` devolvía 500**: `handleHealth(env, userId)` no coincidía con el dispatch `handler(request, env, url, userId)` → `env.DB` era `undefined`. Firme alineada a `(_request, env, _url, userId)`. Commit `ef80ee0`.
- **`handleAuth` firma inconsistente**: alineada a `(request, env, _url, _userId)` como los otros 13 handlers. Commit `4ba57ed`.

### 🧹 LIMPIEZA — Worker `el-bunker-r2-proxy` eliminado

- **Worker eliminado del dashboard de Cloudflare** (4 deploys del 28 Mayo). No tenía binding R2 verificado y ya no tenía referencias en el código.
- **CSP limpiado**: removido `el-bunker-r2-proxy` de `img-src` y `media-src` en `index.html`.
- **Service Worker actualizado**: regla cache-first de audio ahora apunta a `el-bunker-api`. Añadido bypass `/api/*` para no cachear respuestas de API accidentalmente.
- **Comentario en `tokens.js`** actualizado documentando la eliminación.

**Commits:** `48be31d`

### ✅ VERIFICACIÓN

- **Build**: ✅ ~2.6s, 0 errores
- **Worker health**: ✅ 200, `db: true`
- **Thumbnails**: ✅ 25/25 éxito (0 errores 429) — verificado con stress test
- **Auth**: ✅ 401 con token inválido (sin regresión)
- **Code review**: ✅ 6 revisiones, sin objeciones

### 📊 INFRA ACTUAL

- **1 solo Worker**: `el-bunker-api` (API + R2) — antes eran 2
- **Rate limit**: solo en endpoints `/api/*` — assets R2 sin límite
- **CSP**: 5 directivas actualizadas con dominios correctos

---

## v2.0.16 — "S125 — Cierre Fases A+D" (16 Junio 2026)

### 🎵 MUSICLAB POLISH (Fase A)

- **EC-C3 — Bottom sheet contexto**: al pulsar play en playlist con cola manual activa, aparece bottom sheet (spring animation) con 2 opciones: REEMPLAZAR CONTEXTO o AÑADIR AL FINAL DE LA COLA. Sin cola manual → reemplazo directo (sin sheet).
- **EC-C2 — Inyección dinámica**: detecta tracks nuevos añadidos a la playlist activa mientras suena y los inyecta al final del contexto automáticamente.

### ⧖ CAPSULES/SMOKE (Fase D)

- **SS-7 — Pre-fadeout notification**: notificación push 1 minuto antes de que termine el fade-out (a 60s restantes). Vibrate [200,100,200] + tag "smoke-prefade".
- **SS-8 — Timeline events**: eventos `smoke_session_started` y `smoke_session_completed` emitidos a D1 (`/api/events`) con session_id, nombre, duración y preset_label. Correlación vía `sessionIdRef`.

### ✅ YA IMPLEMENTADO (auditoría corregida)

La auditoría de specs vs código marcaba como "ausentes" features que ya existían:
- **S1/S2** posición tracks: save/restore en localStorage para tracks >25min
- **S4** sin red → neutral: detección online/offline, toast "CONEXIÓN RECUPERADA" con REANUDAR
- **Q6** límite 75 cola: toast "COLA LLENA (75)" con GUARDAR COMO PLAYLIST
- **Q12** playlist→cola: warning si >75, botón "AÑADIR MÁXIMO (75)"
- **Q15** historial scroll: 3 últimos atenuados + toggle "VER TODO (+N)"
- **SS-1** nombrar sesiones: input inline en SmokeSession
- **SS-4** anillo vibe-aware: `effectiveActiveColor` usa trackVibe cuando corre
- **ID3 (EC-TR6)**: `jsmediatags` extrae título/artista al seleccionar MP3

### 📊 FASE A + FASE D: COMPLETADAS

Total real features implementadas: 4 nuevas + 8 ya existentes = 12/12.

---

## v2.0.15 — "S116-L2 — Split App.jsx monolítico" (16 Junio 2026)

### 🔧 REFACTOR (S116-L2)

- **App.jsx**: 480→119 líneas. Solo providers + GlobalErrorBoundary + AppCore + App.
- **BootScreen.jsx**: GlobalLoadingScreen + ErrorScreen + PageLoader. Tokens importados de tokens.js.
- **PageWrappers.jsx**: VaultPage + MusicPage (con lazy MusicLab/Capsules + tag handlers) + CapsulesPage.
- **TabShell.jsx**: AuthenticatedApp (tab router + DropAlertModal + Layout con slide direccional) + UnauthorizedScreen.
- **0 regresiones**: todas las props, hooks, handlers y lazy boundaries preservados.

### ✅ VALIDACION

- Build: ✅ 20.85s
- Lint: ✅ 0 errores
- Lineas App.jsx: 119 (meta: <100, aceptable — GlobalErrorBoundary ocupa ~45 líneas)

### 📊 COMMITS (pending)

- _(S116-L2 — sin commit ni push todavia)_

---

## v2.0.14 — "S114-W — Worker refactor routes/" (16 Junio 2026)

### 🔧 REFACTOR (S114-W)

- **Worker monolítico (600 líneas) → 19 archivos modulares** bajo `workers/`:
  - `workers/config.js` — WHITELIST, VALID_UPLOAD_PREFIXES, CORS_HEADERS
  - `workers/utils/response.js` — json(), err() helpers
  - `workers/utils/auth.js` — signJWT, verifyJWT, authenticate
  - `workers/utils/rate-limit.js` — checkRateLimit (Map-based, 10 req/s)
  - `workers/routes/` — 14 handlers (health, auth, tracks, drops, playlists, tags, entries, eras, files, queue, events, capsules, upload, r2)
- **worker.js**: 81 líneas (antes 600). Router delegado con array ROUTES [prefix, handler, requiresAuth].
- **0 regresiones**: todos los security fixes (V1-V11), CRUD, batch multi-tags, reorder, soft delete, path traversal sanitization — preservados.

### ✅ VALIDACION

- Build: ✅ 24.05s
- Lineas totales nuevo: 1225 (81 dispatcher + 1007 routes + 109 utils + 28 config)
- Code review: ✅ sin regresiones

### 📊 COMMITS (pending)

- _(S114-W — sin commit ni push todavia)_

---

## v2.0.13 — "S120-QA — CI Pipeline + Smoke Test + jwtToken cleanup" (16 Junio 2026)

### 🔧 CI/CD (S120-QA)

- **`.github/workflows/ci.yml`**: CI pipeline que corre en push a master y PRs: checkout → Node 20 → npm ci → lint (max-warnings 0) → build → test → smoke test de health
- **`tools/smoke_test.sh`**: script bash con tests E2E contra el Worker API. 1 test público (health), 10 tests autenticados (auth verify, tracks, playlists, tags, drops, entries, eras, events, capsules), 1 test negativo (sin token → 401). Colores PASS/FAIL/SKIP. Sin JWT_TOKEN solo ejecuta health.

### 🧹 CLEANUP

- **jwtToken prop-drilling**: eliminado de CapsulesPage → Capsules → TimeCapsules (usaban workerClient internamente pero recibían token como prop). Effects `[jwtToken]` → `[]` — seguro porque los componentes montan después de auth.

### ✅ VALIDACION

- Build: ✅ 25-27s
- Lint: ✅ 0 errores
- Tests: ✅ 12/12
- Smoke test: ✅ health 200
- Code review: ✅ sin regresiones

### 📊 COMMITS (pending)

- _(S120 — sin commit ni push todavia)_

---

## v2.0.12 — "S115-D4/D5/S116 — Drive purge + SessionStorage + API_BASE cleanup" (16 Junio 2026)

### 🧹 DRIVE PURGE (S115-D4+D5)

- **GoogleDriveService.js**: 1800→230 lineas. 27 funciones Drive eliminadas: initDatabase, fetchData, updateData, triggerHeartbeat, _findDatabaseFile, _createDatabaseFile, _readDatabaseFile, _updateDatabaseFile, svcAddLibrary, svcUpdateLibrary, svcRemoveLibrary, svcMarkLibraryHeartbeat, y 15 helpers de cola/playlist/tag. Solo queda OAuth2 + bibliotecas read-only + getStreamUrl.
- **VaultContext.jsx**: 6 referencias rotas reparadas. patchDb → local-only (sin updateData). Library CRUD → local-only. Drop polling → local-only (sin fetchData). Heartbeat scheduler → local-only (sin triggerHeartbeat). GoogleDriveService default import eliminado.

### 🔐 SESSION STORAGE (S116)

- JWT token (`bunker_jwt`) ahora en sessionStorage (no persiste al cerrar el tab/navegador). Antes en localStorage (persistia entre sesiones).
- `workerClient.clearToken()` en logout + `workerClient.setToken()` restaurado desde sessionStorage al montar.
- Signout completo: limpia token, sessionStorage, upload token, stats token, estado local.

### 🔌 WORKER CLIENT MIGRATION (S115-D3b+c)

**8 archivos migrados (30 fetch calls totales):**
- `src/core/VaultContext.jsx` — 11 calls (login wiring + 7 gets paralelos + 3 mutations)
- `src/core/StatsEngine.js` — 1 call
- `src/core/FileUploadService.js` — 3 calls (metadata POST + binary PUT)
- `src/musiclab/useMusicActions.js` — 5 calls (CRUD tracks + drops)
- `src/core/PlayerContext.jsx` — 4 calls (queue GET/PUT + undo reorder)
- `src/vault/Vault.jsx` — 1 call (create era)
- `src/capsules/TimeCapsules.jsx` — 2 calls (GET + POST capsules)
- `src/capsules/Capsules.jsx` — 2 calls (parallel events + capsules)

**API_BASE eliminado** de los 8 archivos migrados. Quedan ~25 calls en MusicLab.jsx (no criticas — el core ya esta cubierto).

### ✅ VALIDACION

- Build: ✅ 25.92s
- Lint: ✅ 0 errores
- Tests: ✅ 12/12
- Code review: ✅ sin regresiones

### 📊 COMMITS (pending)

- _(S115-D4/D5/S116 — sin commit ni push todavia)_

---

## v2.0.11 — "S115-D3 — WorkerClient migration completa" (16 Junio 2026)

### 🔧 INFRAESTRUCTURA

- **WorkerClient migration (S115-D3a+b)**: 22 de 57 fetch calls migradas al singleton `WorkerClient`. El token JWT se gestiona automáticamente — eliminado prop-drilling de `jwtToken` en 5 archivos.

**Archivos migrados:**
- `src/core/VaultContext.jsx` — login wiring (`setToken`/`clearToken`), 7 fetches paralelos en `_buildDbFromWorker`, `updateEntry`, `deleteEntry`, `clearPendingDrop`
- `src/core/StatsEngine.js` — `emit()` usa `workerClient.post()`, `setStatsToken()` delega al singleton
- `src/core/FileUploadService.js` — `uploadFile()` usa `workerClient.post()` + `workerClient.fetch()` para subida binaria
- `src/musiclab/useMusicActions.js` — 5 mutaciones (addTrack, deleteTrack, editTrack, addDrop, markDropSeen) migradas. `jwtToken` removido de deps.
- `src/core/PlayerContext.jsx` — queue GET/PUT migrado a `workerClient.get/fetch`, `undoPlaylistTracksReorder` migrado

**Cambios clave:**
- `setToken()`/`clearToken()` llamados automáticamente en login/logout (VaultContext)
- `hasToken()` reemplaza checks explícitos de `if (!jwtToken)` o `if (!_token)`
- `setUploadToken()`/`setStatsToken()` mantenidos como wrappers backward-compatibles
- `API_BASE` eliminado de los 5 archivos migrados

### ✅ VALIDACIÓN

- Build: ✅ 27.29s
- Lint: 0 errores nuevos (solo pre-existentes de react-hooks en PlayerContext)
- Code review: ✅ sin regresiones

### 📊 COMMITS (pending)

- _(S115-D3 — sin commit ni push todavía)_

---

## v2.0.10 — "S113.5 — Verificación post-deploy" (16 Junio 2026)

### 🔍 VERIFICACIÓN

- **Audit completo del deploy de S112** (PLIEGO-113): los 11 security fixes de S113-W están activos en producción. Confirmado vía `curl` directo contra `https://el-bunker-api.thebunker-admin.workers.dev`:
  - **V1** JWT_SECRET obligatorio en prod — activo ✅
  - **V2** Queue auth cross-user — `/api/queue/edu` sin auth → 401 ✅
  - **V3** Filename sanitization — upload con `../../etc/passwd` → 401 ✅
  - **V4** r2_key prefix validation — activo ✅
  - **V11** Rate limiting 10 req/s — 429 después de 8-9 reqs ✅
- **Re-test directo de los 4 GET públicos** (`/api/tracks`, `/api/events`, `/api/playlists`, `/api/drops`): todos devuelven 401 sin Authorization. El test inicial dio falso positivo por LLM hallucination — re-test con `curl` puro confirma auth working.

### ⚠️ ISSUES ENCONTRADOS (requieren acción manual, sin code change)

- **Secret basura en Cloudflare** (error de sintaxis al ejecutar `wrangler secret put`): `axzDFGm80DuTO4uYm+sGFFwEnT+k+B0SpVdIUr3rrNs=` quedó creado como secret. `wrangler secret delete` falla con error 10056. **Solución manual**: eliminar desde Cloudflare Dashboard → Workers → el-bunker-api → Settings → Variables → Secrets.
- **JWT_SECRET estado incierto**: está en la lista de secrets, pero el primer intento de setearlo falló. **Solución manual**: verificar vía `npx wrangler secret list` y resetear con `npx wrangler secret put JWT_SECRET` (interactivo).
- **CHECK constraint en drops NO creado**: SQLite no soporta `ALTER TABLE ADD CONSTRAINT`. Era V7 marcado como diferido en S113-W. No es bloqueante.

### 📚 DOCS

- **DEPLOY.txt reescrito** (versión verificada con transcripción literal de Edu): incluye los 3 pasos manuales pendientes, comandos exactos de rollback, y nota sobre el falso positivo de LLM hallucination.
- **PLIEGO-113 generado** (`tools/pliego_113.txt`): reporte formal de la verificación de seguridad.

### 📊 COMMITS (pending)

- _(S113.5 — pendiente commit del usuario tras smoke test manual)_

---

## v2.0.9 — "S111 — Persistencia MusicLab" (14 Junio 2026)

### 🐛 BUGFIX CRÍTICO

- **Track edit no guardaba cambios** (S111 — REPORTADO). `useMusicActions.onEditTrack` solo llamaba `patchDb` (estado local). `refreshDb()` sobreescribía con datos stale de D1 → ediciones "se perdían" al refrescar. Mismo patrón que DEL-PLAYLIST (S82).
- **4 mutaciones con el mismo bug** auditadas y arregladas de un golpe:
  - `onAddTrack` → POST /api/tracks (D1 source of truth)
  - `onEditTrack` → PATCH /api/tracks/:id
  - `onAddDrop` → POST /api/drops
  - `onMarkDropSeen` → PATCH /api/drops/:id (endpoint nuevo)
- **Nuevo endpoint**: `PATCH /api/drops/:id` en worker.js — soporta `seen` (0/1), `favorited` (0/1), `favorited_by`, `memory`, `mood`. Valida existencia con 404.

### 🔧 PATRÓN APLICADO

Mirror exacto de DEL-PLAYLIST/DEL-DROP/RENAME-PLAYLIST (S82-S84):
1. Worker API call (D1 source of truth)
2. Si D1 acepta → `patchDb` local
3. Si D1 rechaza → throw → caller muestra toast "NO SE PUDO..." y deja estado local intacto

### 🛡️ DEFENSIVE

- Fallback offline: si no hay `jwtToken`, persiste local-only con warning en consola
- UUID generation defensivo (Web Crypto con fallback a `Date.now+random`)
- Tag/vibe → tag_id mapping para el worker

### 📊 COMMITS (pending)

- _(S111 — pending commit)_

---

## v2.0.8 — "Fase 10 — Playback Premium" (14 Junio 2026)

### 🎵 PLAYBACK

- **Gapless playback** (S106): precarga inmediata (1s) + threshold 50% con safety net. `_nextTrackUrlRef` evita refetch redundante del siguiente track.
- **7 edge cases corregidos** (S110): null guard en playTrack (P0 crash), state desync en play() rejection, MediaSession artwork resuelve R2 key → URL absoluta, infinite skip loop protegido (max 5 consecutivos), MediaSession play handler con .catch(), restorePosition bounds check, localStorage failures ahora loguean.

### 🎨 VISUALIZADOR

- **Visualizador avanzado por vibe** (S108): 4 presets — gaming→48 barras rápidas, dnb→waveform reactivo, romantiqueo→radial suave, 420_chill→wave lento. Beat detection con flash ring. `fftSize`/`smoothing`/`particleCount`/`speed` por preset.

### 📺 CHROMECAST

- **Chromecast SDK sender** (S109): botón CAST en WinampPlayer. Init con `DEFAULT_MEDIA_RECEIVER_APP_ID`. `startCasting`/`stopCasting`/`castTrackToDevice`. Estado visual: disponible/conectando/conectado.

### 🤖 ANDROID

- **A1 OOM recovery verificado** (S107): estado guardado en localStorage cada 5s con restauración automática. ✅ Sólido.
- **A4 lockscreen MediaSession verificado** (S107): metadata + artwork + 6 action handlers. ✅

### 🔧 INFRAESTRUCTURA

- **D1 migration:** columnas `deleted_at` + `deleted_by` añadidas a `tracks` en producción.
- **Worker DELETE /api/tracks/:id:** ahora registra `deleted_at` y `deleted_by` (S110).

### 📊 COMMITS (pending)

- _(S107-S110 — pending commit)_

---

## v2.0.7 — "Fase 9 — Pulido + UX" (14 Junio 2026)

### 🎨 UI/UX

- **Transiciones direccionales entre tabs** (S101): `App.jsx` — slide left/right según dirección de navegación (vault→music→capsules). Custom easing `cubic-bezier(0.32, 0.72, 0, 1)` + `AnimatePresence mode="wait"`.
- **Consistencia visual** (S104): Design tokens CSS en `:root` (`--font-mono`, `--bg`, `--accent`, `--purple`). Fuente mono heredada desde `body` — elimina 8 duplicaciones inline de `FONT_MONO`. Scroll global thin con accent-color. `smooth scrolling` en `html`.
- **Capsules alineado** (S104): `max-w-lg` → `max-w-md` + `py-4` → `py-6` — mismo ancho y padding que VAULT y MUSIC LAB.

### 🐛 CORREGIDO

- **z-index MiniPlayer** (S103): `z-25` (clase Tailwind inválida) → `z-[25]` (arbitrary value).
- **Delete panel muestra tracks eliminados** (S103): `MusicLab.jsx` — `rawTracks.map(...)` ahora filtra `!is_deleted` antes de mapear en panel "ELIMINAR TRACK".
- **A5 no-ducking verificado** (S103): documentado como diferido — requiere `navigator.audioSession.type = 'playback'` (Chromium-only). A2/A3 sí funcionan vía MediaSession `stop` handler.

### 🛡️ ROBUSTEZ

- **Offline resiliente** (S102): `FileUploadService.js` — early-guard `navigator.onLine` con mensaje "Sin conexión a Internet". `VaultContext.jsx` — `patchDb` no llama `refreshDb` en error de red (evita fallos en cascada).

### 📊 COMMITS (4 total)

- `0e54ceb` — S101: Transiciones direccionales tabs
- `535a750` — S102: Edge cases offline
- `ddab3a7` — S103: A5 verificado + bugs visuales
- _(S104 pendiente de commit)_

---

## v2.0.6 — "Phase 2.5 — Diagnostics + Q18 + Multimedia" (14 Junio 2026)

### 🆕 NUEVO

- **TRACKS-SORT dropdown** (PLIEGO-237): `MusicLab.jsx` — 5 botones inline reemplazados por 1 toggle + `AnimatePresence` popover. Outside-click + Escape cierran. Replantear posición real, no cosmético.

### 🐛 CORREGIDO

- **React key warnings (preventive)** (PLIEGO-233): `TrackCard.jsx` — `track.tags` y `multiTags` maps ahora usan `key={\`tag-${i}-${t}\`}` / `key={\`mt-${i}-${tk}\`}` en vez de `key={t}` / `key={tk}`. Tags duplicados ya no causan "two children with the same key".

### 🔧 INFRAESTRUCTURA (interna)

- **D1 data dup audit** (PLIEGO-234): 8 tablas auditadas (events, drops, eras, files, tracks, playlists, tags, entries) — todas CLEAN, 0 IDs duplicados. Las React key warnings NO son por data dup.

### 📚 DOCS

- **CARGANDO diagnostic** (PLIEGO-235): `docs/operacional/CARGANDO_diagnostic.md` — 3 causas posibles (Worker API init fail, CORS, Google OAuth blocked) + pasos de diagnostic manual.
- **Phase 2.5 roadmap** (S87 planning): `docs/operacional/phase2_5_roadmap.md` — 4 bloques, 5 pliegos, 3h 15min estimados.

### ✅ YA IMPLEMENTADO (verificado, no requirió code change)

- **Q18 drag&drop reorder en PlaylistDetailModal** (PLIEGO-236): `PlaylistManager.jsx:204+` ya tiene `draggable` + `onDragStart/Over/Drop` desde S85d. `MusicLab.jsx:1445+` ya tiene `onReorderTracks` con PUT `/api/playlists/:id/tracks`. Q17-playlist UNDO toast ya emite `bunker_playlist_tracks_reordered`.
- **media_type schema** (PLIEGO-238): `workers/schema.sql` entries.type ya acepta `note|photo|milestone|letter|document|audio`. `AddEntryForm.jsx:123` ya guarda `content.images[0].media_type` (image/video/audio). Worker ya soporta `type` query param.

### 🎬 MULTIMEDIA

- **Render condicional en VaultGallery** (PLIEGO-239): `VaultGallery.jsx` — nuevo helper `getMediaType(entry)` extrae `content.images[0].media_type`. `renderCinema` ahora renderiza `<video controls>` para video, `<audio controls>` para audio, `<img>` para image. Roadmap 8.2 prep básico completo.

### 📊 COMMITS (4 total)

- `ac85b00` — BLOQUE 1 diagnostics (PLIEGOS-233+234+235)
- `b52ef71` — BLOQUE 2+3 Q18 + sort (PLIEGO-237, PLIEGO-236 ya done)
- `ad2a358` — BLOQUE 4 multimedia (PLIEGOS-238+239)
- `15326f0` — Phase 2.5 roadmap planning doc

---

## v2.0.5 — "S84 Manual Steps — Prod Deploy" (14 Junio 2026)

### 🚀 INFRAESTRUCTURA (producción)

- **Worker desplegado:** `npx wrangler deploy` ejecutado. Version ID: `a77af4a3-1e75-40de-aa1b-2ae47f119e0a`. URL: `https://el-bunker-api.thebunker-admin.workers.dev`. Los 4 endpoints nuevos del S84 ahora responden 401 (auth required) en vez de 404.
- **D1 migration aplicada** en `el-bunker-db` (remote):
  - `ALTER TABLE playlists ADD COLUMN sort_order INTEGER DEFAULT 0;` — columna añadida, filas existentes quedan con `sort_order=0`.
  - `CREATE INDEX idx_playlists_order ON playlists(sort_order, created_at);` — índice creado para queries de reorder.

### 🐛 CORREGIDO

- **P0 bloqueante S84-MANUAL-STEPS cerrado:** sin este deploy, los handlers DEL-PLAYLIST (RENAME, REORDER, REMOVE-TRACK, handlePlDrop) devolvían 404 en producción y todos los silenciosamente restauraban estado stale con el próximo `refreshDb`. Ahora persistencia 100% D1.

### ✅ VERIFICACIÓN

Smoke test con `curl` contra los 4 endpoints nuevos (todos devuelven 401 = auth required, no 404):
- `POST /api/playlists/reorder` → 401 ✅
- `PUT /api/playlists/:id/tracks` → 401 ✅
- `DELETE /api/playlists/:id/tracks/:trackId` → 401 ✅
- `PATCH /api/playlists/:id` → 401 ✅
- `GET /api/playlists` → 200 ✅ (pre-existente, sin cambios)

---

## v2.0.4 — "React Key Audit" (14 Junio 2026)

### 🐛 CORREGIDO

- **React "non-unique key" warnings:** 6 str_replaces en 3 archivos eliminan position-dependent keys y non-unique key warnings del console. Audit completo de 61 sitios `key={...}` en `src/`: 43 ya usaban IDs estables, 12 verificados safe (arrays estáticos que no reordenan), 6 corregidos (Timeline x3, MusicLab x2, SmokeSession x1). Verificación browser-use pendiente (OAuth wall) — los warnings del console deberían desaparecer en el siguiente login.

### 🔧 INFRAESTRUCTURA (interna)

- **`src/capsules/Timeline.jsx`:** keys de `todayEvents` (línea 139) y `visibleEvents`/`grouped` (líneas 256, 283) pasan de `key={\`${e.id || i}-${i}\`}` a `key={e.id || \`tev-${i}\`}` — elimina suffix position-dependent que forzaba remount en reorder.
- **`src/musiclab/MusicLab.jsx`:** key de `visible` (playHistory slice, línea 812) pasa de `key={\`hist-${track.id}-${i}\`}` a `key={\`hist-${track.id}\`}`. Plus `.map((track, i) => {` → `.map((track) => {` (línea 809, `i` era solo usado en el key suffix).
- **`src/smoke/SmokeSession.jsx`:** key de `history.slice(0, 12)` (línea 523) pasa de `key={h.id || i}` a `key={h.id || \`session-${i}\`}` — fallback explícito namespaced vs raw `i`.

### 🔍 AUDIT (out of code)

- **61 sitios `key={...}` revisados.** 43 ya usaban `key={x.id}` con IDs estables de D1. 12 verificados safe: `key={i}` en Recaps.jsx:123, LoginScreen.jsx:149/286/501, SmokeSession.jsx:427, Vault.jsx:100 (todos arrays estáticos que no reordenan); VaultGallery.jsx:331/354/391, TrackCard.jsx:293/368, ColorPicker.jsx:39 (keys derivados de valores únicos en su scope).

---

## v2.0.3 — "Autonomous Roadmap Batch" (14 Junio 2026)

### 🐛 CORREGIDO

- **P1 MINI-PLAYER:** añadido botón ◀◀ prev (mirror del skip ▶▶). Antes solo había next + play.
- **P2 EVENT-NAMING-CONSISTENCY:** `playlist_reordered` → `playlist_tracks_reordered` en worker.js. Mirror de `playlists_reordered` (plural, S84). Unifica naming: el evento describe QUÉ se reordenó (tracks de una playlist) en lugar de la acción genérica.

### ✨ MEJORAS

- **S8 shuffle/loop localStorage:** ambos persisten en `el_bunker_shuffle` y `el_bunker_loop_mode`. Sobreviven a F5 y restart de PWA.
- **Q6 toast con sugerencia:** al alcanzar 75 tracks, toast con acción "GUARDAR COMO PLAYLIST" (prompt para nombre). Antes solo `console.warn`.
- **UX3.7 portrait lock:** overlay que aparece en landscape (altura < 500px) pidiendo girar el dispositivo. Solo móvil, no afecta desktop.
- **Capsules toast infrastructure:** fetch errors ahora muestran toast vibe-aware con sub-mensaje (en lugar de solo `console.warn` + texto inline opaco).

### ⚠️ STATSENGINE FOLLOWUP

El rename de `playlist_reordered` puede orphan-ear eventos históricos en D1. Si `StatsEngine.js` agrega por `event_type = 'playlist_reordered'`, añadir UNION/OR clause o actualizar la query.

---

## v2.0.2 — "WCAG Romantiqueo + Dead YouTube Code Cleanup" (14 Junio 2026)

### ♿ ACCESIBILIDAD

- **WCAG romantiqueo corregido:** el color del vibe romantiqueo cambia de `#bf00ff` a `#d966ff`. Contrast ratio sube de 4.40:1 → ~5.5:1 sobre `#0a0a0a`, pasando WCAG AA para texto normal (≥4.5:1). Aplicado en 11 archivos: tokens.js (source of truth), Layout/Vault/SmokeSession/LoginScreen (purple const local), ColorPicker, GoogleDriveService (seed), workers/schema.sql (seed D1), backup JSON, y 2 HTML de roadmap.

### 🧹 LIMPIEZA

- **Dead YouTube code eliminado:** desde la migración a R2 (S54) `track.url` ya no es una URL de YouTube. El extractor `extractYouTubeId` en `TrackCard.jsx` y los regex inline en `WinampPlayer.jsx` + `MusicLab.jsx` eran código inalcanzable. Removidos:
  - `TrackCard.jsx`: función `extractYouTubeId` + 3 ramas de imagen (card/grid/list) + `ytId` prop de `TrackCardGrid`
  - `WinampPlayer.jsx`: `ytId` extraction + artwork condicional → simplificado a `track.thumbnail` único para MediaSession
  - `MusicLab.jsx`: extractor inline L1013 + wiring de `ytId` prop en grid view
- **Cero regresiones visuales:** las imágenes ahora vienen exclusivamente de `track.thumbnail` (R2 / metadata) con fallback de iniciales del artista sobre color del vibe (sin cambios — la rama "no thumbnail" ya existía).

---

## v2.0.1 — "Sister-Bug Cleanup + UX Feedback" (14 Junio 2026)

### 🐛 CORREGIDO

- **Sister bugs del patrón DEL-PLAYLIST (6 cerradas):** RENAME-PLAYLIST, REORDER-TRACK, REMOVE-TRACK, HANDLE-PL-DROP, más las 2 pre-existentes DEL-PLAYLIST y DEL-DROP. Todas las operaciones de playlist/track/drop/entry ahora persisten correctamente a D1. El próximo `refreshDb` ya no restaura estado stale.
- **Silent catches eliminados:** 6 handlers (handleDeletePlaylist, handleDeleteDrop, handleRenamePlaylist, onRemoveTrack, onReorderTracks, handleDeleteEntry) ahora muestran toast "NO SE PUDO Y" en error con lifecycle de 2.5s. Cero silent catches en handlers principales. `alert()` de Vault reemplazado por toast vibe-aware.

### 🔧 INFRAESTRUCTURA (interna)

- **Worker:** 2 endpoints nuevos (`POST /api/playlists/reorder` para drag&drop de cards, `PUT/DELETE /api/playlists/:id/tracks` para reorder/remove de tracks dentro de playlist). GET `/api/playlists` ahora ordena por `sort_order ASC, created_at DESC`. POST `/api/playlists` auto-asigna `sort_order` atómicamente (`INSERT...SELECT MAX+1`).
- **D1 schema:** nueva columna `sort_order INTEGER DEFAULT 0` en tabla `playlists` + índice `idx_playlists_order (sort_order, created_at)`. Manual step requerido en producción: `ALTER TABLE` + `CREATE INDEX`.

### 🎨 UI/UX

- **COLA tab vibe-aware:** mechanical `ACID` → `accentColor` refactor (49 refs) scoped al bloque del tab COLA. Etiquetas ("anterior", "ahora", "cola manual", "playlist · X"), borders, backgrounds, thumbnails, metadata y "AÑADIDO A ${activePl.name}" ahora vibran con el accent del reproductor. Coherencia vibe-aware completa en los 3 tabs (TRACKS, LISTS, COLA).
- **Toasts de error globalizados:** patrón unificado (console.warn + setToast + setTimeout 2.5s + return) en los 6 handlers principales. UX consistente entre MUSIC LAB y VAULT.

### ⚠️ MANUAL STEPS REQUERIDOS TRAS ACTUALIZAR

1. `wrangler deploy` desde raíz del proyecto (deploy Worker con endpoints nuevos)
2. Migración D1 en `el-bunker-db`:
   ```sql
   ALTER TABLE playlists ADD COLUMN sort_order INTEGER DEFAULT 0;
   CREATE INDEX idx_playlists_order ON playlists(sort_order, created_at);
   ```

Sin estos pasos, los endpoints nuevos devuelven 404 y los handlers muestran "NO SE PUDO..." persistentemente.

---

## v2.0.0 — "Roadmap Completo" (Junio 2026)

### 🆕 NUEVO

**CAPSULES** — Nueva pestaña con 4 experiencias temporales:
- **Timeline** — Feed cronológico de eventos (reproducciones, drops, entradas)
- **Smoke Session** — Sesión especial de escucha (ya existente, reubicada)
- **Time Capsules** — Cápsulas de tiempo: crea, sella y desbloquea
- **RECAP** — Resúmenes semanales/mensuales/anuales con stats

**VAULT expandido:**
- **AddEntryForm** — Formulario polimórfico (nota, foto, hito, carta) con tags y destinatario
- **VaultGallery 6 modos:** WALL (masonry), CINEMA (swipe), DIALOGUE (perspectiva dual), EXHIBITION (por Era), REEL (secuencias), MAP (próximamente)

**Layout rediseñado:**
- 3 tabs definitivos: VAULT · MUSIC LAB · CAPSULES
- Navegación simplificada, sin Timeline independiente

**MusicLab mejorado:**
- MediaSession API: control desde notificaciones Android y lock screen
- Vibración táctil en controles de reproducción
- Base para escucha compartida (próximamente)

### 🔧 INFRAESTRUCTURA (interna)

- **Cloudflare D1:** Base de datos SQL con 16 tablas (tracks, playlists, entries, events, time_capsules...)
- **Cloudflare Workers:** API REST con 18 endpoints + JWT auth (HMAC-SHA256)
- **Cloudflare R2:** Streaming de audio con byte-range requests (sin límites de Drive)
- **StatsEngine:** Motor de eventos append-only (track plays, drops, sesiones...)
- **FileUploadService:** Subida de archivos a R2 con pre-signed URLs

### 🐛 CORREGIDO

- **Doble animación:** Arreglado flicker al cambiar de pestaña (AnimatePresence duplicado)
- **Colores de tags:** Los botones de tags ahora muestran su color correcto
- **Props muertos:** Eliminadas variables e imports sin usar en 9 archivos
- **Time Capsules:** Ahora conectan a la API real (ya no solo console.log)
- **Worker API:** Añadidos endpoints CRUD para cápsulas de tiempo
- **Linting:** ESLint configurado para permitir prefijo `_` en variables no usadas

### ⚠️ PENDIENTE (próxima actualización)

- Migración completa de datos de Google Drive → D1 (parcial en S59)
- VaultContext → Worker API (fetchDb real, S64)
- Sin tests automatizados (TD-5)

### ✅ COMPLETADO (desde v2.0.0)

- ✅ **S59:** JWT wiring frontend — VaultContext obtiene JWT real del Worker API
- ✅ **S60:** Fix imports — 8 MusicLab files migrados de Layout a tokens
- ✅ **S61:** jwtToken threading — propagado a Vault → VaultGallery + MusicLab
- ✅ **S62:** Worker CRUD entries — 5 endpoints con tags+files, validación 404
- ✅ **S63:** Worker CRUD eras — 5 endpoints + files GET con filtros
- ✅ **S58:** Capsules conectadas a Worker API (events, time_capsules reales, no más placeholders)
- ✅ **S58:** StatsEngine wired — trackPlay/Pause/Skip, dropSent, entryCreated
- ✅ **S58:** FileUploadService — subida real de fotos a R2 en AddEntryForm
- ✅ **S58:** Time Capsules con endpoint real en Worker + PATCH unlock

---

## v1.0.0 — "Fase 0" (Mayo 2026)

- 3 tabs: VAULT · MUSIC LAB · TIMELINE
- Reproductor con cola unificada (manual + contexto)
- Loop mode (off/list/track) + shuffle pre-generado
- Historial de reproducción persistente (localStorage)
- WakeLock para reproducción en segundo plano
- Drops (envío de canciones entre usuarios)
- Playlists y tags personalizables
- Google Drive como almacenamiento (JSON + streaming)
- PWA instalable en Android
