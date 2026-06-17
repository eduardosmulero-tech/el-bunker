# SESION.md — El Búnker

> Dispatcher del sistema. Leer primero.
> Actualizar al cerrar cada sesión.

## S130-A — SUB-FASE 1: MAP MODE PREMIUM (17 Junio 2026)

### Hallazgos
1. **MAP placeholder semántico en VaultGallery** — S122-E dejó texto hardcodeado "Las entradas necesitan coordenadas..." sin integración Leaflet real. Auditoría real confirmó ~0% implementación, 0/9 features completas.

### Implementación (Sub-fase 1)
1. **react-leaflet-cluster instalado** — `react-leaflet-cluster@4.1.3` (peer-deps match exacto: react-leaflet 5.0.0 + leaflet 1.9.4 + React 19.2.6 + Vite 8) sin necesidad de `--legacy-peer-deps`.
2. **3 CSS files en `public/vendor/`** — Leaflet 14.8 KB + MarkerCluster 997 B + MarkerCluster.Default 1.4 KB. Descargados localmente desde `unpkg.com/leaflet@1.9.4/dist/leaflet.css` + copiados desde `node_modules/react-leaflet-cluster/dist/assets/` — evita CORS/CSP issues con unpkg.
3. **CSP actualizado en `index.html`** — `*.basemaps.cartocdn.com` y `*.openstreetmap.org` añadidos a `img-src`. +3 `<link rel="stylesheet">` en `<head>` apuntando a `/vendor/*`.
4. **MapView real en VaultGallery.jsx** — `MapContainer` (center Madrid fallback zoom 4) + `TileLayer` CartoDB Dark Matter (sin API key, dark vibe matching Búnker, attribution OSM+CARTO) + `MarkerClusterGroup` con `chunkedLoading` (≥500 markers OK) + `divIcon` HTML coloreado por Era con doble glow (búnker aesthetic) + `FitBoundsToMarkers` (auto-fit bounds padding 40px maxZoom 6) + Popups nativos Leaflet con metadata completa (era · from_user · title · date · type · coords mini-bottom) + fallback elegante al placeholder S122-E cuando 0 coords.
5. **DEMO_ENTRIES_GEO const** — 9 entries hardcoded con coords reales: Madrid (Atocha+Malasaña, RUTINA amarillo), BCN/GR/SV/VLC/LIS (VIAJE naranja), PAR/ROM (CELEBRACIÓN púrpura). Permite validar clustering visualmente sin esperar a Sub-fase 4 (geocoder real).
6. **L.Icon.Default prototype fix** — workaround estándar para bundlers (`delete _getIconUrl + mergeOptions`). No afecta a otros componentes actualmente pero deja la puerta abierta para futuros.

### Validación
- **Build**: ✅ 2.06s
- **Lint**: ✅ sección MapView clean. 7 errores pre-existentes en S122-A/B/C/D (hooks-conditional) + `currentIdx` sin usar en MAIN COMPONENT — NO introducidos por S130-A, P3 followup ortogonal.
- **Code review**: ✅ aprobado (main + 4 micro-mejoras post-review).
- **Browser smoke test**: pendiente manual. Mental screenshot esperado: mapa oscuro estilo Búnker, 9 pines circulares brillantes con colores de Era, 1-2 clusters automáticos donde hay pins cercanos (Madrid: 2 → 1 cluster), auto-fit bounds a Iberia+Europa Occidental, popup clickable con metadata emocional.

### Archivos modificados (6)
- `package.json` y `package-lock.json` — `react-leaflet-cluster@4.1.3` instalado.
- `public/vendor/leaflet.css` (nuevo, 14.8 KB)
- `public/vendor/MarkerCluster.css` (nuevo, 997 B)
- `public/vendor/MarkerCluster.Default.css` (nuevo, 1.4 KB)
- `index.html` — CSP ampliado + 3 link tags.
- `src/vault/VaultGallery.jsx` — imports (MapContainer, TileLayer, Marker, Popup, useMap, MarkerClusterGroup, L) + helpers (makePinIcon, DEMO_ENTRIES_GEO, FitBoundsToMarkers) + MapView real con fallback elegante.

