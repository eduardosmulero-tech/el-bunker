# architecture.md

# Architecture

## Objetivo del sistema
Proveer una PWA serverless tipo bóveda de memoria y reproductor musical colaborativo, utilizando Google Drive API como única fuente de verdad y almacenamiento persistente (Zero-Trust con whitelist estricta).

## Módulos principales

### Playback Engine
- Responsabilidades: Coordinar la reproducción activa, estado de play/pause, volume, cross-module play (Drive vs YouTube), y WakeLock.
- Dependencias: `PlayerContext.jsx`, API HTML5 `<audio>`, API iframe de YouTube.
- Estados que controla: `activeTrack`, `isPlaying`, `masterVolume`, `activeVibe`.

### Queue Engine
- Responsabilidades: Manejar la cola local, saltos (skip), loop, shuffle y sincronización con Drive.
- Dependencias: `PlayerContext.jsx`, `GoogleDriveService.js` (fetchQueue/saveQueue).
- Estados que controla: `localQueue`, `loopMode`, `shuffle`, `autoPlaySignal`.

### YouTube Engine
- Responsabilidades: Instanciar y controlar el reproductor invisible de YouTube fuera del árbol de React, reportar progreso a la UI.
- Dependencias: Iframe API de YouTube (`window.YT`), `WinampPlayer.jsx` (para el polling visual).
- Estados que controla: `ytPlayerRef` (instancia imperativa), `currentTime` (UI local).

### Persistence Engine
- Responsabilidades: Autenticación OAuth, migraciones, lecturas/escrituras de la base de datos (JSON) y drops.
- Dependencias: `VaultContext.jsx`, `GoogleDriveService.js`.
- Estados que controla: `db`, `user`, `authStatus`, `bootPhase`, `dbStatus`.

### Playlist Engine
- Responsabilidades: Crear, editar y eliminar listas de reproducción locales inyectadas al contexto de Vault.
- Dependencias: `MusicLab.jsx`, `PlaylistManager.jsx`, `VaultContext.jsx` (para mutar DB).
- Estados que controla: Derivados de `db.music_lab.playlists`.

---

# Relaciones entre módulos

| Módulo | Depende de | Expone |
|---|---|---|
| App (Router) | VaultContext | Vista activa (`ActivePage`) |
| PlayerContext | VaultContext (userId, tracks) | APIs de control de media, cola, mutadores locales, `masterVolume`, `activeVibe` |
| MusicLab | VaultContext, PlayerContext | Interfaz de gestión musical, drops y playlist |
| WinampPlayer | PlayerContext | Controles visuales, canvas visualizador (via AudioVisualizer) |

---

# Problemas actuales detectados

- **App.jsx como God Component Routing:** Mezcla la lógica de enrutamiento con la lógica de negocio profunda (`patchDb`).
- **Contexto Monolítico:** `VaultContext` asume demasiadas responsabilidades simultáneas (Red, Autenticación, Estado UI).
- **Fuga de responsabilidades:** Sincronización de colas con Drive (`fetchQueue`/`saveQueue`) ocurre en `PlayerContext`, mezclando red y UI.

---

# Objetivos de refactor

- Desacoplar la mutación de la DB (`onAddTrack`, `onEditTrack`) del enrutador `App.jsx`.
- Separar `VaultContext` en capas aisladas (Auth/DB Layer, Domain Layer, UI State Layer).
- Extraer Side-Effects de red del `PlayerContext` a Custom Hooks dedicados.