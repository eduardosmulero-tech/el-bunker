# CONTRATO.md — el_bunker
> ADRs vigentes. Normativo — prevalencia absoluta.
> Contradicción con este doc → Claude detiene y reporta antes de generar pliego.
> Solo crece con nuevas decisiones. Los ADRs revertidos nunca desaparecen: se marcan ⛔.
> Última actualización: S156 — G1 de escritorio: ADR-034 + aclaraciones X-6/X-7 (28-ago-2026). Base: S49, refundación del producto.
> Las specs funcionales viven en `docs/spec/`; su índice de enrutado es `docs/spec/INDEX.md`,
> exigido por el `CANON.manifest`. Este CONTRATO manda sobre ellas (ver ADR-029).

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

### ✅ ADR-029 — La HUD tiene dos arquitecturas, no una escala (NUEVO S154)
> Decisión aprobada por Edu el 7-ago-2026. Diseño completo:
> `docs/disenos/DISENO_HUD_DESKTOP_2026-08-07.md`. Tarjeta `t_504a2707`.

Por debajo de 1280px de ancho, el cromo flota sobre el contenido: cabecera fija, navegación
inferior fija y mini-reproductor flotante, con el contenido pasando por debajo. Es lo correcto
cuando no hay sitio para dos cosas a la vez, y **no se toca**.

A partir de 1280px, el cromo deja de flotar y se convierte en marco: barra superior de 44px, raíl
de navegación de 208px a la izquierda, dock de reproductor de 336px a la derecha, línea de estado
de 28px abajo, y un lienzo central que es el único elemento con scroll de la aplicación. Nada tapa
nada.

En escritorio el reproductor pertenece al marco y está visible en las tres pestañas. Esto **no
altera ADR-018 ni la regla inamovible 3**: los elementos `<audio>` siguen encapsulados en
`PlayerProvider`, que está por encima del marco en el árbol. Lo que se mueve es dónde se pinta el
mando, no quién posee el audio.

"Responsive" y "diseñado para escritorio" no son lo mismo. La app tiene adaptación responsive desde
S152; el diseño de escritorio es esto. Las afirmaciones de S152/S153 y del ACTA G0-G1 se leen como
"la app no se rompe en escritorio", que es cierto, y no como "la app está diseñada para escritorio",
que no lo era. Con esto queda cerrada la contradicción con `PROYECTO.md:54`.

**Enmiendas a las specs de `docs/spec/` que este ADR hace explícitas.** Sin ellas, el diseño de
escritorio contradice la spec en vez de ampliarla:

1. `el_bunker_reproductor_spec_v2.md` define el producto como "PWA privada **Android-only**". Pasa
   a ser **Android primero, escritorio como segundo cliente de primera clase**.
2. `UX8` ("orientación landscape → forzar portrait siempre") **queda limitada al móvil**. En
   escritorio no hay bloqueo de orientación, que es lo que el código ya hacía de facto
   (`Layout.jsx:585`) sin que ningún documento lo recogiera.
3. `galeria_vault_spec.md`, selector de 6 modos: "barra horizontal en cabecera" **sigue vigente en
   móvil**; en escritorio el selector vive en el raíl, en vertical, conservando `layoutId` y el
   glow del modo activo.
4. La regla de Edu del 6-ago (cero emoji, cero caracteres como iconografía) **prevalece sobre la
   iconografía dibujada en las specs** (el selector de galería, los badges de contexto y las
   sub-tabs de cápsulas se dibujan ahí con caracteres). Ninguna spec asigna significado al glifo
   concreto, solo al concepto: no se pierde nada.

**Lo que este ADR NO enmienda**, y por tanto sigue mandando entero: `VB1`-`VB20` (incluidos `VB8`
color base fijo en reposo, `VB9` exclusiones del vibe, `VB10` contraste algorítmico, `VB11`/`VB17`
formulario de tags con paleta completa), `T1`-`T11`, `Q15`, `UX9` y `UX10`. Enrutado a las specs:
`docs/spec/INDEX.md`.

> ADR-030 y ADR-031 están subidos (S155, cierre del hallazgo ALTA 2 de la auditoría de criterio
> GLM52). `t_50b7f0f6` queda obsoleta por canonizado; ambos residen al final del fichero.

