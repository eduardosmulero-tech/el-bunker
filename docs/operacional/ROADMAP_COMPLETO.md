# 🗺️ ROADMAP COMPLETO — El Búnker (S112 → S120)

> **Para**: deepseek-pro-v4 o IA equivalente. **Persistencia**: arrancar leyendo este archivo después de los docs de Nucleo.
> **Generado**: tras 3 auditorías profundas (Drive, Worker/D1, App.jsx/Layout). Refleja el estado REAL del proyecto, no el declarado.
> **Total estimado**: 32 sesiones, ~70h concentrado.
> **Última actualización**: Junio 2026.

---

## ⚠️ REGLAS INAMOVIBLES (Aplican a TODAS las sesiones)

1. **NO tocar código sin leer primero**: `docs/Nucleo/SESION.md` → `ESTADO.md` → `BACKLOG.md` → `docs/Arquitectura/INDEX.md` → `CONTRATO.md` (27 ADRs).
2. **CONTRATO.md es ley**. 7 inamovibles: motor audio único, 3 tabs, stats engine único, OAuth2 solo auth, SEARCH contenedor lógico, Drive solo OAuth, 3 usuarios whitelist.
3. **SEARCH/REPLACE contenedor lógico completo** (ADR-015). NUNCA micro-edición.
4. **D1 es source of truth** para TODA persistencia desde Fase 3 (S115-D). Drive solo para OAuth2 (ADR-025).
5. **WorkerClient singleton** para todas las llamadas API desde S115-D2. NO prop drilling de `jwtToken`.
6. **Validación obligatoria por sesión**: `npm run lint` + `npm test` + `npm run build` + manual smoke.
7. **Code review** con `code-reviewer-minimax-m3` después de cada cambio significativo.
8. **Un pliego = un commit** con mensaje `tipo(scope): descripción`.
9. **Actualizar** `SESION.md` y `ESTADO.md` al cerrar cada sesión.
10. **Conventional Commits**: `feat`, `fix`, `refactor`, `chore`, `style`, `test`, `docs`.
11. **PROTOCOLO DE ROLLBACK** si una sesión falla a mitad:
    - `git revert HEAD` → deshace el último commit manteniendo historial.
    - `git reset --hard HEAD~1` → solo si el commit NO está pusheado.
    - Para S115-D (Drive→D1): restaurar `tools/snapshots/drive_<timestamp>.json` al estado de `tools/the_vault_database.json` antes de la migración.
    - Documentar incidente en `docs/legacy/ERRORES_RESUELTOS.md` con causa raíz + fix.

---

## 1. RESUMEN EJECUTIVO

| Métrica | Declarado | Real tras 3 auditorías |
|---|---|---|
| Features completas | ~82% | ⚠️ **~65%** |
| Bugs P0 (crash/data loss) | 0 | 🔴 **8** (B1, B2, B3, V1, V2, V3, V4, V5) |
| Bugs P1 (funcional) | varios | 🔴 **13** (B8 ya resuelto en S111, ver §2.2) |
| Bugs P2 (UX/polish) | varios | 🟡 **32** (B9-B22, V9-V11, A6-A9, D3-D4, T1-T8) |
| Vulnerabilidades seguridad | 0 | 🔴 **11** |
| Discrepancias con specs/ADR | 0 | 🔴 **9** |
| Inconsistencias de tokens | 0 | 🟡 **8** |
| ESLint errores | 0 | ✅ |
| Drive funciones activas | "transición" | 🔴 **27** + 6 gapi calls |
| JWT storage | OK | 🔴 localStorage (XSS) |

**Conclusión**: funcional pero no profesional. 3 problemas raíz: dual-write Drive/D1, falta de cliente API unificado, shell monolítico. Resolver esos 3 desbloquea el 80% restante.

---

## 2. INVENTARIO DE BUGS Y VULNERABILIDADES

### 2.1 CRÍTICOS (P0) — bloquean producción

| ID | Archivo:Línea | Bug |
|---|---|---|
| **B1** | `src/core/PlayerContext.jsx:175-183` | `loopMode="track"` + skip(-1) no respeta ADR-009 (3s) ni playHistory |
| **B2** | `src/core/PlayerContext.jsx:570-590` | useEffect vibe con `setActiveVibe(null)` → bucle garantizado |
| **B3** | `src/musiclab/MusicLab.jsx:handleRemoveFromQueue` | Race condition con softDeletedIds, `setActiveTrack(next)` antes de mutación |
| **V1** | `workers/worker.js:13,49,65` | JWT secret fallback hardcoded — cualquiera puede firmar tokens |
| **V2** | `workers/worker.js:619-650` | Cola multi-tenant sin auth — edu puede leer/escribir cola de david |
| **V3** | `workers/worker.js:567-580` | Path traversal en upload — `filename` no sanitizado |
| **V4** | `workers/worker.js:580-595` | Upload ownership sin validar — cualquiera escribe a cualquier r2_key |
| **V5** | `workers/worker.js` (capsules) | Capsule unlock sin validar server-side |

