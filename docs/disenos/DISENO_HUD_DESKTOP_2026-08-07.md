# DISEÑO FINO — HUD desktop de el-bunker

> **Estado: EJECUTABLE** (Opus, 7-ago-2026). Entregable del encargo
> `.trabajo/ENCARGO_OPUS_HUD_FINO_2026-08-06.md`, tarjeta `t_504a2707`.
> **Destinatario:** el worker que ejecuta (Luna o quien Edu asigne). Si algo no está aquí, se
> pregunta; no se improvisa.
> **Canon leído antes de diseñar:** `docs/Nucleo/ESTADO.md`, `docs/Nucleo/CONTRATO.md`,
> `docs/Nucleo/REGLAS.md`, y el código real de `src/layout/Layout.jsx`, `src/layout/TabShell.jsx`,
> `src/layout/PageWrappers.jsx`, `src/tokens.js`, `src/core/ui/Icon.jsx`, `src/vault/Vault.jsx`,
> `src/musiclab/MusicLab.jsx`, `src/capsules/Capsules.jsx`.
> **Specs funcionales leídas** (`docs/spec/`, incorporadas en la §2 tras aviso de Edu el 7-ago —
> no están en el `CANON.manifest` y la primera versión de este documento se escribió sin ellas):
> `el_bunker_reproductor_spec_v2.md` (VB1-VB20, Q, T, UX), `galeria_vault_spec.md`,
> `capsulas_spec.md`, `taxonomia_vault.md`, y barrido de `el_bunker_specs_externas_y_fases.md`.
> **Material de partida:** `docs/operacional/hud-material-2026-08-06/` (8 capturas de la app viva
> + 7 volcados DOM, 6-ago). Las ocho capturas están vistas, no citadas de oídas.
> **Ámbito:** `src/layout/**` y las líneas de rejilla de las tres páginas. Nada más en la Fase 1-2.

---

## 0. Método: por qué no hay otra maqueta

La propuesta anterior se rechazó por "0 personalidad, se nota muchísimo la IA". La causa no fue el
gusto del que la hizo: fue el método. Una maqueta HTML autocontenida **no puede** heredar la
identidad de la app, porque no tiene los tokens, ni el acento que cambia con la música, ni la
tipografía real, ni las cinco capas de atmósfera. Nace forzosamente como un dibujo de una app
parecida. Repetir el método daría el mismo resultado con otra paleta.

Así que este documento **no trae una maqueta nueva**. Trae la arquitectura espacial del escritorio
escrita contra los ficheros reales, para que la maqueta sea la app. Cuando Edu quiera verlo, lo
que mire será el búnker de verdad corriendo, no un HTML aparte.

**Cómo se enseña esto** (recomendación operativa, no parte del diseño): que quien ejecute aplique
la Fase 1 en su rama y capture con el mismo procedimiento del 6-ago (1500x950 y 390x844, mismas
tres pantallas). La comparación honesta es captura contra captura, misma app, mismo dato.

---

## 1. La identidad, escrita

Antes de tocar el escritorio hay que dejar por escrito qué es esta app visualmente, porque hasta
ahora estaba solo en la pantalla. Todo lo de esta sección está medido en el código, no imaginado.

**Ley 1 — El color de la interfaz lo decide la vibe de lo que suena.** `Layout.jsx:428` resuelve
`accentColor` desde `trackVibe` y lo publica como `--vibe-accent` en `:root` (`Layout.jsx:431-434`).
Cabecera, rejilla de fondo, glows, bordes, navegación y reproductor se tiñen a la vez. Esto es lo
irrepetible del búnker y ninguna propuesta genérica lo tiene. **Todo lo que se añada en escritorio
recibe `accentColor` por prop o lee `var(--vibe-accent)`. Cero colores fijos nuevos.**

**La ley es el mecanismo, no el catálogo** (Edu, 7-ago). Las cuatro vibes de `tokens.js:72-105`
no son "las vibes de la app": son la semilla de arranque. El catálogo real vive en D1
(`db.music_lab.tags`, ADR-016 y ADR-023) y lo edita el usuario. Verificado en el código:
`PlayerContext.jsx:60-62` usa los tags de D1 y solo cae en los de `tokens.js` si no hay ninguno, y
`MusicLab.jsx:66` construye la barra de vibes desde D1. Lo inviolable es que la interfaz siga a la
vibe; qué vibes existen, cómo se llaman, de qué color son y qué icono llevan es del usuario.

**Ley 8 — Todo lo personalizable se lee del dato; nada personalizable se escribe en el código.**
Detalle y frontera exacta en el §9.

**Ley 2 — Fósforo sobre negro absoluto.** Fondo `#050505`. La profundidad no se hace con sombras
ni con blur: se hace con borde de 1px al 12-44% del acento y `textShadow` corto. Las superficies
son `rgba(191,255,0,0.03)`. Un panel con fondo gris claro rompería la app entera.

**Ley 3 — Una sola tipografía.** JetBrains Mono para absolutamente todo. Las etiquetas van en
mayúsculas con `tracking` entre 0.2em y 0.35em; las cifras con `tabular-nums`. No entra una
segunda familia en escritorio: la disciplina de una sola fuente es parte del carácter.

**Ley 4 — Cajas rectas.** `rounded-sm` como máximo. Ni cápsulas, ni cartas redondeadas, ni
botones tipo pastilla.

**Ley 5 — Los datos se leen como telemetría.** `0054 DÍAS`, `ERAS [02]`, `TRACKS [529]`,
`ERA_00`, `JUN 2021`, `1892D`. Cifras grandes, unidades pequeñas, corchetes para los recuentos,
sufijos de código. Se conserva y se extiende, con una excepción de la que se habla en el §10: el
relleno con ceros a la izquierda cuando no aporta.

**Ley 6 — La iconografía es SVG de trazo, nunca un carácter.** `src/core/ui/Icon.jsx` es el
registro cerrado sobre lucide-react, con `strokeWidth` 1.8 y tamaños de 12 a 16. Es lo que hace
verificable la regla de cero emoji. El §10 documenta los 30+ sitios donde todavía no se cumple.

**Ley 7 — La atmósfera es firma, no relleno.** Rejilla de 40px al 4%, scanlines de 4px, ruido
fractal al 3%. Se queda. Lo que sobra (un pulso central animado en bucle que no comunica nada) se
va: §10, tabla C.

---

## 2. Reconciliación con las specs funcionales de `docs/spec/`

**Por qué esta sección existe.** La primera versión de este documento se escribió leyendo lo que el
`CANON.manifest` exige (`[requiere]`: CONTRATO, REGLAS, ESTADO) y el código. **`docs/spec/` no está
en el manifest**, ni en el grupo 1 ni en el grupo 2, y no lo abrí. Edu lo señaló el 7-ago. Las
specs están completas y son normativas de comportamiento: 20 requisitos de vibe (VB1-VB20), cola
(Q1-Q17), transiciones (T1-T11), UX (UX1-UX11), galería, cápsulas y taxonomía. Esta sección
reconcilia el diseño con ellas: qué confirman, qué corrigen y qué queda en manos de Edu.

Nota de precedencia, porque hace falta: la spec del reproductor es de la época de Drive y en
algunas líneas lo dice explícitamente (`S6` guarda la cola en `queue_[userId].json` en Drive; la
tabla de contexto dice "Storage BD: Drive"). **Ahí manda el CONTRATO** (ADR-002 y ADR-024: cola en
D1, Drive deprecado; `REGLAS.md`: el CONTRATO tiene prevalencia absoluta). Lo que sigue vigente de
la spec es todo lo funcional y de comportamiento, que es lo que afecta a este diseño.

### 2.1 Lo que la spec CONFIRMA — el diseño ya iba por aquí

| Spec | Dice | Dónde queda en este diseño |
|---|---|---|
| **T2, T3** | "Mini-player persiste en todas las vistas como capa permanente." "El reproductor permanece anclado; el contenido hace slide." | **Es la base del dock (§6 P4), no una invención mía.** El escritorio no cambia la regla: la cumple mejor. Hoy en móvil el mini flota y tapa; en el marco está anclado de verdad y no tapa nada |
| **VB1** | "Vibe = color(es) de la HUD derivado del tag principal del track activo" | Ley 1 del §1, literal |
| **VB9** | "El vibe afecta toda la UI" (con excepciones, ver 2.2) | El marco entero se tiñe: raíl, dock y barra superior incluidos |
| **VB16** | "Vibe no se persiste, se deriva en tiempo real" | El marco no guarda color propio |
| **Q15, EC-S5** | "Historial visible al hacer scroll arriba: 5 tracks atenuados" | El dock lleva historial arriba (5, atenuados) y siguientes abajo. En escritorio caben los dos a la vez sin gesto |
| **UX10** | Modos de lista (compacta / grid / tarjeta), toggle en cabecera, persistente por usuario | Ya implementado (`MusicLab.jsx:100-105`). El §7 C-5 se apoya en esto, no lo reinventa |
| **UX9, UI-M24** | Buscador por botón en cabecera de cada lista | El atajo `/` del §7 C-4 le da el foco. No lo sustituye |
| **Galería, Fase A** | WALL con virtualización agresiva, solo celdas visibles + buffer de 2 filas | Es justo lo que obliga a arreglar bien el `IntersectionObserver` al cambiar el contenedor de scroll (§6 P3) |

### 2.2 Lo que la spec CORRIGE — cambios al diseño, ya aplicados

**R-1. La línea de estado NO se tiñe con el vibe.** `VB9`: *"El vibe afecta toda la UI excepto:
botones destructivos, estados de error, indicadores de sistema."* La línea de estado del §6 P5 es
un indicador de sistema. Va en color base fijo. Lo mismo el botón de cerrar sesión (destructivo) y
los toasts de error, que ya están en rojo fijo. Corregido en el §6 P5 y en el §8.

**R-2. La transición del vibe tiene forma y tiempo definidos, y el marco debe respetarlos.**
`VB5` (arranca a los 2s de reproducción confirmada), `VB6` (gradiente top-bottom sobre header y
fondo, 1s; crossfade normal en el resto), `T5` (una transición nueva cancela la anterior desde el
estado visual actual), `T8` (mismo tag → pulso sutil, no transición), `T10` (mantiene el vibe
anterior durante la carga), `VB19` (al volver a primer plano, sin transición). **El marco no
inventa tiempos:** la barra superior conserva el gradiente top-bottom de `VB6`; raíl, dock y
lienzo entran en el crossfade normal. El §8 decía "entradas de 0.35s" para animaciones de UI, que
es otra cosa y no toca esto.

**R-3. El color de reposo es fijo, no personalizable.** `VB8`: *"Sin track activo → fade de 1s
hacia color base oscuro fijo de El Bunker. Sin vibe residual."* Y `T6` lo repite. **Retiro el
PZ-3 del §9** tal como lo escribí (proponía que el acento de reposo fuera preferencia del
usuario): contradice VB8 de frente. Si Edu quiere que también eso sea personalizable, es una
enmienda a VB8 y la decide él, no yo. Queda como pregunta abierta en la 2.3.

