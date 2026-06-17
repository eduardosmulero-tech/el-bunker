# El Bunker — Specs Externas al Reproductor + Fases del Proyecto
**Post-Auditoría — Fuente de verdad**
> Documento complementario a `el_bunker_reproductor_spec_v2.md`.
> Cubre: Gestión de Tracks, Gestión de Playlists, Estadísticas, Drops, Escucha Compartida y el roadmap de fases con specs asignadas.

---

## [TR] Gestión de Tracks (MusicLab)

### Campos del track

| Campo | Estado actual | Objetivo Fase A |
|---|---|---|
| Título | ✅ | ✅ obligatorio |
| Artista | ✅ | ✅ obligatorio |
| Archivo MP3 / URL YT | ✅ legacy | MP3 upload directo a R2. URL YT = legacy a eliminar |
| Nota | ✅ | ✅ opcional |
| Tag principal | ✅ | ✅ obligatorio (VB3) |
| Tags adicionales | ✅ | ✅ opcionales (solo filtro/búsqueda, sin efecto visual) |
| Thumbnail | ❌ | ✅ opcional. Fallback: iniciales artista sobre color sólido del vibe |
| Formato | ❌ | MP3 (Fase A). FLAC + OPUS = Fase C |

### Subida de archivos

MusicLab es el gestor completo. El usuario sube el MP3 directamente desde la app. La app gestiona la subida a R2 y registra la referencia automáticamente en el JSON de Drive (BD). No se gestiona nada fuera de la app.

Al subir: los metadatos ID3 del MP3 pre-rellenan el formulario automáticamente (EC-TR6). El usuario puede editar manualmente si los metadatos están incompletos o mal formateados.

### Vista de tracks — Información visible

Thumbnail, título, artista, nota (si existe), indicador de vibe.

### Ordenación de la vista de tracks

Configurable por el usuario: alfabético, artista, vibe, más reproducido, más reciente. Los criterios "más reproducido" y "más reciente" condicionados a que STAT-M9 esté implementado (prioridad alta Fase A).

### Edge Cases

**EC-TR1:** **MODIFICADO:** Eliminar track → soft delete con confirmación explícita. Si el otro usuario también lo está reproduciendo en ese momento, el aviso lo indica antes de ejecutar: *"Este track está siendo reproducido también por [usuario]. ¿Eliminar igualmente?"* Resultado siempre soft delete, nunca borrado físico.

**EC-TR2:** **MODIFICADO:** Eliminar track que existe en playlists → soft delete con confirmación explícita, el aviso informa de en cuántas playlists existe el track. Las playlists afectadas lo gestionan via EC-LI3.

**EC-TR3:** Editar tag mientras suena → VB17 garantiza que no se puede guardar un tag sin paleta completa. Validación obligatoria en formulario. El vibe NO actualiza en tiempo real al editar, aplica la próxima vez que se cargue el track (VB12).

**EC-TR4:** **MODIFICADO:** Subida de archivo duplicado en R2 → toast *"Este archivo ya existe. ¿Subir igualmente?"* con confirmación antes de ejecutar.

**EC-TR5:** Track sin thumbnail → iniciales del artista sobre color sólido del vibe como thumbnail generado automáticamente.

**EC-TR6:** Importar metadatos ID3 del MP3 → pre-rellena el formulario automáticamente con opción de editar manualmente si los metadatos están incompletos o mal formateados.

**EC-TR7:** Ordenación de la vista de tracks configurable. Ver sección de ordenación arriba.

---

## [LI] Gestión de Playlists (MusicLab)

### Vista de playlists — Información visible

Thumbnail, nombre, número de tracks, tag de vibe, duración total.

### Vista interior de una playlist

Header con thumbnail, nombre, tag de vibe, botón play, lista de tracks. Si la playlist está en reproducción: barra de progreso de posición actual dentro de la playlist.

### Acciones sobre una playlist

Tap = entrar. Iconos directos para acciones frecuentes. Tres puntos para ocasionales (coherente con TRACKS-M23).

### Creación de playlist

Modal con nombre obligatorio, thumbnail opcional, tag de vibe obligatorio (VB14).

### Reordenar tracks dentro de una playlist

Drag & drop ya existe. Activado por botón dedicado en lugar de tap largo o arrastre libre, para evitar activaciones accidentales al hacer scroll. Objetivo Fase A: mejorar fluidez y visibilidad del drag & drop existente.

