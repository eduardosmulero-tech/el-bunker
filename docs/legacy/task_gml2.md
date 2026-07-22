# `task_gml2.md` — ENCARGO LARGO para GLM 2 (FASE C.2 + FASE D · cierre v1.0)

> **Turno:** 2026-07-13 / GLM 2 (cualquier desviación de CLAUDE.md "DeepSeek es daily driver por defecto" — esta pasada ejecuta con **GLM 2**, que sigue el mismo workflow: investigar primero, contenedor lógico completo, build verde, reporte breve. Edu decide el modelo por sesión; el contenido + restricciones son idénticos al patrón de proyecto).
>
> **Predecesor archivado:** el contenido anterior (paralelización de `tools/import-vault.mjs`) está en `docs/operacional/task_deepseek_archived_2026-07-13.md`. Este lo REEMPLAZA íntegramente.
>
> **Resoluciones vinculantes a leer primero:**
> 1. Fable S147 — sección "VEREDICTOS FABLE S147 2026-07-13" al final de `docs/operacional/auditoria_pasada_2_2026-07-08.md`. **Es el contrato de este encargo.** Cualquier desviación requiere documentar y justificar.
> 2. Cola `docs/operacional/cola_decisiones_fable.md` — RESOLUCIÓN FABLE S145 (6 decisiones FASE B/C ya implementadas o en vía).
> 3. `docs/operacional/auditoria_fable_1.0.md` — ADDENDUM CIERRE v1.0 (08-jul) que acota el plan a FASE C + FASE D y congela reproductor/estética.
>
> **Lo que NO se hace aquí** (parking POST-v1.0 ratificado por Fable V6+V7): sustituir Google OAuth, cifrado cliente del vault, Vercel→Pages, los 12 ítems B.3 del informe original, las 9 features avanzadas de Time Capsules, refactors de la spec que no materialicen el cierre.

---

## §1 · Estado (snapshot al arrancar)

- **FASE A ✅ cerrada** (S144, PLIEGO-235/236): 6 P1 corregidos en producción (header, clipping, UUID tag, RECAP 404, leak `/api/config`, filtro duplicado). Build limpio.
- **FASE B ✅ cerrada** (S145, PLIEGO-237): reproductor premium, carátula capa base, CRT 0.12, peek cola, controles 2 filas. **CONGELADO — no tocar.**
- **FASE C.1 ✅ cerrada** (S146): `src/vault/EntryLightbox.jsx` creado y adoptado por WALL/DIALOGUE/EXHIBITION/REEL/CINEMA. Pendiente validación humana Edu en móvil; si rompe, fix puntual sin reabrir C.2/D.
- **FASE C.2 + FASE D pendientes → es lo que haces aquí.**
- **Producción PAUSADA** (decisión Edu 09-jul): `wrangler deploy` queda CONGELADO hasta su orden. Por tanto, todo cambio backend (D.1 + D.2) se codea y verifica con `wrangler dev` local; **NO subir a Cloudflare hasta que Edu lo diga.**
- **Congelado absoluto:** `src/musiclab/WinampPlayer.jsx` · `AudioVisualizer.jsx` · motor de `src/core/PlayerContext.jsx` · `src/tokens.js` · look Cyber-Vandal. Solo bug de producción los toca.
- **Score vigente:** ~55% (Recalcular cuando termines: debería subir a ~70-75% si C.2 + D cierran limpios).

---

## §2 · Contrato (lo que no puedes romper)

### ADRs con prevalencia absoluta (`docs/Nucleo/CONTRATO.md`)

| ADR | Lo que implica para este encargo |
|---|---|
| **🔒-3 / ADR-018** Motor audio único MusicLab | Ningún `<audio>` o `<video src controls>` fuera de MusicLab. No toques `WinampPlayer.jsx`/`AudioVisualizer.jsx` salvo bug. |
| **🔒-5 / ADR-019** Stats engine único vía tabla `events` D1 (append-only) | D.2-E.2: NO borrar histórico `track_updated`. Solo dejar de emitir y filtrar en lectura. |
| **🔒-6 / ADR-025** Google OAuth solo auth | Cero persistencia en Drive. Drive no se usa. |
| **🔒-7 / ADR-015** Cambios por contenedor lógico completo | Nunca micro-edición. Cada pliego toca archivos enteros, nunca líneas sueltas. |
| ADR-017 | 3 tabs VAULT · MUSIC LAB · CAPSULES. Intactos. |
| ADR-021 | 6 modos galería. WALL/EXHIBITION/REEL/DIALOGUE/CINEMA/MAP son los modos. Tu toque en C.2.2 puede sumar headers curatoriales en WALL pero no romper el modo. |
| ADR-022 | Prefijos R2 funcionales: `music/`, `vault/photos/`, `vault/videos/`, `vault/docs/`, `vault/audio/`. Tu toque en D.1 gatea DOS de ellos (`vault/docs/` + `vault/audio/`). |

### Reglas del workflow (CLAUDE.md)

- Tú **investigas primero** (Regla de Oro). Antes de tocar el código, relee los archivos relevantes, confirma los refs archivo:línea de este encargo, ejecuta `git grep` para no perder evidencia.
- Contenedor lógico completo: si tocas `Vault.jsx`, lees y tocas el archivo entero; si haces una refactorización del resolver, lo haces en su archivo, no desperdigado.
- `package.json` / `wrangler.toml`: editar con justificación, no añadir deps sin documentación.
- Build verde al terminar: `npm run build` y `npm run lint` deben pasar a 0/0.
- Si encuentras un ADR que contradice una tarea, **detén y reporta** antes de implementar.

### Restricciones de cierre (ADDENDUM CIERRE v1.0)

- **No nice-to-haves nuevos.** Si algo no materializa el cierre (`EntryLightbox` vivo · WALL museo · Cero DEMO · R2 con gate HMAC en 2 prefijos · `track_updated` silenciado · docs/baks limpios), no entra.
- **Estética del reproductor NO se toca** salvo bug-prod.
- Backend deploy espera orden de Edu.

