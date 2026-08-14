# DISEÑO FINO — El interior del lienzo

> La capa que ADR-029 dejó sin diseñar, y que explica los cinco hallazgos de la auditoría
> humana de Edu del 13-ago.
>
> Fecha: 14-ago-2026 · Carril `opus` · Tarjetas `t_b08e83a5` (VAULT), `t_6997adaa` (CAPSULES),
> `t_703e99c7` (reproductor y visualizador), y los dos hallazgos en `triage` `t_a8de002d`
> (reproductor grande) y `t_7700824f` (profundidad de la HUD).
>
> Canon leído antes de escribir: `docs/Nucleo/ESTADO.md`, `CONTRATO.md`, `REGLAS.md`,
> `docs/spec/INDEX.md`, y desde el índice las specs de las áreas que se tocan:
> `el_bunker_reproductor_spec_v2.md` (UX6, VIZ1-VIZ6, T6-T8), `capsulas_spec.md`,
> `galeria_vault_spec.md`. Diseño padre: `DISENO_HUD_DESKTOP_2026-08-07.md`, canonizado en
> ADR-029.
>
> **Este documento no enmienda ninguna spec por su cuenta.** Lo que necesita firma de Edu está
> aislado en el §9 y en el §10.

---

## 0. Por qué existe este documento

La auditoría del 13-ago produjo cinco hallazgos. Tarjetizados por separado, parecen cinco
encargos de maquetación:

| Hallazgo | Tarjeta |
|---|---|
| VAULT desktop aglutinado, el formulario de añadir sin espacio | `t_b08e83a5` |
| CAPSULES desorganizado, conglomeración de botones | `t_6997adaa` |
| Pantalla completa y visualizador rotos | `t_703e99c7` |
| Reproductor de MUSIC LAB calcado del móvil | `t_a8de002d` |
| La HUD desktop se ve plana, se perdió el estilo del móvil | `t_7700824f` |

Ejecutarlos por separado produciría cinco soluciones distintas para el mismo problema, y el
escritorio quedaría con cinco dialectos. No son cinco problemas. Son **un hueco de arquitectura
con cinco caras**, y el hueco está declarado por escrito en el canon.

---

## 1. La causa raíz, citada del propio canon

`DISENO_HUD_DESKTOP_2026-08-07.md`, §6 P3, sobre el lienzo:

> "Recibe el contenido actual de cada página **tal cual**, con dos cambios: se le quita
> `max-w-6xl mx-auto` (D-3) y se le quita el `padding-bottom` de 80px."

Y su §16, *Lo que este diseño no hace*, lo confirma: no toca las 3 pestañas, ni los 6 modos, ni
las 4 cápsulas.

Eso fue una decisión correcta y honesta para aquel alcance: ADR-029 diseñó **el marco**, y dijo
con todas las letras que no diseñaba **el interior**. El marco se construyó y es bueno. Pero
nadie escribió nunca la fase siguiente, así que el contenido con forma de móvil —columnas
estrechas, filas de chips que se desbordan, navegación repetida, formularios de 320px— se vertió
dentro de un lienzo de 896px sin rediseñarlo.

**La tesis de este documento:** si en el móvil la HUD flota sobre el contenido y en escritorio la
HUD es el marco (tesis de ADR-029), entonces el contenido de dentro tiene que dejar de ser una
columna de móvil estirada. **Un marco de instrumento con una app de móvil dentro se ve
exactamente como lo que Edu describió.**

---

## 2. Los seis defectos, con evidencia

Medidos el 14-ago contra el árbol principal (`master`, `b96ba31` más los cambios sin commitear),
a 1440x900, con el marco ADR-029 activo. Las capturas están en `report/screenshots/`.

### D-1 — Conviven dos puntos de corte, y ninguno lo dice

El marco entra a **1280** (`Layout.jsx:534` con `matchMedia("(min-width: 1280px)")`, y las clases
`.desktop-*` de `index.css`). Los interiores cambian de forma a **1024**, con el prefijo `lg:` de
Tailwind:

- `src/capsules/Capsules.jsx:75` — `lg:grid lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]`
- `src/vault/Vault.jsx:920` — `lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]`
- `src/musiclab/MusicLab.jsx:776` — `lg:grid` con columnas condicionales

Consecuencia doble. Entre 1024 y 1280 el usuario recibe un interior con forma de escritorio dentro
de un cromo de móvil. Y por encima de 1280, esos interiores reparten el espacio de un contenedor
que ya no es el que suponían: fueron pensados para el ancho de la ventana, no para los 896px que
deja el marco (1440 − 208 de raíl − 336 de dock).

ADR-029 §5 es explícito: **el punto de corte es 1280 y por debajo no cambia un pixel.** Un segundo
corte a 1024 no está en el canon.

### D-2 — El tope de ancho sigue puesto y se combate desde CSS

ADR-029 mandó quitar `max-w-6xl mx-auto` del lienzo (D-3 de aquel documento). Sigue en los tres
contenedores: `Capsules.jsx:73`, `Vault.jsx:737`, `MusicLab.jsx:774`. Lo que se hizo en su lugar
fue neutralizarlo desde la hoja de estilos:

```css
/* src/index.css:197 */
.desktop-canvas .max-w-6xl { max-width: none !important; }
```

Un `!important` que pelea contra una clase que debería haberse borrado. Y no cubre todo: no anula
el `mx-auto`, ni el `lg:max-w-5xl lg:w-full lg:self-end` de `Capsules.jsx:137`, que sigue
empujando el contenido contra el borde derecho del lienzo.

### D-3 — La navegación de segundo nivel está duplicada

ADR-029 §6 P2, bloque 2, le da al raíl el segundo nivel del destino activo: para CAPSULES,
`TIMELINE / SMOKE / TIME CAPSULES / RECAP`; para VAULT, los 6 modos de galería; para MUSIC LAB,
`COLA / TRACKS / LISTS / DROPS`. El raíl lo hace, y funciona.

Pero el interior sigue pintando su propia copia. En `Capsules.jsx:77-107` hay una columna de
14rem con las mismas cuatro sub-pestañas que ya están en el raíl, y debajo un tercer nivel
(`TIMELINE / COMPACT`). En la captura `geometria-capsules-1440x900.png` se ven **las tres
navegaciones a la vez**. Eso no es desorden de botones: es la misma pregunta hecha tres veces.

### D-4 — Crear contenido está tratado como un widget, no como una tarea

