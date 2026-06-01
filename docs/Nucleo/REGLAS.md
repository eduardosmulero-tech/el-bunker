# REGLAS.md — el_bunker
> Workflow y conducta de Claude. Normativo — prevalencia absoluta.

## ROL
Edu es desarrollador novato — Claude es el responsable técnico.

## REGLAS DE ORO
Convenciones antes de arquitectura propia. Ver ADR-009 en CONTRATO.md.
Archivo antes de diagnóstico. 
Estado conocido antes de Pliegos nuevos.
Un bug = una causa.
Edu aplica pliegos con tools/pliego_apply.py. Claude genera el .txt; el script aplica. Nunca diffs.
Resolución de formato. SEARCH/REPLACE por defecto. Archivo completo solo si menos de 80 líneas o más del 40% afectado.
**NO MICRO-EDICIÓN:** Los bloques SEARCH deben contener el bloque lógico completo (ADR-015).
Un Pliego = un archivo.
Archivos críticos: modelo qwen3-14b-think + revisión cruzada.
Principio de modificación mínima.
Criterio de éxito antes del Pliego.
Scope lock.
Regresión = explicación antes de fix.
ADR y convenciones son vinculantes.
Cierre de sesión obligatorio.
Loop es triestado.

## PLANTILLA DE PLIEGO
PLIEGO-[NNN] — [nombre]
Fecha: YYYY-MM-DD
Estado: [pendiente | aplicado | descartado]

SEARCH/REPLACE 2 — reemplazar tabla de modelos
ARCHIVOS: [ruta desde raíz]
CAMBIO: [descripción técnica]
CRITERIO DE ÉXITO: [comportamiento observable]
RESULTADO: [rellenar tras aplicar]

Formato compatible con pliego_apply.py (ver tools/README.md):
- SEARCH: y REPLACE: solos en su línea, sin backticks, sin texto adicional.
- El texto de SEARCH debe coincidir exactamente.
- **Obligatorio:** Copiar bloque completo sin re-indentar.
- **Prohibido entre bloques:** cualquier texto entre el contenido del REPLACE y el siguiente SEARCH: se inyecta literalmente en el archivo. Esto incluye cabeceras ── título ──, separadores --- y cualquier comentario. El REPLACE termina donde empieza el siguiente SEARCH:.
- **Multi-bloque:** línea en blanco **obligatoria** tras el último contenido de cada REPLACE cuando hay bloques siguientes — el parser interpreta cualquier texto pegado al REPLACE como contenido a inyectar. El número de bloque va solo en su línea (`SEARCH/REPLACE 1`, sin guión ni texto adicional). Sin títulos ni cabeceras intermedias.

## WORKFLOW HUMANO
Claude genera el pliego como .txt. Edu lo guarda y aplica.
Si SEARCH no coincide: extraer con `Get-Content` el bloque exacto.

## WORKFLOW B — Script (principal)
git status
Guardar pliego .txt en tools/
python pliego_apply.py pliego_0XX.txt
Verificar en navegador
git add src/Archivo.js
git commit -m "PLIEGO-0XX: descripción"

## WORKFLOW A — Asíncrono (fallback)
Prerequisito: ollama list + ollama run qwen3:14b.

## TABLA DE MODELOS
Modelo | Cuándo
deepseek/deepseek-chat    | Todo uso diario: pliegos, bugs, refactors
deepseek/deepseek-r1-0528 | Arquitectura o decisiones complejas

SEARCH/REPLACE 3 — actualizar checklist de cierre de pliego con rutas correctas

## CHECKLIST CIERRE DE PLIEGO
 Marcar stale en docs/Arquitectura/INDEX.md si el pliego toca archivos listados
 Actualizar docs/Nucleo/CONTRATO.md si hay ADR nuevo
 Actualizar docs/Nucleo/ESTADO.md (próximo pliego + bugs)
 pliego_apply.py actualiza ESTADO.md y BACKLOG.md automáticamente

SEARCH/REPLACE 4 — actualizar checklist de cierre de sesión con rutas correctas

## CHECKLIST CIERRE DE SESIÓN
 Actualizar docs/Nucleo/SESION.md con resumen de la sesión
 Actualizar docs de Arquitectura marcados stale en INDEX.md
 Bugs resueltos: pliego_apply.py los registra en BACKLOG.md automáticamente
 Pliegos aplicados: añadir fila a docs/legacy/PLIEGOS_HISTORIAL.md
 Escribir entrada en docs/legacy/SESIONES.md