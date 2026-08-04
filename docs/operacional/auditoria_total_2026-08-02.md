# AUDITORÍA TOTAL el-bunker — 2026-08-02 (Fase 1: Hermes)

> Estado: INVENTARIO COMPLETO (Fase 1 del flujo en dos fases, decisión de Edu 2-ago).
> Autor: Hermes. Verificación por artefacto (curl/D1/R2/navegador/build), nunca por informe.
> Fase 2 (Luna): revisión crítica del inventario con criterio de diseño/arquitectura, SOLO lectura de archivos del repo.
> NADA de este documento es un fix: los fixes serán pliegos posteriores uno a uno con OK de Edu.
> Alcance: frontend completo (src/), worker completo (workers/), service worker + PWA, docs.

---

## 0. Verificación de línea base (2-ago, todo por artefacto)

| Check | Resultado | Evidencia |
|---|---|---|
| `npm run build` | OK 2.37s, 22 assets → sw-assets.json | build real |
| `git status` | master = origin/master; 3 untracked residuos (CANON.manifest, extract_messages.ps1, extracted_messages.txt) + ESTADO.md modificado | git |
| Canje clave → JWT | 200, JWT 24h | POST /api/auth/token |
| `GET /api/config` anónimo | solo schema_version + adventures_start_date (sin fugas) | curl |
| `GET /api/eras` con JWT | 2 eras (2021:185, 2022:342) | curl |
| `GET /api/entries?limit=600` | 527 devueltos (fix S151 verificado en vivo) | curl |
| D1: tracks | 1.117 total / 529 vivos (588 soft-deleted) | wrangler --remote |
| D1: files | 528 (527 fotos + 1 huérfana 9c506661 conocida) | wrangler --remote |
| D1: playlists 4, drops 0, cápsulas 0, queue 55, sessions 40, tags 7, track_tags 543, pl_tracks 513 | consistente | wrangler --remote |
| R2: foto | 200 image/jpeg 1.494.466 B | GET directo |
| R2: mp3 | 200 audio/mpeg — PERO Range ignorado (73 MB completos pese a `Range: bytes=0-1023`) | GET con Range |
| Gate R2 sensibles (vault/docs sin token) | 404 (no revela existencia) | GET |
| Login en navegador con clave | OK, sesión access_key, vault + 527 fotos | navegador real |
| LOC total | 20.214 / 82 archivos | script |

---

## 1. Resumen ejecutivo

La app **funciona** (login por clave, vault con 527 fotos, reproductor, persistencia de music lab) pero tiene **un bug P1 que rompe la función central del vault** (crear entradas no persiste), **una deuda masiva de UI** (emojis en el vault, textos en inglés, estado de desarrollo pegado en la interfaz), **cero adaptación a desktop**, y **varias features pedidas que están a medias o muertas** (subir MP3 no sube nada, bibliotecas Drive muertas, ambient sin audio, onOpenEra es un stub). El backend (worker) está sano y bien escrito; el problema está concentrado en el frontend y en la falta de acabado.

---

## 2. HALLAZGOS [BUG]

### BUG-P1-01 — Crear entrada en el VAULT no persiste en D1 (confirmado de punta a punta)
- **Dónde**: `src/vault/Vault.jsx:642-657` (`handleAddEntry` solo hace `patchDb` local + evento de stats local).
- **Contraste**: `handleAddEra` SÍ postea (`Vault.jsx:623`); el patrón correcto existe en `Recaps.jsx:215` (`workerClient.post('/api/entries', ...)`) y el endpoint `POST /api/entries` funciona (`workers/routes/entries.js:132`).
- **Evidencia de artefacto (2-ago, navegador real + D1)**: creada entrada "PRUEBA AUDITORIA 02-08" desde la UI → visible en la sesión → **recarga → desaparece** → D1 sigue en 527 entries, 0 con ese título.
- **Impacto**: cualquier entrada (nota, carta, hito, enlace, gasto...) creada desde la app se pierde al recargar. El vault "solo eras + fotos subidas por script" no puede crecer desde el móvil. Es la función central de una bóveda de memoria.
- **Clase del fallo**: el frontend del vault quedó a medio migrar de Drive (local-first) a Worker API (S115). Music lab sí migró (useMusicActions), el vault no.

