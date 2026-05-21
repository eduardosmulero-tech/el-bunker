# CLAUDE.md — el_bunker

## PROYECTO
App privada tipo bóveda de memoria para una pareja (Edu y David). Estética Cyber-Vandal. Serverless: todo persiste en Google Drive API v3. PWA instalable en Android exclusivamente.

**PRODUCCIÓN:** https://el-bunker-beige.vercel.app
PWA instalada en Android de Edu y David. Testing activo con feedback humano real.

## STACK
React 18 · Vite · Tailwind CSS v3.4.19 · Framer Motion · Google Drive API v3 · GIS OAuth2 · Web Audio API · Service Worker (PWA)

## ESTRUCTURA DE ARCHIVOS
src/
GoogleDriveService.js   ← Drive + Auth. CRÍTICO.
VaultContext.jsx        ← estado global app. CRÍTICO.
PlayerContext.jsx       ← estado global reproducción (ADR-004). CRÍTICO.
App.jsx                 ← routing y estructura
Layout.jsx              ← layout y navegación
LoginScreen.jsx         ← flujo OAuth
Vault.jsx               ← módulo memorias
MusicLab.jsx            ← orquestación Music Lab (~720 líneas)
AudioVisualizer.jsx     ← visualizador canvas
WinampPlayer.jsx        ← reproductor + controles (consume PlayerContext)
TrackCard.jsx           ← TrackCard + VibeTagBar
AddTrackForm.jsx        ← formulario añadir/editar track
DropsManager.jsx        ← DropComposeModal + DropAlertModal + DropsHistory
PlaylistManager.jsx     ← PlaylistNameInput + PlaylistModal
SmokeSession.jsx        ← módulo sesiones
tokens.js               ← design tokens
public/
sw.js                   ← Service Worker. CRÍTICO.
manifest.json           ← config PWA


**Próxima sesión — reorganización src/ en carpetas:**
src/
core/          ← GoogleDriveService.js · VaultContext.jsx · PlayerContext.jsx
layout/        ← Layout.jsx · LoginScreen.jsx · App.jsx
vault/         ← Vault.jsx
musiclab/      ← MusicLab.jsx · WinampPlayer.jsx · AudioVisualizer.jsx
TrackCard.jsx · AddTrackForm.jsx · DropsManager.jsx · PlaylistManager.jsx
smoke/         ← SmokeSession.jsx
tokens.js      ← en raíz de src/


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
- Schema actual: **v3.4.0** con migración automática desde v1, v2, v3.0.0–v3.3.0.

## SCOPES OAUTH
openid · email · profile
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile

- `drive` — necesario porque la DB es del admin y `drive.file` no cubre escritura cruzada.
- `drive.appdata` — eliminado (PLIEGO-009).

## GIT Y DEPLOY
- Rama: **master** (nunca main)
- Git user.email: bansovi.py@gmail.com
- Vercel conectado a GitHub, trigger automático en push a master.

## REGLAS DE ORO

**Edu pica el código salvo que diga lo contrario.** Siempre bloques SEARCH/REPLACE exactos para Ctrl+H, o archivo completo para Ctrl+A + pegar. Nunca diffs ni instrucciones genéricas.

**Un Pliego = un archivo.** Agrupar Pliegos relacionados en una sola respuesta.

**Archivos críticos** (GoogleDriveService.js, VaultContext.jsx, PlayerContext.jsx, sw.js): modelo `qwen3-14b-think` + revisión cruzada post-Cline.

**Principio de modificación mínima** — solo tocar lo estrictamente necesario.

**Workflow humano:**
- SEARCH/REPLACE listos para Ctrl+H, o archivo completo para Ctrl+A + pegar.
- Comandos PowerShell de verificación junto al Pliego.
- Si SEARCH no coincide: avisar, no repetir el Pliego.
- Commits con `master`. PowerShell no admite `&&` — comandos en líneas separadas.

**Sincronización de bloqueos** — al confirmar decisión que desbloquea Pliegos → actualizar PLIEGOS.md en el mismo momento.

**Arranque de sesión** — leer los 5 documentos completos antes de generar cualquier Pliego. El número siguiente y estado real de bloqueos están en PLIEGOS.md, no en el chat.

## REGLA DE MODELOS
| Modelo | Cuándo |
|---|---|
| qwen3-8b-nothink | < 20 líneas, CSS, textos, renombrados |
| qwen3-8b-think | < 20 líneas con lógica, props simples |
| qwen3-14b-nothink | > 100 líneas, lógica de estado, integraciones |
| qwen3-14b-think | auth, Drive API, Service Worker, bugs complejos, datos persistidos |

## NÚMERO SIGUIENTE DE PLIEGO
**PLIEGO-065**

## REFERENCIAS
- Estado actual, bugs y próxima sesión → ESTADO.md
- Decisiones arquitectónicas → DECISIONES.md
- Registro de pliegos → PLIEGOS.md
- Cuentas, OAuth y bibliotecas → CUENTAS.md