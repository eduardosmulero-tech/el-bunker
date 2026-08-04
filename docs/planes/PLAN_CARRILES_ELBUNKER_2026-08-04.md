# PLAN — carriles de trabajo paralelo para el-bunker (4-ago-2026)

> **Estado: 🔴 BORRADOR** (n3/Opus). Canónico solo con OK de Edu.
> **Qué es:** las tarjetas a crear en el board `el-bunker`, ya repartidas en carriles y con ámbito
> de ficheros declarado, para que dos o tres frentes trabajen a la vez sin pisarse.
> **Depende de:** `cerebro/normas/loop-agentico/CANON_PARALELISMO_2026-08-04.md` y su encargo de
> piloto (el board `el-bunker` **todavía no existe**: lo crea E1 de ese encargo).
> **Diseños que ejecuta:** `docs/disenos/DISENO_MODO_VISITA_2026-08-04.md` ·
> `docs/disenos/DISENO_PANEL_ADMIN_2026-08-04.md`.

---

## 0. Bloqueo previo — hay que resolverlo antes de abrir ningún carril

El checkout de `el-bunker` tiene **16 ficheros modificados sin commitear**, entre ellos
`workers/routes/{capsules,drops,entries,events,r2,tracks,upload}.js`, `src/core/FileUploadService.js`
y `src/capsules/TimeCapsules.jsx` — exactamente los ficheros que tocan las tarjetas de abajo.

Mientras sigan sueltos no están en ninguna rama, así que **ningún carril puede partir de ellos** y
el merge acabará en conflicto. **Acto de Edu, no de una IA:** commitear ese trabajo en
`plan-cierre-hermes-2026-08-04` (o descartarlo) antes de crear las tarjetas. Es el equivalente a
recoger la mesa antes de repartir.

## 1. Carriles disponibles hoy

Faltan los perfiles de Hermes y el proveedor de lo automático no está decidido (P10/P11 del canon),
así que **hoy todos los carriles son de terminal**: los abre Edu y tiran ellos de las tarjetas.

| Carril | Quién | Para qué |
|---|---|---|
| `claude` | sesión de Claude Code que abra Edu | frontend fino, criterio, integración |
| `luna` | Opus vía freebuff, en modo escucha | diseño y trabajo acotado de backend |
| `edu` | Edu | lo irreversible, lo visual y lo que exige dispositivo físico |

Cuando Edu cierre perfiles + proveedor + gateway, las tarjetas mecánicas de backend pueden pasar al
carril nativo sin reescribirlas: solo cambia el `assignee`.

## 2. Ola 1 — se pueden hacer a la vez (ámbitos disjuntos)

| # | Tarjeta | Carril | ÁMBITO (ficheros que puede tocar) | DoD |
|---|---|---|---|---|
| **A1** | Migración `classified_items` + columna `files.blurhash` + endpoints de marcado | `luna` | `migrations/**`, `workers/routes/classify.js` (nuevo), `workers/routes/__tests__/classify.test.js` | migración aplica y revierte en D1 local; tests de marcar/desmarcar/lote; `npm test` en verde |
| **B1** | `admin-core`: shell, `ResourceTable`, `ResourceForm`, `ConfirmDialog`, `useAdminResource` | `claude` | `src/admin/core/**`, `src/admin/__tests__/**` | monta con un descriptor de juguete; **cero imports** de `src/vault`, `src/musiclab`, `src/capsules` (verificado con grep); build y lint en verde |
| **B2** | `requireAdmin` + esqueleto `/api/admin/*` | `luna` | `workers/routes/admin.js` (nuevo), `workers/utils/require-admin.js` (nuevo), sus tests | JWT de `admin` → 200; JWT de `edu` → **403 antes de tocar D1**; test que lo prueba |
| **C1** | Aceptación móvil real 390×844 y PWA instalada | `edu` | — (dispositivo físico) | checklist de `PLAN_CIERRE_HERMES` C2/C3 con capturas |

**Por qué son disjuntas:** A1 y B2 crean ficheros nuevos en `workers/routes/` sin tocar los
existentes; B1 vive entero en `src/admin/`; C1 no toca código.

## 3. Ola 2 — dependen de la ola 1 (`link` en el kanban, no paralelizar)