### 2.2 ALTOS (P1) — funcionalidad rota

| ID | Archivo:Línea | Bug |
|---|---|---|
| **B4** | `src/core/PlayerContext.jsx:228-237` | Duplicados en `addToQueue(force=true)` |
| **B5** | `src/core/PlayerContext.jsx:268-281` | Soft-delete revive a los 3s (setTimeout cleanup) |
| **B6** | `src/core/PlayerContext.jsx:~210` | Shuffle regen race condition (último track) |
| **B7** | `src/musiclab/MusicLab.jsx:handlePlDrop` | Drop inválido puede insertar `undefined` |
| ~~**B8**~~ | `src/musiclab/useMusicActions.js:onEditTrack` | ~~Track edit no esperaba D1 sync~~ ✅ **Resuelto en S111** (ver `CHANGELOG.md` v2.0.9) |
| **V6** | `workers/worker.js` (R2 stream) | R2 streaming sin auth |
| **V7** | `workers/worker.js` (drops PATCH) | `seen_at`/`favorited_at` sin constraints |
| **V8** | `workers/worker.js` (entries POST) | `era_id` no validado |
| **A1** | `src/layout/App.jsx:1-50` | No ErrorBoundary — crash = pantalla blanca |
| **A2** | `src/core/VaultContext.jsx:556-567` | `_buildDbFromWorker` se llama 2 veces en mismo bloque |
| **A3** | `src/core/VaultContext.jsx:126` | JWT en localStorage — XSS surface |
| **A4** | `src/layout/App.jsx:160-422` | JWT prop-drilling en 8+ componentes |
| **A5** | `src/core/VaultContext.jsx` Provider | Funciones en `value` no memoizadas → re-renders |
| **D1** | `src/core/GoogleDriveService.js` (1550 líneas) | 27 funciones de persistencia activas |
| **D2** | `src/core/VaultContext.jsx:_loadDriveComplement` | Dual-write silencioso Drive + D1 |

### 2.3 MEDIOS (P2) — UX y polish

**Audio (B8-B22, 15 bugs)**: race conditions menores, validaciones faltantes, mensajes no amigables en cola/history.

**Worker (V9-V11)**: `events.payload` sin límite de tamaño, `/api/eras` sin owner check, sin rate limiting.

**App (A6-A9)**: Capsules no resetea sub-tab, AnimatePresence flash, LoginScreen sin error feedback, signout no limpia `user`/`db`.

**D1 schema (D3-D4)**: 3 columnas huérfanas (`drops.related_drop_id`, etc.), 2 índices faltantes (`idx_events_user_time`, `idx_drops_recipient`).

**Tokens (T1-T8)**: 3 colores `PURPLE` hardcoded con valores distintos en Layout/Vault/SmokeSession. Spacing inconsistente (`p-4` vs `p-5` vs `p-6` sin razón).

---

## 3. PLAN MAESTRO EN 8 FASES

> **Convención IDs**: `S###-<fase>` donde fase es A=Audio, W=Worker, D=Drive, L=Layout, T=Tokens, P=Premium, R=RECAP, Q=QA.

---

### FASE 0 — ESTABILIZACIÓN DE LÓGICA CORE (S112, ~6h)
> **Objetivo**: cerrar P0 y P1 del PlayerContext + MusicLab.
> **Bloquea**: nada. **Paralelizable con**: Fase 1 (archivos diferentes).

#### S112-A — Cerrar 3 P0 de audio (45 min)
- **B1**: refactor `loopMode="track"` skip(-1) → si `currentTime < 3` seek a 0, si >=3 skip normal
- **B2**: eliminar `setActiveVibe(null)` del useEffect; mover lógica al trackVibe effect
- **B3**: reordenar `handleRemoveFromQueue` para que `setActiveTrack(next)` se ejecute DESPUÉS de la mutación de cola
- **Validación**: `npm run lint` + manual: skip(-1) en <3s no debe ir atrás
- **Commit**: `fix(player): close P0 audio bugs (B1 loop track, B2 vibe loop, B3 queue race)`

