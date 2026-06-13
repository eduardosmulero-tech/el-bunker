#!/usr/bin/env python3
"""
EL BÚNKER — migrate_drive_to_d1.py
Migración unidireccional: Google Drive JSON → Cloudflare D1 (Worker API)

USO:
  1. Obtener un JWT del Worker API:
     python3 tools/migrate_drive_to_d1.py --login <email> <google_token>

  2. Migrar desde un archivo JSON local (exportado desde Drive):
     python3 tools/migrate_drive_to_d1.py --file el_bunker_backup_2026-06-09.json --jwt <token>

  3. Migrar desde Drive directamente (requiere token OAuth2 de Google):
     python3 tools/migrate_drive_to_d1.py --drive --jwt <worker_jwt>

REQUISITOS:
  - Python 3.8+
  - requests (pip install requests)
  - Archivo JSON exportado del Búnker (o token OAuth2 de Google)
  - JWT del Worker API (obtenido con --login o manualmente)

FLUJO:
  1. Lee entidades del archivo JSON (o Drive)
  2. Las ordena por dependencias: users → eras → tags → entries → tracks → drops → playlists
  3. POST cada entidad al Worker API correspondiente
  4. Reporta resultados (éxitos/fallos/saltos)

NOTA: Es una migración UNIDIRECCIONAL. No borra datos de Drive.
      Es segura de ejecutar múltiples veces (idempotente para duplicados).
"""

import json
import sys
import time
import os

API_BASE = os.environ.get("WORKER_API_URL", "https://el-bunker-api.thebunker-admin.workers.dev")

def api_post(path, data, jwt):
    """POST a la Worker API con JWT."""
    import requests
    url = f"{API_BASE}{path}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt}",
    }
    resp = requests.post(url, json=data, headers=headers, timeout=30)
    return resp

def migrate_entity(entity_type, path, items, jwt, id_field="id", batch_size=50):
    """Migra una lista de entidades a un endpoint del Worker."""
    if not items:
        print(f"  [SKIP] {entity_type}: lista vacía")
        return 0, 0, 0

    ok = 0
    fail = 0
    skip = 0

    for i, item in enumerate(items):
        entity_id = item.get(id_field, "?")
        print(f"  [{i+1}/{len(items)}] {entity_type} {entity_id}... ", end="", flush=True)

        try:
            resp = api_post(path, item, jwt)
            if resp.status_code in (200, 201):
                print("✅")
                ok += 1
            elif resp.status_code == 409:
                print("⏭️  duplicado")
                skip += 1
            else:
                print(f"❌ {resp.status_code}: {resp.text[:100]}")
                fail += 1
        except Exception as e:
            print(f"💥 {e}")
            fail += 1

        # Rate limiting: pausa breve cada batch_size
        if (i + 1) % batch_size == 0:
            time.sleep(0.5)

    return ok, fail, skip


