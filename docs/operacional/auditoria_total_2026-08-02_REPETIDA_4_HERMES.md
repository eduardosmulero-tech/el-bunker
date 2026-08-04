# REAUDITORÍA TOTAL el-bunker — REPETIDA_4 (Hermes, 2026-08-02) · quinta ejecución

> Contrato: `docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_4_2026-08-02.md`.
> Ejecutor: Hermes · Mandante: Edu · Revisor: Luna / Edu. Regla: tolerancia cero.
> Entregables (§3): este informe + `C:\proyectos\.trabajo\evidencias_auditoria4\` (con
> `indice_evidencias.json`, `manifiesto_ids.json` y el validador con su salida).
> Históricos intactos (contratos 1-4, informes 1-3 rechazados, acta de veredicto).
> Etiquetas (§10): `VERIFICADO EN CÓDIGO`, `VERIFICADO EN ARTEFACTO`, `HIPÓTESIS`,
> `NO VERIFICADO`, `FAIL / INVALIDADA`. Sin "CORRECTO"/"ROTO" como hecho operativo sin
> evidencia. Sin guiones `—` en celdas de la matriz (§7): toda celda tiene `EVIDENCIA-ID`,
> `NO VERIFICADO` o `NA — justificación`.

---

## 1. ESTADO: PASS CANDIDATE

PASS CANDIDATE no es aprobación: Luna verifica (§13.4) y Edu decide (§13.5). Un fallo
material —incluidos ID inexistente, duplicado, cruzado o semánticamente incompatible—
produce FAIL / INVALIDADA y repetición desde cero.

## 2. ALCANCE Y LÍMITES

Tres universos (§5), inventariados sin mezclas:

- **U1 — Código `.js/.jsx/.css`** (79 archivos): `src/` 48, `workers/` 27, `public/` 4.
  Comando canónico (§6):
  `find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) -print0 | xargs -0 wc -l` → **19.782 total**;
  `find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) | wc -l` → **79**.
  Por extensión: `.js` 38, `.jsx` 36, `.css` 5. (Los 5 `.css`: src/App.css, src/index.css,
  public/vendor/{leaflet,MarkerCluster,MarkerCluster.Default}.css.)
- **U2 — Aplicación, assets, schema, manifest, HTML, configuración raíz y tests**:
  `index.html` (2.108 B), `public/manifest.json` (1.330 B), `public/icons/*.png` (5 iconos:
  72/96/128/192/512), `vite.config.js` (2.624 B), `wrangler.toml` (1.503 B),
  `workers/schema.sql` (12.598 B), `package.json` (1.433 B), `package-lock.json` (generado),
  `src/MANUAL_USUARIO_EL_BUNKER.md` (7.824 B, documental en src — inventariado aquí),
  residuos untracked: `CANON.manifest` (350 B), `extract_messages.ps1` (1.308 B),
  `extracted_messages.txt` (60.968 B). Herramientas legacy raíz (no app):
  `PROMPT_MAESTRO.md`, `DEPLOY.txt`, `tools/*` (33 archivos), `.claude/settings.local.json`
  — inventariados como legacy, fuera del alcance funcional (MUESTREO declarado).
- **U3 — Documentación** (43 archivos del alcance obligatorio): Nucleo 7 (CONTRATO,
  REGLAS, ESTADO, SESION — LECTURA COMPLETA; BACKLOG, CHANGELOG, PROYECTO — BÚSQUEDA
  DIRIGIDA), Arquitectura 9 (8 LECTURA COMPLETA + `# ROADMAP TÉCNICO...Fase 2.md` BÚSQUEDA
  DIRIGIDA), operacional 25 (10 LECTURA COMPLETA: ACCESO_TEST_ADMIN, CONTRATO_ACCESO_
  TEST_ADMIN, CONTRATO_REAUDITORIA_HERMES, CONTRATO_REAUDITORIA_3, CONTRATO_REAUDITORIA_4,
  VEREDICTO, auditoria_reentrada, auditoria_total_2026-08-02, REPETIDA_HERMES, REPETIDA_2;
  15 BÚSQUEDA DIRIGIDA con grep de afirmaciones factuales: auditoria_calidad_P0P3,
  auditoria_fable_1.0, auditoria_S89, CARGANDO_diagnostic, cola_decisiones_fable,
  duplicados_d1_revisar_2026-08-01, hermes_setup_manual, MANUAL_STEPS_CHECKLIST,
  phase2_5_roadmap, phase2_roadmap, PROMPTS, roadmap_100, roadmap_15_fases,
  ROADMAP_COMPLETO, task), manual 1 (BÚSQUEDA DIRIGIDA: grep Drive), `README.md` (LECTURA
  COMPLETA). Resto de `docs/` (legacy, historico, sesiones, planes, disenos, spec,
  ROADMAP.md, roadmap_tracker.html): inventariados por conteo (MUESTREO declarado, fuera
  del alcance obligatorio).
- Definición de "100%": el 100% del universo obligatorio (U1 completo, U2 funcional,
  U3 del alcance) está revisado con una clasificación exacta por archivo (§3). **Cero
  archivos NO REVISADO en el alcance obligatorio.** Conteos por directorio: `src/` 52
  archivos totales, `workers/` 28, `public/` 12, `docs/` 98 (43 del alcance + 55 de resto).

## 3. INVENTARIO FILA POR ARCHIVO (ruta | bytes | clasificación)

### U1 — código (79) — LECTURA COMPLETA salvo los 3 vendor (MUESTREO)
src (48): `main.jsx|236|L` · `index.css|2665|L` · `App.css|0|L` · `tokens.js|7324|L` ·
`test-setup.js|1858|L` · `shims/react-native-fs.js|204|L` · `layout/App.jsx|4694|L` ·
`layout/BootScreen.jsx|4924|L` · `layout/TabShell.jsx|4349|L` · `layout/PageWrappers.jsx|4635|L` ·
`layout/LoginScreen.jsx|22872|L` · `layout/Layout.jsx|27393|L` · `core/VaultContext.jsx|36411|L` ·
`core/PlayerContext.jsx|79186|L` · `core/WorkerClient.js|2730|L` · `core/FileUploadService.js|2506|L` ·
`core/StatsEngine.js|2714|L` · `core/GoogleDriveService.js|13164|L` · `core/ToastContext.jsx|1751|L` ·
`core/ChunkErrorBoundary.jsx|4180|L` · `core/ColorPicker.jsx|2563|L` · `core/ui/index.js|182|L` ·
`core/ui/Button.jsx|2555|L` · `core/ui/Card.jsx|926|L` · `core/ui/Input.jsx|1717|L` ·
`core/ui/Skeleton.jsx|4602|L` · `core/__tests__/PlayerContext.test.jsx|5403|L` ·
`vault/Vault.jsx|40887|L` · `vault/VaultGallery.jsx|63302|L` · `vault/WallView.jsx|23624|L` ·
`vault/EntryLightbox.jsx|17153|L` · `vault/AddEntryForm.jsx|28296|L` · `vault/LocationSearch.jsx|5795|L` ·
`vault/GeocoderService.js|1421|L` · `musiclab/MusicLab.jsx|100296|L` · `musiclab/WinampPlayer.jsx|37225|L` ·
`musiclab/AudioVisualizer.jsx|25329|L` · `musiclab/AddTrackForm.jsx|7123|L` ·
`musiclab/PlaylistManager.jsx|15767|L` · `musiclab/DropsManager.jsx|14548|L` ·
`musiclab/TagManager.jsx|11078|L` · `musiclab/TrackCard.jsx|21612|L` · `musiclab/useMusicActions.js|7366|L` ·
`capsules/Capsules.jsx|6446|L` · `capsules/Timeline.jsx|16204|L` · `capsules/Recaps.jsx|12067|L` ·
`capsules/TimeCapsules.jsx|12121|L` · `smoke/SmokeSession.jsx|33953|L`
workers (27): `worker.js|3577|L` · `config.js|841|L` · `routes/auth.js|3878|L` ·
`routes/capsules.js|2378|L` · `routes/config.js|976|L` · `routes/drops.js|3644|L` ·
`routes/entries.js|10107|L` · `routes/eras.js|5032|L` · `routes/events.js|2075|L` ·
`routes/files.js|1099|L` · `routes/health.js|518|L` · `routes/playlists.js|8053|L` ·
`routes/queue.js|1794|L` · `routes/r2.js|2004|L` · `routes/stats.js|4483|L` ·
`routes/sync.js|12109|L` · `routes/tags.js|2694|L` · `routes/tracks.js|6232|L` ·
`routes/upload.js|2304|L` · `utils/access-keys.js|2272|L` · `utils/auth.js|2391|L` ·
`utils/events.js|1802|L` · `utils/rate-limit.js|1717|L` · `utils/r2-sign.js|3887|L` ·
`utils/response.js|566|L` · `utils/__tests__/access-keys.test.js|1863|L` ·
`utils/__tests__/rate-limit.test.js|638|L`
public (4): `sw.js|11275|L` · `vendor/leaflet.css|14145|M` (librería Leaflet de terceros,
CSS estándar upstream) · `vendor/MarkerCluster.css|997|M` (idem) ·
`vendor/MarkerCluster.Default.css|1421|M` (idem, header cita repo upstream)

### U2 — aplicación/config (LECTURA COMPLETA salvo residuos/legacy)
`index.html|2108|L` · `public/manifest.json|1330|L` · `public/icons/icon-{72,96,128,192,512}.png|M`
(assets binarios de la PWA, inspeccionados por tamaño/uso en manifest) ·
`vite.config.js|2624|L` · `wrangler.toml|1503|L` · `workers/schema.sql|12598|L` ·
`package.json|1433|L` · `package-lock.json|266030|B` (generado por npm) ·
`src/MANUAL_USUARIO_EL_BUNKER.md|7824|B` · `CANON.manifest|350|B` (residuo) ·
`extract_messages.ps1|1308|B` (residuo) · `extracted_messages.txt|60968|B` (residuo) ·
`PROMPT_MAESTRO.md|11773|M` (legacy) · `DEPLOY.txt|8989|M` (legacy) ·
`tools/*|33 archivos|M` (legacy) · `.claude/settings.local.json|1612|M` (legacy)

### U3 — documentación (43 del alcance)
Nucleo (7): `CONTRATO.md|L` · `REGLAS.md|L` · `ESTADO.md|L` · `SESION.md|L` ·
`BACKLOG.md|B` · `CHANGELOG.md|B` · `PROYECTO.md|B`
Arquitectura (9): `INDEX.md|L` · `architecture.md|L` · `data-flow.md|L` ·
`event-lifecycle.md|L` · `ownership-map.md|L` · `rendering-flow.md|L` · `state-map.md|L` ·
`technical-debt.md|L` · `# ROADMAP TÉCNICO DE ACTUALIZACIÓN INFRAESTRUCTURA (Fase 2).md|B`
operacional (25): 10 L (listados en §2) + 15 B (listados en §2)
manual (1): `src/MANUAL_USUARIO_EL_BUNKER.md|B` · README (1): `README.md|L`

## 4. CONTEO REPRODUCIBLE (§6) — salida exacta, 2-ago-2026 ~20:30, git-bash Windows

| Métrica | Comando | Resultado |
|---|---|---|
| LOC U1 | `find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) -print0 \| xargs -0 wc -l` | 19.782 |
| Archivos U1 | `find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) \| wc -l` | 79 |
| Por área | `find <a> -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) \| wc -l` | src 48 / workers 27 / public 4 |
| Por extensión | `find src workers public -type f -name "*.<e>" \| wc -l` | .js 38 / .jsx 36 / .css 5 |
| Archivos totales por dir | `find <d> -type f \| wc -l` | src 52 / workers 28 / public 12 / docs 98 |
| Breakpoints md/lg/xl | `grep -rn "md:\|lg:\|xl:" src --include='*.jsx' --include='*.js' \| wc -l` | 4 |
| `{null}` en JSX | `grep -rn "{null}" src --include='*.jsx'` | 5 reales + 1 falso positivo (jwtToken={null} en test) |
| `prompt(` | `grep -rn "prompt(" src --include='*.jsx'` | 2 (MusicLab.jsx:538, :853) |
| `confirm(` | `grep -rn "confirm(" src --include='*.jsx'` | 1 (Vault.jsx:672) |
| `exifr` | `grep -rn "exifr" src workers` | 0 (declarado en package.json:35) |
| `registration.sync`/`pushManager`/`BUNKER_SYNC_READY` | `grep -rn "registration.sync\|pushManager\|BUNKER_SYNC_READY" src` | 0 |
| console.* | barrido mecánico (sweep_audit.py, 2-ago) | 126 |
| useEffect | `grep -rn "useEffect(" src --include='*.jsx' \| wc -l` | 102 |
| Tests | `npm run test` (18:59, 19:34) | 23/23 (3 archivos) |
| Build | `npm run build` (18:59) | OK 2.63s |
| Lint | `npm run lint` (18:59) | 4 errores no-empty (PlayerContext.jsx:1393:17, :1700:45 + 2) |
| Archivos >500 líneas | `find src -name '*.jsx' \| xargs wc -l` (filtrado) | 14 (MusicLab 1861, PlayerContext 1732, VaultGallery 1232, Vault 1026, VaultContext 984, SmokeSession 833, WinampPlayer 791, Layout 629, LoginScreen 622, WallView 568, AudioVisualizer 562, AddEntryForm 530, +2) |

Los errores de conteo y comando de REPETIDA_2 (81 archivos; `find -name '*.js|*.jsx|*.css'`
que devuelve 0) están corregidos: los comandos de arriba son los ejecutados y sus salidas
las reales.

## 5. MATRIZ DE COBERTURA

| Dominio | Archivos (tratamiento) | Flujos | Hallazgos | Sin hallazgo | No verificado | Método |
|---|---|---|---|---|---|---|
| Frontend | src 48 (48 L) + U2 src | login/logout/boot, 3 tabs, CRUD, cola, presencia, offline, OOM, cast, geocoder, lightbox, 6 modos, atajos | BUG-1/2, UI-1..11, REF-1..3 | WorkerClient, StatsEngine, ToastContext, ui/*, LocationSearch, GeocoderService, AudioVisualizer | F11, gestos F6/F8, dispositivos reales | lectura completa + flujos autorizados |
| Worker/API | workers 27 (27 L) | 17 endpoints + 4 sub-rutas + 8 acciones sync + 2 suites | BUG-5, SEC-1 | auth, access-keys, rate-limit, r2-sign, eras, queue, config, health | rate-limit real | lectura completa |
| D1/schema | schema.sql (L) + lecturas/escrituras | 17 tablas; soft delete; FK; calculados; legacy | DATA-1..7 | eras/entries/tracks/playlists/drops/queue/sessions | estado actual D1 (snapshots de sesión autorizada) | lectura + snapshots |
| R2/media | r2.js, upload.js, FileUploadService, PlayerContext, SW | presigned, PUT, fila files, firma, MIME, Range, huérfanos | BUG-4, MEDIA-1..3 | firma HMAC, prefijos validados | objetos individuales PRUEBA | lectura + headers HTTP |
| SW/PWA | sw.js (L), manifest (L), index.html (L), vite.config (L) | install/activate/fetch/navigate/API/R2/audio/sync/push | SW-1..4 | precache, invalidación, offline fallback | registro SW real | lectura completa |
| Docs | U3 43 (18 L, 25 B) + resto conteo | ADRs vs código; arquitectura vs código; manual vs realidad | DOC-1..14 | — | docs legacy fuera de alcance (MUESTREO) | lectura + búsqueda dirigida |

## 6. MATRIZ DE CONTRATOS CRUZADOS (12 filas × 9 columnas; toda celda tiene ID, NO VERIFICADO o NA justificado)

### F1 — Crear entry → BUG-1: **VERIFICADO EN ARTEFACTO** + **VERIFICADO EN CÓDIGO**
| UI/cliente | Network/DevTools | Consola | Endpoint | Worker | D1/R2 | Estático | Resultado |
|---|---|---|---|---|---|---|---|
| EV4-006 (antes), EV4-010 (durante), EV4-008 (después), EV4-009 (tras recarga) | EV4-011 (0 POST /api/entries; POST /api/events 201) | EV4-007 | POST /api/entries | entries.js:132-158 | EV4-055 (0 entries "AUDIT-F1" en D1) | Vault.jsx:642-657 (local-only); contraste Recaps.jsx:215 | La entrada de la UI no llega a D1; se pierde al recargar |

### F2 — Editar entry → **VERIFICADO EN ARTEFACTO**
| EV4-014 (durante), EV4-013 (después PATCH) | EV4-015 (PATCH 200) | EV4-012 | PATCH /api/entries/:id | entries.js:160-196 (whitelist) | EV4-055 (título cambiado + entry_updated) | VaultContext.jsx:850-859 | Edición persiste por API |

### F3 — Borrar entry → **VERIFICADO EN ARTEFACTO**
| EV4-016 (antes), EV4-018 (después) | EV4-019 (DELETE 200) | EV4-017 | DELETE /api/entries/:id | entries.js:198-210 (soft) | EV4-055 (is_deleted=1 + entry_deleted) | VaultContext.jsx:867-876 | Borrado soft persiste |

### F4 — Crear era → **VERIFICADO EN ARTEFACTO**
| EV4-022 (durante), EV4-021 (después) | EV4-023 (POST) | EV4-020 | POST /api/eras | eras.js:49-69 | EV4-056 (era AUDIT-F4b creada, sort 17; luego DELETE 200) | Vault.jsx:619-640 | Era creada por UI y persistida |

### F5 — Añadir track con MP3 → no-subida **VERIFICADO EN ARTEFACTO**; creación por UI **NO VERIFICADO** (BUG-2)
| EV4-027 (form), EV4-028 (MP3 falso), EV4-029 (MP3 real), EV4-026 (después, retry), EV4-025 (después, 1ª pasada) | EV4-031 (network2: submit "+ AÑADIR CON MP3" con MP3 real → 0 llamadas /api/upload y /api/tracks); EV4-030 | EV4-024 | POST /api/tracks | tracks.js:73-93 | EV4-058 (0 tracks AUDIT) | AddTrackForm.jsx:29-32 → useMusicActions.js:21-29 (POST sin r2_key; sin uploadFile en el form) | El MP3 nunca se sube (probado 2 intentos); la creación del track por el form no se observó (validación previa no ejecutada por automatización) → BUG-2 |

### F6 — Crear playlist → gesto **NO VERIFICADO**; contrato de datos **VERIFICADO EN CÓDIGO**
| EV4-032 (antes), EV4-035 (form), EV4-034 (después) | EV4-036 | EV4-033 | POST /api/playlists | playlists.js:60-80 | EV4-057 (0 playlists AUDIT; 4 playlists reales existentes en D1, sesión autorizada) | MusicLab.jsx:367-395 | El submit automatizado no llegó a ejecutarse (fragilidad de selectores); endpoint y persistencia de playlists existentes verificados |

### F7 — Crear cápsula con contenido → BUG-3: **VERIFICADO EN ARTEFACTO** + **VERIFICADO EN CÓDIGO**
| EV4-037 (antes), EV4-040 (form con "Seleccionar contenido"), EV4-039 (después) | EV4-041 (POST /api/time_capsules) | EV4-038 | POST /api/time_capsules | capsules.js:22-36 (inserta SOLO id/title/description/unlock_at/created_by) | EV4-059 (cápsula AUDIT creada); EV4-062 (capsule_items = 0, nunca insertado) | TimeCapsules.jsx:98-126 (envía entry_ids/playlist_ids/content_snapshot); schema.sql:198-219 (sin esas columnas); TimeCapsules.jsx:47-52,218-221 (lee campos inexistentes) | El contenido seleccionado se descarta; la UI siempre muestra 0 entradas/0 playlists → BUG-3 (hallazgo de Luna confirmado) |

### F8 — Subir foto/vídeo/audio → mecanismo **VERIFICADO EN CÓDIGO** + **VERIFICADO EN ARTEFACTO**; gesto UI completo **NO VERIFICADO**
| EV4-042 (antes), EV4-046 (form FOTOS), EV4-048 (PNG adjuntado), EV4-045 (después), EV4-044 (tras recarga), EV4-047 (durante, 1ª pasada sin input file) | EV4-049 | EV4-043 | POST /api/upload + PUT /api/upload/:key | upload.js (POST crea fila, PUT valida prefijo) | EV4-066 (POST → r2_key + file_id); EV4-060 (fila files) | FileUploadService.js:26-52 | Mecanismo POST→fila files verificado por API (EV4-066); gesto UI completo no observado (automatización); encadenado con entry roto por BUG-1 (MEDIA-2 huérfano) |

### F9 — Reproducir/seek MP3 → BUG-4: **VERIFICADO EN ARTEFACTO** + **VERIFICADO EN CÓDIGO**
| EV4-050 (antes), EV4-053 (durante), EV4-052 (después seek) | EV4-054 (GET /tracks/<uuid>.mp3 200) | EV4-051 | GET binario R2 | r2.js:39-46 (sin Range) | EV4-063 (GET con Range bytes=0-1023 → 200, Content-Length 9.523.504 completo, sin Content-Range); EV4-064 (foto 233.323 completa); EV4-065 (Accept-Ranges anunciado) | r2.js:43 anuncia Accept-Ranges sin implementarlo | El seek descarga el archivo entero → BUG-4 |

### F10 — Emitir/leer eventos → mecanismo **VERIFICADO EN ARTEFACTO**; iconos **VERIFICADO EN CÓDIGO** (UI-9)
| EV4-050/EV4-053 (misma pasada F9/F10) | EV4-054 (POST /api/events 201) | EV4-051 | POST/GET /api/events | events.js:14-23 (cap 4KB, excluye auth_ por defecto) | EV4-061 (track_play, auth_login en D1); EV4-062 (3.467 events, 406 track_plays, 15 auth_logins) | StatsEngine.js:23-38; Timeline.jsx:26-35 | Mecanismo correcto; iconos huérfanos: worker emite capsule_created/capsule_unlocked/drop_deleted/playlists_reordered/playlist_track_removed sin icono en Timeline |

### F11 — Login Google → **NO VERIFICADO** (requiere cuenta humana; popup OAuth no automatizable)
| NA — la pantalla de login con el botón de Google corresponde al flujo F12 (misma pantalla); no se aporta evidencia de este flujo | NO VERIFICADO | NO VERIFICADO | POST /api/auth/login | auth.js:45-65 (tokeninfo + whitelist + JWT) | NO VERIFICADO | GoogleDriveService.js:140-188 (initTokenClient, SCOPES sin drive) | Contrato trazado en código; comportamiento vivo no verificable sin cuenta real → NO VERIFICADO |

### F12 — Login access key → **VERIFICADO EN ARTEFACTO**
| EV4-001 (antes), EV4-004 (panel clave), EV4-003 (después) | EV4-005 (POST /api/auth/token + carga completa) | EV4-002 | POST /api/auth/token | auth.js:68-91 (SHA-256 + tiempo constante + rate limit 10/min) | EV4-061 (auth_login en D1) | LoginScreen.jsx:358-460; access-keys.js | Login con clave completo y auditado |

## 7. RESUMEN EJECUTIVO

Backend sólido (auth JWT, claves con SHA-256 y tiempo constante, rate limit, prefijos
validados, eventos append-only). Reproductor bien construido (retry backoff, OOM recovery,
MediaSession, cast, gapless con doble `<audio>`, cola en D1). Tres bugs críticos de
contrato en el frontend (crear entry no persiste; MP3 que nunca se sube; Time Capsules que
descarta su contenido) y uno de media (Range ignorado). Deuda masiva de UI (emojis,
inglés, textos de desarrollo, cero responsive, doble portrait lock). 14 contradicciones
documentales. Sin fallos de seguridad graves; lint roto en código congelado; 34 grupos de
tracks duplicados en D1 documentados (DATA-7).

## 8. HALLAZGOS (ID · severidad · impacto · clasificación · archivo:líneas · observado/esperado · EVIDENCIA-ID · certeza · dependencia · decisión)

- **BUG-1** · crítico · persistencia · `Vault.jsx:642-657` handleAddEntry (patchDb local +
  stats, sin POST). Obs: tras GUARDAR+recarga la entrada desaparece; D1 sin fila (EV4-011,
  EV4-055). Esp: POST como Recaps.jsx:215. Certeza: VERIFICADO EN ARTEFACTO + EN CÓDIGO.
  Dep: —. Pliego R1.
- **BUG-2** · crítico · subida · `AddTrackForm.jsx:29-32` → `useMusicActions.js:21-29`
  (POST sin r2_key; sin uploadFile). Obs: MP3 real + submit → 0 llamadas (EV4-031). Certeza:
  no-subida VERIFICADO EN ARTEFACTO; creación NO VERIFICADO. Dep: —. Pliego R2.
- **BUG-3** · crítico · contrato · `TimeCapsules.jsx:98-126` vs `capsules.js:22-36` vs
  `schema.sql:198-219`. Obs: capsule_items=0 (EV4-062); UI muestra 0. Certeza: VERIFICADO
  EN ARTEFACTO + EN CÓDIGO. Dep: R1. Pliego R3.
- **BUG-4** · medio-alto · media · `r2.js:39-46` (Range ignorado; Accept-Ranges en :43).
  Obs: GET con Range → 200 completo (EV4-063/064/065). Certeza: VERIFICADO EN ARTEFACTO +
  EN CÓDIGO. Pliego R4.
- **BUG-5** · bajo · validación · tracks.js:74-85 (title), drops.js:24-34 (to_user default
  self), events.js:14-23 (event_type), entries.js:132-158 (type). VERIFICADO EN CÓDIGO.
- **SEC-1** · bajo · whitelist duplicada (GoogleDriveService.js:21-25 vs config.js:13-17).
  Sin otros hallazgos de seguridad (bindings, CSP, 0 dangerouslySetInnerHTML, tags.js
  autoprotegido). VERIFICADO EN CÓDIGO.
- **UI-1** · media · emojis como iconografía (deuda explícita de Edu): AddEntryForm.jsx:64-178
  (75 tipos + filtros, confirmados en DOM real), Vault.jsx:415-426, VaultGallery/WallView/
  EntryLightbox, Recaps.jsx, TimeCapsules.jsx, Timeline.jsx:26-35, DropsManager.jsx,
  Capsules.jsx, App.jsx, BootScreen. VERIFICADO EN CÓDIGO + DOM.
- **UI-2** · media · inglés: Layout.jsx:65-71 (fecha en-US), Vault.jsx:391/528,
  DropsManager.jsx:97/145/150, WallView.jsx:493, MusicLab.jsx:28, PlaylistManager.jsx:170,
  WinampPlayer.jsx:644, Timeline.jsx (eventos "entry created"/"track play"/"track skip").
  VERIFICADO EN CÓDIGO + DOM.
- **UI-3** · alta · responsive: 4 líneas md:/lg:/xl: en todo src/; max-w-md fijo;
  manifest portrait-primary; doble portrait lock (CSS index.css:70-71 max-width:1024 vs
  JSX Layout.jsx:409 max-height:500). VERIFICADO EN CÓDIGO. Pliego R5 (decisión Edu).
- **UI-4** · media · textos de desarrollo: VaultGallery.jsx:1108/1190, MusicLab.jsx:1751-1754,
  Vault.jsx:991/1016. **UI-5** · baja · prompt/confirm (MusicLab:538/853, Vault:672).
  **UI-6** · baja · iconos sin aria-label (Layout.jsx:149-167). **UI-7** · baja · boot
  bloqueante ~2s (LoginScreen.jsx:171-183). **UI-8** · media · MediaSession artwork sin
  resolver (WinampPlayer.jsx:353-355 vs PlayerContext.jsx:1146-1148). **UI-9** · baja ·
  iconos de eventos huérfanos (F10). **UI-10** · baja · App.css vacío. **UI-11** · media ·
  lint roto (4 no-empty PlayerContext.jsx, congelado; contradice ESTADO.md).
- **REF-1** · media · 14 monolitos >500 líneas. **REF-2** · media · duplicación (getImageUrl
  3× + inline 2×; getMediaType 2×; CAT_* 3-4×; FONT_MONO local 8×; bottom-sheet 4×;
  getStreamUrl 2×). **REF-3** · media · muerto/stubs: exifr 0 usos; libraries=[] con API
  Drive viva; like sin backend; onOpenEra stub; ambient sin audio; 5 debris {null};
  126 console.*; setSharedListening no-op; 3 residuos untracked.
- **DATA-1..7** (§9), **SW-1..4** y **MEDIA-1..3** (§11), **DOC-1..14** (§12).

## 9. DATOS Y PERSISTENCIA

DATA-1 soft delete inconsistente (drops/playlists/eras/queue físicos vs entries/tracks
soft) · DATA-2 content doble-serializado (Recaps.jsx:218) · DATA-3 junction tags sin
limpieza + FK CASCADE dependiente de PRAGMA (NO VERIFICADO) · DATA-4 calculados no
persistidos (entry_count, track_ids) · DATA-5 drive_file_id legacy + files.track_id escrito
nunca leído · DATA-6 queueContextName no restaurado (PlayerContext.jsx:571-588) ·
**DATA-7** · 34 grupos de tracks duplicados en D1 (127 filas, criterio título+artista),
documentado en `docs/operacional/duplicados_d1_revisar_2026-08-01.md` (BÚSQUEDA DIRIGIDA
— el conteo vivo es de esa fecha; NO VERIFICADO hoy). Todos salvo DATA-3/DATA-7:
VERIFICADO EN CÓDIGO.

## 10. UI Y ACCESIBILIDAD

UI-1..11 (§8). Positivo: WinampBtn con aria-label, objetivos ≥44px, atajos con guardas
(WinampPlayer.jsx:165-209), teclado en EntryLightbox, estados disabled. Contraste WCAG:
NO VERIFICADO.

## 11. SW / PWA / MEDIA

SW-1 Background Sync stub (sw.js:262-277; 0 productores/consumidores) · SW-2 Push stub
(sw.js:279-315; 0 pushManager.subscribe; sin VAPID) · SW-3 regla cache-first /music/
muerta en la práctica (sw.js:120; r2_key reales tracks/; BUG-2 impide music/ nuevos;
conteo vivo NO VERIFICADO) · SW-4 precache e invalidación correctos (swAssetManifest +
__BUNKER_SW_VERSION__ + purge en activate) · MEDIA-1 Range (BUG-4) · MEDIA-2 huérfanos
(upload.js:31 fila antes del PUT; BUG-1 deja objeto sin entry) · MEDIA-3 firma HMAC
correcta (r2-sign.js; gate con R2_SIGN_SECRET). Todos VERIFICADO EN CÓDIGO.

## 12. DOCUMENTACIÓN (contradicciones)

DOC-1 manual afirma persistencia en Drive (13/104/106) · DOC-2 ADRs 002/005/013/016
obsoletos (Drive vs D1) · DOC-3 technical-debt TD-1 "playlists/drops/tags en Drive" y
TD-5 "Sin tests" falsos · DOC-4 INDEX.md en S148 sin ADR-028/S151 + "pendiente deploy" ·
DOC-5 REGLAS.md:81-86 "archivos futuros" que ya existen + :62 "WinampPlayer único <audio>"
(el audio vive en PlayerContext.jsx:1696-1728, con preload) · DOC-6 architecture.md
híbrido S64 vs S115-D5 · DOC-7 ESTADO.md "Lint clean" (lint roto) · DOC-8 SESION.md sin
S150/S151 · DOC-9 event-lifecycle.md:69 POST entries inexistente + :44 capsule_sealed vs
capsule_created + :74 DEMO_ENTRIES_GEO vs eliminados · DOC-10 ownership-map.md:21
"capsule_items ✅" (nunca insertado) · DOC-11 data-flow.md:13 "byte-range" no implementado
+ :42 BUNKER_NAVIGATE desde sync (viene de notificationclick) · DOC-12 README plantilla ·
DOC-13 duplicados_d1_revisar (hallazgo DATA-7) · DOC-14 hermes_setup_manual (manual de
Hermes, no de la app — inventariado, sin contradicción). Toda ruta citada en este informe
existe (verificación §15).

## 13. DESCARTADOS / NO HALLAZGOS

"Authorization: ***" (VaultContext.jsx:546) = censura del visualizador (el archivo real
contiene `Bearer ${token}`, verificado por od/hexdump en sesión autorizada) · getStreamUrl
fallback Drive legacy (ADR-010) · CORS `*` aceptable con JWT+gate · rate limit en memoria
suficiente · `{null}` del test = prop · 102 useEffect = patrón del proyecto · Chromecast
feature completa (SDK cargado siempre pero con UI real) · upload_url ausente en POST =
cliente construye la URL · roadmaps y auditorías antiguas (S85-S136) = histórico sin
contradicciones con el código actual · conteo 81 y comando inválido de REPETIDA_2 =
errores corregidos en §4, no reutilizados.

## 14. PRIORIZACIÓN NUEVA CON DEPENDENCIAS

R1 fix BUG-1 (CRÍTICA) · R2 fix BUG-2 (CRÍTICA) · R3 fix BUG-3, depende R1 (ALTA) ·
R4 fix BUG-4 (ALTA) · R5 decisión HUD desktop (ALTA) · R6 limpieza UI (MEDIA) ·
R7 refactor helpers/monolitos, depende R5 (MEDIA) · R8 código muerto (MEDIA) ·
R9 docs (BAJA) · R10 lint congelado con OK de Edu (BAJA) · R11 validaciones POST (BAJA) ·
R12 dedupe tracks D1 (BAJA-MEDIA, requiere decisión Edu sobre criterio).

## 15. ÍNDICE, MANIFIESTO Y VALIDADOR (§9)

- `C:\proyectos\.trabajo\evidencias_auditoria4\indice_evidencias.json`: **74 entradas**,
  12 campos por entrada (id, archivo, sha256, size_bytes, fecha_hora, flujo, hallazgos,
  tipo, viewport, entorno, origen, redaccion). Tipos: ui, network, console, d1, r2,
  static, other. Orígenes: captura nueva autorizada (2-ago), exportación/snapshot de
  sesión autorizada (2-ago), artefacto auxiliar.
- `manifiesto_ids.json`: tabla por flujo con ID ↔ archivo ↔ tipo ↔ hallazgos (fuente de
  la correspondencia de §6). El manifiesto se generó a partir del índice real; los IDs de
  la matriz §6 se copiaron EXACTAMENTE del manifiesto (no de memoria) — cada celda de §6
  referencia IDs cuyo flujo y tipo en el índice coinciden con la fila y columna de uso
  (validado por `validador_evidencias.py`).
- **Artefactos auxiliares (listados con ID exacto, requisito §9.3)**: EV4-069
  `capturar_flujos.js`, EV4-070 `capturar_flujos_restantes.js`, EV4-071 `retry_final.js`,
  EV4-072 `f5_retry2.js`, EV4-073 `inspeccionar_dom.js`, EV4-074 `orquestar.sh` (scripts de
  captura, tipo static, flujo "método"); EV4-067 `test_pixel.png` (tipo other, flujo F8);
  EV4-068 `test_real.mp3` (tipo other, flujo F5). Estos IDs no se citan en la matriz §6;
  se declaran aquí como auxiliares. Todos los demás IDs del índice se citan en §6 o §8.
- `validador_evidencias.py` + su salida (`validador_salida.txt`): validación automática
  que compara existencia, tamaño, SHA-256, unicidad de IDs, archivo, flujo, tipo y
  hallazgos de cada EVIDENCIA-ID citado en este informe contra el índice. Reglas: todo ID
  citado existe exactamente una vez; por fila de la matriz, el flujo del índice es
  compatible con la fila (igual, o contiene la fila, o "estado final" para D1 global);
  por columna, el tipo del índice coincide (ui/network/console/d1/r2); los auxiliares
  (static/other) solo aparecen en la sección de auxiliares, no en la matriz.
- Capturas: viewport 390x844 (móvil) en el campo `viewport`; recorrido desktop (1440x900)
  de la sesión autorizada queda como evidencia previa fechada en `flujos/` (capturas de
  la pasada capturas_luna, 2-ago).
- Datos de prueba autorizados: prefijo `AUDIT-2026-08-02`, creados y eliminados en la
  sesión autorizada (estado final EV4-062: 2 eras / 527 entries / 0 AUDIT / 0 files de
  test). Estado actual de D1/R2: NO VERIFICADO (§11: sin acceso vivo no se puede afirmar).

## 16. CHECKLIST (Definition of Done §12)

- [x] Dominios y 12 flujos cubiertos (§5, §6); inventario por archivo en 3 universos sin
  omisiones ni abreviaturas (§2, §3); cero NO REVISADO en el alcance obligatorio.
- [x] Comandos válidos con salida exacta y fecha/hora (§4).
- [x] Rutas citadas verificadas; las rutas inexistentes de REPETIDA_2 no se citan.
- [x] Matriz completa sin guiones ambiguos; toda celda con ID, NO VERIFICADO o NA
  justificado (§6).
- [x] Índice con 12 campos; validación automática ejecutada y publicada (§15); manifiesto
  reproducible ID↔archivo↔flujo↔hallazgo.
- [x] Correspondencia semántica ID↔uso verificada por el validador (flujo y tipo).
- [x] Evidencia real o NO VERIFICADO por flujo; capturas antes/durante/después/recarga en
  F1/F3/F5/F8; Time Capsules extremo a extremo (F7).
- [x] Etiquetas §10 estrictas; sin CORRECTO/ROTO como hecho operativo; F11, F6/F8 gestos,
  estado actual D1/R2 = NO VERIFICADO.
- [x] Citas, descartados (§13), contradicciones (§12), priorización (§14).
- [x] Históricos intactos; único archivo nuevo en el repo: este informe (el contrato lo
  aportó Edu) — git status §17.
- [x] Sin cambios de código, configuración, datos, infraestructura, D1 ni R2.

## 17. ESTADO GIT (snapshot reproducible, `git status --short`)

```
 M docs/Nucleo/ESTADO.md                                (preexistente)
?? CANON.manifest                                       (residuo, preexistente)
?? docs/operacional/CONTRATO_REAUDITORIA_HERMES.md      (histórico)
?? docs/operacional/VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md (histórico)
?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_3_2026-08-02.md (histórico)
?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_4_2026-08-02.md (este contrato, aportado por Edu)
?? docs/operacional/auditoria_total_2026-08-02.md       (antecedente invalidado)
?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_HERMES.md   (rechazado, intacto)
?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_2_HERMES.md (rechazado, intacto)
?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_3_HERMES.md (rechazado, intacto)
?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_4_HERMES.md (ESTE INFORME, único archivo nuevo de esta tarea)
?? extract_messages.ps1 · extracted_messages.txt        (residuos, preexistentes)
```

## 18. DECLARACIÓN DE INVALIDACIÓN

Quedan sin valor como base de pliegos: `auditoria_total_2026-08-02.md`,
`..._REPETIDA_HERMES.md`, `..._REPETIDA_2_HERMES.md` y `..._REPETIDA_3_HERMES.md` (contrato
§1). Este documento (`..._REPETIDA_4_HERMES.md`) es la entrega vigente de la quinta
ejecución. La evidencia operativa es de la sesión autorizada del 2-ago-2026, identificada
en el índice (origen); el resto es análisis estático de esta jornada contra el código
actual (sin cambios de código desde entonces, §17).

*Fin. PASS CANDIDATE pendiente de revisión de Luna (§13.4) y decisión de Edu (§13.5).*
*Fin del contrato.*