> 🔖 DRAG-GLOBAL-C: Todos los drag & drop existentes y futuros (cola, playlist, cualquier lista) unificados con la misma animación fluida y visible. Sesión de diseño dedicada en Fase C.

### Edge Cases

**EC-LI1:** Playlist vacía → existe con estado visual diferenciado que invita a añadir tracks. Al intentar reproducirla: toast *"Esta playlist está vacía."*

**EC-LI2:** Añadir track a playlist desde vista de tracks → tres puntos → Añadir a playlist → selector de playlists + opción de crear nueva sin salir del flujo.

**EC-LI3:** Playlist con tracks eliminados de biblioteca → toast al abrir *"X tracks no están disponibles"* con opción de limpiar la playlist.

**EC-LI4:** Fusionar dos playlists → **DIFERIDA A FASE C.** Crea nueva playlist sin destruir las originales, nombrable en el momento, con opción de eliminar duplicados.

**EC-LI5:** Límite de tracks por playlist → sin límite.

**EC-LI6:** **MODIFICADO:** Reordenar tracks con shuffle activo → registra la posición actual del shuffle para no repetir ese orden en el siguiente shuffle. Sin toast.

---

## [SC] Escucha Compartida

> Fase A. Definida completamente en auditoría.

**SC1:** Control compartido. Cualquiera puede pausar, saltar, añadir a cola. Última acción recibida gana.

**SC2:** Cola compartida con atribución visual — cada track muestra quién lo añadió.

**SC3:** El vibe es compartido y deriva del track activo (VB13). Ambos dispositivos lo sincronizan automáticamente.

**SC4:** Fase A — sincronización de eventos (play, pause, skip) Y sincronización estricta de posición.

**SC5:** Presencia mutua siempre visible. Cualquiera puede unirse a la sesión del otro sin permiso.

### Inicio de sesión compartida — CERRADO

- **Botón corazón** centrado en el header del reproductor.
- Cuando el otro usuario está escuchando algo y no hay sesión compartida activa → el corazón recibe animación tipo "!" de Pokémon con boquilla.
- Pulsar el corazón en ese estado inicia la escucha compartida. Sin permiso del otro usuario — acceso libre deliberado.
- El "!" desaparece al unirse o cuando el otro deja de escuchar.
- **En sesión compartida activa:** el corazón late y brilla más. Animaciones adicionales pendientes de sesión de diseño — Fase C. Todo lo demás Fase A.
- Siempre hay un usuario que empieza y otro que se une. Sin conflicto de inicio simultáneo.

### Volumen

Individual por usuario. Independiente de la sesión compartida.

**SC6:** Estadísticas (STAT-M9) → ambos usuarios reciben crédito de escucha en sesiones compartidas.

**SC7:** Unirse a sesión en mitad de track → David entra sincronizado en la posición actual.

**SC8:** Pérdida de conexión durante sesión → continúa localmente. Al reconectar: pregunta si resincronizar o mantener posición propia.

**SC9:** Acciones simultáneas → última acción recibida gana. Sin aviso.

**SC10:** Usuario abandona sesión → el otro continúa sin interrupción + toast informativo. El que sale hereda el track actual como punto de partida de su sesión independiente.

**SC11:** El host pausa → el guest también pausa. Si el guest quiere continuar, debe salir de la sesión.

**SC12:** Track escuchado parcialmente en sesión compartida → cuenta en estadísticas solo si el usuario escuchó >50% del track.

**SC13:** Tracks añadidos a la cola por usuario que abandona → permanecen en la cola del que continúa.

**SC14:** Información de presencia visible → track activo del otro usuario. Sin posición exacta ni cola.

**SC15:** Partner-vibe-follow. El indicador de presencia (status bar) y el corazón en el header siguen el vibe del track que el otro usuario está escuchando, no el vibe local del reproductor. El color del corazón y el badge track se iluminan con el acento cromático del tag del partner. Deriva de la presencia heartbeat que envía `track_vibe`.

> 🔖 SC-M18: Revisar modelo de cola Drive para escrituras concurrentes sin colisión antes de implementar.
> 🔖 SC-M19-ANIM: Animaciones avanzadas del corazón en sesión activa — pendientes de sesión de diseño. Fase C.

---

## [D] Drops

> Fase B. Feature completa definida.

### Concepto

Mensaje emocional/contextual de un usuario al otro, vinculado a un track y a un segundo exacto de reproducción.

### Anatomía