### ✅ ADR-032 — El interior del lienzo tiene gramática propia (NUEVO S155)
> Decisión aprobada por Edu el 14-ago-2026. Diseño completo:
> `docs/disenos/DISENO_INTERIOR_LIENZO_2026-08-14.md`. Firma: `t_39123e81`.
> Tarjetas de origen: `t_703e99c7`, `t_6997adaa`, `t_b08e83a5`, `t_a8de002d`, `t_7700824f`.

ADR-029 definió el marco de escritorio y declaró explícitamente que el lienzo recibía el contenido
de cada página **tal cual** (§6 P3, §16). Esa fase nunca se escribió, y el resultado es un marco de
instrumento con una app de móvil dentro: navegación duplicada, filtros apilados, formularios en
columnas de 320px y un segundo punto de corte a 1024px que nadie decidió.

Por encima de 1280px rigen **cinco leyes** para el contenido del lienzo:

1. **Una sola frontera de disposición**: 1280, la misma del marco. No hay cortes intermedios.
2. **El lienzo no repite la navegación que el raíl ya muestra**, distinguiendo navegar de filtrar.
3. **Los filtros son una barra de una fila** que colapsa a desplegables, nunca una pila de filas.
4. **Crear contenido es una tarea que ocupa el lienzo**, con el mismo ancho y el mismo camino que
   editar. Un formulario no es un widget de barra lateral.
5. **La densidad se gana con columnas**, no estirando filas.

La geometría del marco (44 / 208 / 336 / 28), la identidad visual, las 3 pestañas, los 6 modos y
las 4 cápsulas **no se tocan**. Por debajo de 1280px no cambia un pixel.

Se implementa además el bloque de visualizador de tres niveles que ADR-029 §6 P4 ya especificaba y
que quedó sin construir, y se completa `UX6` con los tres modos que faltaban. `UX6`
(`el_bunker_reproductor_spec_v2.md:289`) pide seis: *barras de espectro, disco giratorio,
osciloscopio, partículas reactivas, VU meters, fondo plasma/humo*. Hoy existen barras, osciloscopio,
onda, radial, vinilo (el disco giratorio) y túnel; **faltan VU meters, fondo plasma/humo y partículas
reactivas**, que son justamente los tres más característicos de la estética que pide Edu.

**Enmienda a `VIZ2`** (decisión X-1 de Edu, 14-ago: *siempre prioriza la personalización*). `VIZ2`
dice hoy, literal (`el_bunker_reproductor_spec_v2.md:308`): *«Presets de visualizador por vibe. Cada
vibe tiene su propio estilo visual. **No configurable manualmente por el usuario.**»* Pasa a: cada
vibe trae un preset **como punto de partida**; el usuario puede cambiar de modo cuando quiera y su
elección manda sobre el preset mientras dure la sesión. Fundamento: la regla del vibe de `REGLAS.md`
(7-ago) establece que el vibe es **el mecanismo, no el catálogo**, y es posterior a la spec del
reproductor. Consecuencia anotada para no perderla: si el catálogo es del usuario, los presets por
vibe tendrán que salir del código y vivir en el dato — es el placeholder `VIZ-M13`, que sigue
abierto y queda fuera del alcance de este ADR.

**Aclaración a ADR-029** (decisión X-2 de Edu, 14-ago): donde ADR-029 dice *«el reproductor pertenece
al marco y está visible en las tres pestañas»*, léase *«el **control** del reproductor está siempre
disponible en las tres pestañas»*. Que MUSIC LAB añada además un reproductor grande en el lienzo no
lo contradice. La regla inamovible 3 (ADR-018, un solo `<audio>` en `PlayerProvider`) no se toca:
lo que se discute es dónde se pinta el mando, nunca quién posee el audio.

**Aclaración X-6 a ADR-029** (decisión G1 de Edu, 28-ago-2026; enmendada el mismo día por su
feedback al verla: «el reproductor está duplicado en MUSIC LAB»; cierra `t_a8de002d`): en MUSIC LAB
el lienzo ES el reproductor grande —portada grande, visualizador de tres niveles de ADR-032,
mando prominente— y el dock **oculta su reproductor en esa pestaña** para no duplicarlo. El dock
conserva COLA/HISTORIAL siempre (única cola), mantiene su ancho de 336px en las tres pestañas y en
`/admin`, así §6 P4 queda en pie: el dock nunca aparece ni desaparece y el lienzo no cambia de
ancho bajo el cursor. 🔒-3 de ADR-018 intacta: un solo `<audio>` en `PlayerProvider`; se decide
dónde se pinta el mando, nunca quién posee el audio. Desbloquea `t_b617c6b3` bajo esta lectura.

