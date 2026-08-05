# VEREDICTO — Auditoría UI reproducible en 3 capas

> Opus, 5-ago-2026. Tarjeta `t_cf71309f` (carril `opus`, board `el-bunker`).
> Revisa: `docs/operacional/PROPUESTA_AUDITORIA_3_CAPAS_2026-08-04.md` (Hermes, 4-ago).
> Todo dato de este documento está verificado por comando o por lectura del fichero citado en
> esta sesión. Lo que no pude verificar va marcado como supuesto, no como hecho.

---

## 0. Veredicto en una línea

**APROBADO el enfoque, RECHAZADO el montaje.** Las tres capas son el reparto correcto del trabajo;
la infraestructura sobre la que la propuesta las apoya —**auditar producción con datos vivos**— es
lo que hace que la línea base no sobreviva a la primera semana. Con dos correcciones de fondo el
plan pasa de "otro barrido, esta vez con script" a lo que la propuesta promete: una señal de
regresión que se puede volver a mirar dentro de un mes.

Coste: **menos** que el estimado (~2-3 h). Quitar el login y los 527 registros reales ahorra más
tiempo del que cuesta escribir los fixtures.

## 1. Las cinco preguntas, respondidas

| # | Pregunta | Veredicto |
|---|---|---|
| 1 | ¿3 capas correctas? | **Sí**, con tres ajustes: Capa 0 se parte en dos (0a determinista / 0b producción), Capa 2 **no es una capa** sino la tarjeta `t_dc83fadf` que ya existe, y entra `axe-core` (accesibilidad mecánica). Rendimiento **no**. |
| 2 | ¿Playwright local? | **Sí, local, y con el Edge/Chrome instalado** (`channel:'msedge'`). **No** a GitHub Actions hoy. **No** al headless remoto (mató la página 4 veces, H-08, y no emula 390×844). Escrito de forma que CI sea un `if` futuro, no una reescritura. |
| 3 | ¿Línea base JSON + delta? | **Sí al JSON, no al formato propuesto.** Falta lo único que hace funcionar un delta: **identidad estable del hallazgo** y **banda de tolerancia**. Sin eso el delta es ruido a los tres días. **No** a la comparación por píxeles, en ningún caso. |
| 4 | ¿Checklist desde el código en Capa 0 o 1? | **En ninguna de las dos como checklist.** Va en la capa mecánica pero como **informe de cobertura**: elementos interactivos que existen en el código ∩ elementos que el recorrido tocó de verdad. Su valor no es recordarle cosas al LLM, es delatar lo que el script nunca visitó. |
| 5 | ¿Antes o después del HUD desktop? | **El arnés antes, la línea base después.** Construir 0a ya (≈1 h) y usarlo como test de aceptación del rediseño del HUD; congelar la línea base cuando el HUD aterrice. Congelarla ahora es fotografiar 39 hallazgos que el propio rediseño va a borrar. |

---

## 2. Corrección de fondo nº1 — la auditoría reproducible no puede correr contra producción

La propuesta arranca la Capa 0 haciendo login con la clave de ADR-028 y recorriendo la app real.
Eso es lo que hizo el pase del 4-ago, y por eso el pase del 4-ago no se puede repetir:

- **Los hallazgos son propiedades de los datos de Edu, no del layout.** H-11 son "23 cortes en la
  era 2021" porque esos 23 nombres de fichero son largos. Edu sube 40 fotos con nombre corto y el
  delta dirá "20 cortes resueltos" sin que nadie haya tocado una línea de CSS. Una línea base que
  se mueve sola se deja de mirar.
- **El entorno no aguanta.** H-08: 4 OOM kills en ~30 min con 527 entries en el DOM.
- **Ata la verificación a un secreto y a la red.** Sin la clave y sin worker vivo, no hay auditoría.

**La corrección:** Capa 0 se parte en dos pases con propósitos distintos, y solo uno tiene línea base.

