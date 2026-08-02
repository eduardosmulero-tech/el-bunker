# AGENTS.md — el-bunker

> App privada tipo bóveda de memoria y reproductor musical para una pareja (Edu y David). Serverless en Cloudflare D1 + R2, OAuth2 Google, PWA Android, React/Vite/Tailwind en Vercel. Pipeline canónico: Promethe-os (MANUAL_PIPELINE_TRABAJO.md).
> Mantener MAGRO (~60 líneas).

---

## 📐 TOPOLOGÍA

- Cloudflare Workers (API), D1 (17 tablas SQL), R2 (el-bunker-music MP3 + vault/photos, vault/videos, vault/docs, vault/audio)
- Worker API: https://el-bunker-api.thebunker-admin.workers.dev
- D1 DB: el-bunker-db
- Frontend: https://el-bunker-beige.vercel.app (React + Vite + Tailwind, Vercel)
- PWA Android. Google OAuth2 solo para auth.

## 📘 MAPA DE DOCS

| Doc | Cuándo |
|-----|--------|
| docs/Nucleo/CONTRATO.md | Normativo: 28 ADRs vigentes |
| docs/Nucleo/REGLAS.md | Workflow legacy, normativo |
| docs/Nucleo/ESTADO.md | Estado actual (transicionando a kanban) |
| docs/Nucleo/SESION.md | Historial de sesiones |
| docs/operacional/ACCESO_TEST_ADMIN.md | Acceso test/admin sin Google (ADR-028) |
| docs/operacional/auditoria_fable_1.0.md | Plan v1.0 |
| docs/Arquitectura/ | Docs técnicos |
| MANUAL_PIPELINE_TRABAJO.md | Canon del pipeline Promethe-os |

## 🚫 RESTRICCIONES ABSOLUTAS

- Motor de audio único: solo MusicLab instancia \<audio\>
- 3 tabs definitivos: VAULT · MUSIC LAB · CAPSULES
- Stats engine único: tabla events en D1
- Google OAuth2 solo para auth. No Drive para persistencia
- Cambios de código por contenedor lógico completo
- NO coautoría IA en commits (R4)
- NO IA en repos públicos (R10)

## ▶ PIPELINE

Pipeline Promethe-os (MANUAL_PIPELINE_TRABAJO.md) es el canon del sistema:
Kanban = estado vivo. Las tareas se gestionan en el board.

Fases: IDEA → CONTRATO → SPEC → PLAN → IMPLEMENTACIÓN → REVIEW-AGENTE → REVIEW-HUMANO

Roles locales:
- Principal (deepseek-v4-flash): orquesta, escribe contratos, verifica
- DeepSeek (deepseek-chat): implementa código
- Workers via constructor CLI: gratis primero, escalar si falla

## ▶ KANBAN = ESTADO VIVO

Para estado detallado: `hermes kanban list`.
Este archivo NO almacena estado de tareas.
ESTADO.md/BACKLOG.md están en transición a kanban.

Para re-entrar: (1) leer AGENTS.md, (2) `hermes kanban list`, (3) primera tarjeta ready.