### BUG-P1-02 — Añadir track con MP3 no sube el archivo a ninguna parte
- **Dónde**: `src/musiclab/AddTrackForm.jsx:29-32` (`submit()` solo pasa `form`), `src/musiclab/useMusicActions.js:21-29` (`onAddTrack` hace POST /api/tracks **sin r2_key**).
- **Evidencia**: el formulario pide archivo MP3 ("SELECCIONAR MP3...", lee ID3 con jsmediatags en `AddTrackForm.jsx:85-107`) pero el archivo nunca se sube (no hay `uploadFile` en AddTrackForm; el POST no incluye r2_key). El track se crea sin archivo → al reproducir sale el toast "SIN ARCHIVO" (`MusicLab.jsx:163-178`).
- **Impacto**: la feature "AÑADIR CON MP3" (botón principal de añadir música) crea tracks muertos. La subida de música solo funciona por el pipeline de script/PRUEBA.

### BUG-P2-03 — Descripción de era 2022 corrupta en D1 (daño permanente)
- **Dónde**: D1 `eras.description` de la era 2022.
- **Evidencia**: hex real `...6369 EFBFBD 6E20 EFBFBD 2066...` = U+FFFD (carácter de reemplazo) donde debería ir "ó" y "–". Resultado: "PRUEBA de importaci�n � fotos 2022 (ene-ago)" (visible en la app).
- **Causa probable**: el script de importación (o el insert) codificó mal UTF-8. Irrecuperable sin re-insertar la descripción.
- **Clase**: datos, no código. El fix es re-escribir la descripción vía PATCH /api/eras (pliego con OK).

### BUG-P2-04 — Las fechas del vault son de SUBIDA, no del momento real
- **Dónde**: `entries.created_at` = fecha de subida (2-ago-2026 para las 527 fotos). El frontend usa `created_at` para ordenar, agrupar y mostrar (`Vault.jsx:528`, `VaultGallery.jsx:114-116`, `WallView.jsx:58-66`).
- **Evidencia visual**: la era "2021" muestra todas las fotos con fecha "AUG 2" y el rango de sala "jun 2021 → ago 2026". Las fotos Takeout tienen la fecha real en el nombre (IMG_20211213) pero no se extrajo a `content.event_date`.
- **Impacto**: la cronología de la bóveda (timeline, reels por día, "un día como hoy") queda distorsionada: las fotos de 2021 "ocurren" todas el 2-ago-2026.

### BUG-P2-05 — R2 no implementa HTTP Range pese a anunciar `Accept-Ranges: bytes`
- **Dónde**: `workers/routes/r2.js:39-46` (devuelve el body completo; no lee el header Range).
- **Evidencia**: `curl -H "Range: bytes=0-1023"` a un mp3 → 200 con 73 MB completos (debería ser 206 + 1024 B).
- **Impacto**: seek en el reproductor web descarga el archivo entero por cada salto; tracks de 73 MB (los hay: "Silent Hill slowed playlist") saturan la red en móvil. Candidato a explicar lag de escucha.

### BUG-P2-06 — Líneas del boot terminal duplicadas en el login (visual, confirmado en vivo)
- **Dónde**: `src/layout/LoginScreen.jsx:171-183` (el useEffect programa setTimeouts sin cleanup; StrictMode o re-render remonta la animación).
- **Evidencia visual**: cada línea de BOOT_LINES aparece 2-3 veces apilada en la pantalla de login real.

---

## 3. HALLAZGOS [DEUDA-UI]