#### S112-B — Cerrar 4 P1 de cola y shuffle (1.5h)
- **B4**: `addToQueue(force=true)` con duplicado → eliminar existente antes de añadir
- **B5**: `softDeletedIds` cleanup debe ser permanente, no temporal. Eliminar `setTimeout`
- **B6**: shuffle regen → mover check `if (index >= length) reset` ANTES de acceder al índice
- **B7**: `handlePlDrop` → validar `from >= 0 && from < list.length && i >= 0 && i < list.length`
- **Validación**: manual — añadir mismo track 2x, queue tiene 1 instancia. Skip 5x rápido, no se rompe. Drop playlist inválido, no crashea.

#### S112-C — Polish cola y UX de audio (1.5h)
- B8-B15: race conditions menores en queue/history
- Mensajes de error amigables en QueueContext
- Confirmación visual al soft-delete (toast "Track eliminado, deshacer?")
- **Validación**: `npm run build` + manual smoke

#### S112-D — Tests de regresión de audio (1h)
- Crear `src/core/__tests__/PlayerContext.test.js` con vitest (10 tests):
  - play/pause/seek/skip/loop/shuffle
  - restorePosition desde localStorage
  - gapless no se rompe con skip rápido
- **Validación**: `npm test` debe pasar 10/10

---

### FASE 1 — SEGURIDAD DEL WORKER (S113-W, ~4h)
> **Objetivo**: cerrar 11 vulnerabilidades del Worker antes de añadir más features.
> **Bloquea**: Fases 2-7 (no se puede migrar Drive a D1 si D1 no es seguro).

#### S113-W — Hardening del Worker (4h)
- **V1**: Throw 500 si `env.JWT_SECRET` no está configurado en producción
  ```js
  if (!env.JWT_SECRET && env.ENVIRONMENT === 'production') {
    throw new Error('JWT_SECRET required');
  }
  ```
- **V2**: Validar `queueUser === userId` en `/api/queue/*` (GET y PUT)
- **V3**: Sanitizar `filename` con regex `/[^a-zA-Z0-9._-]/g` en `/api/upload`
- **V4**: Validar que `r2_key` empieza con `${userId}/` en `PUT /api/upload/:key`
- **V5**: Validar `unlock_at > now` server-side en `POST /api/capsules` y `PATCH`
- **V6**: Añadir signed query params para R2 streaming (HMAC del r2_key + userId + expiry)
- **V7**: Constraint `seen_at <= favorited_at` en D1 (CHECK constraint)
- **V8**: Validar `era_id` existe antes de INSERT en entries
- **V9**: Limitar `events.payload` a 4KB (return 413 si excede)
- **V10**: `/api/eras` POST/PATCH → validar `owner_id === userId` del JWT
- **V11**: Rate limiting básico (10 req/s por IP en `/api/*`)
- **Tests**: añadir `workers/__tests__/auth.test.js` con vitest workers
  - test 1: sin JWT_SECRET → 500
  - test 2: jwt edu intentando GET /api/queue/david → 403
  - test 3: upload con filename `../../etc` → sanitizado a `etc`
  - test 4: upload a r2_key de otro user → 403
  - test 5: capsule con unlock_at pasado → 400
- **Validación**: deploy + `npm test workers/` + manual: intento acceso cross-user → 403
- **Commit**: `fix(worker): harden security (V1-V11: JWT secret, queue auth, path traversal, upload ownership, capsule unlock, R2 streaming, constraints)`

---

### FASE 2 — WORKER REFACTOR (S114-W, ~3h)
> **Objetivo**: hacer el Worker mantenible antes de Fase 3+.

#### S114-W — Refactor Worker a estructura routes/ (3h)
- Crear `workers/routes/` con un archivo por recurso:
  ```
  workers/routes/
    auth.js       — POST /api/auth/login, POST /api/auth/refresh
    tracks.js     — CRUD tracks
    drops.js      — CRUD drops + PATCH visto/favorito
    playlists.js  — CRUD playlists + add/remove tracks
    entries.js    — CRUD entries
    eras.js       — CRUD eras
    tags.js       — CRUD tags
    queue.js      — GET/PUT queue
    capsules.js   — CRUD capsules
    events.js     — POST/GET events
    upload.js     — POST /api/upload, PUT /api/upload/:key
    health.js     — GET /api/health
    _middleware.js — verifyJWT, cors, rateLimit
  ```
