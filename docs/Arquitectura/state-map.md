---
describe: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx, Vault.jsx
sincronizado_con: S64 — VaultContext → Worker API (carga híbrida)
stale_si_pliego_toca: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx, Vault.jsx
---

# State Map (post-S64)

## VaultContext (auth + DB híbrida)

| Estado | Tipo | Descripción |
|---|---|---|
| authStatus | string | 'loading' \| 'authenticated' \| 'unauthorized' \| 'error' |
| bootPhase | string | 'init_services' \| 'init_db' \| 'ready' \| 'unauthorized' \| 'error' |
| user | object | { id, email, name, avatar, role } |
| db | object | DB híbrida: entries/eras/tracks de Worker, resto de Drive |
| dbStatus | string | 'ONLINE' \| 'SYNCING' \| 'OFFLINE' \| 'ERROR' |
| jwtToken | string | JWT del Worker API, persistido en localStorage |
| activeTab | string | 'vault' \| 'music' \| 'capsules' |
| masterVolume | number | 0-100 |
| pendingDrop | object | Drop pendiente de ver (polling 30s) |
| lastHeartbeat | ISO string | Último heartbeat a Drive |
| libraryCapacity | object | Cache { [libraryId]: { used_gb, used_pct, near_full } } |

### Derivados (useMemo)

| Derivado | Calculado de | Descripción |
|---|---|---|
| myEntries | db.entries + user.id | Entradas dirigidas al usuario actual (to === userId \|\| "both") |
| myMessages | myEntries | Solo type "letter" |
| libraries | db.libraries | Con status recalculado (_calcLibraryStatus) |
| librariesAtRisk | libraries | Status "at_risk" (18-22 meses sin heartbeat) |
| librariesLost | libraries | Status "lost" (≥23 meses) |
| librariesNearFull | libraries + libraryCapacity | near_full === true |

## PlayerContext (reproducción)

| Estado | Tipo | Descripción |
|---|---|---|
| activeTrack | object | Track en reproducción |
| isPlaying | boolean | Estado play/pause |
| masterVolume | number | 0-100 (sincronizado con VaultContext) |
| trackVibe | string | Tag principal del track activo → `--vibe-accent` |
| localQueue | array | Cola unificada (_manual: true/false) |
| loopMode | string | 'off' \| 'list' \| 'track' |
| shuffle | boolean | Activo/inactivo |
| queueContextName | string | Nombre de playlist como contexto |
| playHistory | array | Historial de reproducción (localStorage) |
| sharedListening | object | Stub para escucha compartida (futuro) |

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