---

## §3 · Contexto (archivos relevantes a leer antes de empezar)

### Frontend (C.2)

| Archivo | Por qué te importa |
|---|---|
| `src/vault/WallView.jsx` | C.2.2: añadir headers de sección por era sin romper virtualización |
| `src/musiclab/MusicLab.jsx` (líneas 31, 61) | C.2.1: borrar `DEMO_TRACKS` def + el fallback `db?.music_lab?.tracks ?? DEMO_TRACKS` |
| `src/vault/Vault.jsx` (líneas 30, 744) | C.2.1: borrar `DEMO_ERAS` def + `const displayEras = eras_arr.length > 0 ? eras_arr : DEMO_ERAS` |
| `src/vault/VaultGallery.jsx` (líneas 758, 846, ~1192) | C.2.1: borrar def `DEMO_ENTRIES_GEO` + default param en MapView + comentario backward-compat |
| `src/musiclab/WinampPlayer.jsx` | **CONGELADO** (no tocar) |
| `src/vault/EntryLightbox.jsx` | C.1 cerrado. Lee para entender cómo se consume via `onOpenLightbox` desde WallView |
| `src/core/VaultContext.jsx` | Cómo se cargan eras/entries (para no romper el orden al agrupar en WALL) |
| `src/tokens.js` | **CONGELADO** (no tocar) |

### Backend (D.1 + D.2)

| Archivo | Por qué te importa |
|---|---|
| `workers/routes/r2.js` | D.1: añadir gate HMAC. Lee el archivo entero (~30 líneas): `handleR2(request, env, path)`. Cualquier cambio es contenedor completo. |
| `workers/routes/tracks.js` | D.2: PATCH handler. Vela los INSERTs en events, identifica el del PATCH y elimínalo. POST y DELETE se quedan. |
| `workers/routes/stats.js` | Cómo RECAP consume events (para el filtro de lectura en D.2) |
| `workers/routes/capsules.js` (time_capsules route) | Cómo Timeline consume events |
| `workers/utils/auth.js` | Constantes `JWT_EXPIRY` y otros helpers HMAC; reutilizar para V4 sin reinventar |
| `workers/routes/sync.js` | Cómo se firman/validan tokens hoy (referencia para D.1 si implementas endpoint de firma) |
| `workers/config.js` (líneas 20-26) | `VALID_UPLOAD_PREFIXES` — referencia los 5 prefijos canónicos de R2 |
| `wrangler.toml` | Si añades `R2_SIGN_SECRET` u otro secret al worker |

### Frontend (D.1 downstream)

| Archivo | Por qué te importa |
|---|---|
| `src/core/ResolveR2Url.js` (o el resolver equivalente, busca "R2_PUBLIC_BASE" en `src/tokens.js` y en `src/vault/VaultGallery.jsx`) | D.1: añadir lógica `if (key.startsWith('vault/docs/') || key.startsWith('vault/audio/')) → URL + '?t=' + hmac` |
| `src/capsules/TimeCapsules.jsx` | D.2: si lee events, asegurar que filtra `event_type != 'track_updated'` |
| `src/capsules/Recaps.jsx` | D.2: mismo cuidado |
| `src/core/StatsEngine.js` | D.2: si tiene eventType filter utilitario, usarlo |

### Housekeeping (D.3)

| Archivo | Acción D.3 |
|---|---|
| `src/**/*.bak*` (glob) | Borrar todos. Ver V0 de Fable: el informe original estaba truncado y el `.bak_SmokeSession.jsx` quedó sin documentar; encuéntralo con glob. |
| `docs/Arquitectura/INDEX.md` | Actualizar `architecture.md` y `rendering-flow.md` a "S147" |
| `docs/Arquitectura/architecture.md` | Añadir `src/vault/EntryLightbox.jsx` (nuevo, no documentado), reflejar V4 + V5 |
| `docs/Arquitectura/rendering-flow.md` | Reflejar zoom en `EntryLightbox` (no ZoomModal) para WALL/DIALOGUE/EXHIBITION/REEL |
| `docs/Arquitectura/technical-debt.md` | Eliminar/reescribir TD-1 (ya refutado por AUDITORIA_TRANSVERSAL: todo está en D1) |
| `docs/Nucleo/CONTRATO.md` | Revisar y añadir si quieres una nota de "veredicto Fable S147 vinculante en pasada #2" (opcional) |
| `CLAUDE.md` y `docs/Nucleo/PROYECTO.md` | Corregir conteos: **17 tablas** (no 16 ni 13), **16 prefijos ROUTES** (no 17 ni 11) |
| `docs/Nucleo/ESTADO.md` | Marcar FASE C.2 + D ✅ al cerrar |
| `docs/Nucleo/SESION.md` | Abrir entrada S148 cuando termines |

### Docs de soporte que NO debes tocar pero sí leer

- `docs/operacional/auditoria_pasada_2_2026-07-08.md` (especialmente §VEREDICTOS FABLE S147)
- `docs/operacional/cola_decisiones_fable.md` (RESOLUCIÓN FABLE S145)
- `docs/operacional/auditoria_fable_1.0.md` (ADDENDUM CIERRE v1.0)
- `docs/spec/taxonomia_vault.md` (referencia conceptual para qué hay en `vault/docs/`)

---

## §4 · Tarea (sub-entregas y su orden)

### Internal ordering principles

