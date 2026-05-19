# CLAUDE.md — el_bunker

## QUÉ ES ESTE PROYECTO
App privada tipo bóveda de memoria para una pareja (Edu y David). Estética Cyber-Vandal. Arquitectura serverless: todo persiste en Google Drive API v3, sin base de datos externa. PWA instalable en Android.

**ESTADO: EN PRODUCCIÓN** — https://el-bunker-beige.vercel.app
PWA instalada en Android de Edu y David. Testing activo con feedback humano real.

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

**ESTADO SESIÓN 10:** Experiencia core del reproductor estabilizada. Bugs críticos de bloqueo de login por el sistema de drops (ERROR 32/31) y persistencia OAuth2 sin popup (Bug B) resueltos. Reproductor WinampPlayer funcional con skip/loop/shuffle reparado. Modales excluyentes corregidos y persistencia de edición cableada en App.jsx. Eliminados comportamientos web nativos (pull-to-refresh, selección de texto) pero manteniendo el uso del long-press. Deploy en master. Ver sesion_registro.md para el estado actual.

CONFIGURACIÓN
Variable de entorno: VITE_GOOGLE_CLIENT_ID en .env (nunca subir a GitHub)

Variable de entorno: VITE_GOOGLE_SHARED_FOLDER_ID=1wHc-UeuZ-JsD7k-6Q53j7gNtCqfXb1MV en .env

Schema de datos: v3.2.0 con migración automática desde v1, v2, v3.0.0 y v3.1.0

DB: the_vault_database.json en carpeta the_vault_data del Drive de Admin.

Colas de reproducción (Opción B): Archivos separados queue_[userId].json en la misma carpeta.

NÚMERO SIGUIENTE DE PLIEGO: PLIEGO-028

REDISEÑO MUSICLAB (SESIÓN 8 — PENDIENTE DE IMPLEMENTAR)
Ver sesion_registro.md para desglose completo. Resumen:
- Pestañas: Cola (condicional) · Tracks · Lists · Drops (condicional)
- Botones por pestaña: Añadir · Editar · Eliminar
- Drops: favoritos (enviados y recibidos), visibilidad condicional
- Cola: reordenable, eliminar por track, botón añadir a cola
- Editar/Eliminar: modal con lista completa. Eliminar tiene botón ✕ inline por track. Editar abre formulario precargado al seleccionar. IMPLEMENTADO en PLIEGO-018/019.

REGLA CRÍTICA PARA PLIEGOS
GoogleDriveService.js, VaultContext.jsx y sw.js son archivos de alto riesgo.
Cualquier Pliego que los toque usa qwen3-14b-think obligatoriamente, sin excepción.
Después de que Cline aplique el cambio, pedir revisión cruzada antes de confirmar en el navegador.

NUEVA REGLA DE ORO — DOCUMENTAR ANTES DE CERRAR SESIÓN
Antes de cerrar sesión, volcar siempre resultados de testing a errores_conocidos.md y sesion_registro.md. No dejar resultados sueltos en el chat. Si Edu intenta cerrar sin documentar, recordárselo.

NUEVA REGLA DE ORO — WORKFLOW HUMANO PICANDO CÓDIGO
Preguntar siempre quién pica el código al inicio de sesión.
Si es humano (Ctrl+H en VS Code):
- Los pliegos se entregan con bloques SEARCH/REPLACE listos para Ctrl+H, sin formato Qwen.
- Los comandos de comprobación se entregan junto al pliego.
- El commit y push usan master, no main.
- Si el SEARCH no encuentra coincidencia, NO repetir el pliego — avisar solamente.

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
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
Justificaciones:

drive — acceso completo a Drive. Necesario porque la DB es propiedad de la cuenta admin y `drive.file` no cubre escritura cruzada sobre archivos de otra cuenta aunque estén en carpeta compartida. PLIEGO-016 (18 mayo 2026).

userinfo.email + userinfo.profile — imprescindibles para login (ver ERROR 2).

openid + email + profile — base GIS OAuth2.

Nota: drive.appdata eliminado en PLIEGO-009 (17 mayo 2026).


---

