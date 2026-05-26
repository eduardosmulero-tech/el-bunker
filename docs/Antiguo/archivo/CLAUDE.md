# CLAUDE.md — el_bunker

## PROYECTO
App privada tipo bóveda de memoria para una pareja (Edu y David). Estética Cyber-Vandal. Serverless: todo persiste en Google Drive API v3. PWA instalable en Android exclusivamente.

**PRODUCCIÓN:** https://el-bunker-beige.vercel.app
PWA instalada en Android de Edu y David. Testing activo con feedback humano real.

## STACK
React 18 · Vite · Tailwind CSS v3.4.19 · Framer Motion · Google Drive API v3 · GIS OAuth2 · Web Audio API · Service Worker (PWA)

## ESTRUCTURA DE ARCHIVOS
```
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
```

## USUARIOS
| Cuenta | Rol |
|---|---|
| thebunker.admin@gmail.com | Admin — dueño OAuth, DB en su Drive |
| bansovi.py@gmail.com | Edu |
| dcgdozt@gmail.com | David |
| thebunker.musica@gmail.com | Biblioteca música — sin login |

Whitelist hardcoded en `CONFIG.USERS` de GoogleDriveService.js.

## CONFIGURACIÓN
- `VITE_GOOGLE_CLIENT_ID` — en .env y Vercel env vars. Nunca subir a GitHub.
- `VITE_GOOGLE_SHARED_FOLDER_ID=1wHc-UeuZ-JsD7k-6Q53j7gNtCqfXb1MV`
- DB: `the_vault_database.json` en carpeta `the_vault_data` del Drive de Admin.
- Colas: `queue_[userId].json` en la misma carpeta.
- Schema actual: **v3.4.0** · migración automática desde v1, v2, v3.0.0–v3.3.0.

## API SURFACE — GoogleDriveService.js
> Leer antes de generar Pliegos sobre persistencia o auth. Evita lecturas de archivo innecesarias.

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

## SCOPES OAUTH
```
openid · email · profile
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```
`drive` — necesario porque la DB es del admin y `drive.file` no cubre escritura cruzada.

## GIT Y DEPLOY
- Rama: **master** (nunca main)
- Git user.email: bansovi.py@gmail.com
- Vercel conectado a GitHub, trigger automático en push a master.

## REGLAS DE ORO

**Edu es desarrollador novato — Claude es el responsable técnico.**
Si Edu propone algo que contradice una convención establecida o una decisión anterior, Claude lo dice antes de generar el Pliego. Si hay conflicto entre lo que Edu pide y lo que es técnicamente correcto, Claude prioriza lo correcto y lo explica. Edu tiene la última palabra, pero Claude no calla si ve un error.

**Convenciones antes de arquitectura propia.**
Para patrones con más de 10 años de historia establecida (reproductores, colas, auth flows), seguir las convenciones del estándar web salvo indicación explícita de Edu. Si la API nativa lo resuelve (HTMLAudioElement, YouTube iframe API, MediaSession), no reinventarlo. Ver ADR-009 en DECISIONES.md.

**Archivo antes de diagnóstico.**
Para cualquier bug, el archivo afectado se adjunta antes de pedir diagnóstico. No se hace arqueología con Select-Object en sesión.

**Estado conocido antes de Pliegos nuevos.**
Al inicio de sesión, confirmar o descartar todos los Pliegos "sin testing" antes de abrir trabajo nuevo. Si no se puede testear, se marca "sin confirmar" y no se toca.

**Un bug = una causa.**
Si varios síntomas comparten causa raíz, un solo Pliego los agrupa. No un Pliego por síntoma. Al registrar un bug nuevo, incluir causa probable. Si no está clara, el bug queda como "sin diagnóstico" hasta que se investigue.

**Edu pica el código salvo que diga lo contrario.** Siempre bloques SEARCH/REPLACE exactos para Ctrl+H, o archivo completo para Ctrl+A + pegar. Nunca diffs ni instrucciones genéricas.

**Resolución de formato (SEARCH/REPLACE vs archivo completo).**
Por defecto, usar siempre SEARCH/REPLACE exacto. Usar archivo completo SOLO cuando el archivo tenga menos de 80 líneas o el Pliego afecte a más del 40% del documento.

**Un Pliego = un archivo.** Agrupar Pliegos relacionados en una sola respuesta.

**Archivos críticos** (GoogleDriveService.js, VaultContext.jsx, PlayerContext.jsx, sw.js): modelo `qwen3-14b-think` + revisión cruzada post-Cline.

**Principio de modificación mínima** — solo tocar lo estrictamente necesario.

**Criterio de éxito antes del Pliego.**
Antes de generar el SEARCH/REPLACE, Claude define el comportamiento observable que confirma que el Pliego funciona. No "el código existe en el archivo" sino "el usuario hace X y pasa Y". Si no se puede definir, el Pliego no está listo para generarse.

**Scope lock.**
Una vez iniciado un Pliego, no se añaden cambios adicionales en conversación. Lo nuevo que aparezca va a ESTADO.md como bug nuevo.

**Regresión = explicación antes de fix.**
Cuando un Pliego introduce un bug nuevo, Claude explica por qué antes de generar el fix. Sin explicación, no hay Pliego.

**ADR y convenciones son vinculantes.**
Si Edu pide algo que contradice un ADR o una convención documentada, Claude para, lo señala, y pide confirmación explícita antes de continuar. Sin confirmación, no genera el Pliego.

**Cierre de sesión obligatorio.**
Antes de terminar: marcar Pliegos aplicados en PLIEGOS.md, marcar qué se testeó en ESTADO.md, etiquetar lo que queda "sin confirmar", anotar bugs nuevos. Sin cierre, la siguiente sesión empieza con deuda invisible.

**Sincronización de bloqueos** — al confirmar decisión que desbloquea Pliegos → actualizar PLIEGOS.md en el mismo momento.

**Arranque de sesión** — leer los 5 documentos completos antes de generar cualquier Pliego, en este orden: `CLAUDE.md` → `ESTADO.md` → `DECISIONES.md` → `CUENTAS.md` → `PLIEGOS.md`. El número siguiente y estado real de bloqueos viven en PLIEGOS.md, no aquí.

**Loop es triestado** — `loopMode: "off" | "list" | "track"`. Nunca boolean. Ver ADR-007 en DECISIONES.md.

## WORKFLOW HUMANO
- SEARCH/REPLACE listos para Ctrl+H, o archivo completo para Ctrl+A + pegar.
- Comandos PowerShell de verificación junto al Pliego.
- Si SEARCH no coincide: avisar, no repetir el Pliego.
- Commits con `master`. PowerShell no admite `&&` — comandos en líneas separadas.

## REGLA DE MODELOS
| Modelo | Cuándo |
|---|---|
| qwen3-8b-nothink | < 20 líneas, CSS, textos, renombrados |
| qwen3-8b-think | < 20 líneas con lógica, props simples |
| qwen3-14b-nothink | > 100 líneas, lógica de estado, integraciones |
| qwen3-14b-think | auth, Drive API, Service Worker, bugs complejos, datos persistidos |

## REFERENCIAS
| Doc | Contenido |
|---|---|
| ESTADO.md | Bugs activos con prioridad + errores resueltos + deuda técnica |
| PLIEGOS.md | Próximo número + pendientes (hot) + historial (cold) |
| DECISIONES.md | ADRs y decisiones de diseño tomadas |
| CUENTAS.md | Cuentas, OAuth y gestión de bibliotecas |
