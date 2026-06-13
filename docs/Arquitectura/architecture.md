---
describe: PlayerContext.jsx, VaultContext.jsx, App.jsx, GoogleDriveService.js
sincronizado_con: S49 (Refundación del producto)
stale_si_pliego_toca: PlayerContext.jsx, VaultContext.jsx, App.jsx
---

# Architecture

## Objetivo del sistema
PWA serverless tipo bóveda de memoria y reproductor musical colaborativo para una pareja.
Estética Cyber-Vandal. Persistencia en Cloudflare D1+R2 vía Workers.

## Módulos principales (post-S49)

### VAULT — Motor de contenido
Responsable de: eras, entries, documentos, fotos, tags de contexto, galería 6 modos.
Dueño del dato de contenido. Sin audio propio.
Archivos: `src/vault/Vault.jsx`, `src/vault/VaultGallery.jsx` [futuro]

### MUSIC LAB — Motor de audio
Responsable de: tracks, playlists, drops, tags de vibe, reproducción, escucha compartida.
ÚNICO módulo que instancia `<audio>`. Mini-player persistente sobre todas las tabs.
Archivos: `src/musiclab/*`, `src/core/PlayerContext.jsx`

### CAPSULES — Capa de experiencias temporales
4 sub-tabs: Timeline, Smoke Session, Time Capsules, RECAP.
Cliente de VAULT y MusicLab — no dueño del dato.
Archivos: `src/capsules/*` [futuro], `src/smoke/SmokeSession.jsx`

### Persistence Engine (transición)
Actualmente: `VaultContext.jsx` + `GoogleDriveService.js` → Drive JSON.
Futuro: Workers API → D1 (SQL) + R2 (archivos).

### Stats Engine
Tabla `events` en D1 — append-only. Todos los módulos emiten eventos.
Agregador común genera: RECAPs, Timeline feed, stats de escucha.
Archivos: `src/services/StatsEngine.js` [futuro]

---

## Relaciones entre módulos

| Módulo | Depende de | Expone |
|---|---|---|
| App (Router) | VaultContext | Vista activa (3 tabs) |
| PlayerContext | VaultContext (userId, tracks) | APIs de control de media, cola, `trackVibe` |
| MusicLab | VaultContext, PlayerContext | Interfaz de gestión musical + reproducción |
| VAULT | VaultContext | Galería, Eras, entradas |
| CAPSULES | VAULT, MusicLab, StatsEngine | Timeline, Smoke, Capsules, RECAP |
| WinampPlayer | PlayerContext | Controles visuales, canvas visualizador |

---

## Cambios S49
- YouTube Engine eliminado (M1). Motor exclusivo: HTMLAudioElement + R2.
- Google Drive JSON deprecado como BD (ADR-024).
- 3 tabs definitivos: VAULT · MUSIC LAB · CAPSULES (ADR-017).
- CAPSULES como capa de experiencias, no dueña de datos.
- Galería 6 modos, motor de stats único, FileUploadService unificado.
