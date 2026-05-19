# SESIÓN REGISTRO — el_bunker

---

## ESTADO ACTUAL (19 Mayo 2026 — sesión 11 terminada al 90%.)

- **APP EN PRODUCCIÓN.** Deploy activo en https://el-bunker-beige.vercel.app
- Botón EXIT de cierre de sesión añadido al header (StatusBar) — rojo apagado, junto al ↺.
- `logout` conectado desde VaultContext a Layout vía App.jsx — cierra sesión sin recargar.
- Commits realizados en la sesión:
    "PLIEGO-026: feat(layout): botón EXIT en StatusBar"
    "PLIEGO-027: feat(app): conectar logout al botón EXIT"
---

## INFRAESTRUCTURA COMPLETADA

- [x] Google Cloud Console configurado — 3 usuarios de prueba, scopes correctos.
- [x] Proyecto en Vercel configurado y conectado a GitHub.
- [x] VITE_GOOGLE_CLIENT_ID y VITE_GOOGLE_SHARED_FOLDER_ID en variables de entorno Vercel.
- [x] URL de producción añadida a orígenes autorizados en Google Cloud Console.
- [x] Deploy completado — https://el-bunker-beige.vercel.app
- [x] PWA instalada en Android de Edu.
- [x] PWA instalada en Android de David — pendiente.

---

## RESULTADOS DE TESTING — SESIÓN 7 (Edu, Android, Chrome PWA)

### MÓDULO 0 — INSTALACIÓN PWA ✅
- Banner instalación: ✅ | Icono independiente: ✅ | Modo standalone: ✅ | Offline básico: ✅

### MÓDULO 1 — LOGIN ⚠️
- Pantalla login: ✅ | Popup Google: ✅ | Entrada sin error: ✅
- ❌ Nombre/email de usuario no visible en UI después del login (no hay indicador de cuenta activa)
- ❌ BUG B CONFIRMADO: pide permisos Google en cada recarga (sin persistencia OAuth2)
- Corner brackets visibles en LoginScreen ✅ (BUG-POST-02 confirmado)
- Frases duplicadas en LoginScreen (nuevo bug, no documentado)

### MÓDULO 2 — VAULT ⚠️
- Carrusel de eras visible y navegable: ✅
- ❌ Botón "+ Era" no funciona (no hace nada al pulsar) — bug crítico, Vault inoperativo
- Compartición entre usuarios: sin verificar (sin datos reales para probar)
- Edición de memorias: sin verificar
- Botón "↓ BACKUP JSON": ✅ visible con cuenta admin
- Corner brackets: ❌ NO aparecen en Vault (BUG-POST-01 puede estar ya resuelto o nunca presente en este build)
- Corner brackets SÍ aparecen en Login y SmokeSession

### MÓDULO 3 — MUSICLAB ⚠️ (abre, pero múltiples bugs funcionales)
- Pantalla en blanco: ✅ RESUELTO con PLIEGO-014
- Reproducción de audio: ❌ Canción muestra 0:00-0:00, no reproduce
- Drop: ❌ David no recibe el drop lanzado por Edu
- Tracks compartidos: ❌ David no ve el track añadido por Edu
- Persistencia: ❌ CONFIRMADO — Edu pierde el track añadido y el drop al recargar. Segunda prueba confirma. Los cambios no se guardan en Drive al recargar.
- Textos: ❌ Mezclados inglés/español (ej. "add track" en inglés, "lanzar drop" en español). Además despersonalizados — los textos no reflejan el tono de Edu hacia David, suenan genéricos.

### MÓDULO 4 — SMOKE SESSION ⚠️
- Abre sin error: ✅
- Crear sesión custom: ✅ (UI funciona)
- ❌ Guardado de sesión: no confirmado aún
- ❌ Historial de sesiones: sin verificar (pendiente de MusicLab para contexto completo)
- ❌ Volumen master: no funciona, estático al 80%
- Corner brackets visibles: ✅ confirmado

### MÓDULO 5 — GENERAL ✅ / ⚠️
- Navegación entre secciones: ✅ | Táctiles Android: ✅ | Animaciones fluidas: ✅
- ❌ Si recarga o cierra → pierde sesión (Bug B)
- Conserva sesión sin recargar: ✅

