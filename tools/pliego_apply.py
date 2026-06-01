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
import os
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


def parse_pliego_id(content: str, filename: str = "") -> str | None:
    """Busca PLIEGO-NNN (solo dígitos) en el contenido o en el nombre del archivo.
    Retorna None si no encuentra ID numérico — el commit se omite."""
    m = re.search(r"\bPLIEGO-\d+\b", content, re.IGNORECASE)
    if m:
        return m.group(0).upper()
    m2 = re.search(r"\bPLIEGO-\d+\b", Path(filename).stem, re.IGNORECASE)
    if m2:
        return m2.group(0).upper()
    return None

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
            if re.match(r"^[-─]{3,}\s*$", lines[j]) or re.match(r"^\*\*SEARCH", lines[j]):
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


# ─── ESTADO / BACKLOG ────────────────────────────────────────────────────────

def find_nucleo(root: Path) -> Path:
    """Retorna la ruta a docs/Nucleo/ si existe, si no la raíz."""
    nucleo = root / "docs" / "Nucleo"
    return nucleo if nucleo.is_dir() else root


def update_proximo_pliego(estado_path: Path, pliego_id: str) -> bool:
    """
    En ESTADO.md actualiza la línea **Próximo pliego:** al número siguiente.
    Retorna True si modificó algo.
    """
    try:
        content = read_file(estado_path)
        m = re.search(r"PLIEGO-(\d+)", pliego_id, re.IGNORECASE)
        if not m:
            return False
        next_num = int(m.group(1)) + 1
        new_content, n = re.subn(
            r"(\*\*Próximo pliego:\*\*\s*)PLIEGO-\d+",
            lambda mo: mo.group(1) + f"PLIEGO-{next_num}",
            content
        )
        if n == 0:
            return False
        estado_path.write_text(new_content, encoding="utf-8")
        return True
    except Exception as e:
        print(f"  ⚠ No se pudo actualizar ESTADO.md: {e}")
        return False


def append_resuelto_backlog(backlog_path: Path, pliego_id: str,
                             cambio: str, archivos: list[str]) -> bool:
    """
    En BACKLOG.md inserta una fila nueva en la tabla ## RESUELTOS.
    Formato de fila: | ID | Fix | Pliego | Fecha |
    No hace append al final — busca la tabla y añade la fila dentro de ella.
    Retorna True si modificó algo.
    """
    try:
        content = read_file(backlog_path)
        if pliego_id in content:
            return False

        date_str = datetime.now().strftime("%Y-%m-%d")
        archivo_corto = Path(archivos[0]).name if archivos else "—"
        fix_desc = cambio[:50] + "…" if len(cambio) > 50 else cambio
        nueva_fila = f"| {pliego_id} | {fix_desc} | {archivo_corto} | {date_str} |\n"

        # Buscar la tabla RESUELTOS e insertar antes de la última fila vacía o al final
        resueltos_marker = "## RESUELTOS"
        idx = content.find(resueltos_marker)
        if idx == -1:
            # No hay tabla — añadir sección mínima al final
            nuevo_bloque = (
                f"\n## RESUELTOS\n\n"
                f"| ID | Fix | Archivo | Fecha |\n"
                f"|----|-----|---------|-------|\n"
                f"{nueva_fila}"
            )
            backlog_path.write_text(content.rstrip() + "\n" + nuevo_bloque, encoding="utf-8")
            return True

        # Encontrar el final de la tabla (primera línea en blanco tras el último |)
        lines = content.splitlines(keepends=True)
        table_start = None
        insert_at = None
        for i, line in enumerate(lines):
            if resueltos_marker in line:
                table_start = i
            if table_start is not None and i > table_start:
                if line.startswith("|"):
                    insert_at = i + 1  # justo después de la última fila de tabla
                elif insert_at is not None and not line.startswith("|"):
                    break  # salimos de la tabla

        if insert_at is None:
            # Tabla encontrada pero vacía — insertar cabecera + fila
            lines.insert(table_start + 1, "\n")
            lines.insert(table_start + 2, "| ID | Fix | Archivo | Fecha |\n")
            lines.insert(table_start + 3, "|----|-----|---------|-------|\n")
            lines.insert(table_start + 4, nueva_fila)
        else:
            lines.insert(insert_at, nueva_fila)

        # Mantener maximo 5 filas en RESUELTOS — volcar exceso a legacy
        lines = _trim_resueltos(lines, table_start, max_rows=5,
                                historial_path=backlog_path.parent.parent / "legacy" / "PLIEGOS_HISTORIAL.md")

        backlog_path.write_text("".join(lines), encoding="utf-8")
        return True
    except Exception as e:
        print(f"  ⚠ No se pudo actualizar BACKLOG.md: {e}")
        return False


