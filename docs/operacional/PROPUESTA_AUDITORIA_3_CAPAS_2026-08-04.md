# PROPUESTA — Auditoría UI reproducible en 3 capas (revisión de Opus)

> Estado: PROPUESTA pendiente de revisión por Opus (arquitectura/diseño).
> Autor: Hermes · Fecha: 2026-08-04 · Rama: plan-cierre-hermes-2026-08-04
> Contexto: auditoría UI completa del 4-ago (`docs/operacional/auditoria_ui_2026-08-04/`) — la sesión se cortó a medias, el primer informe se quedó sin hallazgos visuales (39 títulos truncados en las 3 tabs) y hubo que repetir el turno completo con el canon DOM-first.
> Este documento es autocontenido: no requiere leer la conversación original.

---

## 1. Problema que resuelve

La auditoría UI del 4-ago se ejecutó como un pase único, secuencial y manual: el agente navegó pantalla por pantalla, click a click, midiendo por consola. Resultados observados:

| Síntoma | Causa raíz |
|---|---|
| 489 mensajes / ~1h para un barrido que debía ser mecánico | Verificación manual de cada elemento; el LLM hace trabajo de script |
| Primer informe sin los 39 cortes de títulos (H-11/H-12/H-13) | El análisis visual dependía de un modelo de visión que alucina; sin medición DOM previa, lo visual se perdía |
| 4 OOM kills del navegador headless con 527 fotos | Infraestructura remota sin memoria suficiente; sin sustituto de móvil (resizeTo no emula 390x844) |
| Trabajo perdido al cortarse la sesión | Sin checkpoint reproducible: el estado vivía en la conversación, no en un artefacto |
| Cada auditoría futura empezaría de cero | Sin línea base ni comparación de deltas |

## 2. Propuesta: auditoría en 3 capas

Analogía: el pase manual es revisar un edificio habitación por habitación con linterna. La propuesta es un escáner que mide todas las habitaciones a la vez y entrega el plano con las grietas marcadas; el agente interpreta el plano y verifica a mano solo lo que necesita juicio.

### Capa 0 — Script reproducible (mecánico, sin LLM)

Un script Playwright local (Chrome/Edge de la máquina, no el headless remoto) que:

1. Hace login test/admin (clave ADR-028 fuera del repo, `C:\proyectos\.trabajo\bunker_admin_key.txt`).
2. Recorre las 3 tabs (VAULT, MUSIC LAB, CAPSULES) y todos los modos/sub-tabs.
3. **Mide por DOM el canon DOM-first codificado** (sin depender del LLM):
   - textos con `scrollWidth > clientWidth + 3` (truncamiento, con px exactos y elemento)
   - elementos fuera del viewport
   - solapamientos entre hermanos (área de intersección > 35%)
   - contenedores con overflow
   - errores de consola JS y respuestas HTTP >= 400 (p. ej. el 429 de `GET /api/queue/admin`)
4. Captura screenshots por pantalla en **desktop 1440x900 y móvil 390x844 emulados de verdad** (Playwright emula viewport; el headless remoto no).
5. Emite un JSON con todos los hallazgos medidos (elemento, medidas, pantalla, vista).

Tiempo estimado: ~5 min por ejecución. El resultado es reproducible por cualquiera y no depende de la memoria del agente.

### Capa 1 — El agente interpreta (razonamiento)

Con el JSON de la Capa 0:

- Verifica los flujos críticos no mecánicos: crear entrada → fila en D1 remoto, subir MP3 → r2_key en D1 + objeto R2, sellar cápsula → time_capsules + capsule_items, logout → sessionStorage limpio.
- Decide qué es bug y qué es diseño (severidad, deduplicación).
- Redacta el informe con los hallazgos medidos + evidencia capturada.

### Capa 2 — Confirmación humana en dispositivo real

Lista corta de verificación para Edu (no un barrido): play de audio real, PWA instalada/offline, tacto, safe-area. Lo que el script no puede producir no se inventa: se declara pendiente.

### Línea base + delta (el salto real)

El JSON de la primera ejecución se guarda como línea base. Las ejecuciones posteriores comparan contra ella y el informe es **solo lo que cambió**: "3 cortes nuevos en MUSIC LAB, el 429 desapareció, nada más". Convierte "revisar toda la app" (1h) en "verificar que no se rompió nada" (~10 min) tras cada cambio de código.

## 3. Dónde encaja en el repo

- Script: `tools/audit-ui/` (patrón ya usado en vinos-carta-app con `tools/shots.mjs`: Puppeteer/Playwright local, capturas por viewport, medición de contraste).
- Informe generado: `docs/operacional/auditoria_ui_YYYY-MM-DD/` (misma estructura que la actual).
- Línea base JSON: `tools/audit-ui/baseline/` (o `docs/operacional/auditoria_ui_2026-08-04/baseline.json`).
- Skill `dogfood` actualizado con el protocolo de 3 capas (ya contiene el canon DOM-first, incorporado el 4-ago).

## 4. Coste / beneficio

| | Coste | Beneficio |
|---|---|---|
| Construcción Capa 0 | ~1-2h (script Playwright + login + barrido) | Barrido mecánico de toda la app en ~5 min, sin huecos visuales, sin tokens |
| Integración Capa 1 | ~30 min (formato del informe) | El LLM gasta tokens solo donde hay juicio |
| Línea base + delta | ~15 min | Auditorías futuras = deltas, no barridos completos |
| Total | ~2-3h | Cada auditoría posterior < 30 min; nada visual se escapa; los cortes de sesión no pierden trabajo |

## 5. Puntos que se piden a Opus (veredicto, no re-ejecución)

1. **¿El enfoque de 3 capas es correcto?** ¿Falta una capa (p. ej. accesibilidad automatizada, rendimiento) o sobra alguna?
2. **¿Playwright local en la máquina de Edu es la infraestructura adecuada**, o conviene otro destino (CI en GitHub Actions, contenedor, el headless remoto con más memoria)?
3. **¿La línea base JSON + delta es el formato correcto** para comparar ejecuciones, o hay un formato/estructura mejor (p. ej. snapshots de capturas, comparación visual por píxel)?
4. **¿El checklist pre-generado desde el código** (inventariar handlers/onClick por pantalla antes de navegar) debe formar parte de la Capa 0, o es Capa 1?
5. **Prioridad**: ¿esto va antes o después del HUD desktop (t_504a2707)? La auditoría 3-capas es infraestructura de verificación; el HUD desktop es deuda de producto que la propia auditoría destapó.

## 6. Referencias

- Informe actual: `docs/operacional/auditoria_ui_2026-08-04/INFORME.md` (H-01..H-14) y `CHECKLIST.md` (66 items).
- Canon DOM-first: sección "MÉTODO Y LIMITACIONES" del INFORME y skill `dogfood`.
- Requisito HUD desktop: tarjeta kanban `t_504a2707` (board `el-bunker`).
- Patrón de capturas multi-viewport ya validado: `tools/shots.mjs` en vinos-carta-app.