### NOTAS DE EL TESTING
- Header de la app muestra "v1.0", "Online" y "El bunker / 18 de mayo" con salto de línea — cosmético, debe corregirse
- Sin fotos en Vault, el módulo es solo un carrusel de colores — funcionalidad real bloqueada por "+ Era" roto
- Smoke Session bonita pero sin utilidad real sin MusicLab integrado
- MusicLab fue la mayor inversión de Pliegos → retorno bloqueado por bug de 1 línea (useState)

---

## BUGS RESUELTOS EN SESIÓN 6

- **Build error MusicLab.jsx** — Fragment `<>` sin cerrar en TrackCard (línea 637). Corregido añadiendo `</>` antes del cierre del return.
- **Build error MusicLab.jsx** — `</>` huérfano en WinampPlayer (línea 568). Corregido cambiando a `</motion.div>`.
- **Build error GoogleDriveService.js** — Separador Markdown `---` en línea 511 dentro del código JS. Eliminado.
- **Iconos PWA inexistentes** — Carpeta `public/icons/` no existía. Generados 5 iconos con estética Fallout/terminal y desplegados.
- **Git email bloqueado en Vercel** — Commits con `thebunker.admin@gmail.com` bloqueados por Vercel. Resuelto cambiando git config global a `bansovi.py@gmail.com`.
- **Vercel no actualizaba** — Trigger automático roto tras commits bloqueados. Resuelto reconectando el repo en Settings → Git.

---

## BUGS ACTIVOS (por orden de prioridad)

**BUG-CRÍTICO-01 — Botón "+ Era" en Vault no hace nada** ← NUEVO, PRIORIDAD 1
Confirmado en testing sesión 7. Al pulsar el botón de añadir Era, no ocurre nada. Sin datos de consola aún. Vault es inoperativo sin este botón. Requiere diagnóstico con DevTools antes de Pliego.

**BUG-CRÍTICO-02 — Tracks y drops no persisten entre recargas (MusicLab)** ← PRIORIDAD 2
Confirmado en testing sesión 7, dos pruebas consecutivas. Edu añade un track y lanza un drop → al recargar, desaparecen. La escritura en Drive está fallando silenciosamente (ver ERROR 15 — 403 en heartbeat). Probable causa: el token OAuth no tiene permisos de escritura efectivos, o saveQueue/la lógica de guardado no se llama en el momento correcto. Requiere datos de Network tab (filtrar por drive/v3) al guardar un track.

**BUG-CRÍTICO-03 — Reproducción de audio no funciona (0:00-0:00)** ← PRIORIDAD 3
Canción añadida muestra duración 0:00-0:00 y no reproduce. Causa probable: el player no está inicializando el source de YouTube correctamente, o el videoId no se está extrayendo bien del track. Requiere consola al intentar reproducir.

**BUG-CRÍTICO-04 — Drops y tracks no se comparten entre usuarios** ← PRIORIDAD 4
David no recibe el drop lanzado por Edu. David no ve el track añadido por Edu. Probable causa: la DB no se está escribiendo (relacionado con BUG-CRÍTICO-02), o la lectura de la DB por parte de David no está sincronizada. Bloqueado por BUG-CRÍTICO-02 — si se resuelve la persistencia, este puede resolverse solo.

**BUG-NUEVO-05 — Textos de MusicLab mezclados en inglés/español y despersonalizados** ← PRIORIDAD BAJA
Textos como "add track" en inglés y "lanzar drop" en español conviven en la misma UI. Además, el tono es genérico — los textos deberían reflejar el lenguaje que Edu usaría hacia David. Requiere un Pliego de revisión completa de strings en MusicLab.jsx. Sin urgencia funcional pero impacta directamente en la identidad del proyecto.

**Bug B — Sin persistencia OAuth2 entre recargas** ✅ RESUELTO — sesión 10
Se corrigió usando un guardado explícito del Token y la fecha de expiración en `localStorage`, restaurándolo de forma silenciosa en el arranque (`restoreToken`) desde el `VaultContext`.

**BUG-POST-02 — Corner brackets en LoginScreen.jsx** ← PRIORIDAD 3
Confirmado en testing. AccessButton tiene implementación propia con `<span>` y bordes CSS, nunca tocada por PLIEGO-007. Pliego simple, qwen3-8b-nothink.

**BUG-NUEVO-02 — Frases duplicadas en LoginScreen** ← NUEVO
Detectado en testing sesión 7. Texto duplicado visible en pantalla de login. Sin análisis aún. Podría ser render doble por AnimatePresence mal configurado (relacionado con Bug A).

