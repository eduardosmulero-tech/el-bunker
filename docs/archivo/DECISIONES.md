# DECISIONES.md — el_bunker
> Solo crece. Se modifica al tomar una nueva decisión arquitectónica o de diseño.
> Las decisiones pendientes no van aquí — van en PLIEGOS.md como bloque PENDIENTE.

---

## ARQUITECTURA

**ADR-001 — Sin base de datos externa**
Todo persiste en Google Drive mediante JSON. No proponer Firebase, Supabase ni ningún backend externo.
La DB vive en carpeta estándar del Drive de `thebunker.admin` compartida con los usuarios. Requiere `VITE_GOOGLE_SHARED_FOLDER_ID`.

**ADR-002 — Colas de reproducción por usuario**
Archivos separados `queue_[userId].json` en la misma carpeta compartida. No mezclar con la DB principal.

**ADR-003 — Arquitectura de tracks en MusicLab**
Dos tipos en el mismo schema, campo `type`:
- `type: "youtube"` — metadatos + URL. Reproducción vía iframe.
- `type: "drive"` — MP3 en Drive de thebunker.musica. Reproducción vía `<audio>` nativo.

Campos schema v3.3.0+: `type`, `drive_file_id` (null si youtube), `youtube_url`, `url` (legacy).
**NO reproducir URLs de YouTube con `<audio>` nativo. Nunca funciona.**

**ADR-004 — Global PlayerContext Provider ✅ IMPLEMENTADO (sesión 18)**
Estado de reproducción centralizado en `PlayerContext.jsx`. Expone: `activeTrack`, `isPlaying`, `localQueue`, `loopMode` (ver ADR-007), `shuffle`, `autoPlaySignal`, refs YT/Audio, `skip`, `addToQueue`, `removeFromQueue`, `playTrack`, `toggleLoopMode`, `activeVibe`, `masterVolume`.
`App.jsx` envuelve `AppCore` con `<PlayerProvider userId tracks>`.
`WinampPlayer` y `MusicLab` consumen el contexto via `usePlayer()`.
Criterio de éxito: audio no se corta al cambiar de pestaña.

*Enmienda Sesión 21 (Auditoría Forense):* El elemento físico `<audio>` y la inicialización asíncrona de reproductores externos deben instanciarse dentro de la raíz del árbol en `PlayerProvider`. Queda prohibido delegar etiquetas multimedia persistentes a subcomponentes mutables.

*Enmienda Sesión 23 (Fix div YT):* El `div` target de `YT.Player` NO debe existir en el JSX de React. Debe crearse imperativamente con `document.createElement` + `document.body.appendChild` en un `useEffect` de montaje único en `PlayerProvider`, fuera del árbol React.

*Enmienda Sesión 24 (Separación progreso/estado):* El estado de progreso (`currentTime`, `duration`, `progress`) es UI de alta frecuencia. NO debe vivir en `useState` del `PlayerContext`. Es estado local de `WinampPlayer`. El polling YT (`setInterval`) vive en `WinampPlayer` y reacciona a `isPlaying` vía `useEffect([playing, track?.id])`.

*Enmienda Sesión 26 (mountedRef guard):* El efecto `useEffect([track?.id])` en `WinampPlayer` que resetea el estado de reproducción local DEBE protegerse con un `mountedRef` que evite el reset en el montaje inicial. Sin este guard, volver de otra pestaña dispara el reset y desincroniza la UI con el estado real del contexto.

**ADR-005 — Schema actual: v3.4.0**
Incluye `music_lab.playlists`, tracks con `type`/`drive_file_id`/`youtube_url`, drops con `favorited`/`favorited_by`.
Migración automática desde v1, v2, v3.0.0–v3.3.0.
NO modificar schema sin evaluar impacto en migración y actualizar `CONFIG.SCHEMA_VERSION`.

**ADR-006 — Solo 3 usuarios autorizados**
Whitelist fija en `CONFIG.USERS` de GoogleDriveService.js. No proponer auth dinámica.

**ADR-007 — Loop triestado `"off" | "list" | "track"` ✅ IMPLEMENTADO (sesión 26, PLIEGO-069)**
El loop no es boolean. Ciclo al hacer click: OFF → loop-lista → loop-track → OFF.
Implementado en PLIEGO-069. A partir de este Pliego, nunca usar boolean para `loop`.
`loopModeRef` es obligatorio para callbacks de YT (`onStateChange`) que no pueden tener stale closure sobre el estado React.
Icono triestado: `"off"` → `⟳` inactivo; `"list"` → `⟳` activo; `"track"` → `⟳¹` activo.

**ADR-008 — Cola siempre tiene prioridad sobre shuffle ⛔ REVERTIDO (sesión 27)**
Esta decisión se tomó en sesión 26 y se descartó inmediatamente tras el checklist. El razonamiento original era incorrecto: si la cola tiene prioridad sobre shuffle incondicionalmente, es imposible hacer shuffle de una playlist con cola activa. La convención estándar (ADR-009) establece que la cola manual tiene prioridad, pero shuffle debe poder operar sobre el contexto de lista igualmente. Pendiente Pliego de corrección en refactorización arquitectónica de PlayerContext (playbackContext + contextPointer + manualQueue).