- `worker.js` queda como router puro que dispatchea (`wc -l workers/worker.js` <300)
- **Validación**: `npm test workers/` debe pasar los mismos tests
- **Commit**: `refactor(worker): split worker.js into routes/`

---

### FASE 3 — DRIVE → D1 MIGRATION (S115-D, ~8h)
> **Objetivo**: eliminar 27 funciones de persistencia en Drive, dejar Drive solo para OAuth (ADR-025).
> **Bloquea**: Fases 4-7 (es prerrequisito para el nuevo shell y para features premium).

#### S115-D1 — Audit final de dependencias Drive (1h)
- `grep -r "GoogleDriveService\|gapi.client.drive" src/`
- Listar todas las funciones llamadas desde el código
- Confirmar que TODAS tienen reemplazo en Worker
- **Backup OBLIGATORIO antes de tocar** (procedimiento concreto):
  ```bash
  # Snapshot D1 (referencia) + JSON de Drive (legacy)
  bash tools/snapshot_d1.sh                              # → tools/snapshots/d1_<timestamp>.json
  cp tools/the_vault_database.json tools/snapshots/drive_<timestamp>.json
  cp tools/el_bunker_backup_*.json tools/snapshots/      # mantener últimos 3
  ```
- Sin backup confirmado → **NO** avanzar a S115-D2

#### S115-D2 — WorkerClient singleton (1h)
- Crear `src/core/WorkerClient.js`:
  ```js
  class WorkerClient {
    setToken(jwt) { this.token = jwt; }
    clearToken() { this.token = null; }
    async get(path) { return this._fetch('GET', path); }
    async post(path, body) { return this._fetch('POST', path, body); }
    async patch(path, body) { return this._fetch('PATCH', path, body); }
    async del(path) { return this._fetch('DELETE', path); }
    async _fetch(method, path, body) {
      // fetch con auth header, manejo de 401, logging opcional
    }
  }
  export const workerClient = new WorkerClient();
  ```
- **Validación**: unit test con mock fetch

#### S115-D3 — Migrar llamadas a WorkerClient (3h)
- **NO** pasar `jwtToken` como prop. Componentes usan `workerClient` directamente.
- Archivos a migrar:
  - `src/core/VaultContext.jsx` (8 llamadas fetch)
  - `src/musiclab/useMusicActions.js` (5 llamadas)
  - `src/layout/App.jsx` (6 llamadas)
  - `src/vault/Vault.jsx` (3 llamadas)
  - `src/vault/VaultGallery.jsx` (quitar `_jwtToken` muerto)
  - `src/core/FileUploadService.js` (1 llamada)
- **Patrón**:
  ```js
  // ANTES
  const { jwtToken } = useVault();
  fetch(API_BASE + '/tracks', { headers: { Authorization: `Bearer ${jwtToken}` }})
  // DESPUÉS
  import { workerClient } from '@/core/WorkerClient';
  workerClient.get('/tracks')
  ```
- **Validación**: `grep -r "jwtToken" src/components/` debe dar 0 resultados
- **Commit**: `refactor(api): migrate all API calls to WorkerClient singleton`

#### S115-D4 — Eliminar funciones de Drive (2h)
- Eliminar de `src/core/GoogleDriveService.js`:
  - `_findDatabaseFile`, `_createDatabaseFile`, `_readDatabaseFile`, `_updateDatabaseFile`
  - `initDatabase`, `fetchData`, `updateData`, `_triggerHeartbeat`, `triggerHeartbeat`
  - `_findQueueFile`, `_createQueueFile`, `_updateQueueFile`
  - `fetchQueue`, `saveQueue`, `clearQueue`
  - `addEra`, `updateEra`, `addEntry`, `addTrack`, `addDrop`, `removeTrack`, `updateTrack`
  - `addTag`, `updateTag`, `deleteTag`
  - `createPlaylist`, `addTrackToPlaylist`, `deletePlaylist`
  - `getStreamUrl` ← migrar a `src/core/WorkerClient.stream(r2_key)`
  - `addLibrary`, `updateLibrary`, `removeLibrary`, `markLibraryHeartbeat` (bibliotecas no son feature activa)
- Quedan solo: `initGoogleServices`, `requestAccessToken`, `signOut`, `isAuthenticated`, `onAuthChange`, `restoreToken`, `resolveUser`, `isAuthorizedEmail`, `_fetchGoogleProfile`
- `GoogleDriveService.js` queda en ~200 líneas
- Reducir `CONFIG.SCOPES` a solo `userinfo.email` + `userinfo.profile`
- **Validación**: `grep -r "drive.appdata\|drive.file\|drive.readonly" src/` debe dar 0. `grep -r "gapi.client.drive" src/` debe dar 0.
- **Commit**: `chore(drive): remove all Drive persistence, keep only OAuth (ADR-025)`

