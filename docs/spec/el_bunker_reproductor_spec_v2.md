# El Bunker — Especificación Funcional del Reproductor v2
**Fase 1: Definición del reproductor ideal — POST-AUDITORÍA**
> Documento generado tras sesión de auditoría completa sobre v1. Fuente de verdad actualizada.
> Toda decisión aquí prevalece sobre el documento anterior. Las divergencias detectadas quedan cerradas aquí.

---

## Contexto del proyecto

| Campo | Valor |
|---|---|
| Nombre | el_bunker |
| Tipo | PWA privada Android-only |
| Usuarios | Edu y David |
| Estética | Cyber-vandal / Winamp |
| Comportamiento objetivo | Reproductor premium (YTM / Spotify Premium) |
| Motor final | R2 stream MP3 + archivos locales descargados de R2 |
| Motor legacy | YouTube iframe — **PLACEHOLDER BLOQUEANTE, objetivo eliminarlo** |
| Storage archivos | Cloudflare R2 como única fuente de verdad para MP3 |
| Storage BD | Drive = solo el JSON de base de datos. Sin excepciones |

> **Terminología fija:** R2 = archivos MP3. Drive = solo el JSON de BD. Sin excepciones en ningún documento ni código.

---

## Reglas globales de UX

**UX-G1:** Todos los avisos al usuario son toasts no bloqueantes salvo acciones destructivas irreversibles (eliminar track, vaciar cola), que requieren confirmación explícita. Todos los toasts llevan vibración háptica suave (`navigator.vibrate`). Universal.

**UX-G2:** ANDROID-R1 — Cualquier interrupción externa de audio pausa el_bunker. La reanudación es siempre decisión explícita del usuario. Sin excepciones en Fase A.

**UX-G3:** ~~ANDROID-R2 original~~ — **MODIFICADO:** Kill por sistema OOM → restaura sesión completa como si nada (cola, posición, estado de reproducción pausado). Kill voluntario por usuario → S1/S2 aplican, reproducción pausada. La sesión no se pierde por reinicios no deseados. Pendiente confirmar comportamiento real al llegar a A1.

---

## [S] Sesión

**S1:** Tracks ≤25min siempre empiezan desde el principio al reabrir. Aplica en kills voluntarios de Android.

**S2:** Tracks >25min con posición actual >5min escuchados: guardar y restaurar posición. Aplica en kills voluntarios de Android.

**S3:** Soft delete obligatorio para todos los tracks: campo `deleted_at` + `deleted_by` en schema. **Nunca borrado físico.** Aviso con metadatos completos (título, artista, fecha, quién borró) + estado neutral. Protege contenido único e irremplazable.

**S4:** Sin MP3 o sin red → aviso + estado neutral consciente. Sin auto-skip. Detección de recuperación de red y oferta de reanudar: última prioridad, la guinda.

**S5:** Sesión independiente por usuario. Edu y David tienen estados de reproducción separados. Sin colisión posible — ya resuelto arquitecturalmente.

**S6:** Cola persiste en `queue_[userId].json` en Drive. Se destruye solo por acción explícita del usuario.

**S7:** **MODIFICADO:** Dos botones individuales en el header de la vista de cola: uno para vaciar, uno para guardar como playlist. No uno con submenú.

**S8:** **MODIFICADO:** Shuffle y loop en `localStorage` por usuario. No en Drive — son preferencias de dispositivo, no de cuenta. Sin resets salvo cambio manual.

---

## [Q] Cola

**Q1:** Cola manual tiene prioridad absoluta sobre el contexto de reproducción, con shuffle activo o no.
> 🐛 BUG IDENTIFICADO: shuffle actualmente ignora la cola manual. Corrección obligatoria Fase A.

**Q2/Q3:** Historial en `localStorage` por usuario. Sobrevive a reinicios no deseados. Se limpia con vaciar cola. El botón anterior navega por él en orden cronológico real. Sobrevive a cambios de contexto durante la sesión.

