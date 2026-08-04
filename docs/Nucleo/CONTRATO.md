# CONTRATO.md — el_bunker
> ADRs vigentes. Normativo — prevalencia absoluta.
> Contradicción con este doc → Claude detiene y reporta antes de generar pliego.
> Solo crece con nuevas decisiones. Los ADRs revertidos nunca desaparecen: se marcan ⛔.
> Última actualización: S150 — ADR-028 acceso test/admin (2-ago-2026). Base: S49, refundación del producto.

---

## 🔒 REGLAS INAMOVIBLES

| # | Regla | Origen |
|---|---|---|
| 🔒-1 | **Loop triestado.** `loopMode: "off" \| "list" \| "track"`. Nunca boolean. | ADR-007 |
| 🔒-2 | **Sin backend externo.** Todo persiste en Cloudflare D1 (SQL) y R2 (archivos). Sin servidores propios. | ADR-001, ADR-024 |
| 🔒-3 | **Motor de audio único.** Solo PlayerProvider/MusicLab posee playback: un `<audio>` principal y un `<audio>` silencioso de precarga gapless, encapsulados en el provider. Nunca en VAULT ni CAPSULES. | ADR-018 |
| 🔒-4 | **3 tabs definitivos.** VAULT · MUSIC LAB · CAPSULES. Timeline fusionada en CAPSULES. | ADR-017 |
| 🔒-5 | **Stats engine único.** Todos los eventos pasan por la tabla `events` de D1. Sin excepciones ni agregadores paralelos. | ADR-019 |
| 🔒-6 | **Drive nunca como persistencia.** Google Drive deprecado como BD (ADR-024). Ni una línea nueva de persistencia sobre Drive. Solo código de transición. El login puede ser Google (ADR-025) o clave de acceso (ADR-028); lo inamovible es Drive, no el mecanismo de auth. | ADR-025, ADR-028 |
| 🔒-7 | **SEARCH contenedor lógico completo.** Nunca micro-edición. | ADR-015 |
| ⛔ 🔒-LEGACY-1 | ~~**YouTube nunca con `<audio>` nativo.**~~ SUPERSEDIDA — YouTube Engine eliminado en M1. | — |
| ⛔ 🔒-LEGACY-2 | ~~**Div YT nunca en JSX React.**~~ SUPERSEDIDA — YouTube Engine eliminado en M1. | — |

---

## ADRs VIGENTES

### ✅ ADR-001 — Sin base de datos externa (ENMENDADO S49)
**Original:** Todo persiste en Google Drive JSON.
**Enmienda S49:** Migración a Cloudflare D1 (SQL) para la base de datos y R2 para archivos. Google Drive JSON deprecado como DB. Workers como thin REST layer. Sin servidores propios.

### ✅ ADR-002 — Colas de reproducción por usuario
**Histórico:** los archivos separados `queue_[userId].json` existían en Drive.
**Vigente:** la cola usa `queue_items` en D1 mediante Worker API. No se crea ni actualiza JSON de cola en Drive.

### ⛔ ADR-003 — Arquitectura de tracks (REVERTIDO — S28)
Tipos `youtube` / `drive` eliminados. Ver ADR-010.

### ⚠️ ADR-004 — Global PlayerContext (ENMENDADO)
Estado centralizado en `PlayerContext.jsx`.
**Enmiendas:** S21 (Audio instanciado en PlayerProvider), S24 (Progreso es local UI), S26 (Protección `mountedRef`), S28 (`trackVibe` ADR-011).

### ✅ ADR-005 — Schema v4.0.0 → v5.0.0 (ENMENDADO S49 y G3-1)
**Original:** Campos de track en JSON de Drive.
**Histórico S49:** el JSON de Drive fue fuente de transición.
**Enmienda G3-1 vigente:** D1 es la fuente única de datos normalizados y R2 la de archivos; el JSON de Drive no es fuente de verdad ni se consulta para persistencia.

### ✅ ADR-006 — Solo 3 usuarios autorizados
Whitelist en `CONFIG.USERS`. Edu, David, Admin. Sin registro público.

### ✅ ADR-007 — Loop triestado
`loopMode: "off" | "list" | "track"`. `loopModeRef` obligatorio para callbacks.

### ⛔ ADR-008 — Cola siempre tiene prioridad sobre shuffle (REVERTIDO)

### ✅ ADR-009 — Filosofía del reproductor: convención primero
Cola manual tiene prioridad. Skip atrás < 3s → anterior.

### ✅ ADR-010 — Motor de audio exclusivo: HTMLAudioElement + R2
Audio servido desde R2 con byte-range requests.

### ✅ ADR-011 — Separación trackVibe / libraryFilter
`trackVibe` en Context, `libraryFilter` solo en UI.

### ✅ ADR-012 — Versionado de schema: SemVer
MAJOR, MINOR, PATCH.

### ✅ ADR-013 — OCC con ETags para patchDb (ENMENDADO S49)
**Original:** Exponential backoff en escritura concurrente a Google Drive.
**Enmienda S49:** Aplica durante la transición Drive→D1. En D1, SQLite WAL resuelve concurrencia nativamente.

