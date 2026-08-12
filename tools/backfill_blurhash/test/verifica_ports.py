#!/usr/bin/env python3
# test/verifica_ports.py — Verifica que blurhash.py produce exactamente el mismo
# hash que la implementacion oficial de woltapp/blurhash (master 2026-08-12),
# ejecutada via node (transpilacion literal en test/*_off.mjs).
#
# Casos: pixeles sinteticos deterministas (no se descarga nada).
# Si todos coinciden, el port es 1:1 del oficial.

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from blurhash import encode

ROOT = os.path.dirname(HERE)
RUN_OFF = os.path.join(HERE, "run_off.mjs")


def make_pixels(w, h, kind):
    """Genera RGBA flat (len = w*h*4) de forma determinista."""
    px = []
    for y in range(h):
        for x in range(w):
            if kind == "solido_rojo":
                r, g, b = 255, 0, 0
            elif kind == "solido_verde":
                r, g, b = 0, 200, 0
            elif kind == "solido_azul":
                r, g, b = 0, 0, 128
            elif kind == "gradiente":
                r = int(255 * x / max(1, w - 1))
                g = int(255 * y / max(1, h - 1))
                b = int(255 * ((x + y) % 2))
            elif kind == "diente_sierra":
                r = (x * 37 + y * 13) % 256
                g = (y * 41 + x * 7) % 256
                b = (x * 3 + y * 29) % 256
            else:
                raise ValueError(kind)
            px.extend([r, g, b, 255])
    return px


def hash_oficial(px, w, h, cx, cy):
    csv = ";".join(
        ",".join(str(v) for v in px[i : i + 4]) for i in range(0, len(px), 4)
    )
    out = subprocess.run(
        ["node", RUN_OFF, str(cx), str(cy), f"{w}x{h}", csv],
        capture_output=True,
        text=True,
        check=True,
        cwd=ROOT,
    )
    return out.stdout.strip()


def main():
    casos = []
    for kind in ("solido_rojo", "solido_verde", "solido_azul", "gradiente", "diente_sierra"):
        for w, h in ((4, 4), (16, 16), (32, 32)):
            for cx, cy in ((1, 1), (3, 3), (4, 3), (4, 4), (9, 9)):
                casos.append((kind, w, h, cx, cy))

    fallos = 0
    for kind, w, h, cx, cy in casos:
        px = make_pixels(w, h, kind)
        py = encode(px, w, h, cx, cy)
        off = hash_oficial(px, w, h, cx, cy)
        estado = "OK " if py == off else "FAIL"
        if py != off:
            fallos += 1
        print(f"{estado} {kind:14s} {w:2d}x{h:<2d} cx={cx} cy={cy}  py={py}  off={off}")

    print()
    if fallos:
        print(f"RESULTADO: {fallos} FALLOS de {len(casos)} casos")
        sys.exit(1)
    print(f"RESULTADO: {len(casos)}/{len(casos)} casos identicos a la implementacion oficial")
    return 0


if __name__ == "__main__":
    sys.exit(main())