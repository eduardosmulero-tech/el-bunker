"""
EL BUNKER - migrate_tags.py
Extrae tags del backup JSON y los inserta en D1 via Worker API.
Usa INSERT OR IGNORE - seguro re-ejecutar sin duplicados.
"""
import json
import sys
import requests

API_BASE = "https://el-bunker-api.thebunker-admin.workers.dev"

def load_tags(backup_path):
    with open(backup_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("music_lab", {}).get("tags", [])

def post_tag(tag, jwt):
    headers = {
        "Authorization": f"Bearer {jwt}",
        "Content-Type": "application/json",
    }
    body = {
        "id": tag["id"],
        "namespace": tag.get("namespace", "music"),
        "label": tag["label"],
        "icon": tag.get("icon", "\u25c9"),
        "color": tag.get("color", "#ffffff"),
    }
    resp = requests.post(f"{API_BASE}/api/tags", json=body, headers=headers, timeout=30)
    return resp.status_code, resp.json() if resp.ok else resp.text[:200]

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 tools/migrate_tags.py <JWT> [backup_path]")
        print("  JWT:        token de autenticacion del Worker API")
        print("  backup_path: ruta al backup JSON (default: tools/el_bunker_backup_2026-06-13.json)")
        sys.exit(1)

    jwt = sys.argv[1]
    backup_path = sys.argv[2] if len(sys.argv) > 2 else "tools/el_bunker_backup_2026-06-13.json"

    tags = load_tags(backup_path)
    if not tags:
        print("ERROR: No se encontraron tags en el backup.")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"  MIGRACION DE TAGS -> D1")
    print(f"  Fuente: {backup_path}")
    print(f"  API:    {API_BASE}")
    print(f"  Tags:   {len(tags)}")
    print(f"{'='*60}\n")

    ok = 0
    skipped = 0
    errors = 0

    for tag in tags:
        label = tag["label"]
        try:
            code, body = post_tag(tag, jwt)
            if code == 201:
                print(f"  OK [{tag['id']}] {label} - creado")
                ok += 1
            elif code == 200:
                print(f"  SKIP [{tag['id']}] {label} - ya existe")
                skipped += 1
            else:
                print(f"  ERR [{tag['id']}] {label} - HTTP {code}: {body}")
                errors += 1
        except Exception as e:
            print(f"  ERR [{tag['id']}] {label} - {e}")
            errors += 1

    print(f"\n{'='*60}")
    print(f"  Resultado: {ok} creados, {skipped} existentes, {errors} errores")
    print(f"{'='*60}\n")

    sys.exit(0 if errors == 0 else 1)

if __name__ == "__main__":
    main()
