#!/usr/bin/env python3
"""
pliego_apply.py — Aplicador automático de Pliegos · el_bunker
--------------------------------------------------------------
Uso:
    python pliego_apply.py <pliego.txt>
    python pliego_apply.py <pliego.txt> --root C:/ruta/al/proyecto
    python pliego_apply.py <pliego.txt> --dry-run

El script:
  1. Lee el pliego .txt (markdown tal como Claude lo genera).
  2. Extrae el archivo objetivo de la línea ARCHIVOS:.
  3. Parsea todos los bloques SEARCH/REPLACE en orden.
     — Funciona con o sin triple-backtick fence.
  4. Aplica todos los cambios en memoria — si alguno falla, no escribe nada.
  5. Hace backup automático antes de escribir.
  6. Pregunta confirmación para ejecutar git add + git commit.
  7. Ofrece borrar los backups tras el commit.

Notas:
  - Un pliego = un archivo (REGLAS.md). Si el pliego toca varios archivos,
    pasa el flag --archivo para indicar cuál procesar en esta ejecución.
  - SEARCH debe coincidir exactamente una vez. Si no coincide o es ambiguo,
    el script aborta sin modificar nada.
"""

import sys
import re
import shutil
import argparse
import subprocess
from pathlib import Path
from datetime import datetime


# ─── LECTURA ROBUSTA ────────────────────────────────────────────────────────

def read_file(path: Path) -> str:
    """Lee un archivo probando UTF-8, luego latin-1 como fallback."""
    for enc in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return path.read_text(encoding=enc)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"No se pudo leer {path} con ningún encoding conocido.")


# ─── PARSER ──────────────────────────────────────────────────────────────────

def parse_archivos(content: str) -> list[str]:
    """Extrae la lista de rutas de la línea ARCHIVOS: del pliego."""
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.upper().startswith("ARCHIVOS:"):
            parts = stripped.split(":", 1)[1].strip()
            return [p.strip() for p in parts.split(",") if p.strip()]
    return []


def parse_pliego_id(content: str, filename: str = "") -> str:
    """Extrae el identificador del pliego de la primera línea (PLIEGO-NNN).
    Fallback: usa el stem del nombre de archivo si el contenido no tiene línea PLIEGO-."""
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.upper().startswith("PLIEGO-"):
            token = stripped.split()[0] if stripped.split() else stripped
            # Limpiar guiones bajos y extensión del token si viene del filename
            return token.rstrip(":")
    # Fallback: nombre del archivo sin extensión, normalizado
    if filename:
        stem = Path(filename).stem.upper()
        if stem.startswith("PLIEGO-"):
            return stem
    return "PLIEGO-XXX"

SEARCH/REPLACE 2 — pasar filename a parse_pliego_id


def parse_cambio(content: str) -> str:
    """Extrae la descripción del campo CAMBIO: del pliego (primera línea)."""
    lines = content.splitlines()
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.upper().startswith("CAMBIO:"):
            desc = stripped.split(":", 1)[1].strip()
            # Si la descripción continúa en líneas siguientes con sangría, las agrega
            for j in range(i + 1, len(lines)):
                next_line = lines[j]
                # Línea de continuación: empieza con espacio/tab y no es una clave nueva
                if next_line.startswith((" ", "\t")) and ":" not in next_line.split()[0] if next_line.split() else False:
                    desc += " " + next_line.strip()
                else:
                    break
            # Normaliza espacios múltiples
            return " ".join(desc.split())
    return "descripción"


def _extract_pair(block: str) -> tuple[str, str] | None:
    """
    Dado un bloque de texto que contiene SEARCH: y REPLACE:,
    extrae el par (search_text, replace_text).
    """
    block = block.replace("\r\n", "\n").replace("\r", "\n")

    if "SEARCH:" not in block or "REPLACE:" not in block:
        return None

    search_marker  = "SEARCH:\n"
    replace_marker = "\nREPLACE:\n"

    si = block.find(search_marker)
    ri = block.find(replace_marker)

    if si == -1 or ri == -1 or ri <= si:
        return None

    search_text  = block[si + len(search_marker): ri].rstrip("\n")
    replace_text = block[ri + len(replace_marker):].rstrip("\n")

    if not search_text:
        return None

    return (search_text, replace_text)