| Campo | Tipo | Obligatorio |
|---|---|---|
| Track vinculado | referencia a track | ✅ |
| Segundo exacto | número (mín 0) | ✅ |
| Mensaje | texto máx 200 chars | ❌ |
| Autor | usuario | ✅ automático |
| Destinatario | usuario distinto al autor | ✅ |
| Fecha de creación | timestamp | ✅ automático |
| Estado | pending / read / saved | ✅ automático |
| Guardado en favoritos | boolean | ❌ acción posterior |

### Reglas

**D1:** Límite de mensaje: 200 caracteres.

**D2:** El mensaje es opcional. Un drop puede existir solo con track + segundo.

**D3:** Múltiples drops al mismo track y segundo están permitidos.

**D4:** Solo entre usuarios distintos. No se pueden enviar drops a uno mismo.

**D5:** El autor puede editar o eliminar un drop mientras esté en estado pending. El destinatario ve indicador "editado" si fue modificado.

**D6:** Notificación push Android al recibir un drop. Sin preview del mensaje en la bandeja (privacidad).

### Flujo de recepción

1. Al abrir la app → toast/resumen si hay drops pendientes: *"Tienes X drops de David."*
2. Acceso a la pestaña de drops para ver detalle.
3. Acciones disponibles por drop: leer, guardar en favoritos, ir al reproductor en el segundo exacto, cerrar.

### Pestaña Drops — Estructura

- **Enviados pendientes:** drops lanzados que el destinatario aún no abrió. Editables y eliminables.
- **Favoritos:** drops guardados, tanto recibidos como enviados propios. Solo eliminables, no editables.

### Edge Cases

**EC-D1:** Segundo del drop supera la nueva duración del track (archivo reemplazado) → drop marcado como inválido visualmente. No se elimina automáticamente.

**EC-D2:** Track del drop eliminado de Drive → drop persiste. Acción "ir al reproductor" deshabilitada con indicador visual.

**EC-D3:** Múltiples drops pendientes al abrir → resumen *"Tienes X drops de David."* No se muestran uno a uno bloqueando la entrada.

**EC-D4:** Editar drop pending → permitido con indicador "editado" visible para el destinatario.

**EC-D5:** Notificación push → genérica, sin preview del mensaje.

**EC-D6:** Drop en segundo 0 → permitido.

**EC-D7:** Track de un favorito eliminado posteriormente → drop permanece con snapshot de metadatos (título, artista, segundo) guardados en el momento de marcar como favorito.

> 🔖 DROP-M20: Bug conocido — la pestaña de drops abre en el navegador nativo en lugar de dentro de la app y se corta. Auditoría de UI y fix pendientes en Fase B.
> 🔖 DROP-M21: Snapshot de metadatos en favoritos — al guardar, persistir título, artista y segundo como campos propios del drop. Pendiente implementar Fase B.

### Drops y estadísticas

Los datos de drops se registran en STAT-M9: drops enviados, recibidos, guardados como favoritos, tracks más dropeados, segundos más dropeados por track. Separado por usuario.

---

## [STAT] Estadísticas

> Prioridad alta. Implementar tras estabilización de bugs. Fase A.

**Datos a registrar por usuario:**
- Reproducciones por track (fecha y hora de cada una)
- Reproducciones por playlist (ídem)
- Reproducciones en diferentes modos: segundo plano, en TV, con reproductor en pantalla completa, etc.
- Reproducciones por tag y vibe
- Drops enviados, recibidos, guardados como favoritos
- Tracks más dropeados y segundos más dropeados
- Base para resumen anual tipo "Lo escuchado este año"
- En sesiones compartidas: ambos usuarios reciben crédito. Solo cuenta si el usuario escuchó >50% del track (SC12).

> **Decisión pendiente:** ¿Guardar estadísticas en el JSON principal de Drive o en colección separada para no inflar la BD?

---

## Fases del Proyecto

### Fase A — Cimientos y Estabilidad (MVP robusto)

**Objetivo:** La app es 100% usable, estable y visualmente coherente. Si algo está, funciona perfecto.

**Specs de esta fase:**