En `Vault.jsx:920-936`, el formulario de añadir se monta dentro de la columna izquierda de
**20rem**, junto al panel de detalle de la era. La galería se queda con el resto. Así que al
añadir una entrada, el formulario dispone de 320px mientras 576px al lado siguen enseñando fotos.

Detalle que lo delata: **editar** una entrada abre un modal de `max-w-md`, 448px
(`Vault.jsx:942-958`). Editar tiene más sitio que crear. Nadie decidió eso; salió de que crear
vive en una columna y editar en un modal.

Y encima de esa columna, el selector de categoría es una fila de iconos de 12px con contadores de
7px (`Vault.jsx:890-907`) — la tira de catorce iconos ilegibles de la captura
`geometria-vault-1440x900.png`.

### D-5 — El bloque del visualizador de ADR-029 nunca se construyó

Esto no es una regresión. ADR-029 §6 P4 ya especifica, **añadido el 7-ago a petición de Edu**, un
visualizador de tres niveles:

| Nivel | Qué ocupa | Cómo se entra |
|---|---|---|
| Inline | La zona de portada del dock, más alto que los 72px de hoy | Siempre visible mientras suena |
| Lienzo | El lienzo entero; el marco se queda y se sigue navegando | Botón dedicado en el dock, o tecla `V` |
| Pantalla completa | Todo, sin marco | Tecla `F`, o el botón otra vez |

De los tres, hoy existe uno y medio. La huella de que la fase se dejó a medias está en el código:
`AudioVisualizer.jsx:50` recibe la prop `onRequestFullscreen` y la tiene aparcada como
`_onRequestFullscreen` —el guion bajo con el que se calla al linter cuando algo no se usa— y
`WinampPlayer.jsx:638`, que es quien lo monta, **ni siquiera se la pasa**. El mando externo estaba
previsto y se quedó sin conectar.

Por eso Edu dice que lleva semanas sin funcionar y que no hay botón. Tiene razón en las dos cosas,
y la causa no es un commit que rompió nada: es una fase que no se terminó.

### D-6 — La carátula tapa el visualizador y se come el clic

Verificado por artefacto con audio real sonando
(`tools/audit-ui/playwright/verificar-visualizador-fullscreen.js`, 14-ago):

- El canvas del dock **sí dibuja**: 1.083 píxeles encendidos, 5,43% de su superficie.
- El clic **nunca le llega**. Playwright lo reporta literalmente: el elemento
  `<span aria-label="GAMING">` dentro de un `div.absolute.inset-0` *intercepts pointer events*.
- Inyectando el clic por código, **la pantalla completa funciona**: canvas a 1440x900,
  `document.fullscreenElement = HTML`, 41.357 píxeles dibujando, cero errores de consola.

El mecanismo: en `WinampPlayer.jsx:616-639` las capas de carátula se pintan con
`absolute inset-0` (la imagen, su degradado, o el glifo de vibe de reserva) y el visualizador
queda en flujo normal, `position: static`. En CSS lo posicionado pinta por encima de lo no
posicionado **sea cual sea el orden del DOM**. Así que la carátula tapa las barras y absorbe el
tap.

Lo irónico está en el comentario de la línea 615 del propio fichero:

> `{/* FASE B: Visualizer con carátula como capa base (decisión 1, OPCIÓN B) */}`

La implementación hace justo lo contrario de la decisión que declara. Un `z-index` que nunca se
escribió.

**Nota sobre la hipótesis anterior.** El diseño de la HUD (§6 P4) y la tarjeta VIZ-1 atribuían el
fallo a un `AudioContext` sin limpiar que reventaba al remontar. Esa hipótesis era razonable y ya
está resuelta: existe `src/musiclab/AudioGraph.js`, con grafo único por elemento y test que lo fija
(`AudioGraph.test.js`, `AudioVisualizer.test.jsx`). No era eso. Era la capa.

---

## 3. La gramática del interior

Cinco leyes. Todas por encima de 1280; por debajo no cambia un pixel, como manda ADR-029 §5.

### L-1 — Un solo punto de corte: 1280

`lg:` deja de usarse como frontera de disposición en los tres contenedores de pestaña. La única
frontera es `xl:` (1280), la misma que enciende el marco. Un solo número, en un solo sitio.

`lg:` sigue siendo legítimo para lo que no es disposición de página: rejillas internas de
tarjetas, tamaños tipográficos, cosas que pueden respirar antes.

### L-2 — El lienzo no repite lo que el raíl ya dice

El raíl es dueño de la navegación de segundo nivel (ADR-029 §6 P2). Por encima de 1280, el
interior **no vuelve a pintarla**. Por debajo, intacta.

Regla para distinguir, que es donde se ha fallado: **navegar es cambiar de sitio; filtrar es
cambiar lo que se ve sin moverse.** Las sub-pestañas de CAPSULES y los modos de galería son
navegación, y suben al raíl. Los filtros de vibe, de módulo, de usuario, de tipo y de era son
filtros, y se quedan en el lienzo (ADR-029 §6 P2 ya lo dice: *"los filtros no suben al raíl"*).

### L-3 — Los filtros son una sola barra, nunca una pila de filas

Hoy CAPSULES apila cuatro filas de chips antes de enseñar un solo evento: unos 250px de altura
gastados en preguntar. La forma correcta en escritorio es **una barra de filtros de una sola
fila**, alineada a la izquierda, con los grupos separados por el mismo filete de 1px a
`${accent}14` que usa el marco, y el estado activo resumido a la derecha.

Cuando un grupo no cabe, no se desborda ni hace scroll horizontal: **colapsa a un desplegable** con
el recuento de lo seleccionado. Un filtro que no está en uso ocupa el ancho de su etiqueta, no el
de todas sus opciones.

### L-4 — Crear es una tarea, y una tarea ocupa el lienzo

Cuando el usuario elige añadir contenido, el lienzo pasa a ser el formulario:

- El formulario ocupa el régimen de **lectura** de ADR-029 §5: `max-width: 76ch`, centrado. Ese
  ancho ya está decidido en el canon para formularios; aquí solo se aplica.
- La galería no se queda al lado compitiendo. **El marco no se mueve**: raíl, dock y línea de
  estado siguen ahí, y el reproductor sigue sonando. No es un modal a pantalla completa; es que el
  lienzo, que es la zona de trabajo, hace su trabajo.
- Se sale con `Escape` o con el botón de cancelar, y el lienzo vuelve donde estaba.

Corolario: **crear y editar usan el mismo camino.** Hoy uno vive en una columna de 320px y el otro
en un modal de 448px. Un solo componente, un solo ancho, un solo comportamiento.

