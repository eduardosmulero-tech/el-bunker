# CHANGELOG — El Búnker

> Registro público de cambios. Una línea por versión.
> Para detalles técnicos completos: docs/sesiones/

---

## v2.0.0 — "Roadmap Completo" (Junio 2026)

### 🆕 NUEVO

**CAPSULES** — Nueva pestaña con 4 experiencias temporales:
- **Timeline** — Feed cronológico de eventos (reproducciones, drops, entradas)
- **Smoke Session** — Sesión especial de escucha (ya existente, reubicada)
- **Time Capsules** — Cápsulas de tiempo: crea, sella y desbloquea
- **RECAP** — Resúmenes semanales/mensuales/anuales con stats

**VAULT expandido:**
- **AddEntryForm** — Formulario polimórfico (nota, foto, hito, carta) con tags y destinatario
- **VaultGallery 6 modos:** WALL (masonry), CINEMA (swipe), DIALOGUE (perspectiva dual), EXHIBITION (por Era), REEL (secuencias), MAP (próximamente)

**Layout rediseñado:**
- 3 tabs definitivos: VAULT · MUSIC LAB · CAPSULES
- Navegación simplificada, sin Timeline independiente

**MusicLab mejorado:**
- MediaSession API: control desde notificaciones Android y lock screen
- Vibración táctil en controles de reproducción
- Base para escucha compartida (próximamente)

### 🔧 INFRAESTRUCTURA (interna)

- **Cloudflare D1:** Base de datos SQL con 16 tablas (tracks, playlists, entries, events, time_capsules...)
- **Cloudflare Workers:** API REST con 18 endpoints + JWT auth (HMAC-SHA256)
- **Cloudflare R2:** Streaming de audio con byte-range requests (sin límites de Drive)
- **StatsEngine:** Motor de eventos append-only (track plays, drops, sesiones...)
- **FileUploadService:** Subida de archivos a R2 con pre-signed URLs

### 🐛 CORREGIDO

- **Doble animación:** Arreglado flicker al cambiar de pestaña (AnimatePresence duplicado)
- **Colores de tags:** Los botones de tags ahora muestran su color correcto
- **Props muertos:** Eliminadas variables e imports sin usar en 9 archivos
- **Time Capsules:** Ahora conectan a la API real (ya no solo console.log)
- **Worker API:** Añadidos endpoints CRUD para cápsulas de tiempo
- **Linting:** ESLint configurado para permitir prefijo `_` en variables no usadas

### ⚠️ PENDIENTE (próxima actualización)

- Migración completa de datos de Google Drive → D1 (parcial en S59)
- VaultContext → Worker API (fetchDb real, S64)
- Sin tests automatizados (TD-5)

### ✅ COMPLETADO (desde v2.0.0)

- ✅ **S59:** JWT wiring frontend — VaultContext obtiene JWT real del Worker API
- ✅ **S60:** Fix imports — 8 MusicLab files migrados de Layout a tokens
- ✅ **S61:** jwtToken threading — propagado a Vault → VaultGallery + MusicLab
- ✅ **S62:** Worker CRUD entries — 5 endpoints con tags+files, validación 404
- ✅ **S63:** Worker CRUD eras — 5 endpoints + files GET con filtros
- ✅ **S58:** Capsules conectadas a Worker API (events, time_capsules reales, no más placeholders)
- ✅ **S58:** StatsEngine wired — trackPlay/Pause/Skip, dropSent, entryCreated
- ✅ **S58:** FileUploadService — subida real de fotos a R2 en AddEntryForm
- ✅ **S58:** Time Capsules con endpoint real en Worker + PATCH unlock

---

## v1.0.0 — "Fase 0" (Mayo 2026)

- 3 tabs: VAULT · MUSIC LAB · TIMELINE
- Reproductor con cola unificada (manual + contexto)
- Loop mode (off/list/track) + shuffle pre-generado
- Historial de reproducción persistente (localStorage)
- WakeLock para reproducción en segundo plano
- Drops (envío de canciones entre usuarios)
- Playlists y tags personalizables
- Google Drive como almacenamiento (JSON + streaming)
- PWA instalable en Android