### ✅ ADR-033 — VAULT en cuatro secciones (NUEVO S155)
> Decisión aprobada por Edu el 14-ago-2026. Diseño y evidencia:
> `docs/disenos/DISENO_INTERIOR_LIENZO_2026-08-14.md` §4. Firma: `t_39123e81`.
> Desbloquea `t_0ea27342` y `t_bbaa4988`.

`docs/spec/taxonomia_vault.md` define **14 categorías y ~70 tipos**, justificados por escrito como
*«14 categorías · ~70 tipos de contenido · 5-10x la industria»* (`taxonomia_vault.md:158`). Eso es un
recuento de funciones, no un diseño: está escrito desde lo que se puede presumir, no desde lo que
esta pareja guarda. Síntoma que lo demuestra sin salir del código: de los 14 filtros, **tres pares
comparten icono**, así que la fila es indescifrable por construcción. Cuando una lista de categorías
no cabe en un registro de iconos, el problema no es el registro.

Se sustituye por **cuatro secciones de VAULT — MEMORIA, PALABRAS, LUGARES, LISTAS — más una CAJA
FUERTE aparte**, tras clave y fuera de la navegación normal. Las eras siguen englobando todo el
contenido; las secciones lo parten **dentro** de la era, y cada una tiene su propia forma de mirarse:

| Sección | Qué guarda | Cómo se mira |
|---|---|---|
| **MEMORIA** | Fotos, vídeos, audio, capturas | Galería, con los 6 modos de ADR-021 |
| **PALABRAS** | Cartas, notas, diario, «abrir cuando…», bromas privadas, apodos | Lectura, ancho de 76ch |
| **LUGARES** | Mapa emocional, viajes, sitios por visitar, check-ins | Mapa |
| **LISTAS** | Películas, libros, recetas, bucket list, ideas de regalo | Tabla |
| **CAJA FUERTE** *(aparte)* | Documentos personales, médicos, legales, recuperación | Tras clave. **No se pasea** |

El eje cambia de *qué es el contenido* a *qué haces con él*, y por eso cada sección tiene una forma
natural de mirarse. Hoy las catorce comparten una sola —la galería—, y una lista de películas en una
rejilla de fotos es una lista de películas mal enseñada.

Se retiran de VAULT las categorías cuyo destino **ya está construido en otra pestaña**: la línea
temporal y la cuenta atrás (CAPSULES, ADR-020), los datos y el resumen anual (RECAP, ADR-026) y las
playlists con historia (MUSIC LAB, ADR-018). No se podan por pesadas: se podan porque el sitio donde
viven ya existe, y tener la misma cosa en dos pestañas es justo lo que ADR-017 vino a evitar. No se
pierde ninguna capacidad: se deja de ofrecer dos veces.

`taxonomia_vault.md` deja de ser el catálogo vigente y pasa a histórico —deja de ser `LIVE_SPEC` a
efectos de `REGLAS.md`, y la fila correspondiente de `docs/spec/INDEX.md` apunta desde ahora a este
ADR. El propio documento ya lo preveía: *«Cada tipo es una ficha de LEGO: se implementa cuando toca,
se quita si no encaja»* (`taxonomia_vault.md:159`).

**Dato que sostiene esta decisión** (medido en producción el 14-ago por la puerta que abrió ADR-028,
`GET /api/entries?limit=2000`): **525 entradas, y las 525 tienen `type=photo`**. Las 14 categorías
tienen **cero** entradas. El riesgo de pérdida de datos al podar el catálogo es, medido, **cero**. No
hay migración que hacer: el mapeo se resuelve **al leer**, nunca con un `UPDATE` en D1.

