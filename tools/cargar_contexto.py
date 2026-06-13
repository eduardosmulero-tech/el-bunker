import os

RAIZ = r"C:\Proyectos\el-bunker"

# Archivos que siempre se cargan (contexto base)
ARCHIVOS_BASE = [
    r"CLAUDE.md",
    r"PLIEGOS.md",
    r"docs\Nucleo\PROYECTO.md",
    r"docs\Nucleo\ESTADO.md",
    r"docs\Nucleo\CONTRATO.md",
    r"docs\Nucleo\REGLAS.md",
    r"docs\SESION.md",
]

# Archivos de código fuente relevantes
ARCHIVOS_SRC = [
    r"src\core\PlayerContext.jsx",
    r"src\core\VaultContext.jsx",
    r"src\layout\App.jsx",
    r"src\musiclab\MusicLab.jsx",
    r"src\musiclab\WinampPlayer.jsx",
    r"src\musiclab\useMusicActions.js",
    r"src\vault\Vault.jsx",
    r"src\tokens.js",
]

# Arquitectura (opcional, comenta si no la necesitas siempre)
ARCHIVOS_ARQ = [
    r"docs\Arquitectura\architecture.md",
    r"docs\Arquitectura\state-map.md",
    r"docs\Arquitectura\data-flow.md",
]

def leer(path_relativo):
    path = os.path.join(RAIZ, path_relativo)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return f"[ARCHIVO NO ENCONTRADO: {path_relativo}]"
    except Exception as e:
        return f"[ERROR LEYENDO {path_relativo}: {e}]"

def generar_contexto(incluir_src=True, incluir_arq=False):
    bloques = []
    bloques.append("=" * 60)
    bloques.append("CONTEXTO DEL PROYECTO EL BUNKER")
    bloques.append("=" * 60)

    bloques.append("\n### DOCUMENTACION BASE ###\n")
    for f in ARCHIVOS_BASE:
        bloques.append(f"\n--- {f} ---")
        bloques.append(leer(f))

    if incluir_src:
        bloques.append("\n### CODIGO FUENTE ###\n")
        for f in ARCHIVOS_SRC:
            bloques.append(f"\n--- {f} ---")
            bloques.append(leer(f))

    if incluir_arq:
        bloques.append("\n### ARQUITECTURA ###\n")
        for f in ARCHIVOS_ARQ:
            bloques.append(f"\n--- {f} ---")
            bloques.append(leer(f))

    return "\n".join(bloques)

if __name__ == "__main__":
    import sys

    incluir_src = "--sin-src" not in sys.argv
    incluir_arq = "--arq" in sys.argv

    contexto = generar_contexto(incluir_src=incluir_src, incluir_arq=incluir_arq)

    # Guardar en archivo
    salida = os.path.join(RAIZ, "tools", "contexto_sesion.txt")
    with open(salida, "w", encoding="utf-8") as f:
        f.write(contexto)

    print(f"Contexto generado: {len(contexto)} caracteres")
    print(f"Guardado en: {salida}")
    print("\nUsos:")
    print("  python tools\\cargar_contexto.py              # base + código")
    print("  python tools\\cargar_contexto.py --sin-src   # solo documentación")
    print("  python tools\\cargar_contexto.py --arq       # + arquitectura")