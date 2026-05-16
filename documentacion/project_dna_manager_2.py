#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════╗
║          PROJECT DNA MANAGER — Claude Context Tool       ║
║    Gestiona la continuidad de proyectos entre sesiones   ║
╚══════════════════════════════════════════════════════════╝

Uso:
  python project_dna_manager.py init                    → Inicializar nuevo proyecto
  python project_dna_manager.py update                  → Actualizar ADN del proyecto
  python project_dna_manager.py load                    → Generar prompt de carga de contexto
  python project_dna_manager.py show                    → Mostrar estado actual
  python project_dna_manager.py list                    → Listar proyectos existentes
  python project_dna_manager.py switch <nombre>         → Cambiar de proyecto activo
  python project_dna_manager.py export                  → Exportar ADN completo para copiar
"""

import json
import os
import sys
import argparse
import textwrap
from datetime import datetime
from pathlib import Path


# ─────────────────────────────────────────────
#  CONFIGURACIÓN
# ─────────────────────────────────────────────

DNA_DIR = Path.home() / ".project_dna"
ACTIVE_FILE = DNA_DIR / ".active_project"
DNA_DIR.mkdir(exist_ok=True)


# ─────────────────────────────────────────────
#  COLORES PARA TERMINAL
# ─────────────────────────────────────────────

class C:
    RESET  = "\033[0m"
    BOLD   = "\033[1m"
    CYAN   = "\033[96m"
    GREEN  = "\033[92m"
    YELLOW = "\033[93m"
    RED    = "\033[91m"
    GRAY   = "\033[90m"
    WHITE  = "\033[97m"

def header(text):
    print(f"\n{C.CYAN}{C.BOLD}{'─'*56}{C.RESET}")
    print(f"{C.CYAN}{C.BOLD}  {text}{C.RESET}")
    print(f"{C.CYAN}{C.BOLD}{'─'*56}{C.RESET}")

def success(text): print(f"{C.GREEN}  ✓ {text}{C.RESET}")
def warn(text):    print(f"{C.YELLOW}  ⚠ {text}{C.RESET}")
def error(text):   print(f"{C.RED}  ✗ {text}{C.RESET}")
def info(text):    print(f"{C.GRAY}  · {text}{C.RESET}")
def label(text):   print(f"\n{C.WHITE}{C.BOLD}{text}{C.RESET}")


# ─────────────────────────────────────────────
#  MANEJO DE PROYECTOS (JSON)
# ─────────────────────────────────────────────

def get_project_path(name: str) -> Path:
    return DNA_DIR / f"{name}.json"

def load_project(name: str) -> dict:
    path = get_project_path(name)
    if not path.exists():
        error(f"Proyecto '{name}' no encontrado.")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_project(name: str, data: dict):
    path = get_project_path(name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_active_project() -> str | None:
    if ACTIVE_FILE.exists():
        return ACTIVE_FILE.read_text(encoding="utf-8").strip()
    return None

def set_active_project(name: str):
    ACTIVE_FILE.write_text(name, encoding="utf-8")

def require_active() -> tuple[str, dict]:
    name = get_active_project()
    if not name:
        error("No hay proyecto activo. Usa 'init' para crear uno.")
        sys.exit(1)
    return name, load_project(name)

def list_projects() -> list[str]:
    return [p.stem for p in DNA_DIR.glob("*.json")]


# ─────────────────────────────────────────────
#  ESTRUCTURA DEL ADN
# ─────────────────────────────────────────────

EMPTY_DNA = {
    "meta": {
        "name": "",
        "created_at": "",
        "updated_at": "",
        "version": 1,
    },
    "objetivo_general": "",
    "tech_stack": [],
    "estado_actual": {
        "resumen": "",
        "ultimo_chat": "",
        "archivos_clave": [],
    },
    "pendientes": [],
    "decisiones_criticas": [],
    "variables_entorno": [],
    "notas_adicionales": "",
}


# ─────────────────────────────────────────────
#  COMANDOS
# ─────────────────────────────────────────────

def cmd_init(args):
    header("INICIALIZAR NUEVO PROYECTO")

    name = input(f"\n{C.BOLD}  Nombre del proyecto (sin espacios): {C.RESET}").strip()
    if not name:
        error("El nombre no puede estar vacío.")
        return

    if get_project_path(name).exists():
        warn(f"El proyecto '{name}' ya existe. ¿Sobreescribir? (s/n): ")
        if input("  ").strip().lower() != "s":
            info("Cancelado.")
            return

    dna = dict(EMPTY_DNA)
    dna["meta"] = {
        "name": name,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "version": 1,
    }

    print()
    dna["objetivo_general"] = input(
        f"{C.BOLD}  Objetivo general del proyecto:\n  {C.RESET}"
    ).strip()

    tech = input(f"\n{C.BOLD}  Tech stack (separado por comas, ej: Python, FastAPI, React):\n  {C.RESET}").strip()
    dna["tech_stack"] = [t.strip() for t in tech.split(",") if t.strip()]

    save_project(name, dna)
    set_active_project(name)
    success(f"Proyecto '{name}' creado y establecido como activo.")
    info(f"Archivo: {get_project_path(name)}")
    print()
    info("Próximo paso → 'update' para añadir el estado actual y pendientes.")


def cmd_update(args):
    name, dna = require_active()
    header(f"ACTUALIZAR ADN — {name}")

    print(f"\n{C.GRAY}  (Presiona ENTER para mantener el valor actual){C.RESET}\n")

    # ── Objetivo general ──
    label("  [1] Objetivo general")
    info(f"Actual: {dna['objetivo_general'] or '(vacío)'}")
    val = input("  Nuevo valor (o ENTER): ").strip()
    if val:
        dna["objetivo_general"] = val

    # ── Tech stack ──
    label("  [2] Tech stack")
    info(f"Actual: {', '.join(dna['tech_stack']) or '(vacío)'}")
    val = input("  Nuevo (comas, o ENTER): ").strip()
    if val:
        dna["tech_stack"] = [t.strip() for t in val.split(",") if t.strip()]

    # ── Estado actual ──
    label("  [3] Resumen del último chat")
    info(f"Actual: {dna['estado_actual']['resumen'] or '(vacío)'}")
    val = input("  Nuevo valor (o ENTER): ").strip()
    if val:
        dna["estado_actual"]["resumen"] = val

    label("  [4] ¿Qué se completó en el último chat?")
    info(f"Actual: {dna['estado_actual']['ultimo_chat'] or '(vacío)'}")
    val = input("  Nuevo valor (o ENTER): ").strip()
    if val:
        dna["estado_actual"]["ultimo_chat"] = val

    label("  [5] Archivos clave del proyecto")
    info(f"Actual: {', '.join(dna['estado_actual']['archivos_clave']) or '(vacío)'}")
    val = input("  Listar archivos (comas, o ENTER): ").strip()
    if val:
        dna["estado_actual"]["archivos_clave"] = [f.strip() for f in val.split(",") if f.strip()]

    # ── Pendientes ──
    label("  [6] Pendientes / Roadmap")
    if dna["pendientes"]:
        info("Actuales:")
        for i, p in enumerate(dna["pendientes"], 1):
            print(f"     {i}. {p}")

    print(f"  {C.GRAY}Introduce nuevos pendientes (uno por línea, línea vacía para terminar):{C.RESET}")
    nuevos = []
    while True:
        line = input("    + ").strip()
        if not line:
            break
        nuevos.append(line)

    if nuevos:
        accion = input(f"\n  {C.BOLD}¿[a]ñadir a los existentes o [r]eemplazar? (a/r): {C.RESET}").strip().lower()
        if accion == "r":
            dna["pendientes"] = nuevos
        else:
            dna["pendientes"].extend(nuevos)

    # ── Decisiones críticas ──
    label("  [7] Decisiones / Variables críticas")
    if dna["decisiones_criticas"]:
        info("Actuales:")
        for d in dna["decisiones_criticas"]:
            print(f"     • {d['decision']}: {d['razon']}")

    print(f"  {C.GRAY}Añadir decisión (ENTER para saltar):{C.RESET}")
    decision = input("    Decisión tomada: ").strip()
    if decision:
        razon = input("    ¿Por qué se tomó? ").strip()
        dna["decisiones_criticas"].append({
            "decision": decision,
            "razon": razon,
            "fecha": datetime.now().strftime("%Y-%m-%d"),
        })

    # ── Variables de entorno ──
    label("  [8] Variables de entorno importantes (NOMBRES solo, sin valores)")
    info(f"Actual: {', '.join(dna['variables_entorno']) or '(vacío)'}")
    val = input("  Variables (comas, o ENTER): ").strip()
    if val:
        dna["variables_entorno"] = [v.strip() for v in val.split(",") if v.strip()]

    # ── Notas adicionales ──
    label("  [9] Notas adicionales")
    info(f"Actual: {dna['notas_adicionales'] or '(vacío)'}")
    val = input("  Nuevas notas (o ENTER): ").strip()
    if val:
        dna["notas_adicionales"] = val

    # Guardar
    dna["meta"]["updated_at"] = datetime.now().isoformat()
    dna["meta"]["version"] = dna["meta"].get("version", 1) + 1
    save_project(name, dna)

    success(f"ADN actualizado (v{dna['meta']['version']}).")
    info(f"Guardado en: {get_project_path(name)}")


def generate_markdown(dna: dict) -> str:
    """Genera el archivo Markdown del ADN del proyecto."""
    now = dna["meta"]["updated_at"][:10]
    version = dna["meta"]["version"]
    name = dna["meta"]["name"]

    pendientes_md = "\n".join(
        f"- [ ] {p}" for p in dna["pendientes"]
    ) or "_Sin pendientes registrados._"

    decisiones_md = "\n".join(
        f"- **{d['decision']}** ({d.get('fecha','?')}): {d['razon']}"
        for d in dna["decisiones_criticas"]
    ) or "_Sin decisiones registradas._"

    archivos_md = "\n".join(
        f"- `{f}`" for f in dna["estado_actual"]["archivos_clave"]
    ) or "_Sin archivos registrados._"

    vars_md = ", ".join(f"`{v}`" for v in dna["variables_entorno"]) or "_Ninguna_"

    tech_md = ", ".join(dna["tech_stack"]) or "_No especificado_"

    return f"""# 🧬 ADN del Proyecto: {name}