### L-5 — La densidad se gana con columnas, no con espacio muerto

El error de leer las capturas como "falta contenido" sería estirar lo que hay. Lo que sobra es
**ancho por fila**, no contenido. Una fila de track que pone el título a la izquierda y los tres
puntos a 700px de distancia no está usando el escritorio: está desperdiciándolo en el vacío entre
dos cosas.

La respuesta es dar columnas reales a lo que ya son datos tabulares —track, artista, vibe,
duración, acciones— y dejar el aire donde comunica, que es entre bloques, no dentro de una fila.

---

## 4. VAULT en escritorio

Resuelve `t_b08e83a5`. Spec de referencia: `galeria_vault_spec.md`; ADR-021 (6 modos), ADR-029
§6 P2 (los modos viven en el raíl).

> ### ⚠ AVISO: este apartado quedó CONGELADO el 14-ago, y su premisa cambió
>
> Edu, 14-ago: *"VAULT tiene demasiados tipos de entradas, eso hay que rediseñarlo, al menos por
> secciones separadas en VAULT. Las eras seguirán englobándolo. VAULT era lo que menos tenía yo
> claro, y esa idea de la IA ha resultado muy molesta."*
>
> §4.1 y §4.2 están **reescritos** con las secciones dentro (14-ago, tarde). La versión anterior
> resolvía cómo se reparte la pantalla sin tocar **qué contiene VAULT**, que era el problema de
> fondo.
>
> La implementación entregada por el carril `ejecutor` (rama `el-bunker/t_bbaa4988-…`, commit
> `b95fb50`) llegó a meter los tipos que no cabían detrás de un botón `MÁS TIPOS`: tapa el síntoma y
> confirma el diagnóstico de Edu. El carril **cumplió su contrato** —que decía expresamente "la
> taxonomía no se toca"—; el que estaba mal era el contrato. **Por decisión de Edu no se integra
> nada de VAULT** hasta que ADR-033 esté firmado; la rama se conserva porque su trabajo de
> disposición se reaprovecha entero.

### 4.0 Qué contiene VAULT (decisión de Edu, 14-ago)

**El problema, con la evidencia.** `docs/spec/taxonomia_vault.md` define **14 categorías y unos 70
tipos**, y las 14 están enviadas como filtros en la interfaz (`AddEntryForm.jsx:162-178`). El propio
documento se justifica así: *"Objetivo: superar la convención de la industria de apps de pareja en
un orden de magnitud"* y *"14 categorías · ~70 tipos · 5-10x la industria"*. Eso es un recuento de
funciones, no un diseño: está escrito desde lo que se puede presumir, no desde lo que esta pareja
guarda.

Síntoma que lo demuestra sin salir del código: de los 14 filtros, **tres pares comparten icono**
—`document` para DOCUMENTOS y LISTAS, `sparkles` para CREATIVO y RITUALES, `analytics` para FINANZAS
y DATOS—. La fila de iconos es indescifrable por construcción. Cuando una lista de categorías no
cabe en un registro de iconos, el problema no es el registro.

**Cinco de las 14 ni siquiera son de VAULT.** La taxonomía se escribió sin cruzarla con las tres
pestañas de ADR-017, así que duplica lo que ya está construido en otra parte:

| Categoría de la taxonomía | Dónde vive ya | Autoridad |
|---|---|---|
| 5 · LÍNEA TEMPORAL (incluido "Un día como hoy") | CAPSULES → TIMELINE, que trae "Un día como hoy" literal | ADR-020, `capsulas_spec.md` |
| 5.4 · Cuenta atrás | CAPSULES → TIME CAPSULES | ADR-020 |
| 13 · DATOS Y ESTADÍSTICAS ("Resumen anual: Nuestro 2026") | CAPSULES → RECAP ("Nuestro 2026") | ADR-026, ADR-019 |
| 9.3 · Playlists con historia | MUSIC LAB | ADR-017, ADR-018 |
| 14 · INTEGRACIONES FUTURAS | No es contenido: es hoja de ruta | — |

No se podan por pesadas: se podan porque **el sitio donde viven ya existe**, y tener la misma cosa
en dos pestañas es precisamente lo que ADR-017 vino a evitar.

**Las cuatro secciones, decididas por Edu el 14-ago.** Las eras siguen englobándolo todo; las
secciones parten el contenido *dentro* de la era:

| Sección | Qué guarda | Cómo se mira |
|---|---|---|
| **MEMORIA** | Fotos, vídeos, audio, capturas de pantalla | Galería, con los 6 modos de ADR-021 |
| **PALABRAS** | Cartas, notas, diario, "abrir cuando…", bromas privadas, apodos | Lectura, ancho de 76ch |
| **LUGARES** | Mapa emocional, viajes, sitios por visitar, check-ins | Mapa |
| **LISTAS** | Películas, libros, recetas, bucket list, ideas de regalo | Tabla |
| **CAJA FUERTE** *(aparte)* | Documentos personales, médicos, legales, recuperación | Tras clave. **No se pasea** |

La quinta no es una sección más y por eso va bajo un filete separador: lo de la caja fuerte no se
navega como si fueran recuerdos. Es lo único de VAULT que se abre a propósito.

**Por qué esto es mejor y no solo más corto.** Cada sección tiene una forma natural de mirarse, y
hoy las catorce comparten una sola —la galería— porque el eje de la taxonomía era *qué es el
contenido* en vez de *qué haces con él*. Una lista de películas en una rejilla de fotos es una lista
de películas mal enseñada. El raíl de ADR-029 §6 P2 ya estaba pidiendo esto a gritos: necesita un
segundo nivel para VAULT, y "los 6 modos de galería" solo sirve si todo VAULT es galería.

**Lo que se cae, y hay que decirlo en voz alta:** las categorías 7 (comunicación y crecimiento,
incluidas notas de terapia), 10 (finanzas de pareja), 11 (rituales) y 12 salvo la caja fuerte. No
han tenido nunca una entrada, y no por falta de tiempo.

