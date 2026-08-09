# ARRANQUE — Luna, carril `luna`, board `el-bunker`

> Para pegar tal cual en el CLI de Luna (freebuff) en cuanto Edu abra la sesión. Adaptado de
> `cerebro/normas/loop-agentico/prompts/ARRANQUE_ESCUCHA_CARRIL.md` para este arranque concreto
> (carril y board ya fijados, más un paso 0 que el genérico no tiene). Autocontenido a propósito:
> no has leído nada más de este repo todavía.
>
> Canon: `cerebro/normas/loop-agentico/CANON_PARALELISMO_2026-08-04.md`.
> **Solo Edu pega esto.**

---

## Paso 0 — lee tu contrato ANTES de tocar nada

Las dos tarjetas que te esperan (A1, B2) ya existen en el board, pero sus cuerpos son deliberadamente
cortos. Todo lo que necesitas de verdad — el schema literal, qué helpers del repo ya existen y no
debes reinventar, el patrón exacto de tests, y qué ficheros tienes explícitamente prohibido tocar
aunque parezca el paso obvio — está en:

```
docs/planes/CONTRATO_LUNA_A1_B2_2026-08-05.md
```

Léelo entero antes del paso 1. Es tu única fuente de contexto además de lo que `context <id>` te
dé por tarjeta — no hace falta que explores el resto del repo por tu cuenta salvo lo que el
contrato te señale explícitamente (p. ej. `workers/routes/admin-g2.js` como ejemplo real).

Trabajas como **carril `luna`** del tablón **`el-bunker`**. Tu única fuente de verdad operativa es
ese tablón: no hay ficheros de turno, ni buzones, ni estado en ningún otro sitio.

## Tu ciclo, en bucle, hasta que Edu cierre esta sesión

1. **Espera trabajo** (acción bloqueante, no te quedes "atento" sin ejecutarla):
   `espera_carril luna el-bunker`
   - `TU_TARJETA <id>` → sigue al paso 2.
   - `SIN_TRABAJO` → **relanza el paso 1 inmediatamente, sin comentar nada.**

2. **Reclama** (atómico — si otro se te adelantó, falla y vuelves al paso 1):
   `hermes kanban --board el-bunker claim <id> --ttl 3600`
   Imprime la ruta de tu workspace. **Todo tu trabajo ocurre ahí dentro y en ningún otro sitio.**

3. **Lee el encargo completo de la tarjeta:**
   `hermes kanban --board el-bunker context <id>`
   Incluye el cuerpo de la tarjeta, resultados de tarjetas padre y comentarios. Cótejalo con la
   sección correspondiente (A1 o B2) de `CONTRATO_LUNA_A1_B2_2026-08-05.md` que ya leíste en el
   paso 0 — el contrato manda en el detalle, la tarjeta te da el ámbito y el DoD formal.

4. **Trabaja**, con tres límites que no puedes cruzar:
   - **Workspace:** solo el directorio que te devolvió el `claim`. Nunca el checkout primario del
     proyecto, nunca el de otro carril.
   - **Ámbito:** solo los ficheros que la tarjeta declara. El contrato ya te avisa de uno que se
     presta a confusión: **no toques `workers/worker.js`** en ninguna de las dos tarjetas, aunque
     parezca que falta registrar la ruta — eso lo hace quien integra, después.
   - **Convenciones:** reutiliza lo que ya existe (`isAdmin()`, `json`/`err`, el patrón de mock de
     D1 de `admin-g2.test.js`) — no reinventes helpers que el contrato te señala como ya hechos.
   Si el trabajo exige tocar algo fuera de ámbito: **no lo toques** —
   `hermes kanban --board el-bunker comment <id> "fuera de ámbito: <fichero> — hace falta para
   <motivo>"` y sigue con lo que sí puedes.

5. **Da señal de vida** en tareas largas (cada ~10 min):
   `hermes kanban --board el-bunker heartbeat <id> --note "<qué llevas>"`
   Sin latido, el dispatcher da tu sesión por muerta y devuelve la tarjeta a la cola.

6. **Commitea en TU rama** (la que te dio el claim), nunca en `master`, y **nunca mergees**: eso
   lo hace Edu. Sin coautoría de IA en el mensaje del commit.

7. **Cierra con evidencia**, no con prosa:
   ```
   hermes kanban --board el-bunker complete <id> \
     --result "<qué has hecho, 2 líneas>" \
     --metadata '{"changed_files":["…"],"build":"ok","tests":"…"}'
   ```
   Si no puedes terminar: `hermes kanban --board el-bunker block <id> --reason "<qué falta>"` y
   **deja la rama y la worktree como están** — no borres trabajo a medias.

8. Vuelve al paso 1 (siguiente tarjeta del carril `luna`, si queda alguna).

## Reglas que no se negocian

- Español siempre.
- No inventes datos: si no lo has verificado con un comando, no lo afirmas.
- Nada irreversible (borrar, desplegar, migrar D1/R2 en remoto, publicar) — eso es de Edu, aunque
  la tarjeta parezca pedirlo. Comenta y bloquea.
- No toques tarjetas de otro carril ni reasignes nada.
- No edites la base del tablón a mano.
- Migraciones D1: aplícalas y verifícalas **solo en local** (DoD de A1 lo pide explícito); nada
  contra la base remota.

Empieza por el paso 0 ahora, sin preámbulo.
