# HANDOFF — turno de Opus (B1 admin-core) → Sonnet coordinador

> Opus, 5-ago-2026. Cierre de mi turno en la tarjeta `t_0a8cf470` (carril `claude`).
> Complementa `docs/planes/ENTREGABLE_COORDINADOR_LUNA_2026-08-05.md`, no lo sustituye.
> **Todo lo de aquí está verificado por comando en esta sesión.** Lo que no pude verificar va
> marcado como tal, no como hecho.

---

## 1. Qué entregué

**Dos artefactos, no uno.** El brief pedía un diseño; entregué el diseño **más el DoD escrito como
suite ejecutable**, porque así la ejecución deja de necesitar criterio y la verificación deja de
necesitar una lectura tuya.

| Artefacto | Ruta | Estado |
|---|---|---|
| Diseño paso a paso | `docs/disenos/DISENO_B1_ADMIN_CORE_2026-08-05.md` | escrito · **sin commitear** (repo principal, espera OK de Edu) |
| Contrato ejecutable | `.worktrees/t_0a8cf470/src/admin/__tests__/**` | commiteado en `4bc8ec7` |

El diseño cubre las 6 piezas del brief + una séptima que añadí (`ResourceConsole.jsx`), con props
exactas, estado interno, orden de dependencia y dos anexos (contrato de nombres accesibles;
procedimiento de porte a vinos).

### 1.1 Estado real de la suite de B1

```
npx vitest run src/admin        (desde .worktrees/t_0a8cf470)
→ admin-core-boundaries.test.js   7/7 VERDE
→ useAdminResource.test.jsx       ROJO — módulo inexistente (a propósito)
→ toy-mount.test.jsx              ROJO — módulo inexistente (a propósito)
npx eslint src/admin/           → limpio
```

Los dos rojos **son la especificación**: fallan por módulo que falta, no por sintaxis (verificado).
Ponerlos en verde es exactamente el trabajo que queda de B1.

### 1.2 Lo que NO hice, y por qué

No implementé los 7 componentes. Mi rol es diseñar; ejecutar es del worker
(memoria `feedback-coordinador-pide-antes-de-lanzar-worker-premium`). El diseño + la suite están
hechos para que lo ejecute un modelo barato iterando hasta verde.

---

## 2. Revisión de las tarjetas de Luna — lo que verifiqué yo

**Aviso primero: mis notas de hace un rato caducaron mientras leía.** Empecé a revisar A1/B2 con
los worktrees, encontré que `classify.js` y `admin.js` no estaban enganchados en `workers/worker.js`
y estuve a punto de reportarlo como código muerto. **Ya no es cierto:** Luna cerró la integración
en `3ee54dc` mientras yo leía estados viejos. Lo dejo escrito porque el fallo de método es mío y
conviene que quede: *revisar un carril leyendo su worktree da una foto vieja; hay que releer el
árbol principal justo antes de concluir.*

### 2.1 Lo que está bien, verificado

- **`requireAdmin`** (`workers/utils/require-admin.js`) es correcto y casa con ADR-028:
  `isAdmin(userId)` → `userId === "admin"`, y el 403 sale **antes** de tocar D1 (probado en
  `workers/routes/__tests__/admin.test.js`, que además afirma `db.calls === []`). Eso es el
  riesgo 2 del diseño canónico cerrado bien.
- **El orden del router es correcto, y era el detalle fino.** `ROUTES` despacha por
  `path.startsWith(prefix)` con el **primer match ganando**. Luna puso `/api/admin/g2` en la línea
  52 y `/api/admin/` en la 53. Al revés, el prefijo nuevo habría ensombrecido `/api/admin/g2` por
  completo y la consola G2 habría dejado de existir en silencio. Está bien puesto.
- **Añadió `workers/__tests__/router-contract.test.js`**, que es exactamente la técnica correcta:
  el enganchado del router verificado por test, no por inspección. Converge con lo que hice yo en
  B1 sin habernos coordinado.
- **La migración `0002_classified_items.sql` es aditiva** (`CREATE TABLE IF NOT EXISTS` +
  `ALTER TABLE files ADD COLUMN blurhash`), con rollback escrito al lado. No toca consultas
  existentes.

### 2.2 Lo que queda por verificar antes de cerrar (no lo hice: son acciones sobre datos vivos)

1. **¿Están aplicadas `0002` y `0003` en la D1 remota?** Si no, `/api/classify` devuelve 500 en
   producción con la suite en verde: los tests usan una DB falsa. Es el mismo patrón que ya mordió
   en G2. Verificación: consulta de solo lectura a la D1 remota comprobando que existe
   `classified_items` y la columna `files.blurhash`.
2. **DoD literal de B2:** la tarjeta pedía *"JWT de `admin` → 200"*. El esqueleto devuelve
   `404 "Admin route not implemented"` para admin. Es razonable para un esqueleto sin rutas, pero
   **el DoD no se cumple al pie de la letra**. Decisión de Edu: aceptar como cumplido o dejar la
   tarjeta abierta hasta que B3 monte rutas reales.
3. **Trabajo extra de Luna fuera de contrato:** Edu le pidió directamente trabajo por encima de las
   tarjetas, Luna lo hizo y lo justificó (`68462a8 docs: justify out-of-contract Luna integration`).
   **Consta que lo pidió Edu.** Consecuencia para coordinación: *"done" en A1 y B2 no significa que
   Luna esté libre*, y no debe reasignarse ni cerrarse por encima de ese trabajo.

