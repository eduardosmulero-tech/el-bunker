# PROMPT MAESTRO — El Búnker
> **Objetivo:** Completar el roadmap de desarrollo de El Búnker (Fases 1-6).
> **Para:** Inyectar en Codebuff u otra IA. Autocontenido — todo el contexto necesario.
> **Branch:** `roadmap-completo`
> **Generado:** S55 — Junio 2026

---

## ⚠️ REGLAS ABSOLUTAS (leer antes de tocar código)

1. **No tocar código sin leer los docs de arranque** en orden:
   `docs/Nucleo/SESION.md` → `ESTADO.md` → `BACKLOG.md` → `docs/Arquitectura/INDEX.md`
2. **CONTRATO.md es ley** — 27 ADRs, 7 inamovibles. Si algo contradice un ADR, PARAR.
3. **SEARCH/REPLACE contenedor lógico completo** (ADR-015). Nunca micro-edición.
4. **Commits pequeños** — un pliego = un commit con mensaje descriptivo.
5. **Code review obligatorio** tras cada cambio significativo.
6. **Actualizar SESION.md y ESTADO.md al cerrar cada sesión.**
7. **Google OAuth2 solo para auth** (ADR-025). Ni una línea de persistencia en Drive.
8. **Solo 3 usuarios whitelist** (ADR-006): edu, david, admin.

---

## 🗺️ LO QUE YA ESTÁ HECHO (Fase 0 + S54)

### Fase 0 — Estabilización (S50-S53) ✅
- S50: localStorage playHistory (Q2/Q3) → `PlayerContext.jsx`
- S51: Shuffle pre-generado (SH1) → `PlayerContext.jsx`
- S52: Loop track absoluto (L1) → `PlayerContext.jsx`
- S53: Cola manual sobrevive a contexto + separación visual (Q10/Q14) → `PlayerContext.jsx`, `MusicLab.jsx`

### S54 — Infraestructura Cloudflare ✅
- **D1:** 16 tablas normalizadas (schema en `workers/schema.sql`)
- **Worker:** 11 endpoints REST (tracks, drops, playlists, tags, queue, events, health)
- **Wrangler:** `wrangler.toml` con bindings D1 (`el-bunker-db`) + R2 (`el-bunker-music`)
- **Desplegado:** `https://el-bunker-api.thebunker-admin.workers.dev`
- **database_id:** `795e5e88-6fab-4aa2-a294-d24640a0de05`

### Estructura actual del proyecto
```
src/
  core/          PlayerContext.jsx, VaultContext.jsx, GoogleDriveService.js
  musiclab/      MusicLab.jsx, WinampPlayer.jsx, TrackCard.jsx, ...
  layout/        App.jsx, Layout.jsx
  vault/         Vault.jsx
  smoke/         SmokeSession.jsx
  tokens.js      Design tokens + VIBE_TAGS
workers/
  schema.sql     16 tablas D1
  worker.js      11 endpoints REST (JWT placeholder)
wrangler.toml    Config Cloudflare
docs/
  Nucleo/        SESION.md, ESTADO.md, CONTRATO.md (27 ADRs), ...
  Arquitectura/  7 docs (⚠️ STALE tras Fase 0)
  spec/          taxonomia_vault.md, capsulas_spec.md, galeria_vault_spec.md
  sesiones/      Registros S49-S54
```

---

## 🎯 LO QUE FALTA (Fases 1-6, ~34 sesiones)

### FASE 1 — INFRAESTRUCTURA CLOUDFLARE (S55-S58, 4 sesiones restantes)

**S55 — Workers API: tracks + playlists CRUD completo**
- Archivos: `workers/worker.js`
- Añadir endpoints: PATCH /api/tracks/:id, DELETE /api/tracks/:id, GET /api/tracks/:id
- Añadir: PATCH /api/playlists/:id, DELETE /api/playlists/:id, POST /api/playlists/:id/tracks
- **JWT auth con firma real** (reemplazar placeholder `atob`)
  - Generar JWT_SECRET, firmar con HMAC-SHA256
  - Middleware `verifyJWT(token, secret)` que valide firma y expiración
  - Endpoint POST /api/auth/login — recibe Google OAuth token, verifica email contra whitelist, emite JWT

**S56 — Workers API: entries + tags + JWT auth completado**
- Archivos: `workers/worker.js`
- Añadir endpoints CRUD para entries: GET, POST, PATCH, DELETE
- Añadir endpoints CRUD para tags: PATCH /api/tags/:id, DELETE /api/tags/:id
- Añadir GET /api/entries?era_id=&type=&from_user=

