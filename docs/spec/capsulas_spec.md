# EL BÚNKER — Especificación de CAPSULES
> La tab del TIEMPO. 4 experiencias temporales que consumen datos de VAULT y MusicLab.
> Ninguna es dueña del dato — son clientes de los motores.

---

## Arquitectura de CAPSULES

```
Tab: CAPSULES (⧖)
│
├── Sub-tab: TIMELINE ⏳     — Pasado en tiempo real
├── Sub-tab: SMOKE SESSION ⧖ — Presente
├── Sub-tab: TIME CAPSULES 🔮 — Futuro
└── Sub-tab: RECAP 📊        — Reflexión
```

Cada sub-tab consume datos de:
- **VAULT** — eras, entries, documentos, fotos, lugares
- **MusicLab** — tracks, playlists, drops, reproducción
- **Stats Engine (D1 `events` table)** — todos los eventos inmutables

---

## ⏳ TIMELINE — El diario automático

### Concepto
Feed cronológico unificado de toda la app. No es "el historial de VAULT" ni "el historial de escucha" — es el diario automático de la relación, construido por eventos de ambos motores.

### Dependencias
- Stats Engine (D1 `events` table) — fuente única de verdad
- VAULT — entries como eventos en el feed
- MusicLab — tracks, drops como eventos en el feed

### Anatomía visual
Scroll vertical infinito. Cada evento es una card mínima con icono de categoría, timestamp, color del módulo/era de origen, y acción al tap.

```
┌──────────────────────────────────────┐
│ ◎ 14:32  ·  DAVID                     │
│ 📸 Nueva foto en Era ORIGEN           │
│ "Atardecer en la playa"              │
│ [ver entrada →]                       │
└──────────────────────────────────────┘
```

### Tipos de eventos

| Icono | Fuente | Evento |
|---|---|---|
| 📸 | VAULT | Nueva foto añadida |
| 🎥 | VAULT | Nuevo vídeo añadido |
| ✍️ | VAULT | Nueva carta/nota |
| 🗺️ | VAULT | Nuevo lugar guardado |
| ◈ | VAULT | Hito de Era alcanzado / Nueva Era creada |
| 🎵 | MusicLab | Primera escucha de un track juntos |
| 🎵 | MusicLab | Hito de escucha (100 plays, 10h de un vibe) |
| ⚡ | MusicLab | Drop recibido |
| 🔗 | VAULT | Nuevo enlace guardado |
| 📋 | VAULT | Nueva lista creada |
| 🔐 | Sistema | Backup creado, biblioteca en riesgo |
| 📊 | RECAP | Nuevo resumen disponible |
| ⧖ | Smoke | Sesión iniciada/completada |

### Filtros
- Por Era
- Por módulo (VAULT / MusicLab)
- Por usuario (Edu / David)
- Por tipo (fotos, drops, hitos...)

### "Un día como hoy"
Banner sutil al abrir si hay eventos del mismo día en años anteriores. Carrusel horizontal de 3-5 eventos.

---

## ⧖ SMOKE SESSION — El presente controlado

### Concepto
Temporizador visual con anillo circular y fade-out de volumen automático.

### Estado actual
✅ IMPLEMENTADO: presets (15/30/45/60/90 min + custom), anillo SVG con glow/dot, play/pause/reset, fade-out 2 min, restauración de volumen, barra de volumen master.

### Mejoras

| ID | Mejora | Fase |
|---|---|---|
| SS-1 | Nombrar sesiones ("Tarde de lectura") | A |
| SS-2 | Historial de sesiones (fecha, duración, nombre, música) | B |
| SS-3 | Rachas ("10 sesiones esta semana") | B |
| SS-4 | Vibe-aware: color del anillo = trackVibe activo | A |
| SS-5 | Presets personalizados guardables | B |
| SS-6 | Sonido ambiente (ruido blanco/lluvia/fuego) — feature grande | C |
| SS-7 | Push notification + vibración al terminar | A |
| SS-8 | Evento Timeline al iniciar/terminar sesión | A |

### Dependencias
- PlayerContext — control de `masterVolume` (fade-out)
- Stats Engine — registro de sesiones (historial, rachas)

---

## 🔮 TIME CAPSULES — El futuro sellado

### Concepto
Contenido bloqueado tras una fecha futura. Al alcanzarla, se desbloquea con animación glitch-reveal.

### Estado actual
🟡 Componente `TimeCapsule` existe en Vault.jsx con countdown, estados bloqueado/desbloqueado, animación. Oculto en producción por usar demo data.

### Schema
```json
{
  "id": "tc-001",
  "title": "Carta al futuro",
  "description": "Para abrir en nuestro 5º aniversario",
  "unlock_date": "2030-06-15T00:00:00Z",
  "created_by": "edu",
  "created_at": "2025-06-15T12:00:00Z",
  "sealed": true,
  "items": [
    { "type": "entry_ref", "entry_id": "entry-042" },
    { "type": "playlist_ref", "playlist_id": "pl-007", "snapshot_track_ids": ["t1","t2"] }
  ]
}
```

### Features por implementar

| ID | Feature | Descripción |
|---|---|---|
| TC-1 | Crear cápsula | Modal: título, descripción, fecha, seleccionar contenido |
| TC-2 | Añadir contenido | Selector de entries VAULT + playlists MusicLab |
| TC-3 | Snapshot de playlist | Al sellar, la playlist congela sus tracks actuales |
| TC-4 | Vista previa | Preview del contenido antes de sellar |
| TC-5 | Sellar | Acción irreversible con confirmación |
| TC-6 | Notificación | Push cuando se desbloquea |
| TC-7 | Evento Timeline | "Cápsula X desbloqueada" |
| TC-8 | Animación de apertura | Partículas, sonido, transición (mejora del glitch actual) |
| TC-9 | Cápsula colaborativa | Ambos pueden añadir contenido antes de sellar |

### Dependencias
- VAULT — contenido de la cápsula (entries)
- MusicLab — playlists referenciables

---

## 📊 RECAP — La reflexión

### Concepto
Resúmenes automáticos semanales, mensuales y anuales generados desde el motor de eventos unificado. El "Spotify Wrapped" de la relación.

**No es el motor de stats.** Es la UI que consume esos datos y los presenta de forma emocional, visual, compartible.

### Dependencias
- Stats Engine (D1 `events` table) — fuente de datos
- VAULT — fotos del período para ilustrar
- MusicLab — top tracks, playlists del período

### RECAP Semanal (cada domingo)
Card compacta con: canciones escuchadas, top track, vibe dominante, fotos guardadas, cartas, drops, sesiones smoke, rachas activas.

### RECAP Anual ("Nuestro 2026")
Scroll vertical rico tipo Spotify Wrapped:

1. **Portada** — Foto más gustada del año + Era activa
2. **Música** — Top 5 tracks, top 3 vibes, minutos totales, track del año
3. **Memoria** — Fotos destacadas, cartas escritas, lugares añadidos
4. **Conexión** — Drops intercambiados, sesiones smoke, horas compartidas
5. **Hitos** — Nuevas Eras, "un día como hoy" más significativo, rachas
6. **Cierre** — Playlist auto-generada + botón "Guardar como entrada del VAULT"

### Generación
- **Semanal**: automático cada domingo. Toast.
- **Mensual**: automático día 1. Notificación push.
- **Anual**: automático 31 diciembre. Experiencia completa.

### Compartibilidad
- Guardar RECAP como entrada del VAULT (tipo `recap`)
- El RECAP anual es revisitale como una cápsula más

---
