# CONTRATO.md — el_bunker
> ADRs vigentes. Normativo — prevalencia absoluta.
> Contradicción con este doc → Claude detiene y reporta antes de generar pliego.
> Solo crece con nuevas decisiones. Los ADRs revertidos nunca desaparecen: se marcan ⛔.

---

## 🔒 REGLAS INAMOVIBLES

Estas reglas no pueden eliminarse bajo ninguna circunstancia salvo decisión explícita documentada aquí.

| # | Regla |
|---|---|
| 🔒-1 | **Loop triestado.** `loopMode: "off" \| "list" \| "track"`. Nunca boolean. (ADR-007) |
| 🔒-2 | **Sin backend externo.** Todo persiste en Google Drive JSON o Cloudflare R2/D1. No proponer Firebase, Supabase ni similar. (ADR-001) |
| ⛔ 🔒-3 | ~~**YouTube nunca con `<audio>` nativo.**~~ SUPERSEDIDA S28 — YouTube extirpado en M1. Sin objeto de protección. |
| ⛔ 🔒-4 | ~~**Div YT nunca en JSX React.**~~ SUPERSEDIDA S28 — YouTube extirpado en M1. Sin objeto de protección. |

---

## ADRs VIGENTES

### ✅ ADR-001 — Sin base de datos externa
Todo persiste en Google Drive (JSON) o Cloudflare (R2 para audio, D1 en el futuro para DB). No proponer Firebase, Supabase ni similar.

### ✅ ADR-002 — Colas de reproducción por usuario
Archivos separados `queue_[userId].json` en carpeta compartida de Drive. No mezclar con la DB principal.

### ⛔ ADR-003 — Arquitectura de tracks (REVERTIDO — S28)
Tipos `youtube` / `drive` eliminados. Post-M1 solo existe `drive`. Ver ADR-010. Schema v4.0.0.

### ⚠️ ADR-004 — Global PlayerContext (ENMENDADO)
Estado de reproducción centralizado en `PlayerContext.jsx`.
Expone: `activeTrack`, `isPlaying`, `localQueue`, `loopMode`, `loopModeRef`, `shuffle`, refs de audio, `skip`, `addToQueue`, `removeFromQueue`, `playTrack`, `toggleLoopMode`, `trackVibe`, `masterVolume`, `currentTRef`.

**Enmiendas vigentes:**
- S21: `<audio>` se instancia en `PlayerProvider`. Prohibido delegar a subcomponentes mutables.
- S24: Progreso (`currentTime`, `duration`, `progress`) es UI local de `WinampPlayer`. NUNCA en Context.
- S26: `useEffect([track?.id])` en `WinampPlayer` DEBE protegerse con `mountedRef`.
- S28: `ytPlayerRef` eliminado. `activeVibe` renombrado a `trackVibe`. Ver ADR-011.

### ✅ ADR-005 — Schema v4.0.0
Campos de track: `title`, `artist`, `drive_file_id`, `r2_key`, `tag`, `tags`, `thumbnail`, `format`, `note`.
Campos eliminados: `youtube_url`, `url` (legacy), `type`.
Arrays purgados en M1: `tracks[]`, `drops[]`. Se mantienen contadores globales.
Migración automática desde v1, v2, v3.x. `CONFIG.SCHEMA_VERSION = "4.0.0"`.

### ✅ ADR-006 — Solo 3 usuarios autorizados
Whitelist fija en `CONFIG.USERS` de `GoogleDriveService.js`. No proponer auth dinámica.

### ✅ ADR-007 — Loop triestado
`loopMode: "off" | "list" | "track"`. Ciclo: OFF → loop-lista → loop-track → OFF.
`loopModeRef` obligatorio para callbacks de audio nativo — evita stale closure en event listeners de HTMLAudioElement.
Icono: `"off"` → `⟳` inactivo · `"list"` → `⟳` activo · `"track"` → `⟳¹` activo.

### ⛔ ADR-008 — Cola siempre tiene prioridad sobre shuffle (REVERTIDO)
**No implementar.** Ver ADR-009.

### ✅ ADR-009 — Filosofía del reproductor: convención primero
Toda decisión parte de lo que hace un reproductor estándar. Solo se aparta con razón documentada aquí.

**Convenciones base inamovibles:**
- Cola manual tiene prioridad sobre shuffle, siempre
- Cambiar de track mientras suena → el nuevo track arranca
- Loop track → repite el track actual indefinidamente
- Loop list → vuelve al primero al llegar al final
- Sin loop + cola vacía → para
- Skip atrás < 3s → track anterior · > 3s → reiniciar actual

*Excepción deliberada:* `masterVolume` vive en `PlayerContext` para que `SmokeSession` lo consuma.

### ✅ ADR-010 — Motor de audio exclusivo: HTMLAudioElement + Cloudflare R2
`HTMLAudioElement` es el único motor de audio. Sin iframes, sin SDKs externos.
Audio servido desde Cloudflare R2: soporte nativo de byte-range requests (HTTP 206), gapless garantizado, zero egress fees.

### ✅ ADR-011 — Separación trackVibe / libraryFilter
- `trackVibe: string | null` — en `PlayerContext`. Derivado de `activeTrack?.tag`. Escrito en `document.body` como CSS custom property. Fuente del motor visual en toda la app.
- `libraryFilter: string` — en `VaultContext` o estado local de `Vault.jsx`. Filtro de UI exclusivamente. No afecta al reproductor.

### ✅ ADR-012 — Versionado de schema: SemVer
MAJOR si el código anterior no puede leer el nuevo JSON sin explotar. MINOR si solo se añaden campos opcionales. PATCH si es corrección puntual sin rotura.
Mapa aprobado: v4.0.0 (M1) · v4.1.0 (M2 — campo `r2_key`) · v4.2.0 (STAT-M9).

### ✅ ADR-013 — OCC con ETags para patchDb
En colisión (HTTP 412), `patchDb()` descarga nueva versión, fusiona mutación local, reintenta con exponential backoff + jitter. Máximo 3 reintentos. Si el tercero falla: abortar + toast no bloqueante (UX-G1).

### ✅ ADR-014 — Upload flow: Pre-signed URLs para R2
Subidas individuales (UI): Pre-signed URL vía Serverless Function de Vercel → PUT binario directo a R2 por CORS. Vercel nunca toca el binario.
Subidas masivas (batch): scripts admin vía `ListObjectsV2` de R2. Sin UI ni HUD en el frontend.

---

## DEPENDENCIAS INAMOVIBLES

- **Tailwind CSS v3.4.19** — NO actualizar a v4. Rompe el proyecto.
- **React 18 + Vite** — client-side puro. No Next.js.
- **GIS OAuth2** — no usar librería legacy de Google Sign-In.
- **Scope `drive`** — necesario para escritura cruzada entre cuentas. No reducir a `drive.file`.