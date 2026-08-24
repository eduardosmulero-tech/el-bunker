# Mapa exhaustivo de trazabilidad de producto

> Fecha: 23-ago-2026. Auditoría exclusiva de El Búnker: revisión de `CONTRATO.md`, `REGLAS.md`, `docs/spec/INDEX.md`, specs vivas del producto, historial documental del proyecto, tarjetas Kanban `archived/done/triage/blocked/todo`, Git y auditorías UI. Los materiales de configuración de Hermes quedan fuera del universo auditado.
>
> Este documento distingue intención original, decisión vigente, implementación y aceptación. No convierte una tarjeta `done` en integración: según P15, solo `archived` cuenta como integrado.

## 1. Evidencia consultada y límites

Se revisaron los documentos normativos y vivos, los roadmaps y auditorías operacionales del Búnker, el inventario histórico de features, `PLIEGOS_HISTORIAL.md`, `SESIONES.md`, sesiones S49-S146, decisiones y errores legacy, el código, Git y las tarjetas Kanban. Los archivos de configuración y conversaciones de Hermes no forman parte de esta auditoría ni de sus requisitos.

## 2. Definición de estado

- **Integrado:** commit ancestro de `master` y, si es una tarjeta Kanban, estado `archived`.
- **Entregado no integrado:** tarjeta `done`, aunque tenga worktree o commit.
- **Diseñado:** ADR/spec/brief sin implementación aceptada.
- **Parcial:** existe una parte real, pero falta el flujo o el criterio premium.
- **Parking:** diferido por una decisión explícita; no bloquea v1 mientras el canon lo mantenga fuera.
- **Desconocido:** falta evidencia reproducible; nunca se cuenta como hecho.

Estado Git de esta revisión: `master=4d44844`; los únicos cambios no seguidos de esta revisión son el mapa y los dos planes de cierre. El handoff y el backup permanecen fuera de alcance. El merge VAULT `0556ea0` sí contiene `a432654` como ancestro.

## 3. Norte original reconstruido

La intención no era acumular 70 tipos. Era construir un hogar digital privado para Edu y David: guardar lo que tienen juntos, encontrarlo, volver a vivirlo y usarlo en el día a día. Los hilos persistentes convergen en estas propiedades:

1. **Privacidad real:** solo la pareja y el admin autorizado; modo visita; revocación; documentos sensibles; recuperación.
2. **Memoria con contexto:** fotos, vídeo, audio, capturas, eras, fechas, lugares, quién lo creó y por qué importa.
3. **Palabras íntimas:** cartas, notas, diario dual, abrir cuando, bromas, apodos y lectura sin interfaz de galería.
4. **Vida compartida:** lugares, viajes, restaurantes, recetas, películas, libros, regalos, compras, plantas y mascotas como herramientas, no tarjetas decorativas.
5. **Música propia:** biblioteca, reproducción robusta, cola, playlists, drops, visualizador y escucha compartida.
6. **Tiempo y ritual:** Timeline, Smoke, Time Capsules y RECAP como cuatro formas de vivir pasado, presente, futuro y reflexión.
7. **Continuidad:** Android primero, escritorio de primera clase, offline honesto, recuperación tras kill/red y sincronización entre dos dispositivos.
8. **Superioridad práctica:** igualar la mejor referencia premium en cada flujo y añadir contexto de pareja sin más fricción.

## 4. Matriz de trazabilidad

