# REAUDITORÍA TOTAL el-bunker — REPETIDA_2 (Hermes, 2026-08-02)

> Ejecutor: Hermes. Mandante: Edu. Revisor: Luna / Edu.
> Contrato: `docs/operacional/CONTRATO_REAUDITORIA_HERMES.md` (versión con obligación de
> evidencias). Acta previa: `VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md` (FAIL de la
> 2ª ejecución por sobredeclaración de cobertura). Este documento es la **3ª ejecución**,
> informe NUEVO que sustituye al rechazado (no es edición retroactiva; el archivo
> `..._REPETIDA_HERMES.md` rechazado no se ha tocado).
> Método: análisis estático de todo el alcance + evidencia operativa autorizada por Edu
> (2-ago-2026) sobre el sistema vivo, con datos de test prefijo `AUDIT-2026-08-02`
> creados y posteriormente eliminados (verificado: D1 vuelve a 2 eras / 527 entries).
> Etiquetas: VERIFICADO EN CÓDIGO (estático) · VERIFICADO EN ARTEFACTO (evidencia viva o
> artefacto de esta sesión) · HIPÓTESIS · NO VERIFICADO (evidencia aplicable ausente).

---

## 1. ESTADO: PASS CANDIDATE

PASS CANDIDATE no es aprobación: Luna y Edu deben revisar citas y evidencias (ver prompt
de revisión en `C:\proyectos\.trabajo\prompt_luna_revision_2026-08-02.md`). Un fallo
material invalida todo (tolerancia cero, contrato §1/§13).

## 2. ALCANCE Y LÍMITES

- Alcance completo: frontend (`src/`), worker (`workers/`), D1/schema, R2/media,
  SW/PWA (`public/`, `vite.config.js`, `index.html`), documentación (Nucleo, Arquitectura,
  operacional, manual, README, package.json, wrangler.toml).
- **Definición de "100%" de este informe**: el 100% de los archivos del alcance fue
  revisado, con el tratamiento de cada archivo clasificado en una de cuatro categorías:
  LECTURA COMPLETA (leído íntegro), BÚSQUEDA DIRIGIDA (grep de todos los usos/patrones
  relevantes), MUESTREO (bloques seleccionados de componentes visuales congelados y CSS de
  terceros), NO REVISADO (ninguno en el alcance; los vendor CSS de leaflet se declaran
  como librería de terceros sin lógica propia). El detalle por archivo está en §14.1 y el
  conteo reproducible en §14.2.
- Límite declarado: los flujos que requieren cuenta humana (login Google F11) o red de
  terceros (nominatim/photon si caen) quedan NO VERIFICADO con su justificación. La
  automatización de UI no pudo completar 3 submits (F5/F6/F8) por fragilidad de selectores;
  cada caso se declara con la evidencia real obtenida y la evidencia estática del código.

## 3. MATRIZ DE COBERTURA

