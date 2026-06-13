#!/bin/bash
# tools/snapshot_d1.sh — Exporta el estado actual de D1 a un JSON
#
# Uso: bash tools/snapshot_d1.sh [output_path]
# Default: tools/snapshots/d1_YYYYMMDD_HHMMSS.json
#
# Por que: D1 es la fuente de verdad (post-S54). Antes de cualquier
# migracion desde JSON, haz un snapshot para tener rollback.
# (S64 — anadido tras 3 perdidas de datos al migrar;
#  S64a — abort non-zero si TODAS las queries fallan, para cerrar el
#  chain de auto-snapshot pre-NUKE en NUKE_schema.sh)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Args
if [ -z "$1" ]; then
  mkdir -p tools/snapshots
  OUT="tools/snapshots/d1_$(date +%Y%m%d_%H%M%S).json"
else
  OUT="$1"
  mkdir -p "$(dirname "$OUT")"
fi

DB_NAME="el-bunker-db"
# Tablas a exportar. Skip app_config (config) y events (audit append-only).
TABLES=(users eras tags entries drops tracks playlists files entry_tags track_tags playlist_tracks queue_items capsule_items time_capsules)

echo ""
echo "== D1 SNAPSHOT =="
echo "  DB:    $DB_NAME"
echo "  Out:   $OUT"
echo "  Tables: ${#TABLES[@]}"
echo ""

# Snapshot via Python (mas portable que parsear JSON de wrangler)
python3 - "$DB_NAME" "$OUT" "${TABLES[@]}" <<'PYEOF'
import subprocess, json, sys
from datetime import datetime, timezone

db_name = sys.argv[1]
out_path = sys.argv[2]
tables = sys.argv[3:]

snapshot = {
    "_meta": {
        "snapshot_at": datetime.now(timezone.utc).isoformat(),
        "db_name": db_name,
        "tool": "tools/snapshot_d1.sh",
        "tables": tables,
    },
    "counts": {},
    "data": {},
}

for t in tables:
    print(f"  Querying {t}...", flush=True)
    try:
        r = subprocess.run(
            ["npx", "wrangler", "d1", "execute", db_name, "--remote", "--json",
             f"--command=SELECT * FROM {t}"],
            capture_output=True, text=True, check=True, timeout=60,
        )
        result = json.loads(r.stdout)
        rows = result[0].get("results", []) if result else []
        snapshot["data"][t] = rows
        snapshot["counts"][t] = len(rows)
    except Exception as e:
        print(f"    WARN: {t} failed: {e}", file=sys.stderr)
        snapshot["data"][t] = []
        snapshot["counts"][t] = None

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(snapshot, f, indent=2, ensure_ascii=False)

total = sum(c for c in snapshot["counts"].values() if c is not None)
print()
print(f"  Saved {out_path}")
print(f"     Total rows: {total}")
for t, c in snapshot["counts"].items():
    flag = "ERR" if c is None else f"{c:>6}"
    print(f"     {t:<20} {flag}")

# S64 (review fix #1): abort non-zero si TODAS las queries fallaron.
# Si salimos con 0, el chain de NUKE_schema.sh auto-snapshot
# procede con el NUKE aunque el snapshot esté vacío.
if failed == len(tables):
    print()
    print("  FATAL: ALL table queries failed. Snapshot is INCOMPLETE.")
    print("  Usually means wrangler is not authenticated.")
    print("  Run: npx wrangler login, then re-run snapshot_d1.sh")
    sys.exit(1)
elif failed > 0:
    print()
    print(f"  WARN: {failed} table(s) failed. Snapshot is INCOMPLETE but usable.")
    print("  Re-run after: npx wrangler login")
PYEOF

echo ""
echo "  Para inspeccionar:  jq '.counts' $OUT"
echo "  Para restaurar (Sprint 8.3+): tools/restore_d1.sh $OUT"
