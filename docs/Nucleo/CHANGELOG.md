# CHANGELOG — El Búnker

> Registro público de cambios. Una línea por versión.
> Para detalles técnicos completos: docs/sesiones/

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