#### S115-D5 — Eliminar _loadDriveComplement (1h)
- En `src/core/VaultContext.jsx`, eliminar la función `_loadDriveComplement` completa
- Confirmar que `db.libraries` no se usa (búsqueda en código debe dar 0 referencias activas)
- Si hay referencias, migrar a `workerClient.get('/libraries')` con endpoint nuevo en D1
- **Validación**: login + add track + add entry + add playlist + reload → todo persiste en D1
- **Commit**: `chore(drive): remove dual-write _loadDriveComplement`

---

### FASE 4 — REFACTOR APP.JSX + LAYOUT (S116, ~4h)
> **Objetivo**: shell testeable, providers seguros, sin prop drilling.

#### S116-L1 — ErrorBoundary + providers seguros (1h)
- Envolver providers con `<ChunkErrorBoundary>` (ya existe `src/core/ChunkErrorBoundary.jsx`)
- Añadir fallback con botón "Reintentar" que llame `login()`
- **Validación**: throw artificial en un provider → se muestra fallback, no pantalla en blanco

#### S116-L2 — Split App.jsx monolítico (2h)
- `src/layout/App.jsx` → solo Providers + Router (`wc -l` <100)
- `src/layout/routes.jsx` → array `[{path, component}]`
- `src/layout/BootScreen.jsx` → extraído
- `src/layout/LoginGate.jsx` → extraído
- `src/layout/TabShell.jsx` → extraído de Layout
- `src/layout/NavBar.jsx` → extraído de Layout
- **Validación**: `npm run build` debe pasar, `wc -l src/layout/App.jsx` <100

#### S116-L3 — Memoización + signout completo (1h)
- `useCallback` para todas las funciones de `VaultContext`
- `useMemo` para el `value` del Provider
- Signout limpia: `setJwtToken(null); setUser(null); setDb(null); setAuthStatus('unauthenticated')`
- Mover JWT de `localStorage` a `sessionStorage` (limpia al cerrar tab)
- Añadir CSP meta tag en `index.html` para mitigar XSS
- **Validación**: manual — signout → login con mismo user → ve sus datos (no cache)

---

### FASE 5 — CONSISTENCIA VISUAL Y TOKENS (S117, ~3h)
> **Objetivo**: diseño unificado, sin token drift.

#### S117-T1 — Audit de tokens usados (1h)
- `grep -rE "#[0-9a-fA-F]{6}" src/ tailwind.config.js index.html` → listar colores hardcoded
  - ⚠️ **Incluir `tailwind.config.js`** (paleta extendida) y `index.html` (meta theme-color)
- Listar inconsistencies de spacing (`p-4` vs `p-5` vs `p-6` sin razón)
- Listar inconsistencies de font-size
- Output: `docs/operacional/audit_tokens.md`

#### S117-T2 — Migrar a tokens centralizados (2h)
- Reemplazar cada color hardcoded por `tokens.colors.X`
- Crear `tokens.spacing` con valores semánticos (`tokens.spacing.card`, `tokens.spacing.section`)
- Aplicar spacing consistente en Vault, MusicLab, Capsules, Layout
- **Validación**: `grep -rE "#[0-9a-fA-F]{6}" src/` → 0 fuera de `src/tokens.js`
- **Commit**: `style(tokens): migrate all hardcoded colors/spacing to design tokens`

---

### FASE 6 — FEATURES PREMIUM PENDIENTES (S118-P, ~12h)
> **Objetivo**: completar specs que faltan. **Bloqueado por F3+F4**.

#### S118-P1 — Gallery CINEMA con música ambiente de Era (3h)
- `src/vault/VaultGallery.jsx` modo CINEMA
- Al entrar → `workerClient.get('/tracks?era_id=X')`
- Crossfade entre foto y track activo según vibe de la era
- Botón "Skip track" + volumen ambiente slider
- **Validación**: entrar a CINEMA con era "verano 2024" → suena un track de esa era

#### S118-P2 — Gallery DIALOGUE con hilo conector (4h)
- `src/vault/VaultGallery.jsx` modo DIALOGUE
- Algoritmo: emparejar fotos de edu y david con <5min de diferencia
- Render: alternancia visual con línea SVG conectora
- Asimetría → eco visual (overlay fade-in)
- **Validación**: 2 fotos emparejadas → render con conector visible

