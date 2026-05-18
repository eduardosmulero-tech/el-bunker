# CLAUDE.md — el_bunker

## QUÉ ES ESTE PROYECTO
App privada tipo bóveda de memoria para una pareja (Edu y David). Estética Cyber-Vandal. Arquitectura serverless: todo persiste en Google Drive API v3, sin base de datos externa. PWA instalable en Android.

**ESTADO: EN PRODUCCIÓN** — https://el-bunker-beige.vercel.app
Sesión 7 en curso. PWA instalada en Android de Edu y David. Testing activo con feedback humano real.

## STACK
- React 18, Vite, Tailwind CSS v3.4.19, Framer Motion, Google Drive API v3, GIS OAuth2, Web Audio API, Service Worker (PWA)
- Dispositivos target: Android exclusivamente

## ARCHIVOS CLAVE
```text
src/
  GoogleDriveService.js   ← toda la lógica de Drive y Auth. ARCHIVO CRÍTICO.
  VaultContext.jsx        ← estado global de la app
  App.jsx                 ← routing y estructura principal
  Layout.jsx              ← layout y navegación
  LoginScreen.jsx         ← flujo OAuth
  Vault.jsx               ← módulo de memorias
  MusicLab.jsx            ← reproductor de música
  SmokeSession.jsx        ← módulo de sesiones
public/
  sw.js                   ← Service Worker. TOCAR CON CAUTELA.
  manifest.json           ← config PWA
USUARIOS Y CUENTAS
Plaintext
thebunker.admin@gmail.com   → rol: admin  (dueño del OAuth, la DB vive en su Drive)
bansovi.py@gmail.com        → rol: edu
dcgdozt@gmail.com           → rol: david
thebunker.musica@gmail.com  → rol: biblioteca (almacenamiento de música — pendiente de integrar, ver ROADMAP Fase 3)
Whitelist hardcoded en CONFIG.USERS de GoogleDriveService.js.

NUEVA REGLA DE ORO — BIBLIOTECAS ANTES DEL DEPLOY
Música, fotos y vídeo funcionales en Android son prerequisito del deploy.
La cuenta thebunker.musica@gmail.com existe como biblioteca de almacenamiento.
El sistema de Bibliotecas tiene lógica completa en GoogleDriveService.js pero CERO UI.
Esta decisión eleva las Bibliotecas de Fase 4 a Fase 3 (pre-deploy).
No hacer deploy hasta que al menos música sea funcional desde la UI. (✅ Completado en sesión 5, deploy desbloqueado).

**ESTADO SESIÓN 7:** MusicLab resuelto (PLIEGO-014). Bug crítico era `toast` no declarado con useState — ReferenceError silencioso en primer render. Fix aplicado y en producción.

CONFIGURACIÓN
Variable de entorno: VITE_GOOGLE_CLIENT_ID en .env (nunca subir a GitHub)

Variable de entorno: VITE_GOOGLE_SHARED_FOLDER_ID=1wHc-UeuZ-JsD7k-6Q53j7gNtCqfXb1MV en .env

Schema de datos: v3.2.0 con migración automática desde v1, v2, v3.0.0 y v3.1.0

DB: the_vault_database.json en carpeta the_vault_data del Drive de Admin.

Colas de reproducción (Opción B): Archivos separados queue_[userId].json en la misma carpeta.

NÚMERO SIGUIENTE DE PLIEGO: PLIEGO-015

REGLA CRÍTICA PARA PLIEGOS
GoogleDriveService.js, VaultContext.jsx y sw.js son archivos de alto riesgo.
GoogleDriveService.js, VaultContext.jsx y sw.js son archivos de alto riesgo.
Cualquier Pliego que los toque usa qwen3-14b-think obligatoriamente, sin excepción.
Después de que Cline aplique el cambio, pedir revisión cruzada antes de confirmar en el navegador.

DECISIONES INAMOVIBLES
Ver: decisiones_tecnicas.md

ERRORES CONOCIDOS Y RESUELTOS
Ver: errores_conocidos.md

ESTADO ACTUAL Y PENDIENTES
Ver: sesion_registro.md

SCOPES OAUTH REQUERIDOS
openid
email
profile
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
Justificaciones:

drive.file — necesario para crear/modificar archivos en carpeta compartida (ADR-001).

drive.readonly — usado por lógica de Bibliotecas (congelada hasta post-testing, mantener declarado).

userinfo.email + userinfo.profile — imprescindibles para login (ver ERROR 2).

openid + email + profile — base GIS OAuth2.

Nota: drive.appdata eliminado en PLIEGO-009 (17 mayo 2026).


---

### 2. `decisiones_tecnicas.md` (Reemplazar todo)
```markdown
# DECISIONES TÉCNICAS — el_bunker
> Solo se modifica cuando se toma una nueva decisión arquitectónica.
> No mezclar con estado de sesión ni pendientes.

---

## ARQUITECTURA

**Sin base de datos externa (ADR-001: Propiedad de la Base de Datos)**
Todo persiste en Google Drive mediante archivos JSON. La base de datos vive ahora en una carpeta estándar del Drive de `thebunker.admin` compartida explícitamente con los usuarios. Requiere la variable `VITE_GOOGLE_SHARED_FOLDER_ID`.

**Cola de reproducción por usuario (ADR-002: Storage de la Cola - Opción B)**
Para evitar conflictos de concurrencia y respetar el estado emocional individual, la cola de reproducción no se guarda en la base de datos principal, sino en archivos separados `queue_edu.json` y `queue_david.json` dentro de la misma carpeta compartida en Drive. Persistencia optimista.

**Solo 3 usuarios autorizados**
No hay registro público. La whitelist es fija en CONFIG.USERS de GoogleDriveService.js.

**Schema v3.2.0**
Incluye soporte para `music_lab.playlists` y migración automática desde versiones anteriores. No modificar el schema sin evaluar impacto en la migración.

**PWA con Service Worker**
Estrategia cache-first para assets estáticos. Network-first para googleapis.com. Versionado dinámico automatizado (`__BUNKER_SW_VERSION__`) en build-time. No cambiar esta estrategia sin motivo crítico.

---

## DEPENDENCIAS

**Tailwind CSS v3.4.19 — NO actualizar a v4**
Tailwind v4 reescribió la arquitectura de configuración. La migración rompería el proyecto. Ver errores_conocidos.md ERROR 1.

**React 18 + Vite**
No Next.js. La app es client-side pura. Los componentes NO necesitan 'use client'.

**GIS OAuth2 (Google Identity Services)**
No usar la librería legacy de Google Sign-In. GIS es la implementación actual requerida por Google.

---

## SCOPES OAUTH REQUERIDOS
openid
email
profile
https://www.googleapis.com/auth/drive.file

---

## PRINCIPIO DE MODIFICACIÓN MÍNIMA
Solo modificar los archivos estrictamente necesarios para resolver el bug o implement