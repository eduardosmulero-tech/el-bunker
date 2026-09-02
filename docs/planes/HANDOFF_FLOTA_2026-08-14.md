# Handoff a la flota — frente de escritorio de el-bunker

**Fecha:** 14-ago-2026 · **Autor:** Opus (último turno con eslabón premium) · **Sin commit.**
**Para:** quien coordine la ejecución a partir de ahora, con carriles gratuitos.

> Esto no es un plan nuevo. El plan es la §11 de `docs/disenos/DISENO_INTERIOR_LIENZO_2026-08-14.md`,
> ya canonizada en **ADR-032**. Esto es el orden en que se despacha, con las trampas ya pagadas
> puestas por delante para que no se vuelvan a pagar.

---

## 0. Estado del frente en una tabla

| Fase | Tarjeta | Estado | Depende de |
|---|---|---|---|
| F1 — desenterrar el visualizador | *(cerrada)* | ✅ mergeado `2ff7b1d` | — |
| F2a — botón de pantalla completa y tecla `F` | *(cerrada)* | ✅ mergeado `1eb19ae`, REV PASS | — |
| **F2b — nivel LIENZO y tecla `V`** | `t_b5b5b397` | ✅ `ready` | nada |
| **F3 — VU meters, plasma, partículas** | `t_2854c51b` | ✅ `ready` | **F2b** (choque de fichero) |
| **F4 — un solo punto de corte (1280)** | `t_8ab9c42e` | ✅ `ready` | nada |
| **F5 — CAPSULES** | `t_305dbb3c` | ✅ `ready` | **F4** (choque de fichero) |
| **F6 — VAULT en cuatro secciones** | `t_0ea27342` | ✅ `ready` | **F4** |
| F6b — disposición de VAULT | `t_bbaa4988` | `blocked` a propósito | se absorbe en `t_0ea27342` |
| F7 — profundidad de la HUD | `t_7700824f` | `triage` | nada |
| Reproductor grande de MUSIC LAB | `t_a8de002d` | `triage` | decisión X-2 (ya aclarada en ADR-032) |

**Las tres tarjetas de `opus` (`t_703e99c7`, `t_6997adaa`, `t_b08e83a5`) están cerradas.** No queda
diseño pendiente en este frente: queda escribir código.

> **Nota sobre los IDs (14-ago).** F2b, F3 y F4 estaban clavadas en `triage`, y el CLI solo saca de
> ahí con `specify`, que **reescribe el cuerpo con un modelo** y se habría llevado por delante los
> contratos. Se recrearon con el contrato **idéntico** en tarjetas nuevas que nacen en `ready`, y
> las originales (`t_eaf2abc0`, `t_a80d6157`, `t_da4ac8e0`) quedan **archivadas** con su historial y
> con un comentario que apunta a la nueva. Antes de archivar se copió el contrato original como
> comentario en cada una, por si acaso.

---

## 1. Orden de despacho

> ### 🔴 CORRECCIÓN DEL 14-ago, 21:15 — probado en vivo, y la razón de serializar es otra
>
> La primera versión de esta sección decía que F2b y F4 podían ir **a la vez** porque no comparten
> ficheros. **Se probó y es falso, por un motivo que no había considerado.**
>
> Edu arrancó el gateway y el dispatcher cogió **cuatro tarjetas de golpe**. Las cuatro
> crashearon en menos de 60 segundos. El log da **dos eslabones, y el primero es el que importa**:
>
> **(1) El proveedor primario está sin saldo.** `config.yaml` declara `provider: opencode-go` como
> primario, con `opencode-zen` de fallback. El primario responde, desde al menos las 20:37:
>
> ```
> provider=opencode-go  base_url=https://opencode.ai/zen/go/v1  model=deepseek-v4-flash
> HTTP 401 — CreditsError: 'Insufficient balance.'
> ```
>
> No es una suscripción cancelada: es **el contador a cero**. Consecuencia operativa: **todo lo que
> se despache sale hoy por el fallback gratuito**, no por elección sino por falta de alternativa.
>
> **(2) El fallback gratuito se ahoga con concurrencia:**
>
> ```
> provider=opencode-zen   model=deepseek-v4-flash-free
> openai.RateLimitError: 429 — FreeUsageLimitError: Rate limit exceeded
> ```
>
> **La cuota gratuita es del PROVEEDOR, no del worker.** Cuatro workers en paralelo la queman entre
> todos y no termina ninguno. Ya estaba escrito en el canon de paralelismo (**P13: cuota por
> proveedor, no por perfil**) y en el incidente de los `obrero1/2/3` de OpenRouter; este plan lo
> ignoró.
>
> **Los dos juntos explican el todo:** sin primario, no hay colchón. Cualquier pico de concurrencia
> cae directo sobre la cuota gratis y tumba la ola entera. Recargar saldo es decisión de dinero de
> Edu y no la toma ningún agente.
>
> **Consecuencia:** con proveedor gratuito **se despacha de una en una**. El paralelismo por
> carriles necesita cuotas independientes, y hoy no las hay.
>
> **Cómo queda montado (14-ago):** ya no es una tabla de olas que alguien tiene que respetar a
> mano — son **dependencias reales en el grafo del board**, que sobreviven a reinicios del gateway:
>
> ```
> F2b (t_b5b5b397)  ──┬──►  F3 (t_2854c51b)
>                     └──►  F4 (t_8ab9c42e)  ──►  F5 (t_305dbb3c)
> ```
>
> Solo **F2b** está en `ready`. Las demás están en `todo` esperando a su padre y el dispatcher no
> las toca. Al cerrarse F2b, se abren F3 y F4 — y ahí habrá que volver a serializar a mano, o
> aceptar dos workers si la cuota lo aguanta.
>
> ⚠️ **No se probó nada más:** los cuatro workers murieron en el 429 sin escribir una línea.
> `master` quedó intacto. Lo de abajo se conserva porque el análisis de **choques de fichero sigue
> siendo correcto y sigue haciendo falta** — simplemente no era la restricción que muerde primero.