| Dominio / intención | Fuentes históricas | Decisión vigente | Estado verificable | Tarjeta responsable | Salida 100% |
|---|---|---|---|---|---|
| Shell, 3 tabs y marco desktop | inventario, ADR-017/029/032, diseños HUD | 3 tabs; desktop desde 1280; rail y lienzo separados | Marco integrado; aceptación global aún abierta; COLA móvil y admin desktop fallan la auditoría | `t_b25cb12e`, `t_ddc104e6`, `t_3d2d1236` | navegación alcanzable, capturas mobile/desktop, cero overflow/clipping real |
| Auth, whitelist y acceso test/admin | ADR-006/025/028, docs acceso | Google para humanos; access key para test/admin; no registro público | Implementado; falta threat model y recovery completo | `t_07a0befc`, `t_324a9de0` | pruebas 401/403/404, epoch, visita, recovery y auditoría sin secretos |
| Modo Visita | diseños modo visita, A2-A5, ADR-031 | claim por cuenta, saneamiento server-side y epoch global | Entregas `done`; ledger debe probar merges y aceptación post-merge | `t_919b9d99`, `t_41a2e5e4` | datos sensibles ausentes en rutas/feed, activar/desactivar en dos usuarios |
| Seguridad de archivos y Caja Fuerte | taxonomía 3/12, auditorías Fable, ADR-014/033 | CAJA FUERTE aparte; docs/audio sensibles necesitan protección R2; no prometer cifrado sin prueba | R2 HMAC y permisos tienen tests parciales; recovery/caja fuerte no cerrados | `t_07a0befc`, `t_968bc652` | threat model, HMAC/TTL, recovery probado, clave extra, export/restore y rollback |
| Modelo de hogar, ownership y conflictos | auditoría cruzada, taxonomía y ADRs del Búnker | owner/autor/coautor/privado/compartido explícitos; D1 fuente única | Falta contrato completo por entidad | `t_d49dde41` | pruebas Edu/David/admin, concurrencia, permisos y eventos |
| MEMORIA visual | S49, galeria spec, ADR-021/033, S146 | sección MEMORIA; seis modos solo aquí; EntryLightbox único | WALL/DIALOGUE reales; CINEMA/MAP/REEL/EXHIBITION parciales; `t_6b381799` pendiente | `t_a67bb65a`, `t_6b381799` | seis modos con datos reales, vídeo/audio delegados al PlayerProvider, estados vacíos y Android |
| Importación de Takeout/DCIM | S146, `tools/import-vault.mjs`, task DeepSeek archivada | dry-run, staging para revisión Edu, dedupe resumible, no subir sin `--commit` | Herramienta histórica; no hay tarjeta de producto explícita ni aceptación con volumen real | `t_6810baf8` | 16k+ archivos en staging, dedupe estable, manifiesto resumible, prueba pequeña y aprobación manual |
| PALABRAS | taxonomía 2, ADR-033, inventario `letter/note` | lectura íntima de 76ch; diario dual; Caja Fuerte separada | formulario contiene tipos heredados; experiencia de lectura y ownership insuficientes | `t_f3aa8789`, `t_d49dde41` | carta/diario/abrir-cuando/respuesta, edición, búsqueda, privacidad y móvil |
| LUGARES | taxonomía 4, MAP spec, geocoder, ADR-033 | mapa como forma natural de mirar | Leaflet/cluster/geocoder existen; aceptación narrativa y datos reales pendiente | `t_b97fe706`, `t_6b381799` | guardar lugar/viaje/check-in, mapa, ruta, fecha, filtros y enlaces a memoria |
| LISTAS y RECETAS | taxonomía 6, auditoría producto, benchmark Paprika | tabla; recetas y listas de vida, no galería | no hay experiencia de recetas/listas al nivel de producto | `t_b97fe706` | receta editable, ingredientes, pasos, compra, plan, estados, responsable y sync |
| Caja de decisiones/crecimiento | taxonomía 7 y conversaciones de pareja | forma de lectura/registro, no categoría histórica visible | sin flujo dedicado verificable | `t_f3aa8789` | check-in, decisiones, conflicto, valores, love languages con privacidad |
| MUSIC LAB base | ADR-009/010/011/018, S18-S145, backlog Q/P/SC | reproductor premium convencional + capa propia de pareja | core real; desktop grande, COLA móvil y algunos requisitos siguen abiertos | `t_1ea66539`, `t_60381aad`, `t_b617c6b3` | reproducción, cola, contexto, tags, playlists, búsqueda, estados de red y desktop |
| Visualizador UX6/VIZ | ADR-032, S145, spec reproductor | seis modos; personalización del usuario manda sobre preset | cambios de modos integrados en tarjeta archivada; aceptación final y VIZ-M13/M15 abiertas | `t_1ea66539`, `t_b5b5b397`, `t_b617c6b3` | reacción a audio real, color vibe, fullscreen/lienzo/inline, selección persistente |
| Drops | inventario, D1-D6, DROP-M20/M21, auditoría cruzada O4 | mensaje contextual; no auto-drop a uno mismo; snapshot y PWA | base real; M20/M21 y promoción a VAULT requieren evidencia | `t_41a2e5e4`, `t_1c587e9d` | recibir, ver, guardar, snapshot inmutable, abrir en PWA y promover conscientemente |
| Playlists y biblioteca propia | S84, specs LI/TR, inventario | MusicLab dueño del dato; D1/R2; no Drive | CRUD y reorder reales; carga MP3/ID3/duplicados y aceptación móvil pendientes | `t_60381aad`, `t_1ea66539` | upload, metadatos, duplicados, vacía, merge/persistencia, playlist contextual |
| Escucha compartida | SC1-SC14, S132, roadmap 15 fases | sesión compartida, presencia, posición, cola atribuida, reconexión | base Worker/long-polling; SC2 y E2E deben probarse | `t_41a2e5e4`, `t_60381aad` | dos dispositivos, <2s, host/guest, reconexión y stats compartidas |
| CAPSULES / Timeline | ADR-020, capsulas spec, S58 | cuatro experiencias; Timeline fusionada, filtros por fila desktop | componentes reales; aceptación de los cuatro flujos pendiente | `t_c04c1acd` | eventos reales, filtros, “un día como hoy”, estados vacíos y navegación |
| Smoke | capsulas spec SS-1..8 | presente controlado, volumen único del PlayerProvider | timer/presets reales; nombres, sonido ambiente, historial/rachas y push parciales | `t_c04c1acd`, `t_bf51a459` | sesión nombrada, preset, sonido, fade, evento, racha y notificación |
| Time Capsules | TC-1..9, S74, ADR-026 | cápsula con entries/playlists; snapshot al sellar | crear/seleccionar/snapshot/guardar reales en parte; colaboración/push/animación por verificar | `t_c04c1acd`, `t_bf51a459` | contenido, preview, confirmación irreversible, snapshot, evento y apertura |
| RECAP / stats | STAT-M9, ADR-019/026, S139 | events append-only; RECAP cliente, no segundo motor | endpoint/guardado existen; seis secciones, automatización y datos de vida abiertos | `t_1883edd2`, `t_bf51a459` | datos reales, top música/memoria/conexión/hitos, guardar en VAULT y cron |
| Búsqueda unificada y enlaces | benchmark Google Photos/Day One/Notion, auditoría cruzada S1-S8 | buscar todo el hogar y saltar entre objetos sin duplicar | búsqueda VAULT existe; búsqueda global y enlaces cruzados incompletos | `t_1fab0f8a` | texto/fecha/tag/lugar/autor/tipo, resultados explicables y deep links |
| Promoción de contexto | auditoría cruzada O4, S2/S5/S6 | Drop significativo -> entrada VAULT; entry -> track; cápsula -> playlist snapshot | decisión documentada, flujo no cerrado | `t_1c587e9d` | acciones explícitas, referencias estables y sin duplicar datos |
| Sync/offline/lifecycle | roadmaps F1/F2/F15, PWA, Android A1-A6 | Android primero y desktop primera clase; offline honesto | SW y fallback existen; aceptación real pendiente | `t_20cb42d1`, `t_bb179b93` | kill/red/llamada/auriculares/offline/reconnect en dispositivos reales |
| Accesibilidad, rendimiento y texto | auditorías Fable, S135, auditoría post-merge | dato intocable; contención sin clipping; cero emoji iconográfico | 71 clipping en estrés; lint/build no sustituyen aceptación | `t_2915b7c0`, `t_79f4c945` | WCAG, teclado, touch targets, CJK/RTL/ZWJ, cero clipping real |
| Admin y observabilidad | ADR-030/031, B1-B5, audit UI | `/admin` fuera de tabs, eventos únicos, consolas | core y consolas entregados; navegación desktop independiente pendiente | `t_ddc104e6`, `t_1883edd2` | admin auth, SALUD/AUDITORIA/ACCESOS, teclado, desktop, eventos |

