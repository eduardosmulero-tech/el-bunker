# EL BUNKER — Auditoría pasada #2 (post-S146, pre-FASE C.2)
> Autor: Buffy/Sonnet (redactor, no auditor) · Pendiente de: Fable (auditor)
> Fecha: 2026-07-08
> Complementaria a: docs/AUDITORIA_TRANSVERSAL_FABLE_2026-07.md
>
> Este informe NO emite veredictos. Solo compila hallazgos con evidencia archivo:linea para que Fable los audite y emita los veredictos que correspondan. Ver metodologia al final.

---

## A. Estado de fases del plan §7 vs verificacion contra codigo (factual)

| Fase | Estado docs | Evidencia codigo verificada | Notas |
|------|-------------|------------------------------|-------|
| FASE A | OK S144 | OK reverificado en vivo por AUDITORIA_TRANSVERSAL (curl 08-jul madrugada) | 6 P1 cerrados |
| FASE B | OK S145 | OK verificado aqui: src/core/PlayerContext.jsx:891 peekNextTrack useMemo (estable, top-of-file); src/musiclab/WinampPlayer.jsx (refs :65/:671/:677 ±10 por refactor S145 PLIEGO-237, segunda fila controles); literal "A CONTINUACION: {peekNextTrack.title} — {peekNextTrack.artist}" | CRT 0.12 y caratula base pendiente verificacion adicional |
| FASE C.1 | OK S146 | OK verificado aqui: src/vault/EntryLightbox.jsx existe (export linea 36); src/vault/VaultGallery.jsx:11 import; :1231 un unico render compartido; onOpenLightbox propagado a DialogueView (:268), ExhibitionView (:524), ReelView (:616), WallView (:1157) y a traves de WallView.jsx:294 | Falta confirmacion humana en movil de swipe/pinch/cierre en los 5 modos |
| FASE C.2 | Pendiente | Decisiones 4-B y 5-A tomadas en S145, sin codificar | Pliego ejecutor pendiente |
| FASE D | Pendiente | R2 auth (P3.12) verificado abierta abajo B.1.D; ruido track_updated verificado abierta abajo B.1.E; housekeeping .bak/legacy pendiente | Pliegos ejecutores pendientes; produccion PAUSADA por Edu (gate wrangler deploy) |

## B. Decisiones de producto pendientes (sin emitir veredicto)

### B.1 ABIERTAS en scope v1.0 — el codigo todavia NO esta migrado

> **Caveat de líneas (validado por Gemini 08-jul):** las refs `archivo:línea` citadas abajo son nombres de símbolo (`peekNextTrack`, `track_updated`, DEMO_TRACKS, CATEGORY_FILTERS.map, etc.) VERIFICADAS y están donde el informe dice en el momento de redactar. Los números de línea concretos pueden haber drifted ±5-30 (típico ±5 verificado por Gemini en `WinampPlayer.jsx`, peor caso ±30 en zonas tocadas por ambos refactors叠加) tras dos rondas de refactor recientes (PLIEGO-237 segunda fila controles en `WinampPlayer.jsx` + adopción `EntryLightbox` S146 en `VaultGallery.jsx`/`WallView.jsx`). Fable debe reverificar números concretos con `git blame -L <line> archivo` antes de auditar línea-a-línea. Los nombres de función, hooks, props y constantes son estables.

#### B.1.A C.2 — Cero DEMO en produccion (decision 5-A ya tomada, sin implementar)
Evidencia: siguen activos los 3 fallbacks.