1. **C.2 antes que D**: frontend es más fácil de verificar (abrir el navegador móvil de Edu) y no requiere `wrangler dev`. Si C.2 rompe algo, lo arreglas sin haber tocado backend. Riesgo asimétrico: C.2 primero minimiza retrabajo.
2. **Dentro de C.2**: C.2.1 (Cero DEMO) antes que C.2.2 (WALL museo). C.2.1 es delete-only, ~15 min. Si haces C.2.2 primero, tocas más archivos y un fix en C.2.1 posterior te obliga a re-verificar integración con la nueva arquitectura.
3. **Dentro de D**: D.1 (R2 auth, gate de seguridad) antes que D.2 (track_updated, lógica). D.1 es defensivo; D.2 es cosmético-feed. Si D.2 rompe, el feed se ve mal pero no hay leak de privacidad.
4. **D.3 housekeeping al final**, una vez C.2 + D.1 + D.2 estén build-verde. Si borras `.bak` antes, cuando un `git diff` rompa miras el `.bak` y tiras confusiones.

---

### ✦ SUB-ENTREGA 1: FASE C.2.1 — Cero DEMO borrado total (V1, ~15 min)

**Tarea.** Borrar las 3 constantes DEMO y todos sus usos (definición + fallback + comentario backward-compat). Sin gate DEV. Sin seeds para desarrollo: el estado vacío elegante ya existe y los datos reales cargarán via D1.

**Paso a paso:**

1. `src/musiclab/MusicLab.jsx`:
   - Localiza `const DEMO_TRACKS = [...]` (~línea 31; `git grep -n "DEMO_TRACKS" src/` antes de tocar).
   - Borra la definición completa.
   - Localiza `const rawTracks = db?.music_lab?.tracks ?? DEMO_TRACKS` (~línea 61).
   - Sustituye por `const rawTracks = db?.music_lab?.tracks ?? []`. Si el filtro `!t.is_deleted` ya lo hace, mantener `??` con `[]`.
   - Borra el comentario explicativo asociado a `DEMO_TRACKS` (si existe).

2. `src/vault/Vault.jsx`:
   - Localiza `const DEMO_ERAS = [...]` (~línea 30) y bórrala completa.
   - Localiza `const displayEras = eras_arr.length > 0 ? eras_arr : DEMO_ERAS` (~línea 744).
   - Sustituye por `const displayEras = eras_arr`. Sin fallback; si eras_arr está vacío → estado vacío elegante (que ya existe vía `displayEras.length === 0` o similar — verifica el flujo de EraSlider y EraDetailPanel).

3. `src/vault/VaultGallery.jsx`:
   - Localiza `const DEMO_ENTRIES_GEO = [...]` (~línea 758) y bórrala completa.
   - Localiza `const MapView = ({ entries = DEMO_ENTRIES_GEO, eras = [] }) => {` (~línea 846).
   - Cambia la firma a `const MapView = ({ entries = [], eras = [] }) => {`. Verifica que el código interno maneja bien `entries.length === 0` (el fallback elegante ya existe, comrpuébalo).
   - Busca el comentario "S130-A: 9 entries demo hardcoded..." y bórralo.
   - Localiza el comentario backward-compat de ~línea 1192 (referencia a `DEMO_ENTRIES_GEO` que ya no existe) y bórralo.

4. `src/` global:
   - `git grep -n "DEMO_TRACKS\|DEMO_ERAS\|DEMO_ENTRIES_GEO"` debe devolver 0 ocurrencias tras las 3 anteriores.

**Verificación post-paso (binaria):**
```bash
git grep -n "DEMO_TRACKS\|DEMO_ERAS\|DEMO_ENTRIES_GEO"  # debe devolver 0 líneas
npm run build                                     # exit 0
npm run lint                                       # exit 0
```

**Si pasa, sigues a C.2.2. Si no, FIX antes de avanzar.**

---

### ✦ SUB-ENTREGA 2: FASE C.2.2 — WALL museo por eras (V2 / decisión S145 4-B, ~45-90 min)

**Tarea.** Añadir headers curatoriales por era al `WallView` actual (masonry + 3 densidades + pinch + EntryLightbox se mantienen intactos dentro). Las salas son headers con nombre de era + rango de fechas + color de era; dentro de cada sala, el masonry existente.

**Caveat vinculante — virtualización:** WALL está virtualizado (`IntersectionObserver` en `WallItem`). Los headers de sección deben integrarse ANTES de la ventana de render: agrupar entries por era PRIMERO (`useMemo`), luego renderizar secciones con sus headers. No metas `Math.random()` ni orden dinámico per-render que rompa el observador.

**Paso a paso:**

1. Lee `src/vault/WallView.jsx` en su totalidad ANTES de tocar. Mide: ¿dónde se aplica virtualización? ¿Cuál es el pipeline de render actual? ¿Cómo se construye `buildMasonryColumns(entries, columnCount)`?

2. Diseña (mentalmente o en papel antes de codear):
   - Agrupar `entries` por `era_id` en `useMemo([entries])`. Sin `era_id` → grupo independiente "sin era" al final.
   - Para cada grupo, calcular `[minDate, maxDate]` derivado de las entries en ese grupo (usando `created_at` o `event_date`).
   - Headers de sala:
     - Layout: full-width row, altura ~56-72px (touch target ≥44px + padding).
     - Contenido: nombre de era (`eras.find(e => e.id === eraId)?.name`) · color de era (`eras.find(...)?.color`) como border-left 4px + dot de color · rango de fechas formateado (formato corto, e.g. "mar 2023 → jun 2024").
     - Contador: `{eraEntries.length} piezas · {Object.keys(vibeCounts).length} vibes` igual que `ExhibitionView` ya hace.
   - Debajo del header, masonry normal (idéntico al actual, sin cambios funcionales).
   - Si era es "Sin era", omitir el header (o usar un divisor más sutil). Ver V2 de Fable: "no se descarta C (modo inmersivo)" pero para v1.0 basta con el modo museo.