> ### Texto para canonizar — propuesta de ADR-033
>
> `docs/spec/taxonomia_vault.md` definía 14 categorías y ~70 tipos, justificados por ser "5-10x la
> industria". Se sustituye por **cuatro secciones de VAULT —MEMORIA, PALABRAS, LUGARES, LISTAS— más
> una CAJA FUERTE aparte, tras clave y fuera de la navegación normal.** Las eras siguen englobando
> todo el contenido; las secciones lo parten dentro de la era, y cada una tiene su propia forma de
> mirarse: galería, lectura, mapa y tabla.
>
> Se retiran de VAULT las categorías cuyo destino ya está construido en otra pestaña: la línea
> temporal y la cuenta atrás (CAPSULES, ADR-020), los datos y el resumen anual (RECAP, ADR-026) y
> las playlists con historia (MUSIC LAB, ADR-018). No se pierde ninguna capacidad: se deja de
> ofrecer dos veces.
>
> `taxonomia_vault.md` deja de ser el catálogo vigente y pasa a histórico. El documento ya preveía
> esto: *"cada tipo es una ficha de LEGO: se implementa cuando toca, se quita si no encaja."*

### El recuento real, medido en producción el 14-ago

Antes de podar nada había que contar, porque si alguna categoría dada por muerta tuviera contenido,
este diseño estaría mal. `wrangler d1 execute --remote` devuelve `7403 not authorized` desde esta
máquina, así que se midió por la puerta que ADR-028 abrió para esto: canje de clave por JWT contra
el worker de producción y `GET /api/entries?limit=2000`.

```
TOTAL ENTRADAS: 525
type    Count
-----   -----
photo     525
```

**Las 14 categorías tienen cero entradas. Las catorce.** No es que algunas estén poco usadas: el
campo `type` de las 525 entradas vale `photo` en todas. Setenta tipos de contenido declarados, y la
aplicación real guarda fotos.

Eso cambia tres cosas:

1. **No hay migración que hacer.** La tabla de mapeo que preveía este diseño (categoría 1 a MEMORIA,
   2 a PALABRAS, etc.) no tiene a quién mapear. Todo lo existente es `photo`, y `photo` es MEMORIA.
   El riesgo de perder datos al podar el catálogo era, medido, **cero**.
2. **Tampoco hace falta `SIN CLASIFICAR`.** Se preveía para lo que no mapease; no queda nada fuera.
   Se retira del diseño en vez de construir una sección que nunca tendría contenido, que es
   exactamente el error que estamos corrigiendo.
3. **VAULT arranca con una sección llena y tres vacías**: MEMORIA 525, PALABRAS 0, LUGARES 0,
   LISTAS 0. Y eso está bien, no es un problema a esconder. Son secciones **vacías pero usables**:
   se puede crear en ellas desde el primer día, así que no van atenuadas como los modos de galería
   de fase no implementada (ADR-029 §6 P2). Llevan estado vacío que invita a escribir el primero.

Regla que sobrevive intacta y que sigue siendo obligatoria: **el mapeo se hace al leer, nunca con un
`UPDATE` en D1.** El campo `type` original no se toca. El dato del usuario es intocable, y aquí
además no hace falta tocarlo para nada.

*(Nota menor: 525 y no las 527 del `ESTADO.md`. La diferencia encaja con el huérfano `prueba_dod.jpg`
borrado el 4-ago con OK de Edu. No se persigue: no afecta a este diseño.)*

### 4.1 Dónde vive cada cosa

La era sigue siendo el contenedor de todo. Dentro de la era, la sección elige **qué** se ve; el
modo elige **cómo**. Tres niveles, cada uno en su sitio:

```
RAIL (208px)                LIENZO (896px a 1440)
+-------------+   +--------------------------------------------------+
| VAULT       |   | 2021 - EL PRIMER AÑO         [+ ENTRADA] [+ ERA] |
|   MEMORIA   |   | 1970 dias · 6 entradas · 2 fotos                  |
|   PALABRAS  |   +--------------------------------------------------+
|   LUGARES   |   | WALL  CINEMA  MAP  DIALOGUE  EXHIBITION  REEL     |  <- solo en MEMORIA
|   LISTAS    |   +--------------------------------------------------+
|   --------  |   | [buscar...]  |  vibe: TODOS v  |  8 de 12         |
|   CAJA F.   |   +--------------------------------------------------+
| MUSIC LAB   |   |                                                  |
| CAPSULES    |   |   el contenido de la seccion activa,             |
+-------------+   |   a ancho completo del lienzo                    |
                  +--------------------------------------------------+
```

1. **El raíl gana las cuatro secciones** como segundo nivel de VAULT, con la caja fuerte debajo de
   un filete separador. Hoy VAULT no tiene segundo nivel en el raíl (`Layout.jsx:417-421`, sin
   `children`), así que esto no quita nada: lo llena.
2. **Cada sección trae su forma de mirar**, y esto es lo que arregla el problema de fondo:
   MEMORIA es galería, PALABRAS es lectura a 76ch, LUGARES es mapa, LISTAS es tabla. Hoy las
   catorce categorías comparten una sola vista —la galería— porque el eje era *qué es el contenido*
   en vez de *qué haces con él*. Una lista de películas dentro de una rejilla de fotos es una lista
   mal enseñada.
3. **Desaparece la columna de 20rem** (`Vault.jsx:920`). Los datos del panel de era —días,
   entradas, fotos— son tres cifras que caben en la cabecera. Las tarjetas `AVENTURA EN CURSO` y
   `SEGURO`, hoy 400px de alto para decir dos números, se funden en esa línea.
4. **Muere la tira de catorce iconos** (`AddEntryForm.jsx:162-178`). No se sustituye por un
   desplegable: **se sustituye por las secciones del raíl**. Ese menú existía para navegar catorce
   categorías que ya no existen.
5. **El selector de eras deja de ser carrusel** (`Vault.jsx:827`). Con dos eras, un carrusel es una
   animación buscando un problema: fila con `wrap` por encima de 1280.
6. **El contenido toma el ancho completo.** Se quita `max-w-6xl mx-auto` del JSX (`Vault.jsx:737`)
   en vez de neutralizarlo con `!important`.

**Consecuencia que necesita firma (X-5, ver §9).** ADR-029 §6 P2 mandó los 6 modos de galería al
raíl, enmendando a `galeria_vault_spec.md`, que los quería en una barra horizontal en cabecera. Con
las secciones, esa enmienda **se revierte a medias**: el raíl aloja las secciones, y los 6 modos
vuelven a la cabecera del lienzo, pero solo dentro de MEMORIA. No es capricho: un raíl de tres
niveles es un árbol, y los modos no aplican a las otras tres secciones.

### 4.2 El flujo de añadir

Es L-4 aplicada. `+ ENTRADA` no despliega un formulario dentro de una columna: **el lienzo se
convierte en el formulario**, con el marco intacto y el reproductor sonando.

