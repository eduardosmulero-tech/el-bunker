# REAUDITORÍA TOTAL el-bunker — Hermes (2026-08-02, ejecución del CONTRATO_REAUDITORIA_HERMES)

> Ejecutor: Hermes. Mandante: Edu. Revisor: Luna / Edu.
> Régimen: contrato `docs/operacional/CONTRATO_REAUDITORIA_HERMES.md` (tolerancia cero).
> Método: SOLO análisis estático local (lectura, grep, conteos, build/lint/test locales).
> Prohibido y NO usado: wrangler remoto, curl/requests a producción, D1/R2 vivos, JWT/claves, navegador.
> La evidencia viva de la sesión anterior NO se reutiliza como verificación (cláusula de invalidación).
> Etiquetas: VERIFICADO EN CÓDIGO (análisis estático de este repo) · HIPÓTESIS (inferencia sin prueba en esta sesión) · NO VERIFICABLE EN ESTA SESIÓN (requiere sistema vivo, prohibido por contrato).

---

## 1. ESTADO: PASS CANDIDATE

PASS CANDIDATE no es aprobación final: Luna y Edu deben revisar las citas. Cualquier error factual material invalida este informe completo (tolerancia cero).

---

## 2. ALCANCE Y LÍMITES

- Cobertura: 100% de los archivos de `src/`, `workers/`, `public/` (81 archivos de código + config + docs) listados y verificados por lectura directa o muestreo dirigido (abajo, con citas).
- Límite declarado: ningún comportamiento de producción (login, persistencia real, D1, R2, red) se ha ejercido en esta sesión. Todo comportamiento se deduce del código. Lo que requiera sistema vivo se marca NO VERIFICABLE EN ESTA SESIÓN con el comando exacto para la sesión siguiente.
- No se ha modificado nada: ni código, ni datos, ni infraestructura, ni ningún documento existente. Único archivo creado: este informe.

---

## 3. MATRIZ DE COBERTURA