3. Implementa:
   - Nuevo `useMemo` al inicio del componente: `const eraGroups = useMemo(() => groupByEra(entries, eras), [entries, eras])`. Helper pequeño en el mismo archivo o inline.
   - Render plano: por cada (eraId, eraEntries), render [Header, Masonry(eraEntries)].
   - Mantén la firma de export (`WallView({ entries, eras, density, setDensity, filterCategory, accentColor, onOpenLightbox })`) intacta. No cambies props.
   - Mantén `LongPressPreview` y la lógica de tap → `onOpenLightbox` tal cual.
   - Mantén el botón de densidad COMPACT/NORMAL/EXPANDED + pinch-to-zoom existente.

4. Verifica que la virtualización sigue funcionando:
   - La función `IntersectionObserver` (`OBSERVER_MARGIN = "400px"`) sigue observando `WallItem` SOLO (no necesita observar headers; son siempre visibles).
   - El stagger animation index pasa a ser globalIdx dentro del grupo (suma acumulada) para que el delay no se resetee entre salas.

5. Si quieres badges legibles (P2.8 del informe original) —esfuerzo extra opcional— ajusta tamaño/contraste de los badges existentes (`whoInitial`, era dot, CAT_ICON) en `WallItem`. Mínimo esfuerzo C.2.2 sin tocar esto.

**Verificación post-paso (binaria):**
```bash
npm run build           # exit 0; build debe aceptar el nuevo helper
npm run lint            # exit 0
grep -n "eraGroups\|byEra" src/vault/WallView.jsx   # debe tener al menos las refs nuevas
# Comportamiento: visual review mental:
#   ¿Las salas se ven en orden (era 1 → era 2 → "sin era")?
#   ¿Las entries dentro de cada sala siguen el masonry 3-density comportamiento?
#   ¿Tap → onOpenLightbox funciona dentro de cada sala?
```

**Lo que NO se hace en C.2.2:**
- No añadir modo "tap-inmersivo full-bleed" — eso es C.1 ya hecho por EntryLightbox + DIALOGUE/EXHIBITION/REEL.
- No cambiar la firma de `WallView`.
- No añadir nuevos props a `WallView` (usa lo que ya recibe).
- No tocar `VaultGallery.jsx` salvo que sea necesario para propagar eras (ya se propaga).

---

### ✦ SUB-ENTREGA 3: FASE D.1 — R2 con token HMAC en prefijos sensibles (V4, ~60-90 min)

**Tarea.** `workers/routes/r2.js` exige token HMAC firmado en query (`?t=`) para `vault/docs/` y `vault/audio/`. Sin token válido → 404 (no 401/403: no revelar existencia). El resto de prefijos sigue siendo público sin gate. Frontend añade `?t=` automáticamente al resolver la URL absoluta si la key está en uno de los 2 prefijos sensibles.

**Caveats vinculantes:**
- El mecanismo exacto de emisión lo decides tú: opción A = endpoint nuevo `/api/r2/sign` que recibe `{key}` y devuelve `{url: '...&t=...'}` (auth = JWT); opción B = el resolver de la entry ya incluye la URL firmada en la respuesta de `/api/entries` (server-side firma antes de devolver). Cualquiera de las dos es válida; **elige una y documéntala en el hand-off**.
- TTL: reutiliza `JWT_EXPIRY` (ver `workers/utils/auth.js` para el valor constante). Si necesitas una constante nueva para HMAC expiry documenta en el hand-off.
- Secret: debe estar en `wrangler.toml` (o en env). Nombre propuesto: `R2_SIGN_SECRET`. Edu añade el valor con `wrangler secret put R2_SIGN_SECRET` cuando levante la pausa (NO TU TRABAJO — solo deja el slot listo).
- Si `r2_key` no comienza por `vault/docs/` ni `vault/audio/` → comportamiento idéntico al actual (404 si no existe, 200 si existe, sin token).
- Si la prefix SÍ requiere token y falta o es inválida → 404 (igual a "key no existe"). No 401/403 para no confirmar existencia al atacante.

**Paso a paso:**

1. Lee `workers/routes/r2.js`, `workers/utils/auth.js`, `workers/config.js`, `wrangler.toml`. Localiza:
   - Constantes de tiempo/secret en `auth.js`.
   - `JWT_EXPIRY` (valor en horas).
   - Cualquier helper HMAC existente (`crypto.subtle.sign`, HMAC-SHA256, etc.) — reutiliza.

2. Crea un helper nuevo en `workers/utils/r2-sign.js` (o extiend `auth.js` — tu decisión, justifica en hand-off):
   - `signR2Read(r2_key, env) → { url, expiresAt }` o `null`. Devuelve URL con `?t=` HMAC firmado.
   - `verifyR2Read(r2_key, request, env) → boolean`. Verifica token HMAC + TTL. Si expira → false.
   - HMAC input: `r2_key + expiresAtTimestamp`. HMAC-SHA256 con `R2_SIGN_SECRET`.
   - TTL: `JWT_EXPIRY` (en horas → milisegundos para el timestamp).

3. Modifica `workers/routes/r2.js` (contenedor completo):
   - Añade early-return:
     ```js
     const SENSITIVE_PREFIXES = ["vault/docs/", "vault/audio/"];
     const isSensitive = SENSITIVE_PREFIXES.some(p => r2_key.startsWith(p));
     if (isSensitive) {
       const { url, expiresAt } = request.url; // parse URL for query params
       const t = url.searchParams.get("t");
       if (!t || t !== computeToken(r2_key, expiresAt, env)) {
         return err("Not found", 404); // no revela existencia
       }
     }
     ```
   - Mantén el resto idéntico.

4. **Si eliges opción A** (endpoint `/api/r2/sign`):
   - Crea `workers/routes/r2-sign.js` (handler).
   - Añade `["/api/r2/sign", handleR2Sign, /* auth */ true]` al array `ROUTES` en `workers/worker.js`.
   - Endpoint: `GET /api/r2/sign?key=<r2_key>` → `{ url: string, expiresAt: number }`. Solo para `vault/docs/` y `vault/audio/`. Auth via JWT (userId en request).

