# EL BÚNKER — Auditoría Cruzada VAULT ↔ MusicLab
> Generado durante entrevista de definición de CONTRATO.
> Detecta overlaps, conflictos, sinergias y decisiones arquitectónicas entre los dos módulos principales.

---

## ⚠️ OVERLAPS (misma funcionalidad en dos sitios)

| # | Overlap | VAULT | MusicLab | Gravedad | Resolución |
|---|---|---|---|---|---|
| **O1** | **Audio** | 1.3 — Notas de voz, grabaciones ambientales, canciones dedicadas | Reproductor de tracks MP3 | 🟢 RESUELTO — MusicLab absorbe TODO el audio. VAULT almacena archivos, MusicLab los reproduce vía mini-player persistente. Sin `<audio>` en VAULT. |
| **O2** | **Playlists** | 9.3 — "Playlists con historia" (por qué cada canción importa) | PlaylistManager completo con CRUD, drag & drop, play | ✅ RESUELTO — MusicLab dueño del dato. VAULT referencia `playlist_id` y añade capa narrativa. |
| **O3** | **Estadísticas** | 13.x — Resúmenes, rachas, mapas de calor | STAT-M9 — Reproducciones, drops, tracks/vibe | ✅ RESUELTO — Motor único de eventos (D1). Ambos módulos emiten, un agregador consume. Resúmenes semanales/mensuales/anuales unificados. |
| **O4** | **Drops ↔ Cartas** | 2.1 — Cartas entre usuarios | Drops — Mensaje vinculado a track+segundo | Abierto — Drop significativo debe poder promocionarse a entrada de VAULT. Acción explícita del usuario. |
| **O5** | **Tags** | Tags de contexto vital (viaje, mudanza, aniversario) | Tags de vibe (gaming, dnb, romantiqueo) | ✅ RESUELTO — Namespaces separados (`vault.tags[]`, `music_lab.tags[]`). Mismo componente TagManager, distinta fuente. |
| **O6** | **Timeline / Historial** | 5.3 — "Un día como hoy" · Categoría 5 completa | Historial de reproducción (Q2/Q3/Q15) | ✅ RESUELTO — Feed unificado en tab CAPSULES, con datos de ambos módulos. |

---

## 🚫 CONFLICTOS (se anulan entre sí)

| # | Conflicto | Resolución |
|---|---|---|
| **C1** | **Dos motores de stats** — STAT-M9 y VAULT 13.x compitiendo | **Un solo motor.** D1 `events` table inmutable. Ambos módulos emiten eventos. Stats se calculan con queries SQL. |
| **C2** | **Dos sistemas de archivos** — MusicLab R2 vs VAULT uploads | **Un solo FileUploadService.** Pre-signed URLs a R2, prefixes por módulo (`/music/`, `/vault/photos/`, `/vault/docs/`). |
| **C3** | **Dos conceptos de "playlist"** — duplicación de UI y lógica | **MusicLab dueño del dato.** VAULT referencia, no duplica. |
| **C4** | **Tags mezclados** — vibe tags en VAULT, context tags en MusicLab | **Namespaces separados.** No se cruzan sin acción explícita. |

---

## 💡 SINERGIAS (funcionan mejor juntas)

| # | Sinergia | Valor |
|---|---|---|
| **S1** | **Timeline como punto de fusión** — Feed cronológico unificado en tab CAPSULES | ⭐⭐⭐⭐⭐ |
| **S2** | **Promoción Drop → Entrada VAULT** — Un drop significativo se inmortaliza con un tap | ⭐⭐⭐⭐ |
| **S3** | **Eras como filtro de estadísticas musicales** — Top canciones por capítulo de la relación | ⭐⭐⭐⭐ |
| **S4** | **trackVibe → sugerencia de mood para VAULT** — La escucha prolongada de un vibe sugiere estado emocional | ⭐⭐⭐ |
| **S5** | **"Estaba sonando X cuando…"** — Una entrada de VAULT puede linkear al track activo | ⭐⭐⭐ |
| **S6** | **Cápsulas del tiempo con playlists** — Snapshot de tracks al sellar la cápsula | ⭐⭐⭐ |
| **S7** | **Infraestructura compartida** — Upload R2, TagManager UI, drag & drop, filtro, toasts | ⭐⭐⭐⭐⭐ |
| **S8** | **Resumen anual unificado** — "Nuestro 2026": fotos + hitos + top canciones + drops + viajes | ⭐⭐⭐⭐⭐ |

---

## 📐 DECISIONES ARQUITECTÓNICAS

| # | Decisión | Estado |
|---|---|---|
| **DA-1** | Un solo motor de estadísticas. D1 `events` table inmutable. | ✅ Decidido |
| **DA-2** | Un solo FileUploadService. Pre-signed URLs a R2, prefixes por módulo. | ✅ Decidido |
| **DA-3** | MusicLab dueño de playlists. VAULT referencia `playlist_id`. | ✅ Decidido |
| **DA-4** | Namespaces de tags separados. Mismo TagManager, distinta fuente. | ✅ Decidido |
| **DA-5** | Motor único de audio. MusicLab reproduce TODO. VAULT nunca instancia `<audio>`. | ✅ Decidido |
| **DA-6** | Drops pueden promocionarse a entrada VAULT (acción explícita usuario). | ✅ Decidido |
| **DA-7** | Entradas VAULT pueden linkear a tracks de MusicLab (contexto ambiental). | ✅ Decidido |
| **DA-8** | Cápsulas del Tiempo pueden contener referencias a playlists. | ✅ Decidido |
| **DA-9** | Google OAuth2 se mantiene solo para auth. DB migra a D1. Archivos a R2. | ✅ Decidido |

---

## 🧩 Independencia total (sin relación)

**VAULT puro:** Documentos personales (3.x), Listas y colecciones (6.x), Comunicación y crecimiento (7.x), Finanzas (10.x), Rituales (11.x), Seguridad y legado (12.x)

**MusicLab puro:** Escucha compartida (SC1-SC14), Android/MediaSession (A, M, Cast), Gapless/crossfade/precarga (P1-P3)

---

## 📊 Arquitectura resultante

```
                    ┌──────────────────────────┐
                    │     EL BUNKER SHELL       │
                    │  (Layout, status bar, nav) │
                    └──────────┬───────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                                     │
    ┌───────▼────────┐                  ┌────────▼─────────┐
    │   MUSIC LAB    │                  │      VAULT        │
    │  (activo,       │                  │  (contemplativo,  │
    │   en tiempo     │                  │   narrativo)      │
    │   real)         │                  │                   │
    └───────┬────────┘                  └────────┬──────────┘
            │                                     │
            │    ┌──────────────────────┐         │
            │    │  CAPA COMPARTIDA     │         │
            ├────┤  • FileUploadService │─────────┤
            │    │  • Stats Engine      │         │
            │    │  • TagManager UI     │         │
            │    │  • Audio Engine      │         │
            └────┤  • Drag & Drop       ├─────────┘
                 └──────────────────────┘

    MusicLab es dueño de:          VAULT es dueño de:
    • tracks                       • eras
    • playlists                    • entries
    • drops                        • capsules
    • queue                        • timeline
    • tags (vibe)                  • tags (context)
    • audio playback               • documentos
                                   • finanzas
                                   • ...
```
