# PROYECTO.md — el_bunker
> Qué es el sistema, stack y configuración. Descriptivo — puede estar stale máximo una sesión.
> Última actualización: S64 — Target browser policy + CSS4 audit (Junio 2026).

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
| Cloudflare D1 | Base de datos SQL (SQLite-compatible) | ✅ Desplegado — 17 tablas |
| Cloudflare R2 | Almacenamiento de archivos (MP3, fotos, vídeos, docs) | ✅ Desplegado |
| Cloudflare Workers | API REST (22 endpoints) + JWT auth | ✅ Desplegado |

---

## TARGET BROWSERS

Política de navegadores soportados. Congela el alcance del proyecto y previene que futuros devs añadan features (CSS4, ES2020+, APIs) que asuman soporte más amplio del real.

| Browser | Soporte | Notas |
|---|---|---|
| Chrome Android 90+ (Apr 2021) | ✅ Target principal | Único browser oficialmente soportado en producción |
| Samsung Internet 14+ | ✅ Soportado | Chromium-based (v14 ships Chromium 87, ~3 versiones por detrás de Chrome 90) |
| Edge Android 90+ | ✅ Soportado | Chromium-based |
| Chrome desktop (dev) | ✅ Dev only | Para testing y desarrollo — la app no está optimizada para desktop |
| Firefox Android | ⚠️ No testeado | Probablemente funciona, pero no es target |
| iOS Safari (cualquier versión) | ❌ Fuera de target | Decisión de producto: Edu y David usan Android |
| IE / Edge legacy | ❌ Fuera de target | Sin Service Worker, la app no carga |
| Chrome <90 / pre-2021 | ❌ Fuera de target | No se prioriza retro-compatibilidad (floor del `browserslist`) |

**Razón técnica:** `public/manifest.json` declara `display: "standalone"` + `orientation: "portrait-primary"`. La app requiere Service Worker (registrado en `src/layout/App.jsx`), requisito excluyente de IE y Edge legacy. El target es Android PWA exclusivo.

**Configuración:** `package.json` declara `browserslist: ["Chrome >= 90", "not dead"]` (commit `fc1cddc`). Esto alinea autoprefixer / Tailwind / Babel con el target real y evita que añadan polyfills para navegadores fuera de scope.

**Implicación para CSS / JS:** Se pueden usar features CSS4 (`:has()`, `@container`, `clamp()`, `gap` en flex, `inset`, `env()`, etc.) y ES2020+ sin polyfill para iOS Safari legacy o IE. El `autoprefixer` no emitirá prefixes para Safari <16, Firefox <103, etc. — son navegadores fuera de target.

**Reportes de bugs fuera de target:** Si un usuario reporta problemas en iOS Safari, IE, Edge legacy o Chrome <90, la respuesta por defecto es "fuera de target" — no es un bug a arreglar. Edu y David son los únicos usuarios y usan Android Chrome. Si en el futuro se quiere extender el target (p. ej. dar soporte a iOS Safari o a un Samsung más viejo), abrir un ADR explícito — no es decisión de un commit individual.

**Historia:** Esta política se formalizó en S64 (Junio 2026) tras el CSS4 audit (commits `3ef1d10`, `fc1cddc`) que confirmó que el codebase ya era compatible con el target y que el `browserslist` implícito de autoprefixer estaba sobre-incluyendo navegadores innecesariamente.

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
    WinampPlayer.jsx         — Controles visuales; el playback vive en PlayerContext
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
  schema.sql                 — Schema D1: 17 tablas normalizadas

tools/
  pliego_apply.py            — Script para aplicar pliegos SEARCH/REPLACE
  NUKE_schema.sh            — Script DROP+CREATE atómico para D1 (gate "NUKE", auto-snapshot pre-DROP)
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

## D1 MIGRATION FLOW

**REGLA DURA (S64a): `tools/deploy_d1_migration.sh` NO debe ejecutarse nunca más como "deploy" rutinario.** D1 es la fuente de verdad post-S54; ese script es solo para setup inicial. Re-ejecutarlo o re-correr `tools/migrate_drive_to_d1.py` desde el JSON stale (`tools/the_vault_database.json` lleva sin actualizarse desde el 31 de mayo) sobre-escribe datos reales con datos de testing y BORRA entries/drops/eras/files (el export JSON no captura esas entidades).

### Flujo correcto (cualquier migración)

```
1. SNAPSHOT del estado actual de D1
   bash tools/snapshot_d1.sh
   → crea tools/snapshots/d1_YYYYMMDD_HHMMSS.json

2. INSPECCIONAR el snapshot (opcional pero recomendado)
   jq '.counts' tools/snapshots/d1_<timestamp>.json

3. MIGRAR con safety gate (solo si el JSON origen es más nuevo que el snapshot)
   python3 tools/migrate_drive_to_d1.py --file <json> --jwt <jwt>
   → El script compara D1 vs JSON. Si D1 tiene MÁS filas, ABORTA.
   → Para forzar (ej. recovery explícito): añadir --force

4. RESTAURAR desde snapshot (solo si algo va mal)
   # tools/restore_d1.sh — pendiente (Sprint 8.3+)
```

### Safety gates (S64+)

| Script | Gate | Override |
|---|---|---|
| `tools/migrate_drive_to_d1.py` | Aborta si D1 > JSON en alguna tabla | `--force` (registra intención explícita) |
| `tools/NUKE_schema.sh` | Requiere escribir literal `NUKE` por stdin + auto-snapshot pre-DROP | (ninguno — sin "NUKE" o sin snapshot, aborta) |
| `tools/deploy_d1_migration.sh` | Banner de deprecation: aborta salvo `DEPLOY_OK=1` | `DEPLOY_OK=1` (recovery explícito, requiere leer doc) |

### Snapshots

- **Ubicación:** `tools/snapshots/`
- **Formato:** JSON con `_meta` (timestamp, db, tool), `counts` (resumen) y `data` (filas completas por tabla)
- **Retención:** mantener los últimos 5 snapshots. Borrar los más antiguos manualmente.
- **Restore:** pendiente — `tools/restore_d1.sh` en Sprint 8.3+

### Anti-patrones prohibidos

- ❌ `bash tools/deploy_d1_migration.sh` sin haber hecho snapshot antes
- ❌ `python3 tools/migrate_drive_to_d1.py` sin snapshot
- ❌ `bash tools/NUKE_schema.sh` sin escribir "NUKE" y sin snapshot
- ❌ `bash tools/deploy_d1_migration.sh` (deprecado — aborta con banner)

### Historia

- **S54:** se introduce `recreate_schema.sh` y `deploy_d1_migration.sh` para la migración inicial Drive→D1.
- **S64:** se documenta este flujo tras 3 pérdidas de datos. Se añaden safety gates (gate "D1 > JSON" en `migrate_drive_to_d1.py`, gate "NUKE" en `recreate_schema.sh`) y herramienta de snapshot.
- **S64a:** rename `recreate_schema.sh` → `NUKE_schema.sh` (mismo gate, nuevo nombre auto-documentado). `deploy_d1_migration.sh` recibe banner de deprecation — está prohibido re-ejecutarlo sin `DEPLOY_OK=1`.

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