```
+-- LIENZO ------------------------------------------------------+
|  < VOLVER A MEMORIA                                            |
|                                                                |
|            NUEVA ENTRADA EN MEMORIA · 2021                     |
|                                                                |
|        [ FOTO ]  [ VIDEO ]  [ AUDIO ]  [ CAPTURA ]             |
|                                                                |
|        +----------------------------------------+              |
|        |  el formulario del tipo elegido        |              |
|        |  max-width 76ch, centrado              |              |
|        +----------------------------------------+              |
+----------------------------------------------------------------+
```

**La sección ya hizo el trabajo de filtrar.** Estando en MEMORIA, los tipos posibles son cuatro, no
setenta: foto, vídeo, audio, captura. En PALABRAS son carta, nota, diario y "abrir cuando…". En
LUGARES, sitio y viaje. Ese es el motivo por el que el selector cabe en una fila de pastillas con
texto de 44px: **no lo hemos comprimido, lo hemos vaciado.** Comprimir catorce iconos a 12px era el
error; esconderlos detrás de un `MÁS TIPOS` también.

Al elegir tipo, el selector se contrae a una línea de vuelta (`FOTO · cambiar`) y el formulario
queda como único elemento en pantalla. Se sale con `Escape` o cancelar.

**Crear y editar comparten camino y ancho.** Hoy editar abre un modal de 448px (`Vault.jsx:942-958`)
y crear vive en una columna de 320px: editar tiene más sitio que crear, y nadie lo decidió.

### 4.3 La caja fuerte: diseñada, no construida

La quinta entrada del raíl guarda documentos personales tras una clave. **No se implementa en esta
tanda**, y no por falta de tiempo: una caja fuerte sin cifrado real es peor que no tenerla, porque
promete algo que no cumple. Requiere decidir qué significa "tras clave" —passphrase propia, cifrado
en cliente, qué pasa si se pierde— y eso es una sesión de diseño con Edu, no un `if`.

Hasta entonces **no se pinta**: nada de una entrada en el raíl que lleve a un cajón vacío. La regla
de "nada inventado en pantalla" también prohíbe inventar seguridad.

---

## 5. CAPSULES en escritorio

Resuelve `t_6997adaa`. Spec de referencia: `capsulas_spec.md`; ADR-020 (las 4 sub-tabs).

### 5.1 Se van dos navegaciones de tres

Por encima de 1280 desaparece del lienzo la columna de sub-pestañas de `Capsules.jsx:77-107`: el
raíl ya las tiene. Por debajo de 1280 se queda tal cual, con su swipe.

Con eso, el `lg:grid` de dos columnas de la línea 75 deja de tener sentido y se va con ella, junto
al `lg:max-w-5xl lg:w-full lg:self-end` de la 137 que empujaba el contenido contra el borde.

El tercer nivel (`TIMELINE / COMPACT`) **no es navegación, es densidad**: se queda, pero como par
de conmutadores a la derecha de la barra de filtros, no como una tercera fila de pestañas.

### 5.2 La barra de filtros del TIMELINE

Las cuatro filas apiladas de hoy —módulo, usuario, tipo de evento, era— se resuelven en una fila,
por L-3:

```
+-- LIENZO ------------------------------------------------------+
|  modulo: TODO v | quien: AMBOS v | tipo: TODOS v | era: TODAS v |
|                                              vista: [=] [==]    |
+-----------------------------------------------------------------+
|  2026-07-01                                                     |
|  [>] TRACK PLAY      edu     Midnight City            14:32     |
|  [>] TRACK PLAY      david   Lady, Hear Me Tonight    15:07     |
+-----------------------------------------------------------------+
```

Los cuatro grupos son desplegables con el valor activo visible. `AMBOS`, `TODO`, `TODAS` no
necesitan enseñar sus alternativas hasta que alguien quiera cambiarlas.

### 5.3 Las filas del feed usan el ancho

Hoy cada evento es una caja con el tipo a la izquierda y el sujeto pegado a la derecha, con un
vacío enorme en medio (captura `geometria-capsules-1440x900.png`). Por L-5, la fila pasa a
columnas fijas: **hora · tipo · quién · qué**, alineadas entre filas, con la hora en
`tabular-nums`. Un feed cronológico con la hora alineada se lee de un vistazo; con la hora bailando,
no.

Las cuatro sub-tabs conservan su contenido y sus dependencias tal como manda `capsulas_spec.md`.
Este diseño no toca qué hace SMOKE, TIME CAPSULES ni RECAP: toca cómo se reparte el lienzo.

---

## 6. MUSIC LAB y el reproductor

Resuelve `t_703e99c7` y da respuesta al hallazgo en triage `t_a8de002d`. Spec de referencia:
`el_bunker_reproductor_spec_v2.md` (UX6, VIZ1-VIZ6, Q15, T6-T8).

### 6.1 Primero, el arreglo que desentierra lo que ya existe

Antes que ningún rediseño, D-6. El visualizador pasa a pintarse **sobre** la carátula, que es lo
que el comentario de `WinampPlayer.jsx:615` dice que se decidió en su día:

- La carátula se queda como capa base, con su degradado.
- El visualizador recibe contexto de apilamiento propio por encima de ella.
- Con eso, las barras vuelven a verse sobre la portada —el segundo síntoma de la tarjeta— y el
  elemento vuelve a recibir el puntero.

Es el cambio más pequeño del documento y arregla dos síntomas de golpe. Va primero y se verifica
solo.

### 6.2 El botón que nunca se conectó

Se implementa el bloque de tres niveles de ADR-029 §6 P4, que ya está firmado:

- **Botón dedicado en el dock**, en la fila de controles secundarios, con icono del registro de
  `Icon.jsx` (regla de cero caracteres como iconografía, ADR-029 enmienda 4). Es el mando que
  `onRequestFullscreen` esperaba desde el principio.
- **Tecla `V`** para el nivel lienzo, **`F`** para pantalla completa, **`Escape`** para bajar un
  nivel. Los atajos se registran donde ya viven los de `1/2/3` (`Layout.jsx:546-556`), con la misma
  guarda de no dispararse dentro de `INPUT`/`TEXTAREA`.
- El nivel **lienzo** es la capacidad de escritorio que el móvil no puede tener, y es el que hace
  que el marco valga la pena: el visualizador ocupa los 896px del lienzo mientras el raíl, el dock
  y la línea de estado siguen ahí. Se sigue viendo qué suena y se sigue pudiendo navegar.

En móvil no cambia nada: sigue mandando UX6, tap sobre el reproductor.