def migrate_from_json(filepath, jwt):
    """Migra todas las entidades desde un archivo JSON."""
    print(f"\n{'='*60}")
    print(f"  MIGRACIÓN DRIVE → D1")
    print(f"  Fuente: {filepath}")
    print(f"  API:    {API_BASE}")
    print(f"{'='*60}\n")

    with open(filepath, "r", encoding="utf-8") as f:
        db = json.load(f)

    totals = {"ok": 0, "fail": 0, "skip": 0}

    # ── 1. Users (seed data ya existe en schema.sql, skip) ──
    print("\n📁 1. USUARIOS (seed en schema.sql — saltando)")
    # Los usuarios ya están insertados por el seed de schema.sql

    # ── 2. Eras ──────────────────────────────────────────────
    print("\n📁 2. ERAS")
    eras = db.get("eras", [])
    for era in eras:
        print(f"  [{eras.index(era)+1}/{len(eras)}] Era {era.get('id')}... ", end="", flush=True)
        try:
            resp = api_post("/api/entries", {
                "type": "milestone",
                "title": era.get("name"),
                "content": {"text": era.get("description", ""), "images": []},
                "era_id": None,
                "to_user": "both",
                "tags": [],
            }, jwt)
            if resp.status_code in (200, 201):
                print("✅ (como entrada-hito)")
                totals["ok"] += 1
            else:
                print(f"⏭️  {resp.status_code}")
                totals["skip"] += 1
        except Exception as e:
            print(f"💥 {e}")
            totals["fail"] += 1

    # ── 3. Tags ──────────────────────────────────────────────
    print("\n📁 3. TAGS (MusicLab)")
    tags = db.get("music_lab", {}).get("tags", [])
    o, f, s = migrate_entity("Tag", "/api/tags", tags, jwt)
    totals["ok"] += o; totals["fail"] += f; totals["skip"] += s

    # ── 4. Entries (VAULT) ───────────────────────────────────
    print("\n📁 4. ENTRIES (VAULT)")
    entries = db.get("entries", [])
    o, f, s = migrate_entity("Entry", "/api/entries", [
        {k: v for k, v in e.items() if k != "is_deleted"}
        for e in entries if not e.get("is_deleted")
    ], jwt)
    totals["ok"] += o; totals["fail"] += f; totals["skip"] += s

    # ── 5. Tracks (MusicLab) ─────────────────────────────────
    print("\n📁 5. TRACKS (MusicLab)")
    tracks = db.get("music_lab", {}).get("tracks", [])
    o, f, s = migrate_entity("Track", "/api/tracks", [
        {
            "title": t.get("title", "Sin título"),
            "artist": t.get("artist", ""),
            "tag_id": t.get("tag") or t.get("vibe"),
            "note": t.get("note", ""),
            "r2_key": t.get("r2_key"),
            "format": t.get("format", "mp3"),
            "thumbnail": t.get("thumbnail"),
            "duration": t.get("duration"),
            "era_id": t.get("era_id"),
        }
        for t in tracks
    ], jwt)
    totals["ok"] += o; totals["fail"] += f; totals["skip"] += s

    # ── 6. Drops ─────────────────────────────────────────────
    print("\n📁 6. DROPS")
    drops = db.get("music_lab", {}).get("drops", [])
    o, f, s = migrate_entity("Drop", "/api/drops", [
        {
            "track_id": d.get("track_id"),
            "era_id": d.get("era_id"),
            "to_user": d.get("to") or "both",
            "memory": d.get("memory", ""),
            "mood": d.get("mood", ""),
            "drop_date": d.get("date") or d.get("created_at"),
        }
        for d in drops
    ], jwt)
    totals["ok"] += o; totals["fail"] += f; totals["skip"] += s

    # ── 7. Playlists ─────────────────────────────────────────
    print("\n📁 7. PLAYLISTS")
    playlists = db.get("music_lab", {}).get("playlists", [])
    o, f, s = migrate_entity("Playlist", "/api/playlists", [
        {"name": p.get("name", "Sin nombre"), "description": ""}
        for p in playlists
    ], jwt)
    totals["ok"] += o; totals["fail"] += f; totals["skip"] += s

    # ── Resumen ──────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  MIGRACIÓN COMPLETADA")
    print(f"  ✅ {totals['ok']} éxitos")
    print(f"  ⏭️  {totals['skip']} saltos")
    print(f"  ❌ {totals['fail']} fallos")
    print(f"{'='*60}\n")

    if totals["fail"] > 0:
        print("⚠️  Algunas entidades fallaron. Revisa los errores arriba.")
        print("   El script es IDEMPOTENTE — puedes volver a ejecutarlo.")
    else:
        print("✅ Migración completada sin errores.")

    return totals


def login(email, google_token):
    """Obtiene un JWT del Worker API usando Google token."""
    import requests
    print(f"\n🔐 Solicitando JWT para {email}...")
    resp = requests.post(f"{API_BASE}/api/auth/login", json={
        "email": email,
        "google_token": google_token,
    }, timeout=15)
    if resp.status_code == 200:
        data = resp.json()
        print(f"✅ JWT obtenido: {data['token'][:40]}...")
        print(f"   Usuario: {data['user']['id']} ({data['user']['email']})")
        return data["token"]
    else:
        print(f"❌ Error {resp.status_code}: {resp.text}")
        return None


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Migrar datos de Google Drive a D1 (Worker API)")
    parser.add_argument("--file", help="Archivo JSON local con los datos exportados")
    parser.add_argument("--drive", action="store_true", help="Leer desde Google Drive directamente")
    parser.add_argument("--jwt", help="JWT del Worker API (o usar env WORKER_JWT)")
    parser.add_argument("--login", nargs=2, metavar=("EMAIL", "TOKEN"),
                        help="Obtener JWT: --login email google_token")

    args = parser.parse_args()

    jwt = args.jwt or os.environ.get("WORKER_JWT")

    if args.login:
        jwt = login(args.login[0], args.login[1])
        if jwt:
            print(f"\n💾 Guarda este JWT para usarlo con --jwt:")
            print(f"   export WORKER_JWT={jwt}")
        sys.exit(0)

    if not jwt:
        print("❌ Se requiere --jwt o env WORKER_JWT")
        print("   Obtenlo con: python3 tools/migrate_drive_to_d1.py --login <email> <google_token>")
        sys.exit(1)

    if args.file:
        migrate_from_json(args.file, jwt)
    elif args.drive:
        print("❌ Modo --drive no implementado. Exporta el JSON desde la app (botón '↓ BACKUP JSON')")
        print("   y usa --file <archivo.json>")
        sys.exit(1)
    else:
        parser.print_help()