### ✅ ADR-014 — Upload flow: Pre-signed URLs para R2
PUT binario directo a R2 por CORS. Aplica a MP3, fotos, vídeos, docs.

### ✅ ADR-015 — Directivas Anti-Fricción para Pliegos
Prohibida la micro-edición. Todo bloque `SEARCH` debe abarcar el contenedor lógico completo.

### ✅ ADR-016 — Schema 5.0.0: music_lab.tags (histórico Drive, vigente D1)
**Histórico:** tags personalizables en `music_lab.tags[]` dentro del JSON Drive.
**Vigente G3-1:** tags de música viven en D1 `tags` con namespace `music`; tags de contexto usan `entry_tags`. `"all"` es filtro UI y tags de sistema conservan `created_by: "system"`.

### ✅ ADR-017 — Arquitectura de tabs: 3 tabs definitivos (NUEVO S49)
```
VAULT       — Motor de contenido (eras, entries, documentos, fotos, galería)
MUSIC LAB   — Motor de audio (tracks, playlists, drops, tags, reproducción)
CAPSULES    — Capa de experiencias temporales (Timeline, Smoke Session, Time Capsules, RECAP)
```
Timeline ya no es tab independiente — está fusionada en CAPSULES.
Cada módulo es dueño de sus datos. Las experiencias en CAPSULES son clientes, no owners.

### ✅ ADR-018 — MusicLab absorbe todo el audio (NUEVO S49)
MusicLab/PlayerProvider es el ÚNICO motor de playback de la app. VAULT nunca reproduce audio: sus vídeos se muestran silenciados y sus audios se delegan al mini-player persistente de MusicLab. El segundo `<audio>` del provider solo precarga el siguiente track y no reproduce de forma independiente.

### ✅ ADR-019 — Motor único de estadísticas (NUEVO S49)
Tabla `events` inmutable en D1. Append-only. Todos los módulos emiten eventos a esta tabla. Un agregador común consume y genera: stats de escucha, RECAPs, Timeline feed, rachas, resúmenes. Sin agregadores paralelos ni duplicación de lógica de stats.

### ✅ ADR-020 — CAPSULES como capa de experiencias temporales (NUEVO S49)
4 sub-tabs dentro de CAPSULES:
- ⏳ **Timeline** — Feed cronológico unificado (pasado)
- ⧖ **Smoke Session** — Temporizador con fade-out (presente)
- 🔮 **Time Capsules** — Contenido bloqueado por fecha (futuro)
- 📊 **RECAP** — Resúmenes semanales/mensuales/anuales (reflexión)
Ninguna es dueña del dato — son clientes de VAULT y MusicLab.

### ✅ ADR-021 — Galería del VAULT: 6 modos (NUEVO S49)
La galería de contenido visual del VAULT tiene 6 modos de navegación:
1. WALL — Masonry grid con zoom de densidad
2. CINEMA — Full-bleed con música ambiente de Era
3. MAP — Fotos pineadas en mapa con líneas de viaje
4. DIALOGUE — Perspectiva dual Edu-David (killer feature)
5. REEL — Secuencias auto-generadas con narrativa
6. EXHIBITION — Agrupación por vibes/tags, no cronológica
Capa ambiental reactiva por Era + reactividad acústica con el reproductor.

### ✅ ADR-022 — FileUploadService unificado (NUEVO S49)
Un solo servicio de subida de archivos con pre-signed URLs a R2. Prefixes por módulo:
- `/music/` — MP3
- `/vault/photos/` — imágenes
- `/vault/videos/` — vídeos
- `/vault/docs/` — documentos
- `/vault/audio/` — grabaciones de voz
Consumido por MusicLab y VAULT. Sin uploaders duplicados.

### ✅ ADR-023 — Namespaces de tags separados (NUEVO S49)
`music_lab.tags[]` (tags de vibe: dnb, romantiqueo, gaming, 420_chill) y `vault.tags[]` (tags de contexto: viaje, playa, barcelona). Mismo componente TagManager UI, distinta fuente de datos. Sin contaminación cruzada.

### ✅ ADR-024 — Migración a D1 + Workers + R2 (NUEVO S49, cerrado G3-1)
Stack de persistencia vigente:
- **DB:** Cloudflare D1 (SQLite-compatible, sin servidor)
- **Archivos:** Cloudflare R2 (objetos, byte-range requests nativo)
- **API:** Cloudflare Workers (thin REST layer con binding nativo a D1 y R2)
Google Drive JSON está deprecado y no se usa como base de datos. El facade legacy no realiza lecturas/escrituras Drive; Google Identity Services queda limitado a autenticación.

