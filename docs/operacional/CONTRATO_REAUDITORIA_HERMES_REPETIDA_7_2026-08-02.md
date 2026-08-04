# CONTRATO — Reauditoría total de el-bunker por Hermes
## REPETIDA_7 · octava ejecución

> **Estado:** CONTRATO DE EJECUCIÓN — pendiente de OK explícito de Edu  
> **Fecha:** 2-ago-2026 · **Mandante:** Edu · **Ejecutor:** Hermes · **Revisor:** Luna / Edu  
> **Regla:** tolerancia cero; un solo fallo material invalida toda la auditoría.

## 1. Objeto y antecedentes

Este contrato ordena una nueva auditoría total después de la invalidación de REPETIDA_6. No se permite una adenda ni una corrección parcial: el informe y las evidencias deben regenerarse desde un snapshot inicial nuevo.

Quedan rechazadas o pendientes de aprobación la auditoría inicial y todas las entregas `REPETIDA_HERMES`, `REPETIDA_2_HERMES`, `REPETIDA_3_HERMES`, `REPETIDA_4_HERMES`, `REPETIDA_5_HERMES` y `REPETIDA_6_HERMES`.

La revisión de REPETIDA_6 detectó estos fallos materiales:

1. `manifiesto_usos.json` tenía 74 filas, pero `hallazgo_usado` estaba vacío en las 74.
2. El validador generaba explícitamente `hallazgo_usado: ""` y aun así devolvía `0 FALLOS`; no validaba el contrato completo.
3. §5 tenía 7 columnas y §6 tenía 8, aunque el informe declaraba una matriz de 12×9 y el checklist marcaba PASS.
4. El validador permitía columnas libres y no exigía que cada fila tuviera exactamente el número de columnas declarado.
5. Un conteo fijo de referencia (`216`) no sustituye al snapshot físico vigente; toda diferencia debe reconciliarse con una fuente única y una comparación literal.

## 2. Entregables y protección

Hermes entregará, sin sobrescribir históricos:

