# 🚀 DEPLOY CHECKLIST — el_bunker

> **Una sola página de referencia** para el siguiente deploy.
> Generada S85 · Próxima revisión: cuando se acumulen 3+ manual steps o se cambie `wrangler.toml`.
>
> ⚠️ **Lee esto ANTES de hacer cualquier `wrangler deploy` / `wrangler d1 execute`.**

---

## 📊 ESTADO ACTUAL (14 Junio 2026)

**Pending manual steps: 3** (todos de S84)

| # | Tipo | Comando | Bloquea |
|---|---|---|---|
| 1 | D1 migration | `ALTER TABLE playlists ADD COLUMN sort_order INTEGER DEFAULT 0` | 6 sister bugs S84 |
| 2 | D1 index | `CREATE INDEX idx_playlists_order ON playlists(sort_order, created_at)` | 6 sister bugs S84 |
| 3 | Worker deploy | `npx wrangler deploy` | 4 endpoints nuevos S84 |

**Aplicar en orden:** snapshot → D1 → Worker → verify (~3 min total).

---

## 🔧 INFRAESTRUCTURA — IDs y bindings canónicos

> **Copia-pega de aquí para evitar errores.** Cualquier valor que no esté aquí → buscar en `wrangler.toml` o preguntar.

| Recurso | Nombre | ID / Ref | Notas |
|---|---|---|---|
| **Worker name** | `el-bunker-api` | (entry: `workers/worker.js`) | No renombrar (rompe URLs en prod) |
| **D1 database** | `el-bunker-db` | `795e5e88-6fab-4aa2-a294-d24640a0de05` | En `wrangler.toml` → `[[d1_databases]]` |
| **D1 binding** | `DB` | (en worker.js) | Usar `env.DB.prepare(...).bind(...).run()` |
| **R2 bucket** | `el-bunker-music` | (binding `BUNKER`) | MP3s y archivos multimedia |
| **Worker URL** | `https://el-bunker-api.thebunker-admin.workers.dev` | — | Frontend apunta aquí vía `VITE_API_URL` |
| **Frontend** | `https://el-bunker-beige.vercel.app` | — | Vercel auto-deploy desde `master` |

### Variables de entorno (worker)

Definidas en `wrangler.toml` sección `[vars]`:
- `ENVIRONMENT = "production"`

### Secrets (NO en repo)

Definir con `wrangler secret put NOMBRE`:
- `JWT_SECRET` (HMAC-SHA256 para tokens)

Ver lista: `npx wrangler secret list`

---

## ✅ DEPLOY WORKFLOW ESTÁNDAR (5 pasos, ~3 min)

> **Regla de oro**: snapshot PRIMERO. Si algo rompe, rollback con `migrate_drive_to_d1.py` o restaurar snapshot.

### 0. Snapshot pre-deploy (rollback point)

```bash
cd /c/proyectos/el-bunker
bash tools/snapshot_d1.sh
```

**Output esperado:** `tools/snapshots/d1_YYYYMMDD_HHMMSS.json` (~3-5 MB con 558 tracks + 6 playlists).

Si el snapshot falla, **abortar** y reportar — no proceder sin rollback point.

### 1. D1 migrations (si hay)

Por cada migración pendiente:

```bash
# Migración aditiva (1 columna, 1 índice)
npx wrangler d1 execute el-bunker-db --remote --command="ALTER TABLE playlists ADD COLUMN sort_order INTEGER DEFAULT 0;"

npx wrangler d1 execute el-bunker-db --remote --command="CREATE INDEX IF NOT EXISTS idx_playlists_order ON playlists(sort_order, created_at);"
```

**Notas:**
- Usar `--remote` para producción, sin flag para local.
- `IF NOT EXISTS` es seguro — no rompe si el índice ya existe.
- `DEFAULT 0` evita que las filas existentes queden `NULL`.
- **NO usar** `wrangler d1 execute ... --file=workers/schema.sql` para producción — el schema completo es DROP+CREATE (= NUKE). Solo para reset total con gate "NUKE".

### 2. Worker deploy (si hay cambios en `workers/worker.js`)

```bash
npx wrangler deploy
```

**Tiempo:** 30-60s (propagación global de Cloudflare).

**Output esperado:** `Published el-bunker-api (X.XX sec)` + URL de preview.

### 3. Verificación post-deploy (5 min)

