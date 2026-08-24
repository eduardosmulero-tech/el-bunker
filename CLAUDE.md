# CLAUDE.md — el-bunker

> Pipeline Promethe-os definido en AGENTS.md (leer primero).
> Docs normativos: docs/Nucleo/CONTRATO.md (ADRs) · docs/Nucleo/REGLAS.md.
> Estado vivo: `hermes kanban --board el-bunker list`.
> Paralelismo: `cerebro/normas/loop-agentico/CANON_PARALELISMO_2026-08-04.md`.
> CLAUDE.md original archivado en docs/legacy/CLAUDE.md.original.
> Workflow de integración verificable y sin coautoría: `docs/operacional/CANON_WORKFLOW_INTEGRACION_HERMES.md`.

## Build & lint
npm run build
npx eslint src/ workers/

## Integración
`done` no significa integrado. Reconciliar cada SHA contra `master`, revisar diffs de ramas antiguas y archivar solo con evidencia de merge y aceptación. No añadir coautoría IA a commits.
