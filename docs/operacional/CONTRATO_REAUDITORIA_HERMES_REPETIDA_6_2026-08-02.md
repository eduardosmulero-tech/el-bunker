# CONTRATO — Reauditoría total de el-bunker por Hermes
## REPETIDA_6 · séptima ejecución

> **Estado:** CONTRATO DE EJECUCIÓN — pendiente de OK explícito de Edu  
> **Fecha:** 2-ago-2026 · **Mandante:** Edu · **Ejecutor:** Hermes · **Revisor:** Luna / Edu  
> **Regla:** tolerancia cero; un solo fallo material invalida toda la auditoría.

## 1. Objeto y antecedentes

Este contrato ordena una nueva auditoría total de el-bunker después de que Luna invalidara REPETIDA_5. No se permite corregir REPETIDA_5 mediante una adenda ni reutilizar sus afirmaciones sin volver a comprobarlas.

Quedan rechazadas o pendientes de aprobación: la auditoría inicial, `auditoria_total_2026-08-02_REPETIDA_HERMES.md`, `auditoria_total_2026-08-02_REPETIDA_2_HERMES.md`, `auditoria_total_2026-08-02_REPETIDA_3_HERMES.md`, `auditoria_total_2026-08-02_REPETIDA_4_HERMES.md` y `auditoria_total_2026-08-02_REPETIDA_5_HERMES.md`.

La revisión de REPETIDA_5 encontró estos fallos materiales que REPETIDA_6 debe impedir expresamente:

1. El mismo informe afirmó **215 rutas** en §2 y en el checklist, pero sus inventarios, §3, §4 y el validador demostraban **216 rutas**.
2. La matriz de cobertura contenía una celda literal `—`, aunque el contrato prohibía guiones y el checklist declaraba falsamente que no existían.
3. §16/§17 afirmó que el informe era el único archivo nuevo, pero el `git status --short` real contenía múltiples archivos no rastreados y un archivo modificado adicional.
4. El hecho de que el validador produjera `0 FALLOS` no autorizaba a ignorar contradicciones textuales, claims incompatibles o un snapshot Git inexacto.

## 2. Entregables y nombres obligatorios

Hermes entregará, sin sobrescribir históricos:

