# CONTRATO — Reauditoría total de el-bunker por Hermes
## REPETIDA_3 · cuarta ejecución

> Estado: CONTRATO DE EJECUCIÓN — pendiente de OK explícito de Edu  
> Fecha: 2-ago-2026 · Mandante: Edu · Ejecutor: Hermes · Revisor: Luna / Edu  
> Regla: tolerancia cero; un solo fallo material invalida toda la auditoría.

## 1. Antecedentes

Quedan rechazadas: `auditoria_total_2026-08-02.md` (antecedente no confiable), `auditoria_total_2026-08-02_REPETIDA_HERMES.md` (`FAIL / INVALIDADA`) y `auditoria_total_2026-08-02_REPETIDA_2_HERMES.md` (`FAIL / INVALIDADA`).

La tercera ejecución aportó material útil, pero falló porque: declaró 81 archivos cuando el conteo reproducible de `.js/.jsx/.css` devuelve 79; documentó `find ... -name '*.js|*.jsx|*.css'`, comando inválido que devuelve 0; citó las rutas inexistentes `d1/09_capsule_contenido` y `d1/10_mp3_head.txt`; su índice de 82 entradas carecía de flujo/hallazgo, viewport, entorno, origen y redacción; sobredeclaró `100%` mezclando lectura completa, búsqueda y muestreo; y clasificó resultados operativos fuertes con paquetes incompletos en vez de `NO VERIFICADO`.

Hermes debe repetir desde cero. No se admite adenda, parche, fe de erratas, lista complementaria ni edición retroactiva.

## 2. Aprobación e invalidación

Solo podrá presentarse como `PASS CANDIDATE` si cumple íntegramente este contrato. Esa etiqueta no es aprobación: Luna y Edu deben revisar.

Un error factual, ruta inexistente, conteo no reproducible, cita incorrecta, evidencia ausente o clasificación más fuerte que la evidencia disponible produce `FAIL / INVALIDADA` y repetición desde cero. No existe estado parcialmente correcto.

## 3. Entregables y protección

Hermes creará únicamente: `docs/operacional/auditoria_total_2026-08-02_REPETIDA_3_HERMES.md`.