5. **Si eliges opción B** (resolver server-side en `/api/entries`):
   - Modifica `workers/routes/entries.js`: en el GET final, para cada entry con `content.images[*].r2_key.startsWith('vault/docs/') || 'vault/audio/'`, sustituir la URL absoluta por la firmada con HMAC.
   - Más intrusivo (rompe esquematización); solo elegir si prefieres minimizar superficie de endpoints.

6. Frontend (resolver):
   - Localiza el resolver actual: `grep -rn "R2_PUBLIC_BASE" src/` (probablemente está en `src/tokens.js` o en cada uno de `WallView/VaultGallery/EntryLightbox/Vault` donde se construye `${R2_PUBLIC_BASE}/${img.r2_key}`).
   - Crea un helper nuevo `src/core/R2Url.js` (o `src/core/ResolveR2Url.js`):
     ```js
     export async function resolveR2Url(r2_key) {
       const baseUrl = `${R2_PUBLIC_BASE}/${r2_key}`;
       const isSensitive = r2_key.startsWith('vault/docs/') || r2_key.startsWith('vault/audio/');
       if (!isSensitive) return baseUrl;
       if (!signedUrlCache.has(r2_key)) {
         const { url } = await workerClient.get(`/api/r2/sign?key=${encodeURIComponent(r2_key)}`);
         signedUrlCache.set(r2_key, url);
       }
       return signedUrlCache.get(r2_key);
     }
     ```
   - Reemplaza todas las construcciones `${R2_PUBLIC_BASE}/${img.r2_key}` por `await resolveR2Url(img.r2_key)` en los sitios donde la clave puede ser sensible: EntryLightbox (probable galería completa), WallView (en LongPressPreview), VaultGallery (Map y pins), VAULT general.
   - Manejo async: si el componente no soporta async (algunos son síncronos), usa cached URL. Cache con TTL razonable (e.g. 1h < HMAC expiry).

7. **Caveats frontend adicionales:**
   - El `<img>` tag debe usar URL absoluta, no relativa. Verifica que `getImageUrl` ya produce URL absoluta.
   - Si entry no tiene `r2_key` o el resolver falla, fallback a `null`/`undefined` (no rompas el lightbox).

**Verificación post-paso (binaria):**
```bash
npm run build                        # exit 0
wrangler dev                         # arranca worker local en :8787
# Sin token, prefix sensible:
curl -i http://localhost:8787/vault/docs/cualquier-key  # 404
curl -i http://localhost:8787/vault/audio/cualquier-key # 404
# Con token (obtenido via /api/r2/sign autenticado):
TOKEN=$(curl -s 'http://localhost:8787/api/r2/sign?key=vault%2Fdocs%2Ftest' -H "Authorization: Bearer $JWT" | jq -r .url)
curl -i "$TOKEN"                                     # 200 (si test existe en R2 local; 404 si no)
# Sin token, prefix NO sensible: comportamiento intacto
curl -i http://localhost:8787/vault/photos/key        # 200 si existe
```

**Si `wrangler dev` no replica R2 exactamente**, podrías no tener archivos en R2 local; verifica con `--remote` o con un test mínimo: que el código del response 404 vs 200 sea correcto (que el gate EXISTE; el fetch real necesita R2 data).

---

### ✦ SUB-ENTREGA 4: FASE D.2 — track_updated deja de emitirse, se filtra en lectores (V5, ~30-60 min)

**Tarea.** Eliminar el INSERT INTO events de `track_updated` en el PATCH handler de `workers/routes/tracks.js`. Mantener `track_created` (POST) y `track_deleted` (DELETE) intactos. Frontend (Timeline + RECAP) filtra `event_type = 'track_updated'` en lectura, sin tocar la tabla.

**Caveats vinculantes:**
- 🔒-3 / ADR-019: events es append-only. NO borres histórico. Los eventos viejos `track_updated` siguen en la tabla; solo desaparecen de la vista.
- Caveat V5 de Fable: si algún consumidor usa hoy `track_updated` para algo legítimo (e.g. detectar favoritos al cambiar metadata de un track), ese caso migra a un event_type específico (`track_favorited` al togglear favorito), nunca al PATCH genérico. **Antes de tocar, ejecuta:**
  ```bash
  git grep -rn "track_updated" src/ workers/
  ```
  Si solo aparece en `tracks.js` (tu INSERT), PATCH-DELETE es seguro. Si aparece en algún consumer, lee el consumer y crea antes un nuevo event_type específico.

**Paso a paso:**

1. `git grep -rn "track_updated" src/ workers/` — documenta los hits. Si solo está en `tracks.js`, adelante.

2. `workers/routes/tracks.js` (contenedor lógico COMPLETO — ADR-015):
   - Lee `handleTracks` entero antes de tocar (PATCH + POST + DELETE). El archivo es pequeño; trata la unidad como un todo.
   - Refactor: extrae un helper local `emitTrackEvent(eventType, userId, trackId, payload)` que usen POST y DELETE para `track_created` / `track_deleted`. El helper vive en el MISMO archivo (no crees `workers/utils/events.js` nuevo por §6 — dependencia cero).
   - El PATCH handler deja de llamar a `emitTrackEvent`. Conserva el UPDATE de tracks en sí (esos parámetros que actualizas no son eventos, son state).
   - **Justifica en el hand-off** por qué extrajiste el helper en vez de borrar el INSERT inline: hace explícito el contrato (PATCH = mudo, POST/DELETE = sí emiten) y sobrevive al siguiente lector que, sin contexto histórico, no entendería por qué PATCH es silencioso.

3. Verifica que POST y DELETE siguen emitiendo:
   - POST: `event_type=track_created` → INTACTO vía `emitTrackEvent('track_created', ...)`.
   - DELETE: `event_type=track_deleted` → INTACTO vía `emitTrackEvent('track_deleted', ...)`.
   - PATCH: `emitTrackEvent` ya NO se llama.