**BUG-NUEVO-03 — Header muestra "v1.0", "Online" y fecha con salto de línea** ✅ RESUELTO — sesión 10
Strings eliminados. Layout reparado en Flex añadiendo un botón "↺" de re-render al final del componente `Layout.jsx`.

**BUG-NUEVO-04 — Volumen master en SmokeSession estático al 80%**
El control de volumen master no funciona. Confirmado en testing sesión 7.

**BUG-POST-01 — CornerBrackets en Vault** ← POSIBLEMENTE RESUELTO
Testing sesión 7: corner brackets NO aparecen en Vault. Sí aparecen en Login y SmokeSession. Verificar en disco antes de generar Pliego — puede que PLIEGO-007 ya esté aplicado correctamente.

**BUG-POST-03 — Botón backup no visible** ← RESUELTO
Confirmado en testing sesión 7: el botón "↓ BACKUP JSON" SÍ aparece con cuenta admin. Bug cerrado.

**Bug A — LoginScreen AnimatePresence** — pendiente de correlacionar con BUG-NUEVO-02 (frases duplicadas).

---

## COLA DE PLIEGOS

**PLIEGO-014** — fix(musiclab): declare toast state — ReferenceError causing blank screen ✅ APLICADO
Archivo: src/MusicLab.jsx. Una línea: `const [toast, setToast] = useState(null);` después de pendingTrack.

**PLIEGO-015b** ✅ — fix(sw): bypass YouTube domains — APLICADO
**PLIEGO-015c** ✅ — feat(drive): uploadMusicFile + schema 3.3.0 — APLICADO Y VERIFICADO

**PLIEGO-016b** — feat(drive): getStreamUrl para reproducción de MP3 desde Drive con <audio> nativo. Prerequisito de PLIEGO-017b. Modelo: qwen3-14b-think.

**PLIEGO-016c** — CANCELADO. Absorbido por rediseño completo de MusicLab UI (ver REDISEÑO-MUSICLAB-001 abajo).

---

## REDISEÑO-MUSICLAB-001 — Restructura completa de UI/UX de MusicLab
**Estado:** Pendiente de decisión de diseño antes de descomponer en Pliegos.
**Archivos afectados:** src/MusicLab.jsx (principal), src/GoogleDriveService.js (schema drops favoritos)

### PESTAÑAS POST-REDISEÑO
Orden y visibilidad:
1. **Cola** — nueva. Invisible si vacía. Primera si tiene tracks. Botones: + Añadir a cola, Editar (reordenar y eliminar tracks de la cola).
2. **Tracks** — existente. Siempre visible. Botones: + Añadir, Editar, Eliminar.
3. **Lists** — existente (antes "Lists/Playlists"). Siempre visible. Botones: + Añadir, Editar, Eliminar.
4. **Drops** — existente pero rediseñado. Invisible si vacía Y sin favoritos. Última si tiene drops sin entregar o favoritos. Incluye drops enviados y recibidos marcados como favoritos. Botones: marcar/desmarcar favorito por drop.

### DROPS — CAMBIOS DE SCHEMA
Requiere migración 3.3.0 → 3.4.0:
- Añadir campo `favorited: boolean` a cada drop (default: false)
- Añadir campo `favorited_by: userId | null` (quién lo marcó)
- La pestaña Drops muestra: drops pendientes de entrega + drops favoritos (enviados o recibidos)

### BOTONES DE ACCIÓN
Tracks:
- `+ AÑADIR` — abre AddTrackForm (existente, pendiente de rediseño en PLIEGO-017b)
- `EDITAR` — edita el track seleccionado/activo. Abre mismo formulario de AddTrackForm con datos precargados.
- `ELIMINAR` — elimina el track seleccionado/activo de la DB permanentemente.

Lists:
- `+ AÑADIR` — crea nueva playlist (lógica existente, mover botón)
- `EDITAR` — edita nombre/descripción de la playlist seleccionada
- `ELIMINAR` — elimina playlist (lógica existente: solo creador, solo si vacía)

Cola:
- `+ AÑADIR A COLA` — añade track seleccionado a la cola del usuario
- `EDITAR` — modo reordenación drag-and-drop + botón eliminar por track dentro de la cola

### MENÚ CONTEXTUAL (long press) — ELIMINADO
El menú contextual de long press en TrackCard se elimina. Era incómodo en Android (selecciona texto, difícil de activar con títulos largos). Toda la funcionalidad migra a botones explícitos en la UI de cada pestaña.

