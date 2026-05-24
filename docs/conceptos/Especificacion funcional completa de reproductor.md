# El Bunker — Especificación Funcional Completa
**Fase 1: Definición del reproductor ideal**
> Documento generado en sesión de diseño. No implementar nada hasta completar Fase 2 (roadmap técnico).
> Toda decisión aquí es fuente de verdad sobre comportamiento esperado del producto.

---

## Contexto del proyecto

| Campo | Valor |
|---|---|
| Nombre | el_bunker |
| Tipo | PWA privada Android-only |
| Usuarios | Edu y David |
| Estética | Cyber-vandal / Winamp |
| Comportamiento objetivo | Reproductor premium (YTM / Spotify Premium) |
| Motor final | Drive stream MP3 + archivos locales descargados de Drive |
| Motor legacy | YouTube iframe — **PLACEHOLDER, objetivo eliminarlo** |
| Storage | Google Drive como única fuente de verdad |

---

## Reglas globales de UX

**UX-G1:** Todos los avisos al usuario son toasts no bloqueantes salvo acciones destructivas irreversibles (eliminar track, vaciar cola), que requieren confirmación explícita.

**UX-G2:** ANDROID-R1 — Cualquier interrupción externa de audio pausa el_bunker. La reanudación es siempre decisión explícita del usuario. Sin excepciones en Fase A.

**UX-G3:** ANDROID-R2 — Un kill de Android se trata idéntico a un cierre voluntario. Sin comportamiento especial ni reconexión automática.

---

## [S] Sesión

**S1:** Tracks ≤25min siempre empiezan desde el principio al reabrir. Aplica también en kills de Android.

**S2:** Tracks >25min con posición actual >5min escuchados: guardar y restaurar posición. Aplica también en kills de Android.

**S3:** Track eliminado de Drive → aviso con metadatos históricos (título, artista, fecha eliminación) + estado neutral.

**S4:** Sin MP3 o sin red → aviso + estado neutral consciente. Sin auto-skip.

**S5:** Sesión independiente por usuario. Edu y David tienen estados de reproducción separados.

**S6:** Cola persiste entre sesiones. Se destruye solo por acción explícita del usuario.

**S7:** Acciones explícitas sobre la cola: vaciar o guardar como playlist.

**S8:** Shuffle y loop son configuración personal persistente por usuario. No se resetean salvo cambio manual.

---

## [Q] Cola

**Q1:** Cola manual tiene prioridad absoluta sobre el contexto de reproducción.

**Q2:** Historial de reproducción disponible durante la sesión. El botón anterior navega por él en orden cronológico real.

**Q3:** Historial sobrevive a cambios de contexto durante la sesión.

**Q4:** Tracks en cola manual tienen botón para añadir permanentemente a la playlist activa — inserción al final (Modelo 2).
> 🔖 Q4-M1: Modelo 1 (inserción posicional exacta) — PENDIENTE SESIÓN DE DISEÑO. No asumir que existe.

**Q5:** Cola manual reordenable mediante drag and drop.

**Q6:** Límite de 75 tracks en cola. Al alcanzarlo, el sistema sugiere guardar como playlist.

**Q7:** Añadir track duplicado a la cola → toast no bloqueante con opción de añadir igualmente.

**Q8:** Shuffle nunca afecta el orden de la cola manual.

**Q9:** Activar shuffle aleatoriza el contexto de reproducción desde el punto actual. La cola manual no se modifica.

**Q10:** Cola manual sobrevive a cambios de contexto.

**Q11:** Dos acciones distintas disponibles: "Reproducir a continuación" (inserta tras el track activo) y "Añadir a cola" (añade al final).

**Q12:** Añadir playlist entera a la cola: si el resultado supera 75 tracks, el sistema avisa antes de ejecutar.

**Q13:** 🔖 Selección múltiple de tracks — FEATURE DIFERIDA. No existe, no se asume.

**Q14:** Vista de cola separa visualmente cola manual y contexto de reproducción con label y divisor.