- `docs/operacional/auditoria_total_2026-08-02_REPETIDA_6_HERMES.md`
- `C:\proyectos\.trabajo\evidencias_auditoria6\`

El paquete contendrá como mínimo: inventario del universo, inventario clasificado, índice de evidencias, manifiesto de IDs, manifiesto de usos, `validador.py`, salida completa del validador, capturas/logs de los flujos, evidencias D1/R2 de sesión autorizada y cualquier script auxiliar empleado.

No se modificará ningún informe o contrato anterior. No se modificará `src/`, `workers/`, `public/`, configuración, datos, D1, R2 ni infraestructura.

## 3. Alcance cerrado y partición

El universo se definirá de forma reproducible antes de la inspección:

- incluidos: todos los archivos regulares bajo `src/**`, `workers/**`, `public/**` y `docs/**`, más todos los archivos regulares de la raíz;
- excluidos únicamente: `.git/**`, `node_modules/**`, `dist/**`, `coverage/**`, `.claude/**`, `.github/**` y `tools/**`, con justificación escrita;
- ningún archivo incluido podrá omitirse, duplicarse o aparecer en dos universos.

La prioridad objetiva de clasificación será exactamente:

1. `U3_PATH_DOCS`: cualquier archivo bajo `docs/**`;
2. `U3_EXT_MD_TXT`: cualquier `.md` o `.txt` incluido que no esté ya en U3;
3. `U1_CODE_EXT`: `.js`, `.jsx` o `.css` bajo `src/`, `workers/` o `public/`;
4. `U2_REST`: todo archivo incluido restante.

La clasificación de lectura de `docs/spec/` es `U3_PATH_DOCS + LIVE_SPEC` (docs/Nucleo/REGLAS.md:53-56 y CANON.manifest:29-41): las especificaciones de `docs/spec/` son canon vivo y se clasifican `LECTURA COMPLETA` (se leen: el `INDEX.md` y la spec del área que se toca); nunca pueden recibir `MUESTREO` con el motivo «documentación histórica fuera del alcance funcional». La enumeración de carpetas históricas (`legacy/`, `sesiones/`, `historico/`, `planes/`, `disenos/`) NO incluye `spec/`. Esta cláusula corrige el consumidor futuro; no reescribe auditorías anteriores.

El validador probará y publicará:

- `U1 ∩ U2 = ∅`, `U1 ∩ U3 = ∅`, `U2 ∩ U3 = ∅`;
- `U1 ∪ U2 ∪ U3 = UNIVERSO_CERRADO`;
- una única regla por ruta;
- cobertura exacta, sin rutas faltantes ni sobrantes.

## 4. Conteos y reconciliación obligatoria

En REPETIDA_6 el total del universo debe calcularse desde la enumeración física y aparecer una sola vez como constante reconciliada en el informe, en el inventario, en la tabla y en la salida del validador. Para el estado de este contrato, la referencia esperada es:

`216 rutas = U1 79 + U2 29 + U3 108`.

Si la enumeración física de la ejecución produce otra cifra, Hermes no la ocultará: detendrá la entrega, actualizará todas las cifras de forma consistente y documentará la diferencia. Cualquier aparición de `215` como total, ecuación, checklist o claim factual sin marcar como error histórico fuerza `FAIL / INVALIDADA`.

El informe no podrá declarar un checklist completo si una sección contiene un conteo distinto del inventario o del validador. El validador deberá comprobar además que los conteos de directorios, extensiones, universos y filas se reconcilian.

## 5. Inventario fila por archivo

Habrá exactamente una fila por cada ruta incluida, con ruta relativa completa, bytes, extensión, regla objetiva, universo y clasificación. No se permiten abreviaturas, glob patterns sin expandir, rangos implícitos ni filas agrupadas.

Las clasificaciones permitidas son únicamente `LECTURA COMPLETA`, `BÚSQUEDA DIRIGIDA`, `MUESTREO` y `NO REVISADO`. Un archivo incluido con `NO REVISADO` produce `FAIL / INVALIDADA`; `MUESTREO` deberá incluir motivo concreto.

El informe publicará el total de filas y los subtotales U1/U2/U3 una sola vez en cada tabla de resumen.

## 6. Matriz de cobertura y flujos

La auditoría cubrirá exactamente los 12 flujos F1–F12 y una matriz de contratos cruzados con 12 filas y 9 columnas.

Cada celda operativa deberá contener exactamente una de estas formas:

- uno o más `EVIDENCIA-ID` existentes y semánticamente compatibles;
- `NO VERIFICADO (motivo: ...)`;
- `NA (motivo: ...)` cuando no aplique.

Quedan prohibidos en la matriz: celdas vacías, `—`, `-`, `N/A` sin motivo, `TODO`, IDs conceptuales, IDs inexistentes y texto que pretenda sustituir una evidencia. El informe no afirmará “sin guiones” si alguna matriz contiene uno.

Las etiquetas operativas permitidas son solamente `VERIFICADO EN CÓDIGO`, `VERIFICADO EN ARTEFACTO`, `HIPÓTESIS`, `NO VERIFICADO` y `FAIL / INVALIDADA`.

## 7. Time Capsules y evidencia extremo a extremo

F7 deberá probarse desde la UI hasta Worker, esquema, persistencia y lectura. La selección de contenido y el resultado de `capsule_items` se verificarán por separado. Una captura del formulario no prueba persistencia; un POST no prueba lectura; un hash no prueba que el ID pertenezca a F7.

F11 Google deberá marcarse `NO VERIFICADO` si no existe una ejecución con cuenta humana y evidencia aplicable. F6, F8 y cualquier gesto no automatizado seguirán la misma regla, sin elevar su certeza por evidencia de otro flujo.

## 8. Índice y correspondencia semántica

Cada entrada del índice tendrá, como mínimo, estos 12 campos: `id`, `archivo`, `sha256`, `size_bytes`, `fecha_hora`, `flujo`, `hallazgos`, `tipo`, `viewport`, `entorno`, `origen` y `redaccion`.

Requisitos vinculantes:

1. Cada ID es único y sigue el patrón `EV6-<NNN>`; no se aceptan IDs conceptuales.
2. Cada archivo indexado existe y su tamaño y SHA-256 coinciden.
3. Cada ID usado por el informe existe exactamente una vez en el índice.
4. Cada entrada del índice se usa en el informe o se declara auxiliar con ID y finalidad explícitos.
5. La relación informe → índice e índice → informe es bidireccional.
6. `archivo`, `flujo`, `hallazgos` y `tipo` deben ser compatibles con el uso concreto del ID. Una evidencia de consola no prueba por sí sola una respuesta HTTP; una captura de crear era no prueba una subida; F3 no prueba F7.
7. `manifiesto_usos.json` tendrá una fila por uso con ID, ruta real, flujo indexado, flujo usado, hallazgo indexado, hallazgo usado y compatibilidad.
8. `validador.py` comprobará esta semántica y su salida completa se entregará.

La validez criptográfica y la validez semántica se verificarán y reportarán por separado. `0 FALLOS` criptográficos no convierte automáticamente el informe en válido.

## 9. Evidencia y citas

Cada hallazgo tendrá ID, severidad, impacto, clasificación, archivo y líneas, observado, esperado, EVIDENCIA-ID compatible, certeza, dependencia y decisión.

Toda cita `ruta:línea` deberá apuntar a una ruta incluida que exista y a un rango válido. Luna comprobará al menos 10 citas y el validador o script auxiliar deberá permitir reproducir la comprobación.

Las evidencias D1/R2 deberán indicar fecha, origen, alcance y limitación. El estado actual no se presentará como verificado si solo existen snapshots de una sesión anterior.

## 10. Git y control de cambios

Hermes capturará `git status --short` antes de comenzar y después de terminar, identificando cada línea como preexistente o
preexistente o generada por la auditoría. Entregará ambos snapshots y una comparación literal reproducible.

Está prohibido afirmar “único archivo nuevo”, “working tree limpio” o equivalente salvo que el `git status` real lo demuestre. Si hay archivos históricos, contratos, informes, residuos o modificaciones preexistentes, deberán listarse completos, sin resumirlos como si no existieran.

La auditoría deberá demostrar que no modificó código, configuración, datos, infraestructura, D1 ni R2. El propio informe, el contrato y sus evidencias deberán clasificarse correctamente como artefactos de la ejecución, sin reescribir el histórico para aparentar limpieza.

## 11. Checklist obligatorio y veredicto

El informe incluirá los 12 puntos siguientes, cada uno con `PASS`, `FAIL` o `NO VERIFICADO` y una nota concreta:

1. inventarios, cobertura y partición;
2. comandos y conteos reconciliados;
3. rutas y rangos;
4. índice y hashes;
5. semántica de IDs;
6. ejecución reproducible del validador;
7. citas archivo:línea;
8. etiquetas;
9. matriz sin guiones ni vacíos;
10. Time Capsules F7 extremo a extremo;
11. estado Git literal;
12. descartados y contradicciones.

No se permite marcar un punto `PASS` si existe una contradicción material en otra sección del mismo informe. El veredicto provisional solo podrá ser `PASS CANDIDATE` si los 12 puntos pasan sin excepciones; Luna y Edu decidirán la aprobación final.

## 12. Condiciones de invalidación inmediata

Cualquiera de los siguientes hechos fuerza `FAIL / INVALIDADA` y repetición desde cero: conteo contradictorio; suma de universos incorrecta; fila ausente o duplicada; solapamiento de universos; celda vacía, `—` o `-`; ID inexistente, duplicado, huérfano, cruzado o semánticamente incompatible; hash/tamaño incorrecto; metadato omitido; cita inválida; evidencia de un flujo usada para otro; afirmación más fuerte que la evidencia; validador no reproducible; snapshot Git que no coincide; o modificación no autorizada de código, datos o sistemas vivos.

## 13. Protección de históricos y entrega

Antes de entregar, Hermes verificará que permanecen sin cambios:

- los informes iniciales y REPETIDA_2, REPETIDA_3, REPETIDA_4 y REPETIDA_5;
- los contratos anteriores y el acta/veredicto existentes;
- todo `src/`, `workers/`, `public/` y configuración del proyecto.

La única escritura autorizada para Hermes será la creación del informe REPETIDA_6, el paquete `evidencias_auditoria6` fuera del repositorio y los artefactos auxiliares expresamente enumerados en ese paquete. No se harán commits, pushes, despliegues, consultas a sistemas vivos ni cambios de producción.

## 14. Definition of Done

La entrega solo estará completa cuando:

- el informe y el paquete existan con los nombres exactos;
- el universo tenga una cifra única, reconciliada y reproducible;
- U1/U2/U3 sean disjuntos y exhaustivos;
- exista una fila real por archivo;
- la matriz tenga 12 filas × 9 columnas sin celdas prohibidas;
- el índice, hashes, manifiestos y semántica pasen la validación;
- F7 esté probado extremo a extremo y los no verificados estén declarados;
- las citas sean reproducibles;
- los dos snapshots Git coincidan con el estado observado;
- el informe liste todos los cambios preexistentes y no reclame limpieza ficticia;
- el paquete incluya `validador.py` y su salida completa;
- ninguna sección contradiga otra sección del mismo informe.

El informe incluirá la cadena exacta de ejecución del validador, su código de retorno, su salida completa y el hash de los artefactos críticos. Luna podrá repetir la validación sin corregir manualmente el informe.

## 15. Cierre

Este contrato no aprueba REPETIDA_5 ni ningún informe anterior. Hermes no comenzará la ejecución como aprobada hasta recibir el OK explícito de Edu. Cualquier resultado que no cumpla todas las cláusulas anteriores será `FAIL / INVALIDADA`.

*Fin del contrato.*