```bash
# 3.1. Health check del Worker
curl -sS https://el-bunker-api.thebunker-admin.workers.dev/api/health

# 3.2. Test de endpoints nuevos (debe devolver 401, no 404)
curl -sS -X POST https://el-bunker-api.thebunker-admin.workers.dev/api/playlists/reorder \
  -H "Content-Type: application/json" -d '{"playlist_ids":[]}'

# 3.3. Schema aplicado (sort_order existe, índice creado)
npx wrangler d1 execute el-bunker-db --remote --command="PRAGMA table_info(playlists);" | grep sort_order
npx wrangler d1 execute el-bunker-db --remote --command="PRAGMA index_list(playlists);" | grep idx_playlists_order
```

**Criterio de éxito:**
- 3.1: respuesta JSON con `status: "ok"` o similar.
- 3.2: HTTP 401 (Unauthorized) — el endpoint existe, requiere JWT. Si es 404, el deploy no se propagó o el endpoint no se añadió.
- 3.3: ambas líneas devuelven valores (no vacío).

### 4. Verificación live en frontend (5 min)

Abrir `https://el-bunker-beige.vercel.app` con DevTools abierto:
- Console: sin errores rojos
- Network: `/api/playlists/reorder` responde 200 (con token) o 401 (sin token)
- UI: drag&drop de playlist cards en LISTS tab persiste tras F5

---

---

## 📝 CHECKLIST PARA FUTUROS MANUAL STEPS

Cuando añadas nuevos manual steps en un commit, **documentarlos en 5 lugares**:

1. **Commit message** (footer):
   ```
   feat: ...
   
   Manual steps:
   1. ALTER TABLE ...
   2. npx wrangler deploy
   ```

2. **`docs/Nucleo/CHANGELOG.md`** (sección "MANUAL STEPS REQUERIDOS TRAS ACTUALIZAR" con código SQL/comandos)

3. **`docs/legacy/PLIEGOS_HISTORIAL.md`** (fila nueva con descripción del pliego + commit hash + manual steps)

4. **`docs/Nucleo/SESION.md`** y **`docs/Nucleo/ESTADO.md`** (mención en la sesión que introduce los steps)

5. **Actualizar este archivo** (sección "ESTADO ACTUAL" al inicio) — mantener el contador en sync.

---

## 🔄 FLUJO TÍPICO DE SESIÓN CON MANUAL STEPS

```
┌──────────────────────────────────────────────────────────────┐
│ SESIÓN DE DESARROLLO (con cambios en worker.js o schema.sql) │
└──────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ ¿Cambiaste workers/worker.js?         │
        │   SÍ → necesitas wrangler deploy      │
        │   NO → solo frontend (Vercel auto)    │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ ¿Cambiaste workers/schema.sql?        │
        │   SÍ → ¿es cambio aditivo o NUKE?     │
        │     - Aditivo (ALTER/CREATE INDEX)    │
        │       → D1 execute --command          │
        │     - DROP/CREATE completo            │
        │       → NUKE_schema.sh (gated)        │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ ¿Cambiaste wrangler.toml?             │
        │   SÍ → wrangler deploy (lo incluye)  │
        │   - Nuevos bindings (D1/R2/KV)        │
        │   - Nuevas vars de entorno            │
        │   - Compatibility date                │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ ¿Añadiste secrets nuevos?             │
        │   SÍ → wrangler secret put <NAME>     │
        │   (no se commitean, se pasan por CLI) │
        └───────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │ Verificación post-deploy (5 min):     │
        │   - curl /api/health                  │
        │   - curl nuevo endpoint (401 ok)      │
        │   - PRAGMA schema check               │
        │   - Frontend smoke test               │
        └───────────────────────────────────────┘
```

---

## 📚 REFERENCIAS

- **Schema completo:** `workers/schema.sql` (16 tablas, source of truth)
- **Worker entry:** `workers/worker.js` (~24 endpoints REST)
- **Config CF:** `wrangler.toml`
- **Deploy histórico:** `docs/operacional/deploy_worker_cloudflare.txt`
- **Auditoría D1:** `docs/operacional/auditoria_d1_reparacion.txt`
- **Reglas sesión:** `docs/Nucleo/REGLAS.md` (ADR-015: bloques SEARCH completos)
- **Safety gates:** `docs/Nucleo/PROYECTO.md` sección "D1 MIGRATION FLOW"
- **Scripts deploy:** `tools/snapshot_d1.sh`, `tools/NUKE_schema.sh`, `tools/deploy_d1_migration.sh`