#### S118-P3 — Gallery EXHIBITION canvas 2D (2h)
- `src/vault/VaultGallery.jsx` modo EXHIBITION
- Render con `<canvas>` no grid
- Agrupación por vibe/tag
- Layout orgánico (fuerza-directed sim básico)
- **Validación**: 10 fotos → render en canvas, no en grid

#### S118-P4 — Gallery MAP con líneas de viaje (3h)
- `src/vault/VaultGallery.jsx` modo MAP
- Leaflet o MapLibre
- Pines por coordenadas EXIF de fotos
- Líneas SVG entre pines consecutivos (slider temporal)
- **Validación**: 5 fotos con GPS → 5 pines + 4 líneas conectoras

#### S118-P5 — Live Sync (escucha compartida) (3h) ⚠️ BLOQUEADO ARQUITECTÓNICAMENTE
- **Prerrequisito de decisión arquitectónica** (ver §4): ¿WebSocket nativo en Worker, Durable Objects, o long-polling con `/api/sync/state`?
- **Recomendación**: empezar con long-polling (más simple, compatible con plan gratuito de CF). Migrar a Durable Objects en S121 si latencia >2s.
- Implementar `/api/sync/state` POST/GET con timestamp
- Indicador visual de escucha compartida activa
- **Validación**: edu play track X → david ve "Edu está escuchando X" en su UI

---

### FASE 7 — RECAP ANUAL GUARDABLE (S119, ~2h)
> **Objetivo**: cerrar ADR-026.

#### S119-R — RECAP anual como entrada VAULT (2h)
- `src/capsules/Recaps.jsx` → botón "Guardar RECAP anual como entrada"
- Al guardar: `workerClient.post('/entries', { type: 'recap', year: 2025, content: {...} })`
- Render especial en VAULT: tipo "recap" con icono y summary
- **Validación**: generar RECAP 2025 → guardar → aparece en VAULT

---

### FASE 8 — REGRESSION SUITE (S120, ~3h)
> **Objetivo**: tests automatizados para no romper en el futuro.

#### S120-QA — Suite completa de tests (3h)
- **Audio tests** (S112-D): 10 tests
- **Worker auth tests** (S113-W): 5 tests
- **Drive migration tests** (S115-D): `grep` debe confirmar 0 refs a Drive persistence
- **Visual regression** (S117): 1 test por componente con screenshot
- **E2E manual smoke**: script bash con curl al worker que valida 5 endpoints
- **CI**: añadir workflow de CI (`.github/workflows/ci.yml` si se usa GitHub Actions, o equivalente en Vercel/CF) que corre `npm test` + `npm run build` + `npm run lint` en cada PR. Verificar primero `.github/workflows/` existente o configurar según plataforma de deploy.
- **Validación**: `npm test` → 15/15 tests pasan, `npm run build` → 0 errores, `npm run lint` → 0 warnings

---

## 4. MAPA DE DEPENDENCIAS

```
FASE 0 (S112 audio bugs) ─┐
                          │
FASE 1 (S113-W security) ─┼─→ FASE 2 (S114-W refactor)
                          │             │
                          │             ↓
                          │     FASE 3 (S115-D drive→D1) ─┐
                          │             │                │
                          │             ↓                ↓
                          │     FASE 4 (S116 refactor shell)
                          │             │
                          │             ↓
                          └─→ FASE 5 (S117 tokens)
                                        │
                                        ↓
                                FASE 6 (S118-P premium) ← bloqueado por F3+F4
                                        │
                                        ↓
                                FASE 7 (S119 RECAP anual)
                                        │
                                        ↓
                                FASE 8 (S120 regression suite)
```

**Bloqueos críticos**:
- **Fase 3 (Drive→D1) bloquea Fase 6 (premium)**: no se pueden añadir features con persistencia mixta.
- **Fase 1 (Worker security) bloquea producción**: no se sube sin cerrar V1-V11.
- **Fase 4 (App.jsx refactor) bloquea Fase 5 (tokens)**: refactor primero, polish después.
- **Fase 6 P5 (Live Sync) bloqueado por decisión arquitectónica previa** (WS vs Durable Objects vs long-polling). Resolver ANTES de S118-P5.

**Paralelizable**:
- F0 (audio) corre en paralelo con F1 (worker) — archivos diferentes.
- F2 (worker refactor) puede empezar mientras F3-D2 (WorkerClient) corre.

---

