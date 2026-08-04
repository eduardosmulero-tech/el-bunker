# CONTRATO — Reauditoría total de la app por Hermes

> Estado: CONTRATO DE EJECUCIÓN — pendiente de OK de Edu
> Fecha: 2-ago-2026 · Mandante: Edu · Ejecutor: Hermes · Revisor: Luna / Edu
> Regla vinculante: un solo fallo invalida toda la auditoría.

## 1. Decisión

La auditoría anterior de Hermes queda INVALIDADA. Luna detectó al menos una omisión relevante que debía descubrirse leyendo el alcance obligatorio: el contrato de Time Capsules entre frontend, Worker y schema.

Hermes debe repetir la auditoría completa desde cero. No se permite corregirla con una adenda, una lista parcial de omisiones ni un pliego posterior.

### Tolerancia cero

Si la nueva auditoría contiene un solo fallo factual, omisión relevante, clasificación incorrecta, cita incorrecta o afirmación no demostrada, queda íntegramente invalidada y debe repetirse otra vez. No existe estado de parcialmente correcta.

## 2. Objetivo

Producir un inventario técnico completo, verificable y autocontenido de frontend React/Vite, Worker y todas sus rutas API, D1/schema y contratos de datos, R2/subida/lectura/media, autenticación, Service Worker/PWA y documentación operativa/normativa. Debe identificar tanto lo que funciona como lo que falla; no puede limitarse a confirmar el informe anterior ni a buscar deuda visual.

## 3. Informe anterior: solo hipótesis

`docs/operacional/auditoria_total_2026-08-02.md` queda como antecedente no confiable. Hermes debe volver a comprobar todo contra el código actual, incluyendo conteos, prioridades, clasificaciones, rutas y declaraciones de completo, sano, muerto o correcto.

Cada afirmación debe etiquetarse como VERIFICADO EN CÓDIGO, VERIFICADO EN ARTEFACTO, HIPÓTESIS o NO VERIFICABLE EN ESTA SESIÓN.

## 4. Alcance obligatorio

### Frontend

Revisar todos los archivos de `src/`, incluidos layout, core, vault, musiclab, capsules, smoke, shims, tests y setup de Vitest. Cubrir login/logout/boot, las tres tabs y sub-vistas, CRUD de cada entidad, carga/error/offline/remount, formularios, validación, modales, toasts, foco, teclado, nombres accesibles, idioma, fechas, textos técnicos, responsive móvil/tablet/desktop/landscape, interacción entre contexts, duplicación, monolitos, código muerto, stubs y features a medias.

### Worker/API

Revisar `workers/worker.js`, `workers/routes/*.js`, `workers/utils/*.js`, tests y configuración. Por cada endpoint documentar método, ruta, auth, validación, respuesta, errores, mutaciones, eventos, límites, paginación, ordenación y consumidor frontend. Contrastar cada campo que envía el cliente con lo que el Worker valida y persiste. Es obligatorio comprobar, entre otros, `entry_ids`, `playlist_ids` y `content_snapshot` de Time Capsules.

### D1/schema

Contrastar `workers/schema.sql` con todas las lecturas y escrituras: tablas, columnas, tipos, defaults, FK, índices, soft delete, legacy, datos calculados pero no persistidos, datos persistidos pero nunca leídos y divergencias documentales.

### R2/media

Seguir cada flujo desde selección local hasta presigned URL, PUT, fila D1, URL de lectura, firma, MIME, tamaño, Range/seek, errores, reintentos, asociación y huérfanos para fotos, vídeos, audio, documentos y MP3.

### SW/PWA

Auditar instalación, activación, precache, manifest, invalidación, navegación offline, API, R2, audio, Background Sync, Push, mensajes Worker→cliente y rutas/prefijos anunciados. Un listener sin productor o productor sin consumidor es contrato incompleto.

### Documentación

Contrastar `docs/Nucleo/CONTRATO.md`, `REGLAS.md`, `ESTADO.md`, `docs/Arquitectura/INDEX.md`, todos los `docs/Arquitectura/*.md`, documentación operacional relevante, manual de usuario, `README.md`, `package.json`, `vite.config.js` y `wrangler.toml`. Toda ruta citada debe existir; una ruta inexistente es un hallazgo documental.

## 5. Entregables metodológicos obligatorios

### Matriz de cobertura