**ADR-009 — Filosofía del reproductor: convención primero**
El objetivo es un reproductor mejor que los existentes en Android, con la capa de experiencia única del Bunker (Drops, Vault, estética Cyber-Vandal). La ventaja competitiva es esa capa, no la lógica de reproducción. La lógica de reproducción lleva 25 años resuelta.

Regla: toda decisión de arquitectura del reproductor parte de lo que hace un reproductor estándar (Winamp, foobar2000, YouTube Music) y solo se aparta de esa convención cuando hay una razón específica del Bunker documentada aquí. Sin razón documentada, se sigue la convención.

Convenciones base inamovibles:
- Cola manual tiene prioridad sobre shuffle, siempre
- Cambiar de track mientras suena → el nuevo track arranca
- Loop track → repite el track actual indefinidamente
- Loop list → vuelve al primero al llegar al final
- Sin loop + cola vacía → para
- Skip atrás < 3s → track anterior; > 3s → reiniciar actual

*Nota de implementación:* `masterVolume` vive en `PlayerContext` para que `SmokeSession` y otros módulos lo consuman. Esto es una decisión deliberada del Bunker, no una desviación de la convención.

---

## DEPENDENCIAS

**Tailwind CSS v3.4.19 — NO actualizar a v4**
v4 reescribió la arquitectura de configuración. La migración rompería el proyecto.

**React 18 + Vite — client-side puro**
No Next.js. Los componentes no necesitan `'use client'`.

**GIS OAuth2 (Google Identity Services)**
No usar la librería legacy de Google Sign-In.

**Scope `drive`**
Acceso completo al Drive del usuario. Necesario porque la DB es del admin y `drive.file` no cubre escritura cruzada. Aceptable mientras la app sea privada y en modo Testing.

---

## ESTRUCTURA DE CÓDIGO

**Estructura de carpetas consolidada (sesión 22):**
```
src/
  core/        GoogleDriveService.js · VaultContext.jsx · PlayerContext.jsx
  layout/      Layout.jsx · LoginScreen.jsx · App.jsx
  vault/       Vault.jsx
  musiclab/    MusicLab.jsx · WinampPlayer.jsx · AudioVisualizer.jsx
               TrackCard.jsx · AddTrackForm.jsx · DropsManager.jsx · PlaylistManager.jsx
  smoke/       SmokeSession.jsx
  tokens.js
```

**Un archivo = un dominio (mantenido)**
Evita falsos positivos en Ctrl+H entre conceptos distintos.

**Long press en TrackCard — MANTENIDO**
Para añadir a playlist sin cambiar de pestaña. `user-select: none` global mitiga selección accidental.

**Comportamientos web desactivados**
- pull-to-refresh: `overscroll-behavior: none` en body
- selección de texto: `user-select: none` global
- Botón ↺ siempre visible en header

**Pestaña Cola — condicional**
Invisible si la cola está vacía. Primera pestaña cuando tiene tracks.
Misma lógica para Drops: invisible si no hay drops recibidos pendientes ni guardados.

**Botones Editar/Eliminar — iconos sin texto (sesión 18)**
Botones 8×8 con icono único: `+` `✎` `−`. Sin texto.

---

## MUSICLAB UI — VIBE TAGS (sesión 18)
Decisión de producto: cinco vibes fijos. No ampliar sin decisión explícita.
```js
{ id: "all",         label: "ALL",    icon: "◈" }
{ id: "gaming",      label: "GAMING", icon: "◉" }
{ id: "420_chill",   label: "420",    icon: "◎" }
{ id: "dnb",         label: "DnB",    icon: "⚡" }
{ id: "romantiqueo", label: "♥",      icon: "♥" }
```
Los colores exactos y hex viven en el código (tokens.js). Esta sección documenta qué vibes existen y por qué, no los valores visuales.

---

## WORKFLOW

**Edu siempre pica el código salvo que indique lo contrario.**
- Siempre SEARCH/REPLACE para Ctrl+H, o archivo completo para Ctrl+A + pegar.
- Agrupar Pliegos relacionados en una sola respuesta.
- Minimizar tokens: features + bugs pueden compartir Pliego si son del mismo archivo.
- PowerShell no admite `&&` — comandos en líneas separadas.

**Workflow B — Síncrono (principal)**
1. `git status` + `git diff [hash] src/Archivo.js`
2. Identificar Pliego en PLIEGOS.md
3. Pedir SEARCH/REPLACE exactos
4. Verificar SEARCH: `Get-Content src/Archivo.js | Select-Object -Index (N..M)`
5. Aplicar Ctrl+H en VS Code
6. Verificar resultado, pegar output a Claude para OK
7. `git add src/Archivo.js` (línea separada)
   `git commit -m "PLIEGO-00X: descripción"` (línea separada)

**Workflow A — Asíncrono (fallback)**
Prerequisito: `ollama list` + `ollama run qwen3:14b`.
Dar a Qwen el Pliego + bloque de código literal. Timer 20 min.
Si Qwen falla: rechazar, cambiar a Workflow B. No reintentar más de una vez.

---

## SETUP Y HERRAMIENTAS
- **WSL2 + Ubuntu 24.04** — pendiente
- **Open WebUI** — pendiente (depende de WSL2)
- **Ollama en Windows nativo** — mantener hasta semana estable en WSL2
- **Gemini 2.5 Pro** — segundo arquitecto en aistudio.google.com. Usar cuando Claude llegue al límite.
- **Aider** — descartado. Reevaluar en 6-12 meses.
