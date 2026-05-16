# CLAUDE.md — el_bunker

## QUÉ ES ESTE PROYECTO
App privada tipo bóveda de memoria para una pareja (Edu y David). Estética Cyber-Vandal. Arquitectura serverless: todo persiste en Google Drive API v3, sin base de datos externa. PWA instalable en Android.

## STACK
- React 18, Vite, Tailwind CSS v3.4.19, Framer Motion, Google Drive API v3, GIS OAuth2, Web Audio API, Service Worker (PWA)
- Dispositivos target: Android exclusivamente

## ARCHIVOS CLAVE
```
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
```

## USUARIOS Y CUENTAS
```
thebunker.admin@gmail.com → rol: admin  (dueño del OAuth, la DB vive en su Drive)
bansovi.py@gmail.com      → rol: edu
dcgdozt@gmail.com         → rol: david
```
Whitelist hardcoded en `CONFIG.USERS` de GoogleDriveService.js.

## CONFIGURACIÓN
- Variable de entorno: `VITE_GOOGLE_CLIENT_ID` en `.env` (nunca subir a GitHub)
- Schema de datos: v3.0.0 con migración automática desde v1 y v2
- DB: `the_vault_database.json` en appDataFolder de la cuenta Admin

## REGLA CRÍTICA PARA PLIEGOS
GoogleDriveService.js, VaultContext.jsx y sw.js son archivos de alto riesgo.
Cualquier Pliego que los toque usa **qwen3-14b-think** obligatoriamente, sin excepción.
Después de que Cline aplique el cambio, pedir revisión cruzada antes de confirmar en el navegador.

## DECISIONES INAMOVIBLES
Ver: `decisiones_tecnicas.md`

## ERRORES CONOCIDOS Y RESUELTOS
Ver: `errores_conocidos.md`

## ESTADO ACTUAL Y PENDIENTES
Ver: `sesion_registro.md`

## ROADMAP Y BUGS CONFIRMADOS
Ver: `docs/ROADMAP.md`
