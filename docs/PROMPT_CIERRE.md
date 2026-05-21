# PROMPT CIERRE — el_bunker

Pega esto cuando Claude avise de que le quedan pocos tokens (~90% contexto usado).
Adjunta los 5 docs actuales para que Claude pueda hacer diff mental y actualizar solo lo que cambió.

---

```
Estamos al límite de contexto. Antes de cerrar, actualiza los 5 documentos con TODO lo ocurrido en esta sesión. Genera los archivos completos actualizados listos para sustituir a los anteriores.

Qué debes actualizar en cada doc:

CLAUDE.md:
- § NÚMERO SIGUIENTE DE PLIEGO → siguiente al último aplicado esta sesión
- § CONFIGURACIÓN § Schema actual → versión actual si cambió

ESTADO.md:
- § SESIÓN ACTUAL → mover commits de esta sesión a "Commits sesión [N]", limpiar "hasta ahora"
- § BUGS ACTIVOS → añadir bugs nuevos detectados, marcar resueltos con fecha
- § PRÓXIMA SESIÓN → reordenar cola con lo que quedó pendiente, en orden de prioridad real
- § ERRORES RESUELTOS → añadir fila por cada bug cerrado esta sesión
- § DEUDA TÉCNICA → añadir cualquier deuda nueva detectada

PLIEGOS.md:
- § PRÓXIMO → actualizar número
- § HISTORIAL → añadir fila por cada Pliego aplicado esta sesión con commit si lo hay
- § PENDIENTES → actualizar estado de cada pendiente (completado / desbloqueado / nuevo)

DECISIONES.md:
- Añadir cualquier ADR nueva tomada esta sesión
- Actualizar decisiones existentes si hubo cambio confirmado

CUENTAS.md:
- Actualizar solo si hubo cambio en cuentas, scopes o bibliotecas

Genera los 5 archivos aunque solo haya cambiado uno. Si un doc no cambió, indícalo y no lo generes.
No resumas la sesión en el chat. Solo los archivos.
```