**R-4. La creación de tags tiene spec propia, y `TagManager` no la cumple.** `VB11/VB17`:
*"formulario con nombre, ColorPicker global reutilizable, autocálculo de paleta (contrastes,
opacidades) + edición manual de cada valor. No se puede guardar sin paleta completa. Validación
obligatoria."* Hoy `TagManager.jsx` pide nombre, un color y un icono, sin paleta ni validación
bloqueante. `buildPalette()` y `ensureContrast()` ya existen en `tokens.js` — el autocálculo está
escrito, no está conectado al formulario. **Y la spec no contempla campo de icono en absoluto**: el
"Icono (emoji)" del §9 PZ-1 es un añadido posterior a la spec, y es justo por donde entran los
emoji. El selector de iconos que propongo entra en VB11/VB17 como enmienda, o el campo desaparece.
Decide Edu (2.3).

**R-5. `VB10` obliga a contraste algorítmico.** *"Texto e iconos incluidos en el vibe con contraste
algorítmico mínimo garantizado."* `ensureContrast()` existe en `tokens.js:130`. **Todo color de
texto e icono de las piezas nuevas del marco pasa por él**, sin excepción. Añadido al §8.

**R-6. "Playlist temática" no es idea nueva: está especificada y está bloqueada.** `VB14` (las
playlists tienen tag principal obligatorio, que no afecta al vibe en Fase A), `VB1` (el degradado
combinado playlist+canción está bloqueado hasta `Q14`, la separación visual de colas) y `VB20`
(Fase B, pendiente de sesión de diseño dedicada). Lo que dijo Edu el 7-ago sobre `NIGTHCORE` es
exactamente `VB20`. **No lo diseño aquí**: tiene sesión propia asignada por la spec y una
dependencia dura (`Q14`) que no está resuelta.

**R-7. El vibe no se cambia a mano.** `T1`: *"El único disparador de cambio de vibe es un cambio de
track activo. No existe acción manual del usuario sobre el vibe en Fase A."* Más `VB12`: editar el
tag mientras suena aplica **la próxima vez que se cargue el track**, no en tiempo real. Corrige el
criterio de aceptación de personalización del §9: crear una vibe y comprobar que tiñe **al cargar
un track con ella**, contando los 2 segundos de `VB5`. No es un fallo si no cambia al instante.

**R-8. La galería tiene su propia capa de color, y hay que decir cómo convive con el vibe.**
`galeria_vault_spec.md` define paleta reactiva **por Era**: *"Fondo: nunca blanco — gradiente
oscuro basado en la paleta de la Era. Bordes, glows, scanlines: colores de la Era."* Eso es un
segundo sistema de tinte además del vibe. **Regla que añade este diseño, porque la spec no la
tiene:** el marco (barra, raíl, dock) sigue al **vibe**; el lienzo, cuando muestra galería, sigue a
la **Era**. Marco y contenido pueden llevar colores distintos a la vez, y está bien: el marco dice
qué suena, el lienzo dice qué se mira. Hoy `Vault.jsx:544` tiñe el vault con el vibe, no con la
Era, así que la capa ambiental de Era está sin implementar; queda anotado, fuera de alcance.

**R-9. Los 6 modos de galería y las 4 cápsulas no están todos vivos.** La spec de galería asigna
fases: WALL es Fase A; CINEMA, MAP y DIALOGUE son Fase B; EXHIBITION y REEL son Fase C. Hoy los 6
botones se pintan igual (verificado en `dump-desktop-eras.json`). **El segundo nivel del raíl
(§6 P2) marca el estado real** de cada modo, igual que el §7 marca EXISTE/FUTURE. Un raíl que
ofrece seis destinos de los que cuatro no llevan a ningún sitio es peor que uno honesto.

**R-10. `UI-M25` se puede cerrar con este diseño.** El registro de placeholders de la spec tiene
abierto: *"UI-M25 — Iconografía toggle modos de vista — PENDIENTE SESIÓN DE DISEÑO VISUAL — Fase
A."* La respuesta sale del registro de `Icon.jsx` y ya está escrita en el código
(`MusicLab.jsx:105`): `menu` para lista, `grid` para rejilla, `archive` para tarjeta. Se propone
cerrar UI-M25 con eso.

### 2.3 Lo que la spec CONTRADICE — decisiones que son de Edu, no mías

Tres. Ninguna la resuelvo yo; el diseño queda escrito en las dos direcciones donde hace falta.

**X-1. La spec dice que esto es una app Android en vertical. Este diseño es de escritorio.**
`el_bunker_reproductor_spec_v2.md` define el producto como *"PWA privada Android-only"* y `UX8`
manda: *"Orientación landscape → forzar portrait siempre."* El código ya se apartó de eso
(`Layout.jsx:585`: "Landscape is supported; no global orientation lock") y Edu ha pedido la HUD de
escritorio tres veces (`ESTADO.md:68`). **Sin enmienda explícita, todo este documento contradice la
spec.** Por eso el ADR-029 del §13 tiene que decirlo con nombre y apellidos: no basta con
"añadimos escritorio"; hay que escribir que `UX8` queda limitada al móvil y que "Android-only"
pasa a "Android primero, escritorio como segundo cliente de primera clase". Si Edu no quiere eso,
este diseño no se ejecuta.

**X-2. El selector de modos de galería: horizontal en cabecera (spec) contra vertical en el raíl
(este diseño).** `galeria_vault_spec.md` es explícita: *"Barra horizontal en cabecera con 6
iconos. Animación `layoutId` de Framer Motion entre modos. El modo activo tiene glow."* Mi §6 P2 lo
sube al raíl en vertical, y ese es el arreglo del fallo D-5 (la fila que se desborda). **Propuesta:
la spec sigue mandando en móvil —barra horizontal en cabecera, intacta— y en escritorio pasa al
raíl, conservando `layoutId` y el glow del activo.** Es una enmienda de alcance, no de fondo. Pero
es enmienda y la firma Edu.

**X-3. La iconografía de caracteres está en las specs, no solo en el código.** La spec de galería
dibuja el selector como `[▦ WALL] [▣ CINEMA] [◎ MAP] [◈ DIALOGUE] [▸ REEL] [⬡ EXHIBITION]`, los
badges de contexto con `📍 ☀ 📅 👤 🎵`, y la de cápsulas rotula las sub-tabs `⏳ ⧖ 🔮 📊`. La regla
dura de Edu del 6-ago dice cero emoji y cero caracteres como iconografía. **La regla es posterior y
gana**, pero conviene escribirlo: la limpieza del §10 no está corrigiendo una chapuza de
implementación, está aplicando una decisión nueva sobre algo que las specs pedían así. Nada se
pierde: ninguna spec asigna significado al glifo concreto, solo al concepto.

---

## 3. Qué falla hoy en escritorio, con evidencia

Cada punto está verificado en captura o en fichero y línea. Ninguno es opinión de estilo.

| # | Fallo | Evidencia |
|---|---|---|
| D-1 | **El mando del móvil gobierna el escritorio.** `BottomNav` (3 pestañas) va fijo al borde inferior y `MiniPlayer` flota justo encima de él, en 1500px de ancho. En `desktop-1-vault-eras.png` esa pareja tapa la fila de modos de galería y las primeras entradas: el contenido más importante de VAULT queda debajo de la barra del reproductor. | `Layout.jsx:177-224` (nav fija), `Layout.jsx:312-403` (mini fijo), captura desktop-1 |
| D-2 | **La cabecera gasta 80px de alto para dos filas casi vacías.** A 1500px hay 900px horizontales sin usar entre la marca y el reloj, y la presencia del otro usuario se pinta a 9px con opacidad 0.20 (`· offline ·`). Se gasta altura, que es lo escaso, para ahorrar anchura, que sobra. | `Layout.jsx:79-86` (minHeight 80px), `Layout.jsx:143-145` |
| D-3 | **El contenido está encajonado a 1152px y centrado.** `max-w-6xl mx-auto` en las tres páginas. A 1500px sobran 174px por lado; a 1920px sobran 384px. La app no crece: se queda quieta en medio de una pantalla negra. | `Vault.jsx:735`, `MusicLab.jsx:770`, `Capsules.jsx:73` |
| D-4 | **Los dos widgets de cabecera de VAULT ocupan el 40% de una fila y dejan el resto vacío.** La rejilla declara `lg:grid-cols-4` pero solo hay dos hijos. Media fila en negro. | `Vault.jsx:744-748`, captura desktop-1 |
| D-5 | **La navegación de segundo nivel es una fila horizontal que se desborda.** En `desktop-3-musiclab.png` los chips de vibe llegan al borde: `DNB` sale cortado y el botón de ajustes se le encima. En VAULT, la fila de tipos de entrada son unos 15 iconos de 14px sin etiqueta, ilegibles. | captura desktop-3 (x≈1240-1300), captura desktop-1 (y≈625) |
| D-6 | **Títulos truncados a una línea donde hay sitio para tres.** Medido en la auditoría del 4-ago: 23 en WALL, 14 en MUSIC LAB, 2 en TIMELINE a 1264px (H-11/H-12/H-13). En escritorio el truncado no ahorra nada: sobra anchura. | `ESTADO.md:68`, `Layout.jsx:351` y siguientes |
| D-7 | **En MUSIC LAB el reproductor es una cajita con 500px de vacío debajo.** La columna sticky de 22rem contiene un reproductor de unos 350x400; el resto de la columna, hasta el final del scroll, es negro. | `MusicLab.jsx:772-787`, captura desktop-3 |
| D-8 | **Hay dos reproductores conceptuales.** En MUSIC LAB, el `WinampPlayer` de la columna izquierda; en VAULT y CAPSULES, el `MiniPlayer` flotante. Distinto sitio, distinto tamaño, distintas capacidades, según la pestaña. En escritorio eso no tiene defensa: cabe uno solo y siempre. | `Layout.jsx:580` vs `MusicLab.jsx:774-787` |