> Versión {version} · Última actualización: {now}
> Generado por **Project DNA Manager**

---

## 🎯 Objetivo General

{dna["objetivo_general"] or "_No definido._"}

---

## 🛠️ Tech Stack

{tech_md}

---

## 📍 Estado Actual

### Resumen de la sesión
{dna["estado_actual"]["resumen"] or "_Sin resumen._"}

### ¿Qué se completó en el último chat?
{dna["estado_actual"]["ultimo_chat"] or "_Sin registrar._"}

### Archivos clave
{archivos_md}

---

## 🗺️ Pendientes / Roadmap

{pendientes_md}

---

## 🔑 Decisiones Críticas

{decisiones_md}

---

## ⚙️ Variables de Entorno Necesarias

{vars_md}

---

## 📝 Notas Adicionales

{dna["notas_adicionales"] or "_Sin notas._"}

---

*Archivo generado automáticamente. No editar manualmente si usas el CLI.*
"""


def generate_context_prompt(dna: dict) -> str:
    """Genera el prompt optimizado para carga de contexto en Claude."""
    pendientes = "\n".join(f"  {i+1}. {p}" for i, p in enumerate(dna["pendientes"])) or "  (No hay pendientes definidos)"
    decisiones = "\n".join(
        f"  - {d['decision']}: {d['razon']}"
        for d in dna["decisiones_criticas"]
    ) or "  (Sin decisiones registradas)"
    archivos = ", ".join(dna["estado_actual"]["archivos_clave"]) or "no especificados"
    tech = ", ".join(dna["tech_stack"]) or "no especificado"

    return f"""
