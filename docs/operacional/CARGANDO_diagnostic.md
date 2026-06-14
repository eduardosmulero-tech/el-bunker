# CARGANDO SERVICIOS... hang diagnostic
> Fecha: 2026-06-14 · Sesion: S87 · Bloque: Phase 2.5 BLOQUE 1 (P0 diagnostics)
> Hallazgo: browser-use verification S86 (commit 15326f0) detecto que la app se queda colgada en 'CARGANDO SERVICIOS...' en prod (https://el-bunker-beige.vercel.app), mientras que en localhost llegaba al LoginScreen.

## Sintoma

- App carga bundle React (title 'El Bunker' aparece)
- Se queda en spinner 'CARGANDO SERVICIOS...' indefinidamente
- Console warning: `Cross-Origin-Opener-Policy policy would block the window.closed call` (regresion vs. localhost donde el warning aparece pero la app sigue)
- Worker API reachable: `curl https://el-bunker-api.thebunker-admin.workers.dev/api/playlists` devuelve 200
- OAuth wall esperado (no es el problema actual — el problema es ANTES del OAuth)

## 3 causas posibles

### Causa 1: Worker API init falla en el boot de Google Services

- El boot de Google Services hace fetch a `el-bunker-api.thebunker-admin.workers.dev/api/...` para inicializar el estado
- Si uno de los 4 endpoints nuevos del S84 (`/api/playlists/reorder`, `PUT/DELETE /api/playlists/:id/tracks`, `PATCH /api/playlists/:id`) devuelve error, el boot puede romperse
- Verificacion: Network tab en DevTools — buscar requests a `el-bunker-api.thebunker-admin.workers.dev` que devuelvan 4xx/5xx

### Causa 2: CORS policy bloquea el init

- El Cross-Origin-Opener-Policy warning sugiere que las policies de cross-origin estan bloqueando algo
- Verificacion: Network tab — buscar requests con status CORS error o preflight OPTIONS que fallen

### Causa 3: Google OAuth init bloqueado por el bundle de Vercel

- El bundle de Vercel puede tener un timing diferente al de localhost
- Verificacion: Network tab — buscar requests a `accounts.google.com` o `gapi.loaded_0` que fallen

## Pasos de diagnostic manual (2-3 min)

1. Abre https://el-bunker-beige.vercel.app en Chrome local
2. Abre DevTools (F12) → tab Console + Network
3. Filtra Network por `domain:el-bunker-api.thebunker-admin.workers.dev`
4. Recarga la pagina
5. Captura TODOS los requests al Worker API:
   - URL completa
   - Status code (200/4xx/5xx/CORS error)
   - Request method (GET/POST/PUT/DELETE/PATCH)
6. Filtra Network por `domain:accounts.google.com` o `gapi`
7. Captura requests a Google OAuth que fallen
8. Console: filtra por `error` o `warning` y captura los primeros 5-10 verbatim
9. Comparte los resultados

## Fixes probables (depende del diagnostic)

- Si Worker API devuelve 404: re-ejecutar `wrangler deploy` (ya desplegado en commit bbf5738, pero podria haber un deploy rollback)
- Si CORS falla: revisar headers CORS en worker.js, asegurar que OPTIONS preflight responde 200
- Si Google OAuth falla: revisar `gapi.loaded_0` callback, posiblemente un cambio en la inicializacion

## Out of scope

- browser-use no puede llegar al app shell autenticado (OAuth wall + CARGANDO hang ambos lo bloquean)
- El diagnostic manual es el unico metodo definitivo para identificar la causa raiz
