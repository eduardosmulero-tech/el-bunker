#!/usr/bin/env python3
"""
download_playlist.py — el_bunker · Descarga playlists de YouTube a D:\\Musica
--------------------------------------------------------------------------------
Baja todos los videos de una playlist de YouTube como MP3, crea una carpeta
con el nombre de la playlist, y guarda cada track con:
  - Numeración (01, 02, 03…)
  - Metadatos ID3 (título, artista)
  - Portada incrustada (thumbnail del video)
  - Formato idéntico a las carpetas existentes en D:\\Musica

Requisitos:
    pip install yt-dlp mutagen

Uso:
    python tools/download_playlist.py "URL_DE_LA_PLAYLIST"

    # Con nombre de carpeta custom:
    python tools/download_playlist.py "URL" --folder "Mi Playlist"

    # Solo simular (sin descargar):
    python tools/download_playlist.py "URL" --dry-run

Salida:
    D:\\Musica\\<nombre_playlist>\\
        01 - Artista - Título.mp3
        02 - Artista - Título.mp3
        ...
"""

import os
import sys
import argparse
import subprocess
import re
import json
from pathlib import Path
from datetime import datetime

try:
    from mutagen.mp3 import MP3
    from mutagen.id3 import ID3, APIC, TIT2, TPE1
except ImportError:
    print("ERROR: Instala mutagen con: pip install mutagen")
    sys.exit(1)

# Auto-detectar WSL vs Windows
if Path("/mnt/d/Musica").exists():
    MUSIC_ROOT = Path("/mnt/d/Musica")
elif Path(r"D:\Musica").exists():
    MUSIC_ROOT = Path(r"D:\Musica")
else:
    MUSIC_ROOT = Path(r"D:\Musica")  # default, fallara con error claro


def check_ytdlp():
    """Verifica que yt-dlp esté instalado."""
    try:
        subprocess.run(["yt-dlp", "--version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def install_ytdlp():
    """Intenta instalar yt-dlp."""
    print("yt-dlp no encontrado. Instalando...")
    # Probar con --break-system-packages (Ubuntu/Debian PEP 668) o pipx
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "yt-dlp", "--break-system-packages"],
            check=True, capture_output=True, text=True,
        )
    except subprocess.CalledProcessError:
        # Fallback: intentar con pipx
        print("  pip falló, intentando con pipx...")
        subprocess.run(["pipx", "install", "yt-dlp"], check=True)
    print("yt-dlp instalado correctamente.\n")