Debe incluir filas para Frontend, Worker/API, D1/schema, R2/media, SW/PWA y Docs, y columnas de archivos revisados, flujos revisados, hallazgos, sin hallazgo y no verificable. No se acepta completo sin esta matriz.

### Matriz de contratos cruzados

Debe incluir estas filas: crear entry, editar entry, borrar entry, crear era, añadir track con MP3, crear playlist, crear cápsula con contenido, subir foto/video/audio, reproducir/seek MP3, emitir/leer eventos, login Google y login access key. Cada fila tendrá UI/cliente, endpoint, Worker, schema/R2 y resultado. Solo es correcta si todas sus capas coinciden.

### Citas y descartes

Cada hallazgo debe incluir ID, severidad, impacto, clasificación, archivo:líneas exactas, comportamiento observado, esperado, motivo, **EVIDENCIA-ID**, certeza, dependencia y decisión/pliego necesario. Debe existir una sección NO HALLAZGO / DESCARTADO con sospechas relevantes investigadas y descartadas, citando el código y la evidencia aplicable.

### Evidencia obligatoria por flujo y hallazgo

Ningún flujo de la aplicación podrá declararse **VERIFICADO**, **CORRECTO** o **ROTO** únicamente mediante referencias `archivo:línea`. La referencia al código es soporte técnico obligatorio, pero no sustituye las capturas ni las pruebas operativas exigidas cuando la afirmación se refiere al comportamiento de la app.

Para **cada flujo obligatorio** de la matriz de contratos, Hermes debe entregar un paquete de evidencia identificable:

1. **Capturas de UI:** antes de la acción, durante el estado relevante y después de la acción; viewport documentado (móvil/tablet/desktop y ancho × alto); fecha, nombre único de evidencia y flujo. Una captura del formulario abierto no demuestra que el envío haya funcionado.
2. **Network/DevTools:** cuando exista API, captura o HAR con método, ruta, código HTTP, payload redactado, respuesta y secuencia temporal. Aplica a CRUD, login, cápsulas, uploads, reproducción/seek, eventos y mensajes del Service Worker.
3. **Consola/runtime:** cuando afecte a JavaScript, React, Service Worker o errores de ejecución, captura antes y después con mensaje, origen, stack trace si existe y reproducibilidad.
4. **D1/R2/persistencia:** cuando se afirme guardado, pérdida, subida o media, evidencia autorizada del estado antes/después, recarga/remount, consulta D1 y/o metadata/lectura R2. En uploads deben verse por separado POST, PUT y estado final; en Range/seek, `Range`, `206`, `Content-Range` o la ausencia de esos datos. Como esta reauditoría prohíbe acceder a D1/R2 vivos sin autorización adicional, solo se aceptan capturas, HAR, snapshots, fixtures o exportaciones locales autorizados, con fecha y procedencia identificables. Sin ese artefacto, el resultado debe ser `NO VERIFICADO`; no se puede afirmar persistencia real a partir del código o de una UI que diga “guardado”.
5. **Análisis estático:** comando exacto, alcance, salida relevante, fecha y limitaciones. Solo puede ser evidencia única para afirmaciones puramente estructurales (por ejemplo, ruta inexistente o consumidor ausente en el repositorio), nunca para afirmar por sí solo que un botón funciona, algo se guarda, una subida llega a R2, un login es fluido, una pantalla es responsive o un seek funciona.

La matriz de contratos debe añadir las columnas **Evidencia UI**, **Network/DevTools**, **Consola**, **D1/R2**, **Estático** y **Resultado**. Cada celda debe contener un `EVIDENCIA-ID`, `NO APLICA` con justificación o `NO VERIFICADO`; nunca puede quedar vacía ni sustituirse por una simple cita de código. Cada hallazgo listado fuera de la matriz debe llevar igualmente su propio `EVIDENCIA-ID` y una relación explícita con los artefactos entregados.

Si falta la evidencia aplicable, el resultado debe clasificarse como **NO VERIFICADO**, nunca como **CORRECTO**, **ROTO** o **VERIFICADO**. Un resultado puede conservarse como **HIPÓTESIS ESTÁTICA**, pero no como hecho operativo.

Las capturas no pueden contener claves, JWT, secretos ni datos sensibles sin redactar.

### Índice y autenticidad de evidencias

