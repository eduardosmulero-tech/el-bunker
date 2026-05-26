---
describe: PlayerContext.jsx, VaultContext.jsx, WinampPlayer.jsx, MusicLab.jsx, PlaylistManager.jsx, DropsManager.jsx
sincronizado_con: PLIEGO-071
stale_si_pliego_toca: PlayerContext.jsx, WinampPlayer.jsx, VaultContext.jsx
---

# State Map

## Global State

### PlayerContext
| Estado | Tipo | Uso | Debe existir |
|---|---|---|---|
| `activeTrack` | `object \| null` | Track actualmente en reproducción. Determina qué reproduce `<audio>` o el iframe YT. | ✅ Sí — fuente de verdad del reproductor |
| `isPlaying` | `boolean` | Controla play/pause en ambos motores (nativo + YT). Activa el polling en WinampPlayer. | ✅ Sí |
| `localQueue` | `array` | Cola de tracks pendientes. Persiste asíncronamente en `queue_[userId].json`. | ✅ Sí |
| `loopMode` | `"off" \| "list" \| "track"` | Modo de loop triestado. Nunca boolean. Se expone también via `loopModeRef` para callbacks YT. | ✅ Sí — ADR-007 |
| `shuffle` | `boolean` | Activa/desactiva reproducción aleatoria. La cola manual tiene prioridad cuando `!shuffle`. | ✅ Sí — ADR-009 |
| `autoPlaySignal` | `number` (counter) | Contador que se incrementa para disparar autoplay. Evita comparaciones de referencia. | ✅ Sí |
| `activeVibe` | `string` | ID del vibe activo (`"all"`, `"gaming"`, `"420_chill"`, `"dnb"`, `"romantiqueo"`). Filtra tracks y determina acento de color. | ✅ Sí |
| `masterVolume` | `number` (0–1) | Volumen global. Consumido por `<audio>`, iframe YT y SmokeSession. | ✅ Sí — decisión deliberada del Bunker (ADR-009 nota) |
| `ytPlayerRef` | `ref` (instancia YT.Player) | Referencia imperativa al reproductor YouTube. Nunca en estado React. | ✅ Sí — imperativo por diseño |
| `audioRef` | `ref` (HTMLAudioElement) | Referencia al `<audio>` nativo. Nunca se desmonta (ADR-004). | ✅ Sí |
| `loopModeRef` | `ref` (`"off" \| "list" \| "track"`) | Espejo de `loopMode` en ref. Necesario para evitar stale closures en callbacks de `onStateChange` de YT. | ✅ Sí — ADR-007 |
| `currentTRef` | `ref` (number) | Espejo del `currentTime` actual. Sincronizado en `onTimeUpdate` y polling YT. Necesario para `skipDir` sin stale closure. | ✅ Sí — REGLA-9 |

---

### VaultContext
| Estado | Tipo | Uso | Debe existir |
|---|---|---|---|
| `db` | `object` (JSON schema v3.4.0) | Base de datos completa: tracks, playlists, drops, eras, bibliotecas. Fuente de verdad de toda la app. | ✅ Sí |
| `user` | `object \| null` | Usuario autenticado actual (email, id). Determina whitelist y lógica de drops. | ✅ Sí |
| `authStatus` | `string` | Estado del flujo OAuth (`idle`, `loading`, `authenticated`, `error`). | ✅ Sí |
| `bootPhase` | `string` | Fase de arranque (`INIT_SERVICES` → `INIT_DB` → `READY`). Controla qué muestra el router. | ✅ Sí |
| `dbStatus` | `string` | Estado de sincronización con Drive (`synced`, `syncing`, `error`). | ✅ Sí |
| `activeTab` | `string` | Tab activo en el router virtual. | ⚠️ Candidato a extracción — ver sección inferior |
| `masterVolume`* | — | — | ⚠️ Movido a PlayerContext (ADR-009 nota). No debe existir aquí. |

> *`masterVolume` vivía en VaultContext y fue migrado a PlayerContext en PLIEGO-054/055. Si queda algún residuo en VaultContext, eliminarlo.

---

## Local State

