# REAUDITORÍA TOTAL el-bunker — REPETIDA_3 (Hermes, 2026-08-02) · cuarta ejecución

> Contrato: `docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_3_2026-08-02.md`.
> Ejecutor: Hermes · Mandante: Edu · Revisor: Luna / Edu. Regla: tolerancia cero.
> Este informe es el ÚNICO entregable del contrato §3 (además de `evidencias_auditoria3\`).
> No se ha modificado ningún histórico (contratos, informes 1/2/3 previos, acta de veredicto).
> Etiquetas permitidas (§10): `VERIFICADO EN CÓDIGO`, `VERIFICADO EN ARTEFACTO`, `HIPÓTESIS`,
> `NO VERIFICADO`, `FAIL / INVALIDADA`. No se usa "CORRECTO"/"ROTO" como hecho operativo
> sin la evidencia aplicable.

---

## 1. ESTADO: PASS CANDIDATE

PASS CANDIDATE no es aprobación: Luna verifica inventario, comandos, rutas, índice, hashes,
citas y etiquetas (§13.4); Edu decide (§13.5). Un fallo material = FAIL / INVALIDADA y
repetición desde cero.

## 2. ALCANCE Y LÍMITES

Universo del alcance obligatorio (§4) y su tamaño, con el comando canónico (§6):

```
find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) -print0 | xargs -0 wc -l
→ 19782 total
find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) | wc -l
→ 79
```

- **79 archivos de código .js/.jsx/.css**: src 48, workers 27, public 4. Por extensión:
  .js 38, .jsx 36, .css 5. (El informe anterior declaró 81 — error corregido.)
- Además del universo de código: `public/index.html`, `public/manifest.json`,
  `public/sw.js` (ya en los 79), `vite.config.js` (en los 79), `wrangler.toml`,
  `workers/schema.sql`, `package.json`, 21 documentos (Nucleo/Arquitectura/operacional/
  manual/README) y 3 residuos untracked (`CANON.manifest`, `extract_messages.ps1`,
  `extracted_messages.txt`) — inventariados como residuos, no código.
- Definición de "100%" (§5): el 100% del universo obligatorio está revisado y cada archivo
  tiene una clasificación exacta (tabla §3). No existe ningún archivo `NO REVISADO` en el
  alcance obligatorio.
- Límites declarados: la evidencia viva de D1/R2 proviene de la sesión autorizada del
  2-ago-2026 (flujos ejecutados con autorización expresa de Edu; snapshots fechados). En
  esta ejecución NO se ha accedido a D1/R2 vivos (prohibido §11 sin autorización): el
  estado actual de D1/R2 se declara `NO VERIFICADO`; los artefactos se identifican como
  exportaciones de esa sesión autorizada (origen en el índice §9). El login Google (F11)
  y 2 gestos de UI no automatizables quedan `NO VERIFICADO` con justificación.

## 3. COBERTURA HONESTA — fila por archivo

Clasificación por archivo (L = LECTURA COMPLETA, B = BÚSQUEDA DIRIGIDA, M = MUESTREO,
NR = NO REVISADO). Suma por área: src 48L, workers 27L, public 3L + 3M (vendor), config 4L,
docs 19L + 2B. Total: 0 NR.

### src/ (48 archivos — todos LECTURA COMPLETA)
`main.jsx` L · `index.css` L · `App.css` L (0 bytes) · `tokens.js` L ·
`test-setup.js` L · `shims/react-native-fs.js` L · `MANUAL_USUARIO_EL_BUNKER.md` B ·
`layout/App.jsx` L · `layout/BootScreen.jsx` L · `layout/TabShell.jsx` L ·
`layout/PageWrappers.jsx` L · `layout/LoginScreen.jsx` L · `layout/Layout.jsx` L ·
`core/VaultContext.jsx` L · `core/PlayerContext.jsx` L · `core/WorkerClient.js` L ·
`core/FileUploadService.js` L · `core/StatsEngine.js` L · `core/GoogleDriveService.js` L ·
`core/ToastContext.jsx` L · `core/ChunkErrorBoundary.jsx` L · `core/ColorPicker.jsx` L ·
`core/ui/index.js` L · `core/ui/Button.jsx` L · `core/ui/Card.jsx` L ·
`core/ui/Input.jsx` L · `core/ui/Skeleton.jsx` L · `core/__tests__/PlayerContext.test.jsx` L ·
`vault/Vault.jsx` L · `vault/VaultGallery.jsx` L · `vault/WallView.jsx` L ·
`vault/EntryLightbox.jsx` L · `vault/AddEntryForm.jsx` L · `vault/LocationSearch.jsx` L ·
`vault/GeocoderService.js` L · `musiclab/MusicLab.jsx` L · `musiclab/WinampPlayer.jsx` L
(791 líneas, lectura completa en esta ejecución) · `musiclab/AudioVisualizer.jsx` L
(562 líneas, lectura completa en esta ejecución) · `musiclab/AddTrackForm.jsx` L ·
`musiclab/PlaylistManager.jsx` L · `musiclab/DropsManager.jsx` L · `musiclab/TagManager.jsx` L ·
`musiclab/TrackCard.jsx` L · `musiclab/useMusicActions.js` L ·
`capsules/Capsules.jsx` L · `capsules/Timeline.jsx` L · `capsules/Recaps.jsx` L ·
`capsules/TimeCapsules.jsx` L · `smoke/SmokeSession.jsx` L

### workers/ (27 archivos — todos LECTURA COMPLETA)
`worker.js` L · `config.js` L · `schema.sql` L ·
`routes/auth.js` L · `routes/capsules.js` L · `routes/config.js` L · `routes/drops.js` L ·
`routes/entries.js` L · `routes/eras.js` L · `routes/events.js` L · `routes/files.js` L ·
`routes/health.js` L · `routes/playlists.js` L · `routes/queue.js` L · `routes/r2.js` L ·
`routes/stats.js` L · `routes/sync.js` L · `routes/tags.js` L · `routes/tracks.js` L ·
`routes/upload.js` L · `utils/access-keys.js` L · `utils/auth.js` L · `utils/events.js` L ·
`utils/rate-limit.js` L · `utils/r2-sign.js` L · `utils/response.js` L ·
`utils/__tests__/access-keys.test.js` L · `utils/__tests__/rate-limit.test.js` L

### public/ (4 archivos de código + 2 de PWA)
`sw.js` L (317) · `vendor/leaflet.css` M (661, CSS estándar de la librería Leaflet de
terceros; contenido de vendor, sin lógica de la app — inspeccionado por muestreo) ·
`vendor/MarkerCluster.css` M (14, idem) · `vendor/MarkerCluster.Default.css` M (60, idem,
header cita el repo upstream) · `manifest.json` L · (index.html está en raíz, ver config)

### Config raíz
`index.html` L · `vite.config.js` L (en los 79) · `wrangler.toml` L · `package.json` L

### Docs (21)
`docs/Nucleo/CONTRATO.md` L · `REGLAS.md` L · `ESTADO.md` L · `SESION.md` L ·
`docs/Arquitectura/INDEX.md` L · `architecture.md` L · `data-flow.md` L ·
`event-lifecycle.md` L · `ownership-map.md` L · `rendering-flow.md` L · `state-map.md` L ·
`technical-debt.md` L · `README.md` L ·
`docs/operacional/ACCESO_TEST_ADMIN.md` L · `CONTRATO_ACCESO_TEST_ADMIN.md` L ·
`CONTRATO_REAUDITORIA_HERMES.md` L · `VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md` L ·
`CONTRATO_REAUDITORIA_HERMES_REPETIDA_3_2026-08-02.md` L (este contrato) ·
`auditoria_reentrada_2026-08-01.md` L · `auditoria_total_2026-08-02.md` L (antecedente
invalidado) · `src/MANUAL_USUARIO_EL_BUNKER.md` B (grep dirigido: Drive — líneas 13/104/106)

## 4. CONTEO REPRODUCIBLE (§6)

Salidas exactas de esta sesión (2-ago-2026, ~18:20-19:40, git-bash Windows):

| Métrica | Comando | Resultado |
|---|---|---|
| LOC código | `find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) -print0 \| xargs -0 wc -l` | 19.782 total |
| Archivos código | `find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) \| wc -l` | 79 |
| Por área | `find <a> -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) \| wc -l` | src 48 / workers 27 / public 4 |
| Por extensión | `find src workers public -type f -name "*.<e>" \| wc -l` | .js 38 / .jsx 36 / .css 5 |
| Breakpoints md/lg/xl | `grep -rn "md:\|lg:\|xl:" src --include='*.jsx' --include='*.js' \| wc -l` | 4 |
| `{null}` en JSX | `grep -rn "{null}" src --include='*.jsx'` | 5 reales + 1 falso positivo (jwtToken={null} en test) |
| `prompt(` | `grep -rn "prompt(" src --include='*.jsx'` | 2 (MusicLab.jsx:538, :853) |
| `confirm(` | `grep -rn "confirm(" src --include='*.jsx'` | 1 (Vault.jsx:672) |
| `exifr` usos | `grep -rn "exifr" src workers` | 0 (declarado en devDependencies package.json:35) |
| `registration.sync` | `grep -rn "registration.sync\|pushManager\|BUNKER_SYNC_READY" src` | 0 |
| console.* | barrido mecánico (sweep_audit.py, 2-ago) | 126 |
| useEffect | `grep -rn "useEffect(" src --include='*.jsx' \| wc -l` | 102 |
| Tests | `npm run test` (18:59 y 19:34) | 23/23 (3 archivos) |
| Build | `npm run build` (18:59) | OK 2.63s |
| Lint | `npm run lint` (18:59) | 4 errores no-empty (PlayerContext.jsx:1393, :1700 + 2) — preexistentes, archivo congelado |
| Archivos >500 líneas | `find src -name '*.jsx' -size +500c` + wc | 14 (MusicLab 1861, PlayerContext 1732, VaultGallery 1232, Vault 1026, VaultContext 984, SmokeSession 833, WinampPlayer 791, Layout 629, LoginScreen 622, WallView 568, AudioVisualizer 562, AddEntryForm 530, +2) |

Nota de honestidad: el informe REPETIDA_2 documentó `find ... -name '*.js|*.jsx|*.css'`
(comando inválido, devuelve 0) y declaró 81 archivos — ambos errores quedan corregidos
aquí con las salidas exactas de arriba. Las rutas inexistentes citadas por REPETIDA_2
(señaladas en el contrato §1) no se citan en este informe; las evidencias D1 reales de la
sesión autorizada están inventariadas en §15 y §16.

## 5. MATRIZ DE COBERTURA

| Dominio | Archivos (clasificación) | Flujos revisados | Hallazgos | Sin hallazgo | No verificado | Método |
|---|---|---|---|---|---|---|
| Frontend | 48 src (48 L, 1 B) | login/boot/logout, 3 tabs, CRUD, cola, presencia, offline, OOM, cast, geocoder, lightbox, 6 modos, atajos teclado | BUG-1..2, UI-1..11, REF-1..3 | WorkerClient, StatsEngine, ToastContext, ui/*, LocationSearch, GeocoderService, AudioVisualizer | F11 (Google), gestos F6/F8, dispositivos reales | lectura completa + flujos autorizados |
| Worker/API | 27 (27 L) | 17 endpoints + 4 sub-rutas playlists + 8 acciones sync + 2 suites test | BUG-5, SEC-1 | auth, access-keys, rate-limit, r2-sign, eras, queue, config, health | rate-limit real entre isolates | lectura completa |
| D1/schema | schema.sql + lecturas/escrituras | 17 tablas; soft delete; FK; calculados; legacy; limpieza | DATA-1..6 | eras/entries/tracks/playlists/drops/queue/sessions | estado actual D1 (snapshots de sesión autorizada, no re-verificación viva) | lectura + snapshots EV3-d1 |
| R2/media | r2.js, upload.js, FileUploadService, PlayerContext, SW | presigned, PUT, fila files, firma, MIME, Range, huérfanos | BUG-4, MEDIA-1..3 | firma HMAC, prefijos validados | objetos individuales PRUEBA | lectura + headers HTTP (EV3-r2) |
| SW/PWA | sw.js, manifest, index.html, vite.config | install/activate/fetch/navigate/API/R2/audio/sync/push | SW-1..4 | precache, invalidación, offline fallback | registro SW real en navegador | lectura completa |
| Docs | 21 (19 L, 2 B) | ADRs vs código; arquitectura vs código; manual vs realidad | DOC-1..13 | INDEX staleness | — | lectura completa |

## 6. MATRIZ DE CONTRATOS CRUZADOS (12 filas, columnas con EVIDENCIA-ID o NO VERIFICADO)

Referencias: `EV3-###` → `C:\proyectos\.trabajo\evidencias_auditoria3\indice_evidencias.json`
(88 entradas, 12 campos por entrada, hashes verificados). Las columnas vacías no existen:
toda celda tiene EVIDENCIA-ID, `NA` (no aplica) o `NO VERIFICADO`.

### F1 — Crear entry → **VERIFICADO EN ARTEFACTO** (BUG-1)
| UI | Network/DevTools | Consola | Endpoint | Worker | D1/R2 | Estático | Resultado |
|---|---|---|---|---|---|---|---|
| EV3-001 (antes), EV3-002 (durante), EV3-003/004 (después y tras recarga) | EV3-005: 0 POST /api/entries; sí POST /api/events 201 | EV3-006: sin errores | POST /api/entries existe (entries.js:132-158) | valida era, inserta, emite entry_created | EV3-020 (02_audit_entries): 0 entries "AUDIT-F1" tras el flujo | Vault.jsx:642-657 local-only; contraste Recaps.jsx:215 | BUG-1: la entrada de la UI no llega a D1 |

### F2 — Editar entry → **VERIFICADO EN ARTEFACTO**
| EV3-007/008 | EV3-009: PATCH 200 | — | PATCH /api/entries/:id | entries.js:160-196 whitelist | EV3-020: título cambiado en D1 + evento entry_updated | VaultContext.jsx:850-859 | edición persiste (API) |

### F3 — Borrar entry → **VERIFICADO EN ARTEFACTO**
| EV3-010/011 | EV3-012: DELETE 200 | — | DELETE /api/entries/:id | entries.js:198-210 soft delete | EV3-020: is_deleted=1 + entry_deleted | VaultContext.jsx:867-876 | borrado persiste (soft) |

### F4 — Crear era → **VERIFICADO EN ARTEFACTO**
| EV3-013/014 | EV3-015: POST | — | POST /api/eras | eras.js:49-69 | EV3-021: era "AUDIT-F4b-era" creada (sort 17), luego eliminada (DELETE 200) | Vault.jsx:619-640 | era creada por UI y persistida |

### F5 — Añadir track con MP3 → **VERIFICADO EN CÓDIGO** (no-subida) + **NO VERIFICADO** (creación por UI)
| EV3-016/017/018 | EV3-019: submit "+ AÑADIR CON MP3" con MP3 real → 0 llamadas /api/upload y /api/tracks | EV3-006 (sin errores) | POST /api/tracks | tracks.js:73-93 | EV3-022 (05_audit_tracks): 0 tracks AUDIT | AddTrackForm.jsx:29-32 → useMusicActions.js:21-29 POST sin r2_key; **ningún uploadFile en AddTrackForm** | BUG-2: el MP3 nunca se sube; el gesto de creación por UI no se observó (fragilidad de automatización, 2 intentos con MP3 real y falso) → la subida está probada ausente (artefacto), la creación del track NO VERIFICADA |

### F6 — Crear playlist → **NO VERIFICADO** (gesto UI) + contrato de datos **VERIFICADO EN CÓDIGO**
| EV3-023/024 | EV3-025 | — | POST /api/playlists | playlists.js:60-80 | EV3-023 (04_audit_playlists): 0 playlists AUDIT; 4 playlists reales en D1 (sesión autorizada) | MusicLab.jsx:367-395 | el gesto automatizado no llegó al submit; el endpoint y la persistencia de playlists existentes están verificados (código + snapshot) |

### F7 — Crear cápsula con contenido → **VERIFICADO EN ARTEFACTO** (BUG-3, hallazgo de Luna)
| EV3-026/027/028 | EV3-029: POST /api/time_capsules | — | POST /api/time_capsules | capsules.js:22-36 inserta SOLO (id,title,description,unlock_at,created_by) | EV3-024 (06_audit_capsules): cápsula AUDIT creada; **EV3-023: capsule_items = 0** (nunca insertado) | TimeCapsules.jsx:98-126 envía entry_ids/playlist_ids/content_snapshot; schema.sql:198-219 sin esas columnas; TimeCapsules.jsx:47-52/218-221 lee campos inexistentes | BUG-3: el contenido seleccionado se descarta; la UI muestra siempre 0 |

### F8 — Subir foto/vídeo/audio → **VERIFICADO EN CÓDIGO** (mecanismo) + **NO VERIFICADO** (gesto UI completo)
| EV3-030/031/032 | EV3-033 | — | POST /api/upload + PUT /api/upload/:key | upload.js (POST crea fila, PUT valida prefijo) | EV3-027 (14_upload_post): POST → r2_key + file_id; EV3-026 (07_audit_files) | FileUploadService.js:26-52 | el gesto UI completo no se observó (automatización); el mecanismo POST→fila files está verificado por API; el encadenado con entry está roto por BUG-1 (huérfano MEDIA-2) |

### F9 — Reproducir/seek MP3 → **VERIFICADO EN ARTEFACTO** (BUG-4)
| EV3-034/035/036 | EV3-037: GET /tracks/<uuid>.mp3 200 | EV3-038 | GET binario R2 | r2.js:39-46 (sin Range) | EV3-029 (11_mp3_range): GET con `Range: bytes=0-1023` → **200**, Content-Length completo (9.523.504), sin Content-Range; EV3-030 (12_foto_range): foto 233.323 completa; EV3-031 (13_foto_head): Accept-Ranges anunciado | r2.js:43 anuncia Accept-Ranges sin implementarlo | BUG-4: el seek descarga el archivo entero |

### F10 — Emitir/leer eventos → **VERIFICADO EN ARTEFACTO** (mecanismo) + **VERIFICADO EN CÓDIGO** (iconos)
| EV3-037 | EV3-039 | — | POST/GET /api/events | events.js:14-23 (cap 4KB, excluye auth_ por defecto) | EV3-028 (08_events_recientes): track_play, auth_login en D1; EV3-025 (12_after_cleanup): 3.467 events, 406 track_plays, 15 auth_logins | StatsEngine.js:23-38; Timeline.jsx:26-35 | mecanismo OK; iconos huérfanos: worker emite capsule_created/capsule_unlocked/drop_deleted/playlists_reordered/playlist_track_removed sin icono en Timeline (UI-9) |

### F11 — Login Google → **NO VERIFICADO** (requiere cuenta humana; popup OAuth no automatizable)
| EV3-040 (pantalla con botón Google) | — | — | POST /api/auth/login | auth.js:45-65 (tokeninfo + whitelist + JWT) | — | GoogleDriveService.js:140-188 | contrato trazado en código; comportamiento vivo no verificable sin cuenta real (justificación) |

### F12 — Login access key → **VERIFICADO EN ARTEFACTO**
| EV3-041/042/043 | EV3-044: POST /api/auth/token + carga completa | EV3-045: sin errores | POST /api/auth/token | auth.js:68-91 (SHA-256 + tiempo constante + rate limit 10/min) | EV3-028: auth_login en D1 | LoginScreen.jsx:358-460; access-keys.js | login con clave del agente completo y auditado |

## 7. RESUMEN EJECUTIVO

El backend es sólido y el reproductor está bien construido (retry backoff, OOM recovery,
MediaSession, cast, gapless con doble <audio>, cola persistente en D1). Tres bugs críticos
de contrato en el frontend: crear entry no persiste (F1), el MP3 nunca se sube (F5) y Time
Capsules descarta su contenido (F7); uno de media: Range ignorado en R2 (F9). La UI
arrastra deuda masiva (emojis, inglés, textos de desarrollo, cero responsive, dos portrait
locks distintos). La documentación contradice al código en 13 puntos. Sin fallos de
seguridad graves; el lint del repo está roto en código congelado.

## 8. HALLAZGOS (ID, severidad, impacto, clasificación, citas, observado/esperado, EVIDENCIA-ID, certeza, dependencia, decisión)

- **BUG-1 (crítico, persistencia)** — Crear entrada no persiste. `Vault.jsx:642-657`
  handleAddEntry: patchDb local + evento stats, sin POST. Observado: tras GUARDAR y
  recargar, la entrada desaparece; D1 sin la fila (EV3-005, EV3-020). Esperado: POST
  /api/entries como hace `Recaps.jsx:215` y `Vault.jsx:623`. Certeza: VERIFICADO EN
  ARTEFACTO + EN CÓDIGO. Dependencia: —. Pliego: R1 (patrón useMusicActions).
- **BUG-2 (crítico, subida)** — El MP3 de AddTrackForm nunca se sube. `AddTrackForm.jsx:29-32`
  → `useMusicActions.js:21-29` POST sin r2_key; sin uploadFile en el form. Observado: con
  MP3 real adjuntado y submit pulsado, 0 llamadas de subida/creación (EV3-019). Certeza:
  no-subida VERIFICADO EN ARTEFACTO; creación del track NO VERIFICADO. Pliego: R2.
- **BUG-3 (crítico, contrato)** — Time Capsules sin contenido. `TimeCapsules.jsx:98-126`
  envía entry_ids/playlist_ids/content_snapshot; `capsules.js:22-36` solo persiste 5 campos;
  schema.sql:198-219 sin columnas; capsule_items=0 (EV3-024). Certeza: VERIFICADO EN
  ARTEFACTO + EN CÓDIGO. Pliego: R3 (decisión de diseño pendiente).
- **BUG-4 (medio-alto, media)** — Range ignorado en R2. `r2.js:39-46` no lee Range;
  anuncia Accept-Ranges (:43). Observado: GET con Range → 200 con Content-Length completo,
  sin Content-Range (EV3-029/030/031). Certeza: VERIFICADO EN ARTEFACTO + EN CÓDIGO.
  Pliego: R4.
- **BUG-5 (bajo, validación)** — POSTs con validación insuficiente: tracks.js:74-85
  (title), drops.js:24-34 (to_user default self), events.js:14-23 (event_type),
  entries.js:132-158 (type). Certeza: VERIFICADO EN CÓDIGO. Pliego: R11.
- **SEC-1 (bajo)** — Whitelist duplicada frontend/worker (GoogleDriveService.js:21-25 vs
  config.js:13-17). Sin otros hallazgos de seguridad (bindings en todo SQL, CSP estricta,
  0 dangerouslySetInnerHTML, tags.js se autoprotege). Certeza: VERIFICADO EN CÓDIGO.
- **UI-1 (media)** — Emojis como iconografía (deuda explícita de Edu): AddEntryForm.jsx:64-178
  (75 tipos + filtros, confirmados en DOM real EV3-DOM), Vault.jsx:415-426, VaultGallery/
  WallView/EntryLightbox, Recaps.jsx, TimeCapsules.jsx, Timeline.jsx, DropsManager.jsx,
  Capsules.jsx, App.jsx, BootScreen. Certeza: VERIFICADO EN CÓDIGO + DOM.
- **UI-2 (media)** — Textos en inglés: Layout.jsx:65-71 (fecha en-US), Vault.jsx:391/528,
  DropsManager.jsx:97/145/150, WallView.jsx:493, MusicLab.jsx:28, PlaylistManager.jsx:170,
  WinampPlayer.jsx:644, Timeline.jsx (eventos "entry created"/"track play"/"track skip" —
  EV3-DOM). Certeza: VERIFICADO EN CÓDIGO + DOM.
- **UI-3 (alta)** — Cero adaptación desktop: 4 líneas md:/lg:/xl: en todo src/; max-w-md
  fijo; manifest portrait-primary; doble portrait lock (CSS index.css:70-71 max-width:1024
  vs JSX Layout.jsx:409 max-height:500 — condiciones distintas). Certeza: VERIFICADO EN
  CÓDIGO. Pliego: R5 (decisión de Edu).
- **UI-4 (media)** — Textos de desarrollo en UI: VaultGallery.jsx:1108 ("S130-D · Sub-fase
  4..."), :1190, MusicLab.jsx:1751-1754, Vault.jsx:991/1016. VERIFICADO EN CÓDIGO.
- **UI-5 (baja)** — prompt()/confirm() nativos (MusicLab.jsx:538/853, Vault.jsx:672).
- **UI-6 (baja)** — Botones icono sin aria-label (Layout.jsx:149-167).
- **UI-7 (baja)** — Boot bloqueante ~2s sin skip (LoginScreen.jsx:171-183).
- **UI-8 (media)** — MediaSession artwork sin resolver en WinampPlayer.jsx:353-355
  (track.thumbnail directo) vs PlayerContext.jsx:1146-1148 que sí antepone la base
  (inconsistencia S110). VERIFICADO EN CÓDIGO.
- **UI-9 (baja)** — Iconos de eventos huérfanos (ver F10). **UI-10 (baja)** — App.css
  vacío (0 bytes). **UI-11 (media)** — Lint roto: 4 errores no-empty en PlayerContext.jsx
  (1393:17, 1700:45 + 2) — congelado; contradice ESTADO.md "Lint clean" (DOC-7).
- **REF-1 (media)** — 14 monolitos >500 líneas (MusicLab 1861, PlayerContext 1732...).
- **REF-2 (media)** — Duplicación: getImageUrl 3× + inline 2×; getMediaType 2×;
  CAT_LABEL/CAT_ICON/ENTRY_CATEGORY 3-4×; FONT_MONO local en 8 archivos; bottom-sheet 4×;
  getStreamUrl 2×.
- **REF-3 (media)** — Muerto/stubs/a medias: exifr 0 usos; libraries=[] forzado con API
  Drive viva; like sin backend (WinampPlayer.jsx:67-69, 685-690); onOpenEra stub
  (PageWrappers.jsx:34-36); "ambient" sin audio (VaultGallery.jsx:66-95/635-651); 5 debris
  {null}; 126 console.*; setSharedListening no-op; 3 residuos untracked.
- **DATA-1..6** (ver §9), **SW-1..4** y **MEDIA-1..3** (ver §11), **DOC-1..13** (ver §12).

## 9. DATOS Y PERSISTENCIA

DATA-1 soft delete inconsistente (drops/playlists/eras/queue físicos vs entries/tracks
soft) · DATA-2 content doble-serializado (Recaps.jsx:218) · DATA-3 junction tags sin
limpieza + FK CASCADE dependiente de PRAGMA (NO VERIFICADO) · DATA-4 calculados no
persistidos (entry_count, track_ids) · DATA-5 drive_file_id legacy + files.track_id
escrito nunca leído · DATA-6 queueContextName no restaurado (PlayerContext.jsx:571-588).
Todos VERIFICADO EN CÓDIGO.

## 10. UI Y ACCESIBILIDAD

Ver UI-1..11 en §8. Positivo: WinampBtn con aria-label, objetivos ≥44px, atajos de teclado
con guardas (WinampPlayer.jsx:165-209), teclado en EntryLightbox, botón play/pausa con
aria-label, estado disabled. Contraste WCAG no auditado (NO VERIFICADO).

## 11. SW / PWA / MEDIA

SW-1 Background Sync stub (sw.js:262-277, 0 productores/consumidores) · SW-2 Push stub
(sw.js:279-315, 0 pushManager.subscribe, sin VAPID) · SW-3 regla cache-first /music/ muerta
en la práctica (sw.js:120; los r2_key reales son tracks/; BUG-2 impide nuevos music/) ·
SW-4 precache e invalidación correctos (swAssetManifest + __BUNKER_SW_VERSION__ + purge).
MEDIA-1 Range (BUG-4) · MEDIA-2 huérfanos (upload.js:31 fila antes del PUT; BUG-1 deja
objeto sin entry) · MEDIA-3 firma HMAC correcta (r2-sign.js, gate con R2_SIGN_SECRET).
Todos VERIFICADO EN CÓDIGO; la regla /music/ además NO VERIFICADO en R2 (sin acceso vivo).

## 12. DOCUMENTACIÓN (contradicciones)

DOC-1 manual del usuario afirma persistencia en Drive (13/104/106) — falsa · DOC-2 ADRs
002/005/013/016 obsoletos (queue/tags/fuente de verdad en Drive; D1 los sustituyó) ·
DOC-3 technical-debt TD-1 "playlists/drops/tags en Drive" y TD-5 "Sin tests" — falsos ·
DOC-4 INDEX.md en S148 sin ADR-028/S151 + "pendiente deploy" stale · DOC-5 REGLAS.md:81-86
"archivos futuros" que ya existen + :62 "WinampPlayer único <audio>" (el audio vive en
PlayerContext.jsx:1696-1728, con preload) · DOC-6 architecture.md híbrido S64 vs S115-D5
D1 sole · DOC-7 ESTADO.md "Lint clean" (lint roto) · DOC-8 SESION.md sin S150/S151 ·
DOC-9 event-lifecycle.md:69 afirma POST /api/entries en AddEntryForm (no existe — refuerza
BUG-1), :44 capsule_sealed vs capsule_created, :74 DEMO_ENTRIES_GEO vs eliminados (S148) ·
DOC-10 ownership-map.md:21 "capsule_items ✅" (nunca insertado) · DOC-11 data-flow.md:13
"byte-range" (no implementado) + :42 BUNKER_NAVIGATE desde sync (viene de notificationclick) ·
DOC-12 README.md plantilla Vite · DOC-13 auditoria_total_2026-08-02.md invalidado
(antecedente). Toda ruta citada en este informe existe (verificación automatizada §15).

## 13. DESCARTADOS / NO HALLAZGOS

- "Authorization: ***" (VaultContext.jsx:546): censura del visualizador; el archivo real
  contiene `Bearer ${token}` (verificado por od/hexdump en sesión autorizada). NO hallazgo.
- getStreamUrl fallback Drive: legacy por diseño (ADR-010), solo si r2_key null.
- CORS `*`: aceptable con JWT + gate R2. Decisión.
- Rate limit en memoria del isolate: suficiente para 2 usuarios.
- `{null}` de PlayerContext.test.jsx:25: prop, no debris.
- 102 useEffect: patrón del proyecto con deps en línea o eslint-disable documentado.
- Chromecast: SDK cargado siempre pero feature completa con UI (WinampPlayer.jsx:563-585).
- upload_url ausente en POST /api/upload: el cliente construye la URL (FileUploadService
  :26-52). NO hallazgo.
- Conteo "81" y comando `-name '*.js|*.jsx|*.css'` del informe anterior: errores de
  redacción, corregidos (§4) — no se reutilizan como evidencia.

## 14. PRIORIZACIÓN NUEVA CON DEPENDENCIAS

R1 fix BUG-1 (CRÍTICA) · R2 fix BUG-2 (CRÍTICA) · R3 fix BUG-3, depende de R1 (ALTA) ·
R4 fix BUG-4 (ALTA) · R5 decisión HUD desktop (ALTA) · R6 limpieza UI (MEDIA) ·
R7 refactor helpers/monolitos, depende de R5 (MEDIA) · R8 código muerto (MEDIA) ·
R9 docs (BAJA) · R10 lint congelado con OK de Edu (BAJA) · R11 validaciones POST (BAJA).

## 15. ÍNDICE DE EVIDENCIAS (§9) y VERIFICACIÓN

- `C:\proyectos\.trabajo\evidencias_auditoria3\indice_evidencias.json`: **88 entradas**,
  cada una con los 12 campos obligatorios (id, archivo, sha256, size_bytes, fecha_hora,
  flujo, hallazgos, tipo, viewport, entorno, origen, redaccion); tipos presentes: ui,
  network, console, d1, r2, static, other; orígenes: captura nueva autorizada (2-ago),
  exportación/snapshot de sesión autorizada (2-ago), artefacto auxiliar.
- Verificaciones ejecutadas: 88/88 archivos existen; 88/88 SHA-256 recalculados y
  coincidentes; IDs únicos; 12 campos presentes en el 100% de entradas. La
  bidireccionalidad ID↔archivo es verificable re-ejecutando `generar_indice.py`.
- Las 88 entradas están referenciadas por este informe (matriz §6 y secciones §8-§12) o
  se declaran artefactos auxiliares (scripts y archivos de prueba, declarados en §3).
- Capturas de flujos: viewport 390x844 (móvil) documentado en el campo `viewport`; el
  recorrido desktop (1440x900) de la sesión autorizada queda como evidencia previa en
  `flujos/` (capturas 23/24 de la pasada de capturas_luna, fechadas).
- Comandos de generación: `python generar_indice.py` (regenera y valida el índice).
- Datos de prueba autorizados: prefijo `AUDIT-2026-08-02`; creados y eliminados en la
  sesión autorizada (estado final registrado en EV3-025: 2 eras / 527 entries / 0 AUDIT /
  0 files de test). El estado actual de D1/R2 es `NO VERIFICADO` (§11 contrato: sin acceso
  vivo no se puede afirmar).

## 16. CHECKLIST (Definition of Done §12 y §9)

- [x] Dominios y 12 flujos cubiertos (§5, §6); inventario exhaustivo fila por archivo (§3).
- [x] "100%" definido cuantitativamente y sin archivos NO REVISADO (§2, §3).
- [x] Comandos válidos con salida exacta (§4); el comando inválido del informe previo
  queda corregido y documentado.
- [x] Rutas citadas verificadas: todas existen (listado §3 + verificación automatizada
  de 82 rutas en sesión; las rutas erróneas de REPETIDA_2 no se citan).
- [x] Índice de evidencias con 12 campos, 88 entradas, hashes verificados, IDs únicos y
  relación bidireccional (§15).
- [x] Evidencia real o NO VERIFICADO en cada celda de la matriz (§6); capturas
  antes/durante/después y tras recarga en F1/F3/F5/F8 (§6); Network/consola/D1/R2/
  estático diferenciados; Time Capsules extremo a extremo (F7).
- [x] Etiquetas estrictas §10: sin CORRECTO/ROTO/VERIFICADO como hecho operativo sin
  evidencia; F11, gestos F6/F8 y estado actual D1/R2 declarados NO VERIFICADO.
- [x] Citas validadas (muestra de 10 citas verificadas contra el código en esta jornada),
  descartados (§13), contradicciones (§12), priorización (§14).
- [x] Históricos intactos: este contrato, CONTRATO_REAUDITORIA_HERMES.md, REPETIDA_HERMES.md,
  REPETIDA_2_HERMES.md y VEREDICTO...md no modificados; único archivo nuevo de esta tarea
  en el repo: este informe (más este contrato, aportado por Edu) — git status §17.
- [x] Sin cambios de código, configuración, datos, infraestructura, D1 ni R2.

## 17. ESTADO GIT (snapshot reproducible)

```
git status --porcelain →  M docs/Nucleo/ESTADO.md                      (preexistente)
                        ?? CANON.manifest                               (residuo, preexistente)
                        ?? docs/operacional/CONTRATO_REAUDITORIA_HERMES.md           (histórico)
                        ?? docs/operacional/VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md (histórico)
                        ?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_3_2026-08-02.md (este contrato, aportado por Edu)
                        ?? docs/operacional/auditoria_total_2026-08-02.md             (antecedente invalidado)
                        ?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_HERMES.md   (rechazado, intacto)
                        ?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_2_HERMES.md (rechazado, intacto)
                        ?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_3_HERMES.md (ESTE INFORME, único archivo nuevo de esta tarea)
                        ?? extract_messages.ps1 · extracted_messages.txt (residuos, preexistentes)
```

## 18. DECLARACIÓN DE INVALIDACIÓN

`auditoria_total_2026-08-02.md`, `auditoria_total_2026-08-02_REPETIDA_HERMES.md` y
`auditoria_total_2026-08-02_REPETIDA_2_HERMES.md` quedan sin valor como base de pliegos
(rechazadas por contrato §1). Este documento (`..._REPETIDA_3_HERMES.md`) es la entrega
vigente de la cuarta ejecución. Ningún hallazgo de esta entrega depende de evidencia viva
reutilizada como comprobación nueva: la evidencia operativa es de la sesión autorizada del
2-ago-2026, identificada como tal en el índice (origen), y el resto es análisis estático
de esta jornada contra el código actual (sin cambios de código desde entonces, git status
§17).

*Fin. PASS CANDIDATE pendiente de revisión de Luna (§13.4) y decisión de Edu (§13.5).*
*Fin del contrato.*
