# PLAN — Ola 2 de el-bunker, con su tarjeta de integración (P12)

> Opus, 5-ago-2026. Tarjeta `t_565f2055` (carril `opus`).
> **Ejecuta:** `PLAN_CARRILES_ELBUNKER_2026-08-04.md` §3 (Ola 2), corregido con **P12** del canon
> `cerebro/normas/loop-agentico/CANON_PARALELISMO_2026-08-04.md` (enmienda de hoy).
> **Diseños que aterriza:** `docs/disenos/DISENO_MODO_VISITA_2026-08-04.md` ·
> `docs/disenos/DISENO_PANEL_ADMIN_2026-08-04.md`.
> Lo verificado en esta sesión va marcado como tal; el resto es plan, no estado.

---

## 0. Por qué esto no es una copia de §3 del plan de carriles

La Ola 2 ya estaba repartida. Lo que le faltaba —y es lo que falló en la Ola 1— es **quién enchufa
las piezas**. Dos cosas cambian respecto al plan del 4-ago:

1. **La Ola 2 tiene DOS puntos de enchufe, no uno**, y el segundo es peor que el de la Ola 1 porque
   nadie lo ha mirado todavía (§1).
2. **"Ola 2" no es una ola de seis tarjetas paralelas.** Son tres carriles con dependencias en
   cadena. Llamarlo ola invita a lanzarlo todo a la vez y a chocar en `workers/routes/` (§2).

## 1. Los puntos de enchufe de esta ola (verificado hoy)

| Punto | Qué queda huérfano sin él | Verificación en esta sesión |
|---|---|---|
| `workers/worker.js` | A2 crea `workers/routes/session.js`: sin registrar el prefijo, encender/apagar Modo Visita devuelve 404 | es el mismo fichero que dejó A1/B2 desconectadas en la Ola 1 (`3ee54dc`) |
| **`src/layout/App.jsx` (+ `TabShell.jsx`)** | **B1/B3/B4 construyen un panel `/admin` al que no se puede llegar**: hoy no existe punto de entrada en el frontend | `grep -i 'admin\|classify\|session' src/layout/App.jsx` → **0 coincidencias**. `fb52862` y `3ee54dc` tocaron **solo** `workers/**` |

El segundo es el hallazgo que justifica la tarjeta: **la Ola 1 se salvó porque Edu leyó el código;
la Ola 2 repetiría el fallo en el frontend**, donde además el síntoma no es un 404 sino "no pasa
nada al ir a `/admin`", que es más difícil de notar.

**Trampas del enchufe frontend, para quien lo haga:**

- **`/admin` no puede ser un cuarto tab** (ADR-017 🔒-4). `src/layout/TabShell.jsx:16` declara
  `TAB_MAP = { vault, music, capsules }`. El panel se monta **antes** del shell de tabs, por
  `location.pathname`, no dentro de él. El diseño de Edu es explícito: *"ruta aparte `/admin`,
  fuera de los 3 tabs… no aparece en la navegación"*.
- **Enlace directo a `/admin` y Service Worker.** La app es SPA con SW activo (G7 cerrado). Un
  `F5` sobre `/admin` tiene que servir el `index.html`, no un 404 ni una respuesta cacheada de otra
  ruta. **No verificado**: quien integre lo comprueba antes de dar la tarjeta por hecha.
- **El guardia de verdad ya está en el worker** (B2, `requireAdmin`): el frontend esconde, no
  protege. No se añade lógica de autorización nueva en el cliente.

## 2. Reparto real de la Ola 2

**Cadena A — Modo Visita** (carril `luna`, en serie: cada una depende de la anterior)

| # | Tarjeta | Ámbito | DoD |
|---|---|---|---|
| A2 | Claim `visit` en el JWT + encender/apagar con clave | `workers/routes/auth.js`, `workers/routes/session.js` (nuevo), tests | encender sin clave OK; **apagar sin clave → 401**; el claim sobrevive a recarga |
| A3 | Saneamiento server-side en modo visita | `workers/routes/{entries,tracks,capsules,drops}.js`, `workers/utils/visit-filter.js` (nuevo), tests | con `visit:true` la respuesta **no contiene** `r2_key`, URL firmada, título ni nota de lo clasificado; un test por ruta |
| A4 | Filtrado del feed (Timeline/RECAP) | `workers/routes/events.js`, agregador, tests | una entry clasificada no aparece con título en el feed en modo visita |

**Cadena B — Panel admin**