### DEUDA-UI-01 — Emojis como iconografía del VAULT (la queja explícita de Edu, inventario completo)
Los emojis están por TODA la app, no solo el vault. Inventario por archivo (símbolos decorativos del tema ◈◎⚡♥ = estética Cyber-Vandal, congelada; **emojis de color = deuda**, decisión de Edu):
- **Vault**: `AddEntryForm.jsx:64-154` (75 tipos con 📷🎬🎙🎞📱✎♥⏳📖🔒🙏🌙😂🏷⚖🏥💰💼🎓🔐📜📍✈🗺⭐◆◇🔁⏱🔮📊📚🍳🪣🎁🧾📦🌿📋🕊🧠💚🧭💝🔗📄🎧💬🛠🎨🌈🎵🖼💵🎯📆🛒🕯🎉💍🎄🆘📝🔏🔑🔥🌡📈📧); `CATEGORY_FILTERS` 162-178 (📷✎📄📍⏳📋💚🔗🎨💰🕯🔐📊🔄); `CATEGORY_EXTRA_FIELDS` 31-35 (😊🙂😐🙁😞); badges `Vault.jsx:415-426` (📅📍⭐🔗); `VaultGallery.jsx` (🎵📷👤🎭🌍🏛️📅〰⧖), `WallView.jsx:265,393` (📷), `EntryLightbox.jsx:269,290,360,365` (🎵📷📍📅).
- **Capsules**: `Capsules.jsx:22-23` (🔮📊), `Recaps.jsx:12-14,88-107` (📅🌙🌟📔🎵📝♥🏆✨), `TimeCapsules.jsx:36,147,203,213,231` (🔮📦🔒🔓), `Timeline.jsx:26-35` (▶⏸⏭✎✏✕♥👁⧖✓⌁◈🔮✨♫).
- **Music lab**: `DropsManager.jsx` (⚡💿⏱★), `TrackCard.jsx:56` (⚙), `MusicLab.jsx` (☰⊞❒⇅⌕▴▾).
- **Layout/Login**: `App.jsx:40` (⚠), `BootScreen.jsx:112` (⚠), `Layout.jsx:134,344,375,386,429,532` (♥◉⏸▶◀◀▶▶◢◣), `LoginScreen.jsx:24,29` (✓ + glitch chars).
- **Confirmado en vivo** (2-ago, navegador): barra de filtros del vault = "◈ 527 📷 527 ✎ 📄 📍 ⏳ 📋 💚 🔗 🎨 💰 🕯 🔐 📊 🔄".

### DEUDA-UI-02 — Textos en inglés en una app para pareja española
- StatusBar fecha/reloj en en-US: "AUG 02, 2026" (Layout.jsx:65-71) — confirmado en vivo.
- Fechas de eras: "JUN 2021", "JAN 2022" (Vault.jsx:391, 528).
- Drops: "INCOMING DROP", "PLAY NOW", "LATER" (DropsManager.jsx:97,145,150).
- "pinch ↕ zoom" (WallView.jsx:493), "ALL" (MusicLab.jsx:28), "PLAY" (PlaylistManager.jsx:170), WinampPlayer title="Next"/"Shuffle" (congelado, solo reportar).
- Login: boot lines en inglés ("INITIALIZING SECURE CHANNEL...", "ENCRYPTED · PRIVATE · YOURS ALONE" — LoginScreen.jsx:18-26, 597-601). Estética deliberada, decisión de Edu.

### DEUDA-UI-03 — Sin HUD para navegador/desktop (confirmado por Edu y por artefacto)
- **Evidencia**: solo 8 líneas con breakpoints responsive (md:/lg:/xl:/sm:) en TODO src/ (4 archivos: Card, Button, Vault, Layout). MusicLab (1861 líneas), VaultGallery, Capsules, SmokeSession, login, etc.: cero.
- **Evidencia en vivo**: viewport 1252x619 → contenido 448px (max-w-md) = 36% del ancho usado. La app se ve como un móvil centrado en pantalla de PC.
- **Agravante**: `manifest.json:7` fuerza `orientation: portrait-primary` y `PortraitLockOverlay` (Layout.jsx:405-438) bloquea horizontal en todo. No hay atajos de teclado, ni multi-columna, ni aprovechamiento de espacio.

### DEUDA-UI-04 — Textos de estado de desarrollo pegados en la interfaz
- `VaultGallery.jsx:1108`: "S130-D · Sub-fase 4 · geocoder + entries reales · slider temporal · polylines · 185/185 pines" (pie de mapa).
- `VaultGallery.jsx:1190`: "{MODE} · N elementos" (subtítulo de debug).
- `MusicLab.jsx:1751-1754` y `Vault.jsx:991,1016`: footers "MUSIC LAB v1.0", "THE_VAULT v1.0", "◈ WEB AUDIO API", "◈ ENCRYPTED".
- Texto dramático: "Los protocolos de seguridad han sido activados" (TabShell.jsx:106), "Solo un eco en la sala — David no capturó este momento" (VaultGallery.jsx:371), "— sin eco —" (499).

### DEUDA-UI-05 — prompt() nativo y confirm() en la UI
- `MusicLab.jsx:538` y `853`: `prompt("Nombre para la playlist...")` — diálogo nativo del navegador, feo y bloqueante en móvil (ya hay componente propio PlaylistNameInput que se usa en otro sitio).
- `Vault.jsx:672`: `window.confirm("¿Eliminar esta entrada?...")` — mismo problema (ya hay patrón inline de confirmación en MusicLab).