## 5. Ledger de features heredadas por familia

Este ledger conserva el inventario feature a feature sin tratar cada rótulo histórico como una tarjeta independiente. El estado se refiere al producto actual, no al momento en que se escribió el inventario.

| Familia | Features concretas revisadas | Estado actual y destino |
|---|---|---|
| CORE / infraestructura | Google GIS + whitelist; boot/error; D1/R2/Workers; migración de schema; heartbeat; acceso no autorizado; access key; JWT/epoch; WorkerClient; FileUploadService; ErrorBoundary/CSP/CI | Base real e integrada en distintos commits; seguridad, recuperación y aceptación backend permanecen en `t_07a0befc`, `t_968bc652`, `t_324a9de0`. |
| SHELL / diseño | CRT/ruido/grid/glows; status bar/reloj/DB/exit; 3 tabs; transiciones; toasts/haptics; `--vibe-accent`; JetBrains Mono; mini-player; safe areas; rail; dock; admin fuera de tabs | Marco y gran parte del shell integrados; auditoría final, admin desktop, clipping y decisiones desktop pendientes en `t_ddc104e6`, `t_b25cb12e`, `t_2915b7c0`, `t_0118e8d5`. |
| VAULT base | eras/carrusel; contador aventura; heartbeat; countdown; bibliotecas; capacidad/heartbeat; filtros por usuario; export backup; CRUD entry; editar/eliminar; búsqueda; lightbox; EntryLightbox | CRUD, eras, búsqueda y lightbox existen; experiencia por secciones, ownership, seguridad y aceptación de datos reales siguen en `t_d49dde41`, `t_6b381799`, `t_f3aa8789`, `t_968bc652`. |
| VAULT media | foto R2; vídeo; audio delegado; capturas; GIF/memes; preview; subida unificada; metadatos; estados vacíos | Foto y flujo R2 existen; vídeo/audio/capturas/GIF y estados completos requieren `t_6b381799`; nunca crear `<audio>` fuera de PlayerProvider. |
| VAULT galería | WALL masonry/densidades/virtualización; CINEMA swipe/Ken Burns/crossfade/audioguía/música; MAP Leaflet/pines/clusters/rutas/slider/capas; DIALOGUE columnas/<5min/hilo/asimetría; REEL generación/escenas/sonido/pin; EXHIBITION canvas/salas/zoom; capa ambiental/BPM | WALL/DIALOGUE y piezas de MAP/lightbox son reales; los seis modos premium y la capa ambiental no tienen aceptación final. Dueño: `t_a67bb65a`, `t_6b381799`, revisión/merge técnico antes de `t_3d2d1236`. |
| PALABRAS | note; letter; diario compartido/individual; abrir-cuando; gratitud; sueños; inside jokes; apodos; decisiones; conflictos; terapia; check-in; valores; love languages; lectura 76ch; respuesta entre usuarios | `note`/`letter` existen como tipos, no como producto completo. `t_f3aa8789` y `t_d49dde41` deben implementar datos, lectura, privacidad, respuesta y búsqueda; lo demás no se cuenta por aparecer en un selector. |
| LUGARES | lugares nuestros; viajes; wishlist; check-ins; reseñas; coordenadas; geocoder; mapa emocional; ruta cronológica; filtros Era/año/fecha; deep link a foto | geocoder/Leaflet/parte de ruta existen; flujo de vida y aceptación real pendiente en `t_b97fe706` y `t_6b381799`. |
| LISTAS / RECETAS | películas/series; libros; recetas; ingredientes; pasos; versiones; lista compra; plan semanal; bucket list; regalos; gastos; inventario casa; plantas/mascotas; responsable/estado/puntuaciones | No hay experiencia premium completa. `t_b97fe706` es dueño; no se debe esconder el hueco bajo el antiguo catálogo. |
| MUSIC LAB playback | HTMLAudioElement/R2; play/pause; skip; seek; loop off/list/track; shuffle; volumen físico; autoplay signal; WakeLock; MediaSession; artwork; title scroll; vibe; drop button; skip <3s; haptics; fullscreen; tecla F/V | Base y varios fixes integrados; UX6/VIZ y aceptación real Android/desktop siguen en `t_1ea66539`, `t_60381aad`, `t_b617c6b3`, `t_bb179b93`. |
| MUSIC LAB cola/contexto | cola D1; tab condicional; add next/end; drag reorder; historial; activo; guardar playlist; vaciar; búsqueda/tag; contexto; separación manual/contexto; límite 75; soft delete; bottom sheet; inyección; fin consciente; loop lista | Core existe, pero la auditoría demuestra COLA móvil inalcanzable. `t_b25cb12e` es bloqueante; `t_1ea66539` y `t_60381aad` cierran el comportamiento premium. |
| TRACKS / playlists | 3 vistas; preferencia; cards; formulario; edición; borrado; tags; búsqueda AND; paginación; menú; CRUD playlists; reorder; tracks eliminados; playlist vacía; upload MP3; ID3; duplicados; thumbnails; orden; fusión | CRUD, tags y reorder tienen base; upload/ID3/duplicados/orden/fusión y aceptación de persistencia deben verificarse en `t_1ea66539`/`t_60381aad`; D1 manda, no Drive. |
| DROPS / pareja musical | compose timestamp; alert; historial; polling; visto/guardado/borrado; no auto-drop; M20 PWA; M21 snapshot; promoción a VAULT; atribución `added_by`; presencia; posición; cola compartida; reconexión; crédito estadístico | Base y varios fixes existen; M20/M21, promoción y SC2/E2E no se cuentan hasta `t_41a2e5e4`, `t_1c587e9d`, `t_60381aad` y aceptación de dos dispositivos. |
| CAPSULES | Timeline feed único; eventos; filtros módulo/usuario/tipo/Era; “un día como hoy”; Smoke presets/custom/fade/volumen; nombre/historial/rachas/sonido/push; Time Capsules CRUD/selector/preview/sellado/snapshot/notificación/evento/animación/colaboración; RECAP semanal/mensual/anual/secciones/guardar | Componentes reales y varios datos reales; los criterios completos son responsabilidad de `t_c04c1acd`, `t_bf51a459`, `t_1883edd2` y la aceptación final. |
| PWA / Android / continuidad | install; SW; precache; offline fallback; safe area; OOM restore; llamada; auriculares; otra app audio; lockscreen; DND; MediaSession; Cast; FLAC/OPUS; export/restore | PWA/SW y parte del reproductor existen; dispositivo real, offline honesto, lifecycle, Cast/formatos y recovery no están aceptados. Dueño `t_bb179b93`, con parking explícito para lo no v1. |
| STATS / eventos | events append-only; play/pause/skip/seek; drops; entries/eras; playlists; smoke; capsules; auth; agregaciones; recap; rachas; shared credit; heatmap; admin events | Motor único existe; consumidores y datos completos deben pasar `t_1883edd2` y `t_41a2e5e4`, sin crear un agregador paralelo. |
| ADMIN / operaciones | admin-core portable; resource descriptors; SALUD; AUDITORIA; ACCESOS; auth; mutations/events; vibe theme; desktop frame; keyboard; export/health | Núcleo y consolas entregados en tarjetas `done`; integración/aceptación desktop independiente sigue pendiente en `t_ddc104e6` y `t_1883edd2`. |