### Pendiente (manual)
1. Smoke test browser (especialmente mobile <400px para tap-on-pin UX).
2. **PLIEGO-231** — Sub-fase 2: polylines de viaje entre entries same-Era (line color era, opacity 0.6, dashArray animado).
3. **PLIEGO-232** — Sub-fase 3: slider temporal (range con min/max date, filtra pines visibles por rango).
4. **PLIEGO-233** — Sub-fase 4: geocoder real Photon (primario) + Nominatim (fallback) + override manual, wired AddEntryForm, lat/lng añadidos a `entry.content`. Reemplaza DEMO_ENTRIES_GEO por `entries` prop con coords reales.
5. **PLIEGO-234** — Sub-fase 5: privacy mask + advanced manual coords.
6. **Fase 1 restantes (PLIEGO-235+)**: EXHIBITION canvas 2D, REEL auto-play+mapa+banda sonora, CINEMA audioguías+música Era — independiente de MAP.

### Workflow note
Pliego formal generado (`tools/pliego_230.txt`) por documentación del proc. Implementación aplicada vía Python regex con anclajes únicos (mismo bypass pragmático que S126 — unicode em-dash issue con `tools/pliego_apply.py`). Architectura aprobada previamente en conversación (3 turnos antes): Photon geocoder, CartoDB Dark tiles, clustering react-leaflet-cluster, Attrib OSM+CARTO incluido.

---

## S126 — PLIEGO MEDIANO: 6 FIXES UI (17 Junio 2026)

### Hallazgos (3)

1. **Doble barra de volumen en SmokeSession** — `VolumeFadeBar` (decorativo, ~28 líneas) renderizaba una franja de gradiente encima del `<input type="range">` interactivo. El usuario veía dos barras apiladas, una decorativa y la otra como slider real.
2. **Botón ▶ ACTIVAR siempre prominente** — Aunque cambia label entre estados (▶ ACTIVAR / ⏸ PAUSAR / ◈ NUEVO), siempre está renderizado con fondo brillante (gradient + font-bold + glow + shimmer). Cuando la sesión ya está corriendo el botón grande se siente redundante.
3. **Vault detail row muy cargada** — Cada fila en `EraDetailPanel` renderizaba 6-7 elementos (icon + S97 badge categoría + título + hasta 5 badges extra + date + 2 botones). En pantallas de ~340px wide, la densidad hacía ilegible la información esencial.

### Fixes (6)

1. **SmokeSession.jsx** — Eliminado el componente `VolumeFadeBar` entero (28 líneas). La leyenda inline `El volumen se fundirá a cero en {formatTime(remaining)}` ya existía debajo y aporta más valor (timer en vivo).
2. **SmokeSession.jsx** — Eliminado `<VolumeFadeBar volume={...} isFading={...} />` del render (5 líneas). Comentario inline S126 añadido.
3. **SmokeSession.jsx** — Botón Play/Pause con jerarquía distinta: cuando `!running/+!done` es **outlined secundário** (border 1px + font-medium + px-5/py-2/text-xs + bg transparent). Cuando `isRunning/isDone` recobra **primária** (gradient fill + font-bold + px-6/py-2.5/text-sm + glow + shimmer). ClassName dinámico con conditional ternary.
4. **Vault.jsx** — Eliminado el span S97 badge categoría inline del row (3 líneas). El filtro global arriba ya indica la categoría activa — el badge duplicaba ruido. Icono `◎/◉` ahora con `text-xs opacity-70`.
5. **Vault.jsx** — `badges.map(...)` → `visible.map(...)` con `visible = badges.slice(0, 2)` + `<span>+{overflow}</span>` cuando hay >2. Title attribute con todos los badges restantes concatenados para discoverability on hover.
6. **Vault.jsx** — Botones edit/delete ahora `opacity-40 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100`. Visible mobile siempre (base 40%), desktop solo en group-hover. Mobile-friendly sin saturar desktop.

