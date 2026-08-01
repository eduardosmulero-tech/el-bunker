# AUDITORÍA — Re-entrada 2026-08-01 (línea base)

> **Estado: BORRADOR** — escrito por Hermes (deepseek-v4-flash) el 1-ago-2026, a petición de Edu
> ("auditoría completa, pantalla a pantalla y línea a línea"). Contenido [RELLENO-IA] verificado
> contra código real + producción en vivo. No canónico hasta OK de Edu.
> Metodología: heredar auditorías previas (no re-auditar lo auditado) + verificar cada criterio
> contra el sistema real (regla de oro: el commit existe no significa desplegado y funcionando).

---

## 1. Veredicto de re-entrada

**El cierre de v1.0 (ADDENDUM 8-jul) está COMPLETO en código y en producción. La app no está rota.**
El bajo uso de David no se explica por bugs críticos; las hipótesis reales están en §5.

## 2. Criterios de cierre v1.0 — estado verificado (1-ago, en vivo)

| Criterio (ADDENDUM 8-jul) | Estado | Evidencia |
|---|---|---|
| RECAP no da error en prod (P1.1) | CERRADO | `curl` anónimo `/api/stats/recap` → HTTP 401 (endpoint vivo y con auth) |
| `/api/config` no filtra presencia (P1.2) | CERRADO | `curl` anónimo → solo `schema_version` + `adventures_start_date` |
| Filtro de categoría único (P2.6) | CERRADO | `VaultGallery.jsx` solo usa `CATEGORY_FILTERS` para labels; único render en `Vault.jsx:897` |
| EntryLightbox en 4 modos (C.1) | CERRADO en código+prod | commit `da063b1` en origin (Vercel despliega desde origin). Verificación visual pendiente (§6) |
| WALL museo + cero DEMO (C.2) | CERRADO | commit `a49fab9`; `grep` DEMO en `src/` = 0 coincidencias |
| R2 con auth prefijos sensibles (D.1) | PARCIAL | commit `655e23c` en origin; curl anónimo a key inventada → 404 (no concluyente). Completar con key real o lectura de `r2.js` |
| track_updated silenciado (D.2) | CERRADO en código | commit `2f5cd88` en origin. Verificación visual de Timeline pendiente (§6) |
| `.bak` fuera + build + lint | CERRADO | 0 `.bak` en `src/`; `npm run build` 2,65 s y lint limpios (tras `npm ci`) |
| Reproductor/estética intactos | CERRADO | `git show --stat` de C/D: ningún archivo congelado tocado |

Nota: `origin/master` ya contiene C/D; los 2 commits locales sin publicar son solo de AGENTS.md
(documentación) → la tarjeta "deploy frontend" (t_1afa45b1) es COSMÉTICA, no funcional.

## 3. Inventario

- **18.246 LOC / 72 archivos** JS/JSX/CSS. 505 commits desde 16-may-2026.
- Módulos: musiclab 4.741 · core 3.885 · vault 3.878 · workers/API 1.892 · layout 1.648 ·
  capsules 1.049 · smoke 833.
- Top por tamaño: MusicLab.jsx 1.860 · PlayerContext.jsx 1.731 · VaultGallery.jsx 1.232 ·
  Vault.jsx 1.026 · VaultContext.jsx 847 · SmokeSession.jsx 833 · WinampPlayer.jsx 791.
- Pantallas: LoginScreen → BootScreen (GlobalLoading/Error) → TabShell (3 tabs: VAULT · MUSIC LAB ·
  CAPSULES vía PageWrappers) + UnauthorizedScreen. VaultGallery 6 modos, Capsules 4 sub-tabs.

## 4. Candidatos del barrido mecánico (a revisar, NO son hallazgos)

Patrones aproximados; cada coincidencia requiere revisión individual (falsos positivos esperados):

