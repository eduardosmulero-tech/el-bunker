# INFORME DE AUDITORÍA UI — El Búnker (2026-08-04)

> Ejecutor: Hermes (deepseek-v4-flash) · navegador headless + Worker API + D1 remoto + R2
> Alcance: barrido completo pantalla a pantalla en producción (VAULT, MUSIC LAB, CAPSULES, login, PWA)
> Material para revisor externo: este informe + CHECKLIST.md + screenshots/ + logs/ — sin URLs de acceso vivo, sin JWT, sin claves.
> Método: interacción real con cada elemento (click/pointer events), consola JS tras cada acción, verificación por artefacto (D1 remoto, API, R2), capturas de cada pantalla.

---

## RESUMEN EJECUTIVO

| Métrica | Valor |
|---|---|
| Items del checklist | 66 |
| OK | 49 |
| Observaciones | 10 |
| Fallos | 4 (H-01 rate limit; H-11/H-12/H-13 truncamientos, reproducidos 2/2) |
| No verificables en headless | 3 (play de audio, descarga backup, Google OAuth) |
| Bugs P1 del 2-ago (P1-01, P1-02) | **RESUELTOS** (verificado por artefacto hoy) |
| Datos de prueba creados y limpiados | entrada (soft-deleted), era (física), track+MP3 (soft+R2), cápsula (física) |
| Baseline tras la auditoría | 527 entries activas · 2 eras · 529 tracks activos (intacto) |
| Método visual | **Canon DOM-first**: toda anomalía visual medida por DOM (overflow/posición) antes de mirar la imagen; la imagen solo confirma o aporta lo no medible (estética) |

---

## HALLAZGOS

### H-01 — [CRÍTICO / P1] Rate limit de 10 req/s por IP rompe la carga normal de la app
- **Dónde:** worker completo (`workers/utils/rate-limit.js:10-21`, aplicado en `workers/worker.js:69`)
- **Qué pasa:** el límite es 10 requests/segundo por IP para TODAS las rutas /api/, con ventana de 1 s y contador **en memoria del isolate**. La app dispara muchos fetches en paralelo al cargar (entries, eras, tracks, tags, playlists, drops, queue…). Al superar el límite, el worker responde 429 y la app pierde datos (ej. la cola de reproducción).
- **Evidencia en vivo:** warning en consola en 2 de 2 cargas limpias: `[Búnker] fetchQueue (Worker): Error: Worker GET /api/queue/admin: 429`. Resultado observable: mini-player sin track/cola cargada.
- **Reproducción:** login → esperar carga → consola (2/2 veces reproducido).
- **Por qué es grave:** (a) degrada la app en uso normal, (b) como control de seguridad es ineficaz — el Map vive en el isolate, así que cada isolate nuevo resetea el contador y la protección no es global por IP.
- **Propuesta (decisión de Edu):** subir el límite (p. ej. 30-50 req/s), o limitar solo rutas sensibles, o mover el contador a Durable Object/Cache API con ventana real.

### H-02 — [INFO] P1-01 del 2-ago REVISADO: crear entrada SÍ persiste en D1
- La auditoría del 2-ago (P1-01: Vault.jsx solo patchDb local) **ya no aplica**: `handleAddEntry` (Vault.jsx:603-635) hace `POST /api/entries` y el worker registra `entry_created`.
- **Verificado por artefacto:** entrada de prueba creada desde la UI → fila en D1 remoto (`is_deleted=0`, `from_user=admin`) → soft-deleted después (DELETE 200, `is_deleted=1`).
- Conclusión: bug corregido, cerrado.

