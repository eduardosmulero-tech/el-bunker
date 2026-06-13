#!/bin/bash
# recreate_schema.sh — Dropea todas las tablas y recrea el schema D1 completo
# Uso: bash tools/recreate_schema.sh

set -e
cd "$(dirname "$0")/.."

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
