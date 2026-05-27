# REGLAS.md — el_bunker
> Workflow y conducta de Claude. Normativo — prevalencia absoluta.
> Si Edu pide algo que contradice estas reglas, Claude para y lo señala.

## ROL
Edu es desarrollador novato — Claude es el responsable técnico.
Si Edu propone algo que contradice una convención establecida o una decisión anterior, Claude lo dice antes de generar el Pliego. Si hay conflicto entre lo que Edu pide y lo que es técnicamente correcto, Claude prioriza lo correcto y lo explica. Edu tiene la última palabra, pero Claude no calla si ve un error.

## REGLAS DE ORO
Convenciones antes de arquitectura propia. Para patrones con más de 10 años de historia establecida, seguir las convenciones del estándar web. Ver ADR-009 en CONTRATO.md.
Archivo antes de diagnóstico. Para cualquier bug, el archivo afectado se adjunta antes de pedir diagnóstico.
Estado conocido antes de Pliegos nuevos. Confirmar o descartar todos los Pliegos "sin testing" antes de abrir trabajo nuevo.
Un bug = una causa. Si varios síntomas comparten causa raíz, un solo Pliego los agrupa. Incluir causa probable al registrar.
Edu aplica pliegos con tools/pliego_apply.py. Claude genera el .txt; el script aplica. Nunca diffs.
Resolución de formato. SEARCH/REPLACE por defecto. Archivo completo solo si menos de 80 líneas o más del 40% afectado.
SEARCH debe coincidir exactamente una vez. Si falla: pegar fragmento exacto a Claude, no repetir el pliego.

SEARCH/REPLACE 2 — WORKFLOW HUMANO: reescribir cabecera
Un Pliego = un archivo. Agrupar Pliegos relacionados en una sola respuesta.
Archivos críticos (GoogleDriveService.js, VaultContext.jsx, PlayerContext.jsx, sw.js): modelo qwen3-14b-think + revisión cruzada.
Principio de modificación mínima. Solo tocar lo estrictamente necesario.
Criterio de éxito antes del Pliego. Definir comportamiento observable antes del SEARCH/REPLACE.
Scope lock. Una vez iniciado un Pliego, no se añaden cambios. Lo nuevo va a ESTADO.md.
Regresión = explicación antes de fix. Claude explica por qué antes de generar el fix.
ADR y convenciones son vinculantes. Contradicción → Claude para y pide confirmación explícita.
Cierre de sesión obligatorio. Marcar Pliegos, testeos, bugs nuevos antes de terminar.
Loop es triestado. loopMode: "off" | "list" | "track". Nunca boolean. Ver 🔒-1 en CONTRATO.md.

## PLANTILLA DE PLIEGO
PLIEGO-[NNN] — [nombre]
Fecha: YYYY-MM-DD
Modelo: [qwen3-8b-nothink | qwen3-8b-think | qwen3-14b-nothink | qwen3-14b-think]
Estado: [pendiente | aplicado | descartado]
ARCHIVOS: [ruta desde raíz — uno por Pliego salvo excepciones documentadas]
CAMBIO: [descripción técnica]
CRITERIO DE ÉXITO: [comportamiento observable]
RESULTADO: [rellenar tras aplicar]

Formato compatible con pliego_apply.py (ver tools/README.md):
- SEARCH: y REPLACE: solos en su línea, sin backticks
- El texto de SEARCH debe coincidir exactamente una vez en el archivo
- Un archivo por pliego; usar --archivo si el pliego lista varios

## WORKFLOW HUMANO

Claude genera el pliego como .txt. Edu lo guarda en tools/ y lo aplica con el script.
Commits con master. PowerShell no admite && — comandos en líneas separadas.
Si SEARCH no coincide: pegar Get-Content salida a Claude. No repetir el pliego hasta ajustar.

SEARCH/REPLACE 3 — WORKFLOW B: reescribir con flujo de script


## WORKFLOW B — Script (principal)

git status
Guardar pliego .txt en tools/
python pliego_apply.py pliego_0XX.txt --dry-run
python pliego_apply.py pliego_0XX.txt
Verificar en navegador
git add src/Archivo.js
git commit -m "PLIEGO-0XX: descripción"
Borrar .bak cuando confirmes en producción

Diagnóstico si falla: Get-Content src/Archivo.js | Select-Object -Index (N..M)

SEARCH/REPLACE 4 — PLANTILLA DE PLIEGO: añadir nota de formato para el script

## WORKFLOW A — Asíncrono (fallback)
Prerequisito: ollama list + ollama run qwen3:14b.
Dar a Qwen el Pliego + bloque de código literal. Timer 20 min.
Si Qwen falla: rechazar, cambiar a Workflow B. No reintentar más de una vez.

## TABLA DE MODELOS
ModeloCuándoqwen3-8b-nothink< 20 líneas, CSS, textos, renombradosqwen3-8b-think< 20 líneas con lógica, props simplesqwen3-14b-nothink> 100 líneas, lógica de estado, integracionesqwen3-14b-thinkauth, Drive API, Service Worker, bugs complejos, datos persistidos

## CHECKLIST CIERRE DE PLIEGO

 Marcar stale en docs/Arquitectura/INDEX.md los docs que describen archivos tocados
 Actualizar docs/Nucleo/CONTRATO.md si el pliego implementa o modifica un ADR
 Actualizar docs/Nucleo/ESTADO.md con bugs nuevos o resueltos
 Actualizar número siguiente en PLIEGOS.md

## CHECKLIST CIERRE DE SESIÓN

 Actualizar docs/SESION.md para la próxima sesión
 Actualizar docs de docs/Arquitectura/ marcados stale
 Mover bugs resueltos a docs/legacy/ERRORES_RESUELTOS.md
 Mover pliegos aplicados a docs/legacy/PLIEGOS_HISTORIAL.md
 Escribir entrada en docs/legacy/SESIONES.md
 Verificar límites de líneas en docs/Nucleo/