| # | Tarjeta | Carril | Depende de | Ámbito |
|---|---|---|---|---|
| B1-EXEC | Poner en verde `src/admin/__tests__/**` implementando `src/admin/core/**` | ejecutor barato | `t_9800bed2` | `src/admin/core/**` (los tests **no se tocan**: son la especificación) |
| B3 | Descriptores de CONTENIDO + marcado en lote | ejecutor frontend | B1-EXEC, B2, A1 | `src/admin/resources/**`, `src/admin/screens/Contenido.jsx` |
| B4 | Consola de SALUD | `luna` | B2 | `workers/routes/admin-health.js`, `src/admin/screens/Salud.jsx` |

**Suelta — A5** (UI de Modo Visita: desenfoque, interruptor, marcado individual), carril frontend,
depende de A3, ámbito `src/vault/**` + `src/core/VaultContext.jsx` + `src/tokens.js`.

**Qué se puede solapar de verdad:** la cadena A y la cadena B, entre sí. Dentro de cada una, no.
A5 puede empezar cuando A3 cierre. **A3 y A4 tocan `workers/routes/` a la vez que nadie más** — si
B4 se lanza antes de que A4 cierre, se lanza sabiendo que su fichero (`admin-health.js`) es nuevo y
no se solapa; cualquier otra tarjeta de backend que aparezca a mitad se encadena, no se paraleliza.

## 3. INT-Ola2 — la tarjeta de integración (P12)

**Un solo dueño. Al final. En serie. Con los dos ficheros de §1 en su ámbito y en el de nadie más.**

- **Ámbito exclusivo:** `workers/worker.js`, `src/layout/App.jsx`, `src/layout/TabShell.jsx`,
  `workers/__tests__/router-contract.test.js`, `src/layout/__tests__/**`.
- **Ninguna otra tarjeta de la Ola 2 puede tocar esos ficheros.** Si un ejecutor "arregla" el
  router porque parece el paso obvio que falta, la entrega se rechaza (P6) — igual que se le dijo a
  Luna en el contrato de la Ola 1.
- **Dueño:** el carril con más contexto de la ola, **y nunca el mismo turno que entregó las piezas**.
- **DoD, escrito como test** (P12: nada de inspección visual):

| Test | Afirma |
|---|---|
| `router-contract.test.js` extendido | `/api/session` (A2) está registrado y responde; los prefijos ya existentes siguen respondiendo; **`/api/admin/g2` sigue antes de `/api/admin/`** (si se invierte, la consola G2 desaparece en silencio) |
| montaje de `/admin` (jsdom) | con `location.pathname = "/admin"` se renderiza el shell del panel; con `/` se renderiza el shell de tabs |
| guardia de tabs | `TAB_MAP` tiene **exactamente 3 claves** — ADR-017 🔒-4 protegido por test, no por buena voluntad |
| enlace directo | `F5` sobre `/admin` sirve la SPA (comprobación manual documentada si no hay forma barata de testearlo; **se declara pendiente, no se da por hecho**) |

## 4. Orden de arranque recomendado

1. `t_9800bed2` (excluir `.worktrees/` de vitest). **Bloquea a todo lo demás**: mientras no esté,
   cualquier test nuevo se ejecuta una vez por worktree y ningún DoD numérico es comparable.
2. `t_09474b0d` (V-A1, migraciones en la D1 remota). Si `0002`/`0003` no están aplicadas, A2/A3
   construyen sobre una tabla que en producción no existe — el mismo patrón que ya mordió en G2.
3. Cadena A (A2 → A3 → A4) y cadena B (B1-EXEC → B3 → B4) en paralelo entre sí.
4. A5 cuando A3 cierre.
5. **INT-Ola2** cuando A2 y B3 estén en `done`. No antes: integrar a medias obliga a integrar dos veces.

## 5. Lo que decide Edu, no yo

- **Si la Ola 2 entera se lanza o solo la cadena A.** El orden de valor del plan de carriles ya dice
  que Modo Visita es lo que hace la app enseñable, y eso es el motivo por el que el-bunker subió a
  prioridad global.
- **Quién es el dueño de INT-Ola2** (§3). La tarjeta se crea hoy sin `assignee` a propósito:
  asignarla es acto de Edu, como todo carril.
- **B2 al pie de la letra.** Su DoD pedía *"JWT de admin → 200"* y el esqueleto responde
  `404 not implemented`. Sigue pendiente de decisión: aceptar como cumplido o dejarla abierta hasta
  que B3 monte rutas reales.
