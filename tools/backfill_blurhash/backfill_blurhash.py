#!/usr/bin/env python3
# tools/backfill_blurhash/backfill_blurhash.py
# Backfill de files.blurhash para el-bunker (tarjeta A6).
#
# Flujo por file:
#   1. SELECT de files con blurhash IS NULL en D1 remota (solo lectura).
#   2. Descarga el objeto R2 (npx wrangler r2 object get --remote).
#   3. Decodifica con PIL, reduce a 32x32, calcula blurhash 4x3 (blurhash.py).
#   4. dry-run (default): imprime los UPDATE que haria, NO escribe nada.
#      --commit: escribe en D1 remota. GATE: solo Edu, requiere confirmacion
#      interactiva y toma snapshot fino de la columna antes de escribir.
#
# La escritura contra D1 remota es acto de Edu (contrato A6). Este script nunca
# se ejecuta con --commit salvo que Edu lo lance en persona.
#
# Uso:
#   python3 tools/backfill_blurhash/backfill_blurhash.py --limit 3            # dry-run
#   python3 tools/backfill_blurhash/backfill_blurhash.py --limit 3 --commit   # Edu
#   python3 tools/backfill_blurhash/backfill_blurhash.py --all                # dry-run total

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from blurhash import encode

DB_NAME = "el-bunker-db"
BUCKET = "el-bunker-music"
COMP_X = 4
COMP_Y = 3

WRANGLER = shutil.which("npx.cmd") or shutil.which("npx")
if not WRANGLER:
    print("FATAL: npx no esta en PATH", file=sys.stderr)
    sys.exit(1)


def run_wrangler_d1(command, timeout=120):
    """Ejecuta wrangler d1 execute --remote --json. Devuelve la lista de results."""
    cmd = [WRANGLER, "wrangler", "d1", "execute", DB_NAME, "--remote", "--json",
           f"--command={command}"]
    r = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=timeout)
    data = json.loads(r.stdout)
    return data[0].get("results", []) if data else []


def run_wrangler_d1_file(sql_path):
    """Como run_wrangler_d1 pero con --file (UPDATEs largos >32K argv de Windows)."""
    cmd = [WRANGLER, "wrangler", "d1", "execute", DB_NAME, "--remote", "--json",
           f"--file={sql_path}"]
    r = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=180)
    data = json.loads(r.stdout)
    return data[0].get("results", []) if data else []


def fetch_null_files(limit):
    sql = ("SELECT id, r2_key, size_bytes FROM files "
           "WHERE blurhash IS NULL ORDER BY id")
    if limit:
        sql += f" LIMIT {limit}"
    return run_wrangler_d1(sql)