## 5. CRITERIOS DE ACEPTACIÓN POR FASE

| Fase | Criterio "done" |
|---|---|
| **F0** | `npm test` 10/10 audio tests pasan. Manual: skip(-1) <3s no va atrás. |
| **F1** | `npm test workers/` 5/5 auth tests. Manual: GET /api/queue/otro-user → 403. |
| **F2** | `npm test workers/` siguen pasando. `wc -l workers/worker.js` <300. |
| **F3** | `grep -r "gapi.client.drive" src/` → 0. `grep -r "jwtToken" src/components/` → 0. Manual: login → add track → reload → persiste en D1. |
| **F4** | `wc -l src/layout/App.jsx` <100. ErrorBoundary funcional. Signout limpia todo. |
| **F5** | `grep -rE "#[0-9a-fA-F]{6}" src/` → 0 fuera de `src/tokens.js`. |
| **F6** | Cada feature tiene test E2E manual documentado en `docs/operacional/e2e_*.md`. |
| **F7** | RECAP anual → entrada VAULT funciona. |
| **F8** | CI verde. `npm test` 15/15. `npm run build` 0 errores. |

---

## 6. PROTOCOLO DE EJECUCIÓN POR SESIÓN

Para cada sesión `S###-XX`:

```
1. LEER (10 min)
   - docs/Nucleo/SESION.md → ESTADO.md → BACKLOG.md
   - docs/Arquitectura/INDEX.md (verificar staleness)
   - docs/Nucleo/CONTRATO.md (verificar no contradice ADRs)
   - docs/operacional/ROADMAP_COMPLETO.md (este archivo) → confirmar sesión actual

2. PLANIFICAR (5 min)
   - Si contradice un ADR → PARAR y reportar
   - Si requiere ver archivo no leído → leerlo primero

3. IMPLEMENTAR (variable)
   - SEARCH/REPLACE contenedor lógico completo (ADR-015)
   - NO micro-edición
   - Code review propio antes de commit

4. VALIDAR (variable)
   - npm run lint → 0 errores
   - npm test → todos pasan
   - npm run build → pasa
   - Manual smoke test del feature

5. CODE REVIEW (10 min)
   - Spawn code-reviewer-minimax-m3
   - Aplicar feedback si es relevante

6. COMMIT
   - Mensaje: tipo(scope): descripción
   - Tipos: feat, fix, refactor, chore, style, test, docs
   - Ejemplo: fix(player): close P0 audio bugs (B1, B2, B3)

7. DOCUMENTAR (5 min)
   - Actualizar SESION.md con lo hecho
   - Actualizar ESTADO.md con próximo pliego
   - Si bug → mover a BACKLOG.md sección "resueltos"
```

---

## 7. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Migración Drive→D1 pierde datos | Media | Crítico | Backup `tools/the_vault_database.json` antes de S115-D. Verificar con `diff`. |
| Worker security fixes rompen frontend | Alta | Alto | F1 (S113-W) deploy en staging primero. Manual smoke test completo antes de prod. |
| App.jsx refactor introduce regresiones | Media | Alto | S116-L2 mantiene misma API externa. Code review exhaustivo. |
| Tests flaky por tiempo (gapless) | Media | Medio | Usar `vi.useFakeTimers()` en tests. |
| CORS tras cambios de auth | Media | Medio | Tests E2E con curl desde origen real. |
| Live Sync requiere WebSocket (más complejo) | Alta | Alto | Empezar con long-polling. Migrar a Durable Objects en S121 si funciona. |
| User tiene 500+ fotos en VAULT | Media | Medio | Paginación en `/api/entries?limit=50&offset=0`. Lazy loading. |
| Token drift遗漏 (colores no encontrados) | Baja | Bajo | Grep agresivo en cada PR. CI check. |

---

## 8. DEFINITION OF DONE GLOBAL

El proyecto está "production ready" cuando:

- [ ] 0 vulnerabilidades críticas pendientes
- [ ] 0 bugs P0/P1 pendientes
- [ ] `npm test` → 15+/15 tests pasan
- [ ] `npm run build` → 0 errores
- [ ] `npm run lint` → 0 warnings
- [ ] `grep -r "gapi.client.drive" src/` → 0
- [ ] `grep -r "jwtToken" src/components/` → 0 (solo en contexts)
- [ ] `grep -rE "#[0-9a-fA-F]{6}" src/` → 0 fuera de `tokens.js`
- [ ] Manual smoke test:
  - [ ] Login con edu
  - [ ] Add track + editarlo + borrarlo
  - [ ] Add entry + editarlo + borrarlo
  - [ ] Add playlist + add tracks + reorder
  - [ ] Drop de edu a david
  - [ ] Recap semanal visible
  - [ ] Gallery WALL/CINEMA/MAP/DIALOGUE/EXHIBITION/REEL todas funcionales
  - [ ] Time Capsule CRUD
  - [ ] Signout limpio
  - [ ] Login con david → ve sus propios datos