**S57 — FileUploadService: pre-signed URLs a R2**
- Archivos: `workers/worker.js` (nuevo endpoint), `src/core/FileUploadService.js`
- Endpoint POST /api/upload — genera pre-signed URL para PUT directo a R2
- Frontend `FileUploadService.js` — función `getUploadUrl(prefix, filename)` → { uploadUrl, r2_key }
- Soporte para todos los prefixes: music, vault/photos, vault/videos, vault/docs, vault/audio
- Límite de tamaño configurable por prefix

**S58 — StatsEngine emitter + migrar tracks existentes**
- Archivos: `workers/worker.js`, `src/core/StatsEngine.js`, `docs/operacional/`
- `StatsEngine.js` — función `emit(event_type, payload)` → POST /api/events
- Script de migración: leer tracks del JSON Drive → insertar en D1 + subir a R2
- Documentar proceso de migración en `docs/operacional/migracion_drive_d1.md`

### FASE 2 — VAULT NÚCLEO (S59-S63, 5 sesiones)

**S59 — CRUD de entradas**
- `src/vault/AddEntryForm.jsx` — formulario polimórfico (note, photo, milestone, letter)
- Campos: title, content (JSON), type, era_id, tags, from_user (auto), to_user
- Tags con TagManager (mismo componente que MusicLab, namespace 'vault')
- Soft delete con confirmación

**S60 — Subida de archivos al VAULT**
- Integrar `FileUploadService.js` en `AddEntryForm.jsx`
- Previsualización de imágenes antes de subir
- Barra de progreso
- Thumbnail en entrada tras subida

**S61 — Galería WALL inicial**
- `src/vault/VaultGallery.jsx` — masonry grid con CSS columns
- Filtro por era, tipo, from_user
- Zoom de densidad (3 niveles: compact, normal, expanded)
- Click → panel de detalle

**S62 — Galería WALL avanzada**
- Virtualización para 100+ fotos (react-window o similar)
- Badges de contexto (era, vibes, from/to)
- Lazy loading de imágenes

**S63 — Panel de detalle**
- Vista completa de entrada: fotos, texto, metadatos
- Swipe entre entradas
- Botón "Abrir en galería"
- Edición inline

### FASE 3 — CAPSULES NÚCLEO (S64-S68, 5 sesiones)

**S64 — Migrar nav a 3 tabs + Capsules.jsx shell**
- `App.jsx`: `VAULT | MUSIC LAB | CAPSULES` (ADR-017)
- `Capsules.jsx`: shell con 4 sub-tabs (Timeline, Smoke, Time Capsules, RECAP)
- Migrar rutas existentes

**S65 — Migrar Smoke a src/capsules/ + mejorar**
- Mover `SmokeSession.jsx` → `src/capsules/SmokeSession.jsx`
- SS-1: nombrar sesiones
- SS-4: fade-out vibe-aware (color según vibe del track activo)

**S66 — Smoke: notificaciones + Timeline**
- SS-7: notificación 1 minuto antes del fade-out
- SS-8: emitir evento a Timeline al completar sesión

**S67 — Timeline con datos reales**
- `src/capsules/Timeline.jsx` — consume GET /api/events
- Filtros: tipo de evento, usuario, fecha
- Agrupación por día con separadores visuales

**S68 — Time Capsules CRUD**
- `src/capsules/TimeCapsules.jsx`
- Crear cápsula con fecha de apertura, título, contenido
- Añadir items (notas, fotos, referencias a tracks)
- Sellar (bloquea edición hasta unlock_at)
- Notificación al desbloquear

### FASE 4 — RECAP + GALERÍA AVANZADA (S69-S73, 5 sesiones)

**S69 — RECAP semanal**
- `src/capsules/Recaps.jsx`
- Card compacta: top tracks, drops enviados/recibidos, entradas creadas
- Generado desde GET /api/events?type=...&since=&until=
- Evento Timeline al generar

**S70 — RECAP mensual + anual**
- 6 secciones: escucha, drops, VAULT, rachas, momentos top, carta
- RECAP anual guardable como entrada del VAULT (ADR-026)

**S71 — Galería CINEMA**
- Full-bleed swipe con Framer Motion
- Música ambiente de la Era (consulta tracks por era_id)
- Auto-avance configurable

**S72 — Galería MAP**
- Fotos con coordenadas → pines en mapa (Leaflet o similar)
- Líneas de viaje entre pines consecutivos
- Slider temporal

**S73 — Galería DIALOGUE (killer feature)**
- Perspectiva dual Edu-David (ADR-027)
- Fotos intercaladas como conversación visual
- Fotos con <5min de diferencia → emparejadas con conector
- Asimetría → eco visual poético

### FASE 5 — MUSICLAB PENDIENTE (S74-S83, 10 sesiones)

Objetivo: completar todas las specs del reproductor (`docs/spec/el_bunker_reproductor_spec_v2.md`).