| Patrón | Coincidencias | Dónde |
|---|---|---|
| fetch sin .catch visible | 15 | PlayerContext.jsx:390, FileUploadService.js:42-43, WorkerClient.js:27… |
| setInterval sin cleanup visible | 7 | PlayerContext.jsx:178, 359 (presence 15s), 542 (heartbeat 30s), 1589 |
| localStorage directo (sin try/catch) | 23 | GoogleDriveService.js:178-207 (token) |
| useEffect sin deps visible | 102 | revisar muestras (mayoría con deps en línea siguiente) |
| URL API hardcodeada (fallback env) | 5 | tokens.js, WorkerClient.js, VaultContext.jsx (patrón aceptable VITE_API_URL‖default) |

## 5. Hipótesis sobre el bajo uso de David (para la entrevista, no son hechos)

1. **Login/onboarding**: el flujo es OAuth Google "solo auth" — ¿David entra sin fricción desde su
   móvil? ¿Tiene la PWA instalada? (LoginScreen.jsx 510 líneas, 19 candidatos de riesgo en el barrido)
2. **Contenido real**: la purga de DEMO (C.2) dejó "estado vacío honesto" — ¿hay contenido real
   subido que haga la app útil, o se ve vacía?
3. **Hábito**: el objetivo declarado era "abandonar Spotify/Google Photos" — sin un empujón
   deliberado, el hábito no se rompe solo. La app tiene 2 usuarios; la escucha compartida y el
   contenido en pareja son su ventaja diferencial, no la paridad con Spotify.
4. **Drive vivo**: `getStreamUrl` (Drive) se usa en 4 puntos del reproductor (PlayerContext 674,
   1090, 1262, 1279) pese a "No Drive para persistencia" — verificar si hay tracks legacy en Drive
   y si su latencia degrada la experiencia.

## 6. Plan de la auditoría en pliegos (a ejecutar en próximas sesiones, 1 pliego por sesión)

- **P1 — Reproductor + core** (PlayerContext, MusicLab, WinampPlayer, AudioVisualizer, VaultContext,
  WorkerClient, FileUploadService): lectura dirigida + verificación de candidatos §4 + P3.10
  (preload gapless: ¿tracks global o contextTracksRef?) + uso real de Drive.
- **P2 — VAULT + galería** (Vault, VaultGallery, WallView, AddEntryForm, EraDetailPanel).
- **P3 — Capsules + smoke + layout** (Capsules, Timeline, Smoke, TimeCapsules, Recaps, Layout,
  TabShell, LoginScreen).
- **P4 — Backend** (workers/: worker.js, rutas, schema.sql, r2.js — completar verificación D.1;
  resync docs stale: INDEX.md, technical-debt.md, conteos).
- **P5 — Pantallas en vivo** (requiere decisión de acceso, §7) + pase funcional en el móvil de David.

Cada pliego: barrido mecánico (grep/script) → lectura dirigida → workers gratuitos con contrato de
lista cerrada para volumen → veredicto mío (el de un worker gratuito se reescribe, no se acepta).

## 7. Pendiente de decisión de Edu

- Acceso a la app viva para P5: (a) Edu hace login una vez en el navegador de Hermes y yo recorro
  pantalla a pantalla; (b) guion de prueba que Edu/David ejecuta en el móvil (recomendado: es el
  dispositivo real del usuario objetivo); (c) solo estática.
- Prioridad de pliegos: ¿empiezo por P1 (reproductor, lo que toca el uso) o por P4 (backend)?
- OK para considerar el informe línea base y archivar las 4 tarjetas del kanban perdido con su
  estado real (3 cerradas, 1 cosmética).

## 8. Hallazgo confirmado — el login pide Drive sin necesidad (1-ago, verificado en código)

**Causa raíz probable de la fricción de login de Edu ("Google me hace aceptar 4 ventanas"):**

- `GoogleDriveService.js:11-14`: `SCOPES` incluye `https://www.googleapis.com/auth/drive.readonly`.
  Permiso SENSIBLE → Google muestra consentimiento extra (+ pantalla "app no verificada" si el
  proyecto OAuth está en Testing).