**Q15:** Historial de tracks reproducidos visible en la misma pantalla desplazando hacia arriba, visualmente atenuado.

**Q16:** Track eliminado de biblioteca → desaparece de cola con toast informativo.

**Q17:** Si el track eliminado era el siguiente en sonar y la reproducción está activa → auto-skip con toast. Si no hay alternativa → estado neutral.

---

## [VB] Vibe — Fase A

**VB1:** Sistema de tags cerrado. Un tag requiere paleta completa definida para poder existir.

**VB2:** Tags actuales: `gaming`, `420`, `dnb`, `romantiqueo`. "All" es filtro de biblioteca, no tag, no genera vibe.

**VB3:** Todo track requiere mínimo un tag principal obligatorio.

**VB4:** Tag principal = elección explícita al crear o editar el track.

**VB5:** El vibe se activa cuando el track lleva 2 segundos en reproducción confirmada.

**VB6:** Transición de vibe: gradiente parcial top-bottom sobre header y fondo. Duración 1 segundo. Crossfade normal en el resto de elementos.
> 🔖 TR1-M6: Duración provisional — validar en dispositivo real antes de fijar.

**VB7:** El vibe se mantiene activo durante la pausa.

**VB8:** Sin track activo → color base oscuro fijo de El Bunker. Sin vibe residual.

**VB9:** El vibe afecta toda la UI excepto: botones destructivos, estados de error, indicadores de sistema.

**VB10:** Texto e iconos incluidos en el vibe con contraste algorítmico mínimo garantizado.
> 🔖 VB10-M3: DECISIÓN MÓVIL — replantear tras test visual en dispositivo real.

**VB11:** 6 tokens de color por paleta en Fase A: fondo, superficie, primario, acento, texto, borde. Expansión a 20 como objetivo de madurez.

**VB12:** Base siempre oscura. Contraste legible en exterior/sol.

**VB13:** El vibe deriva siempre del tag principal del track activo. Sin intervención manual del usuario. Sin excepciones en Fase A.

**VB14:** Las playlists tienen tag principal obligatorio. No afecta al vibe en Fase A.

**VB15:** El vibe es independiente por usuario.

**VB16:** El vibe no se persiste. Se deriva en tiempo real del track activo.

**VB17:** No se puede crear ni guardar un tag sin paleta completa definida. Validación obligatoria en formulario.

**VB18:** Editar el tag de un track mientras suena → vibe actualiza inmediatamente con transición estándar (VB6).

**VB19:** Al volver al primer plano desde Android → vibe se restaura sin transición.

**VB20:** 🔖 Fase B — Vibe fusionado y lógica de playlist sobre vibe — PENDIENTE SESIÓN DE DISEÑO DEDICADA.

---

## [C] Contexto de reproducción

**C1:** Fuentes de reproducción válidas: playlist, cola manual. Búsqueda por texto y filtro "All"/vibe son solo herramientas de visualización y selección, nunca fuente de reproducción.

**C2:** Al pulsar play en un track dentro de una lista (sin filtro de búsqueda activo), esa lista completa se adopta como contexto. Al terminar el track, continúa automáticamente con el siguiente.

**C3:** Sin cola manual ni contexto activo → el reproductor para al terminar el track. Estado neutral consciente.

**C4:** Prioridad: Cola manual → Contexto activo → Neutral.

**C5:** Al iniciar reproducción desde el track N de una playlist, el contexto empieza en ese track y avanza hacia adelante. Los tracks anteriores son accesibles solo via historial (Q2/Q15).

**EC-C1:** Play desde búsqueda activa → solo suena ese track, sin contexto posterior.

**EC-C2:** Play desde vista de tracks sin filtro de búsqueda activo → todos los tracks visibles se convierten en contexto.

**EC-C3:** Cola manual activa + usuario pulsa play en playlist → toast "Hay tracks en cola. ¿Reemplazar contexto o añadir playlist al final de la cola?" El usuario decide.