- `docs/operacional/auditoria_total_2026-08-02_REPETIDA_7_HERMES.md`
- `C:\proyectos\.trabajo\evidencias_auditoria7\`

El paquete incluirá como mínimo: `git_status_antes.txt`, `git_status_despues.txt`, `t0_manifest.json`, `t0_manifest.sha256`, inventario físico, inventario clasificado, índice, manifiesto de IDs, manifiesto de usos, `validador.py`, salida completa, hashes, capturas/logs de los flujos, snapshots D1/R2 y scripts auxiliares.

Antes de capturar T0, Edu/Hermes dejarán este contrato cerrado y congelado: no se editará, ampliará ni sustituirá después de T0. Su hash se incluirá en `t0_manifest.sha256` o en un registro de hashes equivalente y Luna comprobará que el archivo auditado coincide con el contrato congelado. No se modificarán informes, contratos, `src/`, `workers/`, `public/`, configuración, datos, D1, R2 ni infraestructura. No habrá commits, pushes, despliegues ni consultas a sistemas vivos.

## 3. Snapshot y universo: fuente única de verdad

Una vez congelado este contrato y antes de crear o inspeccionar el informe, Hermes capturará T0 mediante un comando reproducible que enumere archivos regulares incluidos y otro que capture `git status --short`. T0 será el universo de auditoría y se conservará fuera del repositorio en `t0_manifest.json`, con ruta relativa, tamaño, SHA-256 y regla/universo de cada entrada, además de un SHA-256 del propio manifiesto. El contrato `CONTRATO_REAUDITORIA_HERMES_REPETIDA_7_2026-08-02.md`, creado antes de iniciar la ejecución de Hermes, es preexistente y pertenece a T0 bajo `U3_PATH_DOCS`; esta regla no puede cambiarse después. El informe REPETIDA_7, el paquete de evidencias y sus scripts se crearán después de T0 y serán artefactos de ejecución fuera de `UNIVERSO_T0`, salvo que una ruta ya existiera en T0, en cuyo caso deberá conservarse su estado y hash T0. Ningún archivo podrá entrar o salir de T0 por decisión editorial posterior.

El alcance incluirá todos los archivos regulares bajo `src/**`, `workers/**`, `public/**` y `docs/**`, más todos los archivos regulares de la raíz. Se excluirán únicamente `.git/**`, `node_modules/**`, `dist/**`, `coverage/**`, `.claude/**`, `.github/**` y `tools/**`, con justificación.

La clasificación será determinista y prioritaria:

1. `U3_PATH_DOCS`: cualquier archivo bajo `docs/**`;
2. `U3_EXT_MD_TXT`: cualquier `.md` o `.txt` incluido fuera de `docs/**`;
3. `U1_CODE_EXT`: `.js`, `.jsx` o `.css` bajo `src/`, `workers/` o `public/`;
4. `U2_REST`: todo archivo incluido restante.

El total, los subtotales y las reglas se calcularán desde T0. No se fija aquí una cifra esperada: el informe deberá imprimir una única ecuación `TOTAL_T0 = U1 + U2 + U3`, repetir exactamente la misma ecuación en inventario, tabla, checklist, validador y manifiesto, y demostrar que todas las referencias a conteos coinciden. Si aparecen cifras históricas como 215, 216 o 217, solo podrán aparecer dentro de una sección de antecedentes claramente etiquetada; nunca como total vigente.

El validador comprobará:

- `U1 ∩ U2 = ∅`, `U1 ∩ U3 = ∅`, `U2 ∩ U3 = ∅`;
- `U1 ∪ U2 ∪ U3 = UNIVERSO_T0`;
- una única regla por ruta;
- cero rutas faltantes, sobrantes o duplicadas;
- una fila por ruta de T0 y cero `NO REVISADO`.

## 4. Inventario y matriz: esquema cerrado

Cada fila de inventario tendrá ruta relativa completa, bytes, extensión, regla, universo y clasificación. No se permiten abreviaturas, glob sin expandir, rangos implícitos ni filas agrupadas.

La matriz de cobertura tendrá exactamente el número de columnas que declare su cabecera; para esta auditoría será **9 columnas exactas**. La comprobación contará celdas por fila después de parsear Markdown: cabecera, separador y cada fila operativa deben tener exactamente 9 celdas. El validador fallará si existe cualquier fila con 8, 7, 10, vacía o desalineada.

La matriz de contratos cruzados tendrá exactamente 12 filas F1–F12 y 9 columnas. Cada celda solo podrá ser un `EVIDENCIA-ID` compatible, `NO VERIFICADO (motivo: ...)` o `NA (motivo: ...)`. Quedan prohibidos `—`, `-`, celdas vacías, `N/A` sin motivo, `TODO` e IDs conceptuales.

No se podrá marcar PASS en el checklist por ausencia de guiones si el parser no ha contado realmente las celdas de todas las tablas. El informe publicará el resultado del parser: número de tablas, cabeceras, filas operativas, columnas por fila y lista de celdas inválidas.

## 5. Flujos y etiquetas

Se cubrirán exactamente F1–F12. F7 Time Capsules tendrá evidencia separada para selección UI, request, Worker/esquema, persistencia `capsule_items` y lectura posterior. Una captura no prueba persistencia; un POST no prueba lectura.

F11 Google y cualquier gesto no ejecutado se marcarán `NO VERIFICADO (motivo: ...)`. Las únicas etiquetas operativas permitidas son `VERIFICADO EN CÓDIGO`, `VERIFICADO EN ARTEFACTO`, `HIPÓTESIS`, `NO VERIFICADO` y `FAIL / INVALIDADA`.

*Continúa en la segunda mitad del contrato.*
## 6. Índice y manifiesto de usos: esquema obligatorio

Cada entrada del índice tendrá exactamente estos 12 campos: `id`, `archivo`, `sha256`, `size_bytes`, `fecha_hora`, `flujo`, `hallazgos`, `tipo`, `viewport`, `entorno`, `origen`, `redaccion`. Los IDs serán únicos, con patrón `EV7-<NNN>`, y cada archivo, tamaño y SHA-256 se comprobará.

`manifiesto_usos.json` tendrá una fila por cada uso de evidencia y cada fila tendrá obligatoriamente, con valores no vacíos: `EVIDENCIA_ID`, `ruta_real`, `flujo_indexado`, `flujo_usado`, `tipo`, `hallazgo_indexado`, `hallazgo_usado` y `compatibilidad`.

`hallazgo_usado` no podrá ser `""`, `null`, una lista vacía ni un valor genérico como `OK`; describirá el hallazgo concreto que la celda está probando. `compatibilidad` solo podrá ser `OK` si flujo, tipo y hallazgo usado son compatibles con la entrada del índice. El validador fallará por cualquier clave ausente, alias no autorizado, campo vacío, fila extra, fila faltante o compatibilidad declarada sin demostración.

El validador no podrá generar un campo obligatorio vacío para después declararlo PASS. Luna ejecutará un comprobador independiente de esquema además de `python validador.py`. La salida deberá distinguir integridad criptográfica de semántica.

## 7. Citas y fuerza de las afirmaciones

Toda cita `ruta:línea` existirá, tendrá rango válido y se comprobará con al menos 10 muestras. Cada afirmación de comportamiento vivo estará limitada por la fecha, origen y alcance de su evidencia. Un snapshot no prueba el estado actual. Una captura no prueba persistencia. Un hash no prueba semántica.

## 8. Git y cambios

Hermes guardará `git_status_antes.txt` antes de crear el informe y `git_status_despues.txt` después de terminar. El informe reproducirá ambos archivos línea por línea, identificando cada entrada como preexistente o creada por esta ejecución.

No se permite afirmar “único archivo nuevo”, “working tree limpio” ni equivalentes salvo coincidencia literal con Git. T0 y T1 deberán coincidir con los snapshots entregados y con el estado observado por Luna. Todo residuo, contrato, informe, modificación o archivo no rastreado se listará completo.

## 9. Checklist y veredicto

El informe tendrá exactamente 12 puntos, cada uno con `PASS`, `FAIL` o `NO VERIFICADO` y nota concreta: inventarios; conteos; rutas; índice/hashes; semántica; validador; citas; etiquetas; matrices; F7; Git; descartados/contradicciones.

Un punto no podrá marcarse `PASS` si el parser, el comprobador de esquema o una contradicción interna lo invalida. `0 FALLOS` del validador no prevalece sobre el contrato. Cualquier fallo material produce `FAIL / INVALIDADA` y repetición desde cero.

## 10. Condiciones de invalidación inmediata

Fuerzan `FAIL / INVALIDADA`: conteos contradictorios; universo no derivado de T0; fila de inventario ausente/duplicada; solapamiento; matriz con número incorrecto de columnas; celda vacía, `—`, `-`, `N/A` sin motivo o TODO; manifiesto con `hallazgo_usado` vacío; clave ausente o alias no autorizado; ID inexistente/duplicado/huérfano/cruzado; hash/tamaño incorrecto; cita inválida; validador tolerante; snapshot Git no coincidente; claim más fuerte que la evidencia; o cambio no autorizado.

## 11. Definition of Done

La entrega solo estará completa cuando:

- informe y paquete existan con los nombres exactos;
- T0, `t0_manifest.json`, T1 y la ecuación única del universo sean reproducibles;
- U1/U2/U3 sean disjuntos y exhaustivos;
- haya una fila por ruta;
- todas las tablas declaradas de 9 columnas tengan exactamente 9 celdas por fila;
- existan exactamente 12 flujos F1–F12;
- índice y manifiesto cumplan el esquema cerrado y la semántica no vacía;
- el validador falle ante cualquier incumplimiento y entregue salida completa;
- F7 esté probado extremo a extremo;
- las citas sean válidas;
- Git coincida literalmente;
- el informe no se contradiga internamente;
- históricos, código y sistemas permanezcan intactos.

## 12. Cierre

Este contrato no aprueba REPETIDA_6 ni ninguna entrega anterior. Hermes no comenzará como aprobada sin OK explícito de Edu. La única escritura autorizada será el informe REPETIDA_7 y los artefactos fuera del repositorio expresamente permitidos.

*Fin del contrato.*