---

**Última actualización:** 14 Junio 2026 (S85 — WCAG romantiqueo + dead YT code)
**Próxima revisión:** cuando se acumulen 3+ manual steps o se cambie `wrangler.toml`

## 🚨 SAFETY GATES (S64)

**Estos gates existen porque perdimos 3 veces datos del usuario.** Respetar siempre.

| Script | Cuándo usar | Override |
|---|---|---|
| `tools/snapshot_d1.sh` | SIEMPRE antes de cualquier migración | (ninguno — aborta si falla) |
| `tools/NUKE_schema.sh` | SOLO reset total (desarrollo local con DB vacía) | Gate "NUKE" por stdin + auto-snapshot |
| `tools/deploy_d1_migration.sh` | PROHIBIDO — deprecated S64a | `DEPLOY_OK=1` solo para recovery con backup |
| `tools/migrate_drive_to_d1.py` | Solo si `tags D1 > JSON` (safety gate automático aborta) | `--force` solo para recovery |

**Documentación completa:** `docs/Nucleo/PROYECTO.md` sección "D1 MIGRATION FLOW".

---

## 📋 CHEAT-SHEET — Comandos wrangler

### D1 (database)

```bash
# Listar tablas
npx wrangler d1 execute el-bunker-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# Inspeccionar schema de una tabla
npx wrangler d1 execute el-bunker-db --remote --command="PRAGMA table_info(playlists);"

# Contar filas
npx wrangler d1 execute el-bunker-db --remote --command="SELECT COUNT(*) FROM tracks;"

# Query ad-hoc
npx wrangler d1 execute el-bunker-db --remote --command="SELECT id, name FROM playlists ORDER BY sort_order;"

# Backup completo (JSON)
npx wrangler d1 execute el-bunker-db --remote --command="SELECT * FROM tracks;" --json > tracks_backup.json
```

### R2 (storage)

```bash
# Listar objetos
npx wrangler r2 object list el-bunker-music --prefix="vault/photos/"

# Subir archivo
npx wrangler r2 object put el-bunker-music/path/to/file.mp3 --file=local.mp3

# Generar signed URL
npx wrangler r2 object get el-bunker-music/path/to/file.mp3 --signed-url

# Tamaño total
npx wrangler r2 bucket info el-bunker-music
```

### Worker

```bash
# Deploy a producción
npx wrangler deploy

# Deploy con nombre custom
npx wrangler deploy --name el-bunker-api-staging

# Tail logs en vivo
npx wrangler tail el-bunker-api --format=pretty

# Listar secrets
npx wrangler secret list

# Añadir/actualizar secret
npx wrangler secret put JWT_SECRET
# (te pide el valor por stdin)
```

### Desarrollo local

```bash
# Worker local (puerto 8787 por defecto)
npx wrangler dev

# Con D1 local (--local en lugar de --remote)
npx wrangler d1 execute el-bunker-db --local --command="SELECT * FROM tracks;"
```

---

## 🛠️ ROLLBACK PROCEDURES

### Si un D1 migration rompe algo

```bash
# 1. SIN built-in restore: tools/snapshot_d1.sh solo exporta, tools/migrate_drive_to_d1.py no acepta --snapshot/--restore.
#    Opciones reales:
#    A) D1 Time Travel (Cloudflare Dashboard > D1 > el-bunker-db > Settings > Restore) - automatico 7d Free / 30d paid
#    B) ALTER TABLE inverso manual (si solo se añadio 1 columna, revertir con DROP COLUMN)
#    C) Re-deploy Worker version anterior (cubre logica rota, no schema)

# 2. Re-deploy Worker versión anterior
git log --oneline -5 workers/worker.js   # encontrar commit anterior
git checkout <commit-anterior> -- workers/worker.js
npx wrangler deploy
git checkout HEAD -- workers/worker.js  # restaurar working tree
```

### Si un Worker deploy rompe algo

```bash
# Rollback Worker a versión anterior via Cloudflare Dashboard:
# Workers & Pages > el-bunker-api > Deployments > "Rollback to this deployment"
# (disponible en plan Free también — últimos 100 deploys)
# NO usar `wrangler rollback` — requiere plan de pago
```

### Si se pierde acceso al Worker

```bash
# Re-autenticar
npx wrangler login

# Verificar cuenta
npx wrangler whoami
```