**EC-C4:** Contexto agotado con loop de lista → vuelve al track 1 de la playlist.

**EC-C5:** Playlist modificada mientras suena → tracks eliminados desaparecen del contexto en tiempo real. Tracks añadidos solo si están después del punto actual.

> 🔖 C-M7: Búsqueda por texto en tracks y playlists — pendiente diseño de UI. Solo para visualizar y añadir, nunca fuente de reproducción.

---

## [P] Playback

**P1:** Motor automático — local preferido si disponible, Drive stream como fallback. Transparente al usuario. Indicador visual pequeño en track activo (local/stream).

**P2:** Fallback de red — reintento silencioso único (3s) → skip automático con toast → si no hay siguiente, neutral consciente con toast.

**P3:** Gapless por defecto en Fase A. Crossfade como opción configurable (0–8s, desactivado por defecto) en Fase B.

> 🔖 P-M8: Precarga del siguiente track — necesario para gapless con Drive stream. Pendiente definir cuándo y cuánto se precarga.
> 🔖 AUDIO-M22: Soporte de formatos — MP3 obligatorio, FLAC opcional. Evaluar en Fase B conversión automática a OPUS para optimizar streaming.

**EC-P1:** Red cae durante precarga → indicador visual en track siguiente mientras falla + reintento 3s → skip con toast.

**EC-P2:** Archivo local corrupto → toast "Archivo local dañado, usando stream" + fallback automático a Drive stream.

**EC-P3:** Token OAuth expira durante stream → renovación silenciosa en background. Sesión permanente hasta revocación por Google. En ese caso: para limpiamente, pide reautenticación una vez, retoma.

**EC-P4:** Track sin archivo en Drive ni local → visible en lista con indicador de no disponible. Auto-skip con toast si llega en reproducción.

**EC-P5:** Duplicado en cola, mismo archivo → el reproductor detecta el caso y hace seek al inicio en lugar de recargar. Gapless garantizado.

---

## [SH] Shuffle

**SH1:** Activar shuffle a mitad de contexto → aleatoriza los tracks restantes desde el siguiente. El track actual sigue sonando. Historial no se toca.

**SH2:** El botón anterior en shuffle → siempre el track anterior real que sonó. El historial es la verdad.

**SH3:** Desactivar shuffle → continúa desde el track actual en orden lineal hacia adelante.

**EC-S1:** Shuffle activo + track añadido a cola manual → track manual al frente (Q1). Al consumirse, retoma la lista aleatoria pre-generada donde estaba.

**EC-S2:** Track eliminado de playlist con shuffle activo → se elimina silenciosamente de la lista aleatoria restante.

**EC-S3:** Lista aleatoria agotada + loop de lista → nueva lista aleatoria diferente, garantizando que el primer track no sea igual al último que sonó.

**EC-S4:** Shuffle con un solo track en contexto → para al terminar. Neutral consciente. Si loop está activo, loop tiene preferencia (EC-L1).

**EC-S5:** Historial de sesión → sin límite de profundidad.

---

## [L] Loop

**L1:** Loop de track es absoluto mientras esté activo. La última acción del usuario es la intención vigente. El botón siguiente es siempre salida de emergencia manual.

**L2:** Loop lista + último track eliminado mientras suena → al terminar, vuelve al nuevo último track de la lista.

**L3:** Loop lista con un solo track en contexto → se comporta idéntico a loop de track.

**L4:** Loop off + lista agotada → para. Neutral consciente. Sin reinicio automático.

> 🔖 EC-L5-M10: Comportamiento de loop durante crossfade activo — Fase B.

---

## [A] Android

**A1:** App killed por sistema (OOM) → S1/S2 aplican al reabrir. Reproducción pausada esperando al usuario.

**A2:** Llamada entrante → pausa automática. No reanuda sola. Usuario decide.

**A3:** Auriculares desconectados → pausa automática inmediata. Usuario decide si reanudar por altavoz.

**A4:** Pantalla bloqueada → reproducción continúa. Controles disponibles en lockscreen via MediaSession.

