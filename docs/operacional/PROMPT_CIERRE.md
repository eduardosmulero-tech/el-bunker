# PROMPT CIERRE — el_bunker

Pega esto cuando Claude avise de que le quedan pocos tokens (~90% contexto usado).
Adjunta los 5 docs actuales para que Claude pueda hacer diff mental y actualizar solo lo que cambió.

---

```
Estamos al límite de contexto. Antes de cerrar, actualiza los 5 documentos con TODO lo ocurrido en esta sesión. Genera los archivos completos actualizados listos para sustituir a los anteriores.

Qué debes actualizar en cada doc:

CLAUDE.md:
- § CONFIGURACIÓN § Schema actual → versión actual si cambió
- § API SURFACE → añadir métodos nuevos si se crearon

ESTADO.md:
- § BUGS ACTIVOS → marcar resueltos (eliminar fila), añadir bugs nuevos detectados con su ID y Pliego asignado
- § SESIÓN ACTUAL → añadir bloque con pliegos aplicados y commits (formato: `[HASH] PLIEGO-NNN: descripción`)
- § DEUDA TÉCNICA → añadir deuda nueva detectada
- § ERRORES RESUELTOS → añadir fila por cada bug cerrado esta sesión
- § FEATURES — ESTADO REAL → actualizar estado de cualquier feature tocada esta sesión

PLIEGOS.md:
- § PRÓXIMO → actualizar número al siguiente del último aplicado
- § PENDIENTES → eliminar Pliegos completados, añadir Pliegos nuevos desbloqueados
- § HISTORIAL → añadir fila por cada Pliego aplicado con commit si lo hay

DECISIONES.md:
- Añadir ADR nueva si se tomó una decisión arquitectónica esta sesión
- Actualizar ADR existente si hubo cambio confirmado

CUENTAS.md:
- Actualizar solo si hubo cambio en cuentas, scopes o bibliotecas

Genera los archivos que hayan cambiado. Si un doc no cambió, indícalo explícitamente y no lo generes.
No resumas la sesión en el chat. Solo los archivos.
```
