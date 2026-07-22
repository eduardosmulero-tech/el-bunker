# ARCHIVO: task_deepseek.md (cierre 2026-07-13, antes de FASE C.2)

> Encargo vigente hasta 2026-07-13. Reemplazado por nuevo encargo (FASE C.2 + FASE D para GLM 2).
> Conservado únicamente para permitir diff/replay si fuera necesario.

---

# task_deepseek.md — encargo activo (turno: deepseek)

## HERRAMIENTA — paralelizar fases secuenciales de `tools/import-vault.mjs` (demasiado lento con volumen real)

**Estado:** cambio sobre la herramienta que ya construiste (`tools/import-vault.mjs`, ronda
anterior que añadió `--stage`/`--staged`). No es un bug de corrección, es un problema de
rendimiento detectado al probarlo con el volumen real de Edu.

**Contexto de por qué surge esto:**
Edu ya tiene los datos reales en `D:\takeout-import\Takeout` (14082 archivos) y
`D:\dcim-import\DCIM` (2029 archivos). Se lanzó `--stage D:\bunker-import-review` dos veces:

- **1ª ejecución** (foreground, matada por timeout de 10 min de la herramienta que la lanzó, no
  del script): completó escaneo + metadata + hash de los 16111 archivos y llegó a "Deduplicando"
  en pocos minutos — fue rápida.
- **2ª ejecución** (relanzada como proceso desacoplado): se quedó **más de 35 minutos** atascada
  en la fase "Extrayendo metadatos..." sin avanzar apenas (CPU del proceso creciendo muy poco:
  ~4s → ~10s de CPU en 35 min de reloj), claramente I/O-bound. Se mató manualmente.

La causa raíz más probable (a confirmar/diagnosticar tú, no asumas que es la única): el bucle que
lee los metadatos de Takeout es secuencial con `await` uno detrás de otro sobre 14082 archivos
`.json` sidecar, sin ningún log de progreso en ese bucle (el contador `EXIF: X/2029` que se ve en
consola es solo para la fase de móvil que va DESPUÉS, no para Takeout). Con miles de archivos
pequeños en I/O secuencial, cualquier variación de latencia de disco (throttling, indexación de
Windows, antivirus, lo que sea) puede multiplicar el tiempo total de forma dramática, y no hay
manera de saber si avanza porque no hay progreso logueado en ese tramo.

## Qué investigar y arreglar

1. **Localiza los bucles secuenciales reales** en `tools/import-vault.mjs`:
   - Extracción de metadata de Takeout (bucle `for` sobre `takeoutFiles` leyendo `.json` sidecar).
   - Extracción EXIF del móvil (bucle `for` sobre `mobileFiles`, ya tiene progreso pero es igual
     de secuencial).
   - Cálculo de hashes (`fullHashes`/`chunkHashes`, bucle `for` sobre `allScanned` con dos hashes
     por archivo).
   - Revisa si hay algún otro bucle secuencial candidato a paralelizar en el flujo de staging o
     `mainFromStaged`.

2. **Paraleliza con un límite de concurrencia razonable** (no todo a la vez — evita saturar el
   disco y provocar el efecto contrario). Usa un patrón simple de pool/cola con límite configurable
   (algo tipo `p-limit`, o una cola manual como la que ya existe en `uploadBatch` para las subidas —
   reutiliza ese patrón si aplica, no reinventes otro distinto sin motivo). Concurrencia por defecto
   razonable para I/O de disco local: prueba algo en el rango 10-20 y ajusta si tiene sentido tras
   probarlo tú mismo.

3. **Añade progreso logueado en TODOS los bucles largos**, incluido el de metadata de Takeout que
   hoy no tiene ninguno — Edu necesita saber si el script avanza o está colgado. Loguea cada N
   archivos igual que ya se hace para EXIF/hash.

4. **No rompas la resumibilidad ni la corrección del dedupe**: el orden de inserción en los `Map`
   de hashes no debe importar para el resultado final (son claves por `filePath`, así que
   paralelizar no debería cambiar el resultado — verifícalo). Si detectas que algún paso SÍ depende
   de orden secuencial por alguna razón que no sea obvia, dilo explícitamente en el reporte en vez
   de forzarlo a paralelo.

5. Prueba tú mismo el script contra un subconjunto pequeño real o simulado (no hace falta correrlo
   contra los 16111 archivos completos de Edu — eso lo hace él después) para confirmar que:
   - No lanza errores con concurrencia.
   - El resultado final (conteos, dedupe) es idéntico a una pasada secuencial equivalente.

## Restricciones

- **Congelado, NO tocar:** archivos del reproductor/estética (`WinampPlayer.jsx`,
  `AudioVisualizer.jsx`, `PlayerContext.jsx`, `tokens.js`) — irrelevante aquí, pero recuérdalo.
- No cambies el comportamiento funcional (flags `--stage`/`--staged`/`--commit`, formato de
  `staging-manifest.json` / `import-manifest.json`, endpoints de subida) — esto es una optimización
  de velocidad, no un cambio de funcionalidad.
- No borres ni relajes el dry-run por defecto.
- Si añades una dependencia nueva (ej. `p-limit`), verifica que sea trivial de instalar (paquete JS
  puro, sin binarios nativos) — mismo criterio que ya se siguió con `exifr` en la ronda anterior.

## Entregable

- `tools/import-vault.mjs` actualizado con las fases paralelizadas + progreso logueado en todos los
  bucles largos.
- `tools/README-import-vault.md` actualizado si el comportamiento de logging o los flags cambian
  (ej. si añades un flag de concurrencia para estas fases).
- `node --check tools/import-vault.mjs` limpio.
- Reporte breve: qué bucles paralelizaste, con qué límite de concurrencia y por qué, y qué
  resultado de prueba obtuviste (aunque sea contra un subconjunto pequeño).

## Qué hace Edu después (no es parte de tu tarea)

Vuelve a lanzar `node tools/import-vault.mjs --takeout D:/takeout-import/Takeout --mobile
D:/dcim-import/DCIM --stage D:/bunker-import-review` contra su volumen real (16111 archivos) y
comprueba si el tiempo total baja de forma notable.

---