### H-03 — [INFO] P1-02 del 2-ago REVISADO: AddTrackForm SÍ sube el MP3 a R2
- `onAddTrack` (useMusicActions.js:16-61): POST /api/tracks → uploadFile PUT binario → PATCH r2_key → patchDb local.
- **Verificado por artefacto:** MP3 sintético subido desde la UI → track en D1 con `r2_key: music/<uuid>_qa_test.mp3` → objeto GET directo 200 (audio/mpeg) → limpiado (DELETE track 200 + DELETE objeto R2 200 + GET 404 posterior).
- Conclusión: bug corregido, cerrado. Nota: la URL de stream es `R2_PUBLIC_BASE + r2_key` (getStreamUrl) — la convención `tracks/<id>.mp3` del import masivo antiguo convive con `music/<uuid>_<name>.mp3`; ambas se sirven.

### H-04 — [MEDIO / P2] Desajuste de esquema: `entries` sin `deleted_at/deleted_by` (DATA-1 confirmado en vivo)
- D1 remoto: `PRAGMA table_info(entries)` = id, era_id, type, title, content, from_user, to_user, is_deleted, created_at, updated_at. Sin `deleted_at` ni `deleted_by`.
- `tracks` SÍ los tiene (migración 1-ago). Cualquier SELECT/UPDATEst con `deleted_at` sobre entries falla (`no such column` — verificado).
- No es bug nuevo: es la inconsistencia DATA-1 ya documentada (auditoría 2-ago) y propuesta en PLAN_REFACTOR_HIGIENE 3-ago sin aprobar. Pendiente de decisión de Edu. Hoy el DELETE de entries funciona porque usa `is_deleted + updated_at` (no `deleted_at`).

### H-05 — [BAJO / P3] Lightbox: pie de ayuda desborda ~25px en viewport bajo
- `EntryLightbox`: los contenedores de imagen (flex-1, absolute inset-0, w-full h-full) miden `scrollHeight 537 vs clientHeight 512` — el pie ("tap para cerrar · desliza ◀ ▶ · doble tap zoom · pellizca") queda parcialmente fuera en viewports bajos.
- Verificado por DOM (3 contenedores con overflow 25px). En móvil real puede variar — revisar en la aceptación móvil pendiente.
- Captura: 01_vault_lightbox.png (el pie queda fuera de cuadro abajo).

### H-06 — [BAJO / P3] Submit silencioso sin tag en formularios
- AddTrackForm.jsx:30 `if (!form.title.trim() || !form.tag) return;` — si el usuario no elige tag (género), pulsa AÑADIR y **no pasa nada**: sin toast, sin validación visual, sin deshabilitar el botón. Mismo patrón en el modal de entrada del vault.
- Propuesta: deshabilitar el botón hasta completar campos obligatorios o mostrar validación inline.

### H-07 — [BAJO / P3] Cápsulas selladas sin gestión de borrado
- API: solo `GET/POST /api/time_capsules` y `PATCH /api/time_capsules/:id` (capsules.js) — no existe DELETE. En la UI, una cápsula sellada por error es permanente (hasta abrirse por fecha). Puede ser intencional (concepto de "sello"), pero no hay confirmación de producto.
- Durante la auditoría: cápsula de prueba eliminada por D1 directo (única vía).
- Nota: el nombre de tabla/endpoint es `time_capsules` (no `capsules`).

### H-08 — [BAJO / P3] Consumo de memoria con 527 entries: 4 OOM kills del navegador headless
- El entorno headless (con límites de memoria reducidos) mató la página 4 veces en ~30 min con la app abierta (mensajes "Sesión restaurada tras OOM kill" y `about:blank`). Las fotos de 2048px en DOM + masonry virtualizado pesan.
- No es un bug de la app per se, pero refuerza la prioridad de la aceptación en dispositivo real (móvil/PWA) y de vigilar memoria en Android. La restauración de sesión tras el kill funciona (sessionStorage).

### H-09 — [OBSERVACIÓN] UI: redundancia y ambigüedad menor
- Widget AVENTURA EN CURSO muestra el mismo periodo como "0Y · 1M · 22D" Y "52 DÍAS" simultáneamente (redundante, confuso).
- El indicador "· offline ·" del header es la **presencia del partner** (no conectividad) — fácil de malinterpretar como estado de red. Considerar etiqueta distinta (ej. "sin partner conectado").

