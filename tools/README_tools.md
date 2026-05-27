# tools/ — el_bunker
> Utilidades de desarrollo. No forman parte del bundle de producción.

---

## pliego_apply.py

Aplicador automático de Pliegos. Lee un `.txt` generado por Claude, extrae los bloques `SEARCH/REPLACE` y los aplica sobre el archivo objetivo. Modo todo-o-nada: si un bloque falla, no se escribe nada.

### Requisitos

- Python 3.10+
- Sin dependencias externas

### Uso básico

```powershell
# Desde la carpeta tools/
python pliego_apply.py pliego_076.txt
```

El script asume que `--root` es la carpeta padre de `tools/` (es decir, la raíz del proyecto). Si ejecutas desde otro directorio:

```powershell
python pliego_apply.py pliego_076.txt --root C:\Proyectos\el-bunker
```

### Opciones

| Flag | Por defecto | Descripción |
|---|---|---|
| `--root <ruta>` | `..` (carpeta padre) | Raíz del proyecto |
| `--archivo <ruta>` | *(detectado del pliego)* | Fuerza un archivo concreto |
| `--dry-run` | off | Simula sin escribir nada |

### Dry-run (verificar antes de aplicar)

```powershell
python pliego_apply.py pliego_076.txt --dry-run
```

Muestra qué bloques coincidirían sin modificar el disco.

### Backup automático

Antes de escribir, el script genera un `.bak_YYYYMMDD_HHMMSS` junto al archivo original. Bórralo cuando confirmes en producción:

```powershell
Remove-Item src\musiclab\WinampPlayer.bak_20260528_002540
```

### Qué hace cuando un SEARCH falla

```
  ✗ SEARCH/REPLACE 3: SEARCH no encontrado en el archivo
```

El archivo **no se modifica**. Causas habituales:

- El archivo fue editado manualmente después de que Claude generó el pliego.
- Espaciado o saltos de línea distintos al original.

Diagnóstico: copia el SEARCH literal desde el archivo con:

```powershell
Get-Content src\core\PlayerContext.jsx | Select-Object -Index (N..M)
```

---

## Formato de pliego compatible

El script parsea pliegos con este formato (sin triple-backtick):

```
PLIEGO-NNN — nombre
Fecha: YYYY-MM-DD
Modelo: qwen3-...
Estado: pendiente
ARCHIVOS: src/ruta/al/Archivo.jsx
CAMBIO: descripción
CRITERIO DE ÉXITO: comportamiento observable
RESULTADO: —

SEARCH/REPLACE 1 — descripción opcional
SEARCH:
<texto exacto a buscar>
REPLACE:
<texto de reemplazo>

SEARCH/REPLACE 2 — descripción opcional
SEARCH:
...
REPLACE:
...
```

Reglas críticas:
- `SEARCH:` y `REPLACE:` deben estar **solos en su línea** (sin texto adicional).
- El bloque termina en la siguiente línea `SEARCH:` o en fin de archivo.
- Un pliego = un archivo (salvo `--archivo` explícito).
- El texto en SEARCH debe coincidir **exactamente una vez**. Si aparece 0 o 2+ veces, el script aborta.

---

## Workflow completo con el script

```powershell
# 1. Guardar el pliego .txt en tools/
# 2. Dry-run opcional
python pliego_apply.py pliego_076.txt --dry-run

# 3. Aplicar
python pliego_apply.py pliego_076.txt

# 4. Verificar en el navegador / Vercel preview

# 5. Commit
git add src/musiclab/WinampPlayer.jsx
git commit -m "PLIEGO-076: extirpación YT + trackVibe"

# 6. Borrar backup cuando confirmes en producción
Remove-Item src\musiclab\WinampPlayer.bak_*
```
