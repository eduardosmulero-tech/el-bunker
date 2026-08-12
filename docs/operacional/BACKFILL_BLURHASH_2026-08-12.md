# BACKFILL files.blurhash — instrucciones de ejecución (A6)

> Tarjeta: A6 (t_29116394). Fecha: 2026-08-12. Preparado por mecanico, ejecutado por Edu.
> **La escritura contra D1 REMOTA es acto de Edu.** Este documento es el gate. Nadie más
> ejecuta `--commit`.

## Qué hace

`tools/backfill_blurhash/backfill_blurhash.py` recorre los files de D1 con `blurhash IS NULL`
(hoy: los 527), descarga cada foto desde R2 (`wrangler r2 object get --remote`), la reduce a
32x32 y calcula su blurhash 4x3, y en modo `--commit` escribe la columna `files.blurhash`.

Componentes fijados: 4x3 (estándar recomendado por la spec blurhash; el diseño Modo Visita
no fija componentes). El cálculo vive en `blurhash.py`, port 1:1 de la implementación
oficial de woltapp/blurhash (master 2026-08-12), verificado contra ella ejecutándola con
node: 75/75 casos idénticos (`tools/backfill_blurhash/test/verifica_ports.py`).

## Prerrequisitos

- Wrangler autenticado: `npx wrangler whoami` debe mostrar thebunker.admin@gmail.com.
- Python con Pillow funcional. En esta máquina: `python` (3.11, venv Hermes) tiene PIL ok;
  `python3` (3.14) NO sirve por el PYTHONPATH de la sesión (PIL roto del venv). Usar:
  `python tools/backfill_blurhash/backfill_blurhash.py ...`
- Snapshot previo SIEMPRE antes de `--commit` (paso 2).

## Secuencia

### 1. Dry-run de prueba (opcional pero recomendado)

```bash
cd C:/proyectos/dev/el-bunker/.worktrees/t_29116394
python tools/backfill_blurhash/backfill_blurhash.py --limit 3
```

Salida esperada: 3 hashes, `Escritura: NINGUNA`, y el UPDATE preparado impreso.
Verificación de no-escritura (opcional):

```bash
npx wrangler d1 execute el-bunker-db --remote --json --command="SELECT id, blurhash FROM files WHERE id IN ('00175b45-1047-44b6-b769-dd77b3bc801e','00bc7017-5d40-4b6d-a103-b1ccf604ef78','021aa70a-f2a4-4617-811a-476460af61f4')"
```

Los 3 ids deben mostrar `blurhash: null`.

### 2. Snapshot de D1 ANTES de escribir (obligatorio)

```bash
cd C:/proyectos/dev/el-bunker/.worktrees/t_29116394
bash tools/snapshot_d1.sh
```

Exporta a `tools/snapshots/d1_AAAAMMDD_HHMMSS.json` (16 tablas, incluye `files`).
El script además, al ejecutarse con `--commit`, genera un **snapshot fino** de la columna
blurhash para las filas objetivo en `tools/snapshots/blurhash_fino_AAAAMMDD_HHMMSS.json`
(rollback quirúrgico, ver paso 4). Conservar ambos hasta confirmar el backfill.

### 3. Escritura (GATE EDU — solo tú)

```bash
cd C:/proyectos/dev/el-bunker/.worktrees/t_29116394
python tools/backfill_blurhash/backfill_blurhash.py --all --commit
```

El script pide confirmación explícita (`edu-ok`) antes de ejecutar el primer UPDATE y
verifica después: `Verificacion: N filas, 0 nulas restantes`. Por defecto (sin `--commit`)
el script NUNCA escribe: usa el límite seguro de 100 files en dry-run; `--all` sin
`--commit` recorre los 527 en seco.

### 4. Rollback si algo falla

- **A medias (el script muere entre filas):** vuelve a arrancar; el backfill es idempotente
  (solo toca filas con blurhash NULL). Para revertir lo ya escrito, restaurar desde el
  snapshot fino:

```bash
# por cada id del snapshot fino con blurhash=<valor_previo> (todos null hoy):
npx wrangler d1 execute el-bunker-db --remote --command="UPDATE files SET blurhash = NULL WHERE id = '<id>';"
```

  Equivalente en un comando, todos los ids del snapshot fino:

```bash
python - <<'EOF'
import json, glob, subprocess, sys
snap = sorted(glob.glob("tools/snapshots/blurhash_fino_*.json"))[-1]
rows = json.load(open(snap, encoding="utf-8"))["rows"]
ids = ", ".join("'%s'" % r["id"] for r in rows)
sql = f"UPDATE files SET blurhash = NULL WHERE id IN ({ids});"
subprocess.run(["npx", "wrangler", "d1", "execute", "el-bunker-db", "--remote", "--command", sql], check=True)
print("revertidos:", len(rows))
EOF
```

- **Fallo total (527 corruptos, hay que volver a antes de todo):** restaurar la tabla
  `files` entera desde `tools/snapshots/d1_*.json` (mismo flujo que cualquier restauración
  D1 del repo: DELETE de `files` + INSERT de las filas del snapshot; el snapshot conserva
  las columnas). Pedir a mecanico el helper de restauración si hace falta — no improvisar.
- **Cálculo sospechoso:** el hash de una foto real es determinista. Repetir el dry-run del
  mismo id debe dar el mismo hash. Si un blurhash parece corrupto (no base83, longitud
  distinta a ~33), NO commitear: reportar el id en la tarjeta.

## Verificación post-backfill (quién lo comprueba)

```bash
npx wrangler d1 execute el-bunker-db --remote --json --command="SELECT COUNT(*) AS total, SUM(blurhash IS NULL) AS nulos FROM files"
```

Esperado: `total = 527`, `nulos = 0`. (Conteo al cierre de la tarjeta; el valor real lo
reporta quien lo ejecute.)

## Historia y contexto

- `files.blurhash` existe desde A1 (migración 0002_classified_items, aditiva).
- Degradación del Modo Visita: sin blurhash, los ítems clasificados se pintan con tesela
  esmerilada + fecha (diseño `docs/disenos/DISENO_MODO_VISITA_2026-08-04.md` §10-2).
- Plan canónico: `docs/planes/PLAN_CARRILES_ELBUNKER_2026-08-04.md`, ola 3, A6.
- Sin ejecución remota por parte del worker: si el parte menciona mutación de D1 remota
  sin tu OK, es FAIL (aceptación A6).