**Enmienda X-5 a ADR-029 — los 6 modos de galería vuelven a la cabecera del lienzo.** ADR-029 los
había mandado al raíl, enmendando `galeria_vault_spec.md:46` (*«Barra horizontal en cabecera con 6
iconos»*). Con VAULT partido en cuatro secciones el raíl aloja **las secciones**; añadir los modos lo
convertiría en un árbol de tres niveles. Y los modos no aplican a PALABRAS, LUGARES ni LISTAS: solo
MEMORIA se mira en galería. **No se revierte por error: se revierte porque cambió la premisa** — y el
efecto neto es que la spec original vuelve a estar vigente para MEMORIA, no que se invente una tercera
disposición. En móvil no cambia nada.

**Enmienda X-7 a ADR-033** (decisión G1 de Edu, 28-ago-2026; cierra `t_92734f82`): la aglutinación
de VAULT que motivó la REV del 13-ago la resuelven las cuatro secciones de este ADR. Del diseño
`DISENO_VAULT_DESKTOP_2026-08-13.md` sobrevive el selector de tipo de MEMORIA como **menú
compacto** —nunca mayor que el formulario al que abre— y el formulario con espacio real de lectura
(76ch, ADR-032). El resto del diseño del 13-ago queda histórico donde choque con las secciones.

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
|| ADR-029 | HUD: dos arquitecturas (corte 1280px) | ✅ ENMENDADO S155/S156 (X-2, X-5, X-6) ||
|| ADR-030 | Panel de administración dentro de la app | ✅ NUEVO S155 ||
|| ADR-031 | Revocación de sesiones por epoch de usuario | ✅ NUEVO S155 ||
| ADR-032 | Gramática del interior del lienzo | ✅ NUEVO S155 |
| ADR-033 | VAULT en cuatro secciones | ✅ NUEVO S155 (X-7) |
| ADR-034 | El cromo del marco deja pasar la atmósfera | ✅ NUEVO S156 |

**Total: 34 ADRs firmados · 7 🔒 inamovibles · 3 ⛔ revertidos**

> ADR-032 enmienda `VIZ2`; ADR-033 sustituye `taxonomia_vault.md` y enmienda `galeria_vault_spec.md`
> vía X-5; ADR-034 toma su receta de `DISENO_INTERIOR_LIENZO_2026-08-14.md` §7. Todas las
> enmiendas van con nombre y apellidos, como exige `docs/spec/INDEX.md` §2.

### ✅ ADR-030 — Panel de administración dentro de la app (NUEVO S155)
**Original:** La administración era una aplicación aparte.
**Vigente:** La administración vive en la ruta `/admin`, fuera de VAULT · MUSIC LAB · CAPSULES. **ADR-017 🔒-4 intacta**: no es un cuarto tab, no aparece en la navegación de móvil ni en los atajos `1`/`2`/`3`. El acceso lo autoriza el Worker (`user_id === "admin"`, ADR-028); la ocultación de la entrada en la UI es higiene visual, nunca defensa.

El panel se construye como `admin-core` **reutilizable** + descriptores declarativos por recurso, para que `vinos-carta-app` herede el núcleo. Es cliente del motor de eventos (ADR-019), no un agregador nuevo, y toda mutación administrativa emite un evento `admin_*`.

**El tema es un contrato, no un import.** `admin-core` no importa tokens de ninguna app: declara *custom properties* `--admin-*` con valores de respaldo y las define la aplicación anfitriona. En el-bunker, `--admin-accent` se ata a `--vibe-accent`, de modo que el panel sigue a lo que suena (ley del vibe) sin acoplarse a el-bunker. Quedan **fuera del vibe**, por `VB9`, el color destructivo, los estados de error y los indicadores de sistema de la consola de SALUD.

**El reproductor está disponible en el panel a cualquier ancho.** A partir de 1280px el panel se pinta dentro del marco de ADR-029 —barra superior, raíl donde vive la entrada ADMIN y sus cuatro consolas, dock de reproductor y línea de estado—; por debajo conserva su shell propio y monta el mini-player, igual que las tres pestañas. Para que ambas cosas sean posibles, la ruta `/admin` se monta **dentro de `PlayerProvider`** y se navega por routing de cliente, sin recarga.

**ADR-018 y 🔒-3 no se alteran**: los elementos `<audio>` siguen encapsulados en el provider, que está por encima del panel en el árbol; lo que se mueve es dónde se pinta el mando. Como corolario, el mando de reproducción y el puente que publica el vibe (`--vibe-accent`) dejan de vivir dentro del shell visual y pasan a ser piezas propias, montables por cualquier pantalla que cuelgue del provider. Ningún fichero congelado del player (`PlayerContext`, `WinampPlayer`, `AudioVisualizer`) se modifica.