**A5:** Otra app de audio arranca → pausa automática. No reanuda sola. Usuario decide.

**A6:** Modo No Molestar → sin efecto sobre audio activo.

---

## [M] MediaSession

**M1:** Botones físicos de auriculares → 1 click = play/pause, 2 clicks = siguiente, 3 clicks = anterior.

**M2:** Notificación lockscreen → artwork, título, artista, controles anterior/pause/siguiente, color de vibe activo como fondo. Color base oscuro cuando pausado o sin track.

**M3:** Botones de notificación → siempre visibles. Deshabilitados en gris cuando no aplican.

**M4:** Barra de progreso en notificación → visible e interactiva. Seek desde lockscreen disponible.

**M5:** Pérdida de foco de MediaSession → comportamiento cooperativo. Reclama al volver a primer plano o pulsar play.

**M6:** Track sin artwork → color sólido del vibe activo como fallback en notificación.

**M7:** Notificación persistente siempre durante reproducción, en primer plano y background.

**M8:** Tap en el cuerpo de la notificación → abre app directamente en el reproductor activo.

**M9:** Notificación no descartable durante reproducción activa.

**M10:** Botón de volumen físico + auriculares → sincronizado bidireccionalmente con masterVolume interno.

**M11:** Google Assistant → responde a comandos estándar de voz via MediaSession (play, pause, siguiente, anterior).

**M12:** Cambio de track desde notificación en background → ocurre silenciosamente. Notificación actualiza título y artwork.

### Cast (Chromecast)

**CAST1:** Protocolo Fase A: Google Cast. El audio viaja de Drive al TV directamente. El móvil actúa como mando.

**CAST2:** El TV recibe el visualizador completo (no solo audio). SVG/Canvas vectorial, escalable a 4K.

**CAST3:** Control por voz via Google Assistant en TV + controles táctiles desde mando del TV.

**CAST4:** Red cae durante Cast → app detecta, pausa, reintenta (P2), reanuda el Cast al recuperar red.

**CAST5:** Cast continúa aunque el móvil se bloquee o minimice la app.

**CAST6:** Kill de Android → Cast para. Al reabrir, usuario reinicia manualmente.

> 🔖 CAST-M11-FULL: Cast es una feature con entidad propia. Requiere Cast SDK + receiver app. Prioridad post-estabilización.
> 🔖 CAST-M11-DLNA: Soporte DLNA/universal — Fase B.

---

## [UX] UX Expectations

**UX1:** Seek → barra de progreso táctil + doble tap izquierda/derecha para saltar 10 segundos.

**UX2:** Feedback haptico leve en acciones clave: play/pause, skip, añadir a cola.

**UX3:** Estado de carga de un track → el botón de play se convierte en spinner hasta que el audio arranca.

**UX4:** Error de carga → artwork del track se tiñe brevemente en rojo antes del skip automático.

**UX5:** Gestos sobre el reproductor → swipe horizontal = cambiar track, swipe vertical = abrir cola.

**UX6:** Modo visualizador a pantalla completa → activado por tap en el reproductor. Muestra barras de espectro, disco giratorio, oscioscopio, partículas reactivas, VU meters, fondo plasma/humo. No artwork.

**UX7:** Volumen auriculares sincronizado con masterVolume interno (M10).

**UX8:** Orientación landscape → forzar portrait siempre.

**UX9:** Buscador en cualquier lista → pull down para desplegar. Siempre disponible, nunca visible por defecto. Aplica a TRACKS, LISTS, cola y cualquier lista futura.

**UX10:** Modos de representación visual de listas: Lista (compacta), Grid (portadas), Tarjeta (expandida). Toggle en cabecera. Preferencia persistente por usuario. Aplica a TRACKS y LISTS.
> 🔖 UI-M25: Pendiente definir iconografía del toggle coherente con estética cyber-vandal.

