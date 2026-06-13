#!/bin/bash
# ============================================================
#  deploy_d1_migration.sh
#  Deploy completo: Schema D1 remoto → Tags → Worker → Migración
#  Uso: bash tools/deploy_d1_migration.sh
#  Requiere: wrangler autenticado (npx wrangler login)
# ============================================================
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       EL BÚNKER — DEPLOY D1 + MIGRACIÓN                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── 0. Validar archivo JSON ────────────────────────────────
echo "📁 0. Verificando archivo de datos..."
if [ ! -f tools/the_vault_database.json ]; then
  echo "   ❌ No se encuentra tools/the_vault_database.json"
  echo "   Ejecuta primero: npm run backup  (o exporta el JSON desde la app)"
  exit 1
fi
echo "   ✅ Archivo encontrado: tools/the_vault_database.json"
echo ""

# ─── 1. Verificar autenticación ──────────────────────────────
echo "🔐 1. Verificando autenticación en Cloudflare..."
AUTH_CHECK=$(npx wrangler whoami 2>&1 || true)
if echo "$AUTH_CHECK" | grep -q "not authenticated"; then
  echo "   ⚠️  No estás autenticado. Abriendo login..."
  npx wrangler login
  echo ""
  # Verificar de nuevo
  AUTH_CHECK=$(npx wrangler whoami 2>&1 || true)
  if echo "$AUTH_CHECK" | grep -q "not authenticated"; then
    echo "   ❌ No se pudo autenticar. Saliendo."
    exit 1
  fi
fi
echo "   ✅ Autenticado correctamente"
echo ""

# ─── 2. Aplicar schema a D1 remoto ───────────────────────────
echo "🗄️  2. Aplicando schema.sql a D1 remota (el-bunker-db)..."
npx wrangler d1 execute el-bunker-db --file=workers/schema.sql --remote
echo "   ✅ Schema aplicado (16 tablas creadas)"
echo ""

# ─── 3. Insertar tags faltantes ──────────────────────────────
echo "🏷️  3. Insertando tags faltantes (slowed, nightcore, etc.)..."
npx wrangler d1 execute el-bunker-db --remote --command="
INSERT OR IGNORE INTO tags (id, namespace, label, icon, color, created_by, sort_order) VALUES
('slowed','music','Slowed','◉','#89CFF0','admin',10),
('nightcore','music','Nightcore','◉','#FF69B4','admin',11),
('videojuegos','music','Videojuegos','◉','#FFD700','admin',12),
('chill','music','Chill','◉','#98FB98','admin',13),
('reggaeton','music','Reggaeton','◉','#FF4500','admin',14),
('jungle','music','Jungle','◉','#228B22','admin',15),
('ambient','music','Ambient','◉','#87CEEB','admin',16);
"
echo "   ✅ Tags insertados (11 tags total: 4 seed + 7 nuevas)"
echo ""

# ─── 4. Verificar tablas ─────────────────────────────────────
echo "🔎 4. Verificando tablas en D1 remota..."
npx wrangler d1 execute el-bunker-db --remote --command="
SELECT 'tracks' as entidad, COUNT(*) as total FROM tracks
UNION ALL SELECT 'playlists', COUNT(*) FROM playlists
UNION ALL SELECT 'tags', COUNT(*) FROM tags
UNION ALL SELECT 'users', COUNT(*) FROM users;
"
echo ""

# ─── 5. Desplegar Worker ─────────────────────────────────────
echo "🌐 5. Desplegando Worker API..."
npx wrangler deploy workers/worker.js
echo "   ✅ Worker desplegado"
echo ""

# ─── 6. Generar JWT y migrar datos ───────────────────────────
JWT_SECRET="${JWT_SECRET:-dev-secret-change-me}"
echo "🔑 6. Generando JWT admin para migración..."
if [ "$JWT_SECRET" != "dev-secret-change-me" ]; then
  echo "   ⚠️  Usando JWT_SECRET personalizado (no el default)"
fi
JWT=$(python3 -c "
import base64, json, hmac, hashlib, time
import os
def b64url(d): return base64.urlsafe_b64encode(d).rstrip(b'=').decode()
secret = os.environ.get('JWT_SECRET', 'dev-secret-change-me')
hdr = b64url(json.dumps({'alg':'HS256','typ':'JWT'}).encode())
pld = b64url(json.dumps({'sub':'admin','email':'thebunker.admin@gmail.com','exp':int(time.time())+86400}).encode())
sig = b64url(hmac.new(secret.encode(), f'{hdr}.{pld}'.encode(), hashlib.sha256).digest())
print(f'{hdr}.{pld}.{sig}')
")
echo "   ✅ JWT generado (válido 24h)"
echo ""

echo "📦 7. Migrando datos desde JSON a D1 remota..."
WORKER_API_URL=https://el-bunker-api.thebunker-admin.workers.dev \
  python3 tools/migrate_drive_to_d1.py \
  --file tools/the_vault_database.json \
  --jwt "$JWT"
echo ""

# ─── 8. Resumen final ────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOY COMPLETADO                                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  API:        https://el-bunker-api.thebunker-admin.workers.dev"
echo "  D1 DB:      el-bunker-db"
echo "  R2 Bucket:  el-bunker-music"
echo ""
echo "  Para verificar:"
echo "    curl https://el-bunker-api.thebunker-admin.workers.dev/api/health"
echo ""

# Guardar JWT en variable por si se necesita re-ejecutar migración
echo "export WORKER_JWT=\"$JWT\"" > .env.worker_jwt
echo "  💾 JWT guardado en .env.worker_jwt (source .env.worker_jwt para recargar)"
echo ""