| | **0a — Pase determinista** (el que se versiona) | **0b — Pase de producción** (el que ya existe) |
|---|---|---|
| Contra qué | `vite preview` local + **API interceptada** (`page.route('**/api/**')`) sirviendo fixtures del repo | app desplegada, D1/R2 reales, login ADR-028 |
| Auth | ninguna — no hay red que autenticar | clave fuera del repo |
| Duración | ~15-30 s | minutos, con riesgo de OOM |
| Línea base | **sí**, es su razón de existir | **no**, nunca |
| Para qué | regresión de layout: ¿rompió mi cambio algo? | ¿el sistema real responde? 429, 5xx, datos incoherentes |
| Cuándo | tras cada cambio de UI y en el DoD de las tarjetas | una vez por release o cuando algo huela mal |

**Los fixtures no se inventan: se congelan desde producción, una vez.** Una consulta de solo
lectura a la D1 remota (`SELECT title FROM entries ORDER BY length(title) DESC LIMIT 50`, ídem
`tracks`) y el resultado se commitea como `tools/audit-ui/fixtures/*.json`. Así el pase determinista
sigue estresando el layout con los títulos reales que hoy se cortan —incluidos los de ancho completo
tipo `Ｌａｄｙ，Ｈｅａｒ Ｍｅ Ｔｏｎｉｇｈｔ` de H-13— pero deja de moverse cuando Edu sube fotos.
A esa muestra se le añaden a mano seis casos adversarios que hoy no existen y algún día existirán:
título vacío, 120 caracteres sin espacios, emoji ZWJ, CJK, RTL, y un título de un solo carácter.

**Lo que se pierde y hay que decir en voz alta:** el pase determinista **no** ve fallos de datos
reales (esquemas desalineados como H-04, el 429 de H-01, la presión de memoria de H-08). Por eso
0b no desaparece — deja de ser la base de la comparación, que es distinto de dejar de hacerse.

## 3. Corrección de fondo nº2 — un delta necesita identidad, no solo números

La propuesta guarda "el JSON de la primera ejecución" y compara. La pregunta que no responde es
**qué es "el mismo hallazgo" entre dos ejecuciones**. Si la respuesta es el selector CSS o el
`nth-child`, reordenar una tarjeta inventa hallazgos nuevos y borra los viejos. Si es el valor en
píxeles, un cambio de `194px` a `196px` cuenta como cambio.

**Contrato mínimo del hallazgo** (esto es lo único de todo el plan que tiene lógica de verdad y por
tanto lo único que necesita tests propios):

```
id     = sha1( vista | rol + nombre accesible del elemento | tipo de defecto )   ← clave del delta
medida = { necesita: 662, disponible: 247, deficit: 415 }                        ← payload, NO clave
```

- **La clave nunca lleva píxeles, ni rutas del DOM, ni índices.** El nombre accesible del elemento
  es estable frente a reordenaciones y refactors de marcado, que es exactamente lo que un rediseño
  de HUD va a producir a montones.
- **Banda de tolerancia:** un hallazgo solo entra si el déficit es **≥8 px y ≥10 %** de lo que
  necesita. El `+3` de la propuesta reconoce el ruido de subpíxel pero se queda corto: usamos el
  navegador instalado de la máquina (§4), que se actualiza solo y mueve el render un pelo.
- **Clases del delta, cuatro:** `NUEVO` · `DESAPARECIDO` · `AGRAVADO` (>20 % peor que la base) ·
  `IGUAL`. El informe de la Capa 1 son las tres primeras. Si sale vacío, no se escribe informe:
  la ausencia de fichero **es** el resultado.
- **Efecto lateral que conviene:** para tener nombre accesible estable hay que ponerlo. Eso empuja
  exactamente el "Anexo — contrato de nombres accesibles" que ya escribí en
  `DISENO_B1_ADMIN_CORE_2026-08-05.md`, y es lo mismo que `axe-core` reclama. Una sola disciplina
  paga tres cosas.