| Constante | Archivo:linea | Estado actual |
|-----------|---------------|--------------|
| DEMO_TRACKS | src/musiclab/MusicLab.jsx:31 (def), :61 (const rawTracks = db?.music_lab?.tracks ?? DEMO_TRACKS) | activo |
| DEMO_ERAS | src/vault/Vault.jsx:30 (def), :744 (const displayEras = eras_arr.length > 0 ? eras_arr : DEMO_ERAS) | activo |
| DEMO_ENTRIES_GEO | src/vault/VaultGallery.jsx:758 (def 9 hardcoded), :846 (const MapView = ({ entries = DEMO_ENTRIES_GEO, eras = [] }) => {) | activo |

Detalle adicional: decision 5-A dice "cero DEMO en produccion" pero no especifica que hacer con los datos DEMO_ENTRIES_GEO para desarrollo local (gate import.meta.env.DEV vs borrado total).

#### B.1.B C.2 — WALL museo con salas por era (decision 4-B sin implementar)
- src/vault/WallView.jsx:294 firma actual: { entries, eras, density, setDensity, filterCategory, accentColor, onOpenLightbox } — sin campo groupBy/eraFilter/secciones
- Caveat tecnico vinculante: WALL esta virtualizado — los headers de seccion deben integrarse sin romper la virtualizacion (agrupar por era ANTES de la ventana de render). Sin prueba de concepto en codigo.

#### B.1.C P2.6 — Filtro de categoria duplicado (ESTADO dice cerrado en PLIEGO-236; REGLA DE ORO pedir re-verificacion)
Evidencia: re-verificado aqui, cerrado correctamente.
- src/vault/Vault.jsx:591 const [filterCategory, setFilterCategory] useState("all") — estado unico
- src/vault/Vault.jsx:902 CATEGORY_FILTERS.map((cat) => { ... }) — render unico en Vault.jsx
- src/vault/Vault.jsx:981 propagacion `<Gallery ... filterCategory={filterCategory} />`
- src/vault/VaultGallery.jsx:1125 signature VaultGallery({ ..., filterCategory = "all", ... }) — recibe como prop
- src/vault/VaultGallery.jsx:1155 `<WallView ... filterCategory={filterCategory} />` — propaga a WallView
- src/vault/WallView.jsx:294 recibe como prop

Hallazgo: VaultGallery.jsx:17 importa CATEGORY_FILTERS pero solo lo usa en :32-33 para construir CAT_LABEL/CAT_ICON (helpers). NO renderiza fila propia de filtros (grep CATEGORY_FILTERS.map solo aparece en Vault.jsx:902). Estado P2.6 confirmado cerrado a nivel codigo.

#### B.1.D D — R2 con auth/token en prefijos sensibles (P3.12, abierto)
Evidencia: workers/routes/r2.js NO impone auth.
Contenido del archivo (completo):
- export default async function handleR2(request, env, path)
- if (request.method !== "GET") return err("Method not allowed", 405)
- const r2_key = path.slice(1)
- if (!r2_key) return err("Not found", 404)
- const obj = await env.BUNKER.get(r2_key)
- if (!obj) return err("Not found", 404)
- return new Response(obj.body, { ... })

Sin check authenticate ni userId. Sin check de prefix sensible. Dispatcher (workers/worker.js:42-46) confirma: if (!path.startsWith("/api/")) → handleR2 ANTES del rate limit y ANTES del authenticate().
Taxonomia referencia (docs/spec/taxonomia_vault.md s3 y s12) define: legal, medico, financiero, profesional, educacion, backup 2FA, por si me pasa algo, contactos emergencia, voluntades, caja fuerte, llaves de recuperacion. Sin enumeracion oficial en plan §7.

#### B.1.E D — Ruido track_updated inunda events
Evidencia: cada PATCH emite sin filtrar (workers/routes/tracks.js metodo PATCH ~linea 90-93):
- INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES track_updated, userId, trackId, JSON.stringify(body)

Idéntico INSERT para track_created (POST ~linea 56) y track_deleted (DELETE ~linea 110). Cualquier PATCH genera un evento. Timeline.jsx y RECAP consumen de events → dominados por micro-PATCHes.

### B.2 DIFERIDAS en spec, confirmadas en parking por Edu en este turno (08-jul)
- Sustituir Google OAuth por auth propio (passkey/magic-link) — POST-v1.0
- Cifrado en cliente del vault — POST-v1.0
- Consolidar Vercel → Cloudflare Pages — POST-v1.0

ADR-025 + 🔒-6 siguen inamovibles.

### B.3 PENDIENTES en spec que NO aparecen en plan §7 de cierre

| ID | Spec origen | Pendiente declarado en spec | Aparece en plan §7? |
|----|-------------|-----------------------------|----------------------|
| VB20 | reproductor_spec_v2.md s VB | Fase B — PENDIENTE SESION DE DISENO DEDICADA | No |
| VB10-M3 | reproductor_spec_v2.md s VB10 | DECISION MOVIL — replantear tras test en dispositivo real | No |
| O4 | auditoria_cruzada_vault_musiclab.md overlap O4 | Drop significativo → entrada VAULT, accion explicita | No |
| TC-1..9 | capsulas_spec.md s TIME CAPSULES | 9 features listadas; src/capsules/TimeCapsules.jsx solo tiene demo data | No |
| MAP Sub-fases 2-5 | CHANGELOG.md v2.0.22 | PLIEGO-231 (polylines), 232 (slider), 233 (geocoder), 234 (privacy) sin codificar | No |
| LIVE Sync | galeria_vault_spec.md s Integracion | ambos usuarios pueden sincronizar la vista Fase C | No |
| DROP-M20 | reproductor_spec_v2.md s DROP | abre en navegador nativo; fix en Fase B | No |
| DROP-M21 | reproductor_spec_v2.md s DROP | Snapshot metadatos al marcar favorito PENDIENTE | No |
| AUDIO-M22 | reproductor_spec_v2.md | FLAC + OPUS Fase C | No |
| HEIC/RAW | galeria_vault_spec.md s Fases | Soporte Fase C; PROYECTO excluye iOS Safari | No |
| DRAG-GLOBAL-C | technical-debt.md s Diferida | Unificar animaciones de drag & drop sin scope definido | No |
| VIZ-M12..16 | reproductor_spec_v2.md s VIZ | Live wallpaper lockscreen, presets VIZ, screensaver TV, animacion entrada vibe | No |

## C. Drift / Stale en documentacion (housekeeping pre-v1.0)

| Item | Estado verificado | Accion sugerida |
|------|-------------------|----------------|
| docs/Arquitectura/architecture.md | STALE (INDEX.md lo marca desde S146) — añadir EntryLightbox.jsx al mapa de componentes | Re-sync |
| docs/Arquitectura/rendering-flow.md | STALE (INDEX.md lo marca) — 4 modos pasaron ZoomModal/zoomImage → EntryLightbox | Re-sync |
| docs/Arquitectura/technical-debt.md TD-1 | STALE — TD-1 dice que libraries/playlists/drops/tags siguen en Drive; AUDITORIA_TRANSVERSAL ya refuto | Eliminar o reemplazar |
| src/musiclab/MusicLab.bak_20260604 | Existe | Borrar |
| src/musiclab/WinampPlayer.bak_20260614 | Existe | Borrar |
| src/smoke/SmokeSession.jsx.bak_2026061… | ⚠️ FILA TRUNCADA (ver nota Fable abajo) | Borrar |

---

# ✅ VEREDICTOS FABLE (S147, 2026-07-13)

> Auditor: Fable 5. Evidencia clave reverificada contra código real hoy (Regla de Oro):
> los 3 DEMO fallbacks, `workers/routes/r2.js` completo, `workers/routes/tracks.js` (INSERTs de
> events), `workers/config.js` (VALID_UPLOAD_PREFIXES), `src/capsules/TimeCapsules.jsx` (persistencia).

## V0. Sobre el propio informe

- **El archivo original está TRUNCADO en la línea 105** (se corta a mitad de la fila
  `SmokeSession.jsx.bak_…` de §C). La lista de housekeeping es incompleta por construcción:
  el pliego de FASE D debe localizar los `.bak` con glob (`src/**/*.bak*`), no fiarse de esta tabla.
- §A (estado de fases): ratificado, coincide con ESTADO.md. Nada que decidir.

## V1. B.1.A — DEMO en desarrollo → **BORRADO TOTAL** (sin gate `import.meta.env.DEV`)

- Se borran las definiciones y los fallbacks de `DEMO_TRACKS`, `DEMO_ERAS`, `DEMO_ENTRIES_GEO`.
  Razón: modo cierre = menos código; el desarrollo ya va contra el worker real (no hay backend
  mock que justifique datos falsos); los estados vacíos elegantes ya existen y con datos reales
  cargados no se verán casi nunca.
- Reverificado hoy: los 3 siguen activos. Refs actuales: `VaultGallery.jsx:758` (def) y `:846`
  (default de MapView — no :868, drift confirmado), `Vault.jsx:30`/`:744`, `MusicLab.jsx:31`/`:61`.
  También limpiar el comentario backward-compat de `VaultGallery.jsx:1192` que referencia
  DEMO_ENTRIES_GEO.
- Va en el mismo pliego FASE C.2 junto a WALL museo (4-B), como ya preveía la cola S145.

## V2. B.1.B — WALL museo: sin decisión nueva

4-B vigente tal cual (cola_decisiones_fable.md §4). El caveat de virtualización (agrupar por era
ANTES de la ventana de render) es vinculante para el pliego.

## V3. B.1.C — P2.6: ratifico CERRADO

La re-verificación del informe es correcta y coherente (estado único en `Vault.jsx`, render único
de `CATEGORY_FILTERS.map`, propagación por props). No reabrir.

## V4. B.1.D — R2 auth (P3.12) → **token HMAC en query solo para `vault/docs` y `vault/audio`**

**Hallazgo del auditor que reencuadra la tarea:** los prefijos R2 reales son FUNCIONALES —
`music`, `vault/photos`, `vault/videos`, `vault/docs`, `vault/audio` (`workers/config.js:20-26`) —
NO por categoría de taxonomía. "Prefijo sensible" tal como lo sugiere `taxonomia_vault.md`
(legal/, medico/, financiero/…) no existe en R2; crearlo exigiría migración de keys → fuera de
scope v1.0. Veredicto en 3 piezas:

1. **Gate en `r2.js`:** si `r2_key` empieza por `vault/docs/` o `vault/audio/` → exigir token HMAC
   firmado en query (`?t=`), con TTL (reutilizar `JWT_EXPIRY`, secret en env del worker). Ahí es
   donde la taxonomía coloca lo sensible (legal, médico, financiero, 2FA, voluntades, notas de voz).
   Sin token válido → 404 (no 401/403: no revelar existencia).
2. **`music/`, `vault/photos`, `vault/videos` siguen como hoy** (keys `crypto.randomUUID()` no
   enumerables, sin endpoint de listado sin auth). Riesgo residual = filtración de URL concreta;
   ACEPTADO y documentado para una app de 2 usuarios. Endurecer todo R2 = POST-v1.0 (parking de
   soberanía, junto a cifrado cliente).
3. **Emisión del token:** la firma la genera el worker en contexto autenticado y el frontend añade
   `?t=` al resolver la key a URL absoluta (patrón resolver existente). El mecanismo exacto
   (endpoint de firma vs URL firmada en la respuesta de la entry) lo decide DeepSeek al
   implementar — lo vinculante es: HMAC + TTL + validación solo en esos 2 prefijos + resto intacto.

`PUT /api/upload/:key` ya exige auth (verificado) — el gate es solo de lectura.

## V5. B.1.E — track_updated → **dejar de emitir + ignorar en lectura; NO borrar histórico**

1. **Eliminar el INSERT de `track_updated`** en el PATCH (`tracks.js:95-97`, verificado hoy: emite
   el body entero de cualquier micro-edit). Un cambio de metadata no es una memoria.
   `track_created` (:74-76) y `track_deleted` (:108-110) se quedan.
2. **El histórico NO se borra** — 🔒-3 (events append-only) prevalece. Timeline y RECAP filtran
   `event_type = 'track_updated'` en lectura: el ruido histórico desaparece de la vista sin tocar
   la tabla.
3. Caveat para el pliego: si algún consumidor usa hoy `track_updated` para algo legítimo (p.ej.
   detectar favoritos), ese caso migra a un event_type específico (`track_favorited` al togglear),
   nunca al PATCH genérico. DeepSeek verifica consumidores antes de tocar.

## V6. B.2 — ratificado: parking POST-v1.0

Auth propio, cifrado cliente, Vercel→Pages: fuera de v1.0. ADR-025 + 🔒-6 intactos.

## V7. B.3 — los 12 ítems → **PARKING POST-v1.0**, con una corrección factual

- Ninguno bloquea la promesa emocional de v1.0. El ADDENDUM CIERRE manda: v1.0 = FASE C + FASE D
  y se acaba. Los 12 quedan en parking explícito (no "olvidados": rechazados para v1.0 a
  conciencia).
- **Corrección factual a la tabla:** la premisa de TC-1..9 ("TimeCapsules.jsx solo tiene demo
  data") es FALSA hoy — el componente ya persiste contra la API real
  (`workerClient.get('/api/time_capsules')` :76, `.post` :115, verificado). El core de Time
  Capsules es real; lo que queda en parking son las 9 features avanzadas de la spec.

## V8. §C — housekeeping: acciones ratificadas (todas dentro de FASE D)

Re-sync `architecture.md` y `rendering-flow.md`, eliminar/reescribir TD-1 (ya refutado por
AUDITORIA_TRANSVERSAL), borrar `.bak` (vía glob, ver V0).

## Orden de ejecución resultante (sin cambios de rumbo)

1. **FASE C.2** (próximo pliego, ya apuntado en ESTADO.md): WALL museo por eras (V2) + cero DEMO
   borrado total (V1). Frontend-only, no requiere deploy de worker.
2. **FASE D** con estos veredictos: V4 (r2.js + resolver frontend), V5 (tracks.js + lectores),
   V8 (docs + .baks). ⚠️ V4 y V5 requieren `wrangler deploy` → **gate de Edu: producción PAUSADA
   (09-jul) hasta cerrar M0 de Promethe-os. No desplegar sin su orden.**

> Fin de veredictos. Este bloque es la resolución vinculante de las decisiones abiertas de este
> informe, con el mismo rango que la RESOLUCIÓN FABLE S145 de `cola_decisiones_fable.md`.