def parse_pairs(content: str) -> list[tuple[str, str]]:
    """
    Extrae todos los pares (search, replace) del pliego.

    Estrategia dual:
      1. Busca bloques dentro de triple-backtick fences (``` ... ```).
      2. Si no encuentra ninguno, busca directamente líneas SEARCH: / REPLACE:
         en el texto plano (pliego guardado sin formato markdown).
    """
    pairs = []
    content_normalized = content.replace("\r\n", "\n").replace("\r", "\n")

    # ── Estrategia 1: bloques con fences ─────────────────────────────────────
    code_blocks = re.findall(r"```[^\n]*\n(.*?)```", content_normalized, re.DOTALL)
    for block in code_blocks:
        pair = _extract_pair(block)
        if pair:
            pairs.append(pair)

    if pairs:
        return pairs

    # ── Estrategia 2: texto plano sin fences ─────────────────────────────────
    lines = content_normalized.splitlines(keepends=True)

    search_indices = [
        i for i, l in enumerate(lines)
        if l.strip() == "SEARCH:"
    ]

    for idx in search_indices:
        replace_idx = None
        for j in range(idx + 1, len(lines)):
            if lines[j].strip() == "REPLACE:":
                replace_idx = j
                break

        if replace_idx is None:
            continue

        end_idx = len(lines)
        for j in range(replace_idx + 1, len(lines)):
            if lines[j].strip() == "SEARCH:":
                end_idx = j
                break
            if re.match(r"^-{3,}\s*$", lines[j]) or re.match(r"^\*\*SEARCH", lines[j]):
                end_idx = j
                break

        search_text  = "".join(lines[idx + 1: replace_idx]).rstrip("\n")
        replace_text = "".join(lines[replace_idx + 1: end_idx]).rstrip("\n")

        if search_text:
            pairs.append((search_text, replace_text))

    return pairs


# ─── APLICADOR ───────────────────────────────────────────────────────────────

def apply_all(filepath: Path, pairs: list[tuple[str, str]], dry_run: bool) -> bool:
    """
    Aplica todos los pares SEARCH/REPLACE sobre el contenido del archivo.
    Modo todo-o-nada: si alguno falla, no se escribe nada.
    Retorna True si todo fue bien.
    """
    raw     = read_file(filepath)
    content = raw.replace("\r\n", "\n").replace("\r", "\n")

    errors   = []
    modified = content

    for i, (search, replace) in enumerate(pairs, 1):
        count = modified.count(search)
        label = f"SEARCH/REPLACE {i}"

        if count == 0:
            errors.append(f"  ✗ {label}: SEARCH no encontrado en el archivo")
        elif count > 1:
            errors.append(f"  ✗ {label}: SEARCH ambiguo ({count} ocurrencias)")
        else:
            modified = modified.replace(search, replace, 1)
            status   = "(dry-run)" if dry_run else "aplicado"
            print(f"  ✓ {label}: OK — {status}")

    if errors:
        print()
        for e in errors:
            print(e)
        return False

    if not dry_run:
        if "\r\n" in raw:
            modified = modified.replace("\n", "\r\n")
        filepath.write_text(modified, encoding="utf-8")

    return True


# ─── GIT ─────────────────────────────────────────────────────────────────────

def run_git(args: list[str], root: Path) -> tuple[int, str]:
    """Ejecuta un comando git en la raíz del proyecto."""
    result = subprocess.run(
        ["git"] + args,
        cwd=str(root),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace"
    )
    output = (result.stdout + result.stderr).strip()
    return result.returncode, output


def prompt_yn(question: str) -> bool:
    """Pregunta sí/no. Retorna True si el usuario confirma."""
    try:
        answer = input(f"\n  {question} [s/N] ").strip().lower()
        return answer in ("s", "si", "sí", "y", "yes")
    except (EOFError, KeyboardInterrupt):
        print()
        return False


def git_commit_flow(target_rel: str, backup_path: Path | None,
                    pliego_id: str, cambio: str, root: Path) -> None:
    """
    Flujo interactivo post-aplicación:
      1. Muestra el commit propuesto.
      2. Pregunta confirmación.
      3. Ejecuta git add + git commit.
      4. Ofrece borrar el backup.
    """
    commit_msg = f"{pliego_id}: {cambio}"

    print()
    print("  ── Git ──────────────────────────────────────────────────")
    print(f"    git add {target_rel}")
    print(f"    git commit -m \"{commit_msg}\"")

    if not prompt_yn("¿Ejecutar commit ahora?"):
        print()
        print("  Commit omitido. Comandos para ejecutar manualmente:")
        print(f"    git add {target_rel}")
        print(f"    git commit -m \"{commit_msg}\"")
        _offer_backup_delete(backup_path)
        return

    # git add
    code, out = run_git(["add", target_rel], root)
    if code != 0:
        print(f"\n  ✗ git add falló:\n    {out}")
        _offer_backup_delete(backup_path)
        return
    print(f"  ✓ git add {target_rel}")

    # git commit
    code, out = run_git(["commit", "-m", commit_msg], root)
    if code != 0:
        print(f"\n  ✗ git commit falló:\n    {out}")
        _offer_backup_delete(backup_path)
        return

    # Muestra el hash corto del commit
    _, short_hash = run_git(["rev-parse", "--short", "HEAD"], root)
    print(f"  ✓ commit [{short_hash}] {commit_msg}")

    _offer_backup_delete(backup_path)


