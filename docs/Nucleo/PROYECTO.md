# PROYECTO.md — el_bunker
> Qué es el sistema, stack y configuración. Descriptivo — puede estar stale máximo una sesión.

---

## QUÉ ES

App privada tipo bóveda de memoria para una pareja (Edu y David). Estética Cyber-Vandal.
Serverless: todo persiste en Google Drive API v3. PWA instalable en Android exclusivamente.

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
| Google Drive API | v3 | única persistencia |
| GIS OAuth2 | — | no usar librería legacy |
| Web Audio API | — | visualizador |
| Service Worker | — | PWA |

---

## ESTRUCTURA DE ARCHIVOS
src/
core/
GoogleDriveService.js
VaultContext.jsx
PlayerContext.jsx
layout/
App.jsx · Layout.jsx · LoginScreen.jsx
vault/
Vault.jsx
musiclab/
MusicLab.jsx · WinampPlayer.jsx · AudioVisualizer.jsx
TrackCard.jsx · AddTrackForm.jsx · DropsManager.jsx · PlaylistManager.jsx
smoke/
SmokeSession.jsx
tokens.js · main.jsx

---

## USUARIOS

| Cuenta | Rol |
|---|---|
| thebunker.admin@gmail.com | Admin — dueño OAuth, DB en su Drive |
| bansovi.py@gmail.com | Edu |
| dcgdozt@gmail.com | David |
| thebunker.musica@gmail.com | Biblioteca música — sin login |

Whitelist hardcoded en `CONFIG.USERS` de `GoogleDriveService.js`.

---

## CONFIGURACIÓN

- `VITE_GOOGLE_CLIENT_ID` — en .env y Vercel env vars. Nunca subir a GitHub.
- `VITE_GOOGLE_SHARED_FOLDER_ID=1wHc-UeuZ-JsD7k-6Q53j7gNtCqfXb1MV`
- DB: `the_vault_database.json` en carpeta `the_vault_data` del Drive de Admin.
- Colas: `queue_[userId].json` en la misma carpeta.
- Schema actual: **v3.4.0** · migración automática desde v1, v2, v3.0.0–v3.3.0.

---

## GIT Y DEPLOY

- Rama: **master** (nunca main)
- Git user.email: bansovi.py@gmail.com
- Vercel conectado a GitHub, trigger automático en push a master.

---

## API SURFACE — GoogleDriveService.js

| Método | Descripción |
|---|---|
| `initialize()` | Restaura sesión desde localStorage; retorna user o null |
| `signIn()` | Popup GIS OAuth2; escribe token en localStorage |
| `signOut()` | Limpia localStorage + revoca token |
| `_getAccessToken()` | Lee token de localStorage; lanza si expirado |
| `_refreshToken()` | Renueva token GIS; si falla → limpia localStorage y fuerza signIn() |
| `loadDatabase()` | Descarga `the_vault_database.json`; ejecuta migración si schema desactualizado |
| `patchDb(fn)` | Lee DB → aplica `fn(prev)` → escribe → retorna nueva DB |
| `getStreamUrl(fileId)` | Retorna URL autenticada para stream MP3 desde Drive |
| `uploadMusicFile(file, folderId)` | Sube MP3 a carpeta biblioteca; retorna `drive_file_id` |
| `fetchQueue(userId)` | Lee `queue_[userId].json`; retorna array de tracks |
| `saveQueue(userId, queue)` | Escribe `queue_[userId].json` |
| `markLibraryHeartbeat(libId)` | Actualiza `last_heartbeat` en DB para la biblioteca |
| `refreshLibraryCapacity(libId)` | Consulta quota Drive de la biblioteca; actualiza DB |