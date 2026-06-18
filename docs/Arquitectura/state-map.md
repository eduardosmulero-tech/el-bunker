---
describe: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx, Vault.jsx, Layout.jsx, ToastContext.jsx, core/ui/Button.jsx, core/ui/Card.jsx, core/ui/Input.jsx, core/ui/Skeleton.jsx
sincronizado_con: S132 — PlayerContext+escucha compartida + ToastContext ephemeral state + Design System props
stale_si_pliego_toca: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx, Vault.jsx, Layout.jsx, ToastContext.jsx, core/ui/Button.jsx, core/ui/Card.jsx, core/ui/Input.jsx, core/ui/Skeleton.jsx
---

# State Map (post-S64)

## VaultContext (auth + DB D1-only, post-S115)

| Estado | Tipo | Descripción |
|---|---|---|
| bootPhase | string | 'idle' \| 'init_services' \| 'init_db' \| 'ready' \| 'unauthorized' \| 'error' |
| authStatus | string | derived: 'idle' \| 'loading' \| 'authenticated' \| 'unauthorized' \| 'error' |
| bootError | string \| null | Mensaje de error si bootPhase === 'error' o 'unauthorized' |
| user | object | { id, email, name, avatar, role } |
| db | object | DB cargada de Worker API (D1). Schema: entries[], eras[], music_lab: {tracks, tags, playlists, drops}, files[], libraries[], schema_version, heartbeat, adventures_start_date |
| dbStatus | string | 'OFFLINE' \| 'SYNCING' \| 'ONLINE' \| 'ERROR' |
| jwtToken | string | JWT del Worker API, persistido en **sessionStorage** ("bunker_jwt") |
| activeTab | string | 'vault' \| 'music' \| 'capsules' |
| masterVolume | number | 0-100 |
| pendingDrop | object | Drop entrante del polling local (auto-detect post-S115) |
| lastHeartbeat | ISO string | Local-only heartbeat (cada 20 min + Page Visibility visible) |
| libraryCapacity | object | Cache { [libraryId]: { used_gb, used_pct, near_full, file_count } } |

### Derivados (useMemo)

| Derivado | Calculado de | Descripción |
|---|---|---|
| myEntries | db.entries + user.id | Entradas dirigidas al usuario actual (to === userId \|\| "both") |
| myMessages | myEntries | Solo type "letter" |
| libraries | db.libraries | Con status recalculado (_calcLibraryStatus) |
| librariesAtRisk | libraries | Status "at_risk" (18-22 meses sin heartbeat) |
| librariesLost | libraries | Status "lost" (≥23 meses) |
| librariesNearFull | libraries + libraryCapacity | near_full === true |

## PlayerContext (reproducción + escucha compartida, S132)

### Reproducción básica

| Estado | Tipo | Descripción |
|---|---|---|
| activeTrack | object | Track en reproducción |
| isPlaying | boolean | Estado play/pause |
| masterVolume | number | 0-100 (sincronizado con VaultContext) |
| trackVibe | string | Tag principal del track activo → `--vibe-accent` |
| localQueue | array | Cola unificada (_manual: true/false, post-merge con queue_json de shared_sessions al end) |
| loopMode | string | 'off' \| 'list' \| 'track' |
| shuffle | boolean | Activo/inactivo |
| queueContextName | string | Nombre de playlist como contexto |
| playHistory | array | Historial de reproducción (localStorage) |
| syncStatus | string | 'idle' \| 'syncing' \| 'error' |

### Escucha Compartida (NEW S132 — SC1-SC14)

| Estado | Tipo | Descripción |
|---|---|---|
| sessionId | string \| null | ID de sesión compartida activa (null si no) |
| userId | string | 'edu' \| 'david' \| 'admin' (de VaultContext.user.id) |
| partnerListening | boolean | true si el otro user está active (presence >0) |
| partnerTrack | object | { id, title, vibe } del track del partner |
| partnerName | string | 'Edu' \| 'David' o resolvedUser name |
| partnerTrackVibe | string | vibe del partner → deriveColor `getVibeConfig(vibe).palette.accent` |
| pendingSessionIdDerived | boolean | Internal flag local: hay una sesión creada por partner pero no unida (auto-join trigger). El ID se fetchea una sola vez desde `/api/sync?action=presence` y se aplica vía `joinPendingSession()` |

> Nota: `presenceAge` y `syncAction(action, payload)` definidos aquí no existen como tales en PlayerContext actual. La presencia se evalúa server-side (>5min = stale, descartado). Las acciones sync van vía callbacks directos a los handlers de sync.js (play/pause/skip/seek cada uno con su propio path).

## VAULT (contenido)

| Estado | Tipo | Descripción |
|---|---|---|
| activeEra | object | Era seleccionada en el carrusel |
| galleryMode | string | 'wall' \| 'cinema' \| 'map' \| 'dialogue' \| 'reel' \| 'exhibition' |
| galleryDensity | number | 1-3 (zoom en WALL) |
| entries[] | array | Entradas de la Era activa (desde db.entries, Worker-enriched) |

## CAPSULES (experiencias)

| Estado | Tipo | Descripción |
|---|---|---|
| capsulesSubtab | string | 'timeline' \| 'smoke' \| 'capsules' \| 'recap' |
| timelineFilter | object | { era, module, user, type } |
| smokeRemaining | number | Segundos restantes en Smoke Session |
| recapPeriod | string | 'week' \| 'month' \| 'year' |
| events[] | array | Fetched de Worker API (GET /api/events) |
| capsules[] | array | Fetched de Worker API (GET /api/time_capsules) |

## Stats Engine (wired S58)

| Estado | Tipo | Descripción |
|---|---|---|
| _token | string | JWT global (módulo, no React state) — inyectado vía setStatsToken() |
| emit(type, payload) | function | POST /api/events → D1 |
| trackPlay/Pause/Skip | functions | Wrappers de emit() para eventos de playback |

## FileUploadService (wired S58)

| Estado | Tipo | Descripción |
|---|---|---|
| _token | string | JWT global (módulo, no React state) — inyectado vía setUploadToken() |
| VALID_PREFIXES | array | ['music', 'vault/photos', 'vault/videos', 'vault/docs', 'vault/audio'] |
| uploadFile(file, prefix, meta) | function | POST /api/upload → PUT binario a R2 |
| getStreamUrl(r2_key) | function | URL directa a R2 |
