---
describe: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx
sincronizado_con: S49 (Refundación del producto)
stale_si_pliego_toca: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx, MusicLab.jsx
---

# State Map (post-S49)

## VaultContext (auth + DB)
| Estado | Tipo | Descripción |
|---|---|---|
| authStatus | string | 'loading' \| 'authenticated' \| 'unauthorized' \| 'error' |
| bootPhase | string | 'init_services' \| 'init_db' \| 'ready' |
| user | object | { id, email, role } |
| db | object | Base de datos completa (JSON Drive → D1) |
| dbStatus | string | 'ONLINE' \| 'SYNCING' \| 'OFFLINE' |
| activeTab | string | 'vault' \| 'music' \| 'capsules' |
| pendingDrop | object | Drop pendiente de ver |

## PlayerContext (reproducción)
| Estado | Tipo | Descripción |
|---|---|---|
| activeTrack | object | Track en reproducción |
| isPlaying | boolean | Estado play/pause |
| masterVolume | number | 0-100 |
| trackVibe | string | Tag principal del track activo (ADR-011) |
| localQueue | array | Cola unificada (_manual: true/false) |
| loopMode | string | 'off' \| 'list' \| 'track' (ADR-007) |
| shuffle | boolean | Activo/inactivo |
| queueContextName | string | Nombre de playlist como contexto |

## VAULT (contenido — futuro)
| Estado | Tipo | Descripción |
|---|---|---|
| activeEra | object | Era seleccionada en el carrusel |
| galleryMode | string | 'wall' \| 'cinema' \| 'map' \| 'dialogue' \| 'reel' \| 'exhibition' |
| galleryDensity | number | 1-3 (zoom en WALL) |
| entries[] | array | Entradas de la Era activa |

## CAPSULES (experiencias — futuro)
| Estado | Tipo | Descripción |
|---|---|---|
| capsulesSubtab | string | 'timeline' \| 'smoke' \| 'capsules' \| 'recap' |
| timelineFilter | object | { era, module, user, type } |
| smokeRemaining | number | Segundos restantes |
| recapPeriod | string | 'week' \| 'month' \| 'year' |

## Stats Engine (futuro)
| Estado | Tipo | Descripción |
|---|---|---|
| events[] | array | Append-only en D1 |
| weeklyRecap | object | Resumen de la semana en curso |
| monthlyRecap | object | Resumen del mes en curso |