### H-10 — [INFO] Iconografía emoji del vault (deuda conocida)
- Confirmado en vivo: ~75 tipos de entrada emoji en el modal + 15 filtros emoji (📷✎📄…). Deuda conocida de Edu (no defender como diseño; si se queja, es pliego).

### H-11 — [MEDIO / P2] Títulos de entradas truncados en la galería WALL (23 items, ~37% del texto perdido)
- **Qué pasa:** en el masonry de WALL, los nombres de archivo bajo cada foto se truncan con ellipsis: el texto necesita **194px** y el contenedor solo da **122px** (clase `text-xs truncate leading-tight`, contenedor `absolute inset-x-0 bottom-0 p-2`). Se pierde ~37% del título (ej. `takeout_IMG-20211101-WA0012` → `takeout_IMG-20211101-WA…`).
- **Evidencia:** barrido por scroll completo del DOM — **23 cortes medidos** (scrollWidth > clientWidth + 3) en la era 2021; reproducido 2/2 en cargas independientes (turno original y re-auditoría de esta noche).
- **Impacto:** el nombre del archivo es la única etiqueta del recuerdo en ese modo; truncado pierde información. Con ellipsis (no corte en seco) — es un defecto de diseño del contenedor, no un fallo de render.
- Capturas: 05_vault_wall_cortes.png (evidencia cruda).

### H-12 — [MEDIO / P2] Títulos de tracks truncados en MUSIC LAB (14 items, algunos a 1/3)
- **Qué pasa:** en la lista de tracks, títulos largos (remixes/slowed) se truncan con ellipsis agresiva: `Ain´t No Love In The Heart Of The City vs Fuzz And…` necesita **662px** y tiene **247px** (pierde ~60% y el dato del remix, que es la información clave del track); clase `text-xs font-bold truncate` en contenedor `flex-1 min-w-0`.
- **Evidencia:** barrido completo del DOM — **14 cortes medidos**; reproducido 2/2 en cargas independientes. El caso peor: 662 vs 247px.
- **Impacto:** títulos de remixes (slowed/nightcore/speed up) quedan irreconocibles; el usuario no puede distinguir versiones sin abrir el track.
- Captura: 04_musiclab_cortes.png.

### H-13 — [BAJO / P3] Títulos de eventos truncados en CAPSULES · TIMELINE (2 items)
- **Qué pasa:** el texto `admin Ｌａｄｙ，Ｈｅａｒ Ｍｅ Ｔｏｎｉｇｈｔ (slowed down)` necesita **401px** y el contenedor da **302px**; mismo patrón en `admin lady gaga ft beyonce - telephone (slow…` (403 vs 302). El prefijo "admin " consume ancho sin aportar (el autor ya se muestra aparte).
- **Evidencia:** barrido DOM — 2 cortes medidos; reproducido 2/2.

### H-14 — [REQUISITO DE EDU, 3 peticiones] Adaptación a escritorio (navegador real) NO está tratada como deuda en ningún doc vivo
- **Contexto:** Edu ha pedido 3 veces adaptar la app a pantalla de escritorio cuando se usa en navegador real (no instalada en Android). La auditoría del 2-ago lo documentó (DEUDA-UI-03, P3 "HUD desktop", ALTA por queja explícita) y PROYECTO.md:54 dice textualmente: *"la app no está optimizada para desktop"*.
- **Contradicción:** `docs/Arquitectura/architecture.md:110` (S152/S153) y el ACTA G0-G1 declaran "responsive desktop implementado" y G6 "aceptación verificada" — pero la aceptación real quedó pendiente (ESTADO.md:29: "Pendiente: viewport móvil real"), y esta re-auditoría **mide** en viewport 1264x625 (escritorio real) los H-11/H-12/H-13: la galería de 3 columnas estrechas (122px) y la lista de tracks de columna única comprimida no están optimizadas para escritorio.
- **Veredicto:** el requisito existe (3 peticiones), los docs se contradicen (unos dicen hecho, otros pendiente, PROYECTO.md dice no optimizada) y **no aparece en el checklist de cierre como tarea propia**. Es deuda real de producto pendiente de pliego: decidir qué significa "versión escritorio" (layout multi-columna, atajos de teclado, filas de tracks más anchas, HUD) y ejecutarla.

