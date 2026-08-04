# CONTRATO — Reauditoría total de el-bunker por Hermes
## REPETIDA_4 · quinta ejecución

> Estado: CONTRATO DE EJECUCIÓN — pendiente de OK explícito de Edu  
> Fecha: 2-ago-2026 · Mandante: Edu · Ejecutor: Hermes · Revisor: Luna / Edu  
> Regla: tolerancia cero; un solo fallo material invalida toda la auditoría.

## 1. Antecedentes y decisión

Quedan rechazadas: `auditoria_total_2026-08-02.md`, `auditoria_total_2026-08-02_REPETIDA_HERMES.md`, `auditoria_total_2026-08-02_REPETIDA_2_HERMES.md` y `auditoria_total_2026-08-02_REPETIDA_3_HERMES.md`.

REPETIDA_3 corrigió parte de los conteos y validó hashes, pero falló materialmente porque:

1. usó `EV3-DOM`, `EV3-d1` y `EV3-r2`, identificadores inexistentes en el índice;
2. asignó `EV3-023/024` a playlists/cápsulas aunque el índice los identifica como borrar entry;
3. asignó `EV3-029/030/031` a Range HTTP aunque el índice los identifica como consola/capturas de crear era;
4. afirmó relación bidireccional ID↔archivo pese a referencias con flujo, tipo y archivo incompatibles;
5. mezcló archivos de código con el inventario total y omitió archivos reales de `src/`, `workers/` y `public/`;
6. usó `—` en celdas donde el contrato exigía `EVIDENCIA-ID`, `NO VERIFICADO` o `NA` justificado.

Hermes debe repetir desde cero. No se admite adenda, parche, fe de erratas, lista complementaria ni edición retroactiva.

## 2. Aprobación e invalidación

Solo podrá presentarse como `PASS CANDIDATE` si cumple íntegramente este contrato. Esa etiqueta no es aprobación: Luna y Edu deben revisar.

Un error factual, inventario incompleto, ruta inexistente, conteo no reproducible, cita incorrecta, ID inexistente, ID duplicado, ID cruzado con otro flujo, evidencia ausente o clasificación más fuerte que la evidencia disponible produce `FAIL / INVALIDADA` y repetición desde cero. No existe estado parcialmente correcto.

## 3. Entregables y protección

Hermes creará únicamente: `docs/operacional/auditoria_total_2026-08-02_REPETIDA_4_HERMES.md`.