def snapshot_blurhash(rows, out_path):
    """Snapshot fino de la columna blurhash para las filas objetivo (rollback)."""
    snap = {
        "_meta": {
            "tool": "tools/backfill_blurhash/backfill_blurhash.py",
            "snapshot_at": datetime.now(timezone.utc).isoformat(),
            "db": DB_NAME,
            "nota": "valores de files.blurhash ANTES del backfill; rollback = UPDATE files SET blurhash=<valor> WHERE id=<id>",
        },
        "rows": [{"id": r["id"], "blurhash": None, "r2_key": r["r2_key"]} for r in rows],
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(snap, f, indent=2, ensure_ascii=False)
    return out_path


def build_update_sql(pairs):
    """Un solo UPDATE con CASE WHEN id THEN hash ... WHERE id IN (...)."""
    whens = " ".join(
        f"WHEN '{i}' THEN '{h}'" for i, h in pairs
    )
    ids = ", ".join(f"'{i}'" for i, _ in pairs)
    return f"UPDATE files SET blurhash = CASE id {whens} END WHERE id IN ({ids});"


def compute_blurhash(jpg_path):
    from PIL import Image

    with Image.open(jpg_path) as im:
        rgb = im.convert("RGB").resize((32, 32), Image.LANCZOS)
        data = rgb.tobytes()  # flat RGB fila-mayor
    rgba = []
    for i in range(0, len(data), 3):
        rgba.extend([data[i], data[i + 1], data[i + 2], 255])
    return encode(rgba, 32, 32, COMP_X, COMP_Y)


def main():
    ap = argparse.ArgumentParser(description="Backfill files.blurhash (A6)")
    ap.add_argument("--limit", type=int, default=None,
                    help="procesar solo N files (dry-run de prueba)")
    ap.add_argument("--all", action="store_true",
                    help="procesar todos los files con blurhash IS NULL")
    ap.add_argument("--commit", action="store_true",
                    help="ESCRIBIR en D1 remota. Acto de Edu; pide confirmacion.")
    ap.add_argument("--snapshots-dir", default="tools/snapshots",
                    help="directorio para el snapshot fino (default: tools/snapshots)")
    args = ap.parse_args()

    if args.all and args.limit:
        print("FATAL: --all y --limit son excluyentes", file=sys.stderr)
        sys.exit(1)
    limit = None if args.all else args.limit
    if limit is None and not args.all:
        limit = 100  # dry-run seguro por defecto; --all para el barrido completo

    print("== BACKFILL BLURHASH (A6) ==")
    print(f"  DB:    {DB_NAME} (remota, solo lectura en dry-run)")
    print(f"  R2:    {BUCKET} (--remote)")
    print(f"  Modo:  {'COMMIT (ESCRITURA D1 REMOTA)' if args.commit else 'DRY-RUN (no escribe)'}")
    print(f"  Files: {'todos (blurhash IS NULL)' if args.all else f'limit {limit}'}")
    print()

    rows = fetch_null_files(limit)
    total = len(rows)
    print(f"  Seleccionados: {total} files con blurhash IS NULL")
    if total == 0:
        print("  Nada que hacer.")
        return 0
    print()

    snap_path = None
    if args.commit:
        os.makedirs(args.snapshots_dir, exist_ok=True)
        snap_path = os.path.join(
            args.snapshots_dir, f"blurhash_fino_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        snapshot_blurhash(rows, snap_path)
        print(f"  Snapshot fino guardado: {snap_path}")
        print()
        print("  *** GATE EDU: esto escribe en D1 REMOTA. ***")
        answer = input("  Confirmo que Edu autoriza (escribe 'edu-ok'): ").strip()
        if answer != "edu-ok":
            print("  Abortado. Nada escrito.")
            return 1

    resultados = []
    fallos = 0
    with tempfile.TemporaryDirectory(prefix="bh_") as tmp:
        for i, row in enumerate(rows, 1):
            fid, key = row["id"], row["r2_key"]
            tmp_jpg = os.path.join(tmp, f"{fid[:8]}.jpg")
            print(f"  [{i}/{total}] {key}", flush=True)
            try:
                dl = subprocess.run(
                    [WRANGLER, "wrangler", "r2", "object", "get", f"{BUCKET}/{key}",
                     "--remote", f"--file={tmp_jpg}"],
                    capture_output=True, text=True, timeout=180,
                )
                if dl.returncode != 0 or not os.path.exists(tmp_jpg):
                    raise RuntimeError(f"descarga R2 fallo: {dl.stderr.strip()[-200:]}")
                h = compute_blurhash(tmp_jpg)
            except Exception as e:
                fallos += 1
                print(f"      ERROR: {e}")
                continue
            resultados.append((fid, h))
            print(f"      blurhash={h}")
        print()

    if args.commit and resultados:
        sql = build_update_sql(resultados)
        print(f"  Ejecutando UPDATE ({len(resultados)} filas)...", flush=True)
        # SQL largo (>32K argv en Windows): se escribe a fichero temporal y se
        # pasa con --file; el dry-run solo lo imprime por consola.
        with tempfile.NamedTemporaryFile(
            "w", suffix=".sql", encoding="utf-8", delete=False
        ) as f:
            f.write(sql)
            sql_path = f.name
        try:
            run_wrangler_d1_file(sql_path)
        finally:
            os.unlink(sql_path)
        ids = ", ".join(f"'{i}'" for i, _ in resultados)
        checks = run_wrangler_d1(
            f"SELECT COUNT(*) AS total, SUM(blurhash IS NULL) AS nulos FROM files WHERE id IN ({ids})"
        )
        c = checks[0]
        print(f"  Verificacion: {c['total']} filas, {c['nulos']} nulas restantes")
        print(f"  Snapshot fino (rollback): {snap_path}")

    print()
    print("== RESUMEN ==")
    print(f"  Procesados: {total}")
    print(f"  Con hash:   {len(resultados)}")
    print(f"  Fallos:     {fallos}")
    if not args.commit:
        print("  Escritura:  NINGUNA (dry-run). Edu lanza con --commit tras snapshot_d1.sh.")
        if resultados:
            if len(resultados) <= 30:
                print("  UPDATE preparado: ")
                print("    " + build_update_sql(resultados))
            else:
                print(f"  UPDATE preparado: {len(resultados)} filas (no impreso; "
                      "--commit lo ejecuta desde fichero SQL).")
    else:
        print("  Escritura:  ejecutada contra D1 remota (acto Edu).")
    return 0


if __name__ == "__main__":
    sys.exit(main())