- [ ] Performance: medir baseline actual con Lighthouse antes de fijar targets. Aspiracional: FCP <1.5s en 3G, TTI <3s, audio gapless verificado.
- [ ] Deploy: Worker desplegado, frontend en Vercel, DNS OK, HTTPS OK, SW OK

---

## 9. ORDEN DE EJECUCIÓN ESTRICTO

```
FASE 0 (secuencial interna):
  S112-A → S112-B → S112-C → S112-D

FASE 1 (puede arrancar en paralelo con F0):
  S113-W

FASE 2 (requiere S113-W):
  S114-W

FASE 3 (secuencial, requiere S114-W):
  S115-D1 → S115-D2 → S115-D3 → S115-D4 → S115-D5

FASE 4 (puede solaparse con final de F3):
  S116-L1 → S116-L2 → S116-L3

FASE 5 (requiere S116-L2):
  S117-T1 → S117-T2

FASE 6 (requiere F3 + F4):
  S118-P1 → S118-P2 → S118-P3 → S118-P4 → S118-P5 (con decisión WS/DO/long-polling previa)

FASE 7:
  S119-R

FASE 8 (cierre):
  S120-QA
```

**Nota**: S112-C y S112-D se ejecutan al final de F0, NO al final del roadmap. La validación de tests (S112-D) ocurre dentro de la fase de audio para cerrar bugs core antes de tocar nada más.

---

## 10. SESIÓN INMEDIATA

**S112-A** — Cerrar 3 P0 de audio (45 min)

### Pasos concretos

1. **Leer** `docs/Nucleo/SESION.md`, `ESTADO.md`, `BACKLOG.md`, `CONTRATO.md` (ADR-009, ADR-007, ADR-015), `docs/operacional/ROADMAP_COMPLETO.md`
2. **Leer** `src/core/PlayerContext.jsx` (líneas 175-183, 570-590, 228-237, 268-281, ~210)
3. **Leer** `src/musiclab/MusicLab.jsx` (función `handleRemoveFromQueue`)
4. **Verificar** que los fixes no contradicen ningún ADR
5. **Aplicar** 3 SEARCH/REPLACE con contenedores lógicos completos:
   - **B1**: bloque `if (loopMode === "track")` → añadir check `currentTime < 3`
   - **B2**: useEffect vibe → eliminar `setActiveVibe(null)`, mover a trackVibe effect
   - **B3**: `handleRemoveFromQueue` → reordenar mutación antes de `setActiveTrack`
6. **Lint + build + manual**
7. **Code review** con `code-reviewer-minimax-m3`
8. **Commit**: `fix(player): close P0 audio bugs (B1, B2, B3)`
9. **Actualizar** `SESION.md` y `ESTADO.md`

### Salida esperada

- 1 commit
- 2-3 archivos modificados
- 0 errores lint
- Manual: skip(-1) en <3s no va atrás, vibe no loop infinito, queue no race condition

---

## 11. RESUMEN DE 1 FRASE

**El proyecto está al ~65% de las specs con 5 P0, 14 P1, 22 P2, 11 vulnerabilidades, dual-write Drive/D1 y shell monolítico; el plan consolidado en 8 fases (32 sesiones, ~70h) cierra primero seguridad y bugs core (F0-F2), luego elimina Drive de persistencia y refactoriza el shell (F3-F4), después unifica tokens visuales (F5), y finalmente completa las 5 features premium pendientes + RECAP anual + suite de regresión con CI (F6-F8).**

---

**Mantenimiento**: este archivo se actualiza al cierre de cada fase. Si se descubre un nuevo bug, añadirlo a §2 con su ID correlativo. Si se replanifica, actualizar §4 (dependencias) y §9 (orden).

**Referencias cruzadas**:
- ADRs: `docs/Nucleo/CONTRATO.md`
- Sesión actual: `docs/Nucleo/SESION.md`
- Estado bugs: `docs/Nucleo/BACKLOG.md`
- Staleness arquitectura: `docs/Arquitectura/INDEX.md`
- Specs: `docs/spec/`