### ✅ ADR-031 — Revocación de sesiones por epoch de usuario (NUEVO S155)
**Enmienda a ADR-028.** Donde ADR-028 dice *"Revocación = borrar o rotar el secret"*, se corrige: rotar o borrar una `ACCESS_KEY` **impide entradas futuras pero no invalida las sesiones ya emitidas**, porque la clave solo interviene en el canje y la firma usa `JWT_SECRET`. La revocación de sesiones vivas es la de este ADR.

Los JWT del Búnker son autofirmados y duran 24h (ADR-028). Para poder cortar una sesión antes de su caducidad, cada usuario lleva en D1 un contador `users.token_epoch`. Todo token emitido incorpora el claim `epoch` con el valor vigente en el momento de la firma, y `authenticate()` rechaza el token cuyo `epoch` no coincida con el del usuario. **Revocar todas las sesiones de un usuario es incrementar su contador**; no hay lista negra, ni `jti`, ni recolección de expirados.

El mecanismo es **por usuario**, no por token: con tres usuarios en whitelist (ADR-006) la granularidad por token no aporta y sí cuesta una tabla con mantenimiento. Cubre por igual las sesiones de Google (ADR-025) y las de clave de acceso (ADR-028), porque actúa en el emisor común.

Encender el Modo Visita incrementa el epoch y firma el token de visita con el valor nuevo, en esa orden. Así la censura del Modo Visita deja de ser una propiedad del dispositivo donde se activó y pasa a serlo de la cuenta.

Toda revocación emite `auth_revoked` en la tabla `events` (ADR-019 🔒-5: la consola de ACCESOS es cliente del motor de eventos, no un agregador nuevo). El estado vive en D1 (🔒-2).

**Alcance de la excepción a "authenticate() no cambia" (ADR-028).** `authenticate()` añade una comprobación de frescura contra D1. Lo que ADR-028 protegía se mantiene entero: la API sigue aceptando exclusivamente JWT firmados con `JWT_SECRET` y sigue habiendo dos emisores del mismo token, no dos formas de entrar.

### ✅ ADR-034 — El cromo del marco deja pasar la atmósfera (NUEVO S156)
**Original:** ADR-029 levantó el marco de escritorio con fondos casi opacos (barra 0.97, raíl 0.84,
dock 0.92, línea de estado opaca). GridBackground, AmbientGlows, NoiseOverlay y ScanlineOverlay
siguen montados, pero el cromo los tapa: la atmósfera solo sobrevive en el lienzo y el escritorio
se percibe como plantilla plana (`t_7700824f`, `t_e687ed00`).

**Vigente** (decisión G1 de Edu, 28-ago-2026; receta de `DISENO_INTERIOR_LIENZO_2026-08-14.md` §7):
el marco es **cristal ahumado, no pared**. La geometría de ADR-029 no se toca ni un pixel y por
debajo de 1280px no cambia nada (V-8 con capturas base):

1. **El cromo deja pasar el vibe.** Raíl y dock bajan su opacidad lo justo para que `AmbientGlows`
   se intuya detrás, con el mismo `color-mix` sobre `--vibe-accent` que ya usan sus bordes.
2. **El ruido y las scanlines cubren también el cromo**, no solo el lienzo: suben por encima del
   marco a opacidad baja y devuelven la textura CRT a la pantalla entera.
3. **El acento reacciona donde importa.** Los cuatro filetes ya usan `--vibe-accent`; el fondo del
   destino activo del raíl y el borde del dock también.

**Contención:** el brillo se gana en el borde, no en la superficie. Nada de degradados grandes
en raíl ni dock. La línea de estado sigue en color base fijo (`VB9`), nunca en color de vibe.

**Aceptación:** en desktop ≥1280 la atmósfera se aprecia a través del cromo sin cambiar tamaños ni
posiciones; el móvil queda idéntico a la línea base; la auditoría UI se mantiene en 0 overflow,
0 clipping y 0 errores de consola. Desbloquea `t_7700824f` y su hija `t_e687ed00`.