4. **Si encuentras consumers usando `track_updated`, DETÉN y reporta en el chat antes de continuar con el refactor.** NO borres el INSERT sin reemplazo. V5 de Fable es taxativo: *"GLM 2 verifica consumidores antes de tocar"*. El informe final tendrá un ítem `consumers encontrados: [lista]` + propuesta de `event_type` específico (e.g. `track_favorited`), NO el código del refactor aplicado.

5. Frontend — Filtrar `track_updated` en lectura. **NO filtres en la query SQL del backend** (los events viejos siguen ahí para auditoría/RECAP histórico); filtra en el SELECT del frontend o en el helper del backend que sirve la respuesta.

6. Restricción adicional sobre comentarios: **no introduzcas en código ninguna cadena literal `"track_updated"` para documentar qué se eliminó.** Si necesitas dejar contexto sobre el cambio, házlo en el commit message, en el nombre del helper (`emitTrackEvent`-sin-track_updated implica la ausencia), o en `docs/Nucleo/SESION.md`. La verificación `git grep` en §7 asume cero hits sin excepciones.

   - Localiza cómo Timeline (`src/capsules/TimeCapsules.jsx`) y RECAP (`src/capsules/Recaps.jsx`) consumen events.
   - Si tienen un query de tipo `SELECT * FROM events WHERE ...`, añade `AND event_type != 'track_updated'` o `WHERE event_type IN ('track_created', 'track_deleted', 'track_played', 'track_paused', 'track_skipped', ...)`. Verifica qué event_types usan — son al menos: `track_created`, `track_deleted`, `track_played`, `track_paused`, `track_skipped`, `session_*`, `entry_created`, etc.
   - Lista blanca > lista negra. Mejor enumerar los event_types que SÍ quieres que aparezcan. Consulta `docs/operacional/auditoria_fable_1.0.md §3 🔒-5` + `docs/operacional/event-lifecycle.md` para la lista.

7. **Si encuentras consumers que dependen del antiguo PATCH → INSERT:** nace nuevo evento específico (e.g. `track_favorited`). NO dejes la app con un consumer que espera `track_updated` y un sistema que no lo emite sin reemplazo. Esta regla reitera el halt del paso 4; el ejecutor detiene el refactor y propone, no aplica el cambio unilateralmente.

**Verificación post-paso (binaria):**
```bash
npm run build                                          # exit 0
git grep -n "track_updated" workers/routes/tracks.js   # debe devolver 0 ocurrencias (ni ejecutables ni comentarios; el contexto explicativo va en commit/SESION, no en código)
git grep -rn "track_updated" workers/ src/              # SOLO quedan filtros de lectura
curl -i GET http://localhost:8787/api/events?from=... -H "Authorization: Bearer $JWT" \
   | jq '.results | map(select(.event_type == "track_updated")) | length'  # debe ser 0 en NUEVOS
```

**Post-deploy (después de que Edu levante la pausa):**
- Verificar `SELECT COUNT(*) FROM events WHERE event_type='track_updated' AND created_at > <fecha deploy>` → debe ser 0.
- Verificar en TimelineEdu: no aparecen eventos nuevos "TRACK UPDATED".

---

### ✦ SUB-ENTREGA 5: FASE D.3 — Housekeeping (V8, ~30-45 min)

**Tarea.** Borrar archivos `.bak*` en `src/`. Re-sync documentación de arquitectura. Corregir contadores en README / CLAUDE.md / PROYECTO.md.

**Paso a paso:**

1. **Borrar `.bak*`**:
   ```bash
   git ls-files src/ | grep -E '\.bak'  # lista primero
   git rm src/**/*.bak* 2>/dev/null || true
   find src/ -type f -name '*.bak*' -print0 | xargs -0 git rm
   git status
   ```
   **Confirma con `git status` que solo se borran `.bak`, no archivos legítimos.** V0 de Fable notes el archivo original del informe estaba truncado; puede haber `.bak` adicionales que el informe no enumeró (usa glob, no la tabla).

2. **Re-sync `docs/Arquitectura/INDEX.md`**:
   - `architecture.md`: cambiar `sincronizado_con: S146` a `sincronizado_con: S148 (FASE C.2 + D cerradas)`.
   - `rendering-flow.md`: igual.
   - `technical-debt.md`: igual.
   - Marcar ✅ OK en estos 3 (de ⚠️ STALE).

3. **`docs/Arquitectura/architecture.md`**: añadir en el mapa de componentes:
   - `src/vault/EntryLightbox.jsx` (nuevo S146).
   - Reflejar V4: `workers/routes/r2.js` con HMAC gate.
   - Reflejar V5: ya no emite `track_updated`.

4. **`docs/Arquitectura/rendering-flow.md`**: reflejar que en WALL/DIALOGUE/EXHIBITION/REEL el zoom se hace vía `EntryLightbox` (no `ZoomModal`/`zoomImage` antiguos). El "zoom modal" interno de cada modo ya no existe — la navegación full-bleed es el lightbox unificado.

5. **`docs/Arquitectura/technical-debt.md`**:
   - Eliminar TD-1 (dice Drive persiste; falso hoy; los 7 recursos viven en D1).
   - Si quieres, mantener TD-1 como histórico pero marcada ✅ RESUELTA con enlace a la AUDITORIA_TRANSVERSAL.

6. **Contadores**:
   - `CLAUDE.md`: ya dice 17 tablas (verificado S146). Si dice otra cosa en tu snapshot, corrige a **"17 tablas"**.
   - `CLAUDE.md` línea ~25: dice "16 rutas /api/* + servido R2 sin prefijo". Si dice otra cosa, corrige a **"16 prefijos ROUTES"**.
   - `docs/Nucleo/PROYECTO.md`: similar revisión. Coherente con `workers/schema.sql` (17 CREATE TABLE) y `workers/worker.js` (16 prefijos en `ROUTES` + R2 fuera).