**Q4:** **MODIFICADO — Q4-M1 CERRADO:** Track manual en contexto de playlist tiene indicador visual: usa su propio color de tag (no el de la playlist). Botón para añadirlo a la playlist en su posición actual — inserción posicional exacta, donde está en la cola.

**Q5:** Drag & drop en cola ya existe. El trabajo real de Fase A es la separación visual definida en Q14.

**Q6:** Límite de 75 tracks en cola. Al alcanzarlo, el sistema sugiere guardar como playlist. Guinda — última prioridad dentro de Fase A.

**Q7:** Ya implementado: toast + opción de añadir igualmente al detectar duplicado.

**Q8/Q9:** Shuffle nunca afecta el orden de la cola manual. Activar shuffle aleatoriza el contexto de reproducción desde el punto actual. La cola manual no se modifica.
> 🐛 BUG IDENTIFICADO: mismo bug que Q1. Corrección conjunta.

**Q10:** Cola manual sobrevive a cambios de contexto. Bloqueada por Q14 — implementar después de la separación visual.

**Q11:** "Reproducir a continuación" y "Añadir a cola" ya implementados.

**Q12:** Añadir playlist entera a la cola: aviso si el resultado supera 75 tracks antes de ejecutar. Bloqueada por arquitectura de Q14.

**Q13:** Feature diferida. Fuera del radar hasta Fase B.

**Q14:** **MODIFICADO:** Separación visual de cola: tracks manuales se renderizan con su propio color de tag, rompiendo el patrón de color de la playlist. Sin labels ni divisores físicos. El contraste de color es el diferenciador.

**Q15:** **MODIFICADO:** Historial visible al hacer scroll arriba: 5 tracks atenuados visualmente, con posibilidad de revelar más arrastrando hacia abajo. Historial interno sin límite en `localStorage`.

**Q16/Q17:** **MODIFICADO:** Track activo eliminado → comportamiento permisivo: se deja terminar, al saltar aplica soft delete + toast. Track en cola en espera: desaparece inmediatamente + toast.

---

## [VB] Vibe y Tags — Fase A

**VB1:** Tag = clasificación. Vibe = color(es) de la HUD derivado del tag principal del track activo. Degradado combinado playlist+canción (color arriba, color abajo, difuminado en el centro): bloqueado hasta separación de colas (Q14). Fase A solo con tag de track activo.

**VB2:** "All" es filtro de biblioteca, no tag, no genera vibe.

**VB3:** Todo track requiere mínimo un tag principal obligatorio. Botón guardar bloqueado sin tag.

**VB4:** Tag principal = elección explícita al crear o editar el track. Sin asignación automática.

**VB5:** El vibe se activa cuando el track lleva 2 segundos en reproducción confirmada. Universal y estricto — cualquier cambio de track (adelante, atrás, fin de canción).

**VB6:** Transición de vibe: gradiente top-bottom sobre header y fondo. Duración 1 segundo. Crossfade normal en el resto de elementos.
> 🔖 TR1-M6: Duración provisional — validar en dispositivo real antes de fijar.

**VB7:** El vibe se mantiene activo durante la pausa, a todo color, sin atenuar.

**VB8:** Sin track activo → fade de 1s hacia color base oscuro fijo de El Bunker. Sin vibe residual.

**VB9:** El vibe afecta toda la UI excepto: botones destructivos, estados de error, indicadores de sistema.
> 🐛 BUG IDENTIFICADO: actualmente el vibe solo afecta al reproductor. Fix: variables CSS dinámicas en `:root`.

**VB10:** Texto e iconos incluidos en el vibe con contraste algorítmico mínimo garantizado.
> 🔖 VB10-M3: DECISIÓN MÓVIL — replantear tras test visual en dispositivo real.

**VB11/VB17:** Creación de tags: formulario con nombre, ColorPicker global reutilizable. Autocalculo de paleta (contrastes, opacidades) + edición manual de cada valor. No se puede guardar sin paleta completa. Validación obligatoria en formulario.

**VB12:** **MODIFICADO:** Cambio de tag mientras suena → nuevo vibe aplica la próxima vez que se cargue la canción, no en tiempo real.