def _trim_resueltos(lines: list[str], table_start: int, max_rows: int,
                    historial_path: Path) -> list[str]:
    """
    Si la tabla RESUELTOS tiene mas de max_rows filas de datos,
    elimina las mas antiguas (las primeras) y las appende a historial_path.
    Devuelve la lista de lineas modificada.
    """
    # Localizar filas de datos (empiezan con | pero no son cabecera ni separador)
    data_rows = []
    for i, line in enumerate(lines):
        if i <= table_start:
            continue
        if line.startswith("|") and not line.startswith("| ID") and not re.match(r"^\|[-| ]+\|", line):
            data_rows.append(i)

    excess = len(data_rows) - max_rows
    if excess <= 0:
        return lines

    # Filas a rotar: las mas antiguas (primeras en la lista)
    to_rotate = data_rows[:excess]
    rotated_text = "".join(lines[i] for i in to_rotate)

    # Volcar a historial
    try:
        historial_path.parent.mkdir(parents=True, exist_ok=True)
        if not historial_path.exists():
            header = (
                "# PLIEGOS_HISTORIAL.md — el_bunker\n"
                "> Historial completo de pliegos aplicados. No se carga en arranque.\n\n"
                "| ID | Fix | Archivo | Fecha |\n"
                "|----|-----|---------|-------|\n"
            )
            historial_path.write_text(header + rotated_text, encoding="utf-8")
        else:
            existing = read_file(historial_path)
            historial_path.write_text(existing + rotated_text, encoding="utf-8")
    except Exception as e:
        print(f"  Aviso: No se pudo escribir en PLIEGOS_HISTORIAL.md: {e}")

    # Eliminar filas rotadas de lines (en orden inverso para no desplazar indices)
    for i in reversed(to_rotate):
        lines.pop(i)

    return lines


def update_estado_backlog_flow(root: Path, pliego_id: str,
                                cambio: str, archivos: list[str]) -> None:
    """Flujo interactivo para actualizar ESTADO.md y BACKLOG.md."""
    nucleo = find_nucleo(root)
    estado_path  = nucleo / "ESTADO.md"
    backlog_path = nucleo / "BACKLOG.md"

    found = []
    if estado_path.exists():
        found.append("ESTADO.md")
    if backlog_path.exists():
        found.append("BACKLOG.md")
    if not found:
        return

    print()
    print("  ── Estado del proyecto ──────────────────────────────────")
    print(f"  Archivos encontrados en {nucleo.relative_to(root)}: {', '.join(found)}")
    if not prompt_yn(f"¿Actualizar {' y '.join(found)} con {pliego_id}?"):
        print("  Actualización omitida.")
        return

    if estado_path.exists():
        ok = update_proximo_pliego(estado_path, pliego_id)
        print(f"  {'✓' if ok else '⚠'} ESTADO.md — próximo pliego {'actualizado' if ok else 'sin cambios (revisar formato)'}")

    if backlog_path.exists():
        ok = append_resuelto_backlog(backlog_path, pliego_id, cambio, archivos)
        print(f"  {'✓' if ok else '⚠'} BACKLOG.md — {'fila añadida en tabla RESUELTOS' if ok else 'sin cambios (ya registrado)'}")


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


def run_npm_build(root: Path) -> tuple[bool, str]:
    """Ejecuta npm run build en la raíz del proyecto. Retorna (ok, output)."""
    try:
        result = subprocess.run(
            ["npm.cmd" if os.name == "nt" else "npm", "run", "build"],
            cwd=str(root),
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        output = (result.stdout + result.stderr).strip()
        return result.returncode == 0, output
    except FileNotFoundError:
        return False, "ERROR: 'npm' no encontrado en PATH. Verifica que Node.js está instalado."


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
    ap.add_argument("--skip-build", action="store_true",
                    help="Omite npm run build (útil para pliegos de documentación)")
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
            if not args.skip_build:
                print()
                print("  ── Build ────────────────────────────────────────────────")
                print("  Ejecutando npm run build...")
                build_ok, build_out = run_npm_build(root)
                if not build_ok:
                    print("\n  ✗ BUILD FALLIDO — restaurando archivo original.")
                    shutil.copy2(backup_path, target_path)
                    backup_path.unlink()
                    print("  ✓ Archivo restaurado. Ningún cambio persistido.")
                    print("\n  Error de build (últimas líneas):")
                    for line in build_out.splitlines()[-20:]:
                        print(f"    {line}")
                    sys.exit(1)
                print("  ✓ Build OK")
            if pliego_id:
                update_estado_backlog_flow(root, pliego_id, cambio, archivos)
                git_commit_flow(target_rel, backup_path, pliego_id, cambio, root)
            else:
                print("  Sin ID numérico — commit omitido (pliego de documentación).")
                _offer_backup_delete(backup_path)

    print()


if __name__ == "__main__":
    main()
