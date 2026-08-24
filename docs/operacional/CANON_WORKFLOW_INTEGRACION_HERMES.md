# Canon operativo: integración verificable con Hermes

> Política de trabajo para proyectos coordinados mediante Hermes/Kanban. En El Búnker es normativa operativa y complementa `AGENTS.md`, `docs/Nucleo/REGLAS.md` y `MANUAL_PIPELINE_TRABAJO.md`.

## 1. La tarjeta no es la entrega

El estado `done` significa únicamente: **implementación terminada en su worktree y lista para revisión**. No significa integrada, publicada ni aceptada.

La cadena de verdad es:

```text
IDEA → CONTRATO → SPEC → PLAN → READY → RUNNING → DONE
     → REVIEW-AGENTE → REVIEW-HUMANO → MERGE-READY → INTEGRATED
     → ACCEPTED → ARCHIVED
```

Si Hermes no dispone de todos esos estados, se representan con estado disponible, comentario estructurado, SHA, adjuntos y dependencias. Nunca se infiere un estado por el título o por un “hecho”.

## 2. Evidencia mínima obligatoria

Toda tarjeta `done` debe dejar:

- SHA del commit de entrega y rama/worktree.
- SHA/base contra el que se verificó.
- Ficheros tocados y comprobación de alcance.
- Comandos ejecutados y salida literal.
- Tests, build y lint aplicables.
- Capturas móvil/escritorio cuando cambie UI.
- Riesgos, límites y aquello que no pudo verificarse.
- Veredicto: `INTEGRADO`, `INTEGRABLE`, `DUPLICADO`, `OBSOLETO`, `BLOQUEADO` o `NO VERIFICABLE`.

La ausencia de evidencia produce `NO VERIFICABLE`, nunca `PASS`.

## 3. Reconciliación de tarjetas done

Antes de cualquier merge:

1. Comprobar si el SHA ya es ancestro de `master`.
2. Si lo es, registrar `INTEGRADO` y no fusionar de nuevo.
3. Si no lo es, comparar `git diff master...SHA`.
4. Revisar el contrato vigente y las dependencias.
5. Clasificar como integrable, duplicado, obsoleto, bloqueado o no verificable.
6. Para cambios integrables basados en un árbol viejo, extraer el cambio lógico sobre `master` actual; no fusionar ramas divergentes a ciegas.
7. Ejecutar la batería y auditoría post-merge.
8. Archivar solo cuando exista SHA ancestro, evidencia y aceptación.

## 4. Merge train por grafo

El orden de integración sigue dependencias, no antigüedad:

```text
canon/contrato → seguridad/datos → shell/navegación → superficies
→ búsqueda/enlaces → sync/offline → auditoría → aceptación → release
```

Una tarjeta bloqueada, en `triage` o con decisión pendiente no se “desbloquea” por conveniencia. Se documenta la razón y se espera el gate correspondiente.

## 5. Prohibiciones

- No fusionar todas las tarjetas `done` en bloque.
- No usar fixtures como prueba de datos reales.
- No declarar superioridad por porcentaje o apariencia.
- No reintroducir ADR/spec obsoletos desde ramas antiguas.
- No cerrar por pruebas anteriores a un merge posterior.
- No añadir coautoría, footer o atribución de IA a commits.
- No hacer deploy ni mutaciones remotas sin autorización explícita.

## 6. Contrato de handoff

Cada relevo debe señalar:

```text
BASE_MASTER:
SHA_ENTREGA:
VEREDICTO:
EVIDENCIA:
NO_INTEGRADO:
SIGUIENTE_ACCION:
GATES_HUMANOS:
```

El siguiente agente empieza por Kanban, no por memoria conversacional. Debe repetir la auditoría si toca una superficie ya auditada.

## 7. Cómo superar el estándar

El objetivo no es mover tarjetas más rápido, sino reducir entregas falsas:

- Trazabilidad intención → contrato → spec → tarjeta → código → test → captura → merge → aceptación.
- Gates automáticos de build, tests, lint, diff, overflow, clipping, consola, HTTP y accesibilidad básica.
- Worktrees aislados, pero reconciliación semántica contra `master` actual.
- Benchmark competitivo por flujo, con métricas y criterio de superioridad explícito.
- Beta con usuarios reales antes de release.
- Evidencia regenerable y auditable, no declaraciones.

Esta política se adopta primero en El Búnker. Para otro proyecto, copiar el documento a su documentación normativa, enlazarlo desde su `AGENTS.md`/reglas y adaptar únicamente nombres de ramas, comandos y gates técnicos. El proyecto debe conservar además un ledger de reconciliación de `done` y no archivar tarjetas mientras el board tenga inconsistencias de identidad, SHA o workspace.