**No a la comparación por píxeles** (pregunta 3 de la propuesta): con navegador sin fijar, fuentes
del sistema y fotos reales, un diff de imagen da rojo por todo y verde por nada. Las capturas se
guardan como **evidencia** para que un humano confirme, nunca como base de comparación.

## 4. Qué se mide (y qué se quita)

| Medida | Veredicto | Por qué |
|---|---|---|
| Truncamiento (`scrollWidth > clientWidth`) | **entra**, con tolerancia §3 | es lo que destapó H-11/12/13 y lo único que ya demostró valor |
| Desbordamiento horizontal del documento | **entra** | criterio que Edu ya usó a 1264 px; una línea de JS |
| Errores de consola JS | **entra** | coste cero |
| Respuestas HTTP ≥400 y recuento de peticiones por pantalla | **entra** | es la señal que cazó H-01 (429 en `/api/queue/admin`) |
| Áreas táctiles <44×44 px a 390×844 | **entra** (nueva) | objetivo, mecánico, y alimenta directamente la aceptación móvil pendiente (`t_dc83fadf`) |
| `@axe-core/playwright` | **entra** (nueva) | contraste, roles y nombres gratis; sustituye media docena de comprobaciones escritas a mano |
| Solapamiento entre hermanos >35 % | **FUERA** | en WALL la etiqueta es literalmente `absolute inset-x-0 bottom-0` **sobre** la foto: solaparse *es* el diseño. Esta medida produciría decenas de falsos positivos y se los comería la Capa 1 en tokens |
| Rendimiento (LCP, bundle, memoria) | **FUERA** | sin presupuesto declarado no hay fallo posible, solo números que nadie decide qué significan |

## 5. La cobertura, que es la respuesta a la pregunta 4

El INFORME del 4-ago deja escrito un detalle que casi nadie leería y que cambia el diseño:

> *"Clicks disparados por eventos JS (pointerdown/up) — el click sintético del driver no activa los
> handlers de pointer de WallView."* (`INFORME.md:125`)

Es decir: **un recorrido automático puede pasar por encima de media app sin activarla y terminar en
verde.** Un checklist pre-generado leído por un LLM no protege de eso; un informe de cobertura sí:

```
inventario estático (grep de onClick/onPointerDown/onSubmit en src/**)   → 84 controles
tocados por el recorrido (el script anota cada interacción que dispara)  → 61
NO EJERCITADO                                                           → 23   ← esto es el hallazgo
```

Sale gratis (un `grep` y un contador) y es lo único que impide que el arnés se convierta en un
sello de goma. Va en la capa mecánica, no en la del LLM.

## 6. Prioridad y secuencia (pregunta 5)

**Ni "antes del HUD" ni "después": entrelazado, y en este orden.**

1. **Ahora — 0a mínimo** (≈1 h de un ejecutor barato): truncamiento + desbordamiento + consola +
   red + cobertura, contra fixtures congelados. **Sin línea base todavía.**
2. **El HUD desktop (`t_504a2707`) usa 0a como criterio de aceptación.** El rediseño tiene hoy un
   DoD difuso ("aprovechar el escritorio"); con esto pasa a ser medible: *0 truncamientos en WALL,
   MUSIC LAB y TIMELINE a 1440×900 sobre los fixtures congelados*. Es el mismo patrón que ya
   funcionó en la Ola 1 —los DoD escritos como test se cumplieron sin discusión, los escritos en
   prosa no— aplicado a la única tarjeta grande que queda.
3. **Al aterrizar el HUD, se congela la línea base.** Antes no: 39 de los hallazgos actuales viven
   en los componentes que el rediseño va a reescribir.
4. **Después — delta + axe + áreas táctiles.** Cuando ya hay contra qué comparar.

**Fuera de la pregunta, pero es mi trabajo decirlo:** si lo que manda estos días es poder enseñarle
la app a David, **Modo Visita (A2→A5) va por delante de las dos**. El arnés de auditoría y el HUD
son deuda de calidad; sin censura a la vista no hay demostración. Esto no lo decido yo, pero el
orden de valor del `PLAN_CARRILES` ya lo dice y conviene no perderlo de vista al priorizar.