---

## VERIFICACIONES POR ARTEFACTO (logs/d1_verificaciones.md)

1. `POST /api/auth/token` (clave → JWT): 200 · `GET /api/eras` con JWT: 200
2. Entrada de prueba: D1 `entries` (is_deleted=0 → tras DELETE is_deleted=1) ✓
3. Era de prueba: D1 `eras` (creada → DELETE físico 200 → count 0) ✓
4. Track de prueba: D1 `tracks` con r2_key ✓ · objeto R2 GET 200 ✓ · limpieza 200/200 ✓
5. Cápsula de prueba: D1 `time_capsules` (creada con unlock_at 2099 → borrada D1 directo) ✓
6. Baseline final: 527 entries activas · 2 eras · 529 tracks activos · 1.117 tracks totales (588 soft-deleted) ✓
7. Streaming: `GET /tracks/<id>.mp3` (r2_key `tracks/…`) → 206 audio/mpeg ✓
8. PWA: manifest (standalone, 5 iconos, 2 shortcuts) · SW activated · 2 cachés ✓
9. Rate limit: 429 en `GET /api/queue/admin` reproducido 2/2 cargas ✓ (H-01)

## NO VERIFICADO (entorno headless) — pendientes para aceptación real
- Reproducción de audio (autoplay policy del navegador automatizado; el streaming 206/200 funciona)
- Descarga real del BACKUP JSON (patrón Blob+`<a download>` correcto en código)
- Google OAuth completo (requiere cuenta Google; Gate 1 de David OK documentado)
- Viewport móvil 390x844 y PWA instalada en Android (pendiente conocido del proyecto)

## DATOS DE PRUEBA RESIDUALES (transparente, no destructivo)
- 2 filas soft-deleted en D1: entrada `QA_TEST_20260804` (585dda1f) y track `QA_MP3_TEST_20260804` (d86d1cd9) — invisibles en la app. Limpieza física si Edu lo pide:
  `DELETE FROM entries WHERE id='585dda1f-1487-402d-8654-225fe56c21fd'; DELETE FROM tracks WHERE id='d86d1cd9-4e08-4d09-ac8c-368dd4209bd6';`
- Nota: `QA_ERA_20260804` y `QA_CAPSULE_20260804` fueron eliminadas físicamente (0 filas restantes).

## MÉTODO Y LIMITACIONES
- **Canon DOM-first (verificación visual):** (1) toda anomalía visual se detecta y mide primero por DOM — texto que desborda su contenedor (`scrollWidth > clientWidth`), elementos fuera del viewport, solapamientos entre hermanos, contenedores con overflow — porque es reproducible y verificable por cualquiera; (2) el análisis de imagen se usa SOLO como soporte grueso o confirmación, con pregunta dirigida y, cuando existe, con las medidas DOM previas como anclaje en el prompt; (3) ninguna afirmación del modelo de visión entra al informe sin respaldo DOM o marcada explícitamente como "apreciación no verificable". Las capturas quedan siempre como evidencia cruda que el revisor puede contrastar.
- La visión auxiliar (modelo externo) alucinó en 4 de 4 análisis libres (web de apuestas con "BALANCE 88852" y "REDEEM" inexistentes, tabs inventados, fechas falsas, nombres de archivo repetidos en filas donde no están): sus descripciones finas se descartaron sistemáticamente. Con anclaje de medidas DOM, su confirmación es utilizable (H-12 confirmado en imagen tras medir los cortes).
- Clicks disparados por eventos JS (pointerdown/up) — el click sintético del driver no activa los handlers de pointer de WallView.
- Verificación siempre por artefacto (D1/API/R2/DOM), nunca por afirmación del ejecutor.