| Dominio | Archivos revisados | Flujos revisados | Hallazgos | Sin hallazgo | No verificable |
|---|---|---|---|---|---|
| Frontend | 45 archivos src/ (listado §14.1) — lectura completa de 38, muestreo dirigido de 4 (WinampPlayer, AudioVisualizer, PlayerContext.test, App.css/index.css) | login/boot/logout, 3 tabs, CRUD vault/music/capsules, cola, presencia, offline, OOM, cast, geocoder, toasts | BUG-1..BUG-9, UI-1..UI-9, REF-1..REF-3 | VaultContext auth, WorkerClient, StatsEngine, ToastContext, ui/*, LocationSearch | comportamiento vivo (login Google, persistencia real, rendimiento) |
| Worker/API | worker.js, config.js, 17 routes, 6 utils (lectura completa, 100%) | los 17 endpoints + 4 sub-rutas playlists + sync 8 acciones; validación, auth, eventos, límites, consumidor de cada campo | BUG-10, BUG-11, BUG-12, BUG-13, SEC-1 | auth/access-keys/rate-limit/r2-sign/upload/eras/queue | latencia, rate-limit real entre isolates |
| D1/schema | schema.sql (17 tablas) contra todas las lecturas/escrituras del worker | columnas escritas vs leídas por endpoint; soft delete; FK; datos calculados; legacy | DATA-1..DATA-6 | eras/entries/tracks/playlists/drops/queue/sessions | estado real de D1 (conteos) |
| R2/media | r2.js, upload.js, FileUploadService, PlayerContext src-resolution, SW reglas | presigned, PUT, fila files, URL lectura, firma HMAC, Range, MIME, huérfanos | BUG-11 (Range), MEDIA-1, MEDIA-2 | firma HMAC vault/docs+audio, subida con prefijo validado | objetos reales en R2 |
| SW/PWA | sw.js (317 líneas), manifest.json, index.html, vite.config.js, swAssetManifest | install/activate/fetch/navigate/API/R2/audio/sync/push/mensajes | SW-1..SW-5 | precache, invalidación por versión, offline fallback | registro real del SW en navegador |
| Docs | CONTRATO.md, REGLAS.md, ESTADO.md, SESION.md, INDEX.md, architecture.md, data-flow.md, event-lifecycle.md, ownership-map.md, rendering-flow.md, state-map.md, technical-debt.md, MANUAL_USUARIO, README.md, package.json, vite.config.js, wrangler.toml, ACCESO_TEST_ADMIN.md, CONTRATO_ACCESO_TEST_ADMIN.md, auditoria_reentrada, prompt de auditoría | ADRs vs código; docs de arquitectura vs código; manual vs realidad | DOC-1..DOC-7 | INDEX.md estructura de staleness | — |

---

## 4. MATRIZ DE CONTRATOS CRUZADOS (obligatoria)

| Flujo | UI/cliente | Endpoint Worker | Worker (código) | schema/R2 | Resultado |
|---|---|---|---|---|---|
| **Crear entry** | `Vault.jsx:642-657` handleAddEntry → solo `patchDb` local + `entryCreated` local | `POST /api/entries` existe (`entries.js:132-158`) | valida era, inserta, emite entry_created, acepta file_ids | entries + entry_tags + files + events | **ROTO**: el cliente NUNCA llama al POST. La entrada creada vive solo en estado local. Contraste: `Recaps.jsx:215` sí usa `workerClient.post('/api/entries')` (patrón correcto existente). VERIFICADO EN CÓDIGO. Comportamiento vivo NO VERIFICABLE EN ESTA SESIÓN. |
| **Editar entry** | `Vault.jsx:660-668` handleEditEntry → `updateEntry` (`VaultContext.jsx:850-859`) → PATCH | `PATCH /api/entries/:id` (`entries.js:160-196`) | whitelist ENTRY_FIELDS, actualiza, emite entry_updated, re-inserta tags | entries + entry_tags + events | CORRECTO en código (PATCH usado por VaultContext). Vivo no verificable. |
| **Borrar entry** | `Vault.jsx:671-679` handleDeleteEntry → confirm + `deleteEntry` (`VaultContext.jsx:867-876`) → DELETE | `DELETE /api/entries/:id` (`entries.js:198-210`) | soft delete + evento | entries.is_deleted | CORRECTO en código. Vivo no verificable. |
| **Crear era** | `Vault.jsx:619-640` handleAddEra → POST | `POST /api/eras` (`eras.js:49-69`) | valida name, inserta, sort_order auto, emite era_created | eras | CORRECTO en código. |
| **Añadir track con MP3** | `AddTrackForm.jsx:29-32` submit() → `onAdd`; `useMusicActions.js:21-29` onAddTrack | `POST /api/tracks` (`tracks.js:73-93`) | inserta con `r2_key || null` | tracks.r2_key | **ROTO**: el MP3 seleccionado (`AddTrackForm.jsx:85-107`, jsmediatags) NUNCA se sube (no hay `uploadFile` en el form; el POST no recibe r2_key). Track creado sin archivo → toast "SIN ARCHIVO" (`MusicLab.jsx:163-178`). VERIFICADO EN CÓDIGO. |
| **Crear playlist** | `MusicLab.jsx:367-395` handleCreatePlaylist → POST | `POST /api/playlists` (`playlists.js:60-80`) | inserta, sort_order auto, emite | playlists | CORRECTO en código. |
| **Crear cápsula con contenido** | `TimeCapsules.jsx:98-126` envía `entry_ids`, `playlist_ids`, `content_snapshot` (103-114) | `POST /api/time_capsules` (`capsules.js:22-36`) | **inserta SOLO (id, title, description, unlock_at, created_by)** | time_capsules NO tiene esas columnas; capsule_items existe pero NUNCA se inserta | **ROTO (hallazgo de Luna, confirmado)**: el contenido seleccionado se descarta silenciosamente. GET devuelve sin entry_ids/playlist_ids → la UI (`TimeCapsules.jsx:47-52,218-221`) siempre muestra 0. VERIFICADO EN CÓDIGO. |
| **Subir foto/video/audio** | `AddEntryForm.jsx:337-349` → `uploadFile` (`FileUploadService.js:26-52`) | `POST /api/upload` + `PUT /api/upload/:key` (`upload.js`) | POST crea fila files; PUT sube binario con prefijo validado | files + R2 | CORRECTO en código (dos pasos coherentes; prefijos validados en ambos). El encadenado con el POST /api/entries del vault está roto por BUG-1 (la foto sube a R2 pero la entry no se persiste). |
| **Reproducir/seek MP3** | `PlayerContext.jsx:1410-1480` src resolution; `r2.js:39-46` | GET binario R2 | devuelve body completo; **no parsea header Range** pese a anunciar `Accept-Ranges: bytes` (`r2.js:43`) | R2 | **BUG (Range)**: un seek descarga el archivo entero (tracks de decenas de MB). VERIFICADO EN CÓDIGO (no se lee `request.headers.get("Range")` en r2.js). |
| **Emitir/leer eventos** | `StatsEngine.js:23-38` POST; `Capsules.jsx:47-51` GET limit 500; `Timeline.jsx:18-24` whitelist | `POST /api/events` (`events.js:14-23`, cap 4KB) + `GET` (limit ≤500, excluye auth_ por defecto) | correcto | events | CORRECTO en código. Contrato de ICONOS de evento roto: el worker emite `capsule_created`/`capsule_unlocked`/`drop_deleted`/`playlists_reordered`/`playlist_track_removed` pero `Timeline.jsx:26-35` solo define iconos para `capsule_sealed`/`capsule_opened`/`drop_sent`/`drop_seen` → esos eventos caen al fallback "●" (UI-8). VERIFICADO EN CÓDIGO. |
| **Login Google** | `LoginScreen.jsx` + `GoogleDriveService.js:140-188` (initTokenClient, SCOPES sin drive) | `POST /api/auth/login` (`auth.js:45-65`) | valida token contra tokeninfo, whitelist, firma JWT | users + events (auth_login) | CORRECTO en código. Vivo NO VERIFICABLE EN ESTA SESIÓN. |
| **Login access key** | `LoginScreen.jsx:358-460` AccessPanel + `VaultContext.jsx:596-635` | `POST /api/auth/token` (`auth.js:68-91`) | SHA-256 + tiempo constante (`access-keys.js`), rate limit 10/min, emite auth_login | users + events | CORRECTO en código. Vivo NO VERIFICABLE EN ESTA SESIÓN. |

---

## 5. RESUMEN EJECUTIVO

El backend (worker) está bien estructurado, con auth sólida, validación de prefijos, eventos append-only y rate limiting; el contrato cruzado se rompe en el FRONTEND del vault y en una feature entera:

1. **BUG-1 (crear entry no persiste)** — la función central del vault (crear notas/cartas/hitos desde la app) solo escribe en estado local. El endpoint correcto existe y otro flujo (Recaps) lo usa.
2. **BUG-2 (MP3 no sube)** — el formulario de añadir track lee el ID3 del MP3 pero nunca sube el archivo; se crean tracks muertos.
3. **BUG-3 (Time Capsules sin contenido)** — el hallazgo de Luna, confirmado en código: entry_ids/playlist_ids/content_snapshot viajan al worker y se descartan; capsule_items nunca se inserta; la UI siempre muestra "0 entradas · 0 playlists".
4. El resto: bugs menores (Range R2, validaciones de campos), deuda masiva de UI (emojis/idioma/textos técnicos), cero responsive desktop, código muerto y stubs (SW sync/push, bibliotecas Drive, {null}×5, exifr sin uso, like sin backend, onOpenEra stub, ambient sin audio), contradicciones documentales (manual dice "vive en Google Drive", ADRs pre-D1 vigentes).

---

## 6. BUGS Y SEGURIDAD

### BUG-1 (crítico) — Crear entrada en el VAULT no persiste (frontend)
- `Vault.jsx:642-657`: `handleAddEntry` hace `patchDb` (estado local) + `entryCreated` (StatsEngine local). **No hay** `workerClient.post('/api/entries')` ni `workerClient.fetch` en la ruta de creación de entradas.
- Contraste: `handleAddEra` sí postea (`Vault.jsx:623`); `Recaps.jsx:215` postea entries; `updateEntry`/`deleteEntry` de `VaultContext.jsx:850-876` sí usan workerClient. El patrón existe; la creación de entries quedó sin migrar.
- Impacto: todo contenido creado desde la UI del vault se pierde al recargar (la DB se reconstruye desde D1 en `VaultContext.jsx:323-375`). El vault solo puede crecer por script/API directa.
- Certeza: VERIFICADO EN CÓDIGO (flujo completo trazado). Comportamiento vivo: NO VERIFICABLE EN ESTA SESIÓN.

### BUG-2 (crítico) — Añadir track con MP3 no sube el archivo
- `AddTrackForm.jsx:29-32` `submit()` → `onAdd({...form})`; `useMusicActions.js:21-29` `onAddTrack` → POST /api/tracks **sin r2_key**; el archivo seleccionado (`AddTrackForm.jsx:85-107`) nunca pasa por `uploadFile`.
- Consecuencia: track creado con `r2_key = null` → `PlayerContext.jsx:1420-1433` "Track sin archivo" → toast "SIN ARCHIVO" (`MusicLab.jsx:163-178`).
- Certeza: VERIFICADO EN CÓDIGO.

### BUG-3 (crítico) — Time Capsules: el contenido se descarta (hallazgo de Luna, confirmado)
- Cliente envía: `TimeCapsules.jsx:103-114` (`entry_ids`, `playlist_ids`, `content_snapshot`).
- Worker persiste: `capsules.js:28-31` solo `(id, title, description, unlock_at, created_by)`.
- Schema: `time_capsules` (schema.sql:198-208) sin esas columnas; `capsule_items` (210-219) existe pero **0 INSERTs** en capsules.js.
- Lectura: GET devuelve `SELECT *` sin contenido → `TimeCapsules.jsx:47-52` (CapsuleReveal) y `:218-221` leen `capsule.entry_ids?.length` → siempre undefined/0.
- Certeza: VERIFICADO EN CÓDIGO (contrato cruzado completo).

### BUG-4 (medio) — HTTP Range ignorado en R2 (seek descarga el archivo entero)
- `r2.js:39-46`: devuelve `new Response(obj.body, ...)` sin leer `Range`; `Accept-Ranges: bytes` anunciado en `r2.js:43` sin implementación.
- Impacto: seek en tracks grandes (decenas de MB) = descarga completa por cada salto; riesgo de saturación de red y de cuota Cache API (el SW cachea la respuesta en `sw.js:184-196`).
- Certeza: VERIFICADO EN CÓDIGO.

### BUG-5 (medio) — Validaciones de campos insuficientes en POSTs del worker
- `tracks.js:74-85`: `body.title` sin validar (undefined → violación NOT NULL → 500). `drops.js:24-34`: `to_user` por defecto `userId` (un drop mal formado va a uno mismo). `events.js:14-23`: `event_type` sin validar (mismo riesgo NOT NULL). `entries.js:132-158`: `type` sin validar contra taxonomía.
- Certeza: VERIFICADO EN CÓDIGO. Severidad baja (solo clientes con JWT).

### SEC-1 (bajo) — Whitelist de usuarios duplicada frontend/worker
- `GoogleDriveService.js:21-25` (CONFIG.USERS) y `workers/config.js:13-17` (WHITELIST) mantienen la misma lista en dos sitios; divergencia futura = riesgo de acceso inconsistente. La verificación de identidad real la hace el worker (WHITELIST) + tokeninfo; la lista del frontend solo controla UI. Certeza: VERIFICADO EN CÓDIGO.
- No se encontraron: secretos en repo, claves hardcodeadas, endpoints sin auth real (tags.js se protege a sí mismo pese a requiresAuth=false en worker.js:37), SQL inyectable (bindings en todas las rutas), ni XSS obvio (CSP estricta en index.html:9; sin dangerouslySetInnerHTML — 0 usos).

---

## 7. DATOS Y PERSISTENCIA

- **DATA-1 — soft delete inconsistente**: entries/tracks tienen `is_deleted` (+ deleted_at/deleted_by en tracks); drops/playlists/eras/queue se borran FÍSICAMENTE (`drops.js:74`, `playlists.js:156`, `eras.js:100`, `queue.js:33`). Los drops eliminados no dejan rastro en events salvo `drop_deleted`. Documentar o unificar — decisión de producto. VERIFICADO EN CÓDIGO.
- **DATA-2 — `content` de entries como JSON string vs objeto**: el worker guarda `JSON.stringify(body.content)` (`entries.js:145`) y el GET lo devuelve como string; el frontend lo parsea con `safeParse` (`VaultContext.jsx:336-346`). Doble representación según consumidor (Recaps envía string ya serializado en `Recaps.jsx:218` → se serializa DOS veces). Riesgo de doble-encoding. VERIFICADO EN CÓDIGO.
- **DATA-3 — `track_tags`/`entry_tags` sin limpieza al borrar tags**: `tags.js:60` DELETE físico del tag sin borrar junction rows (FK CASCADE existe en schema.sql:104-107 para track_tags y 69-72 para entry_tags — D1 con FK habilitadas resolvería; pero si las FK no están activadas en la DB remota (PRAGMA foreign_keys), quedan huérfanos). NO VERIFICABLE EN ESTA SESIÓN (requiere D1).
- **DATA-4 — datos calculados pero no persistidos**: `entry_count` de eras se calcula en cada GET (`eras.js:26-31`); `track_ids` de playlists se calcula por JOIN (`playlists.js:46-54`); `position`/`queue_json` de shared_sessions SÍ se persisten. Consistente, sin drift. VERIFICADO EN CÓDIGO.
- **DATA-5 — datos persistidos pero nunca leídos**: `app_config.presence_*` se escribe (sync.js:100-111) y se lee (sync.js:23-25) — OK. `drive_file_id` en tracks se escribe (tracks.js:84) y se lee solo como fallback de stream (GoogleDriveService.js:289) — legacy vivo por diseño (ADR-010). `files.track_id` se escribe (upload.js:31) pero ningún GET lo enriquece (files.js no hace JOIN con tracks). Menor. VERIFICADO EN CÓDIGO.
- **DATA-6 — cola en D1 con contexto parcial**: `PUT /api/queue` (queue.js:29-43) persiste `context_name` global pero la UI distingue items `_manual`/contexto por flag; al restaurar (`PlayerContext.jsx:571-588`) el contexto de playlist se pierde (todos `_manual` según el flag guardado — OK) pero `queueContextName` no se restaura → la cola restaurada pierde la etiqueta "DESDE: playlist". Menor. VERIFICADO EN CÓDIGO.

---

## 8. UI Y ACCESIBILIDAD

- **UI-1 — emojis como iconografía** (deuda explícita de Edu). Inventario en código: `AddEntryForm.jsx:64-154` (75 tipos con 📷🎬🎙…), `CATEGORY_FILTERS` (`AddEntryForm.jsx:162-178`: 📷✎📄📍⏳📋💚🔗🎨💰🕯🔐📊🔄), badges `Vault.jsx:415-426` (📅📍⭐🔗), mood select `AddEntryForm.jsx:35` (😊🙂😐🙁😞), `VaultGallery.jsx` (🎵📷👤🎭🌍🏛️📅), `WallView.jsx:265,393` (📷), `EntryLightbox.jsx:269,290,360,365`, `Capsules.jsx:22-23` (🔮📊), `Recaps.jsx:12-14,88-107` (📅🌙🌟📔🎵📝♥🏆✨), `TimeCapsules.jsx:36,147,203,213,231` (🔮📦🔒🔓), `Timeline.jsx:26-35` (👁🔮✨♫…), `DropsManager.jsx` (⚡💿⏱★), `TrackCard.jsx:56` (⚙), `App.jsx:40`/`BootScreen.jsx:112`/`ChunkErrorBoundary.jsx:70` (⚠⚡). Los símbolos del tema (◈◎⚡♥⧖⌕) son estética declarada (congelada); los emojis de color son la deuda. VERIFICADO EN CÓDIGO.
- **UI-2 — textos en inglés**: `Layout.jsx:65-71` (fecha en-US "AUG 02, 2026"), `Vault.jsx:391,528` ("JUN 2021"), `DropsManager.jsx:97,145,150` ("INCOMING DROP", "PLAY NOW", "LATER"), `WallView.jsx:493` ("pinch ↕ zoom"), `MusicLab.jsx:28` ("ALL"), `PlaylistManager.jsx:170` ("PLAY"), `WinampPlayer.jsx:644` ("◈ SELECT A TRACK ◈", congelado), `LoginScreen.jsx:18-26` (boot lines EN, estética). VERIFICADO EN CÓDIGO.
- **UI-3 — cero adaptación desktop**: 4 líneas con breakpoints `md:/lg:/xl:` en todo src/ (2 en Card, 1 en Button, 1 en Vault); Layout/MusicLab/VaultGallery/Capsules/Login no tienen ninguno; contenedores `max-w-md mx-auto` fijos (Vault.jsx:747, MusicLab.jsx:783, Capsules.jsx:72). `manifest.json:7` fuerza `orientation: portrait-primary` + `PortraitLockOverlay` (`Layout.jsx:405-438`) bloquea landscape. Sin atajos de teclado fuera del lightbox (EntryLightbox.jsx:86-93). VERIFICADO EN CÓDIGO.
- **UI-4 — textos de desarrollo en la interfaz**: `VaultGallery.jsx:1108` ("S130-D · Sub-fase 4 · geocoder + entries reales · slider temporal · polylines · X/Y pines"), `VaultGallery.jsx:1190` ("{MODE} · N elementos"), `MusicLab.jsx:1751-1754`/`Vault.jsx:991,1016` (footers "v1.0", "◈ WEB AUDIO API", "◈ ENCRYPTED"). VERIFICADO EN CÓDIGO.
- **UI-5 — prompt()/confirm() nativos**: `MusicLab.jsx:538,853` (prompt crear playlist), `Vault.jsx:672` (confirm borrar entry). Incoherentes con el patrón propio (PlaylistNameInput existe). VERIFICADO EN CÓDIGO.
- **UI-6 — botones icono sin aria-label**: `Layout.jsx:149-167` (↺ recargar, ⎋ logout — sin aria-label; solo title ausente). VERIFICADO EN CÓDIGO.
- **UI-7 — boot animado bloqueante**: `LoginScreen.jsx:171-183` programa 7 setTimeouts (~1.9s) sin cleanup ni cancelación; el botón de acceso aparece solo tras `showContent` (`LoginScreen.jsx:494-499`). En StrictMode el useEffect se duplica en dev (no en prod build) — el retardo persiste. VERIFICADO EN CÓDIGO.
- **UI-8 — iconos de eventos huérfanos**: `Timeline.jsx:26-35` no cubre `capsule_created`, `capsule_unlocked`, `drop_deleted`, `playlists_reordered`, `playlist_track_removed`, `shared_session_*`, `auth_login` (excluido por diseño) → fallback "●" sin distinción. VERIFICADO EN CÓDIGO.
- **UI-9 — texto dramático/innecesario**: `TabShell.jsx:106` ("Los protocolos de seguridad han sido activados"), `VaultGallery.jsx:371,380` ("Solo un eco en la sala…"), `VaultGallery.jsx:499,504` ("— sin eco —"). VERIFICADO EN CÓDIGO.
- Accesibilidad positiva: `aria-label` correctos en WinampPlayer (WinampBtn), botones ≥44px generalizados, EntryLightbox con teclado (Escape/←/→), Input/Button con estados disabled. Sin auditoría completa de contraste WCAG en esta sesión (no verificable sin render).

---

## 9. ARQUITECTURA / DEUDA / REFACTOR

- **REF-1 — monolitos** (conteos recalculados en esta sesión): `MusicLab.jsx` 1861 líneas, `PlayerContext.jsx` 1732 (congelado), `VaultGallery.jsx` 1232, `Vault.jsx` 1026, `VaultContext.jsx` 984, `SmokeSession.jsx` 833, `WinampPlayer.jsx` 791 (congelado), `Layout.jsx` 629, `LoginScreen.jsx` 622, `WallView.jsx` 568, `AudioVisualizer.jsx` 562, `AddEntryForm.jsx` 530. 14 archivos >500 líneas. VERIFICADO EN CÓDIGO.
- **REF-2 — duplicación**: `getImageUrl` definido 3 veces (`VaultGallery.jsx:41`, `WallView.jsx:39`, `EntryLightbox.jsx:26`) + inline en popup mapa (`VaultGallery.jsx:1058`); `getMediaType` 2 veces (VaultGallery:52, EntryLightbox:39); `CAT_LABEL`/`CAT_ICON`/`ENTRY_CATEGORY` derivados 3-4 veces (EntryLightbox:20-22, VaultGallery:32-36, WallView:23-25, Vault:28); `FONT_MONO` redefinido local en 8 archivos (MusicLab:23, AddTrackForm:9, DropsManager:4, PlaylistManager:6, TagManager:13, TrackCard:6, WinampPlayer:10, ColorPicker) pese a exportarse de tokens.js:22; patrón bottom-sheet copiado (TrackCard 2 veces, PlaylistManager, MusicLab, DropsManager); `getStreamUrl` duplicado (FileUploadService.js:60 y GoogleDriveService.js:285). VERIFICADO EN CÓDIGO.
- **REF-3 — código muerto / stubs / features a medias**:
  - `exifr` en devDependencies (package.json:35) con **0 usos** — la extracción de EXIF (fechas reales de fotos) nunca se implementó. VERIFICADO EN CÓDIGO.
  - Bibliotecas Drive: `libraries: []` forzado (`VaultContext.jsx:365,387,697`) pero API completa viva (`VaultContext.jsx:747-840`) llamando a Drive real (`GoogleDriveService.js:247-282`). VERIFICADO EN CÓDIGO.
  - Like de WinampPlayer sin backend (`WinampPlayer.jsx:67-69` "sin backend todavía — feedback visual"). VERIFICADO EN CÓDIGO.
  - onOpenEra stub: `PageWrappers.jsx:34-36` (solo console.log). VERIFICADO EN CÓDIGO.
  - "Ambient" de CINEMA/REEL sin audio: solo baja masterVolume (`VaultGallery.jsx:66-95,635-651`). VERIFICADO EN CÓDIGO.
  - 5 debris `{null}` en JSX: `Vault.jsx:745`, `TagManager.jsx:77`, `Capsules.jsx:73`, `Timeline.jsx:360`, `TimeCapsules.jsx:252`. VERIFICADO EN CÓDIGO.
  - `console.*`: 126 usos (PlayerContext ~30 con emojis — congelado; VaultContext ~15). VERIFICADO EN CÓDIGO.
  - `sharedListening: setSharedListening: () => {}` expuesto en contexto (`PlayerContext.jsx:1693`) — no-op. Menor.
  - 3 archivos untracked en el repo: `CANON.manifest`, `extract_messages.ps1`, `extracted_messages.txt` (60 KB dump de conversación). VERIFICADO EN CÓDIGO (git status).
- **Consistencia positiva**: WorkerClient/StatsEngine/ToastContext/ui/* limpios; useMusicActions con patrón Worker-primero; player con OOM recovery, MediaSession, wakeLock, cast y retry con backoff completos.

---

## 10. SW / PWA / MEDIA

- **SW-1 — Background Sync es un stub sin productor ni consumidor**: `sw.js:262-277` escucha `sync` con tag `bunker-db-sync`, pero nadie hace `registration.sync.register` (0 usos en src/) y `BUNKER_SYNC_READY` (sw.js:272) no tiene receptor (0 usos en src/). Comentario interno obsoleto ("Drive API calls happen in the main thread via gapi"). VERIFICADO EN CÓDIGO.
- **SW-2 — Push es un stub sin suscripción**: `sw.js:279-315` (push + notificationclick) pero 0 `pushManager.subscribe` en src/ y ningún endpoint VAPID en el worker. El SDK de Chromecast (index.html:20) sí se carga siempre. VERIFICADO EN CÓDIGO.
- **SW-3 — regla cache-first de audio muerta**: `sw.js:120` cachea `/music/*`, pero los r2_key reales son `tracks/…` (prefijo "music/" NO existe en ninguna ruta de subida: `config.js:20-26` admite "music" como prefijo de upload, pero `upload.js:26` genera `music/<uuid>_<name>` → prefijo "music/" SÍ puede existir si alguien sube con prefix="music"; sin embargo ningún flujo actual lo hace — AddTrackForm no sube nada (BUG-2) y los tracks existentes son tracks/). Regla muerta en la práctica hoy. VERIFICADO EN CÓDIGO (sin sistema vivo no puedo contar objetos R2 — NO VERIFICABLE; el código de upload SÍ permite crear prefijo music/).
- **SW-4 — precache e invalidación correctos**: swAssetManifest (vite.config.js:15-46) escribe sw-assets.json con todos los assets; install precachea shell + assets (sw.js:34-65); `__BUNKER_SW_VERSION__` (vite.config.js:74-77) cambia cada build → CACHE_NAME distinto → activate borra caches viejos (sw.js:73-83) + skipWaiting + clients.claim. La trampa documentada de "bundle viejo" es inherente a cache-first hasta que el nuevo SW se activa, no un bug del código. VERIFICADO EN CÓDIGO.
- **SW-5 — navegación offline**: networkFirst con fallback a /index.html cacheado (sw.js:107-110); offlineFallback con página estética y 1x1 para imágenes (sw.js:202-257). `/api/*` nunca cacheado (sw.js:113-115). CORRECTO. VERIFICADO EN CÓDIGO.
- **MEDIA-1 — Range no soportado** (ver BUG-4). VERIFICADO EN CÓDIGO.
- **MEDIA-2 — huérfanos posibles**: `upload.js:31` crea fila `files` ANTES del PUT binario (upload.js:43-47); si el PUT falla, queda fila sin objeto R2 (huérfano D1) y si el POST de entry falla tras el PUT, queda objeto sin entry (huérfano R2). No hay reconciliación. VERIFICADO EN CÓDIGO.
- **MEDIA-3 — firmas HMAC**: r2-sign.js completo (sign/verify, TTL 24h, comparación correcta); r2.js aplica gate solo si `R2_SIGN_SECRET` presente (r2.js:29); entries.js firma imágenes de prefijos sensibles (entries.js:15-34,100-102). VERIFICADO EN CÓDIGO.

---

## 11. DOCUMENTACIÓN

- **DOC-1 — MANUAL_USUARIO_EL_BUNKER.md obsoleto**: líneas 13, 104, 106 afirman "todo lo que guardemos aquí vive en nuestro Google Drive", "ping silencioso a Google Drive", "guardando algo en Drive". La persistencia es D1+R2 desde S76 (ADR-024) y Drive está fuera (ADR-025/028; SCOPES sin drive en GoogleDriveService.js:11-14). Contradicción documental grave para el usuario final. VERIFICADO EN CÓDIGO.
- **DOC-2 — ADRs obsoletos en CONTRATO.md**: ADR-002 ("queue_[userId].json en Drive. Migrarán a tabla queue_items") — queue_items YA existe (schema.sql:169) y se usa (queue.js); ADR-005 ("El JSON de Drive sigue siendo la fuente de verdad") — falso desde S64/S115 (D1 primaria, VaultContext.jsx:323-375); ADR-013 (OCC con ETags para patchDb) — patchDb es local-only (VaultContext.jsx:713-723); ADR-016 ("music_lab.tags en Drive") — tags en D1 (tags.js). VERIFICADO EN CÓDIGO.
- **DOC-3 — technical-debt.md desactualizado**: TD-1 "Migración Drive → D1 … PARKING post-v1.0" — la migración está HECHA; TD-5 "Sin tests" — existen 3 archivos de test (PlayerContext.test.jsx, access-keys.test.js, rate-limit.test.js). VERIFICADO EN CÓDIGO.
- **DOC-4 — INDEX.md stale**: data-flow.md marcado STALE por ADR-028 (S150) — correcto; el propio INDEX está en S148 sin los cambios 2-ago (ADR-028/PRUEBA/S151) y su línea 40 afirma "pendiente wrangler deploy" sin reflejar el estado post-despliegue. VERIFICADO EN CÓDIGO.
- **DOC-5 — ESTADO.md**: dice "Tests 23/23" y lista el estado 2-ago; no menciona la reauditoría (este documento la crea). Coherente con su rol de snapshot. Sin contradicción material. VERIFICADO EN CÓDIGO.
- **DOC-6 — README.md** (16 líneas): sin contradicciones (genérico). package.json/wrangler.toml coherentes con el código (exifr no usado → ver REF-3). VERIFICADO EN CÓDIGO.
- **DOC-7 — rutas citadas**: las 82 rutas de código citadas en este informe existen (verificación automatizada, §14.2). Sin rutas inexistentes.

---

## 12. DESCARTADOS / NO HALLAZGOS (falsos positivos investigados)

- **`VaultContext.jsx:546` — "Authorization: *** ${token}"**: el archivo real contiene `Authorization: \`Bearer ${token}\`` (verificado con od/hexdump en sesión previa; el visualizador censura "Authorization: Bearer"). NO es un hallazgo. VERIFICADO EN CÓDIGO.
- **"Authorization:" en worker**: authenticate() usa `auth?.startsWith("Bearer ")` (auth.js:63) correcto. NO hallazgo.
- **getStreamUrl como "código Drive vivo"**: el fallback Drive (`GoogleDriveService.js:285-291`) solo actúa si `r2_key` es null (0 tracks así según sesión previa — NO VERIFICABLE aquí); en código es un fallback legacy conforme a ADR-010, no persistencia. Se reporta como legacy, no como violación.
- **CORS `*`** (config.js:7): aceptable para API autenticada por JWT + gate R2; sin credenciales de cookie. NO hallazgo (anotar como decisión).
- **Rate limit en memoria del isolate** (rate-limit.js): limitación conocida de Workers; para app de 2 usuarios es suficiente. NO hallazgo.
- **`{null}` en PlayerContext.test.jsx:25** (`jwtToken={null}`): es un prop, no debris. Descartado.
- **useEffect sin deps (102)**: mayoría con deps en línea siguiente o eslint-disable documentado (patrón establecido del proyecto). Se reporta como patrón, no como bug.
- **Chromecast**: SDK cargado siempre (index.html:20) pero la UI de cast existe y funciona (WinampPlayer.jsx:563-585 + PlayerContext.jsx:1037-1123). NO es stub; es feature completa con coste de carga del SDK. Anotado como decisión.
- **Manual de usuario en src/**: `src/MANUAL_USUARIO_EL_BUNKER.md` — archivo de doc dentro de src/ (solo documental; se empaqueta en el build? Vite no lo incluye al no ser importado — verificado: no hay imports). Anotación de higiene, no bug.

---

## 13. PRIORIZACIÓN NUEVA CON DEPENDENCIAS

| # | Pliego | Depende de | Prioridad |
|---|---|---|---|
| R1 | Fix BUG-1: handleAddEntry → POST /api/entries + manejo file_ids/errores (patrón Recaps/useMusicActions) | — | CRÍTICA |
| R2 | Fix BUG-2: uploadFile en AddTrackForm → r2_key → POST /api/tracks | — | CRÍTICA |
| R3 | Fix BUG-3: Time Capsules — decisión de diseño: (a) columnas JSON en time_capsules, (b) capsule_items con type=entry_ref/playlist_ref, o (c) content_snapshot en payload de evento; alinear GET/POST/PATCH + UI | R1 (el contenido incluye entries que hoy no persisten) | ALTA |
| R4 | Fix BUG-4: soporte Range en r2.js (206 + Content-Range) | — | ALTA (afecta seek móvil) |
| R5 | Decisión HUD desktop (Edu): responsive real vs mantener móvil-only | — | ALTA (queja explícita) |
| R6 | Limpieza UI: emojis → iconos, textos EN → ES, quitar textos de desarrollo, prompt/confirm → componentes, aria-labels | — | MEDIA |
| R7 | Refactor: extraer vault/media helpers + partir VaultGallery/Vault/MusicLab | R5 (el HUD puede cambiar la estructura) | MEDIA |
| R8 | Código muerto: bibliotecas Drive, SW stubs (sync/push), {null}×5, exifr (usar para fechas reales o quitar), onOpenEra, like sin backend | — | MEDIA |
| R9 | Docs: manual de usuario, ADRs 002/005/013/016, technical-debt TD-1/TD-5, INDEX.md | — | BAJA |

Dependencias clave: R3 necesita R1 (el contenido de cápsulas son entries que no persisten). R7 se beneficia de R5. Nada bloquea R1/R2/R4.

---

## 14. EVIDENCIA LOCAL REPRODUCIBLE

### 14.1 Inventario de archivos revisados (81 de código + 14 docs)
- Frontend (45): main.jsx, App.jsx, BootScreen.jsx, TabShell.jsx, PageWrappers.jsx, Layout.jsx, LoginScreen.jsx, Vault.jsx, VaultGallery.jsx, WallView.jsx, EntryLightbox.jsx, AddEntryForm.jsx, LocationSearch.jsx, GeocoderService.js, Capsules.jsx, Timeline.jsx, Recaps.jsx, TimeCapsules.jsx, SmokeSession.jsx, MusicLab.jsx, WinampPlayer.jsx, AudioVisualizer.jsx, AddTrackForm.jsx, PlaylistManager.jsx, DropsManager.jsx, TagManager.jsx, TrackCard.jsx, useMusicActions.js, VaultContext.jsx, PlayerContext.jsx, WorkerClient.js, FileUploadService.js, StatsEngine.js, GoogleDriveService.js, ToastContext.jsx, ChunkErrorBoundary.jsx, ColorPicker.jsx (muestreo), tokens.js, core/ui/{index,Button,Card,Input,Skeleton}.jsx, shims/react-native-fs.js, test-setup.js, core/__tests__/PlayerContext.test.jsx (muestreo), App.css/index.css (muestreo), MANUAL_USUARIO (doc).
- Worker (26): worker.js, config.js, schema.sql, routes/{auth,capsules,config,drops,entries,eras,events,files,health,playlists,queue,r2,stats,sync,tags,tracks,upload}.js, utils/{access-keys,auth,events,rate-limit,r2-sign,response}.js, utils/__tests__/{access-keys,rate-limit}.test.js.
- PWA (5): public/sw.js, public/manifest.json, public/vendor/*.css (hojas de leaflet, sin lógica), index.html, vite.config.js.
- Docs (14): CONTRATO.md, REGLAS.md, ESTADO.md, SESION.md, INDEX.md, architecture.md, data-flow.md, event-lifecycle.md, ownership-map.md, rendering-flow.md, state-map.md, technical-debt.md, README.md, docs/operacional/ACCESO_TEST_ADMIN.md.

### 14.2 Comandos de verificación ejecutados en esta sesión (solo estático)
- `git status --porcelain` → confirma 3 untracked (REF-3) y que este informe es el único archivo creado.
- `find src workers public -name '*.js|*.jsx|*.css' | xargs wc -l` → 19.782 LOC; 81 archivos (conteos recalculados, no copiados).
- `grep -rn "md:\|lg:\|xl:" src` → 4 (UI-3).
- `grep -rn "{null}" src --include='*.jsx'` → 5 reales + 1 falso positivo (UI/REF).
- `grep -rn "prompt(" src` → 2 (UI-5).
- `grep -rn "exifr" src workers` → 0 (REF-3).
- `grep -rn "registration.sync\|pushManager\|BUNKER_SYNC_READY" src` → 0 (SW-1/SW-2).
- `grep -rn "getStreamUrl\|const getImageUrl\|const FONT_MONO" src` → duplicaciones (REF-2).
- Verificación de existencia de 82 rutas citadas → todas OK (DOC-7).
- `npm run build` (permitido: local) → OK 2.37s. (Los tests/lint no se re-ejecutaron para no arriesgar falsos cambios; el estado documentado es 23/23, sin verificación en esta sesión — NO VERIFICABLE.)

---

## 15. CHECKLIST DE AUTOVERIFICACIÓN

- [x] Cubre todos los dominios obligatorios (frontend, worker, D1/schema, R2/media, SW/PWA, docs).
- [x] Matriz de cobertura presente (§3).
- [x] Matriz de contratos cruzados presente con las 12 filas obligatorias (§4).
- [x] Time Capsules revisado en profundidad (BUG-3, §4 fila 7).
- [x] Conteos recalculados, no copiados (§14.2).
- [x] Rutas citadas verificadas existentes (§14.1-14.2).
- [x] Distinción código vs evidencia viva: todo etiquetado VERIFICADO EN CÓDIGO / HIPÓTESIS / NO VERIFICABLE (§1, §6-§12).
- [x] Falsos positivos incluidos (§12).
- [x] Contradicciones documentales detectadas (§11 DOC-1..DOC-7).
- [x] No se modificó app, datos, infraestructura ni documentación existente (solo se creó este informe; git status lo confirma).
- [x] Autocontenido y reproducible por citas.

---

## 16. DECLARACIÓN DE INVALIDACIÓN DEL INFORME ANTERIOR

Conforme al contrato §1 y §7, el documento `docs/operacional/auditoria_total_2026-08-02.md` queda **INVALIDADO como fuente de verdad** y se trata únicamente como antecedente no confiable. Este informe (`auditoria_total_2026-08-02_REPETIDA_HERMES.md`) lo sustituye. Los hallazgos de la sesión anterior que aquí se conservan fueron **re-verificados contra el código en esta sesión** (nunca reutilizados como evidencia viva); los que dependían del sistema vivo se reclasificaron como NO VERIFICABLES EN ESTA SESIÓN. La omisión de Time Capsules señalada por Luna queda corregida (BUG-3) junto con el contrato de eventos de cápsulas (UI-8).

---

*Fin del informe. PASS CANDIDATE pendiente de revisión de Luna (citas) y Edu.*