### 6.3 La estética 2000, sin inventarla

Edu la pide como "efectos tipo wallpaper de Windows antiguo". No hace falta inventar el catálogo,
porque la spec ya lo escribió. `UX6`, literal:

> "Muestra barras de espectro, disco giratorio, osciloscopio, partículas reactivas, VU meters,
> fondo plasma/humo. **No artwork.**"

Contra lo que hay hoy en `AudioVisualizer.jsx` (barras con reflejo, osciloscopio CRT, onda, radial,
vinilo con aguja, túnel hipnótico), el hueco es exacto:

| UX6 pide | Estado | Acción |
|---|---|---|
| Barras de espectro | Existe | Se conserva |
| Osciloscopio | Existe (CRT) | Se conserva |
| Disco giratorio | Existe (vinilo con aguja) | Se conserva |
| **VU meters** | **No existe** | Se añade |
| **Fondo plasma / humo** | **No existe** | Se añade |
| **Partículas reactivas** | **No existe** | Se añade |

Los tres que faltan son, justamente, los tres más característicos del Winamp y el Windows Media
Player de la época. La estética que pide Edu **es** cerrar el hueco de la spec. No es una capa de
nostalgia por encima: es implementar lo que UX6 llevaba pidiendo desde el principio.

Dos reglas de ejecución para que no se convierta en decoración:

- **"No artwork" es de UX6, y solo aplica a pantalla completa.** En el nivel inline la carátula
  sigue siendo la capa base (§6.1); en lienzo y pantalla completa manda la spec y la portada se va.
- **El color sale del vibe activo, siempre** (`VIZ2`, `VIZ5`, `VB8` para el estado sin track). Ni
  un color nuevo, ni una paleta propia del visualizador. Cuando no suena nada, color base oscuro.

### 6.4 El reproductor grande de MUSIC LAB: lo que este diseño NO decide

El hallazgo `t_a8de002d` pide que en MUSIC LAB haya un reproductor grande y que el mini quede solo
en VAULT y CAPSULES. Es razonable y la captura le da la razón: hoy MUSIC LAB enseña una lista de
tracks con vacío a la derecha, y el mando es el mismo dock de 336px que en las otras pestañas.

**Pero eso choca de frente con ADR-029**, que decidió lo contrario con nombre y apellidos: *"en
escritorio el reproductor pertenece al marco y está visible en las tres pestañas"*, y su §6 P4
explica por qué un dock que aparece y desaparece es mala idea: cambiaría el ancho del lienzo y
movería el contenido bajo el cursor.

Hay una salida que no rompe nada, y es el nivel **lienzo** del §6.2: en MUSIC LAB, el lienzo puede
ser el reproductor grande —portada grande, visualizador, cola— mientras el dock sigue en su sitio
haciendo de mando permanente. Grande y vistoso sin dock intermitente.

Ahora bien: **eso es una decisión de producto, no mía.** Si Edu quiere literalmente que el dock
desaparezca en MUSIC LAB, es una enmienda a ADR-029 y la firma él. Queda planteada en el §9 como
decisión abierta, no resuelta por la puerta de atrás.

---

## 7. La profundidad perdida

Responde al hallazgo en triage `t_7700824f`.

`Layout.jsx:569-575` monta las cuatro capas de atmósfera —`GridBackground`, `AmbientGlows`,
`NoiseOverlay`, `ScanlineOverlay`— en la raíz, y ahí siguen. No se borraron. Lo que pasa es que el
marco las tapa: la barra superior es `rgba(5,5,5,0.97)`, el raíl `0.84`, el dock `0.92`, la línea
de estado `#050505` opaca (`index.css:104-181`). Entre las cuatro cubren 208 + 336 + 44 + 28
píxeles de cromo con fondos casi opacos, y el resplandor solo sobrevive en el lienzo.

En móvil el cromo flota **encima** del contenido y deja ver la atmósfera a través. En escritorio el
cromo es un marco opaco y la apaga. El estilo no se perdió: se tapó.

La corrección tiene que respetar la geometría de ADR-029 (que la tarjeta declara fuera de alcance,
correctamente), así que **no se toca ni un pixel de tamaño**. Solo la materia:

1. **El cromo deja pasar el vibe.** Los fondos del raíl y del dock bajan su opacidad lo justo para
   que `AmbientGlows` se intuya detrás, con el mismo `color-mix` sobre `--vibe-accent` que ya usan
   sus bordes. El marco deja de ser una pared y pasa a ser un cristal ahumado.
2. **El ruido y las líneas de barrido cubren también el cromo**, no solo el lienzo. Hoy quedan
   por debajo en el orden de pintado; subirlas por encima del marco, a opacidad baja, devuelve la
   textura CRT a la pantalla entera, que es de donde venía la personalidad.
3. **El acento reacciona donde importa.** Los cuatro filetes de 1px del marco ya usan
   `--vibe-accent`; el fondo del destino activo del raíl y el borde del dock también deberían,
   para que al cambiar de vibe cambie el instrumento entero y no solo el lienzo (T6, T8).

Regla de contención, porque aquí es fácil pasarse: **el brillo se gana en el borde, no en la
superficie.** Nada de degradados grandes dentro del raíl ni del dock. La profundidad de esta app
siempre ha venido de líneas finas encendidas sobre negro, y eso no cambia.

---

## 8. Lo que este diseño no hace

- No toca nada por debajo de 1280. Ni un pixel, y se verifica.
- No cambia la paleta, la tipografía ni la identidad. Se heredan enteras de ADR-029 §8.
- No toca la geometría del marco: 44 / 208 / 336 / 28 siguen exactamente igual.
- No cambia las 3 pestañas (ADR-017), los 6 modos (ADR-021) ni las 4 cápsulas (ADR-020).
- No cambia la taxonomía de tipos de entrada, ni la lógica de la cola, ni el motor de audio. Los
  `<audio>` siguen encapsulados en `PlayerProvider` (ADR-018, regla inamovible 3).
- No añade ningún icono nuevo fuera del registro de `Icon.jsx`.
- No decide si el dock desaparece en MUSIC LAB. Eso es del §9.
- No resuelve el conflicto de `VIZ2`. También es del §9.

---

## 9. Las tres decisiones de Edu — resueltas el 14-ago

**X-1 — El ciclado de modos contra `VIZ2`. RESUELTO: gana la personalización.**

Decisión literal de Edu, 14-ago: *"Siempre prioriza la personalización."*