**S74-S75 — Cola avanzada**
- Q6: límite 75 tracks en cola manual
- Q12: añadir playlist entera a cola
- Q15: scroll infinito en historial (no solo 1 atrás)
- Q16/Q17: soft delete de tracks en cola

**S76-S77 — Sesión + UX**
- S1/S2: recordar posición de tracks y cola (localStorage)
- S8: restaurar estado completo de sesión
- UX1: double-tap seek +30s/-15s
- UX2: háptico en play/pause/skip (navigator.vibrate)
- UX5: swipe horizontal en mini-player para skip

**S78-S79 — Android**
- A1: OOM handling (no matar el proceso)
- A2: pausar en llamada entrante
- A3: pausar al desconectar auriculares
- A4: controles en pantalla de bloqueo
- A5: no ducking con otra app de audio
- A6: Modo No Molestar no silencia la música

**S80-S81 — MediaSession API**
- M1-M6: metadata, controles, notificación persistente
- M7-M12: volumen, Cast básico

**S82 — Escucha compartida**
- SC1-SC14: corazón de sincronización vía events table
- Misma canción, misma posición para Edu y David
- Indicador visual de escucha compartida activa

**S83 — Soft delete + ID3**
- S3: soft delete de tracks
- EC-TR6: extraer metadatos ID3 al subir (artista, título, duración)

### FASE 6 — PULIDO (S84-S88, 5 sesiones)

**S84 — Galería EXHIBITION**
- Canvas 2D con fotos agrupadas por vibe/tag
- Layout orgánico, no grid

**S85 — Galería REEL**
- Secuencias auto-generadas con narrativa
- Pinning manual de fotos a reels

**S86 — Integraciones**
- Drop → crear entrada en VAULT
- Entrada → link a track en MusicLab

**S87 — Cápsulas avanzadas**
- Snapshot de playlist al crear cápsula
- Cápsulas colaborativas (ambos añaden items)

**S88 — Pulido general**
- Edge cases (sin conexión, archivos corruptos, R2 quotas)
- Animaciones de transición entre tabs
- Rendimiento en dispositivos Android antiguos
- Errores con mensajes amigables, no stack traces

---

## 🔗 DEPENDENCIAS

```
FASE 1 (S55-S58) → todo lo demás
                  → FASE 2 (VAULT) → FASE 4 (galería avanzada)
                  → FASE 3 (CAPSULES) → FASE 4 (RECAP)
                  → FASE 5 (MusicLab) → FASE 6 (pulido)
```

---

## 📋 ARCHIVOS CLAVE (referencia rápida)

| Archivo | Qué hace | Fase que lo toca |
|---|---|---|
| `workers/worker.js` | API REST (11 endpoints) | 1 |
| `workers/schema.sql` | Schema D1 (16 tablas) | 1 |
| `wrangler.toml` | Config Cloudflare | 1 |
| `src/core/PlayerContext.jsx` | Motor de reproducción | 0, 5 |
| `src/core/VaultContext.jsx` | Persistencia (GoogleDrive → D1) | 1, 2 |
| `src/core/GoogleDriveService.js` | API Google Drive (deprecando) | 1 |
| `src/musiclab/MusicLab.jsx` | UI principal MusicLab | 0, 5 |
| `src/musiclab/WinampPlayer.jsx` | Controles + visualización | 5 |
| `src/layout/App.jsx` | Router + auth | 3 |
| `src/layout/Layout.jsx` | Shell + nav | 3 |
| `src/vault/Vault.jsx` | Tab VAULT | 2 |
| `src/capsules/` | Tab CAPSULES (a crear) | 3, 4 |
| `docs/Nucleo/CONTRATO.md` | 27 ADRs (ley) | Todas |
| `docs/ROADMAP.md` | Este roadmap | Todas |

---

## 🚀 PROTOCOLO DE EJECUCIÓN

1. **Crear rama:** `git checkout -b roadmap-completo`
2. **Por cada sesión:**
   a. Leer los 4 docs de arranque
   b. Verificar CONTRATO.md (no contradiga ADRs)
   c. Implementar los cambios (SEARCH/REPLACE contenedor lógico)
   d. Code review
   e. Commit con mensaje descriptivo
   f. Actualizar SESION.md y ESTADO.md
3. **Al terminar una fase:** verificar que el hito se cumple
4. **Antes del push:** `git log --oneline` para verificar commits
5. **Si algo falla:** documentar en BACKLOG.md y seguir con la siguiente sesión

---

## 🎯 OBJETIVO FINAL

App privada tipo bóveda de memoria y reproductor musical para Edu y David.
3 tabs: VAULT · MUSIC LAB · CAPSULES.
6 modos de galería. Escucha compartida. RECAPs automáticos.
Infra: Cloudflare Workers + D1 + R2. Coste: 0€/mes.