**Ola A — no comparten ficheros (pero ver la corrección de arriba: hoy van de una en una):**

| Carril | Tarjeta | Ficheros |
|---|---|---|
| 1 | `t_b5b5b397` — F2b | `WinampPlayer.jsx`, `AudioVisualizer.jsx`, `Layout.jsx` |
| 2 | `t_8ab9c42e` — F4 | `Capsules.jsx`, `Vault.jsx`, `MusicLab.jsx`, `index.css` |

✅ **Verificado que no se pisan**: F2b toca `WinampPlayer.jsx`, `AudioVisualizer.jsx` y `Layout.jsx`;
F4 toca `Capsules.jsx`, `Vault.jsx`, `MusicLab.jsx` e `index.css`. Intersección vacía.

**Ola B — cada una en cuanto se mergee su predecesora:**

| Carril | Tarjeta | Espera a | Por qué |
|---|---|---|---|
| 1 | `t_2854c51b` — F3 | **F2b** | Las dos tocan `AudioVisualizer.jsx`. Lanzadas a la vez se pisan. Lo dice el propio cuerpo del contrato de F2b |
| 2 | `t_0ea27342` — F6 (VAULT) | **F4** | Si no, el rediseño se monta sobre un contenedor que aún cambia de forma a 1024 |

**Ola C — menor prioridad declarada:**

| Tarjeta | Espera a | Nota |
|---|---|---|
| `t_305dbb3c` — F5 CAPSULES | **F4** | Comparten `Capsules.jsx` e `index.css`. Además Edu la llamó *pestaña de juguete* |
| `t_7700824f` — F7 profundidad | nada | `index.css` y `Layout.jsx`: comprobar que no coincide con la ola viva antes de lanzarla |

**Prioridad si solo hay un carril libre:** F2b y F3, en ese orden. Es el norte declarado de Edu y lo
que lleva semanas sin poder usar. CAPSULES es lo último.

---

## 2. Las cinco trampas ya pagadas

Todas costaron trabajo real. Van aquí para que el coordinador las meta en cada contrato.

### T-1 — Un «fuera de alcance» heredado se verifica, no se copia
El contrato de VAULT decía *«no modificar los tipos de contenido existentes»*. Se heredó del cuerpo
de la tarjeta padre sin cuestionarlo. El carril lo cumplió a rajatabla y escondió los 70 tipos
detrás de un botón «MÁS TIPOS», lo que **confirmaba** el problema en vez de resolverlo. Edu lo vio y
reabrió el alcance; de ahí salió ADR-033. **El fallo fue del encargo, no del carril**, y costó una
rama entera congelada (`b95fb50`).

### T-2 — Un verde que mide apariciones no mide capacidad
La verificación V-3 original contaba **cuántas veces aparecía** una etiqueta de navegación. Dio
verde mientras SMOKE, TIME CAPSULES y RECAP estaban **inalcanzables** en escritorio: un destino
puede aparecer una sola vez y seguir sin poder pulsarse si quien lo pinta es decorativo. V-3 corregida
mide **alcanzabilidad** (campos `alcanzable` / `decorativo` / `inalcanzables` en
`tools/audit-ui/playwright/capturar-tab.js`). **Todo criterio de verificación de este frente tiene
que comprobar capacidad, no presencia.**

### T-3 — El raíl dibujaba la navegación, no la poseía
`Layout.jsx` pintaba los hijos como `<span>` sin `onClick` y clavaba el activo a `index === 0`.
Retirar la copia del lienzo confiando en el raíl rompió tres destinos. **Ya está arreglado y mergeado
(`c7614c0`)**, pero la regla queda: antes de retirar un duplicado, se comprueba que el que se queda
funciona de verdad.