El informe debe incluir un **índice de evidencias**. Cada `EVIDENCIA-ID` debe apuntar a un archivo real entregado junto al informe e incluir, como mínimo: ruta o nombre de archivo, hash, fecha/hora, flujo o hallazgo asociado, viewport si es captura de UI, entorno, origen y estado de redacción. Un ID sin archivo verificable no cuenta como evidencia.

Hermes puede generar capturas nuevas en una sesión local o en un entorno vivo únicamente si Edu autoriza expresamente esa verificación y se respetan las restricciones de secretos y datos sensibles. Sin autorización, solo puede usar artefactos locales, snapshots, fixtures, HAR o capturas previamente entregados y claramente fechados; estos deben identificarse como evidencia previa y nunca presentarse como comprobación nueva. Si no existe un artefacto aplicable, el resultado es `NO VERIFICADO`.

## 6. Verificación permitida

Permitido: lectura, búsquedas, conteos, análisis estático, comprobación local de imports/rutas y build/lint/tests locales si no afectan al sistema vivo.

Prohibido sin autorización adicional: `wrangler` remoto, `curl` o requests a producción, lectura/escritura de D1/R2 vivos, JWT, claves, secretos, despliegues, migraciones, borrados, subidas y cualquier cambio de código, configuración, datos o documentación existente. Hermes no puede modificar el informe anterior ni ningún otro archivo documental; durante esta tarea solo puede crear el informe nuevo indicado en §8. Hermes entrega inventario; no arregla nada durante esta tarea.

## 7. Invalidación automática

La auditoría es FAIL / INVALIDADA si omite un dominio o flujo obligatorio; afirma corrección sin contrastar cliente, Worker y schema/R2; reutiliza evidencia viva previa como verificación nueva; copia conteos sin recalcularlos; cita ruta inexistente o líneas materialmente incorrectas; confunde comentarios con comportamiento; llama muerto sin demostrar consumidores inexistentes; llama sano al backend sin contratos cruzados; no distingue hechos, hipótesis y límites; **presenta referencias de código como única prueba de comportamiento de la app cuando se exigían capturas o pruebas operativas**; no entrega el paquete de evidencia aplicable por flujo; marca CORRECTO/ROTO/VERIFICADO con evidencia faltante en vez de NO VERIFICADO; modifica código/datos/infraestructura; no entrega ambas matrices y falsos positivos; no detecta contradicciones documentales; o contiene cualquier hallazgo material detectable dentro del alcance obligatorio.

La lista no es limitativa: cualquier error factual material invalida el resultado completo.

## 8. Entregable

Hermes debe crear únicamente este informe nuevo: `docs/operacional/auditoria_total_2026-08-02_REPETIDA_HERMES.md`.

Debe contener, en orden: estado PASS CANDIDATE o FAIL / INVALIDADA; alcance y límites; matriz de cobertura; matriz de contratos cruzados; resumen ejecutivo; bugs y seguridad; datos y persistencia; UI y accesibilidad; arquitectura/deuda/refactor; SW/PWA/media; documentación; descartados/no hallazgos; priorización nueva con dependencias; evidencia local reproducible; checklist de autoverificación; y declaración explícita de invalidación del informe anterior.

## 9. Definition of Done

Solo puede presentarse como PASS CANDIDATE si cubre todos los dominios, incluye ambas matrices, revisa todos los contratos cruzados, incluye Time Capsules, **aporta capturas y evidencia operativa por cada flujo en el nivel que corresponda**, incluye el índice de evidencias con archivos reales y hashes, recalcula conteos y verifica rutas, distingue código de evidencia viva, incluye falsos positivos, no modifica aplicación, datos, infraestructura ni documentación existente y es autocontenido y reproducible por sus citas y `EVIDENCIA-ID`. Las capturas deben demostrar el estado observado, no solo la existencia del formulario o de una referencia de código. PASS CANDIDATE no es aprobación final: Luna y Edu deben revisar las citas y las evidencias.

## 10. Secuencia

1. Edu aprueba este contrato.
2. Hermes repite desde cero.
3. Hermes entrega el informe nuevo sin tocar app ni sistema vivo.
4. Luna revisa contra el código real.
5. Un solo fallo => FAIL / INVALIDADA => Hermes repite.
6. Solo después se redactan pliegos.
7. No se implementa ningún fix durante la reauditoría.

## 11. Fuera de alcance

Arreglos, refactors, iconografía, cambios de ADR, migraciones, despliegues, subidas, borrados y conversión automática del informe anterior en pliegos.

*Fin del contrato.*
