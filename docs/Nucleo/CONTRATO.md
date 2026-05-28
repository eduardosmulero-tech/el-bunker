# CONTRATO.md — el_bunker
> ADRs vigentes. Normativo — prevalencia absoluta.
> Contradicción con este doc → Claude detiene y reporta antes de generar pliego.
> Solo crece con nuevas decisiones. Los ADRs revertidos nunca desaparecen: se marcan ⛔.

---

## 🔒 REGLAS INAMOVIBLES

| # | Regla |
|---|---|
| 🔒-1 | **Loop triestado.** `loopMode: "off" \| "list" \| "track"`. Nunca boolean. (ADR-007) |
| 🔒-2 | **Sin backend externo.** Todo persiste en Google Drive JSON o Cloudflare R2/D1. (ADR-001) |
| ⛔ 🔒-3 | ~~**YouTube nunca con `<audio>` nativo.**~~ SUPERSEDIDA S28 |
| ⛔ 🔒-4 | ~~**Div YT nunca en JSX React.**~~ SUPERSEDIDA S28 |

---

## ADRs VIGENTES

### ✅ ADR-001 — Sin base de datos externa
Todo persiste en Google Drive (JSON) o Cloudflare (R2 para audio).

### ✅ ADR-002 — Colas de reproducción por usuario
Archivos separados `queue_[userId].json` en carpeta compartida de Drive.

### ⛔ ADR-003 — Arquitectura de tracks (REVERTIDO — S28)
Tipos `youtube` / `drive` eliminados. Ver ADR-010.

### ⚠️ ADR-004 — Global PlayerContext (ENMENDADO)
Estado centralizado en `PlayerContext.jsx`.
**Enmiendas:** S21 (Audio instanciado en PlayerProvider), S24 (Progreso es local UI), S26 (Protección `mountedRef`), S28 (`trackVibe` ADR-011).

### ✅ ADR-005 — Schema v4.0.0
Campos de track: `title`, `artist`, `drive_file_id`, `r2_key`, `tag`, `tags`, `thumbnail`, `format`, `note`.

### ✅ ADR-006 — Solo 3 usuarios autorizados
Whitelist en `CONFIG.USERS`.

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

### ✅ ADR-013 — OCC con ETags para patchDb
Exponential backoff en escritura concurrente.

### ✅ ADR-014 — Upload flow: Pre-signed URLs para R2
PUT binario directo a R2 por CORS.

### ✅ ADR-015 — Directivas Anti-Fricción para Pliegos
Para evitar corrupción o fallos de `pliego_apply.py`, se prohíbe la micro-edición. Todo bloque `SEARCH` debe abarcar el contenedor lógico completo (funciones o hooks desde su apertura hasta su cierre). El parser asume la indentación exacta generada.