**UX11:** Sistema de interacción con track en lista → Tap = reproducir. Iconos directos para acciones frecuentes. Tres puntos para acciones ocasionales.
> 🔖 TRACKS-M23: Decisión cerrada pendiente de testing de estabilización. Validar qué acciones son realmente frecuentes con uso real.

### Visualizador

**VIZ1:** Fase A — Lockscreen: último frame estático del visualizador con controles MediaSession encima.
> 🔖 VIZ-M12: Fase B — live wallpaper animado completo en lockscreen.

**VIZ2:** Presets de visualizador por vibe. Cada vibe tiene su propio estilo visual. No configurable manualmente por el usuario.
> 🔖 VIZ-M13: Pendiente definir los 4 presets visuales al diseñar las paletas de vibe.

**VIZ3:** Activación → tap en el reproductor. También se activa automáticamente tras inactividad táctil configurable.
> 🔖 VIZ-M14: Timeout por defecto propuesto: 30 segundos.

**VIZ4:** Reactividad de audio → Web Audio API + AnalyserNode sobre Drive stream. Procedural/BPM para Cast (el audio no pasa por el móvil en Cast).

**VIZ5:** Visualizador en TV → vectorial, reactividad procedural, colores del vibe activo. Sin track activo: color base oscuro (VB8).
> 🔖 VIZ-M16: Screensaver idle TV con logo — Fase B.

**VIZ6:** Entrada del primer vibe de la sesión → animación más elaborada. Emerge desde negro.
> 🔖 VIZ-M15: Propuesta: bloom desde negro durante 2s coincidiendo con VB5.

> 🔖 YT-M5 BLOQUEANTE: La eliminación completa del motor YouTube es prerequisito para considerar el reproductor estabilizado. Sin ella: sin visualizador reactivo real, sin gapless garantizado, sin Cast limpio, sin estadísticas precisas, sin control total de MediaSession.

---

## [T] Transiciones entre contextos

**T1:** El único disparador de cambio de vibe es un cambio de track activo. No existe acción manual del usuario sobre el vibe en Fase A.

**T2:** Navegación entre páginas durante reproducción → reproducción continúa sin interrupción. Mini-player persiste en todas las vistas como capa permanente.

**T3:** Transición de página → el contenido hace slide. El reproductor/mini-player permanece anclado.

**T4:** Timing de transición de vibe → arranca a los 2s del nuevo track (VB5 consistente).

**T5:** Transición de vibe interrumpida por nuevo track → la anterior se cancela, arranca la nueva desde el estado visual actual.

**T6:** Transición al estado neutral (reproductor para) → fade lento de 3s al color base oscuro.

**T7:** Primer track de la sesión → animación de entrada más elaborada. Emerge desde negro (VIZ6).

**T8:** Cambio de track sin cambio de vibe (mismo tag) → pulso sutil de intensidad en el vibe activo.

**T9:** Track sin tag (datos legacy) → se reproduce con color base oscuro (VB8). No puede ocurrir en tracks nuevos (VB3/VB17).

**T10:** Vibe durante carga del siguiente track → mantiene el vibe del track anterior durante la carga.

**T11:** Botón anterior (acción explícita del usuario) → transición de vibe sin delay de 2s. La transición de 1s (VB6) aplica pero sin espera.

---

## [SC] Escucha compartida

> Feature futura. Definida para no bloquear decisiones arquitecturales.

**SC1:** Control compartido. Cualquiera puede pausar, saltar, añadir a cola. Última acción recibida gana.

**SC2:** Cola compartida con atribución visual — cada track muestra quién lo añadió.

**SC3:** El vibe es compartido y deriva del track activo (VB13). Ambos dispositivos lo sincronizan automáticamente.

**SC4:** Fase A — sincronización solo de eventos (play, pause, skip). Sin sincronización estricta de posición.
> 🔖 SC-M17: Sincronización estricta de posición — Fase B. Requiere evaluar WebSockets vs Drive polling.

**SC5:** Presencia mutua siempre visible. Cualquiera puede unirse a la sesión del otro sin permiso.
> 🔖 SC-M19: UI de presencia mutua — pendiente diseño. Indicador persistente sutil cuando el otro usuario está activo.