**VB13:** Un track puede tener múltiples tags. Un único tag principal (obligatorio, dicta el vibe). Tags secundarios opcionales (solo para filtrar y buscar, sin efecto visual).

**VB14:** Las playlists tienen tag principal obligatorio. No afecta al vibe en Fase A (bloqueado hasta separación de colas).

**VB15:** Filtro por tag (pastillas) y búsqueda por texto conviven con lógica AND. **MODIFICADO:** en spec original las pastillas anulaban al buscador.

**VB16:** Vibe no se persiste. Se deriva en tiempo real del track activo.

**VB18:** **ANULADA.** Vibe no actualiza en tiempo real al editar tag mientras suena. Aplica la próxima vez que se cargue el track. Anulada por decisión de VB12.

**VB19:** Al volver al primer plano desde Android → vibe se restaura sin transición.

**VB20:** Fase B — Vibe fusionado y lógica de playlist sobre vibe — PENDIENTE SESIÓN DE DISEÑO DEDICADA.

---

## [C] Contexto de reproducción

**C1/EC-C1:** Búsqueda solo herramienta de visualización/selección. Play desde búsqueda = solo ese track, sin contexto posterior. Búsqueda + selección múltiple (Q13) = Fase B para crear listas.

**C2/C3:** **MODIFICADO para Fase A:** Playlists se reproducen íntegras desde botón principal. Sin iniciar desde canción específica interna — reproducción granular diferida a Fase B.

**C4:** **REESCRITA — modelo YouTube:** La playlist genera la cola base. Tracks añadidos manualmente se insertan directamente en esa cola activa, mezclándose. Usuario controla el orden con drag & drop.
- **C4-A:** "Reproducir a continuación" (inserta tras el track activo)
- **C4-B:** "Añadir a cola" (añade al final)
- **C4-C:** Drag & drop para reordenar

**C5:** Fin de cola → reproducción para, barra al 100%, track en pantalla en pausa, fade 1s hacia UI base (apaga vibe).

**EC-C2:** **REESCRITA — inyección dinámica:** Si la playlist origen sufre modificaciones mientras suena (otro usuario añade tracks), se inyectan en tiempo real en la cola activa, respetando orden original y conviviendo con modificaciones manuales.

**EC-C3:** **MODIFICADO:** Cola manual activa + usuario pulsa play en playlist → Bottom Sheet (panel inferior) con dos opciones: reemplazar contexto o añadir playlist al final. Bottom Sheet cierra con swipe down o tap en el fondo.

**EC-C4:** Contexto agotado con loop de lista → vuelve al track 1 de la playlist.

**EC-C5:** **ANULADA** por EC-C2. La inyección dinámica total reemplaza la restricción de "solo tracks después del punto actual".

> 🔖 C-M7: Búsqueda por texto en tracks y playlists — activada por botón en cabecera. Solo para visualizar y añadir, nunca fuente de reproducción. Prioridad alta Fase A.

---

## [P] Playback

**P1:** Motor automático — local cacheado preferido si disponible, R2 stream como fallback. Transparente al usuario. Indicador visual pequeño en track activo (local/stream).

**P2:** Fallback de red — reintento silencioso único (3s) → skip automático con toast → si no hay siguiente, neutral consciente con toast.

**P3:** Gapless por defecto en Fase A. Crossfade como opción configurable (0–8s, desactivado por defecto) en Fase B.

**EC-P1:** Red cae durante precarga → indicador visual en track siguiente mientras falla + reintento 3s → skip con toast.

**EC-P2:** **MODIFICADO:** Archivo local corrupto → toast + fallback R2 stream + campo `local_cache_status` en JSON de Drive (BD) visible para ambos usuarios.

**EC-P3:** **MODIFICADO:** Token OAuth expira → Opción A (refresh token silencioso en background, scope `offline_access`) + Opción B (Service Worker como red de seguridad), combinados. Sesión permanente hasta decisión del usuario. Coste cero.

**EC-P4:** Track sin archivo en R2 ni local → visible en lista con indicador de no disponible. Auto-skip con toast si llega en reproducción.

