# Línea base de truncados HUD — 2026-08-12

Tarjeta: t_20a3e4cf. Método: tools/audit-ui (AUD-1), `node tools/audit-ui/run.mjs`
sobre el commit `b84088c3faaeadfbe465db04aedaddafb4e90ec2`, Edge `msedge/151.0.4129.78`
headless, fixtures `cd41d5b2704b`, sin red externa. Evidencia de ejecución:
`[audit-ui] OK en 25.5s — 24 hallazgos {"truncamiento":24}`.

## Resumen por vista y viewport

| Vista (pantalla) | H del diseño | 1440x900 | 390x844 | Total |
|---|---|---|---|---|
| WALL (vault) | H-11 | 12 | 4 | 16 |
| MUSIC LAB (music) | H-12 | 1 | 5 | 6 |
| TIMELINE (capsules) | H-13 | 0 | 2 | 2 |
| **Total** | | **13** | **11** | **24** |

Referencia histórica (auditoría del 4-ago, DISENO_HUD_DESKTOP_2026-08-07.md D-6 y
ESTADO.md:74): 23 en WALL, 14 en MUSIC LAB, 2 en TIMELINE, medidos a 1264px.
Los números NO son comparables 1:1 con los de esta línea base: cambia el viewport
de medición (1264px → 1440x900 / 390x844). La comparación válida para la tarjeta
t_553b5f60 es línea base (este documento) vs. medición post-implementación con el
mismo harness audit-ui.

## Hallazgos por vista

Formato: `id` — elemento (rol «nombre accesible») — necesita / disponible / déficit px.
Todos son `tipo: truncamiento`. Capturas en `tools/audit-ui/report/screenshots/`.

### WALL — vault (H-11)

**1440x900 (12):**

| id | elemento | necesita | disponible | déficit |
|---|---|---|---|---|
| 380bd1608f60 | span «takeout_IMG-20211101-WA0012.jpg» | 233 | 136 | 97 |
| 0fdff5efd74c | span «Ｌａｄｙ，Ｈｅａｒ Ｍｅ Ｔｏｎｉｇｈｔ» | 236 | 136 | 100 |
| 7f3ca055f701 | span «EsteEsUnTituloDeCientoVeinteCaracteresSinEspaciosParaEstresarElLayoutDeLaTarjetaEnElMuroDeLaBovedaDelBunker» | 803 | 136 | 667 |
| dd95a7453330 | p «La primera foto que nos mandamos por WhatsApp, con la calida» | 432 | 235 | 197 |
| f943aa7170d1 | p «👨‍👩‍👧‍👦 La familia entera en la playa de agosto — el día que David se perdió» | 520 | 235 | 285 |
| ee6d0d348808 | p «Foto de familia con emoji ZWJ en el título.» | 310 | 235 | 75 |
| 35084c79d835 | p «El día que sonó esta canción en el coche y decidimos que era» | 432 | 235 | 197 |
| abb9b798a926 | p «日本語のタイトルはとても長いですから、カードの幅を超えて折り返すことができません» | 480 | 235 | 245 |
| b1d921d0e0de | p «Título CJK sin espacios que no cabe en la tarjeta.» | 360 | 235 | 125 |
| 9f3f5dca70fc | p «EsteEsUnTituloDeCientoVeinteCaracteresSinEspaciosParaEstresarElLayoutDeLaTarjetaEnElMuroDeLaBovedaDelBunker» | 771 | 235 | 536 |
| 282ddf2b5fdb | p «Carta larga con un título kilométrico para estresar el muro.» | 432 | 235 | 197 |
| 8692f11a66cf | p «שלום עולם — זיכרון מיום החתונה בירושלים בערב של קיץ חם» | 389 | 235 | 154 |

**390x844 (4):**

| id | elemento | necesita | disponible | déficit |
|---|---|---|---|---|
| fff718d3815d | div «EL BÚNKER AUG 12, 2026 04:42:43 · offline · AVENTURA EN CURSO 1969 días …» (header StatusBar, no es título de tarjeta) | 452 | 390 | 62 |
| 02c0aed21d17 | span «takeout_IMG-20211101-WA0012.jpg» | 233 | 174 | 59 |
| d01ba21612de | span «Ｌａｄｙ，Ｈｅａｒ Ｍｅ Ｔｏｎｉｇｈｔ» | 236 | 174 | 62 |
| d8a33e2ef074 | span «EsteEsUnTituloDeCientoVeinteCaracteresSinEspaciosParaEstresarElLayoutDeLaTarjetaEnElMuroDeLaBovedaDelBunker» | 803 | 174 | 629 |

### MUSIC LAB — music (H-12)

**1440x900 (1):**

| id | elemento | necesita | disponible | déficit |
|---|---|---|---|---|
| 97b37cd05874 | p «SupercalifragilisticoespialidosoYUnPocoMasParaQueElTituloNoQuepaEnLaTarjetaDeMusicaDelLaboratorio» | 699 | 608 | 91 |

**390x844 (5):**

| id | elemento | necesita | disponible | déficit |
|---|---|---|---|---|
| 37784c382310 | p «👨‍👩‍👧‍👦 La canción de la boda de los primos» | 283 | 222 | 61 |
| 9a42d99fc9b9 | p «La canción del coche. Nunca la saltamos.» | 288 | 222 | 66 |
| 8b8806f045c8 | p «SupercalifragilisticoespialidosoYUnPocoMasParaQueElTituloNoQuepaEnLaTarjetaDeMusicaDelLaboratorio» | 699 | 222 | 477 |
| e93d4c4ea6e3 | p «שיר עברי ארוך מאוד שלא נכנס בכרטיסייה של המוזיקה» | 346 | 222 | 124 |
| f183eaf22b2f | p «日本語の曲名がとても長いのでカードからはみ出してしまいます» | 348 | 222 | 126 |

### TIMELINE — capsules (H-13)

**1440x900: 0 hallazgos.**

**390x844 (2):**

| id | elemento | necesita | disponible | déficit |
|---|---|---|---|---|
| 4bec0afa9ea7 | span «david Ｌａｄｙ，Ｈｅａｒ Ｍｅ Ｔｏｎｉｇｈｔ» | 274 | 234 | 40 |
| 13a8c02c1b96 | span «edu 👨‍👩‍👧‍👦 La canción de la boda de los primos» | 311 | 241 | 70 |

## Notas

- Los 24 hallazgos son de tipo `truncamiento` (scrollWidth > clientWidth, overflow
  recortando, déficit >= 8px y >= 10% de lo necesario; ver
  `tools/audit-ui/playwright/detectors/truncated-text-detector.js`). El desborde
  horizontal (overflow-x auto intencional) no cuenta como truncamiento.
- Correspondencia con el diseño (DISENO_HUD_DESKTOP_2026-08-07.md D-6 y C-6,
  ESTADO.md:74): H-11 = WALL, H-12 = MUSIC LAB, H-13 = TIMELINE. Excepción
  anotada: `fff718d3815d` (vault 390x844) es el header StatusBar, no un título
  de tarjeta; es truncamiento en la vista WALL pero no encaja en el patrón
  "títulos a una línea" de C-6.
- Artefactos regenerables: `tools/audit-ui/report/audit.json` (ejecución) y
  `tools/audit-ui/report/linea-base-hud-2026-08-12.json` (copia, comprometida como
  línea base). Capturas en `tools/audit-ui/report/screenshots/`.