El ciclado manual se queda, y `VIZ2` se enmienda. La enmienda no es un capricho: `REGLAS.md`
(7-ago) ya dice que *"la ley del vibe es el mecanismo (la interfaz sigue a lo que suena), no el
catálogo"*, y esa regla es **posterior** a la spec del reproductor. `VIZ2` se escribió cuando el
catálogo de vibes era código; hoy es dato del usuario. La contradicción se resuelve sola en cuanto
se lee en orden cronológico.

> **Enmienda propuesta a `VIZ2`** (firma de Edu, va al §10): *"Cada vibe trae un preset de
> visualizador como punto de partida. El usuario puede cambiar de modo cuando quiera; su elección
> manda sobre el preset mientras dure la sesión."*

Consecuencia de segundo orden, anotada para no perderla: si el catálogo de vibes es del usuario,
el preset de cada vibe debería acabar siendo dato en D1 y no una tabla en el código. Eso es
`VIZ-M13`, que sigue abierto en la spec. **No entra en este diseño**, pero cualquiera que toque los
presets debe saber que su destino es salir del código.

**X-2 — El reproductor en MUSIC LAB. RESUELTO: mini y grande conviven.**

Decisión literal de Edu, 14-ago: *"Cuando dije en las 3 dije que siempre presente en el sentido de
siempre poder controlarlo. Mini y gran reproductor en MusicLab no contradicen esto; si está escrito
de otra forma no es mi culpa."*

Esto no es una enmienda a ADR-029: es la **lectura auténtica** de lo que ADR-029 quiso decir. Lo
que Edu decidió el 7-ago fue *el control siempre disponible*, y el documento lo redactó como *el
mismo dock en las tres pestañas*, que es una forma concreta de cumplirlo y no la única. Manda la
intención.

Por tanto: en MUSIC LAB el lienzo aloja el **reproductor grande** —portada grande, visualizador,
cola— y el **dock sigue en su sitio** como mando permanente. No hay dock intermitente, así que
tampoco el efecto lateral que ADR-029 temía (el lienzo cambiando de ancho bajo el cursor). Se
cumplen a la vez el hallazgo `t_a8de002d` y la intención del ADR.

> **Aclaración propuesta a ADR-029** (firma de Edu, va al §10): donde dice *"el reproductor
> pertenece al marco y está visible en las tres pestañas"*, léase *"el control del reproductor
> está siempre disponible en las tres pestañas"*. Que MUSIC LAB añada además un reproductor grande
> en el lienzo no lo contradice.

**X-3 — El segundo nivel fuera del lienzo (L-2). APROBADO POR EDU, PERO BLOQUEADO POR UN DEFECTO
DEL RAÍL.**

Edu pidió verlo (*"enséñamelo antes de decidir"*), se le entregó la captura comparativa y lo aprobó
el 14-ago. Al ir a extenderlo a VAULT y MUSIC LAB apareció el motivo por el que **L-2 no se puede
aplicar todavía**, y es un defecto previo, no del rediseño:

**El raíl no es dueño del segundo nivel. Lo dibuja.** En `Layout.jsx:435-440` los hijos de cada
destino se pintan como `<span>` sin `onClick`, y el resaltado del activo está fijado a
`index === 0`, así que marca siempre el primero —`COLA` en MUSIC LAB, `TIMELINE` en CAPSULES—
independientemente de dónde esté el usuario.

Dos incumplimientos, los dos ya escritos en el canon:

- ADR-029 §6 P2 dice *"cada destino muestra su estado real"*. Un índice fijo no es estado real.
- `REGLAS.md` (7-ago): *"Nada inventado en pantalla... prohibidos los valores por defecto fabricados
  para que un widget tenga algo que enseñar."* Un activo clavado al índice 0 es exactamente eso.

Y una consecuencia que se pagó en el momento: la primera implementación de X-3 ocultó la barra del
lienzo confiando en que el raíl la sustituía. No la sustituye. **Eso dejó SMOKE, TIME CAPSULES y
RECAP inalcanzables en escritorio.** Revertido en el acto.

La verificación V-3 de este documento también estaba mal planteada y se corrige aquí: contar
cuántas veces aparece una etiqueta no prueba nada, porque un destino puede aparecer una sola vez y
seguir siendo inalcanzable si quien lo pinta es decorativo. **Se mide alcanzabilidad, no
apariciones** (`capturar-tab.js`, campos `alcanzable` / `decorativo` / `inalcanzables`).

**Orden correcto, que sustituye al anterior:** primero el raíl asume de verdad el segundo nivel
—botones reales, estado real elevado desde `Capsules.jsx` y `MusicLab.jsx`—, y sólo entonces se
retira la copia del lienzo. Nunca al revés. Mientras tanto, la barra del lienzo se queda porque hoy
es el único control vivo.

Lo que sí quedó aplicado de X-3, por ser seguro: deshacer la rejilla de dos columnas que embutía
la barra en 14rem y devolver al contenido los 896px completos del lienzo.

**X-5 — Los 6 modos de galería vuelven a la cabecera del lienzo. PENDIENTE DE FIRMA.**

Sale de la decisión de secciones (§4.1). ADR-029 §6 P2 mandó los 6 modos de ADR-021 al raíl, y esa
fue una de las cuatro enmiendas que Edu firmó sobre `galeria_vault_spec.md`, que los quería en
"barra horizontal en cabecera".

Con VAULT partido en cuatro secciones, el raíl aloja **las secciones**, y meter además los modos
haría del raíl un árbol de tres niveles. Además los modos **no aplican** a PALABRAS, LUGARES ni
LISTAS: solo MEMORIA se mira en galería. Así que los 6 modos vuelven a la cabecera del lienzo,
dentro de MEMORIA.

Curiosamente eso **devuelve la razón a la spec original**: la enmienda de ADR-029 era correcta
mientras VAULT fuera una sola galería, y deja de serlo en cuanto VAULT tiene secciones. No se
revierte por error, se revierte porque cambió la premisa. En móvil no cambia nada: allí la spec
nunca se enmendó.

Necesita firma porque toca una enmienda que Edu ya había firmado una vez.

**X-4 — La banda de 1024 a 1280. RESUELTO: usa el diseño móvil entero.**

Apareció al preparar la fase F4 y no estaba en el planteamiento original. La ley L-1 (un solo punto
de corte) no es gratis: hoy esa banda enseña un híbrido —rejillas de dos columnas por `lg:` y
contenido topado a 1152px por `max-w-6xl`— con el cromo del móvil, porque el marco no entra hasta
1280. Arreglarlo **cambia esa banda**, y eso roza la promesa de ADR-029 de que por debajo de 1280 no
se toca un pixel.

