# Informe — piloto del canon de paralelismo en el-bunker

> Ejecuta: n2 (Sonnet/coordinador). Encargo: `cerebro/normas/loop-agentico/ENCARGO_PILOTO_PARALELISMO_ELBUNKER_2026-08-04.md`.
> Canon: `cerebro/normas/loop-agentico/CANON_PARALELISMO_2026-08-04.md` (🟢 CANÓNICO, OK de Edu 4-ago).
> R7: por fase, comando ejecutado + salida literal. Sin salida pegada, la fase no está hecha.

## E1 — PUERTA: carril terminal intocable por el dispatcher

```
$ hermes kanban --board el-bunker create "PRUEBA carril terminal — borrar" --assignee luna --json
→ {"id": "t_ae4414ec", "assignee": "luna", "status": "ready", ...}

$ hermes kanban --board el-bunker create "PRUEBA carril nativo — borrar" --assignee default --json
→ {"id": "t_56d11412", "assignee": "default", "status": "ready", ...}

$ hermes kanban --board el-bunker dispatch --dry-run --json
→ {
  "spawned": [{"task_id": "t_56d11412", "assignee": "default", "workspace": ""}],
  "skipped_unassigned": ["t_504a2707"],
  "skipped_nonspawnable": ["t_dc83fadf", "t_6a19ff8b", "t_0a8cf470", "t_be0de816", "t_ae4414ec"],
  ...
}
```

**Resultado: ✅ PASA.** `luna` (t_ae4414ec) cae en `skipped_nonspawnable` — el carril terminal es
intocable por el dispatcher, verificado con comando real, no solo leído en `kanban_db.py`.
`default` (t_56d11412) sí aparece en `spawned`: informativo, ya anticipado por el encargo — es el
único perfil real en disco (P11), no es un fallo del canon. Tarjetas de prueba archivadas:
`hermes kanban --board el-bunker archive t_ae4414ec t_56d11412` → `Archived t_ae4414ec` /
`Archived t_56d11412`.

## E2 — `espera_carril`

Scripts: `cerebro/normas/loop-agentico/scripts/espera_carril.sh` y `.ps1`.

**Desviación del contrato del encargo, declarada:** el encargo pide `<board>` como posicional
obligatorio; los scripts lo aceptan igual mucho pero lo resuelven solo (vía
`hermes kanban boards show`) si se omite — superset compatible, no rotura. El caso
`ERROR_BOARD <mensaje>` (exit 1, error del binario) **no está implementado** — pendiente.

```
$ sh espera_carril.sh luna el-bunker 5 2   → TU_TARJETA t_6a19ff8b   (exit 0)
$ sh espera_carril.sh claude el-bunker 5 2 → TU_TARJETA t_0a8cf470   (exit 0)
$ sh espera_carril.sh edu el-bunker 5 2    → TU_TARJETA t_dc83fadf   (exit 0)
$ sh espera_carril.sh carril-inexistente el-bunker 4 2 → SIN_TRABAJO (exit 3, tardó ~5s)

$ powershell -File espera_carril.ps1 -Carril luna -MaxSeg 5 -SondeoSeg 2   → TU_TARJETA t_6a19ff8b (exit 0)
$ powershell -File espera_carril.ps1 -Carril claude -MaxSeg 5 -SondeoSeg 2 → TU_TARJETA t_0a8cf470 (exit 0)
$ powershell -File espera_carril.ps1 -Carril edu -MaxSeg 5 -SondeoSeg 2    → TU_TARJETA t_dc83fadf (exit 0)
```

**Bug real cazado y corregido en esta sesión:** la primera versión del `.ps1` usaba
`ConvertFrom-Json` + indexado de array; en PS 5.1, con 2+ tarjetas en el carril, `$tasks[0].id`
devolvía los IDs de **ambas** tarjetas concatenados (`TU_TARJETA t_6a19ff8b t_be0de816`) — bug de
desenvuelto de array conocido de esa versión de PowerShell. Corregido extrayendo el primer `"id"`
por regex sobre el JSON crudo en vez de fiarse de la conversión a objeto. Reverificado tras el fix
(salidas de arriba, con `luna` teniendo 2 tarjetas ready en ese momento).

**No verificado:** el requisito "sin tarjetas → tarda ≥20 s" del DoD original (se probó con
`max_seg=4-5` para no bloquear la sesión; el bucle en sí es correcto — `sleep`/`Start-Sleep` con
el intervalo dado — pero no se cronometró el caso largo).
Ausencia de BOM en el `.ps1`: **no verificado** con `Get-Content -Encoding Byte`.

## E3 — `verifica_ambito`

**PENDIENTE, no hecho.** Comando exacto para la siguiente sesión (o para delegar a n0 vía
command-code, es mecánico — precedencia script-antes-que-LLM):

```
scripts/verifica_ambito.sh / .ps1
  verifica_ambito <ruta-worktree> <base=master> <glob> [<glob>...]
    git -C <worktree> diff --name-only <base>...HEAD
    todo dentro de los globs -> "AMBITO_OK"                      exit 0
    algo fuera               -> "FUERA_DE_AMBITO: <ficheros>"    exit 1
```
DoD: en una worktree de prueba con un fichero dentro del glob y otro fuera, exit 1 y nombra
exactamente el fichero de fuera.

## E4 — Poblar el board