**EC-P5:** Duplicado en cola, mismo archivo → seek al inicio en lugar de recargar. Gapless garantizado.

> 🔖 P-M8: **CERRADO** — Precarga del siguiente track al llegar al 80% de duración, silenciosa, sin indicador visual salvo error de red (EC-P1). R2 resuelve el problema completamente (HTTP directo, sin OAuth, range requests nativo, dos requests simultáneos triviales). Fase A.

---

## [SH] Shuffle

**SH1:** Activar shuffle a mitad de contexto → aleatoriza los tracks restantes desde el siguiente. El track actual sigue sonando. Historial no se toca.

**SH2:** El botón anterior en shuffle → siempre el track anterior real que sonó. El historial es la verdad.

**SH3:** Desactivar shuffle → continúa desde el track actual en orden lineal hacia adelante.

**EC-S1:** Shuffle activo + track añadido a cola manual → cubierto por C4-A y C4-B (el usuario decide dónde va). Obsoleto como caso separado por C4.

**EC-S2:** Track eliminado de playlist con shuffle activo → se elimina de la lista aleatoria + toast informativo (regla global: toast siempre con eliminaciones).

**EC-S3:** **MODIFICADO:** Lista aleatoria agotada + loop → nueva lista completamente diferente a la anterior, sin repetir ninguna posición del orden completo (no solo el primer track).

**EC-S4:** Shuffle con un solo track en contexto → para al terminar. Neutral consciente. Si loop está activo, loop tiene preferencia.

**EC-S5:** **MODIFICADO:** Historial interno sin límite en `localStorage`. Visual: 5 tracks atenuados al hacer scroll arriba, con posibilidad de revelar más arrastrando hacia abajo.

---

## [L] Loop

**L1:** **MODIFICADO:** Loop de track absoluto. Los botones siguiente y anterior hacen seek al inicio del track actual, no salen de él. La única salida es reproducir otra canción explícitamente (tap en otra canción, selección nueva).

**L2:** Loop lista + último track eliminado mientras suena → al terminar, vuelve al nuevo último track de la lista.

**L3:** Loop lista con un solo track en contexto → se comporta idéntico a loop de track.

**L4:** Loop off + lista agotada → para. Neutral consciente. Sin reinicio automático.

> 🔖 EC-L5-M10: Comportamiento de loop durante crossfade activo — Fase B.

---

## [A] Android

**A1:** App killed por sistema OOM → restaura sesión completa (cola, posición, estado) como si nada. Reproducción pausada esperando al usuario. Kill voluntario → S1/S2 aplican.

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

**CAST1:** Protocolo Fase A: Google Cast. El audio viaja de R2 al TV directamente. El móvil actúa como mando.

**CAST2:** El TV recibe el visualizador completo (no solo audio). SVG/Canvas vectorial, escalable a 4K.

**CAST3:** Control por voz via Google Assistant en TV + controles táctiles desde mando del TV.

**CAST4:** Red cae durante Cast → app detecta, pausa, reintenta (P2), reanuda el Cast al recuperar red.

**CAST5:** Cast continúa aunque el móvil se bloquee o minimice la app.

**CAST6:** Kill de Android → Cast para. Al reabrir, usuario reinicia manualmente.

> 🔖 CAST-M11-FULL: Cast es una feature con entidad propia. Requiere Cast SDK + receiver app. Prioridad post-estabilización.
> 🔖 CAST-M11-DLNA: Soporte DLNA/universal — Fase C.

---

## [UX] UX Expectations

**UX1:** Seek → barra de progreso táctil + doble tap izquierda/derecha para saltar 10 segundos.

**UX2:** Feedback háptico leve en acciones clave: play/pause, skip, añadir a cola. Universal via `navigator.vibrate`.

**UX3:** Estado de carga de un track → el botón de play se convierte en spinner hasta que el audio arranca.

**UX4:** Error de carga → artwork del track se tiñe brevemente en rojo antes del skip automático.