### DEUDA-UI-06 — Botones icono sin label ni aria-label
- StatusBar: "↺" (recargar) y "⎋" (logout) sin texto ni aria-label (Layout.jsx:149-167). Iconos crípticos.

### DEUDA-UI-07 — Fricción de acceso: boot animado ~2s sin skip en cada apertura
- `LoginScreen.jsx:171-183`: la animación de boot (7 líneas, ~1.9s) bloquea el botón de acceso en cada carga. El acceso test/admin también está detrás.

---

## 4. HALLAZGOS [DEUDA-CODE]

- **DEUDA-CODE-01 — Código muerto de Drive/bibliotecas**: `libraries` SIEMPRE vacío (`VaultContext.jsx:365,387,697`) pero todo el API de bibliotecas sigue expuesto (`addLibrary`/`updateLibrary`/`removeLibrary`/`markLibraryHeartbeat`/`getLibraryContents`/`refreshLibraryCapacity`, `VaultContext.jsx:747-840`) llamando a Drive real. `GoogleDriveService.js:247-306` (listLibraryContents/calculateLibraryUsage/checkLibraryCapacity/getStreamUrl). `drive_file_id` sigue en schema/PATCH (tracks.js:80-97, useMusicActions.js:104).
- **DEUDA-CODE-02 — SW: stubs muertos**: Background Sync (`public/sw.js:262-277`) — nadie registra `bunker-db-sync` ni escucha `BUNKER_SYNC_READY` (0 receptores en src/); comentario interno habla de "Drive API calls" (obsoleto). Push (`sw.js:279-315`) — listener + notificationclick sin suscripción ni backend VAPID (0 `pushManager` en src/).
- **DEUDA-CODE-03 — SW: regla cache-first de audio muerta**: `sw.js:120` cachea `/music/*` pero hay 0 objetos R2 con prefijo music/ (529 en tracks/). Los MP3 caen en stale-while-revalidate y se cachean enteros (73 MB) en el navegador.
- **DEUDA-CODE-04 — 5 residuos `{null}` en JSX** (debris de ediciones): `Vault.jsx:745`, `TagManager.jsx:77`, `Capsules.jsx:73`, `Timeline.jsx:360`, `TimeCapsules.jsx:252`.
- **DEUDA-CODE-05 — onOpenEra es un stub con console.log**: `PageWrappers.jsx:34-36` — "abrir era" no hace nada.
- **DEUDA-CODE-06 — console.* descontrolado**: 126 usos; PlayerContext tiene ~30 console.info con emojis (🔗▶◼❌⛔🔄📡⏮♻⏭) en el flujo normal (congelado, solo reportar). VaultContext ~15. GoogleDriveService ~8.
- **DEUDA-CODE-07 — Chromecast SDK cargado siempre**: `index.html:20` carga cast_sender.js en cada visita aunque el cast solo tiene UI en WinampPlayer (congelado).
- **DEUDA-CODE-08 — Ambient music sin audio**: `VaultGallery.jsx:66-95` (CinemaView) y `635-651` (ReelView) bajan el volumen del reproductor cuando se activa "ambient" — no hay música ambiente real; el toggle solo silencia el reproductor.
- **DEUDA-CODE-09 — Rate limit en memoria del isolate**: `workers/utils/rate-limit.js` (Map por IP) no es global entre isolates; límite 10 req/s por instancia. Aceptable para app privada, documentar.
- **DEUDA-CODE-10 — Archivos untracked en el repo**: `CANON.manifest` (hook externo H7), `extract_messages.ps1` + `extracted_messages.txt` (dump de conversación, 60 KB) — residuos que no deberían estar en el repo.

---

## 5. HALLAZGOS [DEUDA-CODE-REFACTOR] (dimensión pedida por Edu 2-ago)