| Bloque | Specs |
|---|---|
| **Motor** | Eliminación de motor YouTube (YT-M5 BLOQUEANTE) |
| **Sesión** | S1, S2, S3 (soft delete), S4, S5, S6, S7, S8 |
| **Cola** | Q1–Q17 (Q13 diferida, Q6 y Q12 como guinda) |
| **Vibe/Tags** | VB1–VB19 (VB20 diferida a B). Fix bug VB9 (CSS :root) |
| **Contexto** | C1–C5, EC-C1–EC-C4, EC-C5 anulada |
| **Playback** | P1–P3 (P3 gapless solo), EC-P1–EC-P5. P-M8 cerrado (80% precarga R2) |
| **Shuffle** | SH1–SH3, EC-S1–EC-S5 |
| **Loop** | L1–L4 |
| **Android** | A1–A6, UX-G2, UX-G3 |
| **MediaSession** | M1–M12. Cast básico (CAST1–CAST6) |
| **UX** | UX1–UX11. VIZ1 (frame estático lockscreen). VIZ2, VIZ3, VIZ4 |
| **Transiciones** | T1–T10 (T11 anulada) |
| **Tracks** | TR campos completos, EC-TR1–EC-TR7, subida MP3 a R2, ID3 |
| **Playlists** | EC-LI1–EC-LI3, EC-LI5, EC-LI6. EC-LI4 diferida a C |
| **Escucha compartida** | SC1–SC14 completo. SC-M17 cerrado. Animaciones corazón avanzadas = C |
| **Estadísticas** | STAT-M9 (prioridad alta, post-bugs) |
| **Buscador** | UI-M24 cerrado (botón en cabecera). Filtros AND (VB15) |
| **Modos de vista** | UX10 + UI-M25 (toggle diseño pendiente, funcionalidad A) |
| **Drag & drop** | Q5 (cola), playlists — mejorar fluidez. Unificación visual = C |

**Bugs prioritarios Fase A:**
- Q1/Q8/Q9: shuffle ignora cola manual
- VB9: vibe solo afecta reproductor en lugar de toda la UI
- DROP-M20: pestaña drops abre en navegador nativo (fix en Fase B)

---

### Fase B — Interacción y Flexibilidad de Uso

**Objetivo:** Ampliar el control del usuario y activar features de interacción.

| Bloque | Specs |
|---|---|
| **Reproducción granular** | Iniciar playlist desde canción específica interna (C2/C3 actualización) |
| **Selección múltiple** | Q13 — selección múltiple de tracks |
| **Crossfade** | P3 configurable 0–8s, EC-L5-M10 loop + crossfade |
| **Drops** | Sistema completo: DROP-M20 (fix bug + UI), DROP-M21 (snapshot favoritos), EC-D completo |
| **Visualizador** | VIZ-M12 (live wallpaper lockscreen), VIZ-M14 (timeout salvapantallas configurable) |
| **Vibe playlist** | VB20 — vibe fusionado playlist+track (sesión de diseño dedicada) |
| **MediaSession** | CAST-M11-FULL (Cast SDK completo + receiver app) |
| **Audio** | VIZ-M16 screensaver idle TV |
| **Escucha compartida** | SC-M18 revisar modelo escrituras concurrentes |

---

### Fase C — Refinamiento y Funciones Avanzadas

**Objetivo:** Pulir la experiencia y añadir features de largo plazo.

| Bloque | Specs |
|---|---|
| **Vibes avanzados** | VB20 implementación completa (mezclados/condicionales Playlist+Track) |
| **Offline** | Soporte offline completo |
| **Cast universal** | CAST-M11-DLNA (DLNA/universal) |
| **Visualizador** | VIZ-M15 (animación entrada primer vibe, emerge desde negro, T7/VIZ6) |
| **Escucha compartida** | SC-M19-ANIM (animaciones avanzadas del corazón en sesión activa) |
| **Playlists** | EC-LI4 (fusión de playlists) |
| **Drag & drop** | Unificación global de animaciones (DRAG-GLOBAL-C) |
| **Audio** | AUDIO-M22 (FLAC + evaluación OPUS) |

---

## Decisiones Arquitecturales Abiertas

| ID | Pregunta | Estado |
|---|---|---|
| D1-DB | ¿Estadísticas en JSON principal de Drive o colección separada? | PENDIENTE |
| D1-CLOUDFLARE | ¿D1 (Cloudflare D1) para persistencia de posición + estadísticas? | PLACEHOLDER ABIERTO |
| VB10-M3 | Contraste algorítmico texto/iconos | DECISIÓN MÓVIL — validar en dispositivo |
| TR1-M6 | Duración transición de vibe 1s | PROVISIONAL — validar en dispositivo |
| TRACKS-M23 | Qué acciones son realmente frecuentes en interacción con track | PENDIENTE POST-TESTING |
| UI-M25 | Iconografía toggle modos de vista | PENDIENTE SESIÓN DE DISEÑO VISUAL |
| VIZ-M13 | Presets visualizador por vibe | PENDIENTE al diseñar paletas |
