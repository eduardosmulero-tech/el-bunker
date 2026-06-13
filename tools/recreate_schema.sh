#!/bin/bash
# recreate_schema.sh — Dropea todas las tablas y recrea el schema D1 completo
# ⚠️  PELIGRO: este script BORRA TODOS LOS DATOS de D1.
#    Solo usar en setup inicial o recovery con snapshot conocido.
#    (S64 — gate "NUKE" añadido tras 3 pérdidas de datos al migrar)
# Uso: bash tools/recreate_schema.sh

set -e
cd "$(dirname "$0")/.."

DB_NAME="el-bunker-db"

# ── NUKE gate: requiere confirmación explícita por stdin ──────────────
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ⚠️   ADVERTENCIA: BORRADO TOTAL DE DATOS               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Este script va a ELIMINAR las 16 tablas de $DB_NAME."
echo "  No se puede deshacer. Si hay datos reales, se perderán."
echo ""
echo "  ANTES de continuar, verifica:"
echo "  1) ¿Tienes un snapshot bueno? (bash tools/snapshot_d1.sh)"
echo "  2) ¿Es la DB correcta?"
echo "  3) ¿Es setup inicial o recovery con backup?"
echo ""
read -p "  Escribe NUKE para confirmar (Enter para abortar): " confirm
if [ "$confirm" != "NUKE" ]; then
  echo ""
  echo "  Abortado. No se modificó nada."
  exit 1
fi

# ── Auto-snapshot pre-NUKE (S64 — rollback point) ──────────────
SNAPSHOT_PATH="tools/snapshots/pre_nuke_$(date +%Y%m%d_%H%M%S).json"
echo "  📸 Creando snapshot pre-NUKE → $SNAPSHOT_PATH"
if ! bash tools/snapshot_d1.sh "$SNAPSHOT_PATH"; then
  echo ""
  echo "  ❌ Snapshot falló. Abortando NUKE (no se modificó nada)."
  echo "     Si wrangler no está autenticado: npx wrangler login"
  exit 1
fi
echo ""

echo "🗑️  Borrando tablas existentes..."
npx wrangler d1 execute el-bunker-db --remote \
  --command="DROP TABLE IF EXISTS capsule_items; DROP TABLE IF EXISTS time_capsules; DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS queue_items; DROP TABLE IF EXISTS drops; DROP TABLE IF EXISTS playlist_tracks; DROP TABLE IF EXISTS playlists; DROP TABLE IF EXISTS track_tags; DROP TABLE IF EXISTS files; DROP TABLE IF EXISTS tracks; DROP TABLE IF EXISTS entry_tags; DROP TABLE IF EXISTS tags; DROP TABLE IF EXISTS entries; DROP TABLE IF EXISTS eras; DROP TABLE IF EXISTS app_config; DROP TABLE IF EXISTS users;"

echo ""
echo "🏗️  Recreando schema completo..."
npx wrangler d1 execute el-bunker-db --remote \
  --file=workers/schema.sql

echo ""
echo "✅ Schema recreado. Verificando..."
npx wrangler d1 execute el-bunker-db \
  --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>&1 | grep -oP '"[^"]*"' | tr -d '"'