**UX5:** Gestos sobre el reproductor → swipe horizontal = cambiar track, swipe vertical = abrir cola.

**UX6:** Modo visualizador a pantalla completa → activado por tap en el reproductor. Muestra barras de espectro, disco giratorio, osciloscopio, partículas reactivas, VU meters, fondo plasma/humo. No artwork.

**UX7:** Volumen auriculares sincronizado con masterVolume interno (M10).

**UX8:** Orientación landscape → forzar portrait siempre.

**UX9:** **MODIFICADO:** Buscador activado por botón en cabecera de cada pestaña o popup donde haya lista, junto a acciones de añadir, editar y eliminar. Sin pull down. Prioridad alta. Aplica a TRACKS, LISTS, cola y cualquier lista futura.

**UX10:** Modos de representación visual de listas: Lista (compacta), Grid (portadas), Tarjeta (expandida). Toggle en cabecera. Preferencia persistente por usuario en `localStorage`. Aplica a TRACKS y LISTS.
> 🔖 UI-M25: Pendiente sesión de diseño visual para iconografía del toggle. Fase A.

**UX11:** Sistema de interacción con track en lista → Tap = reproducir. Iconos directos para acciones frecuentes. Tres puntos para acciones ocasionales.
> 🔖 TRACKS-M23: Decisión pendiente de testing de estabilización. Validar qué acciones son realmente frecuentes con uso real.

### Visualizador

**VIZ1:** Fase A — Lockscreen: último frame estático del visualizador con controles MediaSession encima.
> 🔖 VIZ-M12: Fase B — live wallpaper animado completo en lockscreen.

**VIZ2:** Presets de visualizador por vibe. Cada vibe tiene su propio estilo visual. No configurable manualmente por el usuario.
> 🔖 VIZ-M13: Pendiente definir los presets visuales al diseñar las paletas de vibe.

**VIZ3:** Activación → tap en el reproductor. También se activa automáticamente tras inactividad táctil (modo salvapantallas).
> 🔖 VIZ-M14: **Fase B.** Timeout configurable por el usuario, sin valor por defecto fijo.

**VIZ4:** Reactividad de audio → Web Audio API + AnalyserNode sobre R2 stream. Procedural/BPM para Cast (el audio no pasa por el móvil en Cast).

**VIZ5:** Visualizador en TV → vectorial, reactividad procedural, colores del vibe activo. Sin track activo: color base oscuro (VB8).
> 🔖 VIZ-M16: Screensaver idle TV con logo — Fase B.

**VIZ6:** Entrada del primer vibe de la sesión → animación más elaborada. Emerge desde negro. Fase C.
> 🔖 VIZ-M15: Pendiente sesión de diseño dedicada. Fase C.

> 🔖 YT-M5 BLOQUEANTE: La eliminación completa del motor YouTube es prerequisito para considerar el reproductor estabilizado. Sin ella: sin visualizador reactivo real, sin gapless garantizado, sin Cast limpio, sin estadísticas precisas, sin control total de MediaSession.

---

## [T] Transiciones entre contextos

**T1:** El único disparador de cambio de vibe es un cambio de track activo. No existe acción manual del usuario sobre el vibe en Fase A.

**T2:** Navegación entre páginas durante reproducción → reproducción continúa sin interrupción. Mini-player persiste en todas las vistas como capa permanente.

**T3:** Transición de página → el contenido hace slide. El reproductor/mini-player permanece anclado.

**T4:** Timing de transición de vibe → arranca a los 2s del nuevo track (VB5 consistente). Universal y estricto.

**T5:** Transición de vibe interrumpida por nuevo track → la anterior se cancela, arranca la nueva desde el estado visual actual.

**T6:** Transición al estado neutral (reproductor para) → fade de 1s al color base oscuro.

**T7:** Primer track de la sesión → animación de entrada más elaborada. Emerge desde negro (VIZ6). Fase C.

**T8:** Cambio de track sin cambio de vibe (mismo tag) → pulso sutil de intensidad en el vibe activo.