### ✅ ADR-025 — Google OAuth2 para auth (ENMENDADO S150)
**Original (S49):** Google OAuth2 se mantiene exclusivamente como método de autenticación. No se usa Google Drive para almacenar datos ni archivos. Hasta decidir un método de auth definitivo, Google es suficiente para 3 usuarios con whitelist.
**Enmienda S150:** Google deja de ser el ÚNICO mecanismo de login — ADR-028 añade el canje de clave de acceso para test y admin. Lo que NO cambia (🔒-6): Drive no se usa para almacenar datos ni archivos, ni una línea nueva de persistencia sobre Drive. Google sigue siendo el login de los usuarios humanos habituales (David en exclusiva, Edu a voluntad).

### ✅ ADR-026 — RECAP como 4ª cápsula (NUEVO S49)
Los resúmenes (semanales, mensuales, anuales) no son infraestructura de stats — son una experiencia temporal que consume el motor de eventos. Viven en CAPSULES como 4ª sub-tab. El RECAP anual es guardable como entrada del VAULT.

### ✅ ADR-027 — DIALOGUE: perspectiva dual en galería (NUEVO S49)
Modo de galería que intercala las fotos de Edu y David como una conversación visual. Fotos con <5min de diferencia se emparejan con conector visual. Asimetría (un usuario sin fotos en un período) se maneja con eco visual poético, sin vacío ni culpa.

### ✅ ADR-028 — Acceso por clave para test y admin (NUEVO S150, implementado G3-1)
> Decisión aprobada por Edu el 2-ago-2026. Implementación desplegada y verificada; contrato, spec y plan históricos se conservan como trazabilidad.
> Evidencia operativa: `docs/operacional/ACCESO_TEST_ADMIN.md` y `docs/Nucleo/ESTADO.md`.

Además del login de Google, el worker acepta canjear una **clave de acceso** de alta entropía por el mismo JWT: `POST /api/auth/token`. Cada clave es un secret del worker atado a un usuario de la whitelist (ADR-006): `ADMIN_ACCESS_KEY`→`admin`, `EDU_ACCESS_KEY`→`edu`. **No hay clave para David** — su flujo por Google no se toca.

`authenticate()` NO cambia: la API sigue aceptando exclusivamente JWT firmados con `JWT_SECRET`. Lo que hay son **dos emisores del mismo JWT**, no dos formas de entrar a la API. El JWT lleva `method: "google" | "access_key"` y la caducidad de siempre (`JWT_EXPIRY`, 24 h).

Toda emisión escribe `auth_login` en la tabla `events` (ADR-019); los intentos fallidos van a los logs del worker (`events.user_id` tiene FK a `users`). Revocación = borrar o rotar el secret. Manual de uso, rotación y auditoría: `docs/operacional/ACCESO_TEST_ADMIN.md`.

---

## RESUMEN DE ADRs

| # | Nombre | Estado |
|---|---|---|
| ADR-001 | Sin BD externa (D1+R2) | ✅ ENMENDADO S49 |
| ADR-002 | Colas por usuario | ✅ |
| ADR-003 | Tipos youtube/drive | ⛔ REVERTIDO S28 |
| ADR-004 | Global PlayerContext | ⚠️ ENMENDADO |
| ADR-005 | Schema v4→v5→D1 | ✅ ENMENDADO S49 |
| ADR-006 | 3 usuarios whitelist | ✅ |
| ADR-007 | Loop triestado | ✅ 🔒 |
| ADR-008 | Cola > shuffle | ⛔ REVERTIDO |
| ADR-009 | Convención primero | ✅ |
| ADR-010 | Motor HTMLAudioElement + R2 | ✅ |
| ADR-011 | trackVibe / libraryFilter | ✅ |
| ADR-012 | SemVer schema | ✅ |
| ADR-013 | OCC ETags | ✅ ENMENDADO S49 |
| ADR-014 | Pre-signed URLs R2 | ✅ |
| ADR-015 | Anti-Fricción Pliegos | ✅ 🔒 |
| ADR-016 | Schema 5.0.0 tags | ✅ |
| ADR-017 | 3 tabs definitivos | ✅ NUEVO S49 🔒 |
| ADR-018 | MusicLab único audio | ✅ NUEVO S49 🔒 |
| ADR-019 | Motor único stats (D1) | ✅ NUEVO S49 🔒 |
| ADR-020 | CAPSULES 4 experiencias | ✅ NUEVO S49 |
| ADR-021 | Galería 6 modos | ✅ NUEVO S49 |
| ADR-022 | FileUploadService unificado | ✅ NUEVO S49 |
| ADR-023 | Namespaces tags separados | ✅ NUEVO S49 |
| ADR-024 | Migración D1+Workers+R2 | ✅ NUEVO S49 |
| ADR-025 | Google OAuth2 para auth | ✅ ENMENDADO S150 🔒 |
| ADR-026 | RECAP 4ª cápsula | ✅ NUEVO S49 |
| ADR-027 | DIALOGUE perspectiva dual | ✅ NUEVO S49 |
| ADR-028 | Acceso por clave test/admin | ✅ NUEVO S150 |

**Total: 28 ADRs · 7 🔒 inamovibles · 3 ⛔ revertidos**