| # | Tarjeta | Carril | Depende de | ÁMBITO | DoD |
|---|---|---|---|---|---|
| **A2** | Claim `visit` en el JWT + encender/apagar con clave | `luna` | A1 | `workers/routes/auth.js`, `workers/routes/session.js` (nuevo), tests | encender sin clave OK; **apagar sin clave → 401**; el claim sobrevive a recarga; rate limit 10/min activo |
| **A3** | Saneamiento server-side en modo visita | `luna` | A2 | `workers/routes/{entries,tracks,capsules,drops}.js`, `workers/utils/visit-filter.js` (nuevo) | con `visit:true` la respuesta **no contiene** `r2_key`, URL firmada, título ni nota de lo clasificado; test por cada ruta |
| **A4** | ⚠️ Filtrado del feed (Timeline/RECAP) en modo visita | `luna` | A3 | `workers/routes/events.js`, agregador | **el test que importa**: una entry clasificada no aparece con título en el feed en modo visita |
| **A5** | UI: desenfoque temático, interruptor y marcado individual | `claude` | A3 | `src/vault/**`, `src/core/VaultContext.jsx`, `src/tokens.js` | tesela borrosa con estética búnker; interruptor pide clave para apagar; sin emoji, iconos SVG |
| **B3** | Descriptores de CONTENIDO + marcado en lote | `claude` | B1, B2, A1 | `src/admin/resources/**`, `src/admin/screens/Contenido.jsx` | CRUD de las 6 entidades; marcar una era entera en un gesto; borrado exige escribir el nombre |
| **B4** | Consola de SALUD | `luna` | B2 | `workers/routes/admin-health.js`, `src/admin/screens/Salud.jsx` | reproduce los recuentos que Edu hizo a mano (527/527, 1.054 refs, 0 colgantes) |

**A3 y A4 tocan `workers/routes/` a la vez que nadie más**: por eso van en serie con A1/A2 y no
comparten ola con B2.

## 4. Ola 3

| # | Tarjeta | Carril | ÁMBITO | Nota |
|---|---|---|---|---|
| **A6** | Backfill de `blurhash` para los 527 archivos | `luna` | `tools/backfill_blurhash.*`, D1 | script local sobre R2; snapshot + rollback antes de escribir; no bloquea a A5 (hay degradación temática) |
| **B5** | Consola de AUDITORÍA (lectora de `events`) | `claude` | `src/admin/screens/Auditoria.jsx` | **cliente** del agregador, ADR-019 🔒: prohibido agregador paralelo |
| **B6** | Consola de ACCESOS (rotación de claves, revocación) | `luna` | `workers/routes/admin-access.js`, `src/admin/screens/Accesos.jsx` | resolver primero **cómo se revoca** un JWT autofirmado de 24 h; es decisión de diseño, no de implementación |
| **D1** | ADR-029 y ADR-030 al `CONTRATO.md` | `edu` | `docs/Nucleo/CONTRATO.md` | solo tras el OK de Edu a los dos diseños |

## 5. Orden de valor si hay que recortar

Si la semana da para menos de lo previsto, este es el orden que deja más valor en pie:

1. **A1 → A2 → A3 → A4 → A5** (Modo Visita completo). Sin esto no puede enseñar la app, que es el
   motivo por el que el-bunker subió a prioridad global.
2. **B1 + B2 + B3** (admin-core + contenido). Es lo que se reutiliza en vinos y lo que hace el
   marcado en lote llevadero.
3. **B4** (salud), que le ahorra a Edu las sesiones de fontanería.
4. El resto.

**A6 y B5 son las primeras en caer**: la degradación de blurhash es aceptable y la auditoría luce
mucho pero no desbloquea nada.

## 6. Reglas que toda tarjeta hereda

- Commit **solo** en la rama de su worktree; el merge lo hace Edu (P5 del canon).
- Cierre con `complete --metadata '{"changed_files":[…]}'` — sin evidencia no hay tarjeta cerrada.
- Nada irreversible (deploy, migración remota, borrado en D1/R2) sin Edu delante.
- No tocar el motor de audio (ADR-018 🔒-3) ni crear un cuarto tab (ADR-017 🔒-4).
- Sin coautoría de IA en los commits.