```
$ hermes kanban --board el-bunker list
▶ t_504a2707  ready     (unassigned)  HUD desktop - rediseno para aprovechar escritorio   [preexistente, ajeno al piloto]
▶ t_dc83fadf  ready     edu           C1 — Aceptacion movil real 390x844 y PWA instalada
▶ t_6a19ff8b  ready     luna          A1 — Migracion classified_items + blurhash + endpoints de marcado
▶ t_0a8cf470  ready     claude        B1 — admin-core: shell, ResourceTable, ResourceForm, ConfirmDialog, useAdminResource
▶ t_be0de816  ready     luna          B2 — requireAdmin + esqueleto /api/admin/*
```

Las 4 tarjetas de la Ola 1 llevan `--assignee`, `--project el-bunker` (workspace worktree con rama
determinística), y ÁMBITO+DoD literales en el cuerpo (ver `docs/planes/PLAN_CARRILES_ELBUNKER_2026-08-04.md`).

**DoD parcialmente cumplido:** `list --json` **no** da cero tarjetas `assignee: null` — la tarjeta
preexistente `t_504a2707` (HUD desktop, ajena a este piloto, creada antes de esta sesión) sigue sin
asignar. No es una regresión del piloto: no se ha tocado. Queda anotado, no arreglado — no es mía
(regla del canon: "nadie repara el board a mano" no aplica aquí, pero tampoco es mío decidir su
carril).

Ámbitos de las 4 tarjetas: disjuntos por diseño (ver tabla "Por qué son disjuntas" en
`PLAN_CARRILES_ELBUNKER_2026-08-04.md §2). No re-verificado mecánicamente con `verifica_ambito`
(E3 pendiente) — solo por inspección del plan.

## E5 — Punteros de AGENTS.md/CLAUDE.md

Antes: `hermes kanban list` (sin `--board`, dependía del board "activo" ambiental — frágil si otra
sesión cambia de board con `boards switch`). Corregido a `hermes kanban --board el-bunker list` en
`AGENTS.md` (líneas 53 y 57) y `CLAUDE.md` (línea 5); añadido puntero a
`CANON_PARALELISMO_2026-08-04.md` en ambos. Sin reescribir el resto (siguen magros).

```
$ hermes kanban --board el-bunker list
[board poblado, ver E4]
```
DoD cumplido.

## E6 — Piloto real de punta a punta (una tarjeta completa)

**PENDIENTE, no hecho.** Edu pidió cierre de sesión (`/clear`) antes de reclamar ninguna tarjeta.
Ninguna tarjeta de la Ola 1 tiene claim activo; ninguna worktree existe todavía
(`git worktree list` solo muestra el checkout primario). La siguiente sesión entra en **modo
coordinador** (orden explícita de Edu, 4/5-ago): no es ejecutora de una tarjeta propia por
defecto — reparte, verifica cierres, puebla Ola 2 cuando la Ola 1 avance. Si además quiere
ejecutar `claude` (B1), es una decisión aparte, no automática.

## Estado real al cerrar esta sesión (verificado, no recordado)

```
$ git -C dev/el-bunker status --short
 M CANON.manifest
 M AGENTS.md
 M CLAUDE.md
 M docs/disenos/DISENO_MODO_VISITA_2026-08-04.md
 M docs/disenos/DISENO_PANEL_ADMIN_2026-08-04.md
 M docs/planes/PLAN_CARRILES_ELBUNKER_2026-08-04.md
?? docs/operacional/PILOTO_PARALELISMO_2026-08-05.md   [este fichero]

$ git -C cerebro status --short
 M inbox/claude-code/MEMORY.md
 M inbox/claude-code/proyecto-regimen-ejecucion-sonnet-coordina.md
 M normas/loop-agentico/DISPATCHER_SPEC.md
 M normas/loop-agentico/PROTOCOLO.md
 M perfil/MEMORY.md
 M perfil/USER.md
?? inbox/claude-code/feedback_cierre_sesion_sin_verificar.md
?? inbox/claude-code/feedback_precedencia_mecanica_script_antes_que_llm.md
?? inbox/claude-code/proyecto_opencode_go_suscripcion_vs_opencode_free.md
?? inbox/hallazgo_gate_canon_checklist_20260730.md
?? inbox/prueba.md
?? normas/loop-agentico/CANON_PARALELISMO_2026-08-04.md
?? normas/loop-agentico/CONTRATO_COORDINACION_PARALELA_2026-08-04.md
?? normas/loop-agentico/ENCARGO_PILOTO_PARALELISMO_ELBUNKER_2026-08-04.md
?? normas/loop-agentico/prompts/ARRANQUE_ESCUCHA_CARRIL.md
?? normas/loop-agentico/scripts/espera_carril.ps1
?? normas/loop-agentico/scripts/espera_carril.sh
```

**Nada commiteado en esta sesión salvo el commit `c9c3473`** (los 16 ficheros de F1/F2-A/F2-B/R11
en `plan-cierre-hermes-2026-08-04`, con OK explícito de Edu tras revisión). Todo lo de más arriba
sigue sin commitear — el resto del `cerebro` tiene cambios de **otras sesiones concurrentes**
(`perfil/MEMORY.md`, `PROTOCOLO.md`, `DISPATCHER_SPEC.md`, varios `inbox/*`) que no son míos y no
me corresponde bundlear en un commit propio. No se commitea nada de esto sin OK explícito de Edu,
fichero a fichero — regla de la raíz.

**Board `el-bunker`:** 4 tarjetas `ready`, ninguna reclamada, ninguna worktree abierta. Nada a medio
hacer que pueda perderse.