**SC6:** Estadísticas (STAT-M9) → ambos usuarios reciben crédito de escucha en sesiones compartidas.

**SC7:** Unirse a sesión en mitad de track → David entra sincronizado en la posición actual.

**SC8:** Pérdida de conexión durante sesión → continúa localmente. Al reconectar: pregunta si resincronizar o mantener posición propia.

**SC9:** Acciones simultáneas → última acción recibida gana. Sin aviso.

**SC10:** Usuario abandona sesión → el otro continúa sin interrupción + toast informativo. El que sale hereda el track actual como punto de partida de su sesión independiente.

**SC11:** El host pausa → el guest también pausa. Si el guest quiere continuar, debe salir de la sesión.

**SC12:** Track escuchado parcialmente en sesión compartida → cuenta en estadísticas solo si el usuario escuchó >50% del track.

**SC13:** Tracks añadidos a la cola por usuario que abandona → permanecen en la cola del que continúa.

**SC14:** Información de presencia visible → track activo del otro usuario. Sin posición exacta ni cola.

> 🔖 SC-M18: Escucha compartida completa — feature futura. Revisar modelo de cola Drive para escrituras concurrentes sin colisión antes de implementar.

---

## [D] Drops

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

**D3:** Múltiples drops al mismo track y segundo están permitidos. El segundo actúa como diferenciador natural.

**D4:** Solo entre usuarios distintos. No se pueden enviar drops a uno mismo.

**D5:** El autor puede editar o eliminar un drop mientras esté en estado pending. El destinatario ve indicador "editado" si fue modificado.

**D6:** Notificación push Android al recibir un drop. Sin preview del mensaje en la bandeja (privacidad).

### Flujo de recepción

1. Al abrir la app → toast/resumen si hay drops pendientes: "Tienes X drops de David."
2. Acceso a la pestaña de drops para ver detalle.
3. Acciones disponibles por drop: leer, guardar en favoritos, ir al reproductor en el segundo exacto, cerrar.

### Pestaña Drops — Estructura

- **Enviados pendientes:** drops lanzados que el destinatario aún no abrió. Editables y eliminables.
- **Favoritos:** drops guardados, tanto recibidos como enviados propios. Solo eliminables, no editables.

### Edge Cases

**EC-D1:** Segundo del drop supera la nueva duración del track (archivo reemplazado) → drop marcado como inválido visualmente. No se elimina automáticamente.

**EC-D2:** Track del drop eliminado de Drive → drop persiste. Acción "ir al reproductor" deshabilitada con indicador visual.

**EC-D3:** Múltiples drops pendientes al abrir → resumen "Tienes X drops de David". No se muestran uno a uno bloqueando la entrada.

**EC-D4:** Editar drop pending → permitido con indicador "editado" visible para el destinatario.

**EC-D5:** Notificación push → genérica, sin preview del mensaje.

**EC-D6:** Drop en segundo 0 → permitido.

**EC-D7:** Track de un favorito eliminado posteriormente → drop permanece con snapshot de metadatos (título, artista, segundo) guardados en el momento de marcar como favorito.

> 🔖 DROP-M20: Botón de creación de drop ya existe en el reproductor. Pendiente revisión en auditoría de interfaz para validar UX del flujo completo.
> 🔖 DROP-M21: Snapshot de metadatos en favoritos — al guardar, persistir título, artista y segundo como campos propios del drop.

### Drops y estadísticas

Los datos de drops se registran en STAT-M9: drops enviados, recibidos, guardados como favoritos, tracks más dropeados, segundos más dropeados por track. Separado por usuario.

---

## [TR] Gestión de Tracks (MusicLab)

### Campos del track