### T-4 — El «hecho» de un carril no se cree, se verifica por artefacto
`ls`, `wc -c`, `grep`, la salida literal del comando. Nunca el informe del propio carril. Este frente
ya tuvo un «X-3 IMPLEMENTADO Y APROBADO» que hubo que corregir en el mismo día.

### T-5 — `done` significa *pendiente de merge*
Lo mergeado es `archived` (`ESTADO.md`, corregido por Edu el 12-ago y reafirmado el 14). Una tarjeta
en `done` cuyo trabajo no está en `master` **no es un desfase del board**: es el estado normal.

---

## 3. Reglas duras que van en TODOS los contratos de este frente

1. **Por debajo de 1280px no cambia un pixel.** ADR-029 §5 y ADR-032. Si un cambio no se puede hacer
   de forma aditiva (clases nuevas neutralizadas dentro del media query de 1280), se para y se
   comenta. No se toca el móvil «un poquito».
2. **Lista de ficheros cerrada.** Nunca «busca por el árbol». Si hace falta otro fichero, se para.
3. **Cero emoji y cero caracteres unicode como icono.** Todo icono sale de `src/core/ui/Icon.jsx`
   (`REGLAS.md`, decisión de Edu del 6-ago).
4. **Nada de commit ni push.** Es acto de Edu (R4), sin coautoría de IA.
5. **No se tocan datos ni elecciones del usuario**: iconos de tags, contenido, preferencias, ADRs.
6. **Batería antes de entregar:** `npm run build`, `npx eslint src/ workers/`, `npx vitest run`.
   Línea base a igualar o superar: **441/441 en 64 ficheros**.
7. **Entrega con evidencia literal en la tarjeta**: `fichero:línea` de cada cambio y la salida pegada
   de los comandos. «Hecho» sin salida no cuenta.
8. **Máximo 3 iteraciones** si la REV emite FAIL. Al tercero se eleva a Edu, no hay cuarto ciclo.

---

## 4. Lo que NO puede hacer la flota

- **🔴 Arrancar el gateway.** Medido el 14-ago: `hermes gateway status` → *«No gateway process
  detected»*. **Sin él, las cinco tarjetas en `ready` no las coge nadie** y este plan de olas no
  arranca solo. Y arrancarlo no es un detalle técnico: el dispatcher spawnea workers con el
  proveedor de `config.yaml`, y la regla del workspace es que lo que corre sin humano delante va
  con **proveedor gratuito elegido por Edu**. Está como **N3** en
  `cerebro/normas/DECISIONES_ABIERTAS.md`, con el comando de `set-model` ya comprobado.
- **Firmar ADR-030 y ADR-031** (`t_50b7f0f6`). Sus textos esperan; el hueco de numeración en
  `CONTRATO.md` está anotado a propósito para que no parezca un despiste.
- **Commit y merge.** Hay trabajo entregado sin commitear: `CONTRATO.md`, `docs/spec/INDEX.md`,
  `ESTADO.md` y este documento.
- **Las revisiones humanas pendientes**: `t_6c8948f5` (móvil), `t_dc83fadf` (aceptación 390x844 y
  PWA instalada). Ningún agente headless emula un móvil real.

> ✅ **Ya NO es un bloqueo:** las tarjetas del frente estaban en `triage` y se sacaron el 14-ago
> recreándolas en `ready`. Las que quedan en `triage` (`t_a8de002d`, `t_7700824f`, `t_ff9881d1`,
> `t_fc85b520`) son de fases posteriores y no frenan las olas A y B.

---

## 5. Verificación del frente completo

Cuando las siete fases estén mergeadas, esto tiene que dar verde a la vez (§12 del diseño):

| # | Qué | Cómo |
|---|---|---|
| V-1 | Por debajo de 1280 no cambia un pixel | Capturas a 390x844 y 1279px, antes y después |
| V-2 | Cero scroll horizontal a 1280, 1440 y 1920 | `detectar-scroll-x.js` |
| V-3 | Ninguna navegación de segundo nivel aparece dos veces **y todos los destinos son alcanzables** | `capturar-tab.js`, campo `inalcanzables` = `[]` |
| V-4 | El tap sobre el visualizador llega al canvas | `verificar-visualizador-fullscreen.js`, campo `tapNatural` |
| V-5 | Los tres niveles funcionan y `Escape` baja uno | El mismo script, con `V` y `F` |
| V-6 | El formulario de añadir recibe el régimen de lectura | Ancho entre 60ch y 76ch |
| V-7 | Un solo `<audio>`, y en `PlayerProvider` | `document.querySelectorAll('audio')` + grep de `new Audio(` fuera de `PlayerContext` |
| V-8 | Cero emoji en lo tocado | grep de `1F300-1FAFF` y `2600-27BF` |
| V-9 | Batería local | build + eslint + vitest |

---

*Escrito el 14-ago-2026 por el último turno con eslabón premium. Todo lo que hay aquí es
reproducible: los commits se comprueban con `git log`, los estados con
`hermes kanban --board el-bunker list`, y las citas a specs con `grep`.*
