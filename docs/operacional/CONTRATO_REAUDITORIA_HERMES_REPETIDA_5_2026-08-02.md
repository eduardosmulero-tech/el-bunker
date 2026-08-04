# CONTRATO — Reauditoría total de el-bunker por Hermes
## REPETIDA_5 · sexta ejecución

> **Estado:** CONTRATO DE EJECUCIÓN — pendiente de OK explícito de Edu  
> **Fecha:** 2-ago-2026 · **Mandante:** Edu · **Ejecutor:** Hermes · **Revisor:** Luna / Edu  
> **Regla:** tolerancia cero; un solo fallo material invalida toda la auditoría.

## 1. Antecedentes y decisión

Quedan rechazadas: `auditoria_total_2026-08-02.md`, `auditoria_total_2026-08-02_REPETIDA_HERMES.md`, `auditoria_total_2026-08-02_REPETIDA_2_HERMES.md` y `auditoria_total_2026-08-02_REPETIDA_3_HERMES.md`. REPETIDA_4 queda sin aprobación hasta su revisión formal.

La revisión de REPETIDA_3 detectó fallos materiales que esta ejecución debe impedir expresamente:

1. Usó `EV3-DOM`, `EV3-d1` y `EV3-r2`, IDs inexistentes en el índice.
2. Asignó IDs a flujos distintos: evidencias de borrar entry/crear era se usaron para playlists, cápsulas, uploads, Range y eventos.
3. Afirmó bidireccionalidad aunque 54 entradas no estaban referenciadas literalmente y tres IDs usados no existían.
4. Mezcló código, aplicación y documentación, omitiendo archivos reales de `src/`, `workers/` y `public/`.
5. Declaró completa una matriz con celdas `—`, prohibidas por el contrato.
6. Confundió hashes válidos con compatibilidad semántica: un hash solo prueba integridad del archivo, no el flujo que ese archivo demuestra.

Hermes debe auditar desde cero. No se admite adenda, parche, fe de erratas, lista complementaria, reasignación retroactiva de IDs ni edición de informes anteriores.

## 2. Aprobación e invalidación

Solo podrá presentarse como `PASS CANDIDATE` si cumple íntegramente este contrato. `PASS CANDIDATE` no es aprobación: Luna verifica y Edu decide.

Cualquier error factual, inventario incompleto, conteo incompatible, comando inválido, ruta inexistente, cita incorrecta, ID inexistente, duplicado, huérfano, cruzado, semánticamente incompatible, evidencia ausente o clasificación más fuerte que la evidencia produce `FAIL / INVALIDADA` y repetición desde cero. No existe estado parcialmente correcto.

## 3. Entregables y protección

Hermes entregará únicamente:

- `docs/operacional/auditoria_total_2026-08-02_REPETIDA_5_HERMES.md`
- `C:\proyectos\.trabajo\evidencias_auditoria5\`, fuera del repositorio.

El paquete externo incluirá `indice_evidencias.json`, el validador utilizado, su salida completa y el manifiesto de correspondencias. No se pueden modificar código, configuración, datos, infraestructura, D1, R2 ni ningún contrato o informe histórico REPETIDA. No se implementan fixes ni se redactan pliegos.

## 4. Alcance obligatorio

Separar y revisar todos los archivos reales de:

- **U1 Código:** únicamente los archivos con extensión `.js`, `.jsx` o `.css` bajo `src/`, `workers/` y `public/` (incluidos tests y `public/sw.js`).
- **U2 Aplicación/configuración/assets:** todos los archivos no documentales restantes del repositorio dentro del alcance que no pertenezcan a U1, incluidos todos los assets no código de `src/` y `public/`, `workers/schema.sql`, `index.html`, `package.json`, `vite.config.js`, `wrangler.toml`, `eslint.config.js`, `postcss.config.js`, `tailwind.config.js`, `vite.config.js` y cualquier otro archivo raíz de configuración o soporte que exista en la ejecución. Por tanto, `workers/schema.sql` pertenece solo a U2; no se duplica en U1. U2 no depende de una lista cerrada: si aparece un archivo no documental nuevo, debe incluirse.
- **U3 Documentación:** archivos cuyo propósito sea documentación: `docs/**`, `README.md` y manuales/documentos `.md` situados fuera de `docs/` (incluido `src/MANUAL_USUARIO_EL_BUNKER.md`). U3 no incluye ningún archivo ya clasificado en U1 o U2.

Regla de clasificación: cada ruta se clasifica una sola vez por esta prioridad U3 documental → U1 por extensión → U2 restante dentro del alcance. El informe debe demostrar `U1 ∩ U2 = U1 ∩ U3 = U2 ∩ U3 = ∅`, publicar el número de rutas de cada conjunto y probar que `U1 ∪ U2 ∪ U3` coincide exactamente con el universo de alcance; cualquier solapamiento, omisión o duplicado invalida.

Cubrir login/logout/boot, tres tabs y sub-vistas, CRUD, formularios, validación, carga/error/vacío/offline/remount, modales, toasts, accesibilidad, idioma, fechas, responsive móvil/tablet/desktop/landscape, contexts, duplicación, monolitos, dead code, stubs, endpoints, auth, mutaciones, eventos, límites, FK, índices, soft delete, legacy, POST/PUT, D1/R2, firmas, MIME, huérfanos, Range/seek, instalación, offline, Background Sync, Push y contradicciones documentales.

Time Capsules es obligatorio extremo a extremo: `entry_ids`, `playlist_ids`, `content_snapshot`, `time_capsules`, `capsule_items`, creación, lectura, desbloqueo y persistencia. Toda ruta citada debe existir y toda cita debe respaldar la afirmación concreta y su EVIDENCIA-ID.

## 5. Inventario exhaustivo y cobertura honesta

El informe separará U1, U2 y U3. Para cada archivo real habrá una fila con ruta relativa completa, tamaño, extensión, fecha/hora de inspección y exactamente una clasificación: `LECTURA COMPLETA`, `BÚSQUEDA DIRIGIDA`, `MUESTREO` o `NO REVISADO`.

No se permiten abreviaturas, glob patterns sin expandir, rangos implícitos, agrupaciones como `core/ui/{...}`, ni mezclar universos en una fila. El inventario y el manifiesto incluirán una columna `universo` con exactamente `U1`, `U2` o `U3`; cada ruta aparecerá una sola vez. La suma de filas debe coincidir con los conteos reproducibles de cada universo, directorio y extensión. El validador debe detectar rutas duplicadas entre universos y rutas del alcance ausentes del inventario. `NO REVISADO` dentro del alcance fuerza `FAIL / INVALIDADA`; no puede ocultarse bajo `100%`.

## 6. Conteos reproducibles

Conservar fecha/hora, sistema, shell, cwd, comando exacto y salida exacta. Como mínimo:

    find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) -print0 | xargs -0 wc -l
    find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) | wc -l

Recalcular también archivos totales por área, extensión, LOC, breakpoints, `prompt`, `confirm`, `{null}`, `exifr`, `registration.sync`, `pushManager`, `BUNKER_SYNC_READY`, archivos grandes, duplicación, rutas, flujos y paquete de evidencias. El informe publicará la lista de exclusión y el validador comparará las rutas reales incluidas con `U1 ∪ U2 ∪ U3`; cualquier archivo incluido omitido, excluido sin declarar o clasificado dos veces invalida. `79 archivos de código` no sustituye el inventario separado U1/U2/U3.

## 7. Matrices obligatorias

La matriz de cobertura tendrá Frontend, Worker/API, D1/schema, R2/media, SW/PWA y Docs; columnas de archivos, tratamiento, flujos, hallazgos, sin hallazgo, no verificado y método.

La matriz cruzada tendrá exactamente 12 filas: crear entry; editar entry; borrar entry; crear era; añadir track con MP3; crear playlist; crear cápsula con contenido; subir foto/vídeo/audio; reproducir/seek MP3; emitir/leer eventos; login Google; login access key.

Cada fila tendrá UI/cliente, Network/DevTools, consola, endpoint, Worker, D1/R2, estático y resultado. Cada celda contendrá exactamente un `EVIDENCIA-ID` existente y compatible, `NO VERIFICADO` con motivo concreto o `NA` con justificación en la misma celda. Nunca `—`, celda vacía, `N/A` sin justificación, ID conceptual no indexado ni evidencia de otro flujo.

## 8. Evidencia mínima

`archivo:línea` es soporte técnico, nunca prueba única de comportamiento operativo. Cada flujo visible exige capturas antes/durante/después y tras recarga/remount si se afirma persistencia, con viewport ancho×alto, fecha/hora, entorno y nombre. Cada API exige captura/HAR con método, ruta, status, payload redactado, respuesta y secuencia temporal. Cada runtime exige consola antes/después, mensaje, origen, stack y reproducibilidad.

Persistencia, media, upload y Range exigen evidencia autorizada de antes/después, recarga/remount, POST separado de PUT, fila D1, objeto R2 y headers `Range`, `206` y `Content-Range` cuando aplique. Si falta evidencia aplicable, la única clasificación permitida es `NO VERIFICADO`.

## 9. Índice y correspondencia semántica obligatoria

Cada entrada de `indice_evidencias.json` incluirá exactamente estos campos: `id`, `archivo`, `sha256`, `size_bytes`, `fecha_hora`, `flujo`, `hallazgos`, `tipo`, `viewport`, `entorno`, `origen`, `redaccion`; un `null` requiere justificación.

Requisitos vinculantes:

1. Cada ID es único y sigue un esquema documentado.
2. Cada `EVIDENCIA-ID` del informe coincide exactamente con un ID del índice.
3. Cada entrada aparece en el informe o en una lista de auxiliares con ID, archivo y finalidad.
4. La relación informe→índice e índice→informe es bidireccional.
5. `archivo`, `flujo`, `hallazgos`, `tipo`, `origen` y `redaccion` son compatibles con cada uso concreto.
6. Una evidencia F3 no prueba F7; crear era no prueba upload; consola no prueba headers HTTP; snapshot D1 no prueba interacción UI.
7. IDs conceptuales como `EV5-DOM`, `EV5-d1` o `EV5-r2` están prohibidos salvo entradas completas del índice.
8. El validador debe comprobar existencia, tamaño, SHA-256, IDs, archivo, flujo, tipo y hallazgos.
9. El paquete entregará script/comando exacto, salida completa y manifiesto de correspondencias.
10. El manifiesto tendrá una fila por uso de evidencia en cada flujo y hallazgo: `EVIDENCIA-ID`, ruta real, flujo indexado, flujo usado, tipo, hallazgo indexado, hallazgo usado y resultado de compatibilid
ad.
11. Luna debe reproducirlo sin interpretar intenciones ni corregir IDs manualmente.
12. ID inexistente, duplicado, huérfano, cruzado, incompatible, ruta ausente, hash incorrecto, metadato omitido, manifiesto incompleto o salida ausente fuerza `FAIL / INVALIDADA`.

La validez criptográfica y la validez semántica se verifican por separado.

## 10. Etiquetas y hallazgos

Solo se permiten `VERIFICADO EN CÓDIGO`, `VERIFICADO EN ARTEFACTO`, `HIPÓTESIS`, `NO VERIFICADO` y `FAIL / INVALIDADA`. No usar `CORRECTO`, `ROTO`, `VERIFICADO` o `CONFIRMADO` como hecho operativo sin evidencia aplicable.

Cada hallazgo incluirá ID, severidad, impacto, clasificación, archivo/líneas, observado, esperado, motivo, EVIDENCIA-ID compatible, certeza, dependencia y decisión/pliego. Descartados y contradicciones incluirán comprobación, evidencia, resultado y citas.

## 11. Estado y restricciones

No modificar código, configuración, documentación, datos, infraestructura, D1 ni R2. Entregar snapshot reproducible de `git status --short`, archivos creados, protegidos intactos, comandos de generación y datos de prueba autorizados. Sin acceso vivo, D1/R2 será `NO VERIFICADO`; un JSON local solo prueba su contenido local.

Permitido: lectura, búsquedas, conteos, análisis estático, comprobaciones locales, build/lint/tests locales sin efectos vivos, validación criptográfica local y capturas autorizadas. Prohibido sin autorización: wrangler remoto, requests a producción, lectura/escritura D1/R2 vivos, JWT, claves, secretos, despliegues, migraciones, borrados, subidas, cambios y arreglos.

## 12. Definition of Done e invalidación

Solo `PASS CANDIDATE` si cubre dominios y exactamente 12 flujos; inventaría U1/U2/U3 como conjuntos mutuamente excluyentes y exhaustivos; reconcilia filas, conteos, extensiones, directorios y LOC; usa comandos válidos; verifica rutas y citas; presenta matriz completa sin guiones/celdas vacías; cumple índice y hashes; usa IDs existentes, únicos y compatibles; entrega validador, salida y manifiesto fila por fila; demuestra `U1 ∩ U2 ∩ U3 = ∅` y cobertura exacta del alcance; clasifica como `NO VERIFICADO` lo no demostrado; revisa Time Capsules extremo a extremo; valida descartados, contradicciones y priorización; y no modifica históricos, código, datos ni infraestructura.

Una sola desviación —incluido ID cruzado o conceptual inexistente, celda `—`, referencia huérfana, omisión de inventario o afirmación más fuerte que la evidencia— produce `FAIL / INVALIDADA` y repetición desde cero.

## 13. Secuencia y cierre

1. Edu confirma este contrato.
2. Hermes audita desde cero, sin reutilizar como verificación nueva asignaciones defectuosas de REPETIDA_3/4.
3. Entrega `docs/operacional/auditoria_total_2026-08-02_REPETIDA_5_HERMES.md` y `C:\proyectos\.trabajo\evidencias_auditoria5\`.
4. Luna verifica inventarios, comandos, rutas, índice, hashes, semántica de IDs, citas, etiquetas y validador.
5. Luna emite veredicto; Edu decide.
6. Un fallo produce `FAIL / INVALIDADA` y repetición desde cero.
7. No se redactan pliegos ni se implementan fixes antes de aprobar.

## 14. Fuera de alcance

Arreglos, refactors, cambios de UI, iconografía, ADRs, migraciones, despliegues, subidas, borrados, limpieza no autorizada y conversión del informe en pliegos.

## 15. Enmienda vinculante de alcance y partición

Esta sección prevalece sobre cualquier redacción anterior de §4–§6. El universo cerrado es la unión de todos los archivos regulares bajo `src/**`, `workers/**`, `public/**` y `docs/**`, más todos los archivos regulares de la raíz del repositorio. Se excluyen únicamente `.git/**`, `node_modules/**`, `dist/**`, `coverage/**`, `.claude/**`, `.github/**` y `tools/**`; el informe debe listar estas exclusiones y justificar cualquier cita excepcional.

La partición es disjunta y exhaustiva: U3 contiene los archivos documentales; U1 contiene los `.js`, `.jsx` y `.css` no documentales bajo `src/`, `workers/` y `public/`; U2 contiene todos los demás archivos incluidos no documentales, incluidos assets, `schema.sql`, HTML, JSON, manifiestos, tests no pertenecientes a U1 y toda configuración raíz (`eslint.config.js`, `postcss.config.js`, `tailwind.config.js`, `vite.config.js`, `wrangler.toml` y equivalentes). Cada ruta debe aparecer exactamente una vez. El validador debe demostrar `U1 ∩ U2 = U1 ∩ U3 = U2 ∩ U3 = ∅` y `U1 ∪ U2 ∪ U3 = universo cerrado`; cualquier omisión, solapamiento o archivo no clasificado produce `FAIL / INVALIDADA`.

## 16. Enmienda final de clasificación objetiva

Esta sección prevalece sobre cualquier uso subjetivo de “documental” en el contrato. Dentro del universo cerrado, U3 será exactamente: (a) todos los archivos bajo `docs/**`; y (b) todos los archivos con extensión `.md` o `.txt` bajo cualquier ruta incluida, incluidos `README.md`, `AGENTS.md`, `CLAUDE.md`, `PROMPT_MAESTRO.md` y `src/MANUAL_USUARIO_EL_BUNKER.md`. Todo archivo incluido que no pertenezca a U3 y tenga extensión `.js`, `.jsx` o `.css` bajo `src/`, `workers/` o `public/` pertenece a U1. Todo archivo incluido restante pertenece a U2.

El manifiesto de inventario debe incluir para cada ruta la regla objetiva que la asignó (`U3_PATH_DOCS`, `U3_EXT_MD_TXT`, `U1_CODE_EXT` o `U2_REST`). El validador debe comprobar que no existen rutas sin regla, con más de una regla o con una clasificación distinta de esta prioridad. Cualquier discrepancia produce `FAIL / INVALIDADA`.

*Fin del contrato.*
