# PROYECTO.md — el_bunker
> Qué es el sistema, stack y configuración. Descriptivo — puede estar stale máximo una sesión.
> Última actualización: S63 — Worker CRUD eras + files (Junio 2026).

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
| Google Drive API | v3 | deprecado — en proceso de eliminación (ADR-024) |

### Stack desplegado (post-S54)

| Tecnología | Rol | Estado |
|---|---|---|
| Cloudflare D1 | Base de datos SQL (SQLite-compatible) | ✅ Desplegado — 16 tablas |
| Cloudflare R2 | Almacenamiento de archivos (MP3, fotos, vídeos, docs) | ✅ Desplegado |
| Cloudflare Workers | API REST (22 endpoints) + JWT auth | ✅ Desplegado |

---

## ESTRUCTURA DE ARCHIVOS

```
src/
  core/
    GoogleDriveService.js    — Auth OAuth2 + API Drive (deprecado, transición)
    VaultContext.jsx         — Estado global de BD y autenticación
    PlayerContext.jsx        — Estado global de reproducción (ADR-004)
    FileUploadService.js     — Subida unificada a R2 (ADR-022)
    StatsEngine.js           — Emisor/agregador de eventos (ADR-019)
  layout/
    App.jsx                  — Root: routing de tabs, providers
    Layout.jsx               — Shell visual: header, nav, grid, glows
    LoginScreen.jsx          — Pantalla de login
  vault/
    Vault.jsx                — Motor VAULT: Eras, widgets, entradas
    AddEntryForm.jsx         — Formulario polimórfico para entradas
    VaultGallery.jsx         — Galería 6 modos (ADR-021)
  musiclab/
    MusicLab.jsx             — Orquestación principal Music Lab
    WinampPlayer.jsx         — Reproductor visual (único <audio>)
    AudioVisualizer.jsx      — Visualizador de audio
    TrackCard.jsx            — Card de track + VibeTagBar
    TagManager.jsx           — Gestor de tags/vibes
    PlaylistManager.jsx      — Modales de playlist
    AddTrackForm.jsx         — Formulario añadir/editar track
    DropsManager.jsx         — Sistema de drops
    useMusicActions.js       — Custom hook: acciones de MusicLab
  capsules/
    Capsules.jsx             — Tab CAPSULES con 4 sub-tabs
    Timeline.jsx             — Feed cronológico unificado
    SmokeSession.jsx         — Temporizador con fade-out
    TimeCapsules.jsx         — Cápsulas del tiempo
    Recaps.jsx               — Resúmenes semanales/mensuales/anuales
  tokens.js                  — Design tokens, colores, paletas de vibe
  main.jsx                   — Entry point Vite

workers/
  worker.js                  — Worker CF: 22 endpoints REST + JWT auth
  schema.sql                 — Schema D1: 16 tablas normalizadas

tools/
  pliego_apply.py            — Script para aplicar pliegos SEARCH/REPLACE
  recreate_schema.sh         — Script DROP+CREATE atómico para D1
  deploy_d1_migration.sh     — Deploy de migraciones D1
  migrate_drive_to_d1.py     — Migración unidireccional Drive JSON → D1
  cargar_contexto.py         — Carga de contexto de proyecto
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

### API SURFACE — Workers (22 endpoints)

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/health` | GET | Health check (DB + auth) |
| `/api/auth/login` | POST | Login OAuth2 → JWT |
| `/api/tracks` | GET/POST | Listar/crear tracks |
| `/api/tracks/:id` | PATCH/DELETE | Editar/soft-delete track |
| `/api/playlists` | GET/POST | Listar/crear playlists |
| `/api/playlists/:id` | PATCH/DELETE | Editar/eliminar playlist |
| `/api/playlists/:id/tracks` | POST | Añadir track a playlist |
| `/api/tags` | GET/POST | Listar/crear tags |
| `/api/tags/:id` | PATCH/DELETE | Editar/eliminar tag |
| `/api/drops` | GET/POST | Listar/enviar drops |
| `/api/entries` | GET/POST | Listar/crear entradas VAULT (con tags+files) |
| `/api/entries/:id` | GET/PATCH/DELETE | Detalle/editar/soft-delete entrada |
| `/api/eras` | GET/POST | Listar/crear eras (con entry_count) |
| `/api/eras/:id` | GET/PATCH/DELETE | Detalle/editar/hard-delete era |
| `/api/files` | GET | Listar archivos con filtros |
| `/api/queue/:user` | GET/PUT | Leer/guardar cola de usuario |
| `/api/events` | GET/POST | Query/emitir eventos (append-only) |
| `/api/time_capsules` | GET/POST | Listar/crear cápsulas de tiempo |
| `/api/time_capsules/:id` | PATCH | Desbloquear cápsula |
| `/api/upload` | POST | Generar pre-signed key para R2 |
| `/api/upload/:key` | PUT | Subir binario directo a R2 |

Auth: JWT (HMAC-SHA256) vía header `Authorization: Bearer <token>`. 24h expiry.
URL base: `https://el-bunker-api.thebunker-admin.workers.dev`
