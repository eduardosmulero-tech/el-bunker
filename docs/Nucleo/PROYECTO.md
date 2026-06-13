# PROYECTO.md — el_bunker
> Qué es el sistema, stack y configuración. Descriptivo — puede estar stale máximo una sesión.
> Última actualización: S49 — Refundación del producto (Junio 2026).

---

## QUÉ ES

App privada tipo bóveda de memoria y reproductor musical para una pareja (Edu y David).
Estética Cyber-Vandal / Winamp. PWA instalable en Android exclusivamente.

**3 módulos principales:**
- **VAULT** — Motor de contenido: Eras, entradas, documentos, fotos, galería 6 modos.
- **MUSIC LAB** — Motor de audio: tracks, playlists, drops, tags, reproducción, escucha compartida.
- **CAPSULES** — Capa de experiencias temporales: Timeline, Smoke Session, Time Capsules, RECAP.

**Producción:** https://el-bunker-beige.vercel.app
PWA instalada en Android de Edu y David. Testing activo con feedback humano real.

---

## STACK

| Tecnología | Versión | Notas |
|---|---|---|
| React | 18 | client-side puro, sin Next.js |
| Vite | — | bundler |
| Tailwind CSS | 3.4.19 | NO actualizar a v4 |
| Framer Motion | — | animaciones |
| Web Audio API | — | visualizador, reactividad acústica |
| Service Worker | — | PWA |
| Google OAuth2 | — | solo auth (ADR-025). Whitelist 3 usuarios |
| Google Drive API | v3 | transición — deprecado como BD (ADR-024) |

### Stack futuro (post-migración D1)

| Tecnología | Rol |
|---|---|
| Cloudflare D1 | Base de datos SQL (SQLite-compatible, serverless) |
| Cloudflare R2 | Almacenamiento de archivos (MP3, fotos, vídeos, docs) |
| Cloudflare Workers | API thin REST layer entre SPA y D1/R2 |

---

## ESTRUCTURA DE ARCHIVOS

```
src/
  core/
    GoogleDriveService.js    — Auth OAuth2 + API Drive (transición)
    VaultContext.jsx         — Estado global de BD y autenticación
    PlayerContext.jsx        — Estado global de reproducción (ADR-004)
  layout/
    App.jsx                  — Root: routing de tabs, providers
    Layout.jsx               — Shell visual: header, nav, grid, glows
    LoginScreen.jsx          — Pantalla de login
  vault/
    Vault.jsx                — Motor VAULT: Eras, widgets, entradas
    VaultGallery.jsx         — [FUTURO] Galería 6 modos (ADR-021)
  musiclab/
    MusicLab.jsx             — Orquestación principal Music Lab
    WinampPlayer.jsx         — Reproductor visual
    AudioVisualizer.jsx      — Visualizador de audio
    TrackCard.jsx            — Card de track + VibeTagBar
    TagManager.jsx           — Gestor de tags/vibes
    PlaylistManager.jsx      — Modales de playlist
    AddTrackForm.jsx         — Formulario añadir/editar track
    DropsManager.jsx         — Sistema de drops
    useMusicActions.js       — Custom hook: acciones de MusicLab
  capsules/
    Capsules.jsx             — [FUTURO] Tab CAPSULES con 4 sub-tabs
    Timeline.jsx             — [FUTURO] Feed cronológico unificado
    SmokeSession.jsx         — Temporizador con fade-out
    TimeCapsules.jsx         — [FUTURO] Cápsulas del tiempo
    Recaps.jsx               — [FUTURO] Resúmenes semanales/mensuales/anuales
  services/
    FileUploadService.js     — [FUTURO] Subida unificada a R2 (ADR-022)
    StatsEngine.js           — [FUTURO] Emisor/agregador de eventos (ADR-019)
  tokens.js                  — Design tokens, colores, paletas de vibe
  main.jsx                   — Entry point Vite
```

---

## USUARIOS

| Cuenta | Rol |
|---|---|
| thebunker.admin@gmail.com | Admin — dueño OAuth |
| bansovi.py@gmail.com | Edu |
| dcgdozt@gmail.com | David |

Whitelist hardcoded en `CONFIG.USERS` de `GoogleDriveService.js`. 3 usuarios máximo (ADR-006).

---

## CONFIGURACIÓN

- `VITE_GOOGLE_CLIENT_ID` — en .env y Vercel env vars. Nunca subir a GitHub.
- `VITE_GOOGLE_SHARED_FOLDER_ID=1wHc-UeuZ-JsD7k-6Q53j7gNtCqfXb1MV` — transición
- DB actual: `the_vault_database.json` en carpeta `the_vault_data` del Drive de Admin.
- DB futura: Cloudflare D1 (ADR-024).
- Colas: `queue_[userId].json` en Drive → futuro tabla `queue_items` en D1.
- Schema actual: **v5.0.0** · JSON Drive durante la transición.

---

## GIT Y DEPLOY

- Rama: **master** (nunca main)
- Git user.email: bansovi.py@gmail.com
- Vercel conectado a GitHub, trigger automático en push a master.

---

## API SURFACE — GoogleDriveService.js (transición)

| Método | Descripción |
|---|---|
| `initialize()` | Restaura sesión desde localStorage; retorna user o null |
| `signIn()` | Popup GIS OAuth2; escribe token en localStorage |
| `signOut()` | Limpia localStorage + revoca token |
| `_getAccessToken()` | Lee token de localStorage; lanza si expirado |
| `_refreshToken()` | Renueva token GIS |
| `loadDatabase()` | Descarga `the_vault_database.json`; ejecuta migración si schema desactualizado |
| `patchDb(fn)` | Lee DB → aplica `fn(prev)` → escribe → retorna nueva DB |
| `getStreamUrl(fileId)` | Retorna URL autenticada para stream MP3 desde Drive |
| `uploadMusicFile(file, folderId)` | Sube MP3 a carpeta biblioteca; retorna `drive_file_id` |
| `fetchQueue(userId)` | Lee `queue_[userId].json` |
| `saveQueue(userId, queue)` | Escribe `queue_[userId].json` |

### API SURFACE — Workers (futuro)

| Endpoint | Descripción |
|---|---|
| `GET /api/events` | Query a tabla `events` para Timeline/RECAP/stats |
| `POST /api/events` | Emitir evento (playback, entry_create, drop, etc.) |
| `GET /api/entries?era_id=X` | Entradas de una Era |
| `POST /api/entries` | Crear entrada del VAULT |
| `GET /api/tracks` | Listar tracks |
| `POST /api/upload/sign` | Generar pre-signed URL para R2 |