Decisión de Edu, 14-ago: **que use el diseño móvil entero.** Por debajo de 1280 manda el móvil, a
una columna, sin excepciones ni bandas intermedias.

Con eso, la promesa de ADR-029 queda leída como lo que quería decir —*el diseño que Edu aprobó no se
toca*— y no como *el estado accidental del código no se toca*. Lo que desaparece es una tercera
versión de la aplicación que nadie diseñó ni revisó nunca. Consecuencia visible y aceptada: en
portátil pequeño y tableta apaisada el reparto cambia respecto a hoy.

Esto desbloquea F4 y le fija el criterio: `lg:` deja de usarse como frontera de disposición en
`Capsules.jsx`, `Vault.jsx` y `MusicLab.jsx`; `max-w-6xl mx-auto` se retira del JSX en vez de
combatirse con `!important` desde `index.css`; y la única frontera que queda es 1280.

---

## 10. Texto para canonizar (propuesta de ADR-032)

> ### ADR-032 — El interior del lienzo tiene gramática propia
>
> ADR-029 definió el marco de escritorio y declaró explícitamente que el lienzo recibía el
> contenido de cada página *tal cual* (§6 P3, §16). Esa fase nunca se escribió, y el resultado es
> un marco de instrumento con una app de móvil dentro: navegación duplicada, filtros apilados,
> formularios en columnas de 320px y un segundo punto de corte a 1024px que nadie decidió.
>
> Por encima de 1280px rigen cinco leyes para el contenido del lienzo: **una sola frontera de
> disposición (1280, la misma del marco)**; **el lienzo no repite la navegación que el raíl ya
> muestra**, distinguiendo navegar de filtrar; **los filtros son una barra de una fila que colapsa
> a desplegables**, nunca una pila; **crear contenido es una tarea que ocupa el lienzo**, con el
> mismo ancho y el mismo camino que editar; y **la densidad se gana con columnas**, no estirando
> filas.
>
> La geometría del marco (44 / 208 / 336 / 28), la identidad visual, las 3 pestañas, los 6 modos y
> las 4 cápsulas no se tocan. Por debajo de 1280px no cambia un pixel.
>
> Se implementa además el bloque de visualizador de tres niveles que ADR-029 §6 P4 ya especificaba
> y que quedó sin construir, y se completa `UX6` con los tres modos que faltaban (VU meters, fondo
> plasma, partículas reactivas).

---

## 11. Orden de ejecución

Cada fase entrega algo que se ve, y se verifica sola. En este orden porque la primera es la que
Edu lleva semanas sin poder usar.

| # | Fase | Alcance | Se ve en |
|---|---|---|---|
| F1 | Desenterrar el visualizador (§6.1) | `WinampPlayer.jsx` | Barras sobre la portada, el tap llega |
| F2 | Botón y tres niveles (§6.2) | `WinampPlayer.jsx`, `AudioVisualizer.jsx`, `Layout.jsx` | Botón en el dock, `V` y `F` |
| F3 | Los tres modos que faltan (§6.3) | `AudioVisualizer.jsx` | VU meters, plasma, partículas |
| F4 | Un solo corte y fuera el tope (§3 L-1, D-2) | `Capsules.jsx`, `Vault.jsx`, `MusicLab.jsx`, `index.css` | Nada cambia de sitio salvo el ancho |
| F5 | CAPSULES (§5) | `Capsules.jsx`, `Timeline.jsx` | Una navegación, una barra de filtros |
| F6 | VAULT (§4) | `Vault.jsx`, `AddEntryForm.jsx` | Cabecera de era y flujo de añadir |
| F7 | Profundidad (§7) | `index.css`, `Layout.jsx` | El vibe se ve a través del marco |

F3 está bloqueada por X-1. F6 depende de F4. Las demás son independientes.

---

## 12. Verificación

Se mide, no se opina. El harness ya existe (`tools/audit-ui/`, AUD-1) y este documento añadió uno.

| # | Qué | Cómo |
|---|---|---|
| V-1 | Por debajo de 1280 no cambia un pixel | Capturas a 390x844 y 1279px antes y después, comparadas |
| V-2 | Cero scroll horizontal en las tres pestañas a 1280, 1440 y 1920 | `detectar-scroll-x.js`, ya escrito |
| V-3 | Ninguna navegación de segundo nivel aparece dos veces | Conteo en el DOM de las etiquetas del raíl dentro del lienzo: debe dar 0 |
| V-4 | El tap sobre el visualizador llega al canvas | `verificar-visualizador-fullscreen.js`, campo `tapNatural` |
| V-5 | Los tres niveles funcionan y `Escape` baja uno | El mismo script, ampliado con `V` y `F` |
| V-6 | El formulario de añadir recibe el régimen de lectura | Medir el ancho del formulario: entre 60ch y 76ch |
| V-7 | Los `<audio>` siguen siendo uno y en `PlayerProvider` | `document.querySelectorAll('audio')` y grep de `new Audio(` fuera de `PlayerContext` |
| V-8 | Cero emoji y cero caracteres como icono en lo tocado | grep de los rangos `1F300-1FAFF` y `2600-27BF` |
| V-9 | Batería local | `npm run build`, `npx eslint src/`, `npx vitest run` |

---

## 13. Trazabilidad con las tarjetas

Los contratos de revisión del 13-ago nombran cuatro documentos de diseño separados
(`DISENO_REPRODUCTOR_DESKTOP`, `DISENO_HUD_PROFUNDIDAD`, `DISENO_VAULT_DESKTOP`,
`DISENO_CAPSULES_DESKTOP`). Este documento los cubre en un solo cuerpo **a propósito**: los cuatro
comparten causa raíz, y escritos por separado habrían producido cuatro interiores distintos, que es
el defecto que se está corrigiendo.

| Contrato de revisión | Dónde se cumple aquí |
|---|---|
| `t_92734f82` — VAULT aglutinado | §4 |
| `t_2cbe2436` — CAPSULES desorganizado | §5 |
| `t_a40e4844` — pantalla completa y visualizador | §6, y la evidencia en §2 D-5 y D-6 |
| `t_b617c6b3` — reproductor calcado del móvil | §6.4, con la decisión X-2 abierta |
| `t_e687ed00` — HUD plana | §7 |

Si Edu prefiere los cuatro ficheros por separado para que los contratos casen literalmente, se
parten desde aquí sin reescribir nada.