Sobre la contradicción documental que señala `ESTADO.md:68` (S152/S153 dicen "responsive desktop
hecho"; PROYECTO.md:54 dice "no optimizada para desktop"): **las dos son verdad a medias y hay que
cerrarla así**. Existe adaptación responsive (`lg:grid` de dos columnas en las tres páginas, y
funciona). No existe diseño de escritorio: el mando, la densidad y las capacidades siguen siendo
los del móvil. El texto para canonizar está en el §13.

---

## 4. La tesis

> **En móvil la HUD flota sobre el contenido. En escritorio la HUD es el marco y el contenido vive
> dentro.**

En 390x844 lo correcto es lo que hay: capas superpuestas, porque no hay sitio para dos cosas a la
vez. La cabecera flota, la navegación flota, el reproductor flota. El contenido pasa por debajo.

En 1500x950 eso deja de ser correcto, porque sí hay sitio para tenerlo todo a la vez. El
escritorio pide lo contrario: un marco fijo que no se mueve nunca, con el contenido corriendo por
dentro. Nada tapa nada. La navegación deja de ser un lugar al que se va y pasa a ser un sitio
donde se está.

Consecuencia dura, y es la decisión central de este diseño: **en escritorio el reproductor sube al
marco.** Deja de ser contenido de la pestaña MUSIC LAB y pasa a ser cromo permanente, visible en
las tres pestañas. Eso resuelve D-1, D-7 y D-8 de una vez.

**Nota sobre ADR-018 y la regla inamovible 3.** Lo que se mueve es dónde se pinta el mando, no
quién posee el audio. Los elementos `<audio>` siguen encapsulados en `PlayerProvider`
(`src/core/PlayerContext.jsx`), que ya vive por encima de `Layout` en el árbol
(`App.jsx` monta `PlayerProvider` y dentro `TabShell` monta `Layout`). Montar `WinampPlayer` en el
marco **no crea una segunda instancia de reproducción**: es el mismo consumidor de `usePlayer()`
que hoy, en otra posición del DOM. ADR-018 y la regla 3 se cumplen sin enmienda. Quien ejecute
debe verificar esto antes de dar la fase por buena (grep V-4 del §14).

---

## 5. La rejilla

**Punto de corte: 1280px.** Por debajo de 1280 **no cambia un solo pixel**. Ni el móvil ni la
tableta ni el portátil pequeño se tocan. Lo que Edu ya considera bueno queda intacto y protegido
por un test. En Tailwind eso es el prefijo `xl:`.

Entre 1280 y 1920+ el marco es:

```
0                                                                          100vw
+--------------------------------------------------------------------------+
| BARRA SUPERIOR                                                      44px  |
+--------+--------------------------------------------------+--------------+
|        |                                                  |              |
| RAÍL   |  LIENZO                                          |  DOCK        |
| 208px  |  (único elemento con scroll)                     |  336px       |
|        |                                                  |  reproductor |
|        |  padding 24px 32px 32px                          |  + cola      |
|        |                                                  |              |
+--------+--------------------------------------------------+--------------+
| LÍNEA DE ESTADO                                                     28px  |
+--------------------------------------------------------------------------+
```

Especificación literal del contenedor:

```
altura:   100dvh
display:  grid
rows:     44px minmax(0,1fr) 28px
columns:  208px minmax(0,1fr) 336px
areas:    "barra barra barra"
          "rail  lienzo dock"
          "pie   pie    pie"
overflow: hidden          (el marco NO hace scroll, jamás)
```

El lienzo lleva `overflow-y: auto; overscroll-behavior: contain`. El raíl y el dock llevan
`overflow-y: auto` propio por si su contenido crece, con la barra de scroll oculta igual que en el
slider de eras (`scrollbarWidth: "none"`).

Separadores: **líneas de 1px a `${accent}14`**, no sombras ni bordes gruesos. Cuatro líneas en
total: bajo la barra superior, a la derecha del raíl, a la izquierda del dock, sobre la línea de
estado. Dibujan el instrumento sin pesar.

Anchos por encima de 1920: el raíl y el dock **no crecen**. Todo el ancho extra va al lienzo. Un
dock de 500px sería una foto de portada gigante, que es exactamente el error del que se acusa a
las interfaces generadas.

Dentro del lienzo, dos regímenes de ancho:
- **Rejillas y listas** (WALL, lista de tracks, TIMELINE): 100% del lienzo. Sin tope.
- **Lectura** (una entrada abierta, un formulario, RECAP): `max-width: 76ch`, centrado. Una línea
  de texto de 1200px no se lee.

---

## 6. Las cinco piezas

### P1 — Barra superior (44px, una sola fila)

Sustituye a las dos filas del `StatusBar` actual cuando el ancho es de 1280 o más.

| Zona | Contenido | Estilo |
|---|---|---|
| Izquierda | Punto de latido (ya existe, `Layout.jsx:91-96`) + `EL BÚNKER` + separador `/` + **ruta activa**: `VAULT / 2021 / WALL` | Marca 11px, tracking 0.3em, acento. Ruta 11px, tracking 0.15em, `${accent}88`. El último tramo de la ruta a plena opacidad |
| Centro | Vacío, deliberadamente | Es donde aterrizan los toasts. Hoy salen a `top:88` fijo (`Layout.jsx:532`) y con un marco de 44px se solaparían; en escritorio bajan a `top:56` |
| Derecha | Presencia del otro usuario, fecha y hora, recargar, salir | **La presencia sube de 9px/opacidad 0.20 a 11px/opacidad 0.70.** En escritorio hay sitio; que David esté escuchando algo es la información más viva de la app y hoy es invisible |

La ruta activa es lo único nuevo aquí, y hace falta porque en escritorio el usuario ve tres niveles
simultáneos (pestaña, era, modo) y necesita saber dónde está sin deducirlo.

### P2 — Raíl izquierdo (208px)

Sustituye a `BottomNav` en escritorio. `BottomNav` deja de montarse por encima de 1280. Tres
bloques separados por línea de 1px:

**Bloque 1, destinos.** Las tres pestañas de ADR-017, una por fila de 44px, icono de 16 a la
izquierda y etiqueta a 11px con tracking 0.2em. **Alineadas a la izquierda, no centradas**: una
lista vertical centrada no se escanea. Estado activo: barra de 2px del color de acento pegada al
borde izquierdo, fondo `${accent}0d`, texto a plena opacidad y `textShadow` corto. Inactivo: texto
a `${accent}66`, sin fondo, sin brillo. El indicador `layoutId="nav-indicator"` de framer-motion
que ya existe se reutiliza tal cual, cambiando de horizontal a vertical.

**Bloque 2, segundo nivel del destino activo.** Esto es lo que hoy se desborda en horizontal (D-5).
Filas de 32px, texto de 10px, sangría de 12px, contador a la derecha cuando exista:

- VAULT: `WALL`, `CINEMA`, `MAP`, `DIALOGUE`, `EXHIBITION`, `REEL` (los 6 de ADR-021).
- MUSIC LAB: `COLA`, `TRACKS`, `LISTS`, `DROPS` (los que hoy construye `MusicLab.jsx:793-797`,
  incluidos los condicionales).
- CAPSULES: `TIMELINE`, `SMOKE`, `TIME CAPSULES`, `RECAP` (los 4 de ADR-020).

**Cada destino muestra su estado real.** La spec de galería asigna fases: WALL es Fase A; CINEMA,
MAP y DIALOGUE son Fase B; EXHIBITION y REEL son Fase C. Un destino de fase no implementada se
pinta atenuado y no es pulsable, con la fase como sufijo. Ofrecer seis puertas de las que cuatro
no llevan a ningún sitio es peor que ofrecer dos honestas (§2.2 R-9).

**Esto enmienda la spec de galería y hay que decirlo:** `galeria_vault_spec.md` manda "barra
horizontal en cabecera con 6 iconos". En móvil sigue mandando, intacta. En escritorio pasa al
raíl en vertical, conservando la animación `layoutId` y el glow del activo. Es enmienda de alcance,
no de fondo, y la firma Edu (§2.3 X-2).

Los filtros de vibe y de tipo de entrada **no suben al raíl**: son filtros, no navegación, y se
quedan en el lienzo. Lo que se corrige de ellos es que dejen de desbordarse (§7, C-3).

**Bloque 3, pie del raíl.** Contadores del ámbito activo, leídos del store, nunca escritos a mano.
Y una línea con el atajo de teclado del contexto.

El raíl **no se colapsa** en la versión 1. Un raíl plegable es un botón más, un estado más y un
test más, para ahorrar 208px de los 1500 que sobran.

### P3 — Lienzo

El único elemento con scroll de la aplicación. Recibe el contenido actual de cada página tal cual,
con dos cambios: se le quita `max-w-6xl mx-auto` (D-3) y se le quita el `padding-bottom` de 80px
que existía para dejar sitio al mando del móvil (`Layout.jsx:573`), porque en escritorio ya no hay
nada flotando abajo.

**Riesgo de ejecución, verificado en el código, que hay que resolver en la misma fase:** al dejar
de hacer scroll la ventana, dos cosas se rompen y las dos tienen arreglo de una línea.

1. `MusicLab.jsx:303` escucha `scroll` en `window` para cerrar el menú de orden (un portal con
   `position: fixed` cuyas coordenadas se calculan al abrir). Con el scroll en el lienzo, ese
   evento no vuelve a dispararse nunca y el menú queda flotando descolgado. **Arreglo:** los
   eventos `scroll` no burbujean pero sí se capturan; escuchar en `document` con
   `{ capture: true, passive: true }` recoge el scroll de cualquier contenedor.
2. `WallView.jsx:176-184` usa `IntersectionObserver` con `root: null`, es decir contra el viewport.
   Sigue funcionando (el lienzo recorta y la intersección se calcula bien), pero el `rootMargin` de
   precarga se mide contra el viewport y no contra el lienzo, así que la precarga se desajusta.
   **Arreglo:** un contexto `ScrollRootContext` que exponga el nodo del lienzo, y
   `{ root: scrollRoot ?? null, rootMargin: OBSERVER_MARGIN }`. Con `null` de reserva, el móvil no
   cambia de comportamiento.

Ninguno de los dos es opcional: sin ellos la fase entrega una regresión.

### P4 — Dock del reproductor (336px)

La pieza que más cambia y la que más resuelve. En escritorio, `WinampPlayer` se monta en el marco
y está siempre presente. De arriba abajo:

1. **Portada**, 336px menos el padding, cuadrada. Si el track no tiene portada, el hueco no se
   rellena con un icono grande: se deja el fondo con la rejilla, que ya dice bastante. Al fallar la
   carga se tiñe brevemente de rojo antes del salto (`UX4`).
2. **Título, hasta dos líneas.** No truncado a una (D-6). En el dock caben unos 30 caracteres por
   línea a 13px; dos líneas cubren la inmensa mayoría de la biblioteca. Al lado, el **indicador
   pequeño de origen local o stream** que pide `P1`.
3. **Artista** a 11px, `${accent}88`. **Vibe**: solo el **tag principal**, que es el único que
   dicta color (`VB13`); los secundarios, si se muestran, van sin color propio.
4. **Progreso**: barra de 2px con los tiempos a los lados en `tabular-nums`, como ya está. Clic en
   la barra para buscar posición, y `Shift` + flechas para ±10 segundos — el equivalente de
   escritorio al doble toque de `UX1`.
5. **Transporte**: anterior, reproducir/pausar, siguiente. El botón central más grande y con
   fondo de acento, como hoy. **Al cargar, ese botón se convierte en spinner** (`UX3`).
6. **Fila de modos**: bucle (triestado, regla inamovible 1), aleatorio, drop, vibe, y **control de
   volumen**. El volumen es obligatorio aquí: `UX7` y `M10` lo resuelven en móvil sincronizando con
   los botones físicos, y en escritorio esos botones no existen, así que `masterVolume` no tendría
   ningún control si el dock no lo trae.
7. **A continuación**: las cinco siguientes de la cola, una por fila de 28px, con su posición en
   `tabular-nums`. **Esto es capacidad de escritorio pura:** hoy la cola es una pestaña a la que
   hay que ir, y en el móvil está bien que lo sea. Aquí se ve sin moverse. Tres reglas heredadas de
   la spec, que el dock no puede perder:
   - Los tracks metidos a mano se pintan **con su propio color de tag**, rompiendo el patrón de
     color de la playlist. Sin etiquetas ni divisores: el contraste es el diferenciador (`Q14`).
   - **Se mantiene el arrastrar y soltar** para reordenar (`Q5`). Una cola de solo lectura en el
     dock sería una regresión respecto a lo que ya existe.
   - Cabecera de la cola con **dos botones separados**, vaciar y guardar como playlist, nunca uno
     con submenú (`S7`).
8. **Historial**: los 5 anteriores, atenuados, por encima del track activo (`Q15`, `EC-S5`). En
   móvil hay que arrastrar hacia abajo para verlos; en escritorio caben a la vez.

**Estados del dock que no son "reproduciendo".** Tres, y ninguno es un vacío:
- **En pausa:** el vibe se mantiene **a todo color, sin atenuar** (`VB7`). El dock no baja opacidad
  al pausar. Es el detalle que un diseño descuidado se salta y la spec previó.
- **Fin de cola** (`C5`): la reproducción para, la barra queda al 100%, el track sigue en pantalla
  en pausa, y el marco entero hace el fade de 1s hacia la UI base (`T6`). El fade es del marco, no
  solo del dock.
- **Sin track:** marco vacío con el rótulo `SIN REPRODUCCIÓN` y el recuento de la biblioteca.

**Un diálogo que en escritorio cambia de forma.** `EC-C3` manda un Bottom Sheet cuando hay cola
manual activa y el usuario pulsa play en una playlist (reemplazar contexto o añadir al final). El
bottom sheet es un patrón táctil que en escritorio no existe: se resuelve con el `Dialog` de
`core/ui` (que ya tiene foco atrapado y cierre con `Escape`), con las mismas dos opciones y el
mismo texto. Cambia el envase, no la decisión.

Cuando no hay track activo, el dock **no desaparece**: muestra su marco vacío con el rótulo
`SIN REPRODUCCIÓN` y el recuento de la biblioteca. Un dock que aparece y desaparece cambiaría el
ancho del lienzo y movería el contenido bajo el cursor.

#### El visualizador y el modo a pantalla completa

Añadido el 7-ago a petición de Edu, que avisa: *"el modo pantalla completa ahora mismo no funciona,
y cuando lo hizo iba mal."* La primera versión de este diseño no lo mencionaba. Existe
(`AudioVisualizer.jsx`, 6 modos, presets por vibe, API de pantalla completa del navegador) y está
montado dentro del artwork del reproductor (`WinampPlayer.jsx:638`), a 72px de alto.

**Por qué se rompe, hipótesis con evidencia en el código, pendiente de confirmar en ejecución.**
`AudioVisualizer.jsx:135-152` crea un `AudioContext` y llama a
`ctx.createMediaElementSource(audioRef.current)` sobre el `<audio>` de `PlayerProvider`. **No hay
limpieza**: en todo el fichero no aparece ni un `disconnect()` ni un `ctx.close()` (verificado por
grep, 7-ago). Y `TabShell.jsx:73-75` monta las páginas con `<AnimatePresence mode="wait">` y
`key={activeTab}`, así que **al cambiar de pestaña MusicLab se desmonta entero**, y con él el
reproductor y el visualizador.

Consecuencia: el `AudioContext` queda huérfano con el audio enrutado a través suyo, y al volver a
MUSIC LAB monta un visualizador nuevo que vuelve a llamar a `createMediaElementSource` **sobre el
mismo elemento**. Esa llamada solo se puede hacer una vez por elemento: la segunda lanza
`InvalidStateError`, que el `catch { /* noop */ }` de la línea 151 se traga en silencio. A partir de
ahí `analyserRef` queda a null y el visualizador pinta un lienzo muerto para siempre. Encaja con lo
que describe Edu: funciona la primera vez de la sesión y deja de funcionar en cuanto sales y vuelves
de la pestaña. Y "iba mal" también encaja: cada montaje deja un contexto colgado con el audio
pasando por él.

**Lo que hace el marco, y es la razón de fondo para ponerlo aquí:** el dock **no se desmonta
nunca**. El reproductor deja de nacer y morir con la pestaña, así que el grafo de audio se crea una
vez por sesión y ya no se vuelve a crear. **El marco no arregla el bug, pero elimina el disparador.**
La limpieza que falta (`disconnect()` + `close()` en el desmontaje, y no tragarse el error) hay que
escribirla igual, porque en móvil no hay marco y ahí el desmontaje sigue existiendo.

**Diseño del modo a pantalla completa en escritorio.** En móvil manda `UX6`: se abre tocando el
reproductor. En escritorio eso no vale — el dock está siempre presente y pulsarlo no puede
secuestrar la pantalla entera sin querer. Tres niveles, en su lugar:

| Nivel | Qué ocupa | Cómo se entra y se sale |
|---|---|---|
| **Inline** | La zona de portada del dock, 336px de ancho. Más alto que los 72px de hoy: en escritorio cabe | Siempre visible mientras suena |
| **Lienzo** | El lienzo entero. El marco se queda: se sigue navegando, se sigue viendo qué suena | Botón dedicado en el dock, o tecla `V`. Se sale con lo mismo o con `Escape` |
| **Pantalla completa** | Todo, sin marco. Es el `requestFullscreen` que ya existe | Tecla `F`, o el botón del nivel anterior otra vez. Sale con `Escape`, ya escuchado en `AudioVisualizer.jsx:123-133` |

El nivel intermedio es la capacidad de escritorio que el móvil no puede tener: en 390px no existe
"grande pero no total". El salvapantallas por inactividad (`VIZ3`) usa inactividad **de ratón** en
escritorio, y sigue siendo Fase B por `VIZ-M14`, sin valor por defecto.

Consecuencias obligatorias en el resto del código:
- `MiniPlayer` **no se monta** por encima de 1280. Queda como pieza exclusivamente móvil.
- `MusicLab` deja de pintar su columna izquierda por encima de 1280: su rejilla pasa de dos
  columnas a una, y la lista de tracks ocupa el lienzo entero. Esa lista es el contenido real de
  la pestaña y por fin tiene todo el ancho.

### P5 — Línea de estado (28px)

| Zona | Contenido |
|---|---|
| Izquierda | Estado de conexión y última sincronización. Es el destino digno de lo que hoy es `· offline ·` a 9px con opacidad 0.20 |
| Centro | Contadores reales del ámbito, leídos del store |
| Derecha | El atajo de teclado del contexto actual |

Regla de estilo: 10px, opacidad 0.5, **sin `textShadow` y sin glow**. Es la única franja de la
interfaz sin brillo, a propósito, para que lea como pie de instrumento y no como decoración.

**Y en color base fijo, no en el color del vibe** — `VB9` excluye del vibe los indicadores de
sistema, y esta franja lo es entera. Es la única zona del marco que no cambia de color cuando
cambia la música, y esa quietud es justo lo que la hace legible como instrumento.

**Cifras: se leen del store, nunca se escriben en el código.** Aviso de dato, sin resolverlo aquí:
el canon actual (`ESTADO.md`) dice **529 tracks activos** y 527 entradas. El baseline histórico
pre-purga era 1.117 filas totales, de las que 588 estaban soft-deleted; la purga del 7-ago dejó
529 activos, 0 soft-deleted y 0 huérfanos. La app viva del 6-ago muestra `TRACKS [529]`
(`dump-desktop-musiclab.json`, captura desktop-3), por lo que el contador es correcto. El
snapshot previo es `tools/snapshots/d1_pre_purga_softdeleted_tracks_20260807.sql`, SHA-256
`aded972277e786495141c5c55fb6c37c005ba380156c9f052979556cfc3e961a`. El dock debe mostrar el
recuento actual leído del store; 1.117 solo puede aparecer al describir el baseline histórico.

---

## 7. Qué puede hacer el escritorio que el móvil no

El requisito literal de Edu es "desktop con capacidades que el móvil no tiene". Estas son, con su
estado honesto. Nada marcado `EXISTE` se presenta como nuevo; nada marcado `FUTURE` se presenta
como hecho.

| # | Capacidad | Estado | Nota |
|---|---|---|---|
| C-1 | **Reproductor siempre visible en las tres pestañas** | FUTURE | El `WinampPlayer` existe; lo que no existe es que viva en el marco. §6 P4 |
| C-2 | **Segundo nivel de navegación siempre desplegado** en el raíl, sin desbordarse | FUTURE | Los destinos existen; hoy compiten por una fila horizontal. §6 P2, y la enmienda X-2 del §2 |
| C-3 | **La entrada se abre en panel, no en lightbox modal** | FUTURE | `EntryLightbox.jsx` existe y funciona; en escritorio se monta como panel derecho del lienzo (galería a la izquierda, entrada a la derecha) en vez de tapar la pantalla. En móvil sigue siendo lightbox, sin cambios |
| C-4 | **Teclado** | FUTURE | Tabla completa abajo |
| C-5 | **El hover revela lo que en móvil ocupa sitio permanente** | PARCIAL | `TrackCard` ya tiene menú de acciones tras un botón permanente (`TrackCard.jsx:174,322,399`). En escritorio ese botón desaparece de la fila y las acciones salen al pasar por encima. Se recupera el ancho que hoy gasta un botón por fila |
| C-6 | **Títulos a dos líneas** | FUTURE | Corrige D-6 y H-11/H-12/H-13. Es un cambio de clase, no de arquitectura: `truncate` pasa a `xl:line-clamp-2` en las tres listas |
| C-7 | **La cola visible sin ir a buscarla** | FUTURE | La cola existe como pestaña; lo nuevo es su presencia permanente en el dock |
| C-8 | Arrastrar y soltar ficheros sobre el lienzo para subir | FUTURE | Fuera de la versión 1. `FileUploadService` (ADR-022) ya centraliza la subida, así que el día que se haga es una capa de eventos, no un uploader nuevo |
| C-9 | Multi-selección con mayúsculas y control | FUERA DE ALCANCE | Arrastra acciones en lote, confirmaciones y estado nuevo. No entra en este diseño |

**Atajos de teclado (C-4).** Se registran en el marco, no en cada página. Se ignoran cuando el
foco está en un `input` o `textarea`.

| Tecla | Acción |
|---|---|
| Espacio | Reproducir / pausar |
| Flecha izquierda / derecha | Anterior / siguiente |
| `1` `2` `3` | VAULT / MUSIC LAB / CAPSULES |
| `/` | Foco en el buscador del ámbito activo |
| `Escape` | Cierra panel, modal o menú abierto; si no hay nada abierto, quita el foco del buscador |
| `?` | Muestra la lista de atajos |

La línea de estado enseña el atajo relevante del contexto. Los atajos no se anuncian con un tour ni
con globos: se descubren en el pie, que para eso está.

---

## 8. Reglas de estilo cerradas

Para que quien ejecute no tenga que inventar ni un valor. Todo esto sale de lo que ya hay en el
código, no de una escala nueva.

**Escala tipográfica (escritorio).** Marca y etiquetas de raíl 11px / 0.3em. Sub-navegación y pie
10px / 0.15em. Cuerpo de lista 12px. Título de track o entrada 13px. Cifra destacada 32px, y solo
una por zona. **No hay nada por debajo de 10px en escritorio.** Los tamaños de 9px de hoy
(`Layout.jsx:125`, `Layout.jsx:143`, `Layout.jsx:362`) existen porque el móvil aprieta; en 1500px
no tienen ninguna justificación.

**Espaciado.** Múltiplos de 4. Padding del lienzo 32px. Separación entre bloques del raíl 16px.
Interlineado de fila de lista 8px vertical.

**Borde y brillo.** Borde de estructura `${accent}14`. Borde de tarjeta `${accent}22`. Borde de
elemento activo `${accent}55`. `textShadow` solo en: la marca, la cifra destacada, el destino
activo del raíl y el título del track sonando. **En ningún otro sitio.** Hoy el brillo está
repartido casi por todo, y cuando todo brilla nada destaca; ese es literalmente el aspecto que se
lee como generado.

**Movimiento.** Entradas de 0.35s con `[0.32,0.72,0,1]`, que es lo que ya usa `TabShell.jsx:79`.
**Ninguna animación nueva en bucle infinito.** Las tres que puede haber a la vez en escritorio son:
el punto de latido de la cabecera (comunica sesión viva), la barra de progreso (comunica
reproducción) y el corazón de `HeartbeatWidget` si sobrevive al §10. Ninguna más.

**Contraste (VB10).** Todo color de texto y de icono de las piezas nuevas pasa por
`ensureContrast()` (`tokens.js:130`). No es opcional: `VB10` lo exige y la función ya está escrita.

**Qué NO se tiñe con el vibe (VB9).** Botones destructivos, estados de error e indicadores de
sistema quedan fuera. En el marco eso son: la línea de estado entera, el botón de cerrar sesión y
los toasts de error. Van en color base fijo aunque todo lo demás cambie de color.

**Cursor.** `pointer` solo donde hay acción. Hoy hay `cursor: grab` en el slider de eras
(`Vault.jsx:827`), que en escritorio con ratón está bien y se conserva.

---

## 9. Personalización: qué es estructura y qué es del usuario

Requisito de Edu, 7-ago: **"personalización máxima, completamente personalizable; lo único que se
debe respetar siempre son las vibes, aunque eso también es personalizable."**

Leído como diseño, eso no es "añadir ajustes": es una frontera. Hay que dejar escrito qué es
estructura —lo que hace que la app sea el búnker y no otra— y qué es contenido del usuario. Todo
lo que caiga del lado del usuario se lee de D1 y **no puede estar escrito en el código**.

| Estructura (fija) | Del usuario (dato, editable) |
|---|---|
| Las 3 pestañas de ADR-017 | Las vibes: cuáles hay, nombre, color, icono, cuál es la de reposo |
| La geometría del marco: 44 / 208 / 336 / 28 | Los colores de era (`ColorPicker` ya existe, `Vault.jsx:805`) |
| Una sola tipografía monoespaciada | Los tipos de entrada y sus iconos |
| Fondo negro y cajas de 1px | Las playlists, y que una playlist pueda además ser temática |
| **Que la interfaz siga a la vibe de lo que suena** | El orden del segundo nivel del raíl y la densidad de las listas |
| Que la iconografía sea SVG del registro | **Qué icono del registro** lleva cada cosa |

La última fila es la que resuelve la tensión. "Cero emoji" y "personalización máxima" solo chocan
si el usuario personaliza escribiendo caracteres. Si personaliza **eligiendo de un catálogo de
iconos SVG**, gana en las dos: elige lo que quiera y nunca sale un glifo roto.

### Tres cosas que hoy contradicen esto, verificadas en el código

**PZ-1 — La app le pide emojis al usuario, y luego no sabe pintarlos.**
`TagManager.jsx:114-127` tiene un campo de texto rotulado literalmente **"Icono (emoji)"**, con
`maxLength={4}` y `placeholder="◈"`. Lo que se teclee ahí se guarda en D1 y se pinta con
`<Icon name={form.icon}>`, que resuelve por el mapa legacy y, si el carácter no está en el mapa,
**cae en `CircleHelp`: un interrogante dentro de un círculo** (`Icon.jsx:147-148`).

Eso no es una hipótesis: **se ve en `desktop-3-musiclab.png`**. Los chips `SLOWED`, `NIGTHCORE`,
`FRUTIAERO` y `420` llevan delante un interrogante en círculo, y cada fila de track lleva otro a la
derecha. `GAMING` sí pinta bien porque su `◉` es de los que están en el mapa. Los interrogantes de
las filas vienen de `TrackCard.jsx:57` (`⚙`) y `TrackCard.jsx:174, 322, 399` (`⋮`): **ninguno de
los dos está en `LEGACY_ICON_NAMES`**, comprobado.

Es decir: la mitad de los iconos de MUSIC LAB son el icono de "no sé qué es esto". Es lo primero
que se ve al abrir la pestaña y es, con diferencia, lo que más contribuye al aspecto de app sin
terminar. **Arreglo:** el campo de texto se sustituye por un selector visual sobre el registro de
`Icon.jsx` (unos 55 iconos, en rejilla, con buscador). El usuario sigue eligiendo, pero elige entre
cosas que existen. Y `Icon` deja de caer en `CircleHelp` sin avisar: si un nombre no resuelve,
pinta el icono por defecto de su contexto, no un interrogante.

**Y el formulario entero incumple `VB11/VB17`**, que exige *"nombre, ColorPicker global
reutilizable, autocálculo de paleta (contrastes, opacidades) + edición manual de cada valor. No se
puede guardar sin paleta completa. Validación obligatoria."* Hoy hay un solo color, sin paleta y
sin validación bloqueante, aunque `buildPalette()` y `ensureContrast()` ya estén escritos en
`tokens.js`. **La spec no contempla campo de icono en absoluto**: el icono es un añadido posterior,
y es por donde entraron los emoji. Así que el arreglo completo es: paleta con autocálculo y
edición manual + validación bloqueante (VB11/VB17, ya especificado) **más** selector de iconos
sobre el registro (enmienda que decide Edu, §2.3 X-2).

**PZ-2 — El selector de tags del VAULT está permanentemente vacío.**
`AddEntryForm.jsx:508` filtra `VIBE_TAGS` (el de `tokens.js`, importado en la línea 10) por
`namespace === "vault" || !t.namespace`. Las cuatro vibes canónicas llevan todas
`namespace: "music"`, así que **el filtro devuelve cero elementos siempre**. ADR-023 dice que los
tags de contexto del vault son un namespace propio en D1; ese catálogo no llega nunca a la
pantalla. Además, la línea 516 pinta `{tag.icon}` como carácter crudo, sin pasar por `Icon`.
**Arreglo:** leer los tags de vault de D1 igual que MusicLab lee los de música, y pintarlos con
`Icon`. Es la misma pieza dos veces; el `TagManager` ya es reutilizable para ambos namespaces
(`REGLAS.md`, mapa de archivos).

**PZ-3 — RETIRADO.** En la primera versión propuse que el acento de reposo (`ACID = "#bfff00"`,
defecto en unos 40 sitios) pasara a ser preferencia del usuario. **Contradice `VB8`**, que manda
fade de 1s *"hacia color base oscuro **fijo** de El Bunker, sin vibe residual"*, y `T6`, que lo
repite. El color de "no suena nada" es identidad del producto, no ajuste. Si Edu quiere que también
eso sea personalizable, es una enmienda a VB8 y la firma él: queda como pregunta abierta en la
§2.3, no como propuesta de este diseño.

### Consecuencia para el diseño del escritorio

El raíl y el dock **no pueden llevar listas escritas a mano**. El segundo nivel del raíl se
construye del dato: los modos de galería y las cápsulas sí son estructura y van fijos, pero las
vibes, las playlists y los tipos de entrada se leen de D1. Si Edu crea una vibe nueva mañana,
aparece sola en la barra de filtros con su color y su icono, sin tocar código. Ese es el criterio
de aceptación de la personalización, y es verificable: crear una vibe desde `TagManager` y
comprobar que tiñe la interfaz al reproducir un track con ella.

**Sobre que una playlist pueda ser temática** (Edu, a propósito de `NIGTHCORE`): **ya está
especificado y está bloqueado, no es idea nueva.** `VB14` da a las playlists tag principal
obligatorio que no afecta al vibe en Fase A; `VB1` bloquea el degradado combinado
playlist+canción hasta `Q14` (separación visual de colas); `VB20` lo manda a Fase B con sesión de
diseño dedicada. Fuera de este documento por decisión de la spec, no por decisión mía. Detalle en
la §2.2 R-6.

---

## 10. Inventario de rastro de IA

Segundo entregable del encargo. Está separado en tres tablas porque **no todo lo que parece rastro
de IA lo es**, y confundirlo sería el peor error posible aquí.

### Tabla A — Culpa de la app: iconografía de caracteres

`src/core/ui/Icon.jsx` es el registro correcto y ya existe. Estos sitios no lo usan. Todos
verificados con `rg` sobre `src/`, 7-ago:

| Fichero:línea | Qué hay |
|---|---|
| `src/tokens.js:76, 84, 92, 99, 100, 112` | **La raíz de todo.** `VIBE_TAGS` y `FILTER_TAGS` reparten `icon` como carácter: `◉`, `◎`, `⚡`, `♥`, `◈`. La fuente única de verdad del diseño está distribuyendo iconos-carácter a toda la app |
| `src/musiclab/MusicLab.jsx:31, 75, 795, 796` | `◈` y `◎` en `ALL_TAG`, en el constructor de vibes huérfanas y en las dos pestañas |
| `src/musiclab/MusicLab.jsx:925, 1140` | `▴` / `▾` como flechas de plegado |
| `src/musiclab/TrackCard.jsx:57, 174, 322, 399` | `⚙` y `⋮` como botones. Los `⋮` son los 24 que salen en `dump-desktop-musiclab.json` |
| `src/musiclab/TrackCard.jsx:101, 102, 223, 224` | `◈` y `◎` en las entradas del menú contextual |
| `src/musiclab/TagManager.jsx:122` | `placeholder="◈"` |
| `src/musiclab/WinampPlayer.jsx:655` | `↳` delante de la nota del track |
| `src/vault/Vault.jsx:999` | `↓ BACKUP JSON` |
| `src/vault/WallView.jsx:392, 397, 481` | `☀`, `📍`, y `pinch ↕ zoom` |
| `src/vault/EntryLightbox.jsx:344` | `📍` delante del nombre del sitio |
| `src/vault/VaultGallery.jsx:557` | `▴` / `▾` |
| `src/capsules/Timeline.jsx:291` | `↓ CARGAR MÁS (N restantes)` |
| `src/core/ChunkErrorBoundary.jsx:70, 98` | `⚡` como ilustración de error y `↻ REINTENTAR` |
| `src/vault/AddEntryForm.jsx:31, 35, 66-107` | **El bloque más grande.** El catálogo entero de tipos de entrada con emoji: `📷 🎬 🎙 🎞 📱 ✎ ♥ ⏳ 📖 🔒 🙏 🌙 😂 🏷 ⚖ 🏥 💰 💼 🎓 🔐 📜 📍 ✈ 🗺 🔁 🔮 📊 📚 🍳 🪣 🎁`, más `★` en la puntuación y `😊 🙂 😐 🙁 😞` en el estado de ánimo. Son unas 40 constantes |
| `src/core/ui/Button.jsx:77` | `◌` como indicador de carga. Está en el sistema de diseño: lo hereda todo botón con `loading` |
| `src/layout/LoginScreen.jsx:336, 452` | `→` suelto como botón y `ENTRAR →` |
| `src/layout/BootScreen.jsx:132` | `REINTENTAR →` |
| `src/layout/App.jsx:58` | `REINICIAR APP →` |
| `src/smoke/SmokeSession.jsx:648` | `↺ RESET` |

**Caso aparte: `src/core/ui/Icon.jsx:119-139`, el mapa `LEGACY_ICON_NAMES`.** No es rastro de IA en
sí: es la prueba de que la migración a SVG se hizo a medias y se dejó un traductor de 120 entradas
de emoji a icono en lugar de arreglar el origen. **Se conserva** —hace falta para datos viejos que
ya están en D1—, pero se marca como puente cerrado: ningún componente nuevo puede apoyarse en él,
y las constantes de la tabla A deben pasar a nombres del registro (`camera`, `film`, `mic`, `heart`,
`timer`, `book`, `lock`, `map`, `compass`, `star`, `analytics`, `document`, `archive`, `sparkles`),
que **ya existen todos**: no hay que añadir ni un icono nuevo al registro.

### Tabla B — Microcopy y datos

| Fichero:línea | Qué hay | Por qué es rastro |
|---|---|---|
| `src/vault/Vault.jsx:25` | `DEFAULT_ADVENTURE_DATE = new Date(Date.now() - 500 * 86400000)` | **Lo más grave del inventario.** Si la BD no trae `adventures_start_date`, la app pinta un contador de días inventado como si fuera real. No es feo: es falso. Debe ser estado vacío: el widget no se monta y se ofrece fijar la fecha |
| `src/vault/Vault.jsx:36` | `padStart(4, "0")` sobre los días | El `0054 DÍAS` de las capturas. Precisión falsa: rellena a cuatro dígitos un número que tardará 27 años en necesitarlos. Sin relleno, `54 DÍAS` |
| `src/layout/TabShell.jsx:104-107` | "La identidad X no tiene privilegios de lectura en este búnker. Los protocolos de seguridad han sido activados." | Prosa de cosplay: dos frases donde basta una. Propuesta: `SIN ACCESO` y debajo `La cuenta X no está en la whitelist.` |
| `src/admin/core/AdminGuard.jsx:9` | Mensaje de dos frases explicando la política de autorización del servidor | Técnicamente correcto, pero es un párrafo de documentación en un sitio donde va una línea. El razonamiento vive en el ADR, no en la pantalla |
| `src/layout/Layout.jsx:66-72` | `toLocaleTimeString("en-US")` y `toLocaleDateString("en-US")` | Fecha en inglés (`AUG 07, 2026`) en una app entera en español. Se ve en las ocho capturas |
| `src/layout/Layout.jsx:143-145` | `· offline ·` a 9px con opacidad 0.20 | Estado decorativo: ocupa sitio y no se puede leer. En escritorio va a la línea de estado, legible (§6 P5) |

### Tabla C — Decoración acumulada

Esta es la tabla delicada, porque aquí el rastro de IA y la identidad de la app **son el mismo
material**. La atmósfera se queda; lo que sobra es la acumulación.

| Fichero:línea | Qué hay | Veredicto |
|---|---|---|
| `Layout.jsx:17-27, 30-39, 227-242` | Scanlines + ruido fractal + rejilla | **SE QUEDAN.** Son la firma |
| `Layout.jsx:249-256` | Dos glows de esquina (acento y morado) al 8% | **SE QUEDAN**, pero solo uno de los dos en escritorio: en 1500px los dos a la vez pintan una diagonal de color que compite con el contenido |
| `Layout.jsx:258-263` | **Pulso central animado en bucle infinito.** Un círculo que crece y decrece cada 5 segundos, para siempre, sin comunicar nada | **SE VA.** Una animación perpetua sin significado es la marca más reconocible de interfaz generada. Es el elemento que más contribuye al "huele a IA" y el que menos cuesta quitar |
| `Layout.jsx:43-54` | `CornerBrackets`, esquinas en L con el comentario "signals secure terminal" | **SE QUEDA CONDICIONADO:** solo alrededor de lo que está activo o seleccionado. Como adorno permanente, se va |
| `Vault.jsx:95-163` | `HeartbeatWidget`: corazón relleno de 36x32 latiendo en bucle, con la palabra `SEGURO` | **BAJA A LA LÍNEA DE ESTADO** en escritorio. En las capturas es el objeto más grande y luminoso de la pantalla y transmite un bit de información (hace menos de 18 meses que hubo actividad). La señal es buena y se conserva; lo que no se sostiene es su tamaño. Como línea de pie: `ÚLTIMA SEÑAL: HACE 2 MESES`, en rojo si pasa de 18. En móvil se queda como está |
| Todo el árbol | `tracking-[0.3em]` en prácticamente cada etiqueta | El espaciado extremo en todo, incluido texto que no es etiqueta, aplana la jerarquía. Regla del §8: 0.3em en marca y destinos, 0.15em en el resto, 0 en prosa |

### Lo que NO es rastro de IA y no se toca

Del volcado del 6-ago salen estas cadenas, y **son datos reales del usuario**, no generación:

- `*:;,｡･★leni crystal castles slowed☆･:.,;*`
- `♫ Nightcore - Timber ♫`
- `moonydaydreams🌙`
- `MooN ♡`

Son títulos y nombres de artista de la biblioteca real, con la ortografía decorativa típica de
YouTube. **Regla dura: la app nunca reescribe el dato del usuario para que parezca más limpio.** Se
pintan tal cual, en la mono, sin normalizar y sin quitarles nada. Si un día molestan visualmente,
la solución es tipográfica (opacidad de los adornos), nunca editar el dato.

**Caso `NIGTHCORE`** (visible en el filtro de MUSIC LAB, `dump-desktop-musiclab.json`). El encargo
lo lista como typo, y probablemente lo es, pero es la etiqueta de un tag guardado en D1: **es dato
del usuario, no cadena del código.** Verificado: no aparece escrito en `src/`. Corregirlo es un
`UPDATE` en D1 y por tanto **decisión de Edu**, no de diseño. Queda anotado, sin tocar.

---

## 11. Plan de ejecución

Cada fase tiene ámbito de ficheros cerrado. Ninguna fase toca ficheros de otra.

| Fase | Qué | Ámbito | Depende de |
|---|---|---|---|
| **F1 — El marco** | `DesktopFrame.jsx` nuevo con las cinco piezas. `Layout.jsx` decide entre marco y cromo flotante por punto de corte. `BottomNav` y `MiniPlayer` dejan de montarse en escritorio. Los dos arreglos de scroll del §6 P3 | `src/layout/*`, más las dos líneas de `MusicLab.jsx:303` y `WallView.jsx:176-184` | — |
| **F2 — Las páginas entran en el marco** | Fuera `max-w-6xl` en las tres. `MusicLab` pasa a una columna en escritorio. La rejilla de widgets de VAULT deja de declarar 4 columnas para 2 hijos | Líneas de rejilla de `Vault.jsx`, `MusicLab.jsx`, `Capsules.jsx` | F1 |
| **F3 — Densidad y truncado** | `truncate` pasa a `xl:line-clamp-2` en WALL, tracks y TIMELINE. Acciones de fila al hover | `WallView.jsx`, `TrackCard.jsx`, `Timeline.jsx` | F2 |
| **F4 — Capacidades** | Atajos de teclado en el marco. Panel de detalle en vez de lightbox (C-3) | `src/layout/*`, `src/vault/VaultGallery.jsx` | F3 |
| **F5 — Iconografía** | Tabla A: los caracteres pasan a nombres del registro `Icon` | Ficheros de la tabla A | **ninguna** |
| **F6 — Microcopy y decoración** | Tablas B y C | Ficheros de las tablas B y C | ninguna |

**Nota de planificación para quien reparta carriles:** F5 y F6 no tocan una sola línea de layout y
no dependen de F1. Pueden ir en un carril paralelo desde el primer momento sin riesgo de conflicto,
y son las que atacan directamente el "huele a IA". F5 además es trabajo mecánico y verificable con
grep: es un encargo de worker de libro.

---

## 12. Ediciones literales

Solo las que se pueden fijar sin ambigüedad. El resto es especificación (§5-§8) y bloque lógico
completo según ADR-015: quien ejecute reescribe el contenedor entero, nunca una línea suelta.

**E-1 — `src/musiclab/MusicLab.jsx:303`** (el scroll deja de ser de la ventana)

```js
// ANTES
window.addEventListener("scroll", onScroll, { passive: true });
// ...
window.removeEventListener("scroll", onScroll);

// DESPUÉS
// Los eventos scroll no burbujean, pero sí se capturan: con capture:true este
// listener recoge el scroll de cualquier contenedor, incluido el lienzo del marco.
document.addEventListener("scroll", onScroll, { capture: true, passive: true });
// ...
document.removeEventListener("scroll", onScroll, { capture: true });
```

**E-2 — `src/vault/Vault.jsx:25` y `:746`** (el dato inventado)

```js
// ANTES
const DEFAULT_ADVENTURE_DATE = new Date(Date.now() - 500 * 86400000).toISOString();
// ...
<AdventureCounter accentColor={accent} startDate={db?.adventures_start_date ?? DEFAULT_ADVENTURE_DATE} />

// DESPUÉS
// Sin fecha en la BD no hay contador: un contador inventado es un dato falso en pantalla.
// ...
{db?.adventures_start_date && (
  <AdventureCounter accentColor={accent} startDate={db.adventures_start_date} />
)}
```

**E-3 — `src/vault/Vault.jsx:36`** (precisión falsa)

```js
// ANTES
const digits = String(time.totalDays).padStart(4, "0").split("");
// DESPUÉS
const digits = String(time.totalDays).split("");
```

**E-4 — `src/layout/Layout.jsx:66-72`** (idioma)

```js
// ANTES
const timeStr = tick.toLocaleTimeString("en-US", { hour12: false, ... });
const dateStr = tick.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }).toUpperCase();
// DESPUÉS
const timeStr = tick.toLocaleTimeString("es-ES", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateStr = tick.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "2-digit" }).toUpperCase();
```

**E-5 — `src/layout/Layout.jsx:258-263`** (el pulso perpetuo): se elimina el bloque
`motion.div` del "Center pulse" completo, incluidos su `animate` y su `transition`.

**E-6 — `src/tokens.js`**: en `VIBE_TAGS` y `FILTER_TAGS`, el campo `icon` deja de llevar un
carácter y pasa a llevar un nombre del registro: `gaming` → `"target"`, `420_chill` → `"circle"`,
`dnb` → `"zap"`, `romantiqueo` → `"heart"`, `all` → `"archive"`. Los consumidores
(`WinampPlayer`, `TrackCard`, `MusicLab`) ya pasan ese valor por `<Icon name={...}>`, que resuelve
nombres directos antes que el mapa legacy (`Icon.jsx:142-144`), así que el cambio es compatible.
El `label` de `romantiqueo` (`tokens.js:99`) pasa de `"♥"` a `"ROMANTIQUEO"`: un carácter no es
una etiqueta de texto.

---

## 13. Texto para canonizar

**Para `docs/Nucleo/CONTRATO.md`, ADR nuevo** (cierra la contradicción documental de `ESTADO.md:68`):

> ### ADR-029 — La HUD tiene dos arquitecturas, no una escala
>
> Por debajo de 1280px de ancho, el cromo flota sobre el contenido: cabecera fija, navegación
> inferior fija y mini-reproductor flotante, con el contenido pasando por debajo. Es lo correcto
> cuando no hay sitio para dos cosas a la vez, y no se toca.
>
> A partir de 1280px, el cromo deja de flotar y se convierte en marco: barra superior de 44px,
> raíl de navegación de 208px a la izquierda, dock de reproductor de 336px a la derecha, línea de
> estado de 28px abajo, y un lienzo central que es el único elemento con scroll de la aplicación.
> Nada tapa nada.
>
> En escritorio el reproductor pertenece al marco y está visible en las tres pestañas. Esto no
> altera ADR-018 ni la regla inamovible 3: los elementos `<audio>` siguen encapsulados en
> `PlayerProvider`, que está por encima del marco en el árbol. Lo que se mueve es dónde se pinta el
> mando, no quién posee el audio.
>
> "Responsive" y "diseñado para escritorio" no son lo mismo. La app tiene adaptación responsive
> desde S152; el diseño de escritorio es esto. Las afirmaciones de S152/S153 y del ACTA G0-G1 se
> leen como "la app no se rompe en escritorio", que es cierto, y no como "la app está diseñada para
> escritorio", que no lo era.
>
> **Enmiendas a las specs de `docs/spec/` que este ADR hace explícitas** (sin ellas, el diseño de
> escritorio contradice la spec en vez de ampliarla):
> 1. `el_bunker_reproductor_spec_v2.md` define el producto como "PWA privada **Android-only**".
>    Pasa a ser **Android primero, escritorio como segundo cliente de primera clase**.
> 2. `UX8` ("orientación landscape → forzar portrait siempre") **queda limitada al móvil**. En
>    escritorio no hay bloqueo de orientación, que es lo que el código ya hacía de facto
>    (`Layout.jsx:585`) sin que ningún documento lo recogiera.
> 3. `galeria_vault_spec.md`, selector de 6 modos: "barra horizontal en cabecera" **sigue vigente
>    en móvil**; en escritorio el selector vive en el raíl, en vertical, conservando `layoutId` y
>    el glow del modo activo.
> 4. La regla de Edu del 6-ago (cero emoji, cero caracteres como iconografía) **prevalece sobre la
>    iconografía dibujada en las specs** (`[▦ WALL] [▣ CINEMA]…`, badges `📍 ☀ 📅 👤 🎵`, sub-tabs
>    `⏳ ⧖ 🔮 📊`). Ninguna spec asigna significado al glifo concreto, solo al concepto: no se
>    pierde nada.
>
> Lo que este ADR **no** enmienda, y por tanto sigue mandando entero: `VB1`-`VB20` (incluidos
> `VB8` color base fijo en reposo, `VB9` exclusiones del vibe, `VB10` contraste algorítmico,
> `VB11/VB17` formulario de tags con paleta completa), `T1`-`T11`, `Q15`, `UX9` y `UX10`.
>
> Diseño completo: `docs/disenos/DISENO_HUD_DESKTOP_2026-08-07.md`.

**Para `docs/Nucleo/REGLAS.md`, en REGLAS NUEVAS:**

> - **Iconografía:** todo icono sale de `src/core/ui/Icon.jsx`. Cero emoji y cero caracteres
>   unicode como icono en `src/`, incluidos los objetos de configuración de `tokens.js`. El mapa
>   `LEGACY_ICON_NAMES` es un puente cerrado para datos antiguos: ningún componente nuevo se apoya
>   en él.
> - **Dato del usuario intocable:** la app nunca reescribe títulos, nombres ni etiquetas escritos
>   por el usuario para que parezcan más limpios, por raros que sean sus adornos.
> - **Nada inventado en pantalla:** si el dato no está, se muestra estado vacío. Prohibidos los
>   valores por defecto fabricados para que un widget tenga algo que enseñar.
> - **Ninguna animación nueva en bucle infinito** que no comunique un estado.

**Para `CANON.manifest` — APLICADO el 7-ago con la corrección de Edu.** Este documento se escribió
primero sin las specs porque el portón no las pedía: `docs/spec/` no aparecía en ninguno de los dos
grupos, pese a que el propio manifest dice *"en `[requiere]` solo entra lo VIVO"* y `VB1`-`VB20`
gobiernan el comportamiento de la app hoy.

Yo proponía meter las cuatro specs en el `[requiere]` del grupo 2. **Edu corrigió a mejor: entra un
índice, no las cuatro.** Son unos 55 KB y obligarlas enteras en cada sesión de diseño es un peaje
absurdo; con un índice se consulta la relevante y no todas. Aplicado:

> ```
> [requiere]
> docs/Nucleo/CONTRATO.md
> docs/Nucleo/REGLAS.md
> docs/Nucleo/ESTADO.md
> docs/spec/INDEX.md
> ```

`docs/spec/INDEX.md` es una página: tabla de enrutado (qué área lleva a qué spec, con los prefijos
de requisito para buscar dentro), precedencia frente al CONTRATO, placeholders abiertos y quién las
cita. La regla operativa está escrita dentro del propio índice: si tocas un área, abres esa spec
antes.

**Comprobado en el acto:** al intentar escribir el ADR-029 en `CONTRATO.md` justo después de añadir
la línea, el hook H7 bloqueó la escritura por no haber leído `docs/spec/INDEX.md`. El portón que
faltaba funciona.

Queda abierto lo otro: la regla `U3_PATH_DOCS` de la plantilla de auditoría sigue clasificando
`spec/` como histórico junto a `legacy/`. Tarjeta `t_54f1d39e`.

**Aviso relacionado, para quien encargue la próxima auditoría.** La auditoría que se declaró al
100% del canon clasificó `docs/spec/` entero como *"documentación histórica fuera del alcance
funcional"* y solo lo muestreó
(`docs/operacional/auditoria_total_2026-08-02_REPETIDA_9_HERMES.md:185-192`, regla
`U3_PATH_DOCS`). La regla mete `spec/` en el mismo saco que `legacy/`, `sesiones/` e `historico/`.
Mientras esa regla siga así, ninguna auditoría "completa" mira las specs. No es asunto de este
diseño arreglarlo, pero sí decirlo.

**Para `docs/Nucleo/ESTADO.md`,** sustituir el punto "HUD DESKTOP" de Pendientes reales por:

> - **HUD DESKTOP (`t_504a2707`):** diseño fino entregado por Opus el 7-ago en
>   `docs/disenos/DISENO_HUD_DESKTOP_2026-08-07.md`, con plan de 6 fases e inventario de rastro de
>   IA. La propuesta conceptual del 5-ago quedó rechazada por Edu y no se mergea. La contradicción
>   documental S152/S153 vs PROYECTO.md:54 se cierra con ADR-029. Pendiente: ejecución F1.

---

## 14. Verificación de cierre

Ejecutar desde `C:\proyectos\dev\el-bunker`. Cada fase cierra con sus greps en verde, y ninguna
cierra sin `npm run build`, `npx eslint src/ workers/` y `npx vitest run`.

**V-1 — Cero iconografía de caracteres en `src/` fuera del puente legacy (cierra F5).** El grep
excluye líneas de comentario y de `console.*`, porque los `→` de un comentario o de una traza no
son iconografía y perseguirlos haría el criterio incumplible. Requiere `--pcre2` (PowerShell):
```
rg --pcre2 -n "^(?!\s*(//|\*|/\*))(?!.*console\.).*[\x{2600}-\x{27BF}\x{1F300}-\x{1FAFF}\x{2190}-\x{21FF}\x{25A0}-\x{25FF}\x{2660}-\x{266F}]" src -g "*.jsx" -g "*.js" -g "!**/Icon.jsx" -g "!**/__tests__/**"
```
**Línea base medida el 7-ago-2026: 147 coincidencias en 21 ficheros.** De esas, 4 son falsos
positivos (flechas en comentarios al final de una línea de código: `SmokeSession.jsx:357`,
`Layout.jsx:247`, `PlayerContext.jsx:1025`, `VaultContext.jsx:113`) y se dejan como están.
Resultado esperado al cerrar F5: **esas 4 y ninguna más**. Si aparece una coincidencia nueva
después, es una regresión.

**V-2 — El punto de corte protege el móvil (cierra F1):** ninguna de las piezas del marco puede
montarse por debajo de 1280.
```
rg -n "BottomNav|MiniPlayer|DesktopFrame" src/layout/
```
Resultado esperado: cada montaje va tras una condición de ancho, no suelto.

**V-3 — El encajonado desaparece (cierra F2):**
```
rg -n "max-w-6xl" src/
```
Resultado esperado: sin coincidencias.

**V-4 — Un solo motor de audio (regla inamovible 3, obligatorio en F1):**
```
rg -n "new Audio\(|<audio" src -g "*.jsx"
```
Verificado el 7-ago: los únicos elementos reales son `PlayerContext.jsx:1683` y `:1711`; el resto
de coincidencias son comentarios que mencionan `<audio>` (`MusicLab.jsx:131`,
`WinampPlayer.jsx:288, 299, 401`, `PlayerContext.jsx:551, 1162, 1486`). **Resultado esperado: esas
mismas y ninguna más.** Un elemento nuevo en cualquier otro fichero rompe la regla inamovible 3 y
la fase se para.

**V-5 — El scroll de ventana ya no se usa (cierra F1):**
```
rg -n "window.addEventListener\(\"scroll" src/
```
Resultado esperado: sin coincidencias.

**V-6 — Sin datos fabricados (cierra F6):**
```
rg -n "DEFAULT_ADVENTURE_DATE|Date.now\(\) - [0-9]+ \* 86400000" src/
```
Resultado esperado: sin coincidencias.

**V-7 — Truncado corregido (cierra F3):** volver a pasar la auditoría DOM del 4-ago a 1264px y
1500px. Criterio: **cero** títulos truncados en WALL, MUSIC LAB y TIMELINE en escritorio. Los 23,
14 y 2 medidos son la línea base.

**V-8 — Regresión visual:** capturas nuevas con el procedimiento del 6-ago (1500x950 y 390x844,
mismas tres pantallas) en `docs/operacional/hud-material-<fecha>/`. Las de móvil deben ser
**idénticas** a las del 6-ago: si cambia un pixel del móvil, la fase está mal.

---

## 15. Anexo: cobertura requisito a requisito

**Por qué existe este anexo.** Edu, 7-ago: *"si fallaste en ese no me fío de que hayas hecho el
resto a la mitad."* Tiene razón en no fiarse: el modo a pantalla completa se me pasó y solo salió
porque él preguntó. La respuesta no es pedir confianza, es esto: **los 118 identificadores de
`el_bunker_reproductor_spec_v2.md`, extraídos con grep y no de memoria**, cada uno con su veredicto.
Cualquier fila se puede comprobar buscando el identificador en la spec y en este documento.

Comando de extracción, para que se pueda repetir:
```
rg -o "^\*\*[A-Za-z0-9/ -]+:?\*\*" docs/spec/el_bunker_reproductor_spec_v2.md | sed "s/\*//g; s/:$//" | sort -u
```

**El cruce encontró 11 huecos más.** Están todos corregidos en el §6 P4 y marcados abajo como
`HUECO`. Que aparezcan aquí en vez de quedarse callados es el objetivo del anexo.

### 15.1 Afectan al escritorio y están cubiertos

| ID | Dónde queda |
|---|---|
| `VB1` | Ley 1 del §1 (el acento sale del tag principal del track activo) |
| `VB2` | §1 y §9: "all" es filtro de UI, no genera vibe ni entra en el catálogo |
| `VB5` `VB6` `T4` `T5` `T8` `T10` `VB19` | §2.2 R-2: el marco no inventa tiempos; barra superior con gradiente top-bottom de 1s, resto en crossfade |
| `VB8` `T6` `T9` | §2.2 R-3: color base fijo en reposo. Retirada mi propuesta contraria |
| `VB9` | §2.2 R-1 y §8: línea de estado, botón de salir y errores fuera del vibe |
| `VB10` | §8: todo texto e icono nuevo pasa por `ensureContrast()` |
| `VB11/VB17` | §2.2 R-4 y §9 PZ-1: paleta completa con validación bloqueante; el campo de icono es añadido fuera de spec |
| `VB12` `VB18` `T1` | §2.2 R-7: el vibe no se cambia a mano; editar tag aplica al recargar |
| `VB14` `VB20` | §2.2 R-6: playlist temática ya especificada y bloqueada por `Q14` |
| `VB16` | §2.1: el marco no guarda color propio |
| `VB15` | Los filtros de vibe se quedan en el lienzo (§6 P2) y conviven con el buscador en AND; el atajo `/` da foco, no sustituye |
| `T2` `T3` | §2.1: base del dock. Ya mandaban reproductor anclado y persistente |
| `Q15` `EC-S5` | §6 P4: historial de 5 atenuados arriba en el dock |
| `UX6` `VIZ1` `VIZ2` `VIZ3` | §6 P4, bloque del visualizador (añadido 7-ago) |
| `UX8` | §2.3 X-1: enmienda que firma Edu. Sin ella, este diseño contradice la spec |
| `UX9` | §7 C-4: `/` da foco al buscador de cabecera, que sigue siendo el de la spec |
| `UX10` | §2.1 y §7 C-5: modos de lista ya implementados; se extiende, no se reinventa |
| `UX11` | §7 C-5: tap reproduce, acciones frecuentes al hover. Condicionado a `TRACKS-M23` |
| `UX-G1` | §6 P1: los toasts bajan a `top:56` para no chocar con la barra de 44px |
| `L1` | §6 P4: el bucle triestado va en la fila de modos (regla inamovible 1) |
| `S5` `S8` | §6 P4: sesión por usuario; bucle y aleatorio siguen siendo preferencia de dispositivo |

### 15.2 HUECOS encontrados por este cruce — corregidos en el §6 P4

| ID | Qué se me había pasado |
|---|---|
| `VB7` | *"El vibe se mantiene activo durante la pausa, a todo color, sin atenuar."* El dock **no baja opacidad al pausar**. Parece obvio y es justo lo que un diseño descuidado hace |
| `VB13` | Un track puede tener varios tags pero **solo el principal dicta el vibe**. El dock muestra el principal como vibe; los secundarios, si se muestran, van sin color propio |
| `Q14` | Separación visual de cola: los tracks metidos a mano se pintan **con su color de tag**, rompiendo el patrón de la playlist. Sin etiquetas ni divisores. La cola del dock hereda esta regla |
| `Q5` | El arrastrar y soltar de la cola **existe y se conserva en el dock**. Un dock que muestre la cola en solo lectura sería una regresión |
| `UX7` `M10` | **No había control de volumen en el dock.** En escritorio no hay botones físicos que sincronizar, así que el control de `masterVolume` tiene que estar en pantalla. Va en la fila de modos |
| `UX1` | Seek: en móvil es táctil más doble toque de 10s. En escritorio, clic en la barra de progreso y **`Shift` + flechas para ±10s**, que era el equivalente que faltaba |
| `P1` | *"Indicador visual pequeño en track activo (local/stream)."* No estaba en el dock. Va junto al título |
| `UX3` `UX4` | Estados del dock: el botón de reproducir se convierte en spinner al cargar; el artwork se tiñe de rojo brevemente al fallar |
| `EC-C3` | Cola manual activa y el usuario pulsa play en una playlist: la spec manda **Bottom Sheet**, que en escritorio no existe como patrón. Equivalente: el `Dialog` de `core/ui`, mismas dos opciones (reemplazar contexto o añadir al final) |
| `S7` | Dos botones separados en la cabecera de la cola (vaciar / guardar como playlist), no uno con submenú. Aplica a la cola del dock |
| `C5` | Fin de cola: para, barra al 100%, track en pausa y fade de 1s a la UI base. El marco entero participa en ese fade, no solo el dock |

### 15.3 No afectan al diseño de escritorio

Se listan igualmente, uno a uno, para que el anexo sea comprobable y no una lista de lo que me
convenía mirar.

| Grupo | IDs | Por qué no afecta |
|---|---|---|
| Android | `A1` `A2` `A3` `A4` `A5` `A6` `UX-G2` `UX-G3` | Comportamiento del sistema operativo móvil. No hay equivalente en navegador de escritorio |
| MediaSession | `M1` `M2` `M3` `M4` `M5` `M6` `M7` `M8` `M9` `M11` `M12` | Notificación y pantalla de bloqueo de Android. `M2` y `M6` usan el color del vibe, que no cambia por este diseño |
| Cast y TV | `CAST1` `CAST2` `CAST3` `CAST4` `CAST5` `CAST6` `VIZ5` | Segunda pantalla. `VIZ4` (Web Audio para reactividad) sí toca el visualizador y está en el §6 P4 |
| Lógica de cola | `Q1` `Q2/Q3` `Q4` `Q6` `Q7` `Q8/Q9` `Q10` `Q11` `Q12` `Q13` `Q16/Q17` | Reglas de comportamiento de la cola. Se pintan igual en cualquier ancho |
| Contexto de reproducción | `C1/EC-C1` `C2/C3` `C4` `EC-C2` `EC-C4` `EC-C5` | Qué suena después. Sin efecto en la disposición |
| Playback y red | `P2` `P3` `EC-P1` `EC-P2` `EC-P3` `EC-P4` `EC-P5` | Motor y fallos de red. `EC-P2` menciona Drive: superado por ADR-024 |
| Aleatorio y bucle | `SH1` `SH2` `SH3` `EC-S1` `EC-S2` `EC-S3` `EC-S4` `L2` `L3` `L4` | Lógica de orden. `L1` sí sale, arriba |
| Sesión | `S1` `S2` `S3` `S4` `S6` | Persistencia y borrado. `S6` menciona Drive: superado por ADR-002 y ADR-024 |
| Creación de track | `VB3` `VB4` | Formulario de alta. Tocan a personalización (§9), no a la disposición |
| Diferidos por la propia spec | `T7` `VIZ6` (Fase C) `T11` (anulada) `VIZ4` (motor, no disposición) | Fuera de alcance por decisión de la spec, no mía |
| Sin equivalente en escritorio | `UX2` (háptico) `UX5` (gestos swipe) | El teclado del §7 C-4 cubre lo que los gestos hacían |

**Cuenta:** 22 filas en 15.1 (que cubren 41 IDs), 11 en 15.2, y 66 IDs en 15.3. Total 118, los
mismos que devuelve el grep. Si alguna fila está mal clasificada, se ve abriendo la spec por ese
identificador.

### 15.4 Lo mismo, para las otras tres specs

- **`galeria_vault_spec.md`** — los 6 modos y sus fases están en §2.2 R-9; el selector horizontal
  contra el raíl vertical en §2.3 X-2; la capa ambiental por Era y su convivencia con el vibe en
  §2.2 R-8; el panel de detalle en §7 C-3; la virtualización agresiva en §6 P3. Fuera: audioguías,
  líneas de viaje, clusters, REEL y EXHIBITION, todos Fase B o C por la propia spec.
- **`capsulas_spec.md`** — las 4 sub-tabs alimentan el segundo nivel del raíl (§6 P2). Las mejoras
  numeradas (`SS-1` a `SS-8`, `TC-1` a `TC-9`) son de funcionalidad, no de disposición, y ninguna
  cambia por el marco.
- **`taxonomia_vault.md`** — 14 categorías y unos 70 tipos. Toca al §10 (los ~40 iconos emoji de
  `AddEntryForm` implementan esta taxonomía) y al §9: la propia spec dice *"documento vivo,
  modular"* y *"cada tipo es una ficha de LEGO"*, lo que refuerza que los tipos deberían ser dato
  y no un array escrito en el código.

---

## 16. Lo que este diseño no hace

- No cambia la paleta, ni la tipografía, ni el fondo, ni la estética. La identidad se hereda entera.
- No toca las 3 pestañas de ADR-017, ni los 6 modos de ADR-021, ni las 4 cápsulas de ADR-020.
- No toca el móvil. Por debajo de 1280 no se mueve nada, y hay una verificación dedicada a probarlo.
- No añade un icono nuevo al registro: los 20 que hacen falta ya están.
- No propone modo claro, ni densidad configurable global, ni raíl plegable, ni multi-selección.
- Resuelve la discrepancia de 529 contra 1.117 tracks: 529 son los activos actuales y 1.117 era
  el total histórico pre-purga (588 soft-deleted). La purga del 7-ago y su snapshot están
  documentados en `docs/Nucleo/ESTADO.md`; no se debe presentar el baseline histórico como
  biblioteca reproducible actual.
  las fotos (527). Sigue siendo diagnóstico pendiente, no dato cerrado.
- **No enmienda ninguna spec por su cuenta.** Las cuatro enmiendas que necesita (§2.3 y ADR-029)
  están escritas para que las firme Edu. Si no las firma, este diseño no se ejecuta: contradice la
  spec vigente, y eso se dice antes, no después.
- No diseña la playlist temática (`VB20`), ni el degradado combinado playlist+canción (`VB1`,
  bloqueado por `Q14`), ni la capa ambiental de Era de la galería. Los tres tienen sesión propia
  asignada por sus specs.