def _offer_backup_delete(backup_path: Path | None) -> None:
    """Ofrece borrar el backup si existe."""
    if not backup_path or not backup_path.exists():
        return

    print()
    print(f"  Backup:   {backup_path.name}")
    if prompt_yn("¿Borrar backup ahora?"):
        backup_path.unlink()
        print(f"  ✓ Backup eliminado.")
    else:
        print(f"  Backup conservado. Bórralo cuando confirmes en producción:")
        print(f"    Remove-Item \"{backup_path}\"")


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(
        description="Aplica un Pliego el_bunker a su archivo objetivo."
    )
    ap.add_argument("pliego",    help="Ruta al archivo .txt con el pliego")
    ap.add_argument("--root",    default="..",
                    help="Raíz del proyecto (default: carpeta padre de tools/)")
    ap.add_argument("--archivo", default=None,
                    help="Fuerza un archivo concreto (útil si el pliego lista varios)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Simula la operación sin escribir nada")
    args = ap.parse_args()

    # ── Leer pliego ──────────────────────────────────────────────────────────
    pliego_path = Path(args.pliego)
    if not pliego_path.exists():
        print(f"ERROR: No se encuentra el pliego: {pliego_path}")
        sys.exit(1)

    content = read_file(pliego_path)

    # ── Parsear ──────────────────────────────────────────────────────────────
    archivos   = parse_archivos(content)
    pairs      = parse_pairs(content)
    pliego_id  = parse_pliego_id(content, pliego_path.name)
    cambio     = parse_cambio(content)

    print()
    print("=" * 62)
    print(f"  PLIEGO:   {pliego_path.name}")
    print(f"  ARCHIVOS: {', '.join(archivos) if archivos else '(ninguno detectado)'}")
    print(f"  Bloques SEARCH/REPLACE: {len(pairs)}")
    print("=" * 62)

    if not pairs:
        print("\nERROR: No se encontraron bloques SEARCH/REPLACE.")
        print("El pliego debe contener líneas 'SEARCH:' y 'REPLACE:' (solas en su línea).")
        sys.exit(1)

    # ── Resolver archivo objetivo ─────────────────────────────────────────────
    if args.archivo:
        target_rel = args.archivo
    elif len(archivos) == 1:
        target_rel = archivos[0]
    elif len(archivos) == 0:
        print("\nERROR: No se encontró línea 'ARCHIVOS:' en el pliego.")
        sys.exit(1)
    else:
        print(f"\nEl pliego lista {len(archivos)} archivos:")
        for idx, a in enumerate(archivos, 1):
            print(f"  {idx}. {a}")
        print("\nUsa --archivo <ruta> para indicar cuál procesar en esta ejecución.")
        sys.exit(1)

    root        = Path(args.root)
    target_path = root / target_rel

    if not target_path.exists():
        print(f"\nERROR: Archivo no encontrado: {target_path.resolve()}")
        print(f"  --root actual: {root.resolve()}")
        sys.exit(1)

    print(f"\n  Archivo:  {target_path.resolve()}")
    if args.dry_run:
        print("  Modo:     DRY-RUN (sin cambios en disco)")
    print()

    # ── Backup ───────────────────────────────────────────────────────────────
    backup_path = None
    if not args.dry_run:
        ts          = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = target_path.with_suffix(f".bak_{ts}")
        shutil.copy2(target_path, backup_path)
        print(f"  Backup:   {backup_path.name}\n")

    # ── Aplicar ──────────────────────────────────────────────────────────────
    ok = apply_all(target_path, pairs, dry_run=args.dry_run)

    print()
    print("=" * 62)

    if not ok:
        print("  RESULTADO: FALLIDO — ningún cambio guardado.")
        if backup_path and backup_path.exists():
            backup_path.unlink()
            print("  Backup eliminado (no fue necesario).")
        print()
        print("  Diagnóstico: copia el SEARCH exacto desde el archivo:")
        print(f"    Get-Content {target_rel} | Select-Object -Index (N..M)")
        sys.exit(1)
    else:
        if args.dry_run:
            print(f"  RESULTADO: {len(pairs)}/{len(pairs)} OK — dry-run completado.")
            print()
        else:
            print(f"  RESULTADO: {len(pairs)}/{len(pairs)} aplicados — archivo guardado ✓")
            git_commit_flow(target_rel, backup_path, pliego_id, cambio, root)

    print()


if __name__ == "__main__":
    main()