Las evidencias nuevas se entregarán fuera del repositorio en `C:\proyectos\.trabajo\evidencias_auditoria3\`, incluido `indice_evidencias.json`.

No se pueden modificar código, configuración, datos, infraestructura ni estos históricos: `CONTRATO_REAUDITORIA_HERMES.md`, este contrato, los informes `REPETIDA_HERMES.md` y `REPETIDA_2_HERMES.md`, ni `VEREDICTO_REAUDITORIA_TOTAL_HERMES_2026-08-02.md`.

## 4. Alcance

Revisar todos los archivos de `src/` (incluidos layout, core, vault, musiclab, capsules, smoke, shims, tests, setup, documentación y assets), todos los workers/rutas/utilidades/tests, `schema.sql`, R2/media, SW/PWA, `index.html`, `package.json`, `vite.config.js`, `wrangler.toml`, documentación Nucleo/Arquitectura/operacional, manual y README.

Cubrir login/logout/boot, tres tabs y sub-vistas, CRUD, formularios, validación, carga/error/vacío/offline/remount, modales, toasts, accesibilidad, idioma, fechas, responsive móvil/tablet/desktop/landscape, contexts, duplicación, monolitos, dead code, stubs, endpoints, auth, validación, mutaciones, eventos, límites, FK, índices, soft delete, legacy, POST/PUT/filas D1/objetos R2, firma, MIME, huérfanos, Range/seek, instalación/offline/Background Sync/Push y contradicciones documentales. Toda ruta citada debe existir.

Time Capsules es obligatorio: comprobar `entry_ids`, `playlist_ids`, `content_snapshot`, `time_capsules`, `capsule_items`, creación, lectura, desbloqueo y persistencia.

## 5. Cobertura honesta

Queda prohibido escribir simplemente `100%`. El informe tendrá una fila por archivo y clasificará cada uno exactamente como `LECTURA COMPLETA`, `BÚSQUEDA DIRIGIDA`, `MUESTREO` o `NO REVISADO`. La presencia de cualquier archivo `NO REVISADO` dentro del alcance obligatorio fuerza el estado `FAIL / INVALIDADA`; no puede ocultarse ni presentarse como cobertura completa.

Debe publicar universo exacto, listado completo sin abreviaturas, conteos por directorio/extensión/categoría, comando y salida exactos, fecha/hora, entorno y explicación de diferencias. La suma de filas debe coincidir con los conteos; cualquier diferencia invalida.

## 6. Conteos reproducibles

No se aceptan comandos ambiguos o escritos de memoria. Para código debe usarse una expresión válida, por ejemplo:

    find src workers public -type f \( -name '*.js' -o -name '*.jsx' -o -name '*.css' \) -print0 | xargs -0 wc -l

Conservar salida verificable. Recalcular archivos por área/extensión, LOC, breakpoints, `prompt`, `confirm`, `{null}`, `exifr`, `registration.sync`, `pushManager`, `BUNKER_SYNC_READY`, archivos grandes, duplicación, rutas citadas, flujos y paquetes de evidencia.

## 7. Matrices

Matriz de cobertura: filas Frontend, Worker/API, D1/schema, R2/media, SW/PWA y Docs; columnas archivos, flujos, hallazgos, sin hallazgo, no verificado y método.

Matriz cruzada con exactamente 12 filas: crear entry; editar entry; borrar entry; crear era; añadir track con MP3; crear playlist; crear cápsula con contenido; subir foto/vídeo/audio; reproducir/seek MP3; emitir/leer eventos; login Google; login access key.

Cada fila debe incluir UI/cliente, Network/DevTools, consola, endpoint, Worker, D1/R2, estático, resultado y `EVIDENCIA-ID` o `NO VERIFICADO` en cada columna. Ninguna celda vacía.

## 8. Evidencia obligatoria

`archivo:línea` es soporte técnico, nunca prueba única del comportamiento.

Cada flujo visible exige capturas antes, durante, después y tras recarga/remount si se afirma persistencia; viewport, ancho × alto, fecha/hora, entorno y nombre. Cada API exige captura o HAR con método, ruta, status, payload redactado, respuesta y secuencia temporal. Cada runtime exige consola antes/después, mensaje, origen, stack y reproducibilidad. Persistencia/media/upload/Range exige evidencia autorizada antes/después, recarga/remount, POST separado de PUT, fila D1, objeto R2 y headers `Range`/`206`/`Content-Range` cuando aplique.

Una UI que diga “guardado” no demuestra persistencia. Una fila D1 sin prueba de UI no demuestra el flujo. Si falta evidencia aplicable, el resultado obligatorio es `NO VERIFICADO`.

## 9. Índice de evidencias

Cada entrada de `C:\proyectos\.trabajo\evidencias_auditoria3\indice_evidencias.json` debe incluir todos estos campos; si alguno no aplica, será `null` con justificación:

    id, archivo, sha256, size_bytes, fecha_hora, flujo, hallazgos,
    tipo, viewport, entorno, origen, redaccion

Tipos: `ui`, `network`, `console`, `d1`, `r2`, `static` u `other`. Origen: captura nueva autorizada, snapshot, fixture, HAR o exportación.

Antes de `PASS CANDIDATE`, comprobar número de entradas, existencia de cada archivo, tamaño, SHA-256, correspondencia de cada `EVIDENCIA-ID`, entrega real y evidencia suficiente o `NO VERIFICADO` para cada flujo/hallazgo. Cada `id` debe ser único; cada `EVIDENCIA-ID` usado en el informe debe aparecer exactamente una vez en el índice; cada entrada del índice debe estar referenciada por el informe o declararse como artefacto auxiliar; y la relación ID ↔ archivo debe ser bidireccional y verificable. Ruta inexistente, hash incorrecto, ID duplicado o huérfano, archivo ausente o metadato omitido invalida.

## 10. Etiquetas y hallazgos

Solo se permiten `VERIFICADO EN CÓDIGO`, `VERIFICADO EN ARTEFACTO`, `HIPÓTESIS`, `NO VERIFICADO` y `FAIL / INVALIDADA`. No usar `CORRECTO`, `ROTO`, `VERIFICADO` o `CONFIRMADO` como hecho operativo si falta evidencia.

Cada hallazgo incluirá ID, severidad, impacto, clasificación, archivo/líneas exactas, observado, esperado, motivo, `EVIDENCIA-ID`, certeza, dependencia y decisión/pliego. Los descartados incluirán sospecha, comprobación, evidencia, resultado y motivo. Detectar contradicciones documentales y validar toda cita.

## 11. Estado y restricciones

No modificar código, configuración, documentación, datos, infraestructura, D1 ni R2. Entregar snapshot reproducible de `git status --short`, archivos creados, archivos protegidos intactos, comandos de generación y datos de prueba autorizados. Sin acceso vivo no se puede afirmar que D1/R2 estén limpios: será `NO VERIFICADO`; un JSON local solo prueba su contenido.

Permitido: lectura, búsquedas, conteos, análisis estático, comprobaciones locales, build/lint/tests locales sin efectos vivos, capturas con autorización expresa y validación criptográfica local.

Prohibido sin autorización: `wrangler` remoto, requests a producción, lectura/escritura D1/R2 vivos, JWT/claves/secretos, despliegues, migraciones, borrados, subidas, cambios y arreglos durante la auditoría.

## 12. Definition of Done

Solo `PASS CANDIDATE` si cubre dominios y 12 flujos; tiene inventario exhaustivo; define 100% cuantitativamente; usa comandos válidos; verifica rutas; cumple índice y hashes; aporta evidencia real o `NO VERIFICADO`; demuestra capturas ant
es antes/durante/después; diferencia Network, consola, D1/R2 y estático; revisa Time Capsules extremo a extremo; valida citas, descartados, contradicciones y priorización; y no modifica históricos, código, datos ni infraestructura.

Una sola desviación —conteo incompatible, comando inválido, ruta inexistente, metadato omitido, ID huérfano, evidencia incompleta clasificada como hecho o cita incorrecta— produce `FAIL / INVALIDADA` y repetición desde cero.

## 13. Secuencia y cierre

1. Edu confirma este contrato.
2. Hermes audita desde cero.
3. Entrega `auditoria_total_2026-08-02_REPETIDA_3_HERMES.md` y `evidencias_auditoria3`.
4. Luna verifica inventario, comandos, rutas, índice, hashes, citas y etiquetas.
5. Luna revisa; Edu decide aprobación.
6. Si existe un fallo, se repite desde cero.
7. No se redactan pliegos ni se implementan fixes antes de aprobar.

## 14. Fuera de alcance

Arreglos, refactors, cambios de UI, iconografía, ADRs, migraciones, despliegues, subidas, borrados, limpieza no autorizada y conversión del informe en pliegos.

*Fin del contrato.*

Comandos de verificación: `wc -l -c`, `head`, `tail`, búsqueda de `REPETIDA_3`, `79`, `d1/09_capsule_contenido`, `d1/10_mp3_head`, `evidencias_auditoria3`, `EVIDENCIA-ID`, `fecha_hora`, `NO VERIFICADO`, `FAIL / INVALIDADA`, `Definition of Done` y `Fin del contrato`. El estado Git debe mostrar únicamente este contrato como nuevo documento de esta tarea; los históricos deben permanecer intactos.