### Bonus cleanup

- **Vault.jsx** — Eliminado `CAT_LOOKUP → _CAT_LOOKUP → undefined` por lint (`/^_/u` convention). Era código muerto preservado con sufijo `_` para satisfy eslint; al no usarse nunca tras quitar S97, lo correcto era eliminar la línea entera (~1 línea).

### Validación

- **Build**: ✅ 2.20s
- **Lint**: ✅ 0 errores
- **Code review**: ✅ apto para push
- **Browser**: pendiente smoke test (Volumen único en smoke session, botón outlined al inicio, row Vault no saturado en mobile)

### Archivos modificados (2)

- `src/smoke/SmokeSession.jsx` (−1 componente −1 uso +1 className conditional)
- `src/vault/Vault.jsx` (−1 span S97 −1 helper CAT_LOOKUP +1 slice(0,2)+indicator +1 mobile hover)

### Workflow note

`tools/pliego_apply.py` no se pudo aplicar por incompatibilidad unicode (em-dash en `// ─── ... ───`). Bypasear con regex Python directo es decisión pragmática. Pliegos formales (tools/pliego_228.txt + tools/pliego_229.txt) dejados como referencia histórica. BACKLOG/ESTADO actualizados manualmente.

### Pendiente (manual)

1. Smoke test browser (especialmente mobile <400px para Vault detail row buttons)
2. Continuar con Fase 1 — MAP (S130-A) modo gallery premium

---

## S125 — 5 QUICK-FIXES UI (17 Junio 2026)

### Hallazgos
1. **AdventureCounter en 0** — `VaultContext.jsx` pisaba `adventures_start_date: new Date().toISOString()` en cada load → `timeSince(today)` = 0 días, contador mostraba "0000 días".
2. **Sliders con barra visible** — `<input type="range">` con `background: linear-gradient(...)` dibujaba el track completo con alpha 22 (~13%) y 15 (~8%) → barras dominantes.
3. **Corner brackets redundantes en SmokeSession** — 4 `<span>` absolutos duplicaban el border del div contenedor.
4. **MiniPlayer (Layout.jsx) buttons separados y faltantes** — time era `hidden sm:block` (invisible en mobile), prev/skip sueltos al final con gap 2.5.
5. **Winamp controls descentrados** — `flex justify-between` con 3 sub-grupos desiguales no garantizaba centrado real del play button.

### Fixes
1. **VaultContext.jsx** — Añadido `DEFAULT_ADVENTURE_DATE = new Date(Date.now() - 500 * 86400000).toISOString()` (consistente con Vault.jsx L25). Reemplazadas las 2 sobreescrituras con NOW. Bonus: lint cleanup `joinSession` → `_joinSession`.
2. **SmokeSession.jsx slider** — `ACID15` → `ACID08` (un-filled alpha 8%→3%).
3. **WinampPlayer.jsx vol slider** — `w-16` → `w-20` (touch target más grande en mobile) + un-filled alpha 22→10 (~6%).
4. **SmokeSession.jsx corner brackets** — Eliminados los 4 `<span>` (BorderAbsolute). El border del div contenedor ya delimita visualmente.
5. **Layout.jsx MiniPlayer** — `time` ya no es `hidden sm:block`. Prev/skip agrupados en `<div class="flex items-center gap-1">`. Gap outer reducido de 2.5 → 2.
6. **WinampPlayer.jsx controls** — Cambiado `flex justify-between` → `flex gap-2` con `flex-1 flex items-center justify-center` en el cluster central (prev+play+next+⚡+⊕). El play queda realmente centrado, los clusters laterales `flex-none`.