### REFACTOR-01 — Monolitos (14 archivos >500 líneas, 15.769 LOC de 20.214)
| Archivo | Líneas | Partible en |
|---|---|---|
| `src/musiclab/MusicLab.jsx` | 1860 | 5+ módulos: player section, queue view, tracks view, playlists view, drops view, modales (el patrón ya existe: PlaylistManager/TrackCard/AddTrackForm son módulos propios) |
| `src/core/PlayerContext.jsx` | 1731 | CONGELADO — solo reportar (motor + escucha compartida + chromecast + OOM recovery) |
| `src/vault/VaultGallery.jsx` | 1232 | CinemaView/DialogueView/ExhibitionView/ReelView/MapView → archivos propios (WallView ya se extrajo así) |
| `src/vault/Vault.jsx` | 1026 | EraDetailPanel (441-561), EraCard (302-410), widgets (73-202) → módulos |
| `src/core/VaultContext.jsx` | 984 | auth/boot, db build, bibliotecas (muertas), entradas |
| `src/smoke/SmokeSession.jsx` | 833 | temporizador + historial + notificaciones |
| `src/musiclab/WinampPlayer.jsx` | 791 | CONGELADO |
| `src/layout/Layout.jsx` | 629 | StatusBar/BottomNav/MiniPlayer ya son internos → extraer |
| `src/layout/LoginScreen.jsx` | 622 | boot terminal, access panel, glitch |

### REFACTOR-02 — Duplicación verificada (misma lógica copiada)
- `getImageUrl`: 3 definiciones idénticas (`VaultGallery.jsx:41`, `WallView.jsx:39`, `EntryLightbox.jsx:26`) + lógica inline en popup del mapa (`VaultGallery.jsx:1058`) + variante en `AddEntryForm.jsx:264`. 5 sitios para un cambio de política de URLs.
- `getMediaType`: 2 copias (`VaultGallery.jsx:52`, `EntryLightbox.jsx:39`).
- `CAT_LABEL`/`CAT_ICON`/`ENTRY_CATEGORY`: derivados 3-4 veces (EntryLightbox 20-22, VaultGallery 32-36, WallView 23-25, Vault 28).
- `FONT_MONO`: redefinido localmente en 8 archivos pese a exportarse de tokens.js (MusicLab:23, AddTrackForm:9, DropsManager:4, PlaylistManager:6, TagManager:13, TrackCard:6, WinampPlayer, ColorPicker).
- Patrón bottom-sheet/modal copiado: TrackCard.jsx (2 copias casi idénticas, 68-116 y 190-238), PlaylistManager, MusicLab, DropsManager.
- Estilos inline: 908 apariciones — el mismo botón/borde/glow recalculado en cada archivo en vez de componentes ui/ (Button/Card/Input existen pero no se usan en la mayoría).
- `getStreamUrl` existe DUPLICADO: `FileUploadService.js:60` y `GoogleDriveService.js:285` (con Drive).

### REFACTOR-03 — Candidato de módulo compartido (pliego)
`src/vault/media.js` (o similar): getImageUrl, getMediaType, CAT_LABEL, CAT_ICON, ENTRY_CATEGORY, getUploadFolder, getExtraBadges. Elimina ~60 líneas duplicadas × 4 archivos y centraliza la política de URLs firmadas.

---

## 6. HALLAZGOS [DEUDA-DATA]

- **DEUDA-DATA-01**: descripción era 2022 corrupta (ver BUG-P2-03).
- **DEUDA-DATA-02**: fechas de las 527 fotos = fecha de subida, no del momento (ver BUG-P2-04). Los nombres Takeout/IMG_* contienen la fecha real (no extraída).
- **DEUDA-DATA-03**: `entry_tags` = 0 filas (los tags del vault nunca se usan); `drops` = 0, `time_capsules` = 0, `shared_sessions` = 40 filas acumuladas (sesiones personales auto-creadas).

---

## 7. HALLAZGOS [DOCS]

- **DOCS-01**: `docs/Arquitectura/INDEX.md` — data-flow.md marcado STALE (S150, ADR-028) y el INDEX mismo está en S148: no menciona ADR-028 (S150), la PRUEBA de subida ni el fix S151 (2-ago). Línea 40 dice "pendiente wrangler deploy" cuando el worker ya está desplegado (v afdf7c2c).
- **DOCS-02**: `docs/technical-debt.md` — verificar pliegos TD-1..TD-6 vs estado actual (TD-6 WALL lazy-mount + eras ya cerrado).
- **DOCS-03**: `src/MANUAL_USUARIO_EL_BUNKER.md` — menciona "guardando algo en Drive" (línea 106: "SYNCING ... guardando en Drive") — obsoleto (D1+R2 desde S76).

---

## 8. VERIFICADO — NO HALLAZGO (para que Luna no tropiece)

