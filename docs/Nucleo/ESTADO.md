# ESTADO.md — el_bunker
> Max 30 líneas. Bugs en espera → BACKLOG.md.

**MODO: CIERRE v1.0.** Plan vigente: `docs/operacional/auditoria_fable_1.0.md` → **ADDENDUM CIERRE v1.0** manda.
**v1.0 EN CÓDIGO + PROD ✅ (S148).** Deploy hecho 13-jul: secret `R2_SIGN_SECRET` seteado + worker desplegado (v `aa502226`). Gate R2 vivo (probe `vault/docs/` → 404 sin token). Solo falta confirmación de Edu en móvil.
**Última sesión:** S148 — FASE C.2 + FASE D completadas en código (DEMO purge, WALL museo por eras, R2 HMAC gate, track_updated silenciado, `.bak` borrados, docs resincronizados, lint pre-existing arreglado).
**Rama:** `master`

## ✅ Cierre v1.0 — completado en código (S148)
- **FASE C.2:** DEMO purge total (grep 0 hits) · WALL museo por eras (`EraSectionHeader` + lazy-mount intacto).
- **FASE D.1:** R2 HMAC gate (`workers/utils/r2-sign.js` + `workers/routes/r2.js`) para `vault/docs/`+`vault/audio/`; `entries.js` firma server-side (campo `img.url`); frontend prefiere URL firmada.
- **FASE D.2:** `track_updated` silenciado — PATCH mudo + helper `emitTrackEvent` (POST/DELETE siguen); Timeline whitelist `VISIBLE_TRACK_EVENTS` filtra histórico sin borrar D1 (🔒-3 intacto).
- **Housekeeping:** 4 `.bak` borrados · `eslint.config.js` override Node globals para `tools/` · `checklist_data.js` → `_C` · 4 docs arquitectura resincronizados (INDEX/architecture/rendering-flow/technical-debt).
- **Congelados intactos:** `WinampPlayer.jsx`, `AudioVisualizer.jsx`, `PlayerContext.jsx`, `tokens.js` — no tocados.

## ✅ Deploy hecho (13-jul, S148)
- `wrangler secret put R2_SIGN_SECRET` → subido a `el-bunker-api`.
- `wrangler deploy` → v `aa502226-be8d-4d5c-9205-ed4474668ac6`, bindings DB+BUNKER intactos.
- Verificado en prod: `/api/health` 200 · `vault/docs/` sin token → 404 (gate vivo) · `music/` público intacto.
- Rollback si hace falta: `wrangler secret delete R2_SIGN_SECRET` (gate se omite, vuelve a compat).

## ⏸ Pendiente de Edu
1. **Subir PRUEBA primero** (`tools/import-prueba-pendiente.txt`), **luego** confirmar EntryLightbox en móvil con fotos reales.
2. Frontend (Vercel) sigue en la build pre-S148 hasta que Edu haga deploy del frontend.

## 🛠️ Importación VAULT — Takeout ya extraído + staging hecho; carpeta PRUEBA pendiente
- Takeout de Edu **ya descargado y extraído**: `D:\takeout-import\Takeout\Google Fotos\` (14.051 archivos, 2007-2026).
- Staging (S146, 08-jul) ya corrido: `D:\bunker-import-review\` (16.275 archivos + `staging-manifest.json`).
- **Pendiente (Edu, manual):** subir SOLO `D:\bunker-import-review\PRUEBA\` (590 archivos: 527 JPG + 63 MP4, ~4,1 GB). Runbook copy-paste en `tools/import-prueba-pendiente.txt` (Edu pone su JWT en su terminal, no se pega al chat). Preparado 13-jul: manifiesto copiado dentro de PRUEBA/.
- **Estado real: 0 fotos subidas** (`import-manifest.json` no existe). Sube a `vault/photos/`+`vault/videos/` (públicos, no afectados por el R2 gate de FASE D).
- El resto del staging (15.685 archivos) queda a la espera — Edu decide si sube más después de ver PRUEBA en la app.

## Build/Lint
✅ Build verde · Lint 0/0 global (incluido `tools/` y `docs/operacional/` arreglados S148).

## Score real
~62% (FASE A+B+C+D sobre base ~52%). Cierre v1.0 en código + prod = criterio del ADDENDUM cubierto salvo confirmación móvil.