╔══════════════════════════════════════════════════════════════╗
║         PROMPT DE CARGA DE CONTEXTO — COPIAR Y PEGAR        ║
╚══════════════════════════════════════════════════════════════╝

── INICIO DEL PROMPT ──────────────────────────────────────────

Hola Claude. Retomamos un proyecto en curso. Aquí tienes el contexto completo para que puedas continuar sin hacer preguntas de relleno:

## Proyecto: {dna["meta"]["name"]}

**Objetivo general:**
{dna["objetivo_general"]}

**Tech stack:** {tech}

**¿Qué hicimos en el último chat?**
{dna["estado_actual"]["ultimo_chat"] or "No registrado."}

**Resumen del estado actual:**
{dna["estado_actual"]["resumen"] or "No disponible."}

**Archivos clave del proyecto:** {archivos}

**Pendientes / Próximos pasos (en orden de prioridad):**
{pendientes}

**Decisiones ya tomadas (no cuestionar):**
{decisiones}

**Variables de entorno que existen en mi sistema:** {', '.join(dna["variables_entorno"]) or 'ninguna específica'}.

---
Por favor, confirma que has entendido el contexto con un resumen de una sola línea de dónde estamos, y luego pregúntame con qué parte del roadmap quiero continuar hoy.

── FIN DEL PROMPT ──────────────────────────────────────────────
"""


def cmd_load(args):
    name, dna = require_active()
    header(f"PROMPT DE CONTEXTO — {name}")
    print(generate_context_prompt(dna))


def cmd_show(args):
    name, dna = require_active()
    header(f"ESTADO DEL PROYECTO — {name}")

    label("  OBJETIVO")
    print(f"  {dna['objetivo_general'] or '(no definido)'}")

    label("  TECH STACK")
    print(f"  {', '.join(dna['tech_stack']) or '(no definido)'}")

    label("  ÚLTIMO CHAT")
    print(f"  {dna['estado_actual']['ultimo_chat'] or '(sin registrar)'}")

    label("  PENDIENTES")
    for i, p in enumerate(dna["pendientes"], 1):
        print(f"  {i}. {p}")
    if not dna["pendientes"]:
        print("  (ninguno)")

    label("  DECISIONES CRÍTICAS")
    for d in dna["decisiones_criticas"]:
        print(f"  • {d['decision']}: {d['razon']}")
    if not dna["decisiones_criticas"]:
        print("  (ninguna)")

    info(f"\n  Versión del ADN: v{dna['meta']['version']}")
    info(f"  Última actualización: {dna['meta']['updated_at'][:10]}")
    print()


def cmd_export(args):
    name, dna = require_active()
    header(f"EXPORTAR ADN — {name}")

    # Guardar Markdown
    md_path = Path(f"{name}_DNA.md")
    md_path.write_text(generate_markdown(dna), encoding="utf-8")
    success(f"Markdown exportado: {md_path.resolve()}")

    # Guardar prompt
    prompt_path = Path(f"{name}_context_prompt.txt")
    prompt_path.write_text(generate_context_prompt(dna), encoding="utf-8")
    success(f"Prompt exportado: {prompt_path.resolve()}")

    print()
    info("Copia el contenido de '_context_prompt.txt' al inicio de tu nueva sesión en Claude.")


def cmd_list(args):
    header("PROYECTOS EXISTENTES")
    projects = list_projects()
    active = get_active_project()

    if not projects:
        warn("No hay proyectos. Usa 'init' para crear uno.")
        return

    print()
    for p in sorted(projects):
        marker = f"{C.GREEN}● ACTIVO{C.RESET}" if p == active else f"{C.GRAY}○{C.RESET}"
        dna = load_project(p)
        version = dna["meta"].get("version", 1)
        updated = dna["meta"].get("updated_at", "?")[:10]
        print(f"  {marker}  {C.BOLD}{p}{C.RESET}  {C.GRAY}v{version} · {updated}{C.RESET}")
    print()


def cmd_switch(args):
    if not args.name:
        error("Especifica el nombre del proyecto: switch <nombre>")
        return

    name = args.name
    if not get_project_path(name).exists():
        error(f"Proyecto '{name}' no encontrado.")
        cmd_list(args)
        return

    set_active_project(name)
    success(f"Proyecto activo cambiado a '{name}'.")


# ─────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────

def main():
    print(f"\n{C.CYAN}{C.BOLD}  🧬 PROJECT DNA MANAGER{C.RESET}")
    print(f"{C.GRAY}  Gestión de continuidad para proyectos en Claude{C.RESET}")

    parser = argparse.ArgumentParser(
        prog="project_dna_manager",
        description="Gestiona el ADN de tus proyectos entre sesiones de Claude.",
        add_help=True,
    )
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("init",   help="Inicializar nuevo proyecto")
    sub.add_parser("update", help="Actualizar estado del proyecto activo")
    sub.add_parser("load",   help="Generar prompt de carga de contexto")
    sub.add_parser("show",   help="Mostrar estado actual del proyecto")
    sub.add_parser("list",   help="Listar todos los proyectos")
    sub.add_parser("export", help="Exportar ADN y prompt a archivos")

    sw = sub.add_parser("switch", help="Cambiar proyecto activo")
    sw.add_argument("name", nargs="?", help="Nombre del proyecto")

    args = parser.parse_args()

    commands = {
        "init":   cmd_init,
        "update": cmd_update,
        "load":   cmd_load,
        "show":   cmd_show,
        "list":   cmd_list,
        "export": cmd_export,
        "switch": cmd_switch,
    }

    if args.command in commands:
        commands[args.command](args)
    else:
        parser.print_help()
        print()
        active = get_active_project()
        if active:
            info(f"Proyecto activo: {C.BOLD}{active}{C.RESET}")
        else:
            warn("No hay proyecto activo. Usa 'init' para empezar.")
        print()


if __name__ == "__main__":
    main()