def get_playlist_name(url):
    """Obtiene el nombre de la playlist desde YouTube (sin descargar)."""
    result = subprocess.run(
        ["yt-dlp", "--flat-playlist", "--print", "%(playlist_title)s", url],
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0 or not result.stdout.strip():
        # Fallback: usar el ID de la playlist
        match = re.search(r"list=([^&]+)", url)
        if match:
            return f"playlist_{match.group(1)[:12]}"
        return f"playlist_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    return result.stdout.strip().split("\n")[0]


def sanitize_folder(name):
    """Limpia caracteres no válidos para nombres de carpeta en Windows."""
    # Reemplaza caracteres ilegales
    name = re.sub(r'[<>:"/\\|?*]', "", name)
    # Quita espacios múltiples
    name = re.sub(r"\s+", " ", name)
    # Quita espacios al inicio/final
    name = name.strip()
    # Límite de longitud para Windows
    if len(name) > 200:
        name = name[:200]
    return name


def download_playlist(url, folder_name, dry_run=False):
    """Descarga la playlist completa con yt-dlp."""
    folder_path = MUSIC_ROOT / folder_name

    if dry_run:
        print(f"  [DRY-RUN] Se crearía: {folder_path}")
    else:
        folder_path.mkdir(parents=True, exist_ok=True)
        print(f"  Carpeta: {folder_path}")

    # Template de salida: 01 - Artista - Título.%(ext)s
    output_template = str(folder_path / "%(autonumber)02d - %(artist)s - %(title)s.%(ext)s")

    cmd = [
        "yt-dlp",
        # Máxima calidad: mejor stream de audio + conversión a MP3 320kbps
        "-f", "bestaudio",
        "-x", "--audio-format", "mp3",
        "--audio-quality", "0",
        # Metadatos
        "--embed-metadata",
        "--embed-thumbnail",
        # Thumbnail a máxima resolución (incrustada en el MP3)
        "--convert-thumbnails", "jpg",
        # Numeración automática
        "--autonumber-start", "1",
        # Template de salida
        "-o", output_template,
        # No sobrescribir archivos existentes
        "--no-overwrites",
    ]

    if dry_run:
        cmd.append("--skip-download")
    else:
        # Barra de progreso compacta
        cmd.extend(["--newline", "--progress"])

    cmd.append(url)

    print(f"\n  ⏬ Descargando playlist: {folder_name}")
    print(f"  {'[DRY-RUN] ' if dry_run else ''}Comando: yt-dlp -x --audio-format mp3 ...")
    print()

    try:
        result = subprocess.run(cmd, capture_output=False, text=True)
        if result.returncode != 0:
            print(f"\n  ⚠️ yt-dlp terminó con código {result.returncode}")
            return False
    except KeyboardInterrupt:
        print("\n\n  ⏹️ Descarga interrumpida por el usuario.")
        return False

    return True


def verify_tracks(folder_path):
    """Verifica y reporta los tracks descargados."""
    mp3s = sorted(folder_path.glob("*.mp3"))
    if not mp3s:
        return []

    print(f"\n  📁 {folder_path.name} — {len(mp3s)} tracks:")
    tracks = []
    for mp3 in mp3s:
        try:
            audio = MP3(mp3)
            tags = ID3(mp3)
            title = str(tags.get("TIT2", ""))
            artist = str(tags.get("TPE1", ""))
            duration = int(audio.info.length) if audio.info else 0
            has_cover = "APIC:" in tags or tags.get("APIC:") is not None

            cover = "🖼️" if has_cover else "  "
            print(f"    {cover} {mp3.name[:70]}")
            print(f"       {artist} — {title} · {duration // 60}:{duration % 60:02d}")

            tracks.append({
                "file": str(mp3),
                "title": title,
                "artist": artist,
                "duration": duration,
                "has_cover": has_cover,
            })
        except Exception as e:
            print(f"    ⚠️ {mp3.name[:70]} — error leyendo metadatos: {e}")

    return tracks


def main():
    ap = argparse.ArgumentParser(
        description="Descarga playlists de YouTube a D:\\Musica — el_bunker"
    )
    ap.add_argument("url", help="URL de la playlist de YouTube")
    ap.add_argument("--folder", default=None, help="Nombre de carpeta (default: nombre de la playlist)")
    ap.add_argument("--dry-run", action="store_true", help="Simula sin descargar")
    args = ap.parse_args()

    # ── Verificar yt-dlp ────────────────────────────────────────
    if not check_ytdlp():
        install_ytdlp()

    # ── Verificar D:\Musica ─────────────────────────────────────
    if not args.dry_run and not MUSIC_ROOT.exists():
        print(f"ERROR: No se encuentra {MUSIC_ROOT}")
        print("  ¿Está conectado el disco externo?")
        sys.exit(1)

    # ── Obtener nombre de la playlist ───────────────────────────
    print()
    print("=" * 62)
    print("  DOWNLOAD PLAYLIST — el_bunker")
    print(f"  Raíz:  {MUSIC_ROOT}")
    print(f"  URL:   {args.url[:80]}...")
    if args.dry_run:
        print("  Modo:  DRY-RUN")
    print("=" * 62)

    if args.folder:
        folder_name = sanitize_folder(args.folder)
        print(f"\n  📛 Carpeta (custom): {folder_name}")
    else:
        print(f"\n  🔍 Obteniendo nombre de la playlist...")
        folder_name = sanitize_folder(get_playlist_name(args.url))
        print(f"  📛 Playlist: {folder_name}")

    # ── Verificar si ya existe ──────────────────────────────────
    folder_path = MUSIC_ROOT / folder_name
    if folder_path.exists() and not args.dry_run:
        existing = list(folder_path.glob("*.mp3"))
        if existing:
            print(f"\n  ⚠️  La carpeta ya existe con {len(existing)} tracks.")
            print(f"  Los archivos nuevos se añadirán sin sobrescribir (--no-overwrites).")

    # ── Descargar ───────────────────────────────────────────────
    if not download_playlist(args.url, folder_name, args.dry_run):
        print("\n  ❌ La descarga falló.")
        sys.exit(1)

    # ── Verificar resultado ─────────────────────────────────────
    if not args.dry_run:
        tracks = verify_tracks(folder_path)
        print()
        print("=" * 62)
        print(f"  ✅ {len(tracks)} tracks descargados en:")
        print(f"  {folder_path}")
        print("=" * 62)
        if tracks:
            covers = sum(1 for t in tracks if t["has_cover"])
            print(f"  Portadas: {covers}/{len(tracks)}")
            total_dur = sum(t["duration"] for t in tracks)
            print(f"  Duración total: {total_dur // 3600}h {(total_dur % 3600) // 60}m")
        print()
        print("  Siguiente paso:")
        print("    python tools/ingest_music.py")
    else:
        print()
        print("=" * 62)
        print("  Dry-run completado. Para descargar de verdad:")
        print(f"    python tools/download_playlist.py \"{args.url}\"")
        print("=" * 62)
    print()


if __name__ == "__main__":
    main()