7. **Actualizar `docs/Nucleo/ESTADO.md`**:
   - Marcar FASE C.2 ✅ CON C.2.1 + C.2.2 cerradas.
   - Marcar FASE D ✅ CON D.1 + D.2 + D.3 cerradas.
   - Añadir "(verificado build verde tras pliego; falta Fable validation Edu en móvil)" como nota.
   - Score recalculado: ~52 base + (C.2 ~10pts) + (D ~8pts) ≈ **70%**. (Fable recalcula después.)

8. **Actualizar `docs/Nucleo/SESION.md`**:
   - Abrir nueva entrada estilo:
     ```
     ## S148 — FASE C.2 + FASE D cerradas (13 Jul 2026 · GLM 2)
     C.2.1 Cero DEMO borrado total...
     C.2.2 WALL museo por eras...
     D.1 R2 HMAC gate (vault/docs/ + vault/audio/)
     D.2 track_updated silenciado
     D.3 Housekeeping completo
     Build verde. Fable valida Edu en móvil.
     ```

**Verificación post-paso (binaria):**
```bash
find src/ -type f -name '*.bak*'                    # 0 archivos
grep -c "CREATE TABLE" workers/schema.sql            # exacto 17
grep -c "✓\|track_updated" workers/routes/tracks.js  # el POST y DELETE sí; el PATCH no
grep -c '^  \["/api/' workers/worker.js              # exacto 16 prefijos en ROUTES
npm run build                                       # exit 0
npm run lint                                         # exit 0
```

---

## §5 · Entregable (qué entregas al final)

1. **Código modificado** en los archivos listados en §3.
2. **Reporte breve** en chat al cerrar (5-10 líneas):
   - Qué archivos tocaste (lista compacta).
   - Resultado del build y lint.
   - Resultado de las verificaciones binarias por sub-entrega.
   - Si elegiste opción A o B para D.1 emisión.
   - Si encontraste consumers de `track_updated` y cómo los migraste (o no).
   - Si encontraste `.bak` adicionales no enumerados en el informe V0.
   - Cambios en docs (qué resync hiciste).
3. **Sin `wrangler deploy`** (gate Edu). Tu trabajo queda en código local + commits.
4. **Si encuentras algo contradictorio con los ADRs** (e.g. un consumer que NECESITA `track_updated` y no hay alternativa clara): **DETÉN y reporta** antes de implementar; no improvises.

---

## §6 · Restricciones (qué NO se hace o qué errores evitar)

- ✘ No tocar `WinampPlayer.jsx` / `AudioVisualizer.jsx` / motor `PlayerContext.jsx` / `tokens.js` (CONGELADOS).
- ✘ No añadir nuevos tabs o modos galería (ADR-017, ADR-021).
- ✘ No introducir dependencias nuevas en `package.json` sin justificación clara. Si necesitas una (e.g. para HMAC date parsing), busca primero si ya hay una equivalente (e.g. `crypto.subtle` nativo del runtime Workers).
- ✘ No borrar archivos `.bak` salvo que `git ls-files src/ | grep -E '\.bak'` los confirme todos listados. Si encuentras uno no listado, documéntalo.
- ✘ No firmar tokens con un secret hardcodeado en el código. `R2_SIGN_SECRET` (o nombre que elijas) va en `wrangler.toml` como `vars` o `secrets` per la doc de Cloudflare.
- ✘ No crear un endpoint público nuevo (`requiresAuth: false`) sin justificación cerrada vía veredicto Fable (los 16 prefijos actuales en `ROUTES` están así por diseño).
- ✘ No usar servicios externos nuevos (Workers KV, Durable Objects, etc.) — el cierre v1.0 no abre superficie.
- ✘ No desarrollar el patrón `import.meta.env.DEV` para los DEMO. Borrado total, sin gate.
- ✘ No inventar nombres de prefixes R2 — usa los 5 que ya están en `workers/config.js` (`music`, `vault/photos`, `vault/videos`, `vault/docs`, `vault/audio`).
- ✘ No borrar histórico de `events` (🔒-3 append-only).
- ✘ No cambiar el comportamiento de `recordUndo`, `peekNextTrack` ni cualquier lógica que ya funciona — los congelados + funcionalidades probadas no se tocan.
- ✘ No micro-editar. Si un archivo necesita cambios, contenedor lógico completo. (ADR-015.)

**Errores comunes que debes evitar:**

- 🔴 Asumir que "DEMO borrado" significa "gate DEV" y dejar los DEMOs vivos para `dev`. Fable V1 dijo NO: borrado total.
- 🔴 Confundir frontend `signR2Read` con el flujo de `verifyR2Read` server-side. El server es la autoridad; el cliente solo pide firmas.
- 🔴 Aplicar el filtro `WHERE event_type != 'track_updated'` en SQL y no en JS. Esto ocultaría antiguos registros históricos; el filtro DEBE ser en el consumer (Timeline/RECAP), no en `SELECT * FROM events` puro.
- 🔴 Pensar que el grupo "sin era" en WALL se trata como una sala más. Mejor: divisor visual sutil o entrada sin header para mantener el principio de "las eras son las salas".
- 🔴 Olvidar actualizar `docs/Nucleo/PROYECTO.md` al corregir contadores. CLAUDE.md y PROYECTO.md se mueven juntos.

---

## §7 · Hand-off (cómo verifica Edu que está bien)

### Verificaciones inmediatas (las haces tú al cerrar)

```bash
npm run build                  # debe pasar a 0/0
npm run lint                    # debe pasar a 0/0
git grep -n "DEMO_TRACKS\|DEMO_ERAS\|DEMO_ENTRIES_GEO"   # 0
find src/ -name '*.bak*'       # 0
wrangler dev &                 # en background, espera ~3s
# Pruebas de endpoints nuevos / modificados (si tienes JWT local):
curl -s 'http://localhost:8787/api/health' | jq .
# Para D.1:
curl -i 'http://localhost:8787/vault/docs/test-key'   # 404 (sin token)
curl -i 'http://localhost:8787/vault/photos/test-key' # 200 si existe, 404 si no (sin gate)
# Para D.2: editar un track via PATCH y verificar que NO aparece evento nuevo en GET /api/events.
```