### DECISIÓN PENDIENTE ANTES DE PLIEGOS
**¿Los botones Editar/Eliminar actúan sobre el item actualmente seleccionado/activo, o cada card tiene sus propios botones inline?**

Impacto:
- Item seleccionado global → botones en header de pestaña, menos JSX, UX más limpia en móvil
- Botones inline por card → más clics, más JSX, pero más explícito y sin ambigüedad de "qué estoy editando"

Recomendación del arquitecto: **item seleccionado global** para Tracks y Lists (ya hay concepto de track activo). Para Cola, botones inline por track (la cola es una lista de acciones, no tiene concepto de "seleccionado").

Sin esta decisión no se generan Pliegos de rediseño.

**PLIEGO-017b** — feat(musiclab): reescribir AddTrackForm (selector MP3, autorellenar desde YouTube, portada automática ytimg + opción cambiar por imagen de dispositivo o galería de Vault) + WinampPlayer (detectar type: drive vs youtube, reproducir desde Drive stream URL o iframe YouTube). Modelo: qwen3-14b-nothink. BLOQUEADO hasta REDISEÑO-MUSICLAB-001 resuelto.

**PLIEGO-017c** — Silent refresh OAuth2 (Bug B). Modelo: qwen3-14b-think. Archivo crítico.
Archivo: src/GoogleDriveService.js. `prompt: ''` en el callback de tokenClient. Modelo: qwen3-14b-think. Desbloquear después de BUG-CRÍTICO-02 (pueden estar relacionados).

**PLIEGO-018** — Revisión y personalización de strings en MusicLab (BUG-NUEVO-05)
Archivo: src/MusicLab.jsx. Todos los textos de UI al español, tono personal Edu→David. Modelo: qwen3-8b-nothink. Sin urgencia funcional — hacer después de estabilizar bugs críticos.

**PLIEGO-019** — Diagnóstico + fix botón "+ Era" en Vault (BUG-CRÍTICO-01)
Pendiente de datos de consola. No generar hasta tener el error exacto.

**PLIEGO-020** — Eliminar corner brackets de LoginScreen (BUG-POST-02)
Archivo: src/LoginScreen.jsx. Modelo: qwen3-8b-nothink.

**PLIEGO-PLAYLIST-C** — Borrado de playlists (solo creador, solo si está vacía). Post-estabilización.

---

## DEUDA TÉCNICA ACTIVA

- `ACID` y `PURPLE` definidos localmente en Vault.jsx — migrar al próximo Pliego que toque Vault.jsx.
- `PLIEGO-004` (onMarkDropSeen) pendiente de verificar en runtime con un drop real.
- patchDb race condition: documentada (INSIGHT 6), post-deploy si hay pérdidas reales.
- manifest.json tiene encoding roto (BÃºnker, BÃšNKER) — arreglar en próxima sesión.

---

## BUGS RESUELTOS EN SESIÓN 8

- **PLIEGO-015b** — SW bypass YouTube: añadidos youtube.com, ytimg.com, googlevideo.com a BYPASS_PATTERNS. El SW ya no intercepta peticiones del player.
- **PLIEGO-015c** — uploadMusicFile + schema 3.3.0: nueva función de subida de MP3 a Drive vía fetch+FormData. Migración automática de tracks existentes a type/drive_file_id/youtube_url. CONFIG.SCHEMA_VERSION actualizado. Verificado en producción con backup JSON.

---

## PRÓXIMO PASO

1. **Diagnóstico BUG-CRÍTICO-02 (persistencia MusicLab)** — Abrir DevTools → Network tab → filtrar `drive/v3` → añadir un track → capturar si hay 403/404/sin llamada al guardar. Sin estos datos no se genera Pliego.
2. **Diagnóstico BUG-CRÍTICO-03 (audio 0:00-0:00)** — Abrir DevTools → Console → intentar reproducir → capturar error exacto.
3. Instalar PWA en Android de David + ejecutar checklist completo.
4. PLIEGO-017 (OAuth2 persistencia) — puede estar relacionado con BUG-CRÍTICO-02, priorizar después de confirmar causa raíz de persistencia.
5. **Diagnóstico BUG-CRÍTICO-01 (+ Era en Vault)** — DevTools → Console → pulsar "+ Era" → error exacto → PLIEGO-019.
6. PLIEGO-020 (corner brackets LoginScreen) — quick win, hacer en paralelo cuando haya pausa.

---

## ESTADO ACTUAL (19 Mayo 2026 — sesión 10 terminada.)