Las evidencias nuevas se entregarán fuera del repositorio en `C:\proyectos\.trabajo\evidencias_auditoria4\`, incluido `indice_evidencias.json`.

No se pueden modificar código, configuración, datos, infraestructura ni ningún documento histórico, especialmente `CONTRATO_REAUDITORIA_HERMES_REPETIDA_3_2026-08-02.md` y `auditoria_total_2026-08-02_REPETIDA_3_HERMES.md`.

## 4. Alcance obligatorio

Revisar todos los archivos de `src/`, `workers/`, `public/`, configuración raíz, tests, schema, R2/media, SW/PWA y documentación Nucleo/Arquitectura/operacional, manual y README.

Cubrir login/logout/boot, las tres tabs y sub-vistas, CRUD, formularios, validación, carga/error/vacío/offline/remount, modales, toasts, accesibilidad, idioma, fechas, responsive móvil/tablet/desktop/landscape, contexts, duplicación, monolitos, dead code, stubs, endpoints, auth, mutaciones, eventos, límites, FK, índices, soft delete, legacy, POST/PUT, D1/R2, firmas, MIME, huérfanos, Range/seek, instalación, offline, Background Sync, Push y contradicciones documentales.

Time Capsules es obligatorio: comprobar `entry_ids`, `playlist_ids`, `content_snapshot`, `time_capsules`, `capsule_items`, creación, lectura, desbloqueo y persistencia.

Toda ruta citada debe existir y toda cita debe respaldar la afirmación concreta.

## 5. Inventario y cobertura honesta

Distinguir tres universos: (1) código `.js/.jsx/.css`; (2) aplicación, assets, schema, manifest, HTML, configuración y tests; (3) documentación.

Incluir una fila por archivo real, con ruta relativa completa, tamaño, extensión y exactamente una clasificación: `LECTURA COMPLETA`, `BÚSQUEDA DIRIGIDA`, `MUESTREO` o `NO REVISADO`.

Cualquier `NO REVISADO` dentro del alcance obligatorio fuerza `FAIL / INVALIDADA`. No se permiten abreviaturas como `core/ui/{...}`, rangos implícitos ni listas que mezclen archivos de código con no-código. Los totales de filas deben coincidir con los conteos de cada universo y directorio.

## 6. Conteos reproducibles

No se aceptan comandos truncados, ambiguos o escritos de memoria. Publicar salida exacta, fecha/hora y entorno. Para código:

    find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) -print0 | xargs -0 wc -l
    find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) | wc -l

Recalcular también archivos por área/extensión, todos los archivos de cada directorio, LOC, breakpoints, `prompt`, `confirm`, `{null}`, `exifr`, `registration.sync`, `pushManager`, `BUNKER_SYNC_READY`, archivos grandes, duplicación, rutas, flujos y evidencias.

## 7. Matrices

Matriz de cobertura: Frontend, Worker/API, D1/schema, R2/media, SW/PWA y Docs; columnas archivos, tratamiento, flujos, hallazgos, sin hallazgo, no verificado y método.

Matriz cruzada con exactamente 12 filas: crear entry; editar entry; borrar entry; crear era; añadir track con MP3; crear playlist; crear cápsula con contenido; subir foto/vídeo/audio; reproducir/seek MP3; emitir/leer eventos; login Google; login access key.

Cada fila incluye UI/cliente, Network/DevTools, consola, endpoint, Worker, D1/R2, estático y resultado. Cada celda contiene un `EVIDENCIA-ID` existente, `NO VERIFICADO` o `NA — justificación explícita`. Nunca `—` ni celda vacía.

## 8. Evidencia

`archivo:línea` es soporte técnico, nunca prueba única. Cada flujo visible exige capturas antes/durante/después y tras recarga/remount si se afirma persistencia; viewport, ancho × alto, fecha/hora, entorno y nombre. Cada API exige captura/HAR con método, ruta, status, payload redactado, respuesta y secuencia temporal. Runtime exige consola antes/después. Persistencia/media/upload/Range exige evidencia antes/después, recarga/remount, POST separado de PUT, fila D1, objeto R2 y `Range`/`206`/`Content-Range`.

Si falta evidencia aplicable, el resultado obligatorio es `NO VERIFICADO`; no se puede afirmar `CORRECTO`, `ROTO` o `VERIFICADO` como hecho operativo.

## 9. Índice: correspondencia sintáctica y semántica obligatoria

Cada entrada de `indice_evidencias.json` debe contener, aunque alguno sea `null` con justificación: `id`, `archivo`, `sha256`, `size_bytes`, `fecha_hora`, `flujo`, `hallazgos`, `tipo`, `viewport`, `entorno`, `origen` y `redaccion`.

Requisitos vinculantes:

1. Cada `id` es único.
2. Cada `EVIDENCIA-ID` usado en el informe existe exactamente una vez en el índice.
3. Cada entrada del índice se referencia en el informe o se lista como auxiliar con su ID exacto.
4. La correspondencia informe→índice e índice→informe es bidireccional.
5. `archivo`, `flujo`, `hallazgos` y `tipo` son semánticamente compatibles con el uso concreto del ID.
6. Una consola no prueba un header HTTP; una captura de crear era no prueba una subida; una evidencia de F3 no prueba F7.
7. Los IDs conceptuales no numéricos están prohibidos salvo que figuren en el índice con todos sus campos.
8. Debe ejecutarse una validación automática que compare existencia, tamaño, SHA-256, IDs, archivo, flujo, tipo y hallazgos.
9. El paquete debe entregar el script o comando exacto del validador, su salida completa y un manifiesto o tabla reproducible que muestre cada relación `EVIDENCIA-ID` ↔ archivo ↔ flujo ↔ hallazgo usada en la matriz y los hallazgos.
10. Cualquier ID inexistente, duplicado, huérfano, cruzado, semánticamente incompatible, ruta ausente, hash incorrecto, salida de validador ausente o metadato omitido invalida.

## 10. Etiquetas y hallazgos

Solo se permiten `VERIFICADO EN CÓDIGO`, `VERIFICADO EN ARTEFACTO`, `HIPÓTESIS`, `NO VERIFICADO` y `FAIL / INVALIDADA`.

Cada hallazgo debe incluir ID, severidad, impacto, clasificación, archivo/líneas exactas, observado, esperado, motivo, `EVIDENCIA-ID`, certeza, dependencia y decisión/pliego. Los descartados deben incluir sospecha, comprobación, evidencia, resultado y motivo. Las contradicciones documentales deben identificarse y citarse.

## 11. Estado y restricciones

No modificar código, configuración, documentación, datos, infraestructura, D1 ni R2. Entregar snapshot reproducible de `git status --short`, archivos creados, archivos protegidos intactos, comandos de generación y datos de prueba autorizados.

Sin acceso vivo no se puede afirmar que D1/R2 estén limpios: el resultado será `NO VERIFICADO`. Un JSON local solo prueba su contenido.

Permitido: lectura, búsquedas, conteos, análisis estático, comprobaciones locales, build/lint/tests sin efectos vivos, capturas con autorización expresa y validación criptográfica local.

Prohibido sin autorización: `wrangler` remoto, requests a producción, lectura/escritura D1/R2 vivos, JWT/claves/secretos, despliegues, migraciones, borrados, subidas, cambios y arreglos durante la auditoría.

## 12. Definition of Done e invalidación

Solo `PASS CANDIDATE` si cubre todos los dominios y 12 flujos; inventaría cada universo sin omisiones; usa comandos válidos; verifica rutas; tiene matriz completa sin guiones ambiguos; cumple el esquema del índice; valida hashes y tamaños; entrega el validador y su salida; demuestra con un manifiesto reproducible la correspondencia semántica ID↔archivo↔flujo↔hallazgo; aporta evidencia real o `NO VERIFICADO`; revisa Time Capsules extremo a extremo; valida citas, descartados, contradicciones y priorización; y no modifica históricos, código, datos ni infraestructura.

Una sola desviación —inventario incompleto, conteo incompatible, comando inválido, ruta inexistente, celda vacía, `NA` sin justificación, ID inexistente/duplicado/cruzado, evidencia semánticamente incompatible, metadato omitido o cita incorrecta— produce `FAIL / INVALIDADA` y repetición desde cero.

## 13. Secuencia y cierre

1. Edu confirma este contrato.
2. Hermes audita desde cero.
3. Entrega `auditoria_total_2026-08-02_REPETIDA_4_HERMES.md` y `evidencias_auditoria4`.
4. Luna verifica inventarios, comandos, rutas, índice, hashes, semántica de IDs, citas y etiquetas.
5. Luna revisa; Edu decide aprobación.
6. Si existe un fallo, se repite desde cero.
7. No se redactan pliegos ni se implementan fixes antes de aprobar.

## 14. Fuera de alcance

Arreglos, refactors, cambios de UI, iconografía, ADRs, migraciones, despliegues, subidas, borrados, limpieza no autorizada y conversión del informe en pliegos.

*Fin del contrato.*
