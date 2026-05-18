# SESIÓN REGISTRO — el_bunker

---

## ESTADO ACTUAL (18 Mayo 2026 — fin de sesión 6)

## ESTADO ACTUAL (18 Mayo 2026 — sesión 7 en curso)

- **APP EN PRODUCCIÓN.** Deploy completado y verificado en Android.
- PWA instalada correctamente en Android de Edu y David(modo standalone, sin barra de Chrome).
- Login funcionando en producción con las 3 cuentas.
- MusicLab operativo tras PLIEGO-014 (toast ReferenceError resuelto).
- Testing activo con Edu. Checklist ejecutado parcialmente — ver resultados abajo.
- Funcionalidad real estimada en ~5-10% (Vault sin fotos = solo navegación de eras; MusicLab sin música cargada; Smoke sin persistencia completa).
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

**Bug B — Sin persistencia OAuth2 entre recargas** ← PRIORIDAD 5
Confirmado en testing sesión 7. Pide permisos de Google en cada recarga. Primera opción: silent refresh con `prompt: ''` en GoogleDriveService.js. Archivo crítico → qwen3-14b-think + revisión cruzada.

**BUG-POST-02 — Corner brackets en LoginScreen.jsx** ← PRIORIDAD 3
Confirmado en testing. AccessButton tiene implementación propia con `<span>` y bordes CSS, nunca tocada por PLIEGO-007. Pliego simple, qwen3-8b-nothink.

**BUG-NUEVO-02 — Frases duplicadas en LoginScreen** ← NUEVO
Detectado en testing sesión 7. Texto duplicado visible en pantalla de login. Sin análisis aún. Podría ser render doble por AnimatePresence mal configurado (relacionado con Bug A).

**BUG-NUEVO-03 — Header muestra "v1.0", "Online" y fecha con salto de línea** ← NUEVO, COSMÉTICO
Texto "v1.0" y "Online" innecesarios. "El bunker" y "18 de mayo" aparecen en líneas separadas. Fix CSS/JSX en Layout.jsx o componente de header.

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

**PLIEGO-015** — Diagnóstico + fix persistencia de tracks/drops en MusicLab (BUG-CRÍTICO-02)
Pendiente de datos de Network tab (filtrar drive/v3 al guardar track). No generar hasta confirmar si el 403 de heartbeat es la causa raíz o hay otra ruta de escritura fallando.

**PLIEGO-016** — Diagnóstico + fix reproducción de audio 0:00-0:00 (BUG-CRÍTICO-03)
Pendiente de error de consola al intentar reproducir. Probable en la lógica de extracción de videoId o inicialización del player.

**PLIEGO-017** — Silent refresh OAuth2 (Bug B)
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

## PRÓXIMO PASO

1. **Diagnóstico BUG-CRÍTICO-02 (persistencia MusicLab)** — Abrir DevTools → Network tab → filtrar `drive/v3` → añadir un track → capturar si hay 403/404/sin llamada al guardar. Sin estos datos no se genera Pliego.
2. **Diagnóstico BUG-CRÍTICO-03 (audio 0:00-0:00)** — Abrir DevTools → Console → intentar reproducir → capturar error exacto.
3. Instalar PWA en Android de David + ejecutar checklist completo.
4. PLIEGO-017 (OAuth2 persistencia) — puede estar relacionado con BUG-CRÍTICO-02, priorizar después de confirmar causa raíz de persistencia.
5. **Diagnóstico BUG-CRÍTICO-01 (+ Era en Vault)** — DevTools → Console → pulsar "+ Era" → error exacto → PLIEGO-019.
6. PLIEGO-020 (corner brackets LoginScreen) — quick win, hacer en paralelo cuando haya pausa.

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