- `VaultContext.jsx:546` — `Authorization: Bearer ${token}` es CORRECTO: la censura del visualizador muestra "***" (verificado con od/hexdump).
- `auth.js` del worker: JWT HS256 con expiración, whitelist, rate limit, auditoría — correcto.
- `access-keys.js`: SHA-256 + comparación en tiempo constante, sin cortocircuito entre claves — correcto.
- `upload.js`: filename saneado, prefijos validados en POST y PUT — correcto.
- CSP en index.html — correcta y completa.
- `WorkerClient.js`, `FileUploadService.js`, `StatsEngine.js`, `ToastContext.jsx`, `tokens.js` — limpios.

---

## 9. PLAN DE PLIEGOS PRIORIZADO (propuesta; OK de Edu por pliego)

| # | Pliego | Contenido | Prioridad |
|---|---|---|---|
| P1 | **Persistencia vault** | handleAddEntry → POST /api/entries + manejo file_ids + error toast (mismo patrón que useMusicActions/Recaps) | URGENTE (BUG P1) |
| P2 | **Subida MP3 en AddTrackForm** | uploadFile → r2_key → POST /api/tracks con r2_key (mismo flujo que AddEntryForm) | URGENTE (BUG P1) |
| P3 | **HUD desktop** | decisión de Edu primero: (a) layout responsive real (grid/multi-columna en md+), (b) quitar portrait-lock, (c) atajos teclado | ALTA (queja explícita) |
| P4 | **Limpieza UI vault** | emojis de ENTRY_TYPES/CATEGORY_FILTERS/badges → iconos SVG/tema; textos EN → ES; quitar textos de desarrollo (VaultGallery:1108,1190); prompt()/confirm() → componentes propios | ALTA (queja explícita) |
| P5 | **Refactor vault compartido** | src/vault/media.js + extraer Cinema/Dialogue/Exhibition/Reel/Map de VaultGallery; Vault.jsx EraDetailPanel/EraCard | MEDIA |
| P6 | **Refactor MusicLab** | partir monolito 1860 líneas en módulos por tab | MEDIA |
| P7 | **Código muerto** | bibliotecas Drive (VaultContext 747-840 + GoogleDriveService), SW stubs (sync/push/music-prefix), {null} x5, onOpenEra, drive_file_id | MEDIA |
| P8 | **Datos** | re-escribir descripción era 2022; decidir extracción de fechas reales de fotos (event_date desde nombre/EXIF) | MEDIA |
| P9 | **Docs** | resincronizar INDEX.md/technical-debt/MANUAL_USUARIO | BAJA |

Congelados (solo lectura): WinampPlayer.jsx, AudioVisualizer.jsx, motor PlayerContext.jsx, tokens.js, estética — requieren reabrir congelación para cualquier fix (decisión de Edu).

---

## 10. MATERIAL PARA LUNA (Fase 2)

Inventario: este documento.
Archivos a leer (todos en el repo, sin URLs de producción ni credenciales):
- Vault: `src/vault/Vault.jsx`, `VaultGallery.jsx`, `WallView.jsx`, `EntryLightbox.jsx`, `AddEntryForm.jsx`
- Core: `src/core/VaultContext.jsx`, `PlayerContext.jsx`, `WorkerClient.js`, `GoogleDriveService.js`, `tokens.js`
- Music: `src/musiclab/MusicLab.jsx`, `TrackCard.jsx`, `PlaylistManager.jsx`, `AddTrackForm.jsx`, `DropsManager.jsx`, `TagManager.jsx`, `useMusicActions.js`
- Capsules/smoke: `src/capsules/*.jsx`, `src/smoke/SmokeSession.jsx`
- Layout: `src/layout/*.jsx`
- Backend: `workers/worker.js`, `workers/routes/*.js`, `workers/schema.sql`
- SW/PWA: `public/sw.js`, `public/manifest.json`, `index.html`
- Docs: `docs/Arquitectura/INDEX.md`, `docs/technical-debt.md`

Preguntas para el veredicto de Luna: (1) ¿el inventario de emojis/textos es correcto y completo? (2) ¿qué hallazgos faltan? (3) priorización de pliegos, (4) veredicto de estética (jerarquía visual, uso de símbolos vs emojis). El veredicto de Luna se reescribe contra los artefactos de la Fase 1.

---

*Fin del inventario Fase 1. Pendiente: OK de Edu para Fase 2 (sesión manual con Luna) y para cada pliego.*