---

## 3. Hallazgo que afecta a TODO el piloto de paralelismo

**`npx vitest run` desde el repo principal está roto como señal, y nadie lo ha notado.**

```
ficheros de test en el árbol principal:  29
ficheros que recoge vitest:             112
tests ejecutados:                       762   (la línea base documentada era 141)
```

`vite.config.js` no excluye `.worktrees/`, así que vitest recorre los cuatro árboles y ejecuta
cada test **una vez por worktree abierto**. Dos consecuencias:

1. **Un carril en rojo tiñe la suite de todos.** Ahora mismo el repo principal da "2 failed" y los
   dos ficheros son míos, en mi worktree, en rojo a propósito. Cualquiera que corra la suite para
   validar *otra* tarjeta se encuentra un rojo que no es suyo.
2. **Los números de los DoD dejan de ser comparables.** "141/141" y "762 passed" no miden lo mismo,
   y el segundo cuenta cada test hasta cuatro veces.

Es un fallo del piloto, no de nadie en concreto: aparece solo cuando hay varios worktrees vivos, que
es justo lo que estrenamos ayer. **Se arregla con dos líneas** (`exclude` en la sección `test` de
`vite.config.js`), y hasta que se arregle, la orden operativa es: **cada carril valida con
`npx vitest run` desde su propio worktree, nunca desde el principal**.

### 3.1 Bug menor, aparte

`src/core/__tests__/service-boundaries.test.js:11` usa `/\\.(js|jsx)$/` — doble barra. Esa regex no
casa con ningún nombre de fichero (verificado reconstruyéndola). El caso *"does not import the
retired Drive facade from any source module"* lleva pasando **en vacío**: itera sobre cero ficheros.
No lo toqué: está fuera del ámbito P6 de mi tarjeta y podría estar tocándolo otro carril.

---

## 4. Tareas propuestas para el board

Encargo y DoD ya redactados para que se puedan crear tal cual.

| # | Tarjeta | Carril | Depende de | DoD |
|---|---|---|---|---|
| **P0** | Excluir `.worktrees/` de vitest | cualquiera, 5 min | — | `npx vitest run` en el principal recoge 29 ficheros, no 112; suite verde con worktrees abiertos |
| **B1-EXEC** | Ejecutar el diseño de admin-core | worker premium | este handoff | los 3 ficheros de `src/admin/__tests__` en verde + los tests 12.2–12.6 escritos; build y lint verdes |
| **V-A1** | Verificar migraciones en D1 remota | edu / luna | A1 | consulta de solo lectura confirma `classified_items` y `files.blurhash` en remoto |
| **FIX-SB** | Arreglar la regex vacua de `service-boundaries` | cualquiera | — | la regex casa; el test itera sobre >0 ficheros y sigue verde |
| **LUNA-X** | Dar de alta en el board el trabajo extra que Edu pidió a Luna | coordinador | — | existe tarjeta con el encargo real; deja de ser trabajo invisible |

**Sobre B1-EXEC:** propongo **no crear tarjeta nueva** sino reasignar `t_0a8cf470` al ejecutor
cambiando el texto del encargo por: *"Poner en verde `src/admin/__tests__/useAdminResource.test.jsx`
y `toy-mount.test.jsx` implementando `src/admin/core/**` según
`docs/disenos/DISENO_B1_ADMIN_CORE_2026-08-05.md`. No modificar los tests."* Esa última frase es
importante: si el ejecutor puede editar la spec, la spec deja de serlo.

---

## 5. ¿Va bien el plan?

**Sí, con una reserva y una corrección de rumbo.**

**Lo que va bien, y no es poco:** tres carriles avanzaron en paralelo sobre el mismo repo sin un
solo conflicto de merge. Los ámbitos disjuntos del plan de carriles funcionaron exactamente como
estaban diseñados. Eso era la apuesta del piloto y ha salido.

**La reserva — el patrón que se repite:** las dos tarjetas de Luna llegaron a `done` con sus tests
en verde **entregando endpoints que ningún HTTP alcanzaba**. No fue culpa suya: `workers/worker.js`
es el fichero de integración y **no estaba en el ámbito de ninguna tarjeta**, precisamente para
evitar conflictos entre carriles. El reparto por ámbitos disjuntos, llevado al límite, deja huérfano
el punto donde las piezas se enchufan. Se resolvió porque Edu lo pidió a mano, fuera de contrato —
no porque el sistema lo detectara.

**La corrección de rumbo, concreta:** cada ola necesita una **tarjeta de integración explícita, con
un solo dueño y el fichero compartido en su ámbito**, ejecutada en serie al final. Sin eso, el
paralelismo produce piezas correctas que no están conectadas, y el que lo detecta es Edu leyendo
código — que es justo el trabajo que el piloto pretendía ahorrarle.

**Lo que sí escala:** los dos DoD que se cumplieron sin discusión esta ronda fueron los que estaban
escritos como test (`router-contract.test.js` de Luna, `admin-core-boundaries.test.js` mío). Los que
generaron ambigüedad fueron los escritos en prosa ("JWT de admin → 200"). Propongo hacerlo norma:
**si el DoD se puede escribir como test, se escribe como test y se entrega en rojo.**