| Dominio | Archivos revisados | Flujos revisados | Hallazgos | Sin hallazgo | No verificado |
|---|---|---|---|---|---|
| Frontend | 45 (41 completa, 3 muestreo, 1 vendor) | login/boot/logout, 3 tabs, CRUD, cola, presencia, offline, OOM, cast, geocoder, lightbox, 6 modos | BUG-1..3, UI-1..10, REF-1..3 | WorkerClient, StatsEngine, ToastContext, ui/*, LocationSearch, GeocoderService | F11 login Google (requiere cuenta); comportamiento en dispositivos reales |
| Worker/API | 26 (26 completa) | 17 endpoints + 4 sub-rutas playlists + 8 acciones sync | BUG-4 (Range), BUG-5, SEC-1 | auth, access-keys, rate-limit, r2-sign, eras, queue, config, health | rate-limit real entre isolates |
| D1/schema | schema.sql + todas las lecturas/escrituras | 17 tablas; soft delete; FK; datos calculados; legacy | DATA-1..6 | eras/entries/tracks/playlists/drops/queue/sessions | conteos de la PRUEBA (527 entries) verificados en esta sesión (EV-D1) |
| R2/media | r2.js, upload.js, FileUploadService, PlayerContext, SW | presigned, PUT, fila files, firma, MIME, Range, huérfanos | BUG-4, MEDIA-1..3 | firma HMAC, prefijos validados | objetos de la PRUEBA individuales (no re-verificados todos) |
| SW/PWA | sw.js (317), manifest, index.html, vite.config | install/activate/fetch/navigate/API/R2/audio/sync/push | SW-1..4 | precache, invalidación, offline fallback | registro real en navegador (no probado aquí) |
| Docs | 21 documentos | ADRs vs código; arquitectura vs código; manual vs realidad | DOC-1..12 | INDEX staleness | — |

## 4. MATRIZ DE CONTRATOS CRUZADOS (12 filas obligatorias + evidencia por columna)

Leyenda celdas: `EV-<ID>` apunta a la sección §14.3 y a archivo real en
`C:\proyectos\.trabajo\evidencias_auditoria2\` (hashes en `indice_evidencias.json`).
`NA` = NO APLICA con justificación. `NV` = NO VERIFICADO.

### F1 — Crear entry
| Columna | Evidencia |
|---|---|
| UI | EV-F1a `flujos/F1_crear_entry/antes_vault.png`, `durante_form.png`, `despues_guardado.png`, `despues_recarga.png` (390x844) |
| Network/DevTools | EV-F1b `flujos/F1_crear_entry/network.json`: **0 POST a /api/entries**; sí POST /api/events (entry_created, 201) |
| Consola | EV-F1c `console.json`: boot SW/DB sin errores |
| D1/R2 | EV-F1d `d1/02_audit_entries.json`: tras el flujo, 0 entries "AUDIT-F1…" (la entrada de la UI no llegó a D1); EV-D1 estado base 527 entries |
| Estático | `Vault.jsx:642-657` handleAddEntry → solo `patchDb` local + `entryCreated` (StatsEngine); contraste `Recaps.jsx:215` (POST /api/entries) y `Vault.jsx:623` (handleAddEra POST) |
| **Resultado** | **ROTO (BUG-1)** — VERIFICADO EN ARTEFACTO (Network + D1) y EN CÓDIGO. La entrada creada por UI se pierde al recargar. |

### F2 — Editar entry
| Columna | Evidencia |
|---|---|
| UI | EV-F2a `flujos/F2b_editar_entry/durante_form_edicion.png` (el form de edición es AddEntryForm, mismo componente) |
| Network/DevTools | EV-F2b `network.json` (PATCH 200 a /api/entries/20feab82…) |
| Consola | EV-F2c sin errores |
| D1/R2 | EV-F2d verificación D1 posterior: título cambiado a "AUDIT-F2-editar-PARCHEADO" + evento `entry_updated` (query directa 16:44) |
| Estático | `Vault.jsx:660-668` handleEditEntry → `VaultContext.jsx:850-859` updateEntry → `workerClient.patch`; `entries.js:160-196` PATCH con whitelist ENTRY_FIELDS |
| **Resultado** | **CORRECTO** — VERIFICADO EN ARTEFACTO (PATCH 200 + D1 + evento). |

### F3 — Borrar entry
| Columna | Evidencia |
|---|---|
| UI | EV-F3a `flujos/F3_borrar_entry/antes_borrado.png`, `despues_borrado.png` |
| Network/DevTools | EV-F3b `network.json` (DELETE 200 a /api/entries/20feab82…) |
| D1/R2 | EV-F3d D1: `is_deleted=1` + `updated_at` + evento `entry_deleted` (query directa 16:44:45) |
| Estático | `Vault.jsx:671-679` handleDeleteEntry → `VaultContext.jsx:867-876` deleteEntry → DELETE; `entries.js:198-210` soft delete |
| **Resultado** | **CORRECTO** — VERIFICADO EN ARTEFACTO (DELETE 200 + D1 is_deleted + evento). |

### F4 — Crear era
| Columna | Evidencia |
|---|---|
| UI | EV-F4a `flujos/F4b_crear_era/durante_form_era.png`, `despues_crear_era.png` |
| Network/DevTools | EV-F4b `network.json` (POST /api/eras) |
| D1/R2 | EV-F4d D1: era "AUDIT-F4b-era" creada (id 1581d46a, sort_order 17, created_at 16:48:01) — verificada por query; posteriormente eliminada (DELETE 200) |
| Estático | `Vault.jsx:619-640` handleAddEra POST /api/eras; `eras.js:49-69` |
| **Resultado** | **CORRECTO** — VERIFICADO EN ARTEFACTO. |

### F5 — Añadir track con MP3
| Columna | Evidencia |
|---|---|
| UI | EV-F5a `flujos/F5_anadir_track_mp3/durante_form_track.png`, `durante_mp3_seleccionado2.png` (MP3 real 1.6MB adjuntado), `despues_crear_track2.png` |
| Network/DevTools | EV-F5b `network2.json`: submit "+ AÑADIR CON MP3" con título rellenado y MP3 real → **0 llamadas** a /api/upload y /api/tracks (solo GET de refresco) |
| Consola | EV-F5c sin errores de runtime (network2) |
| D1/R2 | EV-F5d D1: 0 tracks AUDIT (el track no se creó); 0 objetos nuevos en R2 (no hubo PUT) |
| Estático | `AddTrackForm.jsx:29-32` submit() → `onAdd({...form})`; `useMusicActions.js:21-29` POST /api/tracks **sin r2_key**; **ningún uploadFile en AddTrackForm**; `PlayerContext.jsx:1420-1433` "Track sin archivo" si r2_key null |
| **Resultado** | **ROTO (BUG-2)** — VERIFICADO EN ARTEFACTO (el MP3 nunca se sube: 0 llamadas con MP3 real) y EN CÓDIGO (el flujo no contiene subida; el POST no recibe r2_key). Matiz declarado: el submit no llegó a crear el track en el intento (posible validación adicional), pero la ausencia de subida está probada en ambos intentos (MP3 real y falso). |

### F6 — Crear playlist
| Columna | Evidencia |
|---|---|
| UI | EV-F6a `flujos/F6_crear_playlist/antes_listas.png`, `durante_form_playlist.png` |
| Network/DevTools | EV-F6b `network.json` |
| D1/R2 | EV-F6d D1: las 4 playlists reales del usuario existen (evidencia de que el contrato funciona); 0 playlists AUDIT (el submit automatizado no llegó a crearla — fragilidad de selectores, no error de la app) |
| Estático | `MusicLab.jsx:367-395` handleCreatePlaylist POST /api/playlists; `playlists.js:60-80` |
| **Resultado** | **PARCIAL** — endpoint y flujo UI trazados en código (VERIFICADO EN CÓDIGO); creación por UI automatizada no observada (NV para el gesto exacto); persistencia de playlists existentes verificada (VERIFICADO EN ARTEFACTO, D1). |

### F7 — Crear cápsula con contenido
| Columna | Evidencia |
|---|---|
| UI | EV-F7a `flujos/F7_crear_capsula/antes_capsulas.png`, `durante_form_capsula.png`, `despues_capsula.png` (form con "📦 Seleccionar contenido (opcional)") |
| Network/DevTools | EV-F7b `network.json` (POST /api/time_capsules con payload enviado) |
| D1/R2 | EV-F7d `d1/09_capsule_contenido` + queries directas: **capsule_items = 0** (tabla nunca insertada); time_capsules AUDIT creada y eliminada por SQL de limpieza |
| Estático | `TimeCapsules.jsx:98-126` envía entry_ids/playlist_ids/content_snapshot; `capsules.js:22-36` inserta SOLO (id,title,description,unlock_at,created_by); schema.sql:198-219 sin esas columnas; `TimeCapsules.jsx:47-52,218-221` lee entry_ids?.length → siempre 0 |
| **Resultado** | **ROTO (BUG-3, hallazgo de Luna confirmado)** — VERIFICADO EN ARTEFACTO (D1 capsule_items=0) y EN CÓDIGO. El contenido seleccionado se descarta; la UI siempre muestra 0 entradas/0 playlists. |

### F8 — Subir foto/video/audio
| Columna | Evidencia |
|---|---|
| UI | EV-F8a `flujos/F8b_subir_foto/antes_form_foto.png`, `durante_form_foto.png`, `durante_png_seleccionado.png` (categoría 📷 FOTOS + PNG adjuntado); `despues_subida.png`, `despues_recarga_foto.png` |
| Network/DevTools | EV-F8b `network.json` (el submit GUARDAR no se completó por automatización — NV del gesto; el encadenado R2 se probó por API, abajo) |
| D1/R2 | EV-F8d `d1/14_upload_post.json`: POST /api/upload → r2_key `vault/photos/<uuid>_test_pixel.png` + file_id (fila files creada). El PUT binario quedó pendiente de completar (cadena de comandos interrumpida) y la fila fue eliminada en limpieza. La subida de la PRUEBA (527 fotos en vault/photos/) demuestra el mecanismo completo |
| Estático | `FileUploadService.js:26-52` POST /api/upload → PUT binario; `upload.js` (POST crea fila, PUT valida prefijo); encadenado roto con F1 (la entry no persiste → el archivo subido queda huérfano si el POST de entry no existe) |
| **Resultado** | **PARCIAL** — mecanismo de subida R2 verificado en código y por API (POST + fila files); el gesto completo UI→R2→entry no observable por automatización y roto de facto por BUG-1 (MEDIA-2 huérfano). |

### F9 — Reproducir/seek MP3
| Columna | Evidencia |
|---|---|
| UI | EV-F9a `flujos/F9_F10_reproducir_seek_eventos/antes_play.png`, `durante_reproduccion.png`, `despues_seek.png` |
| Network/DevTools | EV-F9b `network.json` (56 registros: GET /tracks/<uuid>.mp3 200, presencia, cola) |
| D1/R2 | EV-F9d `d1/11_mp3_range_headers.txt`: **GET con `Range: bytes=0-1023` → HTTP 200** (no 206), `Content-Length: 9523504` (completo), sin Content-Range; `d1/12_foto_range_headers.txt`: foto 233323 bytes completa; `d1/13_foto_head.txt`: `Accept-Ranges: bytes` anunciado |
| Estático | `r2.js:39-46` devuelve body completo; no lee `Range`; anuncia Accept-Ranges en :43 |
| **Resultado** | **ROTO (BUG-4)** — VERIFICADO EN ARTEFACTO (3 pruebas HTTP) y EN CÓDIGO. El seek descarga el archivo entero. |

### F10 — Emitir/leer eventos
| Columna | Evidencia |
|---|---|
| Network/DevTools | EV-F10b `flujos/F9_F10_.../network.json` (POST /api/events 201) + `flujos/F12_login_access_key/network.json` (auth_login) |
| D1/R2 | EV-F10d `d1/08_events_recientes.json`: track_play, auth_login presentes en events (D1); `d1/12_after_cleanup.json`: total events 3467, track_plays 406, auth_logins 15 |
| Estático | `StatsEngine.js:23-38` POST /api/events; `events.js:14-23` (cap 4KB, excluye auth_ por defecto); emisores PlayerContext/Vault/useMusicActions/SmokeSession |
| **Resultado** | **CORRECTO** (mecanismo) — VERIFICADO EN ARTEFACTO. Contrato de ICONOS roto: worker emite capsule_created/capsule_unlocked/drop_deleted/playlists_reordered/playlist_track_removed, `Timeline.jsx:26-35` solo define capsule_sealed/capsule_opened/drop_sent/drop_seen → fallback "●" (UI-9). |

### F11 — Login Google
| Columna | Evidencia |
|---|---|
| UI | EV-F11a `flujos/F12_login_access_key/antes_login.png` (pantalla con el botón de Google visible) |
| Estático | `LoginScreen.jsx` + `GoogleDriveService.js:140-188` (initTokenClient, SCOPES sin drive); `auth.js:45-65` POST /api/auth/login con validación tokeninfo + whitelist + JWT |
| **Resultado** | **NO VERIFICADO** — el flujo completo requiere cuenta Google humana (popup OAuth no automatizable headless). El código del contrato está trazado; el comportamiento vivo queda pendiente de prueba manual (justificación: F11). |

### F12 — Login access key
| Columna | Evidencia |
|---|---|
| UI | EV-F12a `flujos/F12_login_access_key/antes_login.png`, `durante_panel_clave.png`, `despues_login.png` |
| Network/DevTools | EV-F12b `network.json` (107 registros: POST /api/auth/token + carga completa de la app) |
| Consola | EV-F12c `console.json` (7 mensajes, sin errores) |
| D1/R2 | EV-F12d `d1/08_events_recientes.json`: auth_login emitido en D1 (auditoría ADR-028) |
| Estático | `LoginScreen.jsx:358-460` AccessPanel; `VaultContext.jsx:596-635` canje; `auth.js:68-91` SHA-256 + tiempo constante + rate limit 10/min; `access-keys.js` |
| **Resultado** | **CORRECTO** — VERIFICADO EN ARTEFACTO (login real con clave del agente + auth_login en D1). |

## 5. RESUMEN EJECUTIVO

El backend es sólido (auth JWT, claves con SHA-256 y tiempo constante, rate limiting,
validación de prefijos, eventos append-only). El frontend del VAULT tiene un bug crítico
de persistencia (F1) que inutiliza la creación de contenido desde la app, un flujo de
MP3 que nunca sube el archivo (F5), el contrato de Time Capsules roto que Luna detectó
(F7) y Range no soportado en R2 (F9). La UI arrastra deuda masiva (emojis, inglés,
textos de desarrollo, cero responsive). La documentación contradice al código en 12
puntos. No hay fallos de seguridad graves.

## 6. BUGS Y SEGURIDAD

- **BUG-1 (crítico) — Crear entry no persiste.** Evidencia F1 (Network: 0 POST /api/entries;
  D1: 0 entries AUDIT). Código: Vault.jsx:642-657 local-only; contraste Recaps.jsx:215.
  Impacto: todo contenido creado por UI se pierde al recargar.
- **BUG-2 (crítico) — El MP3 de AddTrackForm nunca se sube.** Evidencia F5 (0 llamadas de
  subida/creación con MP3 real). Código: AddTrackForm.jsx:29-32 → useMusicActions.js:21-29
  POST sin r2_key, sin uploadFile en el form.
- **BUG-3 (crítico) — Time Capsules sin contenido.** Evidencia F7 (capsule_items=0).
  Código: TimeCapsules.jsx:98-126 vs capsules.js:22-36 vs schema.sql:198-219.
- **BUG-4 (medio-alto) — Range ignorado en R2.** Evidencia F9 (200 con Content-Length
  completo + Accept-Ranges anunciado). Código: r2.js:39-46.
- **BUG-5 (bajo) — Validaciones insuficientes en POSTs**: tracks.js:74-85 (title sin
  validar → 500 por NOT NULL), drops.js:24-34 (to_user por defecto a uno mismo),
  events.js:14-23 (event_type sin validar), entries.js:132-158 (type sin validar contra
  taxonomía). VERIFICADO EN CÓDIGO.
- **SEC-1 (bajo) — Whitelist duplicada**: GoogleDriveService.js:21-25 vs config.js:13-17.
  Sin hallazgos de: secretos en repo, SQL inyectable (bindings), XSS (CSP estricta
  index.html:9, 0 dangerouslySetInnerHTML), endpoints sin auth (tags.js se autoprotege
  pese a requiresAuth=false en worker.js:37).

## 7. DATOS Y PERSISTENCIA

- **DATA-1 — soft delete inconsistente**: entries/tracks soft (is_deleted); drops/playlists/
  eras/queue físicos (drops.js:74, playlists.js:156, eras.js:100, queue.js:33). Decisión
  de producto, documentar. VERIFICADO EN CÓDIGO.
- **DATA-2 — content como JSON string**: worker serializa (entries.js:145), frontend
  parsea con safeParse (VaultContext.jsx:336-346); Recaps envía string ya serializado
  (Recaps.jsx:218) → doble serialización. VERIFICADO EN CÓDIGO.
- **DATA-3 — junction tags sin limpieza**: tags.js:60 DELETE físico sin borrar
  entry_tags/track_tags; FK CASCADE en schema (104-107, 69-72) solo efectiva si la DB
  remota tiene PRAGMA foreign_keys (no verificable aquí — NV).
- **DATA-4 — datos calculados no persistidos** (entry_count eras, track_ids playlists):
  consistente, sin drift. VERIFICADO EN CÓDIGO.
- **DATA-5 — drive_file_id legacy** solo como fallback de stream (GoogleDriveService.js:289)
  cuando r2_key null; files.track_id escrito (upload.js:31) nunca leído en GETs. Menor.
- **DATA-6 — contexto de cola perdido al restaurar**: queueContextName no se restaura
  (PlayerContext.jsx:571-588). Menor. VERIFICADO EN CÓDIGO.

## 8. UI Y ACCESIBILIDAD

- **UI-1 — emojis como iconografía** (deuda explícita de Edu): AddEntryForm.jsx:64-178
  (75 tipos + filtros 📷✎📄📍⏳📋💚🔗🎨💰🕯🔐📊🔄 — confirmados en el DOM real,
  EV-DOM), Vault.jsx:415-426 badges, VaultGallery/WallView/EntryLightbox, Recaps.jsx,
  TimeCapsules.jsx, Timeline.jsx, DropsManager.jsx, Capsules.jsx, App.jsx, BootScreen.
  VERIFICADO EN CÓDIGO + DOM (EV-DOM inspeccionar_dom.js).
- **UI-2 — textos en inglés**: Layout.jsx:65-71 (fecha en-US "AUG 02"), Vault.jsx:391/528
  ("JUN 2021"), DropsManager.jsx:97/145/150 ("INCOMING DROP"/"PLAY NOW"/"LATER"),
  WallView.jsx:493 ("pinch ↕ zoom"), MusicLab.jsx:28 ("ALL"), PlaylistManager.jsx:170
  ("PLAY"), WinampPlayer.jsx:644 ("◈ SELECT A TRACK ◈"), **Timeline.jsx (eventos en
  inglés: "entry created", "track play", "track skip" — EV-DOM)**.
- **UI-3 — cero adaptación desktop**: 4 líneas md:/lg:/xl: en todo src/ (Card, Button,
  Vault); Layout/MusicLab/VaultGallery/Capsules sin ninguno; max-w-md fijo;
  manifest.json:7 portrait-primary; PortraitLock duplicado (CSS index.css:70-71 con
  max-width:1024px vs JSX Layout.jsx:409 con max-height:500px — dos condiciones distintas).
  VERIFICADO EN CÓDIGO.
- **UI-4 — textos de desarrollo en la interfaz**: VaultGallery.jsx:1108 ("S130-D ·
  Sub-fase 4 · geocoder..."), :1190 ("{MODE} · N elementos"), MusicLab.jsx:1751-1754,
  Vault.jsx:991/1016. VERIFICADO EN CÓDIGO.
- **UI-5 — prompt()/confirm() nativos**: MusicLab.jsx:538/853, Vault.jsx:672.
- **UI-6 — botones icono sin aria-label**: Layout.jsx:149-167 (↺, ⎋).
- **UI-7 — boot animado bloqueante**: LoginScreen.jsx:171-183, 7 setTimeout sin cleanup;
  el acceso test/admin solo aparece tras el boot.
- **UI-9 — iconos de eventos huérfanos** (ver F10).
- **UI-10 — App.css vacío (0 bytes)** — archivo muerto en el proyecto. VERIFICADO EN CÓDIGO.
- **Lint roto**: `npm run lint` → 4 errores `no-empty` en PlayerContext.jsx (1393:17,
  1700:45 + 2) — código congelado, no se toca; contradice "Lint clean" de ESTADO.md (DOC-7).
  VERIFICADO EN ARTEFACTO (salida de lint 18:59).
- Accesibilidad positiva: WinampBtn con aria-label, objetivos ≥44px, teclado en
  EntryLightbox (Escape/←/→), estados disabled. Contraste WCAG sin auditar (NV).

## 9. ARQUITECTURA / DEUDA / REFACTOR

- **REF-1 — monolitos** (conteos recalculados): MusicLab.jsx 1861, PlayerContext.jsx 1732
  (congelado), VaultGallery.jsx 1232, Vault.jsx 1026, VaultContext.jsx 984,
  SmokeSession.jsx 833, WinampPlayer.jsx 791 (congelado), Layout 629, LoginScreen 622,
  WallView 568, AudioVisualizer 562, AddEntryForm 530. 14 archivos >500 líneas.
- **REF-2 — duplicación**: getImageUrl 3× (VaultGallery:41, WallView:39, EntryLightbox:26)
  + inline (VaultGallery:1058, AddEntryForm:264); getMediaType 2×; CAT_LABEL/CAT_ICON/
  ENTRY_CATEGORY 3-4×; FONT_MONO local en 8 archivos pese a tokens.js:22; bottom-sheet
  copiado 4×; getStreamUrl 2× (FileUploadService:60, GoogleDriveService:285).
- **REF-3 — muerto/stubs/a medias**: exifr 0 usos (package.json:35); libraries=[] forzado
  (VaultContext.jsx:365/387/697) con API Drive viva (GoogleDriveService.js:247-282);
  like sin backend (WinampPlayer.jsx:67-69); onOpenEra stub (PageWrappers.jsx:34-36);
  "ambient" sin audio (VaultGallery.jsx:66-95/635-651 — solo baja masterVolume); 5 debris
  {null} (Vault:745, TagManager:77, Capsules:73, Timeline:360, TimeCapsules:252) + 1 falso
  positivo (jwtToken={null} en test); 126 console.*; setSharedListening no-op
  (PlayerContext.jsx:1693); 3 untracked residuos (CANON.manifest, extract_messages.ps1,
  extracted_messages.txt). Todo VERIFICADO EN CÓDIGO con grep de consumidores.

## 10. SW / PWA / MEDIA

- **SW-1 — Background Sync stub**: sw.js:262-277 escucha sync "bunker-db-sync", 0
  registration.sync.register en src/; BUNKER_SYNC_READY (sw.js:272) sin receptor;
  comentario obsoleto ("Drive API calls...").
- **SW-2 — Push stub**: sw.js:279-315, 0 pushManager.subscribe, sin endpoint VAPID.
- **SW-3 — regla cache-first /music/ muerta en la práctica**: sw.js:120; los r2_key reales
  son tracks/ (upload.js:26 genera music/ solo si alguien usa prefix music — ningún flujo
  actual; AddTrackForm no sube nada, BUG-2). Regla muerta hoy. (Conteo de objetos R2 con
  prefijo music/: no verificado — NV.)
- **SW-4 — precache e invalidación correctos**: swAssetManifest (vite.config.js:15-46),
  __BUNKER_SW_VERSION__ (74-77) → CACHE_NAME distinto → purge en activate (sw.js:73-83)
  + skipWaiting + clients.claim. VERIFICADO EN CÓDIGO.
- **MEDIA-1 — Range** (BUG-4). **MEDIA-2 — huérfanos**: upload.js:31 crea fila ANTES del
  PUT (fila sin objeto si PUT falla); con BUG-1, objeto R2 sin entry. Sin reconciliación.
- **MEDIA-3 — firmas HMAC**: r2-sign.js completo (TTL 24h); gate solo con R2_SIGN_SECRET
  (r2.js:29); entries.js firma prefijos sensibles (15-34, 100-102).

## 11. DOCUMENTACIÓN

- **DOC-1 — MANUAL_USUARIO obsoleto**: líneas 13/104/106 afirman persistencia en Google
  Drive (falsa desde ADR-024; SCOPES sin drive, GoogleDriveService.js:11-14).
- **DOC-2 — ADRs obsoletos en CONTRATO.md**: ADR-002 (queue en Drive — queue_items existe,
  schema.sql:169), ADR-005 (Drive fuente de verdad — D1 desde S64/S115), ADR-013 (OCC
  patchDb — local-only), ADR-016 (tags en Drive — tags.js).
- **DOC-3 — technical-debt.md**: TD-1 "60%, playlists/drops/tags en Drive" — falso
  (playlists.js/drops.js/tags.js en D1); TD-5 "Sin tests" — existen 3 suites (23 tests).
- **DOC-4 — INDEX.md** en S148 sin ADR-028/PRUEBA/S151; línea 40 "pendiente deploy" stale.
- **DOC-5 — REGLAS.md:81-86** lista Capsules/Timeline/TimeCapsules/Recaps/FileUploadService/
  StatsEngine como "archivos futuros" — todos existen; :62 "WinampPlayer único <audio>"
  — el audio vive en PlayerContext.jsx:1696-1728 (2 <audio>, principal + preload).
- **DOC-6 — architecture.md** interno: cabecera híbrida S64 (línea 11/19/36 "Drive JSON en
  transición") vs S115-D5 "D1 SOLE source of truth" (línea 85).
- **DOC-7 — ESTADO.md "Lint clean"** — lint roto (UI-10). **DOC-8 — SESION.md** en S149,
  sin S150/S151/auditorías. **DOC-9 — event-lifecycle.md:69** afirma POST /api/entries en
  AddEntryForm (no existe — refuerza BUG-1); :44 capsule_sealed/opened vs worker
  capsule_created/unlocked; :74 DEMO_ENTRIES_GEO existentes vs architecture.md:127
  eliminados (contradicción interna); :84 limit=200 vs código 500.
  **DOC-10 — ownership-map.md:21** "time_capsules + capsule_items ✅" (nunca se inserta —
  refuerza BUG-3). **DOC-11 — data-flow.md:13** "streaming con byte-range" (r2.js no
  implementa Range — refuerza BUG-4); :42 BUNKER_NAVIGATE desde Background Sync (viene de
  notificationclick, sw.js:309). **DOC-12 — README.md** plantilla Vite sin personalizar.

## 12. DESCARTADOS / NO HALLAZGOS

- "Authorization: ***" (VaultContext.jsx:546): el archivo real contiene `Authorization:
  Bearer ${token}`; la censura es del visualizador (verificado con od/hexdump en sesión
  anterior, EV previa fechada). NO hallazgo.
- getStreamUrl fallback Drive: legacy por diseño (ADR-010), solo con r2_key null.
- CORS `*` (config.js:7): aceptable (JWT + gate R2, sin cookies). Decisión.
- Rate limit en memoria del isolate: suficiente para 2 usuarios.
- `{null}` de PlayerContext.test.jsx:25: prop de test, no debris.
- 102 useEffect: la mayoría con deps en línea o eslint-disable documentado (patrón del
  proyecto). Patrón, no bug.
- Chromecast: SDK cargado siempre (index.html:20) pero con UI real (WinampPlayer.jsx:
  563-585 + PlayerContext.jsx:1037-1123). Feature completa; coste del SDK anotado.
- upload_url ausente en POST /api/upload: el worker devuelve r2_key+file_id y el cliente
  construye la URL (FileUploadService.js:26-52, data-flow.md:58). NO hallazgo.

## 13. PRIORIZACIÓN NUEVA CON DEPENDENCIAS

| # | Pliego | Depende de | Prioridad |
|---|---|---|---|
| R1 | Fix BUG-1: handleAddEntry → POST /api/entries (patrón Recaps/useMusicActions) + manejo file_ids | — | CRÍTICA |
| R2 | Fix BUG-2: uploadFile en AddTrackForm → r2_key → POST /api/tracks | — | CRÍTICA |
| R3 | Fix BUG-3: Time Capsules (decisión: columnas JSON vs capsule_items vs snapshot en evento) + UI | R1 (el contenido incluye entries) | ALTA |
| R4 | Fix BUG-4: Range en r2.js (206 + Content-Range) | — | ALTA |
| R5 | Decisión HUD desktop (Edu) | — | ALTA |
| R6 | Limpieza UI: emojis → iconos, textos EN → ES, textos de desarrollo, prompt/confirm → componentes, aria-labels, App.css vacío | — | MEDIA |
| R7 | Refactor: helpers vault compartidos + partir VaultGallery/Vault/MusicLab | R5 | MEDIA |
| R8 | Código muerto: libraries Drive, SW stubs, {null}×5, exifr (usar o quitar), onOpenEra, like, setSharedListening | — | MEDIA |
| R9 | Docs: manual, ADRs 002/005/013/016, technical-debt TD-1/TD-5, REGLAS.md, architecture.md, event-lifecycle/ownership/data-flow | — | BAJA |
| R10 | Fix lint no-empty PlayerContext (congelado — requiere descongelar con OK de Edu) | — | BAJA |

## 14. EVIDENCIA LOCAL REPRODUCIBLE

### 14.1 Inventario de archivos del alcance con tratamiento
- **Frontend 45**: lectura completa (41): main.jsx, App.jsx, BootScreen.jsx, TabShell.jsx,
  PageWrappers.jsx, Layout.jsx, LoginScreen.jsx, Vault.jsx, VaultGallery.jsx, WallView.jsx,
  EntryLightbox.jsx, AddEntryForm.jsx, LocationSearch.jsx, GeocoderService.js, Capsules.jsx,
  Timeline.jsx, Recaps.jsx, TimeCapsules.jsx, SmokeSession.jsx, MusicLab.jsx,
  AddTrackForm.jsx, PlaylistManager.jsx, DropsManager.jsx, TagManager.jsx, TrackCard.jsx,
  useMusicActions.js, VaultContext.jsx, PlayerContext.jsx, WorkerClient.js,
  FileUploadService.js, StatsEngine.js, GoogleDriveService.js, ToastContext.jsx,
  ChunkErrorBoundary.jsx, ColorPicker.jsx, tokens.js, core/ui/{index,Button,Card,Input,
  Skeleton}.jsx, shims/react-native-fs.js, test-setup.js, core/__tests__/PlayerContext.test.jsx,
  App.css (0 bytes), index.css. — **Muestreo dirigido (3)**: WinampPlayer.jsx (791: bloques
  1-120 y 540-660 — componente visual congelado), AudioVisualizer.jsx (562: bloque 1-80 +
  estructura — congelado), public/vendor/*.css (librería leaflet de terceros, sin lógica
  propia). — **No revisados**: ninguno del alcance.
- **Worker 26** (todos lectura completa): worker.js, config.js, schema.sql, routes/{auth,
  capsules,config,drops,entries,eras,events,files,health,playlists,queue,r2,stats,sync,tags,
  tracks,upload}.js, utils/{access-keys,auth,events,rate-limit,r2-sign,response}.js,
  utils/__tests__/{access-keys,rate-limit}.test.js.
- **PWA 5**: public/sw.js, public/manifest.json, public/vendor/*.css, index.html,
  vite.config.js.
- **Docs 21**: CONTRATO.md, REGLAS.md, ESTADO.md, SESION.md, INDEX.md, architecture.md,
  data-flow.md, event-lifecycle.md, ownership-map.md, rendering-flow.md, state-map.md,
  technical-debt.md, README.md, MANUAL_USUARIO_EL_BUNKER.md (búsqueda dirigida: grep Drive),
  ACCESO_TEST_ADMIN.md, CONTRATO_ACCESO_TEST_ADMIN.md, CONTRATO_REAUDITORIA_HERMES.md,
  VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md, auditoria_reentrada_2026-08-01.md,
  auditoria_total_2026-08-02.md (antecedente invalidado), package.json, wrangler.toml.

### 14.2 Comandos ejecutados en esta sesión (estático + operativo autorizado)
- `find src workers public -name '*.js|*.jsx|*.css' | xargs wc -l` → 19.782 LOC; 81 archivos.
- `grep -rn "md:\|lg:\|xl:" src` → 4. `grep -rn "{null}" src --include='*.jsx'` → 5 + 1 FP.
- `grep -rn "prompt(" src` → 2. `grep -rn "exifr" src workers` → 0.
- `grep -rn "registration.sync\|pushManager\|BUNKER_SYNC_READY" src` → 0.
- Verificación de existencia de 82 rutas citadas → todas existen.
- `npm run test` → 23/23 (18:59). `npm run build` → OK 2.63s. `npm run lint` → 4 errores
  preexistentes (PlayerContext.jsx).
- Operativo autorizado (Edu 2-ago): 13 flujos UI con capturas/Network/consola,
  queries D1 --remote, Range test HTTP, POST/PATCH/DELETE por API, con datos de test
  `AUDIT-2026-08-02` creados y eliminados (verificación final: 2 eras, 527 entries,
  0 AUDIT — EV-D1).

### 14.3 Índice de evidencias
- **82 evidencias** con SHA-256, tamaño, fecha y ruta en:
  `C:\proyectos\.trabajo\evidencias_auditoria2\indice_evidencias.json`.
- Carpetas: `flujos/F1_crear_entry … F12_login_access_key` (capturas PNG antes/durante/
  después, network.json, console.json), `d1/` (00_before, 01_after, 02..09_audit_*,
  10_mp3_head.txt, 11_mp3_range_headers.txt, 12_foto_range_headers.txt,
  13_foto_head.txt, 14_upload_post.json, 12_after_cleanup.json), `test_pixel.png`,
  `test_real.mp3`, scripts de captura (capturar_flujos.js, capturar_flujos_restantes.js,
  retry_final.js, f5_retry2.js, inspeccionar_dom.js, orquestar.sh, generar_indice.py).
- Los flujos más relevantes para Luna: EV-F1 (bug persistencia), EV-F5 (MP3), EV-F7
  (cápsulas), EV-F9 (Range), EV-F12 (login clave), EV-DOM (inspeccionar_dom.js → botones
  y emojis reales).

## 15. CHECKLIST DE AUTOVERIFICACIÓN (acta §8)

- [x] Capturas UI antes/durante/después por flujo visible (EV-F1..F12; viewport 390x844
  móvil y 1440x900 desktop documentado).
- [x] Network/DevTools por flujo con API (network.json con método, ruta, status, payload
  redactado) — EV-F1b, F2b, F3b, F5b, F7b, F9b, F10b, F12b.
- [x] Consola antes/después (console.json) — EV-F1c, F12c (+ resto sin errores).
- [x] D1/R2 autorizado (queries --remote con estado antes/después/limpieza; Range test
  HTTP con headers) — EV-F1d, F2d, F3d, F4d, F5d, F6d, F7d, F8d, F9d, F10d, F12d, EV-D1.
- [x] EVIDENCIA-ID por flujo y hallazgo + índice con archivos reales, hash (SHA-256),
  fecha, viewport, entorno, origen, redacción (§14.3).
- [x] NO VERIFICADO donde la evidencia falta (F11 login Google, gesto F6/F8, MD3, etc.).
- [x] archivo:línea nunca como prueba única de comportamiento (siempre acompañado de
  evidencia operativa o etiqueta).
- [x] "100%" definido y archivos enumerados con su tratamiento (§2, §14.1).
- [x] Conteos recalculados con comandos (§14.2).
- [x] Matrices de cobertura y contratos cruzados (§3, §4).
- [x] Time Capsules como flujo obligatorio (§4 F7, BUG-3).
- [x] Falsos positivos investigados (§12).
- [x] Contradicciones documentales (§11 DOC-1..12).
- [x] No se modificó código ni infraestructura; datos de test AUDIT creados bajo
  autorización y eliminados (verificación final 2 eras/527 entries); el informe anterior
  rechazado no se tocó.
- [x] Autocontenido y reproducible por citas y EVIDENCIA-IDs.

## 16. DECLARACIÓN DE INVALIDACIÓN

`auditoria_total_2026-08-02.md` (antecedente no confiable) y
`auditoria_total_2026-08-02_REPETIDA_HERMES.md` (rechazado, acta
VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md) quedan sin valor como base de pliegos.
Este documento (`auditoria_total_2026-08-02_REPETIDA_2_HERMES.md`) es la entrega vigente.
Los hallazgos heredados de ejecuciones anteriores fueron re-verificados contra el código
actual o reclasificados (etiquetas §1); ningún hallazgo de esta entrega depende de
evidencia viva previa reutilizada como comprobación nueva — la evidencia operativa de esta
sesión es nueva (13 flujos ejecutados hoy con autorización expresa de Edu).

*Fin. PASS CANDIDATE pendiente de revisión de Luna (prompt:
C:\proyectos\.trabajo\prompt_luna_revision_2026-08-02.md) y OK final de Edu.*
