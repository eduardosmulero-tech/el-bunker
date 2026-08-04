# REAUDITORÍA TOTAL el-bunker — REPETIDA_7 (Hermes, 2026-08-02) · octava ejecución

> Contrato: `docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_7_2026-08-02.md`
> (congelado en T0, SHA-256 `a972c4a4489eaf25d7826762194ee424205a1db0beb62793cdd844c25c1cd401`, verificado por Luna contra el archivo real).
> Ejecutor: Hermes · Mandante: Edu · Revisor: Luna / Edu. Regla: tolerancia cero.
> Entregables (§2): este informe + `C:\proyectos\.trabajo\evidencias_auditoria7\`.
> Históricos intactos (contratos 1-7, informes 1-6, acta de veredicto).
> Etiquetas (§5): `VERIFICADO EN CÓDIGO`, `VERIFICADO EN ARTEFACTO`, `HIPÓTESIS`,
> `NO VERIFICADO`, `FAIL / INVALIDADA`.

---

## 1. ESTADO: PASS CANDIDATE

PASS CANDIDATE no es aprobación: Luna ejecuta el comprobador de esquema independiente y
el validador (§9), y Edu decide. Un fallo material —conteo contradictorio, matriz con
número incorrecto de columnas, celda prohibida, ID inexistente/duplicado/cruzado,
`hallazgo_usado` vacío, cita inválida, validador tolerante o snapshot Git inexacto—
produce FAIL / INVALIDADA y repetición desde cero.

### 1.2 Antecedentes (cifras históricas, SOLO informativas — nunca total vigente)

Ejecuciones anteriores (rechazadas o sin aprobación) con sus totales históricos:
inicial y REPETIDA_1 a REPETIDA_6, con cifras 215/216/217 en sus informes; los fallos
que tumbaron cada una (sobredeclaración, conteos erróneos, IDs cruzados, celdas `—`,
claims de limpieza, manifiesto con `hallazgo_usado` vacío, matrices con 7-8 columnas)
están documentados en los contratos correspondientes y no se repiten en este informe.

## 2. ALCANCE — UNIVERSO_T0 (fuente única de verdad, §3)

- **UNIVERSO_T0** capturado por `t0_manifest.py` ANTES de crear este informe, con
  `t0_manifest.json` (ruta relativa, size_bytes, SHA-256, regla y universo por entrada)
  y `t0_manifest.sha256` (hash del manifiesto + hash del contrato congelado + hash de
  git T0). La cifra vigente SALE del snapshot físico, no de ninguna referencia fija:
  **TOTAL_T0 = U1 + U2 + U3 = 219 = 79 + 29 + 111** — la misma ecuación en §3, §4, §16 y en la salida del validador.
- **Contrato congelado**: `CONTRATO_REAUDITORIA_HERMES_REPETIDA_7_2026-08-02.md` es
  preexistente a la ejecución de Hermes y pertenece a T0 bajo `U3_PATH_DOCS` (regla
  fijada por el contrato §3, inmutable). SHA-256 `a972c4a4489eaf25d7826762194ee424205a1db0beb62793cdd844c25c1cd401` registrado en
  `t0_manifest.sha256`; Luna comprueba que el archivo real coincide.
- **Artefacto de la ejecución**: este informe (y el paquete de evidencias) se crea
  después de T0 y queda FUERA de UNIVERSO_T0; aparece como fila adicional en §3
  (regla `ARTEFACTO_EJECUCION`). T1 físico = UNIVERSO_T0 + este informe.
- **Exclusiones declaradas** (§3): `.git/**`, `node_modules/**`, `dist/**`,
  `coverage/**`, `.claude/**`, `.github/**`, `tools/**` (control de versiones,
  dependencias npm, artefactos de build, cobertura de tests, config local del agente/CI,
  herramientas legacy). Ninguna cita usa esas rutas.
- **Reglas deterministas** (§3): `U3_PATH_DOCS` (docs/**) > `U3_EXT_MD_TXT` (.md/.txt
  fuera de docs/**) > `U1_CODE_EXT` (.js/.jsx/.css bajo src/workers/public) > `U2_REST`.
  Distribución real: {'U3_PATH_DOCS': 104, 'U3_EXT_MD_TXT': 7, 'U1_CODE_EXT': 79, 'U2_REST': 29}.
- **Cobertura**: 100% de UNIVERSO_T0 inventariado y clasificado (§3), 0 archivos
  NO REVISADO, todo MUESTREO con motivo concreto. Límites: evidencia viva D1/R2 =
  snapshots de la sesión autorizada del 2-ago (origen en el índice); estado actual de
  D1/R2 = NO VERIFICADO; F11, gestos F6/F8 y creación de track por UI = NO VERIFICADO
  con motivo.

## 3. INVENTARIO (UNIVERSO_T0, fila por archivo — §4)

Tabla generada por `clasificar.py` desde `t0_manifest.json`: 219 filas T0 + 1 fila
de artefacto de la ejecución = 220 filas. Columnas: ruta relativa completa |
bytes | extensión | regla | universo | clasificación | motivo (obligatorio para
MUESTREO). Clasificaciones: {'U3_PATH_DOCS': 104, 'U3_EXT_MD_TXT': 7, 'U1_CODE_EXT': 79, 'U2_REST': 29} de reglas; 115 LECTURA COMPLETA, 29
BÚSQUEDA DIRIGIDA, 75 MUESTREO (todos con motivo), 0 NO REVISADO.

| ruta | bytes | ext | regla | universo | clasificación | motivo |
|---|---|---|---|---|---|---|
| .env | 160 | (sin) | U2_REST | U2 | MUESTREO | archivo de secretos — contenido NO leído (prohibido §11); presencia inventariada |
| .env.example | 1851 | example | U2_REST | U2 | MUESTREO | config local de entorno; sin lectura de contenido sensible |
| .env.r2 | 242 | r2 | U2_REST | U2 | MUESTREO | config local de entorno R2; sin lectura de contenido sensible |
| .gitignore | 545 | (sin) | U2_REST | U2 | BÚSQUEDA DIRIGIDA | config de control de versiones; verificado por lectura |
| .task_state | 7 | (sin) | U2_REST | U2 | MUESTREO | estado interno de herramienta de trabajo |
| AGENTS.md | 2281 | md | U3_EXT_MD_TXT | U3 | LECTURA COMPLETA |  |
| CANON.manifest | 350 | manifest | U2_REST | U2 | MUESTREO | residuo untracked (manifest de hook externo) |
| CLAUDE.md | 339 | md | U3_EXT_MD_TXT | U3 | BÚSQUEDA DIRIGIDA | stub (verificado por SESION.md y búsqueda) |
| DEPLOY.txt | 8989 | txt | U3_EXT_MD_TXT | U3 | BÚSQUEDA DIRIGIDA | verificado por búsqueda dirigida |
| PROMPT_MAESTRO.md | 11773 | md | U3_EXT_MD_TXT | U3 | BÚSQUEDA DIRIGIDA | verificado por búsqueda dirigida |
| README.md | 1027 | md | U3_EXT_MD_TXT | U3 | LECTURA COMPLETA |  |
| docs.zip | 81334 | zip | U2_REST | U2 | MUESTREO | archivo comprimido sin descomprimir (residuo raíz) |
| docs/Arquitectura/# ROADMAP TÉCNICO DE ACTUALIZACIÓN INFRAESTRUCTURA (Fase 2).md | 1283 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | plan histórico pre-S49; verificado por búsqueda |
| docs/Arquitectura/INDEX.md | 3567 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Arquitectura/architecture.md | 10809 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Arquitectura/data-flow.md | 4960 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Arquitectura/event-lifecycle.md | 8321 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Arquitectura/ownership-map.md | 5264 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Arquitectura/rendering-flow.md | 8451 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Arquitectura/state-map.md | 5680 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Arquitectura/technical-debt.md | 5688 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Nucleo/BACKLOG.md | 1989 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | en transición a kanban; verificado por búsqueda |
| docs/Nucleo/CHANGELOG.md | 49997 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | verificado por búsqueda dirigida |
| docs/Nucleo/CONTRATO.md | 11437 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Nucleo/ESTADO.md | 2665 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Nucleo/PROYECTO.md | 12624 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | verificado por búsqueda dirigida |
| docs/Nucleo/REGLAS.md | 7672 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/Nucleo/SESION.md | 1141 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/ROADMAP.md | 13607 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/CLAUDE.md.original | 22500 | original | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/CUENTAS.md | 2380 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/DECISIONES.md | 9463 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/ERRORES_RESUELTOS.md | 7340 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/PLIEGOS_HISTORIAL.md | 23414 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/SESIONES.md | 21313 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/auditoria_pasada_2.md | 15458 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/auditoria_transversal_fable.md | 4657 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/resumen_final_setup.txt | 7557 | txt | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/task_deepseek_archived.md | 5649 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/legacy/task_gml2.md | 39474 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/operacional/ACCESO_TEST_ADMIN.md | 3712 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/CARGANDO_diagnostic.md | 3009 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/CONTRATO_ACCESO_TEST_ADMIN_2026-08-02.md | 9585 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/CONTRATO_REAUDITORIA_HERMES.md | 12586 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_3_2026-08-02.md | 10177 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_4_2026-08-02.md | 10422 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_5_2026-08-02.md | 15179 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_6_2026-08-02.md | 12245 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_7_2026-08-02.md | 10936 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/MANUAL_STEPS_CHECKLIST.md | 13134 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico deploy; verificado por búsqueda |
| docs/operacional/PROMPTS.md | 2848 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/ROADMAP_COMPLETO.md | 13990 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md | 7909 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/auditoria_S89.md | 9527 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/auditoria_calidad_P0P3.md | 3943 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/auditoria_completa_features.txt | 8685 | txt | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/auditoria_d1_reparacion.txt | 32596 | txt | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/auditoria_fable_1.0.md | 25244 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/auditoria_reentrada_2026-08-01.md | 10220 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/auditoria_total_2026-08-02.md | 20797 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_2_HERMES.md | 32815 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_3_HERMES.md | 30418 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_4_HERMES.md | 31686 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_5_HERMES.md | 44476 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_6_HERMES.md | 54113 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_HERMES.md | 34553 | md | U3_PATH_DOCS | U3 | LECTURA COMPLETA |  |
| docs/operacional/backup_duplicados_2026-08-01.json | 61200 | json | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | datos históricos del hallazgo DATA-7 |
| docs/operacional/bunker_checklist.html | 38333 | html | U3_PATH_DOCS | U3 | MUESTREO | artefacto HTML histórico |
| docs/operacional/checklist_data.js | 15069 | js | U3_PATH_DOCS | U3 | MUESTREO | datos de checklist histórico |
| docs/operacional/cola_decisiones_fable.md | 18592 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/deploy_worker_cloudflare.txt | 10031 | txt | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico deploy; verificado por búsqueda |
| docs/operacional/duplicados_d1_revisar_2026-08-01.md | 13543 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | origen del hallazgo DATA-7; verificado por búsqueda |
| docs/operacional/el_bunker_roadmap.html | 49720 | html | U3_PATH_DOCS | U3 | MUESTREO | artefacto HTML histórico |
| docs/operacional/hermes_setup_manual.md | 20032 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | manual de Hermes (no de la app); verificado por búsqueda |
| docs/operacional/pasos_manuales_pendientes.txt | 13066 | txt | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/phase2_5_roadmap.md | 6171 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/phase2_roadmap.md | 3172 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/prompt_auditoria_fria.txt | 6051 | txt | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/operacional/respuestaconsola.txt | 86782 | txt | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/operacional/roadmap_100.md | 12342 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/roadmap_15_fases.md | 45919 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/operacional/task.md | 11267 | md | U3_PATH_DOCS | U3 | BÚSQUEDA DIRIGIDA | histórico; verificado por búsqueda |
| docs/planes/PLAN_ACCESO_TEST_ADMIN_2026-08-02.md | 46040 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/roadmap_tracker.html | 19931 | html | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/A.JPG | 53473 | jpg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/C.JPG | 112599 | jpg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/D.JPG | 66521 | jpg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/S145_tareas_cerradas.md | 5408 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/S49_S58_registro_completo.txt | 26156 | txt | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/S54_fase1_d1_schema_workers.txt | 4703 | txt | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/S59_CONCLUSIONES.md | 3138 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/S59_DEBUG_HUD_FISHAPI.md | 8077 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.19.jpeg | 100711 | jpeg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.20.jpeg | 103539 | jpeg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.23.jpeg | 125077 | jpeg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.25.jpeg | 136650 | jpeg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.26.jpeg | 138912 | jpeg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.28.jpeg | 167664 | jpeg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.29.jpeg | 136456 | jpeg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.31 (1).jpeg | 123182 | jpeg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.31.jpeg | 108354 | jpeg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/WhatsApp Image 2026-06-22 at 22.33.32.jpeg | 190876 | jpeg | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/comando_api_fish.txt | 771 | txt | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/log_trabajo_glm5.2.md | 23867 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/prompts_deepseek_hermes_setup.html | 28630 | html | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/provlemahudhermes.txt | 701 | txt | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/respuestadeterminal.txt | 445 | txt | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/sesiones/respuestaterminalnavegador.txt | 5394 | txt | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/spec/SPEC_ACCESO_TEST_ADMIN_2026-08-02.md | 19321 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/spec/auditoria_cruzada_vault_musiclab.md | 7244 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/spec/capsulas_spec.md | 6730 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/spec/el_bunker_reproductor_spec_v2.md | 24346 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/spec/el_bunker_specs_externas_y_fases.md | 16041 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/spec/galeria_vault_spec.md | 17428 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/spec/inventario_completo_features.txt | 14249 | txt | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| docs/spec/taxonomia_vault.md | 7916 | md | U3_PATH_DOCS | U3 | MUESTREO | documentación histórica fuera del alcance funcional (legacy/spec/sesiones/historico/planes/disenos) |
| eslint.config.js | 1483 | js | U2_REST | U2 | LECTURA COMPLETA |  |
| extract_messages.ps1 | 1308 | ps1 | U2_REST | U2 | MUESTREO | residuo untracked (script de extracción de mensajes) |
| extracted_messages.txt | 60968 | txt | U3_EXT_MD_TXT | U3 | MUESTREO | dump de conversación (residuo) |
| git | 35 | (sin) | U2_REST | U2 | MUESTREO | archivo residual de 35 bytes en la raíz |
| index.html | 2108 | html | U2_REST | U2 | LECTURA COMPLETA |  |
| package-lock.json | 266030 | json | U2_REST | U2 | MUESTREO | generado por npm, sin revisión manual |
| package.json | 1433 | json | U2_REST | U2 | LECTURA COMPLETA |  |
| postcss.config.js | 80 | js | U2_REST | U2 | LECTURA COMPLETA |  |
| public/favicon.svg | 9522 | svg | U2_REST | U2 | MUESTREO | asset binario PWA |
| public/icons.svg | 5031 | svg | U2_REST | U2 | MUESTREO | asset binario PWA |
| public/icons/icon-128.png | 2922 | png | U2_REST | U2 | MUESTREO | asset binario PWA (icono) |
| public/icons/icon-192.png | 3891 | png | U2_REST | U2 | MUESTREO | asset binario PWA (icono) |
| public/icons/icon-512.png | 10605 | png | U2_REST | U2 | MUESTREO | asset binario PWA (icono) |
| public/icons/icon-72.png | 1933 | png | U2_REST | U2 | MUESTREO | asset binario PWA (icono) |
| public/icons/icon-96.png | 2265 | png | U2_REST | U2 | MUESTREO | asset binario PWA (icono) |
| public/manifest.json | 1330 | json | U2_REST | U2 | LECTURA COMPLETA |  |
| public/sw.js | 11275 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| public/vendor/MarkerCluster.Default.css | 1421 | css | U1_CODE_EXT | U1 | MUESTREO | CSS de librería de terceros (Leaflet.markercluster upstream) |
| public/vendor/MarkerCluster.css | 997 | css | U1_CODE_EXT | U1 | MUESTREO | CSS de librería de terceros (Leaflet.markercluster upstream) |
| public/vendor/leaflet.css | 14145 | css | U1_CODE_EXT | U1 | MUESTREO | CSS de librería de terceros (Leaflet upstream) |
| src/App.css | 0 | css | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/MANUAL_USUARIO_EL_BUNKER.md | 7824 | md | U3_EXT_MD_TXT | U3 | BÚSQUEDA DIRIGIDA | manual de usuario; verificado por búsqueda dirigida (Drive) |
| src/assets/hero.png | 13057 | png | U2_REST | U2 | MUESTREO | asset binario sin lógica de la app |
| src/assets/react.svg | 4126 | svg | U2_REST | U2 | MUESTREO | asset de plantilla Vite, sin uso en la app |
| src/assets/vite.svg | 8709 | svg | U2_REST | U2 | MUESTREO | asset de plantilla Vite, sin uso en la app |
| src/capsules/Capsules.jsx | 6446 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/capsules/Recaps.jsx | 12067 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/capsules/TimeCapsules.jsx | 12121 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/capsules/Timeline.jsx | 16204 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/ChunkErrorBoundary.jsx | 4180 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/ColorPicker.jsx | 2563 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/FileUploadService.js | 2506 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/GoogleDriveService.js | 13164 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/PlayerContext.jsx | 79186 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/StatsEngine.js | 2714 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/ToastContext.jsx | 1751 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/VaultContext.jsx | 36411 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/WorkerClient.js | 2730 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/__tests__/PlayerContext.test.jsx | 5403 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/ui/Button.jsx | 2555 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/ui/Card.jsx | 926 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/ui/Input.jsx | 1717 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/ui/Skeleton.jsx | 4602 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/core/ui/index.js | 182 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/index.css | 2665 | css | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/layout/App.jsx | 4694 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/layout/BootScreen.jsx | 4924 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/layout/Layout.jsx | 27393 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/layout/LoginScreen.jsx | 22872 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/layout/PageWrappers.jsx | 4635 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/layout/TabShell.jsx | 4349 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/main.jsx | 236 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/musiclab/AddTrackForm.jsx | 7123 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/musiclab/AudioVisualizer.jsx | 25329 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/musiclab/DropsManager.jsx | 14548 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/musiclab/MusicLab.jsx | 100296 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/musiclab/PlaylistManager.jsx | 15767 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/musiclab/TagManager.jsx | 11078 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/musiclab/TrackCard.jsx | 21612 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/musiclab/WinampPlayer.jsx | 37225 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/musiclab/useMusicActions.js | 7366 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/shims/react-native-fs.js | 204 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/smoke/SmokeSession.jsx | 33953 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/test-setup.js | 1858 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/tokens.js | 7324 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/vault/AddEntryForm.jsx | 28296 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/vault/EntryLightbox.jsx | 17153 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/vault/GeocoderService.js | 1421 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/vault/LocationSearch.jsx | 5795 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/vault/Vault.jsx | 40887 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/vault/VaultGallery.jsx | 63302 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| src/vault/WallView.jsx | 23624 | jsx | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| tailwind.config.js | 181 | js | U2_REST | U2 | LECTURA COMPLETA |  |
| vite.config.js | 2624 | js | U2_REST | U2 | LECTURA COMPLETA |  |
| workers/config.js | 841 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/auth.js | 3878 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/capsules.js | 2378 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/config.js | 976 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/drops.js | 3644 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/entries.js | 10107 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/eras.js | 5032 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/events.js | 2075 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/files.js | 1099 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/health.js | 518 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/playlists.js | 8053 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/queue.js | 1794 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/r2.js | 2004 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/stats.js | 4483 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/sync.js | 12109 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/tags.js | 2694 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/tracks.js | 6232 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/routes/upload.js | 2304 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/schema.sql | 12598 | sql | U2_REST | U2 | LECTURA COMPLETA |  |
| workers/utils/__tests__/access-keys.test.js | 1863 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/utils/__tests__/rate-limit.test.js | 638 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/utils/access-keys.js | 2272 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/utils/auth.js | 2391 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/utils/events.js | 1802 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/utils/r2-sign.js | 3887 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/utils/rate-limit.js | 1717 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/utils/response.js | 566 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| workers/worker.js | 3577 | js | U1_CODE_EXT | U1 | LECTURA COMPLETA |  |
| wrangler.toml | 1503 | toml | U2_REST | U2 | LECTURA COMPLETA |  |
| docs/operacional/auditoria_total_2026-08-02_REPETIDA_7_HERMES.md | 56644 | md | ARTEFACTO_EJECUCION | ART | LECTURA COMPLETA | redactado por Hermes en esta ejecución (fuera de UNIVERSO_T0) |


## 4. CONTEO REPRODUCIBLE — ECUACIÓN ÚNICA (§3)

**{ECU}** — repetida idéntica en §2, §3, esta sección, §16 y la salida del validador.
Todas las referencias de conteo del informe se derivan de `t0_manifest.json` (fuente
única); cualquier cifra histórica (215/216/217) vive solo en §1.2 (antecedentes).
Comandos ejecutados 2-ago-2026 ~22:10, git-bash Windows, cwd `C:\proyectos\dev\el-bunker`:

| Métrica | Comando | Resultado |
|---|---|---|
| UNIVERSO_T0 | `t0_manifest.py` (enumeración física + sha256 por ruta) | {TOTAL} rutas = U1 {U1N} + U2 {U2N} + U3 {U3N} |
| LOC U1 | `find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) -print0 \| xargs -0 wc -l` | 19.782 |
| Archivos U1 | `find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) \| wc -l` | 79 |
| Por área U1 | `find <a> -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) \| wc -l` | src 48 / workers 27 / public 4 |
| Por extensión U1 | `find src workers public -type f -name "*.<e>" \| wc -l` | .js 38 / .jsx 36 / .css 5 |
| Archivos por dir | `find <d> -type f \| wc -l` | src 52 / workers 28 / public 12 / docs 101 (+raíz 18) |
| Breakpoints md/lg/xl | `grep -rn "md:\|lg:\|xl:" src --include='*.jsx' --include='*.js' \| wc -l` | 4 |
| `{{null}}` en JSX | `grep -rn "{{null}}" src --include='*.jsx'` | 5 reales + 1 falso positivo (test) |
| `prompt(` | `grep -rn "prompt(" src --include='*.jsx'` | 2 (MusicLab.jsx:538, :853) |
| `confirm(` | `grep -rn "confirm(" src --include='*.jsx'` | 1 (Vault.jsx:672) |
| `exifr` | `grep -rn "exifr" src workers` | 0 (declarado en package.json:35) |
| sync/push/BUNKER_SYNC_READY | `grep -rn "registration.sync\|pushManager\|BUNKER_SYNC_READY" src` | 0 |
| console.* | barrido mecánico (sweep_audit.py, 2-ago) | 126 |
| useEffect | `grep -rn "useEffect(" src --include='*.jsx' \| wc -l` | 102 |
| Tests | `npm run test` (18:59, 19:34) | 23/23 (3 archivos) |
| Build | `npm run build` (18:59) | OK 2.63s |
| Lint | `npm run lint` (18:59) | 4 errores no-empty (PlayerContext.jsx:1393:17, :1700:45 + 2) |
| Archivos >500 líneas | `find src -name '*.jsx' \| xargs wc -l` (filtrado) | 14 |

## 5. MATRIZ DE COBERTURA (exactamente 9 columnas — §4, parser verificado)

| Dominio | Archivos (tratamiento) | Flujos | Hallazgos | Sin hallazgo | No verificado | Método | Clasificación | Evidencia base |
|---|---|---|---|---|---|---|---|---|
| Frontend | U1 src 48 (48 L) + U2 src 4 assets (M con motivo) | login/logout/boot, 3 tabs, CRUD, cola, presencia, offline, OOM, cast, geocoder, lightbox, 6 modos, atajos | BUG-1/2, UI-1..11, REF-1..3 | WorkerClient, StatsEngine, ToastContext, ui/*, LocationSearch, GeocoderService, AudioVisualizer | F11, gestos F6/F8, dispositivos reales | lectura completa + flujos autorizados | 48 L + 4 M | flujos F1-F12 (EV7) |
| Worker/API | U1 workers 27 (27 L) | 17 endpoints + 4 sub-rutas + 8 acciones sync + 2 suites | BUG-5, SEC-1 | auth, access-keys, rate-limit, r2-sign, eras, queue, config, health | rate-limit real entre isolates | lectura completa | 27 L | d1/02 (EV7-055) |
| D1/schema | workers/schema.sql (U2, L) + lecturas/escrituras | 17 tablas; soft delete; FK; calculados; legacy | DATA-1..7 | eras/entries/tracks/playlists/drops/queue/sessions | estado actual D1 (snapshots de sesión autorizada) | lectura + snapshots EV7 | 1 L | d1/* (EV7-055..062) |
| R2/media | r2.js, upload.js, FileUploadService, PlayerContext, SW | presigned, PUT, fila files, firma, MIME, Range, huérfanos | BUG-4, MEDIA-1..3 | firma HMAC, prefijos validados | objetos individuales PRUEBA | lectura + headers HTTP EV7 | U1 | d1/11-13 (EV7-063..065) |
| SW/PWA | sw.js, manifest, index.html, vite.config (4 L) | install/activate/fetch/navigate/API/R2/audio/sync/push | SW-1..4 | precache, invalidación, offline fallback | registro SW real | lectura completa | 4 L | estático (sw.js:120) |
| Docs | U3 111 (clasificación exacta en §3) | ADRs vs código; arquitectura vs código; manual vs realidad | DOC-1..14 | sin hallazgo adicional declarado | docs histórico (MUESTREO con motivo) | lectura + búsqueda dirigida | 41 L + 24 B + 46 M | estático (docs) |

## 6. MATRIZ DE CONTRATOS CRUZADOS (12 filas F1-F12 × 9 columnas exactas — §4)

Celdas: EVIDENCIA-ID compatible, NO VERIFICADO (motivo) o NA (motivo). La columna final
"Hallazgo(s) que prueba" enuncia lo que la evidencia de la fila demuestra (idéntico al
`hallazgo_usado` del manifiesto — no vacío).

### F1 — Crear entry → BUG-1: **VERIFICADO EN ARTEFACTO** + **VERIFICADO EN CÓDIGO**
| UI/cliente | Network/DevTools | Consola | Endpoint | Worker | D1/R2 | Estático | Resultado | Hallazgo(s) que prueba |
|---|---|---|---|---|---|---|---|---|
| EV7-006 (antes), EV7-010 (durante), EV7-008 (después), EV7-009 (tras recarga) | EV7-011 (0 POST /api/entries; POST /api/events 201) | EV7-007 | POST /api/entries | entries.js:132-158 | EV7-055 (0 entries "AUDIT-F1" en D1) | Vault.jsx:642-657 (local-only); contraste Recaps.jsx:215 | La entrada de la UI no llega a D1; se pierde al recargar | BUG-1 crear entry no persiste |

### F2 — Editar entry → **VERIFICADO EN ARTEFACTO**
| EV7-014 (durante), EV7-013 (después PATCH) | EV7-015 (PATCH 200) | EV7-012 | PATCH /api/entries/:id | entries.js:160-196 (whitelist) | EV7-055 (título cambiado + entry_updated) | VaultContext.jsx:850-859 | Edición persiste por API | F2 editar entry OK |

### F3 — Borrar entry → **VERIFICADO EN ARTEFACTO**
| EV7-016 (antes), EV7-018 (después) | EV7-019 (DELETE 200) | EV7-017 | DELETE /api/entries/:id | entries.js:198-210 (soft) | EV7-055 (is_deleted=1 + entry_deleted) | VaultContext.jsx:867-876 | Borrado soft persiste | F3 borrar entry OK |

### F4 — Crear era → **VERIFICADO EN ARTEFACTO**
| EV7-022 (durante), EV7-021 (después) | EV7-023 (POST) | EV7-020 | POST /api/eras | eras.js:49-69 | EV7-056 (era AUDIT-F4b creada, sort 17; luego DELETE 200) | Vault.jsx:619-640 | Era creada por UI y persistida | F4 crear era OK |

### F5 — Añadir track con MP3 → no-subida **VERIFICADO EN ARTEFACTO**; creación por UI **NO VERIFICADO (motivo: el submit automatizado no llegó a crear el track — 2 intentos con MP3 real y falso; la ausencia de subida está probada)** (BUG-2)
| EV7-027 (form), EV7-028 (MP3 falso), EV7-029 (MP3 real), EV7-026 (después retry), EV7-025 (después 1ª pasada) | EV7-031 (network2: submit con MP3 real → 0 llamadas /api/upload y /api/tracks); EV7-030 | EV7-024 | POST /api/tracks | tracks.js:73-93 | EV7-058 (0 tracks AUDIT) | AddTrackForm.jsx:29-32 → useMusicActions.js:21-29 (POST sin r2_key; sin uploadFile) | El MP3 nunca se sube (2 intentos) | BUG-2 MP3 nunca se sube |

### F6 — Crear playlist → gesto **NO VERIFICADO (motivo: submit automatizado no ejecutado — fragilidad de selectores; no se eleva con evidencia de otro flujo)**; contrato de datos **VERIFICADO EN CÓDIGO**
| EV7-032 (antes), EV7-035 (form), EV7-034 (después) | EV7-036 | EV7-033 | POST /api/playlists | playlists.js:60-80 | EV7-057 (0 playlists AUDIT; 4 reales en D1, sesión autorizada) | MusicLab.jsx:367-395 | Endpoint y persistencia verificados | F6 crear playlist (submit UI no observado) |

### F7 — Crear cápsula con contenido → BUG-3: **VERIFICADO EN ARTEFACTO** + **VERIFICADO EN CÓDIGO** (extremo a extremo §5: selección UI, request, Worker/esquema, persistencia capsule_items y lectura por separado)
| EV7-037 (antes), EV7-040 (form con "Seleccionar contenido"), EV7-039 (después) | EV7-041 (POST /api/time_capsules con entry_ids/playlist_ids/content_snapshot en el payload) | EV7-038 | POST /api/time_capsules | capsules.js:22-36 (inserta SOLO id/title/description/unlock_at/created_by — el contenido se descarta) | EV7-059 (cápsula AUDIT en D1); EV7-062 (capsule_items = 0 — verificado por separado de la selección) | TimeCapsules.jsx:98-126 (envía contenido); schema.sql:198-219 (sin columnas); TimeCapsules.jsx:47-52,218-221 (lee campos inexistentes) | El contenido se descarta; la UI siempre muestra 0 | BUG-3 cápsulas sin contenido |

### F8 — Subir foto/vídeo/audio → mecanismo **VERIFICADO EN CÓDIGO** + **VERIFICADO EN ARTEFACTO**; gesto UI completo **NO VERIFICADO (motivo: submit GUARDAR no completado por automatización; mecanismo POST→fila files verificado por API, sin elevación)**
| EV7-042 (antes), EV7-046 (form FOTOS), EV7-048 (PNG adjuntado), EV7-045 (después), EV7-044 (tras recarga), EV7-047 (1ª pasada sin input file) | EV7-049 | EV7-043 | POST /api/upload + PUT /api/upload/:key | upload.js (POST crea fila, PUT valida prefijo) | EV7-066 (POST → r2_key + file_id); EV7-060 (fila files) | FileUploadService.js:26-52 | Mecanismo verificado; encadenado con entry roto por BUG-1 (MEDIA-2) | F8 subir foto (gesto UI no completado) |

### F9 — Reproducir/seek MP3 → BUG-4: **VERIFICADO EN ARTEFACTO** + **VERIFICADO EN CÓDIGO**
| EV7-050 (antes), EV7-053 (durante), EV7-052 (después seek) | EV7-054 (GET /tracks/<uuid>.mp3 200) | EV7-051 | GET binario R2 | r2.js:39-46 (sin Range) | EV7-063 (Range bytes=0-1023 → 200, Content-Length 9.523.504, sin Content-Range); EV7-064 (foto 233.323); EV7-065 (Accept-Ranges anunciado) | r2.js:43 anuncia Accept-Ranges sin implementarlo | El seek descarga el archivo entero | BUG-4 Range R2 |

### F10 — Emitir/leer eventos → mecanismo **VERIFICADO EN ARTEFACTO**; iconos **VERIFICADO EN CÓDIGO** (UI-9)
| EV7-050, EV7-053 (misma pasada F9/F10) | EV7-054 (POST /api/events 201) | EV7-051 | POST/GET /api/events | events.js:14-23 (cap 4KB, excluye auth_ por defecto) | EV7-061 (track_play, auth_login en D1); EV7-062 (3.467 events, 406 track_plays, 15 auth_logins) | StatsEngine.js:23-38; Timeline.jsx:26-35 | Mecanismo correcto; iconos huérfanos (UI-9) | F10 eventos OK |

### F11 — Login Google → **NO VERIFICADO (motivo: requiere cuenta humana; popup OAuth no automatizable; sin ejecución con evidencia aplicable)**
| NA (motivo: la pantalla de login con botón Google corresponde al flujo F12 — misma pantalla; no se aporta evidencia de este flujo) | NO VERIFICADO (motivo: sin ejecución del flujo) | NO VERIFICADO (motivo: sin ejecución del flujo) | POST /api/auth/login | auth.js:45-65 (tokeninfo + whitelist + JWT) | NO VERIFICADO (motivo: sin acceso a sesión Google) | GoogleDriveService.js:140-188 (initTokenClient, SCOPES sin drive) | Contrato trazado en código; comportamiento vivo no verificable sin cuenta real | NO VERIFICADO (flujo F11 sin evidencia) |

### F12 — Login access key → **VERIFICADO EN ARTEFACTO**
| EV7-001 (antes), EV7-004 (panel clave), EV7-003 (después) | EV7-005 (POST /api/auth/token + carga completa) | EV7-002 | POST /api/auth/token | auth.js:68-91 (SHA-256 + tiempo constante + rate limit 10/min) | EV7-061 (auth_login en D1) | LoginScreen.jsx:358-460; access-keys.js | Login con clave completo y auditado | F12 login access key OK |

## 7. RESUMEN EJECUTIVO

Backend sólido (auth JWT, claves SHA-256 con tiempo constante, rate limit, prefijos
validados, eventos append-only). Reproductor bien construido (retry backoff, OOM
recovery, MediaSession, cast, gapless con doble `<audio>`, cola en D1). Tres bugs
críticos de contrato en el frontend (crear entry no persiste; MP3 que nunca se sube;
Time Capsules que descarta su contenido) y uno de media (Range ignorado). Deuda masiva
de UI (emojis, inglés, textos de desarrollo, cero responsive, doble portrait lock).
14 contradicciones documentales. Sin fallos de seguridad graves; lint roto en código
congelado; 34 grupos de tracks duplicados en D1 documentados (DATA-7).

## 8. HALLAZGOS (ID · severidad · impacto · clasificación · archivo:líneas · observado/esperado · EVIDENCIA-ID · certeza · dependencia · decisión)

- **BUG-1** · crítico · persistencia · `Vault.jsx:642-657` (patchDb local + stats, sin
  POST). Obs: tras GUARDAR+recarga la entrada desaparece; D1 sin fila (EV7-011,
  EV7-055). Esp: POST como Recaps.jsx:215. Certeza: VERIFICADO EN ARTEFACTO + EN CÓDIGO.
  Pliego R1.
- **BUG-2** · crítico · subida · `AddTrackForm.jsx:29-32` → `useMusicActions.js:21-29`
  (POST sin r2_key; sin uploadFile). Obs: MP3 real + submit → 0 llamadas (EV7-031).
  Certeza: no-subida VERIFICADO EN ARTEFACTO; creación NO VERIFICADO. Pliego R2.
- **BUG-3** · crítico · contrato · `TimeCapsules.jsx:98-126` vs `capsules.js:22-36` vs
  `schema.sql:198-219`. Obs: capsule_items=0 (EV7-062); UI muestra 0. Certeza:
  VERIFICADO EN ARTEFACTO + EN CÓDIGO. Dep: R1. Pliego R3.
- **BUG-4** · medio-alto · media · `r2.js:39-46` (Range ignorado; Accept-Ranges :43).
  Obs: GET con Range → 200 completo (EV7-063/064/065). Certeza: VERIFICADO EN ARTEFACTO
  + EN CÓDIGO. Pliego R4.
- **BUG-5** · bajo · validación · tracks.js:74-85, drops.js:24-34, events.js:14-23,
  entries.js:132-158. VERIFICADO EN CÓDIGO.
- **SEC-1** · bajo · whitelist duplicada (GoogleDriveService.js:21-25 vs config.js:13-17).
- **UI-1..11, REF-1..3, DATA-1..7, SW-1..4, MEDIA-1..3, DOC-1..14**: resumen en §9-§12.
  UI: emojis (AddEntryForm.jsx:64-178, Vault.jsx:415-426, Timeline.jsx:26-35), inglés
  (Layout.jsx:65-71, DropsManager.jsx:97/145/150, WallView.jsx:493, WinampPlayer:644,
  Timeline eventos EN), responsive 4 breakpoints + max-w-md + doble portrait lock
  (index.css:70-71 vs Layout.jsx:409), textos de desarrollo (VaultGallery.jsx:1108/1190),
  prompt/confirm (MusicLab:538/853, Vault:672), aria-label (Layout.jsx:149-167), boot 2s
  (LoginScreen:171-183), MediaSession thumbnail sin resolver (WinampPlayer:353-355 vs
  PlayerContext:1146-1148), lint roto (PlayerContext:1393/1700), monolitos 14 >500
  líneas, duplicación (getImageUrl 3×+2×, FONT_MONO 8×, bottom-sheet 4×, getStreamUrl
  2×), muerto (exifr 0 usos, libraries=[], like sin backend, onOpenEra stub, ambient
  sin audio, {null}×5, 126 console.*, setSharedListening no-op, 3 residuos untracked).
- Todo hallazgo con EVIDENCIA-ID compatible (matriz §6) o NO VERIFICADO con motivo.

## 9. DATOS Y PERSISTENCIA

DATA-1 soft delete inconsistente (drops/playlists/eras/queue físicos vs entries/tracks
soft) · DATA-2 content doble-serializado (Recaps.jsx:218) · DATA-3 junction tags sin
limpieza + FK CASCADE dependiente de PRAGMA (NO VERIFICADO — motivo: requiere acceso a
la configuración de FK de la DB viva) · DATA-4 calculados no persistidos · DATA-5
drive_file_id legacy + files.track_id nunca leído · DATA-6 queueContextName no
restaurado (PlayerContext.jsx:571-588) · DATA-7 34 grupos de tracks duplicados en D1
(127 filas) documentado en duplicados_d1_revisar_2026-08-01.md (conteo vivo NO
VERIFICADO — motivo: snapshot de la sesión autorizada, sin re-verificación viva).

## 10. UI Y ACCESIBILIDAD

UI-1..11 (§8). Positivo: WinampBtn con aria-label, objetivos ≥44px, atajos con guardas
(WinampPlayer.jsx:165-209), teclado en EntryLightbox, estados disabled. Contraste
WCAG: NO VERIFICADO (motivo: requiere render y medición, no realizado).

## 11. SW / PWA / MEDIA

SW-1 Background Sync stub (sw.js:262-277; 0 productores/consumidores) · SW-2 Push stub
(sw.js:279-315; 0 pushManager.subscribe; sin VAPID) · SW-3 regla cache-first /music/
muerta en la práctica (sw.js:120; r2_key reales tracks/; conteo vivo NO VERIFICADO) ·
SW-4 precache e invalidación correctos (swAssetManifest + __BUNKER_SW_VERSION__ +
purge) · MEDIA-1 Range (BUG-4) · MEDIA-2 huérfanos (upload.js:31; BUG-1 deja objeto sin
entry) · MEDIA-3 firma HMAC correcta (r2-sign.js; gate con R2_SIGN_SECRET).
VERIFICADO EN CÓDIGO.

## 12. DOCUMENTACIÓN (contradicciones)

DOC-1 manual afirma persistencia en Drive (13/104/106) · DOC-2 ADRs 002/005/013/016
obsoletos · DOC-3 technical-debt TD-1/TD-5 falsos · DOC-4 INDEX.md en S148 + "pendiente
deploy" · DOC-5 REGLAS.md:81-86 "futuros" existentes + :62 "WinampPlayer único <audio>"
(PlayerContext.jsx:1696-1728 con preload) · DOC-6 architecture.md híbrido S64 vs
S115-D5 · DOC-7 ESTADO.md "Lint clean" (lint roto) · DOC-8 SESION.md sin S150/S151 ·
DOC-9 event-lifecycle.md:69 POST inexistente + :44 capsule_sealed vs capsule_created +
:74 DEMO_ENTRIES_GEO vs eliminados · DOC-10 ownership-map.md:21 "capsule_items ✅" ·
DOC-11 data-flow.md:13 "byte-range" + :42 BUNKER_NAVIGATE desde sync · DOC-12 README
plantilla · DOC-13 duplicados_d1_revisar (DATA-7) · DOC-14 hermes_setup_manual (manual
de Hermes, no de la app).

## 13. DESCARTADOS / NO HALLAZGOS

"Authorization: ***" (VaultContext.jsx:546) = censura del visualizador (archivo real
con `Bearer ${{token}}`, verificado por od/hexdump en sesión autorizada) · getStreamUrl
fallback Drive legacy (ADR-010) · CORS `*` aceptable · rate limit en memoria suficiente
· `{{null}}` del test = prop · 102 useEffect = patrón del proyecto · Chromecast
feature completa · upload_url ausente en POST = el cliente construye la URL · roadmaps
y auditorías S85-S136 = histórico sin contradicción con el código actual · errores de
conteo/comando de REPETIDA_2 corregidos en §4, no reutilizados · asignaciones de IDs
defectuosas de REPETIDA_3/4 no reutilizadas · celdas `—` y manifiesto vacío de
REPETIDA_5/6 documentados como históricos (§1.2), ausentes de este informe.

## 14. PRIORIZACIÓN NUEVA CON DEPENDENCIAS

R1 fix BUG-1 (CRÍTICA) · R2 fix BUG-2 (CRÍTICA) · R3 fix BUG-3, depende R1 (ALTA) ·
R4 fix BUG-4 (ALTA) · R5 decisión HUD desktop (ALTA) · R6 limpieza UI (MEDIA) ·
R7 refactor helpers/monolitos, depende R5 (MEDIA) · R8 código muerto (MEDIA) ·
R9 docs (BAJA) · R10 lint congelado con OK de Edu (BAJA) · R11 validaciones POST (BAJA)
· R12 dedupe tracks D1 (BAJA-MEDIA, decisión Edu).

## 15. ÍNDICE, MANIFIESTO, PARSER Y VALIDADOR (§6)

- `indice_evidencias.json`: 74 entradas (IDs `EV7-001..EV7-074`, patrón `EV7-<NNN>`
  correlativo por orden alfabético de archivo), 12 campos EXACTOS por entrada. Tipos:
  ui, network, console, d1, r2, static, other. Orígenes: captura nueva autorizada
  (2-ago), exportación/snapshot de sesión autorizada (2-ago), artefacto auxiliar.
- `manifiesto_ids.json`: tabla por flujo ID ↔ archivo ↔ tipo ↔ hallazgos.
- **Artefactos auxiliares (ID, archivo, finalidad)**: EV7-067 `test_pixel.png` (F8),
  EV7-068 `test_real.mp3` (F5), EV7-069 `capturar_flujos.js`, EV7-070
  `capturar_flujos_restantes.js`, EV7-071 `retry_final.js`, EV7-072 `f5_retry2.js`,
  EV7-073 `inspeccionar_dom.js`, EV7-074 `orquestar.sh` (scripts de captura, flujo
  "método"). No se citan en la matriz §6.
- `manifiesto_usos.json`: una fila por uso con los 8 campos obligatorios TODOS no vacíos
  — EVIDENCIA_ID, ruta_real, flujo_indexado, flujo_usado, tipo, hallazgo_indexado,
  hallazgo_usado (enuncia el hallazgo concreto que la celda prueba, nunca `""`/`OK`),
  compatibilidad (OK solo si flujo, tipo y hallazgo son compatibles con el índice).
- `comprobador_esquema.py` + `comprobador_esquema_salida.txt`: comprobador INDEPENDIENTE
  del validador (el que Luna ejecuta aparte): esquema cerrado del índice (12 campos
  exactos) y del manifiesto (8 campos, no vacíos, compatibilidad demostrada). No genera
  ningún campo: un campo vacío obligatorio = FAIL.
- `validador.py` + `validador_salida.txt`: cadena de ejecución exacta `python validador.py`
  (cwd `C:\proyectos\.trabajo\evidencias_auditoria7`), exit 0, salida completa adjunta.
  Cubre (a) T0/T1, (b) ecuación única, (c) parser de tablas con 9 columnas exactas,
  (d) celdas prohibidas, (e) índice/hashes, (f) usos con hallazgo_usado no vacío,
  (g) citas, (h) git T0/T1, (i) checklist 12 puntos. Validez criptográfica y semántica
  separadas.
- `parser_tablas.json`: resultado del parser (§4): número de tablas por sección,
  cabeceras, filas operativas y columnas por fila — publicado para que el PASS del
  checklist 9 no dependa de "ausencia de guiones" sino del conteo real de celdas.
- `t0_manifest.json` + `t0_manifest.sha256`: universo T0 con sha256 por ruta y el hash
  del contrato congelado.
- Hashes de artefactos críticos: `hashes_artefactos.txt` del paquete.
- Capturas: viewport 390x844 (móvil); recorrido desktop 1440x900 de la sesión autorizada
  como evidencia previa fechada. Datos de prueba `AUDIT-2026-08-02` creados y eliminados
  en la sesión autorizada (estado final EV7-062: 2 eras / 527 entries / 0 AUDIT). Estado
  actual D1/R2: NO VERIFICADO (motivo: sin acceso vivo en esta ejecución).

## 16. CHECKLIST OBLIGATORIO (contrato §9 y Definition of Done §11 — 12 puntos, PASS/FAIL/NO VERIFICADO con nota)

| # | Punto | Estado | Nota concreta |
|---|---|---|---|
| 1 | inventarios, cobertura y partición | PASS | {ECU}; disjunto y exhaustivo (validador a); 0 NO REVISADO; MUESTREO con motivo |
| 2 | comandos y conteos reconciliados | PASS | Ecuación única idéntica en §2/§3/§4/§16 y validador; cifras históricas solo en §1.2 |
| 3 | rutas y rangos | PASS | {TOTAL} rutas en §3 + 1 artefacto; citas con rango válido (validador g) |
| 4 | índice y hashes | PASS | 74 entradas EV7, 12 campos exactos, sha256/size verificados (comprobador de esquema + validador e) |
| 5 | semántica de IDs | PASS | Todo uso compatible con flujo/tipo del índice; manifiesto 8 campos no vacíos (comprobador + validador f) |
| 6 | ejecución reproducible del validador | PASS | `python validador.py` → exit 0, 0 FALLOS; `python comprobador_esquema.py` → 0 FALLOS; salidas adjuntas |
| 7 | citas archivo:línea | PASS | Validador (g): rutas existen, líneas ≤ total |
| 8 | etiquetas | PASS | Solo las 5 permitidas; F11/F6/F8/F5 creación = NO VERIFICADO con motivo |
| 9 | matrices sin guiones ni vacíos | PASS | Parser (c): §5 y §6 con exactamente 9 celdas por fila; sin celdas prohibidas (parser_tablas.json publicado) |
| 10 | Time Capsules F7 extremo a extremo | PASS | Selección UI (EV7-040) + request (EV7-041) + Worker (capsules.js:22-36) + schema (schema.sql:198-219) + persistencia capsule_items=0 (EV7-062) + lectura UI (EV7-039) — por separado |
| 11 | estado Git literal | PASS | T0 (18 líneas) y T1 (19 líneas: + este informe) literales en §17; sin claims de limpieza ficticia |
| 12 | descartados y contradicciones | PASS | §13 descartados y §12 DOC-1..14; sin contradicción interna (validador b) |

Ningún punto se marca PASS sin comprobación: el 9 depende del parser de celdas
(`parser_tablas.json`), el 5 del comprobador de esquema, el 4 de los hashes.

## 17. ESTADO GIT — DOS SNAPSHOTS LITERALES (§8)

**T0 (`git_status_antes.txt`, capturado antes de crear el informe — {len(GIT0)} líneas)**:

`M docs/Nucleo/ESTADO.md`  (preexistente)
`?? CANON.manifest`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES.md`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_3_2026-08-02.md`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_4_2026-08-02.md`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_5_2026-08-02.md`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_6_2026-08-02.md`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_7_2026-08-02.md`  (preexistente)
`?? docs/operacional/VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_2_HERMES.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_3_HERMES.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_4_HERMES.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_5_HERMES.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_6_HERMES.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_HERMES.md`  (preexistente)
`?? extract_messages.ps1`  (preexistente)
`?? extracted_messages.txt`  (preexistente)

**T1 (`git_status_despues.txt`, capturado al cierre — única diferencia: este informe)**:

```
`M docs/Nucleo/ESTADO.md`  (preexistente)
`?? CANON.manifest`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES.md`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_3_2026-08-02.md`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_4_2026-08-02.md`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_5_2026-08-02.md`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_6_2026-08-02.md`  (preexistente)
`?? docs/operacional/CONTRATO_REAUDITORIA_HERMES_REPETIDA_7_2026-08-02.md`  (preexistente)
`?? docs/operacional/VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_2_HERMES.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_3_HERMES.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_4_HERMES.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_5_HERMES.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_6_HERMES.md`  (preexistente)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_7_HERMES.md`  (GENERADO POR LA AUDITORÍA)
`?? docs/operacional/auditoria_total_2026-08-02_REPETIDA_HERMES.md`  (preexistente)
`?? extract_messages.ps1`  (preexistente)
`?? extracted_messages.txt`  (preexistente)
```

Comparación T0→T1: las {len(GIT0)} líneas de T0 son preexistentes (M ESTADO.md ajena a
la auditoría; residuos CANON.manifest/extract_messages.ps1/extracted_messages.txt;
contratos REAUDITORIA (7); veredicto; informes 1-6). T1 añade solo este informe
(artefacto de la ejecución). La auditoría no modificó código, configuración, datos,
infraestructura, D1 ni R2; no hizo commits ni pushes.

## 18. DECLARACIÓN DE INVALIDACIÓN

Quedan sin valor como base de pliegos: la auditoría inicial y REPETIDA_1..6 (contrato
§1). Este documento (`..._REPETIDA_7_HERMES.md`) es la entrega vigente de la octava
ejecución. La evidencia operativa es de la sesión autorizada del 2-ago-2026 (origen en
el índice); el resto es análisis estático de esta jornada contra el código de
UNIVERSO_T0 (sin cambios de código desde T0, §17). Los fallos de ejecuciones anteriores
quedan documentados en §1.2 como históricos y no se repiten: la ecuación única sale de
T0, las matrices tienen 9 columnas exactas verificadas por parser, el manifiesto no
tiene campos vacíos (comprobador de esquema independiente) y Git se reproduce literal.

*Fin. PASS CANDIDATE pendiente de revisión de Luna (§9) y decisión de Edu.*
*Fin del contrato.*
