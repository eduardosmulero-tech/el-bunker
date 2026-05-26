# CONTRATO.md — el_bunker
> ADRs vigentes. Normativo — prevalencia absoluta.
> Contradicción con este doc → Claude detiene y reporta antes de generar pliego.
> Solo crece con nuevas decisiones. Los ADRs revertidos nunca desaparecen: se marcan ⛔.

---

## 🔒 REGLAS INAMOVIBLES

Estas cuatro reglas no pueden eliminarse bajo ninguna circunstancia.

| # | Regla |
|---|---|
| 🔒-1 | **Loop triestado.** `loopMode: "off" \| "list" \| "track"`. Nunca boolean. (ADR-007) |
| 🔒-2 | **Sin backend externo.** Todo persiste en Google Drive JSON. No proponer Firebase, Supabase ni similar. (ADR-001) |
| 🔒-3 | **YouTube nunca con `<audio>` nativo.** `type:"youtube"` → iframe API. `type:"drive"` → HTMLAudioElement. (ADR-003) |
| 🔒-4 | **Div YT nunca en JSX React.** Crear imperativamente con `document.createElement` + `document.body.appendChild` en `useEffect` de montaje único en `PlayerProvider`. (ADR-004 enmienda S23) |

---

## ADRs VIGENTES

### ✅ ADR-001 — Sin base de datos externa
Todo persiste en Google Drive mediante JSON. DB en carpeta compartida del Drive de `thebunker.admin`. Requiere `VITE_GOOGLE_SHARED_FOLDER_ID`.

### ✅ ADR-002 — Colas de reproducción por usuario
Archivos separados `queue_[userId].json` en la misma carpeta compartida. No mezclar con la DB principal.

### ✅ ADR-003 — Arquitectura de tracks
Dos tipos en el mismo schema, campo `type`:
- `type: "youtube"` → iframe API. **Nunca `<audio>` nativo.**
- `type: "drive"` → `<audio>` nativo + `getStreamUrl(fileId)`.

### ⚠️ ADR-004 — Global PlayerContext (ENMENDADO)
Estado de reproducción centralizado en `PlayerContext.jsx`.
Expone: `activeTrack`, `isPlaying`, `localQueue`, `loopMode`, `loopModeRef`, `shuffle`, `autoPlaySignal`, refs YT/Audio, `skip`, `addToQueue`, `removeFromQueue`, `playTrack`, `toggleLoopMode`, `activeVibe`, `masterVolume`, `currentTRef`.

**Enmiendas vigentes:**
- S21: `<audio>` y reproductores externos se instancian en `PlayerProvider`. Prohibido delegar a subcomponentes mutables.
- S23: Div target de `YT.Player` NUNCA en JSX. Crear imperativamente fuera del árbol React. (🔒-4)
- S24: Progreso (`currentTime`, `duration`, `progress`) es UI de alta frecuencia. NUNCA en `useState` del Context. Estado local de `WinampPlayer`.
- S26: `useEffect([track?.id])` en `WinampPlayer` que resetea estado local DEBE protegerse con `mountedRef`.

### ✅ ADR-005 — Schema v3.4.0
Campos: `type`, `drive_file_id`, `youtube_url`, `url` (legacy). Drops con `favorited`/`favorited_by`. Playlists en `music_lab.playlists`.
Migración automática desde v1, v2, v3.0.0–v3.3.0.
No modificar schema sin evaluar impacto en migración y actualizar `CONFIG.SCHEMA_VERSION`.

### ✅ ADR-006 — Solo 3 usuarios autorizados
Whitelist fija en `CONFIG.USERS` de `GoogleDriveService.js`. No proponer auth dinámica.

### ✅ ADR-007 — Loop triestado
`loopMode: "off" | "list" | "track"`. Ciclo: OFF → loop-lista → loop-track → OFF.
`loopModeRef` obligatorio para callbacks YT (`onStateChange`) — evita stale closure.
Icono: `"off"` → `⟳` inactivo · `"list"` → `⟳` activo · `"track"` → `⟳¹` activo.

### ⛔ ADR-008 — Cola siempre tiene prioridad sobre shuffle (REVERTIDO)
**No implementar.** Razonamiento incorrecto: hace imposible shuffle de playlist con cola activa.
La convención correcta (ADR-009): cola manual tiene prioridad, pero shuffle opera sobre el contexto de lista igualmente.
Pendiente pliego de corrección en refactorización de PlayerContext.

### ✅ ADR-009 — Filosofía del reproductor: convención primero
Toda decisión parte de lo que hace un reproductor estándar. Solo se aparta con razón documentada aquí.

**Convenciones base inamovibles:**
- Cola manual tiene prioridad sobre shuffle, siempre
- Cambiar de track mientras suena → el nuevo track arranca
- Loop track → repite el track actual indefinidamente
- Loop list → vuelve al primero al llegar al final
- Sin loop + cola vacía → para
- Skip atrás < 3s → track anterior · > 3s → reiniciar actual

*Excepción deliberada del Bunker:* `masterVolume` vive en `PlayerContext` para que `SmokeSession` lo consuma.

---

## DEPENDENCIAS INAMOVIBLES

- **Tailwind CSS v3.4.19** — NO actualizar a v4. Rompe el proyecto.
- **React 18 + Vite** — client-side puro. No Next.js.
- **GIS OAuth2** — no usar librería legacy de Google Sign-In.
- **Scope `drive`** — necesario para escritura cruzada entre cuentas. No reducir a `drive.file`.