### WinampPlayer
| Estado | Uso | Extraíble |
|---|---|---|
| `currentTime` | Tiempo de reproducción actual para la barra de progreso. Actualizado por `onTimeUpdate` (Drive) o polling `setInterval` (YT). | ❌ No — es UI de alta frecuencia. NUNCA al contexto global (REGLA-1). |
| `duration` | Duración total del track activo. | ❌ No — mismo motivo. |
| `progress` | Porcentaje calculado (`currentTime / duration`). Usado por la barra visual. | ❌ No — derivado local. |
| `mountedRef` | Guard booleano en ref. Evita resetear el estado de reproducción en el montaje inicial del componente. | ❌ No — es un guard de ciclo de vida local (ADR-004 enmienda S26). |

### MusicLab
| Estado | Uso | Extraíble |
|---|---|---|
| `activeModal` | Qué modal está abierto (`null`, `"addTrack"`, `"editTrack"`, `"deleteTrack"`, etc.). Modales mutuamente excluyentes. | ❌ No — UI local. |
| `editingTrack` | Track seleccionado para edición. Se pasa a `AddTrackForm`. | ❌ No — UI local efímera. |
| `activePlaylist` | Playlist seleccionada para mostrar/editar. | ❌ No — UI local. |
| `searchQuery` | Texto de filtro de búsqueda de tracks. | ❌ No — UI local. |

### PlaylistManager
| Estado | Uso | Extraíble |
|---|---|---|
| `newPlaylistName` | Input controlado para crear nueva playlist. | ❌ No — UI local. |

### DropsManager
| Estado | Uso | Extraíble |
|---|---|---|
| `composingDrop` | Si el modal de composición de drop está abierto. | ❌ No — UI local. |
| `minuteMark` | Valor del slider de minuto en un drop. | ❌ No — UI local. |

---

# Estados problemáticos

- **`activeTab` en VaultContext** — es estado de UI puro (qué pestaña está activa) mezclado con la base de datos y la autenticación. Cualquier cambio de pestaña re-renderiza todos los consumidores de VaultContext, incluyendo componentes que solo leen `db`. Solución propuesta: extraer a `UIContext` o a estado local del router en `App.jsx`.

- **Polling global de drops en VaultContext** — el `setInterval` de 30s llama a `fetchData()` e inyecta un nuevo objeto `db` aunque no haya cambiado nada, cambiando la referencia y disparando re-renders en toda la app. Solución propuesta: extraer a un worker o servicio aislado que solo actualice `db.drops` de forma granular.

- **`masterVolume` en VaultContext (residuo)** — si existe cualquier lectura o escritura de `masterVolume` en VaultContext tras PLIEGO-054, es un residuo. El dueño correcto es `PlayerContext`. Un cambio de slider viajaba hasta la raíz de VaultContext forzando repintado de toda la app.

---

# Estados duplicados

- **`loopMode` + `loopModeRef`** — duplicación intencional y necesaria. `loopMode` es el estado React para re-render de la UI (icono del botón). `loopModeRef` es el espejo en ref para los callbacks de YouTube que no pueden capturar el estado actualizado por stale closure. No eliminar ninguno de los dos (ADR-007).

- **`currentTime` (local WinampPlayer) + `currentTRef` (PlayerContext)** — duplicación intencional. `currentTime` es el estado local de alta frecuencia para la UI. `currentTRef` es el espejo en ref para el callback `skipDir` de MediaSession, que de otro modo lee un valor obsoleto del closure. No eliminar ninguno de los dos (REGLA-9).

- **`activeVibe` en PlayerContext vs. filtro de tracks en MusicLab** — `activeVibe` es el estado global que determina acento de color y contexto de reproducción. MusicLab deriva su filtro visual de él. No hay duplicación real, la derivación es correcta.

---

# Estados candidatos a extracción

- **`activeTab`** — de VaultContext a un `UIContext` ligero o estado local del router. Beneficio: eliminar re-renders de todos los consumidores de VaultContext al cambiar de pestaña.

- **Polling de drops** — de VaultContext a un custom hook `useDropsPolling()` o un servicio inyectado. Beneficio: actualización granular sin reemplazar el objeto `db` completo cada 30s.

- **WakeLock** — de PlayerContext (mezclado con la lógica de play/pause) a un custom hook `useWakeLock(isPlaying)`. Beneficio: separación de side-effects del navegador del estado de reproducción. Documentado como refactor pendiente en `technical-debt.md`.

- **Llamadas de red de cola** (`fetchQueue` / `saveQueue`) — de PlayerContext a un custom hook `useQueueSync(userId)`. Beneficio: elimina la violación de ownership documentada en `ownership-map.md` (PlayerContext no debería poseer llamadas de red).