### Prefijos de specs cubiertos

- `S`, `Q`, `C`, `EC-C`, `P`, `EC-P`, `SH`, `L`: sesión, cola, contexto, playback, shuffle y loop; se agrupan en `t_1ea66539` y el bloqueante `t_b25cb12e`.
- `VB`, `T`: tags, contraste, propagación, transiciones y personalización; requieren `t_60381aad`, `t_79f4c945` y las decisiones abiertas del índice (`VB10-M3`, `VB20-M4`, `TR1-M6`).
- `A`, `M`, `CAST`, `UX`, `VIZ`: Android, MediaSession, Cast, gestos y visualizador; `t_bb179b93`, `t_1ea66539`, `t_b617c6b3`, con parking solo cuando el canon lo declara.
- `TR`, `LI`, `D`, `SC`, `STAT`: tracks, playlists, drops, escucha compartida y estadísticas; `t_60381aad`, `t_41a2e5e4`, `t_1883edd2`.
- Galería sin prefijos: seis modos y edge cases; `t_a67bb65a`/`t_6b381799`.
- `SS`, `TC`, RECAP: cuatro experiencias de CAPSULES; `t_c04c1acd`/`t_bf51a459`.

### Destinos de requisitos diferidos

`VIZ-M13`, `VIZ-M15`, `VB20-M4`, `VB10-M3`, FLAC/OPUS, DLNA/Cast universal, live wallpaper, HEIC/RAW, fusionar playlists y animaciones de salvapantallas no se declaran hechos. Permanecen en parking o requieren decisión explícita según la spec y el plan; si se quieren para la app final, G0/G1 debe convertirlos en tarjetas con DoD antes de implementar.