| Campo | Estado actual | Objetivo Fase A |
|---|---|---|
| Título | ✅ | ✅ obligatorio |
| Artista | ✅ | ✅ obligatorio |
| Archivo MP3 / URL YT | ✅ legacy | MP3 upload directo. URL YT = legacy a eliminar |
| Nota | ✅ | ✅ opcional |
| Tag principal | ✅ | ✅ obligatorio (VB3) |
| Tags adicionales | ✅ | ✅ opcionales |
| Thumbnail | ❌ | ✅ opcional. Fallback: iniciales artista sobre color sólido del vibe |
| Formato | ❌ | MP3 / FLAC |

### Subida de archivos

MusicLab es el gestor completo. El usuario sube el MP3 directamente desde la app. La app gestiona la subida a Drive y registra la referencia automáticamente. No se gestiona nada fuera de la app.

### Vista de tracks — Información visible

Thumbnail, título, artista, nota (si existe), indicador de vibe.

### Edge Cases

**EC-TR1:** Eliminar track en reproducción → confirmación explícita antes de ejecutar. Si el otro usuario también lo está reproduciendo en ese momento, el aviso lo indica: "Este track está siendo reproducido también por [usuario]. ¿Eliminar igualmente?"

**EC-TR2:** Eliminar track que existe en playlists → toast "Este track existe en X playlists. ¿Eliminar de todas?" con confirmación.

**EC-TR3:** Editar tag mientras suena → VB17 garantiza que no se puede guardar un tag sin paleta. Validación en formulario.

**EC-TR4:** Subida de archivo duplicado en Drive → toast "Este archivo ya existe. ¿Subir igualmente?" antes de ejecutar.

**EC-TR5:** Track sin thumbnail → iniciales del artista sobre color sólido del vibe como thumbnail generado automáticamente.

**EC-TR6:** Importar metadatos ID3 del MP3 → pre-rellena el formulario automáticamente con opción de editar manualmente si los metadatos están incompletos o mal formateados.

**EC-TR7:** Ordenación de la vista de tracks → configurable por el usuario (alfabético, artista, vibe, más reproducido, más reciente).

---

## [LI] Gestión de Listas / Playlists (MusicLab)

### Vista de playlists — Información visible

Thumbnail, nombre, número de tracks, tag de vibe, duración total.

### Vista interior de una playlist

Header con thumbnail, nombre, tag de vibe, botón play, lista de tracks. Si la playlist está en reproducción: barra de progreso de posición actual dentro de la playlist.

### Acciones sobre una playlist

Tap = entrar. Iconos directos para acciones frecuentes. Tres puntos para ocasionales (coherente con TRACKS-M23).

### Creación de playlist

Modal con nombre obligatorio, thumbnail opcional, tag de vibe obligatorio (VB14).

### Reordenar tracks dentro de una playlist

Tap largo sobre un track activa drag and drop inmediato.

### Edge Cases

**EC-LI1:** Playlist vacía → existe con estado visual diferenciado que invita a añadir tracks. Al intentar reproducirla: toast "Esta playlist está vacía."

**EC-LI2:** Añadir track a playlist desde vista de tracks → tres puntos → Añadir a playlist → selector de playlists + opción de crear nueva sin salir del flujo.

**EC-LI3:** Playlist con tracks eliminados de biblioteca → toast al abrir "X tracks no están disponibles" con opción de limpiar la playlist.

**EC-LI4:** Fusionar dos playlists → crea una nueva playlist sin destruir las originales. La nueva se puede nombrar en el momento. Opción de eliminar duplicados automáticamente al fusionar.

**EC-LI5:** Límite de tracks por playlist → sin límite.

**EC-LI6:** Reordenar tracks con shuffle activo → toast informativo "Tienes shuffle activo. El reorden afectará la próxima vez que reproduzcas sin shuffle."

---

## Estadísticas

> 🔖 STAT-M9: Sistema de estadísticas de escucha — PRIORIDAD ALTA. Implementar tras estabilización de bugs para acumular datos reales cuanto antes.

**Datos a registrar por usuario:**
- Reproducciones por track (fecha y hora de cada una)
- Drops enviados, recibidos, guardados
- Tracks más dropeados y segundos más dropeados
- Base para resumen anual tipo "Lo escuchado este año"

