# DECISIONES.md — el_bunker
> Solo crece. Se modifica al tomar una nueva decisión arquitectónica o de diseño.

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
Estado de reproducción centralizado en `PlayerContext.jsx`. Expone: `activeTrack`, `isPlaying`, `localQueue`, `loop`, `shuffle`, `autoPlaySignal`, refs YT/Audio, `skip`, `addToQueue`, `removeFromQueue`, `playTrack`, `startPolling`, `stopPolling`.
`App.jsx` envuelve `AppCore` con `<PlayerProvider userId tracks>`.
`WinampPlayer` y `MusicLab` consumen el contexto via `usePlayer()`.
Criterio de éxito: audio no se corta al cambiar de pestaña.

*Enmienda Sesión 21 (Auditoría Forense):* El elemento físico `<audio>` de HTML y la inicialización asíncrona de reproductores externos deben instanciarse y renderizarse fijamente dentro de la raíz del árbol en `PlayerProvider`. Queda estrictamente prohibido delegar la existencia de etiquetas multimedia persistentes a subcomponentes de páginas mutables (`WinampPlayer.jsx`, `MusicLab.jsx`), blindando la PWA contra la interrupción del ciclo de vida del DOM de audio durante la navegación por pestañas.

**Schema actual: v3.4.0**
Incluye `music_lab.playlists`, tracks con type/drive_file_id/youtube_url, drops con `favorited`/`favorited_by`.
Migración automática desde v1, v2, v3.0.0–v3.3.0.
NO modificar schema sin evaluar impacto en migración y actualizar `CONFIG.SCHEMA_VERSION`.

**Solo 3 usuarios autorizados**
Whitelist fija en `CONFIG.USERS` de GoogleDriveService.js.

**PWA con Service Worker**
Cache-first para assets estáticos. Network-first para googleapis.com. Bypass para youtube.com, ytimg.com, googlevideo.com. No cambiar esta estrategia sin motivo crítico.

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

**Extracción de componentes MusicLab — estructura plana → carpetas (sesión 18+)**
MusicLab se extrajo a 6 archivos planos en sesión 15 (PLIEGO-035/036). En sesión 19 se reorganizan en subcarpetas.

Estructura objetivo aprobada:
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

Reglas para PLIEGO-053:
- Solo mover archivos y actualizar imports. Cero cambios de lógica.
- Un único Pliego por carpeta de destino (o uno solo si son pocos archivos).
- Verificar build limpio tras cada movimiento antes de continuar.
- Vite resuelve imports relativos; actualizar todos los `./Archivo` afectados.

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
UI-01 resuelto. Botones 8×8 con icono único: `+` `✎` `−`. Sin texto.

---

## MUSICLAB UI — VIBE TAGS (sesión 18)
```js
{ id: "all",         label: "ALL",    icon: "◈", color: "#ffffff"  }  // blanco — diferenciado de 420
{ id: "gaming",      label: "GAMING", icon: "◉", color: "#00ffcc" }
{ id: "420_chill",   label: "420",    icon: "◎", color: "#aaff44" }  // label corto
{ id: "dnb",         label: "DnB",    icon: "⚡", color: "#ff6b35" }
{ id: "romantiqueo", label: "♥",      icon: "♥", color: PURPLE    }  // solo icono — resuelve truncado
```

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