## 6. Taxonomía histórica completa

Los ~70 tipos de `taxonomia_vault.md` se conservan como trazabilidad, pero no son 70 tarjetas vigentes. ADR-033 los reemplaza por cinco destinos de producto:

- **MEMORIA:** fotos, vídeos, audio, capturas y cualquier media real; seis modos de galería.
- **PALABRAS:** cartas, notas, diario dual/individual, abrir-cuando, gratitud, sueños, bromas y apodos.
- **LUGARES:** lugares, viajes, wishlist, check-ins y reseñas.
- **LISTAS:** películas/series, libros, recetas, bucket list, regalos y otras listas de vida.
- **CAJA FUERTE:** documentos legales, médicos, financieros, profesionales, educación, 2FA, emergencia, voluntades y recuperación.

Las categorías temporales, recap/stats y playlists narradas no desaparecen: se sirven desde CAPSULES, RECAP o MUSIC LAB según ADR-017/018/020. Finanzas, crecimiento, rituales e integraciones no se pueden considerar resueltos por el mero agrupamiento; tienen que pasar por `t_b97fe706`, `t_f3aa8789` o una decisión explícita de fuera de alcance.

## 6. Cómo se han tratado las tarjetas históricas

- `archived`: evidencia de integración, pero no necesariamente aceptación de producto premium; debe pasar el benchmark final.
- `done`: entrega no integrada. Ejemplos relevantes: `t_0ea27342` quedó integrado por `0556ea0`; `t_b08e83a5`, `t_703e99c7`, `t_6997adaa`, `t_305dbb3c`, `t_2854c51b` y varias entregas de modo visita siguen necesitando ledger/merge-base según el estado del board.
- `triage/blocked`: no implementar por intuición. `t_a8de002d` y `t_e687ed00` necesitan decisión/revisión antes de cambiar desktop; `t_c1e3ead9`, `t_92734f82` y `t_2cbe2436` no son aceptación.
- `todo/ready`: es el backlog ejecutable actual; las tarjetas de producto nuevas gobiernan capacidades, las tarjetas técnicas gobiernan integración y auditoría.

## 7. Regla de no pérdida

Cada feature de una fuente histórica debe acabar en exactamente uno de estos destinos: `integrado`, `tarjeta vigente`, `parking por decisión firmada`, `reemplazado por ADR`, o `rechazado explícitamente`. Si una fila no tiene uno, el plan no está cerrado.

## 8. Cierre de esta revisión

El mapa no declara El Búnker terminado. Declara que la intención está recuperada y que el trabajo restante tiene ownership. El orden ejecutable es: `t_919b9d99` y `t_394fc825` para reconciliar merges; `t_0d621905` y `t_07a0befc` para benchmark/seguridad; después `t_b25cb12e`, `t_2915b7c0`, capacidades por dominio, aceptación Android/backend, auditoría post-merge y release.