**T9:** Track sin tag (datos legacy) → se reproduce con color base oscuro (VB8). No puede ocurrir en tracks nuevos (VB3/VB17).

**T10:** Vibe durante carga del siguiente track → mantiene el vibe del track anterior durante la carga.

**T11:** **ANULADA.** Delay de 2s universal (VB5). No hay excepción para el botón anterior.

---

## Registro de Placeholders y Decisiones Pendientes — Estado Post-Auditoría

| ID | Descripción | Estado |
|---|---|---|
| Q4-M1 | Inserción posicional cola→playlist | **CERRADO** — inserción exacta en posición actual |
| Q13-M2 | Selección múltiple de tracks | FEATURE DIFERIDA — Fase B |
| VB10-M3 | Contraste texto/iconos | DECISIÓN MÓVIL — replantear tras test en dispositivo |
| VB20-M4 | Fase B vibe fusionado + lógica PL | PENDIENTE SESIÓN DISEÑO — Fase B |
| YT-M5 | YouTube streaming = PLACEHOLDER LEGACY | **BLOQUEANTE** para estabilización |
| TR1-M6 | Duración transición de vibe 1s | PROVISIONAL — validar en dispositivo |
| P-M8 | Precarga del siguiente track | **CERRADO** — 80% duración, silenciosa, R2. Fase A |
| STAT-M9 | Sistema de estadísticas de escucha | PRIORIDAD ALTA — Fase A, post-bugs |
| EC-L5-M10 | Loop durante crossfade | FASE B |
| CAST-M11-FULL | Cast SDK completo + receiver | POST-ESTABILIZACIÓN |
| CAST-M11-DLNA | DLNA/universal | FASE C |
| VIZ-M12 | Live wallpaper lockscreen | FASE B |
| VIZ-M13 | Presets visualizador por vibe | PENDIENTE al diseñar paletas |
| VIZ-M14 | Timeout salvapantallas | **CERRADO** — configurable por usuario. Fase B |
| VIZ-M15 | Animación entrada primer vibe | PENDIENTE DISEÑO — Fase C |
| VIZ-M16 | Screensaver idle TV | FASE B |
| SC-M17 | Sincronización estricta de posición compartida | **CERRADO** — Fase A (prompt de arranque tiene preferencia) |
| SC-M18 | Arquitectura completa escucha compartida | **CERRADO** — Fase A |
| SC-M19 | UI de presencia mutua (corazón) | **CERRADO** — ver bloque SC. Animaciones avanzadas Fase C |
| DROP-M20 | Botón drop en reproductor | Bug conocido (abre en navegador nativo). Auditoría UI y fix en Fase B |
| DROP-M21 | Snapshot de metadatos en favoritos de drops | PENDIENTE IMPLEMENTAR — Fase B |
| AUDIO-M22 | Soporte FLAC + evaluación OPUS | FASE C |
| TRACKS-M23 | Sistema de interacción track en lista | PENDIENTE POST-TESTING |
| UI-M24 | Buscador en listas | **CERRADO** — botón en cabecera, Fase A, prioridad alta |
| UI-M25 | Iconografía toggle modos de vista | PENDIENTE SESIÓN DE DISEÑO VISUAL — Fase A |

---

## Prompt de arranque — Siguiente sesión

```
Eres arquitecto de producto/UX/sistemas de "el_bunker", PWA privada
Android para Edu y David. Estética cyber-vandal/Winamp.

Terminología fija: R2 = archivos MP3. Drive = solo el JSON de BD. Sin excepciones.
Motor final: R2 stream MP3 + local descargado de R2. YouTube = PLACEHOLDER
LEGACY BLOQUEANTE para estabilización, objetivo eliminarlo.

FASE 1 completada con auditoría. Carga el documento
el_bunker_reproductor_spec_v2.md adjunto como fuente de verdad.

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
1. `el_bunker_reproductor_spec_v2.md` (este documento)
2. `architecture.md`
3. `state-map.md`
4. `technical-debt.md`
5. `data-flow.md`
6. `ownership-map.md`
7. `rendering-flow.md`
8. `event-lifecycle.md`