**Decisión pendiente:** ¿Guardar estadísticas en el JSON principal de Drive o en colección separada para no inflar la DB?

---

## Registro de Placeholders y Decisiones Pendientes

| ID | Descripción | Estado |
|---|---|---|
| Q4-M1 | Inserción posicional cola→playlist (Modelo 1) | PENDIENTE SESIÓN DISEÑO |
| Q13-M2 | Selección múltiple de tracks | FEATURE DIFERIDA |
| VB10-M3 | Contraste texto/iconos | DECISIÓN MÓVIL — replantear |
| VB20-M4 | Fase B vibe fusionado + lógica PL2 | PENDIENTE SESIÓN DISEÑO |
| YT-M5 | YouTube streaming = PLACEHOLDER LEGACY | BLOQUEANTE para estabilización |
| TR1-M6 | Duración transición de vibe 1s | PROVISIONAL — validar en dispositivo |
| P-M8 | Precarga del siguiente track | PENDIENTE DEFINIR |
| STAT-M9 | Sistema de estadísticas de escucha | PRIORIDAD ALTA post-bugs |
| EC-L5-M10 | Loop durante crossfade | FASE B |
| CAST-M11 | DLNA/universal | FASE B |
| CAST-M11-FULL | Cast SDK completo + receiver | POST-ESTABILIZACIÓN |
| VIZ-M12 | Live wallpaper lockscreen | FASE B |
| VIZ-M13 | Presets visualizador por vibe | PENDIENTE al diseñar paletas |
| VIZ-M14 | Timeout de inactividad para visualizador | PROPUESTA: 30s |
| VIZ-M15 | Animación entrada primer vibe | PENDIENTE DISEÑO |
| VIZ-M16 | Screensaver idle TV | FASE B |
| SC-M17 | Sincronización estricta de posición compartida | FASE B |
| SC-M18 | Arquitectura completa escucha compartida | FEATURE FUTURA |
| SC-M19 | UI de presencia mutua | PENDIENTE DISEÑO |
| DROP-M20 | Botón drop en reproductor | PENDIENTE AUDITORÍA UI |
| DROP-M21 | Snapshot de metadatos en favoritos de drops | PENDIENTE IMPLEMENTAR |
| AUDIO-M22 | Soporte FLAC + evaluación OPUS | FASE B |
| TRACKS-M23 | Sistema de interacción track en lista | PENDIENTE POST-TESTING |
| UI-M24 | Buscador pull down en listas | PENDIENTE IMPLEMENTAR |
| UI-M25 | Iconografía toggle modos de vista | PENDIENTE DISEÑO |

---

## Prompt de arranque — Siguiente sesión

```
Eres arquitecto de producto/UX/sistemas de "el_bunker", PWA privada
Android para Edu y David. Estética cyber-vandal/Winamp. Motor final:
Drive stream MP3 + local descargado de Drive. YouTube = PLACEHOLDER
LEGACY bloqueante para estabilización, objetivo eliminarlo.

FASE 1 completada. Carga el documento el_bunker_fase1_spec.md adjunto
como fuente de verdad de todo lo definido.

Siguiente paso: FASE 2 — Roadmap técnico para llegar al producto
definido en Fase 1, partiendo del estado actual documentado en
architecture.md, state-map.md, event-lifecycle.md, rendering-flow.md,
data-flow.md, ownership-map.md y technical-debt.md.

No proponer nada que contradiga la spec de Fase 1.
No asumir nada que no esté en la spec o en la documentación técnica.
Si detectas contradicción entre spec y código actual, señálala antes
de proponer solución.
```

**Archivos a adjuntar en la siguiente sesión:**
1. `el_bunker_fase1_spec.md` (este documento)
2. `architecture.md`
3. `state-map.md`
4. `technical-debt.md`
5. `data-flow.md`
6. `ownership-map.md`
7. `rendering-flow.md`
8. `event-lifecycle.md`