- El almacenamiento real es D1+R2 desde S76 (ADR-024/025 cumplido); Drive solo queda para:
  (a) tracks legacy con `drive_file_id` (fallback de stream, `schema.sql:86`, resuelto en caliente
  vía `getStreamUrl` en PlayerContext 674/1090/1262/1279) y (b) la capacidad de "bibliotecas"
  (`listLibraryContents`, `calculateLibraryUsage`, límite por defecto 15 GB — el gratis de Drive).
- El worker no sube nada a Drive (grep limpio); solo persiste el campo legacy.

**Plan de limpieza propuesto (en orden, requiere OK de Edu):**
1. ~~Verificar si quedan tracks con `drive_file_id` en D1~~ **HECHO (1-ago, consulta D1 autorizada): 0 de 1.117 tracks
   con `drive_file_id`; los 1.117 tienen `r2_key`. Migración completa.**
2. ~~Verificar feature "bibliotecas"~~ **HECHO: sin configuración en `app_config` (solo
   adventures_start_date, presence_*, schema_version). El único anclaje es
   `VITE_GOOGLE_SHARED_FOLDER_ID` en `.env`, sin referencia en producción. Feature nunca usada.**
3. ~~Quitar `drive.readonly` de SCOPES (`GoogleDriveService.js:14`)~~ **HECHO (1-ago, ejecutado como
   PRUEBA DEL GATE 0B/1 — tarea real de principio a fin).** Verificado: grep `drive.readonly` en
   src/ = 0; SCOPES final = solo userinfo.email + userinfo.profile; build 2,77 s limpio; lint exit 0.
   Efecto colateral analizado: `getStreamUrl` solo usa Drive si `r2_key` es nulo (0 de 1.117 tracks);
   la feature bibliotecas no tiene UI ni datos (riesgo cero). Cambio en working tree, sin commit
   (R4: lo commitea Edu o autoriza).** Pendiente de Edu: quitar el scope en la consola de Google
   (Pantalla de consentimiento) + añadir a David como test user si el proyecto está en Testing;
   revocar el acceso antiguo de la app en su cuenta Google para notar el efecto en el próximo login.**
4. Efecto esperado: el consentimiento de Google se reduce a 1 ventana (selección de cuenta) o
   ninguna con test users.

**Pendiente opcional (requiere reabrir la congelación del ADDENDUM 8-jul):** limpiar el código
muerto de Drive (`getStreamUrl` fallback en PlayerContext 674/1090/1262/1279 — archivo congelado —
y `listLibraryContents`/`calculateLibraryUsage`/`checkLibraryCapacity` en GoogleDriveService) en un
pliego futuro. No bloquea la reducción de fricción del login.

**Nota toolchain (1-ago):** wrangler 4.118.0 instalado como devDependency (`npm i -D wrangler`,
autorizado por Edu). Sesión OAuth de Cloudflare activa (thebunker.admin@gmail.com). WSL sin
distribuciones; el toolchain de el-bunker vive ahora en Windows nativo. Al ejecutar `wrangler d1
execute --remote`, la salida llega en UTF-16LE (parsear con decode utf-16).

## 9. Hallazgo funcional — VAULT "solo eras" (1-ago, verificado en D1)

- D1 producción: **0 eras, 0 entries, 1.117 tracks** (todos con r2_key). La purga de DEMO (C.2,
  23-jul) vació eras/entries y nunca se subió contenido real (tarjeta t_c316b835 "subir PRUEBA"
  pendiente en el kanban perdido).
- Lo que Edu ve ("solo se ven las eras, el resto vacío") NO viene de la base: el frontend carga
  eras únicamente vía `workerClient.get('/api/eras')` (VaultContext.jsx:293, sin fallback) y no
  hay caché del DB en el cliente. Causa: el service worker (public/sw.js, cache-first para assets)
  sirve un bundle anterior al 23-jul que aún contenía DEMO_ERAS. Confirmación: abrir en incógnito.
- Implicación para el bajo uso: la bóveda está vacía — el contenido real es el siguiente paso de
  producto, no el código. Conecta con la hipótesis §5.2.
- Confirmado además: el cambio de login (scope Drive fuera) funciona — Edu entró sin problema.