## 7. El arnés tiene que verificarse a sí mismo

El fallo real del 4-ago no fue de esfuerzo: fue **un informe sin hallazgos que todos creyeron**.
Un script que mide mal produce exactamente el mismo desastre, más rápido y con más autoridad.

**Requisito no negociable del DoD:** `tools/audit-ui/` incluye una **página trampa** —un HTML de 20
líneas con un título que se corta 100 px, un botón de 20×20 y un `console.error`— y un test que
afirma que el JSON de salida contiene esos tres hallazgos y **exactamente** esos tres. Si el arnés
deja de medir, el test se pone rojo. Sin esa página, el resto no vale nada.

## 8. Tarjetas propuestas (encargo y DoD ya redactados)

| # | Tarjeta | Carril | Depende de | DoD (escrito como test) |
|---|---|---|---|---|
| **AUD-1** | `tools/audit-ui/` — pase 0a determinista | ejecutor barato | `t_9800bed2` (P0 vitest) | la página trampa da 3 hallazgos y solo 3; `node tools/audit-ui/run.mjs` termina <60 s sin red externa; salida JSON conforme al contrato §3 |
| **AUD-2** | Fixtures congelados desde producción | `edu` o `luna` | — | `fixtures/*.json` commiteados, con los 50 títulos más largos de `entries` y `tracks` + los 6 casos adversarios; consulta a D1 **de solo lectura** |
| **AUD-3** | Informe de cobertura (§5) | ejecutor barato | AUD-1 | test: un control con `onPointerDown` que el recorrido no toca aparece en `NO EJERCITADO` |
| **AUD-4** | Delta contra línea base | ejecutor barato | AUD-1, HUD aterrizado | tests del módulo de delta: id estable ante reordenación, tolerancia 8px/10 %, las 4 clases; **no se abre hasta que el HUD cierre** |

**Dependencia dura de AUD-1:** mientras `vite.config.js` no excluya `.worktrees/` (`t_9800bed2`),
cualquier test nuevo en el árbol principal se ejecuta una vez por worktree abierto y contamina la
suite de todos los carriles. Es la misma trampa de §3 del handoff de B1.

## 9. Lo que no decido yo

1. **¿Se hace ahora o cuando cierre Modo Visita?** Yo he dado el orden técnico; la prioridad entre
   "enseñable" y "verificable" es de Edu.
2. **AUD-2 toca la D1 remota**, aunque sea de solo lectura → P8 del canon de paralelismo: carril
   `edu`, no automático.
3. **Dependencia nueva:** `playwright` (+ `@axe-core/playwright` si entra la accesibilidad) en
   `devDependencies`. Con `channel:'msedge'` no descarga navegador —usa el Edge de Windows— pero
   sigue siendo peso nuevo en un repo que hoy tiene 25 dependencias de desarrollo. Verificado:
   ninguna de las dos está instalada hoy (`package.json`).

## Anexo — forma de la salida de 0a

```json
{
  "meta": { "fecha": "…", "commit": "…", "navegador": "msedge/…", "fixtures": "sha1 del directorio" },
  "cobertura": { "estatico": 84, "ejercitado": 61, "no_ejercitado": ["…"] },
  "hallazgos": [
    {
      "id": "a3f9…",
      "vista": "vault/wall@1440x900",
      "elemento": "listitem «takeout_IMG-20211101-WA0012»",
      "tipo": "truncamiento",
      "medida": { "necesita": 194, "disponible": 122, "deficit": 72 },
      "captura": "screenshots/vault-wall-1440.png"
    }
  ]
}
```

`meta.fixtures` es un hash: si alguien cambia los fixtures, el delta contra la línea base vieja
queda **invalidado explícitamente** en vez de mentir. Es la parte que más se olvida y la que
convierte una línea base en una trampa.