### Validación
- Build: ✅ 2.58s
- Lint: ✅ 0 errores
- Code review: ✅ sin nuevas objeciones; flags de mejora: (a) consolidar `DEFAULT_ADVENTURE_DATE` en single source of truth, (b) probar MiniPlayer en 320-360px para confirmar no overflow, (c) cluster derecho vs izquierdo en Winamp ligeramente asimétricos (16px).

### Archivos modificados (4)
- `src/core/VaultContext.jsx` (+const +2 líneas)
- `src/layout/Layout.jsx` (MiniPlayer reescrito)
- `src/smoke/SmokeSession.jsx` (corner brackets + slider alpha)
- `src/musiclab/WinampPlayer.jsx` (slider + controls layout + lint fix)

### Pendiente (manual)
1. Commit + push
2. Smoke test browser: VAULT (contador días >0), tab VAULT/CAPSULES (MiniPlayer), tab MUSIC LAB (visualizer + slider)

---

## S124 — BUGFIX MODE NOT DEFINED EN PLAYBACK (17 Junio 2026)

### Síntoma
Reproducir canción en tab MUSIC LAB → "MODE IS NO DEFINED" + pantalla error inesperado.
Mini player en otras tabs no afectado.

### Causa raíz
`src/musiclab/AudioVisualizer.jsx`: dentro del `draw()` (closure de `useEffect`) se referenciaba `mode` standalone — variable nunca declarada. El scope del componente expone `effectiveMode` (definido L67 como `isFullscreen && fullscreenMode ? fullscreenMode : preset.mode`), pero las dos líneas internas del `draw()` quedaron rezagadas tras un rename incompleto introducido en el commit de los 6 modos del visualizador.

### Fix
Reemplazar `mode` por `effectiveMode` en las 5 referencias dentro del `draw()` (L364 y L370 antes del fix):
- `if (mode === "wave" || mode === "radial")` → `effectiveMode`
- `const renderMode = (mode === "vinyl" || mode === "tunnel") && isSmall ? "bars" : mode` → usando `effectiveMode`

`effectiveMode` ya está en el array de dependencias del `useEffect` (`[isPlaying, ac, effectiveMode]`) → la closure siempre ve el valor actualizado.

### Validación
- Build: ✅ 2.26s, 0 errores
- Code review: ✅ sin objeciones, fix completo y aislado

---

## S116-L2 — SPLIT APP.JSX MONOLÍTICO (16 Junio 2026)

### Extracciones
- **BootScreen.jsx**: GlobalLoadingScreen + ErrorScreen + PageLoader. Tokens (ACID/BG/FONT) importados de `../tokens` en vez de redefinidos localmente.
- **PageWrappers.jsx**: VaultPage, MusicPage (con lazy + tag handlers), CapsulesPage. Code splitting preservado.
- **TabShell.jsx**: AuthenticatedApp (tab router + DropAlertModal + Layout + slide direccional) + UnauthorizedScreen.
- **App.jsx**: 480→119 líneas. Solo providers + GlobalErrorBoundary + AppCore + App.

### Validación
- Build: ✅ 20.85s
- Lint: ✅ 0 errores
- Code review: ✅ sin regresiones

### Archivos creados/modificados (4)
- `src/layout/BootScreen.jsx` (nuevo, ~120 líneas)
- `src/layout/PageWrappers.jsx` (nuevo, ~130 líneas)
- `src/layout/TabShell.jsx` (nuevo, ~105 líneas)
- `src/layout/App.jsx` (reescrito, 119 líneas)

### Pendiente (manual)
1. Commit + push: `git add -A && git commit -m "refactor: S116-L2 — split App.jsx 480→119 lines (BootScreen + PageWrappers + TabShell)"`
2. `npx wrangler deploy` (worker refactorizado)
3. Smoke test completo

### Lo que queda del roadmap
- S117-T1/T2: Auditoría completa de tokens + migración (3h)
- S118-P1-P4: Gallery premium modes (12h)