- **APP EN PRODUCCIÓN.** Deploy completado y verificado en Android.
- Reproductor de música estabilizado con comportamientos corregidos (WinampPlayer: skip/shuffle/loop ok).
- Persistencia silenciosa de OAuth2 conseguida; el login no se pierde al recargar gracias al `localStorage`.
- Bloqueos críticos de login causados por la validación del sistema de Drops reparados.
- Funciones extra de UI nativa consolidadas con CSS y Layouts purificados (sin selección de texto web, pull-to-refresh desactivado y con recargas forzables desde header).

### PLIEGOS EJECUTADOS EN SESIÓN 10
- PLIEGO-020 ✅ — fix drop: campo to, from real y filtro por destinatario (ERROR 32/31)
- PLIEGO-021 ✅ — fix skip stale closure con useCallback + MediaSession deps (ERROR 27/28)
- PLIEGO-022 ✅ — persistencia OAuth2: recuperar token boot/localStorage (Bug B)
- PLIEGO-023 ✅ — fix modales mutuamente excluyentes (ERROR 24)
- PLIEGO-024 ✅ — feat: onEditTrack y onDeleteTrack en App.jsx (ERROR 25)
- PLIEGO-025a/b ✅ — CSS global overscroll/select y limpieza del Header + botón reload

### PLIEGOS EJECUTADOS EN SESIÓN 11
- PLIEGO-026 ✅ — feat(layout): botón EXIT en StatusBar
- PLIEGO-027 ✅ — feat(app): conectar logout al botón EXIT

### TESTING SESIÓN 10 — BUGS ACTIVOS / PENDIENTES
- ERROR 29 — Play en drop lleva a MusicLab en lugar de reproducir inline
- ERROR 30 — Drops no se limpian tras ser recibidos (limpieza de drops en cache local)
- ERROR 33 — Drops solo se detectan al entrar a MusicLab (detección global del Drop entrante)
- ERROR 34 — Color de vibe en TrackCard solo activo en track que suena
- BUG-CRÍTICO-01 — Módulo Vault

### TESTING SESIÓN 11 — BUGS ACTIVOS / PENDIENTES
- Sin nuevos bugs introducidos en sesión 11.

### CONFIRMACIONES DE SESIÓN 10
- Rama git confirmada: master (no main).
- Se revierte la eliminación del long-press en TrackCard; se mantiene usando `user-select: none` global para mitigar problemas nativos de Android.
- El sistema de Drops ya es plenamente seguro y funcional entre usuarios sin provocar bloqueos de renderizado en el login screen.

### PRÓXIMA SESIÓN (12)
Objetivo: Favoritos en drops + limpieza post-recepción + play inline en drop.
1. Favoritos en drops — marcar/desmarcar para guardar un drop (schema 3.3.0→3.4.0 + UI)
2. ERROR 30 — limpiar drops no favoritos tras ser recibidos
3. ERROR 29 — play inline en drop (sin navegar a MusicLab)
4. ERROR 33 — detección global de drops entrantes (mover fuera de MusicLab)
5. ERROR 34 — color de vibe en TrackCard
6. BUG-CRÍTICO-01 — botón "+ Era" en Vault
---

## FEATURES CONFIRMADAS (orden de implementación)

### Fase 3 — Pre-deploy ✅ COMPLETADA
- [x] Exportación manual de DB como JSON descargable
- [x] Cola de reproducción por usuario
- [x] Playlists desde canción
- [x] MediaSession API — básico + WakeLock
- [x] Deploy en Vercel
- [x] PWA instalable en Android

### MusicLab (post-deploy)
- [ ] A · Tags predefinidos (DNB, 420 Chill, Lofi, Rap, Ambient, Reggaeton)
- [ ] B · Cola de reproducción visible en UI (badge de tracks nuevos)
- [ ] C · Historial de escucha (quién, cuándo, contador de reproducciones)
- [ ] D · Modo shuffle por tag
- [ ] E · Notas por track
- [ ] F · Tags de música con color personalizado
- [ ] G · Normalización de volumen entre tracks
- [ ] H · Crossfade configurable entre tracks
- [ ] I · Sleep timer
- [ ] J · Gapless playback
- [ ] K · Contador con fecha de primer play
- [ ] L · "La canción de esta era" — conecta MusicLab con Vault
- [ ] M · Modo Party / Pantalla compartida con visualizador
- [ ] N · Thumbnail manual
- [ ] Borrado de Playlist (Pliego C)