### Verificaciones humanas que Edu hace después (no tu trabajo)

1. **Valida EntryLightbox + WALL museo en el móvil**: S148 sesión tiene que cerrar lo que S146 dejó pendiente.
2. **Levanta la pausa de wrangler deploy** (cuando Promethe-os M0 cierre): tu código va directo.
3. **Verifica en producción**:
   - `curl https://el-bunker-api.thebunker-admin.workers.dev/vault/docs/uuid_test_key` → 404.
   - `curl https://el-bunker-api.thebunker-admin.workers.dev/api/events?from=YYYY-MM-DD | jq '.results | map(.event_type)' | unique` → no debe contener `track_updated` para fechas posteriores al deploy.
   - En móvil Edu: editar metadata de un track y ver que Timeline NO muestra el evento.
   - En móvil Edu: tap en una foto de vault/docs/audio → debería abrir el EntryLightbox con URL firmada (visible en DevTools).
   - En Docs visual de Code: ningún archivo `.bak` debe quedar (Editor Explorer).
4. **Recalcula el score en auditoría pasada #3** (cuando Fable la pida). El score subió a ~70-75% según §1.
5. Si Edu decide algo distinto (cambia criterio), la pasada #3 lo reconcilia. No reviertas código a mano sin pasar por Fable.

### Lo que queda en parking explícito (rúbrica para Fable pasada #3)

- Sustituir Google OAuth (ADR-025 reversible solo con nuevo ADR)
- Cifrado de cliente del vault
- Vercel → Cloudflare Pages
- Los 12 ítems de B.3
- Las 9 features avanzadas de Time Capsules
- Modo inmersivo "tap-inmersivo full-bleed" (C: ya reemplazado por EntryLightbox)
- Refactors del reproductor/estética (CONGELADO)

---

## §8 · Cronograma esperado (para que Edu calcule tiempo)

| Sub-entrega | Estimación | Notas |
|---|---|---|
| 1. FASE C.2.1 (Cero DEMO) | 15-20 min | Rápido, delete-only. |
| 2. FASE C.2.2 (WALL museo) | 45-90 min | Mayor: nuevo `useMemo`, headers custom, cuidar virtualización. |
| 3. FASE D.1 (R2 HMAC) | 60-90 min | Backend + frontend + decisión opción A/B. |
| 4. FASE D.2 (track_updated) | 30-60 min | Solo elimina INSERT + documenta filtros. |
| 5. FASE D.3 (Housekeeping) | 30-45 min | Busca `.bak` con glob, resync docs. |
| **Total** | **3-5 horas** | Con Verificaciones tras cada sub-entrega. |

Si la sesión GLM 2 es de 1 hora, prioriza:
1. C.2.1 (siempre).
2. C.2.2 (rápido si la virtualización ya está bien armada).
3. D.1 (más crítico y aislado).
4. D.2 y D.3 si sobra tiempo.

---

## §9 · Criterio de cierre v1.0 (binario, verificable)

Reproducción de la checklist de ADDENDUM CIERRE v1.0. Cada ítem debe pasar:

- [ ] **WALL museo vivo** (C.2.2 hecho): headers por era visibles, masonry intacto dentro, virtualización preservada.
- [ ] **Cero DEMO en prod** (C.2.1 hecho): grep en `src/` devuelve 0 hits para DEMO_TRACKS/DEMO_ERAS/DEMO_ENTRIES_GEO.
- [ ] **R2 gate HMAC** (D.1 hecho): `curl https://worker/vault/docs/<key>` sin token → 404; con token firmado válido → 200 (cuando key existe).
- [ ] **track_updated silenciado** (D.2 hecho): cero INSERTs nuevos; Timeline/RECAP filtran el event_type en lectura.
- [ ] **Housekeeping** (D.3 hecho): cero `.bak*` en `src/`; docs resynced; contadores CLAUDE.md/PROYECTO.md corregidos a 17 tablas + 16 prefijos ROUTES.
- [ ] **Build verde**: `npm run build` exit 0; `npm run lint` exit 0.
- [ ] **Congelados intactos**: diff del cierre NO toca `WinampPlayer.jsx` / `AudioVisualizer.jsx` / motor `PlayerContext.jsx` / `tokens.js`. (Verificar con `git diff master..HEAD -- src/musiclab/ src/tokens.js src/core/PlayerContext.jsx`.)
- [ ] **Fable pasada #3 pendiente**: Edu encarga a Fable una pasada de auditoría post-cierre con score recalculado + validación humana móvil.

---

## §10 · Estado al cerrar (lo que escribes en el reporte final)

Al cerrar tu trabajo, responde con:

```
S148 — [sub-entregas completadas] (13 Jul · GLM 2)

Sub-entregas: [✓/✗] C.2.1 / C.2.2 / D.1 / D.2 / D.3
Build/Lint:  [exit codes]
Verificaciones: [...]
Arquivos tocados: [lista corta]
Decisión D.1 emisión: [opción A o B + justificación 1 línea]
Consumers de track_updated encontrados: [sí/no, cómo resuelto]
.bak adicionales encontrados: [sí/no, lista]
D.3 docs resynced: [qué cambiaste]
```

Manda el reporte; Edu revisa + (cuando levante la pausa) ejecuta `wrangler deploy` y validación humana en móvil.

---

> Fin del encargo. Empieza por leer las tres docs de resoluciones vinculantes (`auditoria_pasada_2_2026-07-08.md §VEREDICTOS FABLE S147`, `cola_decisiones_fable.md §RESOLUCIÓN FABLE S145`, `auditoria_fable_1.0.md §ADDENDUM CIERRE v1.0`), luego §3 Contexto archivo por archivo antes de tocar nada.
