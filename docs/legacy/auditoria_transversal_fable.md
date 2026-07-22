# AUDITORÍA TRANSVERSAL FABLE — el-bunker (2026-07-07/08, nocturna)

> Mandato del brief: re-verificar lo que `auditoria_fable_1.0.md` y ESTADO dan por bueno
> (FASE A incluida) contra código real + producción EN VIVO. Nada editado, nada commiteado.

## Resumen ejecutivo

1. **FASE A verificada de verdad: los 6 P1 están cerrados también en producción.** Esta vez
   los docs NO mienten (primera vez en la historia del proyecto que un "✅" sobrevive a la
   re-verificación completa).
2. Build 2.33s ✅ · Lint 0 errores ✅ · Tests 12/12 ✅ (aunque solo hay 1 archivo de test —
   cobertura simbólica).
3. El plan vigente (`auditoria_fable_1.0.md` §7, FASES B-D) sigue siendo correcto; nada de lo
   hallado esta noche lo contradice. **Siguiente pliego correcto: FASE B** (reproductor premium).
4. Quedan 2 residuos que la FASE A no cubría y no deben perderse: R2 sin auth (docs sensibles
   fetchables por URL) y la cadena de `tagLabel` que aún puede enseñar UUID si la resolución
   falla.
5. Pendiente humano: Edu no ha confirmado en el móvil la RONDA 6 del menú sort (S145).

## Verificación en vivo (2026-07-08 madrugada)

| Claim de los docs | Verificación | Resultado |
|---|---|---|
| RECAP 404 arreglado (P1.1) | `curl /api/stats/recap` | **401** (desplegado y protegido) ✅ |
| Leak `/api/config` cerrado (P1.2) | `curl /api/config` anónimo | Solo `adventures_start_date` + `schema_version` — whitelist aplicada ✅ |
| Worker vivo | `curl /api/health` | 200 ✅ |
| Header/recorte safe-area (P1.3/P1.5) | `Layout.jsx:605-608` | `paddingTop: calc(80px + env(safe-area-inset-top))` — fórmula correcta y comentada ✅ |
| UUID como metadato (P1.4) | `Layout.jsx:296` | `tag_label ?? resolvedTagLabel ?? tag ?? tag_id` — resolución añadida ✅ (ver residuo abajo) |
| Filtro duplicado (P2.6) | `VaultGallery.jsx:1147` | Ya no renderiza fila propia; recibe `filterCategory` por prop ✅ |
| "17 tablas (verificado S143)" | `grep -c "CREATE TABLE" workers/schema.sql` | **17** ✅ (CLAUDE.md correcto; el "13" del informe Opus quedó viejo) |
| Build/lint/tests verdes | ejecutados esta noche | build 2.33s · eslint 0 · vitest 12/12 ✅ |

## Hallazgos nuevos / residuos (no cubiertos por FASE A)

- **P2 · R2 sirve cualquier `r2_key` sin auth** (hallazgo 12 del informe vigente, sigue
  abierto por diseño de fases). Con categorías VAULT tipo legal/médico/2FA prometidas como
  "caja fuerte", es el item de seguridad más serio que queda. Debe entrar como primera tarea
  cuando toque backend (FASE D o antes si Edu sube docs sensibles reales).
- **P3 · `tagLabel` puede seguir enseñando UUID:** la cadena de `Layout.jsx:296` termina en
  `?? activeTrack.tag ?? activeTrack.tag_id`. Si `resolvedTagLabel` no resuelve (tag borrado,
  db aún no cargada), vuelve el "9f2e1c72…". Barato: último eslabón → `null` y no renderizar.
- **P3 · Cobertura de tests simbólica:** 1 archivo (PlayerContext). Para un repo que es pieza
  de portfolio, un segundo test del router del worker (auth de rutas: que `/api/config` sea
  el ÚNICO endpoint público) costaría poco y blindaría el leak arreglado contra regresiones.
- **P3 · Higiene de repo:** `docs.zip`, `el_bunker_resumen_final.txt` (en raíz del workspace),
  `*.bak_*` dentro de `src/` (`MusicLab.bak_20260604`, `WinampPlayer.bak_20260614`,
  `SmokeSession.jsx.bak_20260617`) — para un repo enseñable a empleadores, mover a
  `docs/legacy/` o borrar (decisión de Edu; nada borrado esta noche).

## Decisiones cuestionadas (solo con dato)

- Ninguna. La cola S145 (6 decisiones FASE B/C) es final y nada la contradice. El reencuadre
  de Edu (VAULT + MUSIC LAB primero) sigue siendo el correcto para el objetivo declarado.

## Gap vs premium (Spotify / Google Photos)

Ya está bien definida y priorizada en `auditoria_fable_1.0.md` §7 (FASES B: carátula-first,
CRT ~0.10 fuera del arte, cola peek · C: galería full-bleed, quitar DEMO fallbacks · D:
backend). Esta auditoría la CONFIRMA sin cambios. Añadir solo: R2-auth sube de P3 a P2.

## Qué ejecuta DeepSeek post-Pro y en qué orden

1. **FASE B** tal como está escrita (cola S145 tiene las decisiones vinculantes) — es
   frontend-only, cero riesgo de backend.
2. Micro-encargo con FASE B: cerrar el residuo `tagLabel` (1 línea) y el test del router
   (auth de rutas) — ambos S.
3. FASE C (galería full-bleed + DEMO fallbacks fuera).
4. R2-auth (P2) como primer encargo backend — requiere `wrangler deploy` (paso manual Edu).
5. Antes de todo: **Edu confirma en el móvil la RONDA 6 del sort** (S145) — 2 minutos, y
   desbloquea dar por cerrado el último bug activo.
