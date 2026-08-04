# Plan de refactor e higiene técnica — El Búnker

**Fecha:** 3 de agosto de 2026  
**Fase:** PLAN de Promethe-os; no es implementación.  
**Propietario de decisiones:** Edu.  
**Regla:** ninguna fase modifica producción por defecto.

## 1. Decisiones aprobadas

- **1C:** refactor amplio antes de nuevas features.
- **2B:** sustituir todos los emojis funcionales.
- **3A+:** Android/PWA como objetivo principal y navegador desktop adaptado dignamente, sin convertirlo en una plataforma independiente.
- **4B:** definir una política de borrado por entidad antes de seguir desarrollando.
- **5D:** priorizar higiene técnica: legado de Drive, stubs y estabilización de la base.

## 2. Objetivo y definición de terminado

El objetivo no es reescribir la aplicación de una vez. Es dejar límites claros y verificables entre autenticación, datos, módulos y UI, manteniendo el comportamiento válido mientras se reduce el acoplamiento.

El trabajo estará terminado cuando:

1. D1/R2 sean la fuente inequívoca de persistencia y Google se use únicamente para autenticación.
2. `VaultContext` y los monolitos de UI tengan responsabilidades separadas sin romper sus consumidores.
3. `PlayerContext`/`WinampPlayer` conserven el motor único de audio y tengan una red de tests antes de cualquier división.
4. La UI use iconografía coherente en lugar de emojis funcionales.
5. Android/PWA siga funcionando y el navegador desktop tenga una composición propia, no una pantalla móvil estirada.
6. Cada entidad tenga una política de borrado documentada y aplicada de forma coherente.
7. Los stubs y el código Drive restante estén eliminados, aislados como legacy explícito o respaldados por una decisión.
8. Código, producción y documentación describan el mismo sistema.

Una fase solo se considera terminada si tiene: alcance cerrado, cambios implementados, tests/build/lint, revisión independiente, criterio de aceptación cumplido y rollback conocido.

## 3. Alcance y fuera de alcance

### Dentro del plan

- `src/core`, `src/layout`, `src/vault`, `src/musiclab`, `src/capsules` y `src/smoke`.
- `public/sw.js`, `manifest.json`, estilos y tokens responsive.
- `workers/schema.sql`, rutas, utils y tests.
- Documentación de contrato, arquitectura, estado, sesión, deuda y manual.

### Fuera de alcance durante este plan

- Playback Premium, gapless, Chromecast o nuevas features grandes.
- Nueva pestaña o cambio de las tres tabs definitivas.
- Nuevo motor de audio o `<audio>` fuera de MusicLab.
- iOS como plataforma oficial.
- Backend externo o migración destructiva sin snapshot y gate explícito.
- Rehacer toda la aplicación desde cero.
- Eliminar datos vivos por intuición o ejecutar `NUKE_schema.sh`.

## 4. Principios y guardrails

- Cada cambio de código será un contenedor lógico completo, conforme a ADR-015; no micro-ediciones.
- Una sola fase activa cada vez; el Kanban será el estado vivo.
- WorkerClient + D1 + R2 son la ruta de persistencia; `patchDb` no se convierte en una segunda base de datos.
- Google OAuth y el acceso por clave emiten JWT; Google Drive no persiste datos ni archivos.
- MusicLab mantiene la única instancia de `<audio>`.
- Todos los eventos pasan por `events`, que sigue siendo append-only.
- Antes de tocar esquema o políticas remotas: snapshot D1, SQL revisable y prueba controlada.
- Tests, build y lint dirigido son obligatorios; la aceptación UI se separa de la aceptación API.
- No se despliega a Worker/Vercel hasta el gate final de aceptación.
- Commits sin coautoría de IA; push solo con autorización explícita.

## 5. Estado de partida y riesgos

El área clave de `src/` supera las 14.000 líneas. Los monolitos principales son aproximadamente: `MusicLab.jsx` 1.860 líneas, `PlayerContext.jsx` 1.730, `VaultGallery.jsx` 1.230, `Vault.jsx` 1.040 y `VaultContext.jsx` 984.

La red local actual contiene 28 tests y el trabajo R1–R4 está en el commit `75093b6`; el Worker probado en producción corresponde a la versión `3bc51c36-2cf3-4a0d-8770-634993f67303`.

Riesgos que el plan debe controlar:

- `VaultContext` mezcla autenticación, carga D1, estado UI, bibliotecas y compatibilidad histórica.
- `PlayerContext` es crítico: mezcla reproducción, cola, posición, presencia y escucha compartida; una división prematura puede romper audio.
- `GoogleDriveService` aún mezcla OAuth, carga de la API Drive, funciones de biblioteca y fallback de stream.
- La UI contiene emojis funcionales, límites `max-w-md`, `prompt()`/`confirm()` y textos técnicos.
- El borrado es inconsistente: entries/tracks son soft-delete; drops/playlists/eras/queue usan borrado físico o reemplazo.
- Hay documentación que todavía describe Drive como persistencia y ADR-028 como pendiente.
- El Service Worker contiene Background Sync/Push sin productor o consumidor conectado; `/api/sync` del Worker sí es funcional y no debe confundirse con esos stubs.

## 6. Arquitectura objetivo provisional

La arquitectura objetivo tendrá capas, pero la migración será compatible e incremental:

```text
Auth/Session
    ↓
WorkerClient + data access (D1/R2)
    ↓
Domain state/actions (Vault, MusicLab, Capsules)
    ↓
UI shell responsive + design system + módulos
```

Propuesta de extracción progresiva:

- Separar un `GoogleAuthService`/módulo de sesión de las funciones Drive, conservando temporalmente un facade compatible con los imports actuales.
- Extraer autenticación de `VaultContext` hacia un hook/contexto de sesión y dejar en el contexto de dominio la carga y las acciones D1.
- Aislar las bibliotecas Drive en un adapter legacy únicamente si G0 decide conservar esa capacidad; si no tienen uso real, retirarlas tras inventario y aceptación.
- Mantener `useVault()` y la forma pública del contexto durante la transición para que los consumidores no se rompan todos a la vez.
- Extraer de `PlayerContext` primero funciones puras de cola, shuffle y normalización; no dividir el motor de audio hasta tener pruebas específicas.
- Mantener rutas Worker separadas por contenedor; introducir helpers puros para políticas y validaciones, no un router monolítico.
- Usar migraciones SQL aditivas y reversibles; no editar el esquema remoto directamente sin procedimiento de snapshot.

## 7. G0 — Contrato del refactor

### Objetivo

Convertir las decisiones de Edu en un contrato técnico ejecutable antes de tocar código.

### Trabajo

1. Crear contrato/spec del refactor con alcance, no-go y criterios de salida.
2. Inventariar exports, consumidores y llamadas de `GoogleDriveService`, `VaultContext`, `PlayerContext`, `WorkerClient`, `FileUploadService` y `StatsEngine`.
3. Crear una matriz de fuente de verdad: cada dato debe indicar dueño, lectura, escritura, persistencia y fallback permitido.
4. Actualizar el mapa de ownership propuesto sin cambiar todavía la implementación.
5. Resolver explícitamente qué pasa con `libraries`, `listLibraryContents`, `calculateLibraryUsage`, `checkLibraryCapacity`, `drive_file_id` y el fallback Drive de `getStreamUrl`.
6. Resolver si los stubs de Background Sync/Push se eliminan o se documentan como futuras capacidades; mantener fuera de esta decisión el `/api/sync` real.
7. Registrar decisiones abiertas de borrado para cada entidad.

### Salida y gate

Edu aprueba la matriz, la política provisional de datos y la lista de no-go. Sin esa aprobación no empieza el refactor estructural.

## 8. G1 — Baseline y red de seguridad

### Objetivo

Poder demostrar que cada fase conserva el comportamiento válido anterior.

### Trabajo

- Separar en Git los documentos ajenos ya pendientes; no mezclarlos con código.
- Ejecutar y registrar `npm test`, `npm run build`, lint dirigido y sintaxis Worker.
- Tomar snapshot D1 remoto antes de cualquier cambio de esquema o borrado.
- Inventariar `files`, `r2_key`, tracks legacy, filas soft-deleted y posibles huérfanos sin imprimir datos privados.
- Crear una checklist de aceptación para Android/PWA y desktop: login, carga, tres tabs, entry, MP3, cápsula, seek, recarga, offline y logout.
- Añadir tests de contrato para los límites que se van a preservar: WorkerClient/auth, carga D1, rutas de borrado y único audio.

### Criterio

Baseline registrado: no se inicia G2 si falla una comprobación o si el snapshot no es verificable.

## 9. G2 — Política de borrado por entidad

### Objetivo

Convertir la decisión 4B en una política explícita, aplicable y comprobable antes de cambiar cualquier flujo de eliminación.

### Matriz provisional para aprobación

| Entidad | Estado actual | Política propuesta | Cascadas/huérfanos | Restauración | Autorización |
|---|---|---|---|---|---|
| `entries` | Soft-delete (`is_deleted`) | Mantener soft-delete; ocultar por defecto | `entry_tags` y `files.entry_id` se conservan lógicamente; R2 no se borra automáticamente | Sí, si se implementa acción explícita | Propietario/admin según contrato |
| `tracks` | Soft-delete | Mantener soft-delete; impedir reproducción y nuevas asociaciones | `playlist_tracks`/`queue_items` deben limpiarse o quedar inactivos; objeto R2 se conserva hasta purga | Sí, durante retención definida | Propietario/admin |
| `files` / objetos R2 | Fila D1 + objeto R2 | Borrado lógico ligado a entidad; purga física separada y auditable | Nunca dejar fila sin objeto ni objeto sin fila sin registrar excepción | No tras purga física | Propietario/admin; purga restringida |
| `playlists` | Físico actual | Soft-delete o estado `archived`, pendiente de aprobación | `playlist_tracks` en cascada lógica; tracks no se borran | Sí mientras exista snapshot/estado | Creador/admin |
| `drops` | Físico o flags actuales | `archived/deleted_at` antes de hard-delete | El track/era relacionado no se elimina por borrar drop | Sí mientras esté retenido | Remitente/destinatario/admin |
| `eras` | Físico con referencias `SET NULL` | Archivar; no borrar si contiene contenido sin confirmación | Entries/tracks quedan sin era o se reasignan explícitamente | Sí | Admin/propietario |
| `queue_items` | Físico | Hard-delete aceptable: es estado derivado y recreable | FK a track; limpiar al soft-delete de track | No necesaria | Usuario dueño de cola |
| `time_capsules` | Físico con `capsule_items` en cascada | Archivar o soft-delete; no borrar cápsula sellada sin confirmación | Items dependen de cápsula; referencias no deben borrar entries/tracks | Sí hasta purga | Creador/admin |
| `capsule_items` | Cascada al borrar cápsula | Borrar solo con cápsula o al retirar item explícitamente | No borrar el contenido referenciado en `entry_ref`/`playlist_ref` | Sí si cápsula archivada | Creador/admin |
| `events` | Append-only | Nunca borrar ni editar como parte de UX normal | Retención separada, documentada y con procedimiento excepcional | No | Solo mantenimiento autorizado |

La tabla es una **propuesta de trabajo**, no una migración aprobada. G2 debe resolver para cada fila: retención, nombre de campos, endpoint, visibilidad, restauración, purga R2, auditoría y pruebas. Si la decisión cambia el esquema, se prepara migración aditiva, snapshot y rollback. **No se añaden `archived`, `deleted_at` ni otros campos a entidades que no los tienen hasta que Edu apruebe la política y exista una migración revisable.**

G2 es un bloqueo real: no se puede avanzar a G3 ni empezar el refactor estructural mientras quede sin resolver una entidad, una retención, la restauración o la responsabilidad de purga R2. Las decisiones se registran en una matriz aprobada y, si afectan a reglas permanentes, en una enmienda del contrato.

### Criterio de salida

No existen botones de borrado cuyo efecto sea ambiguo; cada operación indica si archiva, oculta o purga. Hay tests de autorización, cascadas, huérfanos y eventos. La política aprobada queda documentada en contrato/arquitectura y manual. El gate se considera cerrado solo con aprobación explícita de Edu, no por inferencia del agente.

## 10. G3 — Fronteras de datos y limpieza Drive

### Objetivo

Dejar D1/R2 como fuente única y retirar el acoplamiento de Drive sin romper el login Google.

### Inventario obligatorio

Clasificar cada referencia a `GoogleDriveService` en una de estas categorías:

1. **OAuth permitido:** GIS, perfil y token de autenticación. Se conserva en `GoogleAuthService` o equivalente.
2. **Persistencia prohibida:** `patchDb`, lectura/escritura de JSON, bibliotecas o heartbeat Drive. Se elimina o se reemplaza por Worker API.
3. **Fallback temporal:** `drive_file_id`, `getStreamUrl` o URLs antiguas. Se mide su uso y se define migración/retirada.
4. **Código muerto:** exports sin consumidores. Se elimina después de búsqueda de referencias y build.

### Secuencia

- Extraer un módulo de auth compatible sin cambiar el contrato de login.
- Mantener un facade temporal solo mientras existan consumidores; marcarlo `legacy` y prohibir nuevas importaciones.
- Confirmar que `VaultContext`, `PlayerContext` y cualquier servicio no leen/escriben Drive para datos.
- Resolver `libraries[]`, `listLibraryContents`, `calculateLibraryUsage` y el fallback `drive_file_id`: migrar a D1/R2, eliminar, o dejar como adapter de transición con fecha de caducidad.
- Antes de retirar el fallback, producir evidencia concreta: conteo de filas con `drive_file_id`, conteo de objetos/archivos relacionados, consumidores en código, última utilización observable si existe y resultado de una prueba de reproducción. Un inventario textual sin esos datos no autoriza la retirada.
- Añadir una comprobación de CI/búsqueda que falle si reaparece persistencia Drive fuera del adapter autorizado.
- Actualizar `ownership-map`, `data-flow`, `architecture`, `technical-debt`, el manual y los ADRs que aún describan Drive como fuente activa. En particular, revisar explícitamente ADR-002, ADR-005 y ADR-024 para separar su histórico de la política vigente D1/R2; no borrar el historial, sino enmendarlo o marcarlo como transición superada.
- Corregir explícitamente el estado de ADR-028, que actualmente conserva el texto “implementación pendiente”, para que refleje la implementación desplegada y su evidencia operativa, manteniendo intactas sus reglas de seguridad.

### Criterio de salida

El login Google sigue funcionando, pero una búsqueda de persistencia Drive fuera del adapter autorizado devuelve cero resultados. No se borran objetos legacy sin inventario, snapshot y aprobación. Los consumidores restantes y su fecha de retirada están documentados.

## 11. G4 — Fronteras de estado y refactor incremental

### Orden seguro

1. Extraer funciones puras de normalización de datos y acciones Worker, con tests.
2. Extraer sesión/auth de `VaultContext` manteniendo `useVault()` y sus nombres públicos.
3. Separar carga/refresh D1 de estado UI y polling, sin duplicar `WorkerClient` ni tokens.
4. Extraer acciones de MusicLab a hooks/servicios ya existentes; no introducir un segundo estado de tracks.
5. Extraer en `PlayerContext` cola, shuffle, loop y normalización como módulos puros. El proveedor sigue siendo el dueño del audio.
6. Dividir componentes grandes por contenedor lógico completo: `Vault`, `MusicLab`, `VaultGallery`, `TimeCapsules`; cada extracción conserva props y comportamiento.
7. Revisar `App`/`Layout` como shell: navegación, sesión, presencia, toasts y responsive, sin mover ownership de datos.

### Guardrails de compatibilidad

- No cambiar exports públicos sin búsqueda de todos los consumidores y actualización coordinada.
- No crear otro `<audio>`; verificar que solo MusicLab lo instancia.
- No cambiar las tres tabs ni convertir CAPSULES en dueño de entries/tracks.
- No reemplazar `WorkerClient` por fetches directos dispersos.
- Cada extracción debe tener diff revisable, test asociado y rollback por commit.

### Criterio de salida

Cada contexto tiene una responsabilidad clara, los consumidores no dependen de detalles internos, no hay duplicación de fuentes de verdad y los tests/build/lint pasan. La mejora estructural no se declara terminada por número de archivos, sino por límites verificables.

## 12. G5 — Iconografía y lenguaje visual

### Inventario y estándar

- Inventariar todos los emojis en JSX, datos seed, tags configurables, textos, estados vacíos, timeline, botones y mensajes.
- Usar el sistema de iconos ya disponible en el proyecto si existe; no añadir una dependencia sin verificar `package.json`. Si no existe una librería aprobada, crear un conjunto mínimo de SVG/React icons accesibles en `src/core/ui`.
- Separar icono de presentación de cualquier valor persistido. Los tags existentes que guardan `icon` deben seguir renderizando de forma segura; no convertir emojis almacenados en una migración destructiva sin decisión.
- Definir mapa revisable: cámara/foto → `Photo`, música → `Music`, cápsula → `LockKeyhole`/equivalente, estado → icono semántico, favorito → `Heart`, navegación → iconos de shell.
- Todo icono funcional tendrá `aria-label` o texto visible, foco de teclado y contraste suficiente. Los decorativos llevarán `aria-hidden`.

### Sustituciones identificadas

Como mínimo: `Capsules.jsx`, `Timeline.jsx`, `Recaps.jsx`, `TimeCapsules.jsx`, `WallView.jsx`, `VaultGallery.jsx`, `EntryLightbox.jsx`, `AddEntryForm.jsx` y `TagManager.jsx`. También se revisarán textos de fallback y cualquier emoji encontrado fuera de `src`.

### Criterio de salida

La búsqueda de emojis funcionales queda en cero o cada excepción está documentada como contenido de usuario. No se rompen valores persistidos, etiquetas ni accesibilidad. Se prueba visualmente cada módulo en móvil y desktop.

## 13. G6 — Responsive: Android/PWA y desktop digno

### Objetivo visual

Mantener mobile-first para Android/PWA, pero diseñar una composición desktop real: contenido centrado con ancho útil, columnas o paneles cuando aporten valor, navegación y player legibles, sin `max-w-md` global que comprima la experiencia.

### Límites de diseño

- **Móvil:** 320–767 px, una columna, controles táctiles de al menos 44 px, safe areas y scroll vertical estable.
- **Tablet/ventana intermedia:** 768–1023 px, dos columnas solo cuando no reduzcan legibilidad.
- **Desktop:** ≥1024 px, shell con ancho máximo razonable, panel lateral/grid donde corresponda, no simulación de teléfono.
- **Landscape móvil:** verificar que player, formularios y modales no queden cortados.

### Superficies

- `Layout`/`TabShell`: shell, navegación y player persistente.
- `Vault`/`VaultGallery`/`WallView`/`EntryLightbox`: grid, filtros, lightbox y mapa.
- `MusicLab`/`WinampPlayer`/managers: biblioteca, controles, cola y formularios.
- `Capsules`/`TimeCapsules`/`Timeline`: sub-tabs, tarjetas, creación y lectura.

Primero se define una ficha visual por superficie; después se implementan contenedores completos y se prueban a 375, 768, 1024 y 1440 px. No se mezclan cambios responsive con cambios de persistencia en el mismo contenedor salvo que sea imprescindible.

### Criterio de salida

Capturas comparables móvil/desktop, sin overflow horizontal accidental, sin botones inaccesibles, sin modal cortado y con jerarquía visual clara. La aceptación incluye navegador de escritorio real y PWA instalada.

## 14. G7 — Service Worker y stubs

### Decisión por capacidad

| Capacidad | Estado a verificar | Acción planificada |
|---|---|---|
| Precaching/cache de assets | Activo | Mantener; probar invalidación por versión y rollback |
| Network-first HTML | Activo | Mantener; probar actualización y fallback |
| Bypass `/api/` | Activo | Mantener; nunca cachear JWT/respuestas D1 |
| Cache de audio R2 | Activo | Revisar rangos, privacidad, cuota y limpieza |
| Background Sync `bunker-db-sync` | Stub sin cola durable conectada | Eliminar del SW o dejar explícitamente desactivado; no prometer reintentos que no existen |
| Push/notificationclick | Stub sin productor/permiso de producto | Eliminar o documentar como fuera de alcance; no mantener listeners engañosos |
| `/api/sync` Worker | Funcional para presencia/escucha compartida | Mantener separado; crear pruebas propias, no confundirlo con Background Sync |

La opción por defecto del plan es retirar los stubs no usados para reducir superficie, salvo que Edu apruebe su implementación como proyecto independiente. Cualquier cambio del SW requiere prueba de instalación, activación, actualización, cache vieja, offline y recuperación online.

## 15. G8 — Documentación y coherencia operativa

Actualizar en una misma unidad documental:

- `docs/Nucleo/CONTRATO.md`: solo si se adopta una decisión nueva de política; no reescribir ADRs vigentes sin enmienda.
- `docs/Nucleo/ESTADO.md` y `SESION.md`: estado real, commit, despliegues y gates.
- `docs/Arquitectura/architecture.md`, `data-flow.md`, `ownership-map.md`, `rendering-flow.md`, `state-map.md` y `technical-debt.md`.
- `docs/operacional/INFORME_EJECUTIVO_DECISION_2026-08-03.md` y este plan: marcar fases, decisiones y evidencias.
- Manual de usuario: borrado, login, responsive, subida y comportamiento real.

No se deben “arreglar” contradicciones normativas silenciosamente: se registran como propuesta y Edu decide el ADR o enmienda correspondiente.

## 16. Matriz de aceptación por fase

| Gate | Evidencia mínima | No-go |
|---|---|---|
| G0 | contrato/spec, ownership y decisiones abiertas | alcance ambiguo o persistencia Drive sin dueño |
| G1 | 28 tests o baseline actualizado, build/lint, snapshot y checklist | regresión no explicada o snapshot ausente |
| G2 | matriz aprobada por entidad, tests de borrado/autorización/cascadas/R2/eventos y decisión de esquema | política sin aprobación explícita, huérfanos, pérdida de datos o efecto de botón ambiguo |
| G3 | conteos y consumidores de `drive_file_id`/`libraries`, login Google/clave, búsquedas de persistencia y migración/fallback documentado | Drive como fuente oculta, evidencia incompleta o login roto |
| G4 | tests de contextos/acciones, único audio, navegación intacta | doble estado, doble audio o consumer roto |
| G5 | inventario y capturas, accesibilidad, cero emojis funcionales | emoji funcional sin excepción aprobada |
| G6 | capturas 375/768/1024/1440, Android/PWA y desktop | overflow, modal cortado o layout móvil estirado |
| G7 | instalación/actualización/offline/online y API sin cache | datos stale, JWT cacheado o stub presentado como feature |
| G8 | docs cruzadas y manual coherente | documentación contradice producción |

La aceptación API, la aceptación visual y la aceptación de producto son gates distintos. Ninguna prueba de backend sustituye una captura y una prueba real desde la UI.

## 17. Rollback y seguridad operativa

- Cada gate se entrega en commit independiente o conjunto pequeño de commits de un solo contenedor lógico.
- Antes de D1: snapshot identificable; antes de R2: inventario de objetos y filas.
- No se ejecutan migraciones destructivas sin backup, dry-run y rollback escrito.
- Worker: desplegar primero a entorno controlado; conservar versión anterior para rollback.
- Frontend/PWA: verificar preview/commit, invalidación SW y posibilidad de volver a la versión anterior.
- Si falla una aceptación, se revierte el contenedor completo, no se parchea en producción a ciegas.
- Cualquier operación de borrado físico R2 requiere registro de actor, motivo, objeto y resultado.

## 18. Orden de ejecución aprobado

1. **G0:** contrato, inventarios y decisiones abiertas.
2. **G1:** baseline, snapshots y red de tests.
3. **G2:** política de borrado y pruebas; no borrar datos vivos todavía.
4. **G3:** separar auth de Drive y retirar persistencia/fallback legacy según decisión.
5. **G4:** refactor incremental de contextos, servicios y monolitos.
6. **G5:** iconografía y lenguaje visual.
7. **G6:** responsive desktop/móvil y aceptación visual.
8. **G7:** limpiar stubs del SW y verificar offline/update.
9. **G8:** sincronizar documentación y emitir informe de cierre.
10. Gate final de Edu: aceptar o reabrir fase; solo después valorar nuevas features.

Una fase puede descubrir que necesita una decisión nueva. En ese caso se detiene, se documenta la decisión y no se salta al siguiente gate.

## 19. Entregables y responsables

| Entregable | Responsable de decisión | Implementación/verificación |
|---|---|---|
| Contrato de refactor | Edu | agente implementador + revisión independiente |
| Matriz de ownership y borrado | Edu | implementador + tests Worker |
| Refactor frontend/Worker | Edu aprueba alcance | implementador + tests/build/lint |
| Iconografía/responsive | Edu acepta visualmente | implementador + capturas/browser |
| SW/stubs | Edu decide retirar o reservar | implementador + pruebas PWA |
| Docs y manual | Edu valida significado | implementador + revisión cruzada |

No se considera aprobación una inferencia del agente: cada decisión pendiente debe tener respuesta explícita de Edu.

## 20. Criterio global de éxito

El plan queda cerrado cuando la app conserva sus invariantes —D1/R2, auth autorizada, tres tabs, único audio y eventos append-only—, cada entidad tiene borrado entendido, el código no depende de Drive para persistencia, los stubs no engañan, la interfaz funciona en Android/PWA y desktop, y las pruebas/capturas/documentación permiten reproducir la aceptación.

### Condiciones de no-go global

- No iniciar Playback Premium ni nuevas features grandes.
- No desplegar cambios de esquema o borrado sin gate.
- No aceptar “funciona en código” como sustituto de prueba UI.
- No eliminar legacy, objetos R2 o eventos históricos por intuición.
- No declarar el refactor acabado mientras el frontend publicado, el Worker y la documentación estén desalineados.

## 21. Estado de las decisiones G0

Las decisiones de política de borrado, restauración, retención, purga, auditoría y reparaciones D1/R2 quedan aprobadas por Edu y están consolidadas en §23. G2 queda aprobado como **contrato de política**, no como implementación.

Quedan como decisiones técnicas/documentales para la spec y gates posteriores, no como decisiones de producto pendientes:

1. Formalizar `admin_audit_log` separado de `events` y sus campos en SQL.
2. Verificar y configurar el mecanismo `scheduled` del Worker para la cola durable; sigue siendo un contenedor posterior.
3. Definir el procedimiento admin seguro para revisar, reactivar y purgar antes de construir UI.
4. Retirar o marcar explícitamente los stubs Background Sync/Push en un contenedor G7 separado.
5. Retirar el fallback `drive_file_id` y el legado de bibliotecas Drive solo tras evidencia completa.
6. Preparar las enmiendas documentales de ADR-002, ADR-005, ADR-024 y ADR-028 sin borrar historial.
7. Fijar el navegador desktop mínimo para la aceptación visual de G6.

Hasta resolver las decisiones técnicas anteriores, este documento no autoriza cambios de esquema, borrados, migraciones, commits, pushes ni despliegues.

## 22. Registro de cambios del plan

- **2026-08-03:** primera versión ampliada a partir de las decisiones 1C, 2B, 3A+, 4B y 5D.
- Se añadieron matrices explícitas de borrado, Drive, iconografía, responsive, Service Worker, aceptación y rollback tras revisión independiente.

## 23. Contrato consolidado de decisiones G2 — aprobado por Edu

**Fecha de consolidación:** 3 de agosto de 2026  
**Naturaleza:** contrato de política; no ejecuta migraciones, purgas, commits, pushes ni despliegues.

### 23.1 Borrado, archivado y restauración

1. `entries` y `tracks` usan soft-delete y quedan ocultos de la UX normal.
2. `playlists`, `drops`, `eras` y `time_capsules` usan archivado/soft-delete; no hard-delete desde la UX normal.
3. `queue_items` puede eliminarse físicamente porque es estado derivado y recreable.
4. `events` no se editan ni borran desde la UX normal.
5. Entries, tracks, archivos asociados y entidades archivadas tienen una ventana de restauración de **30 días**.
6. La restauración de entries/tracks y el archivado/restauración de playlists/drops/eras/cápsulas son operaciones exclusivas de Edu/admin; no habrá papelera pública para usuarios.
7. Tras 30 días el elemento deja de ser restaurable. Si no se purga, permanece oculto/retendido y requiere revisión administrativa.
8. La purga física de R2 solo puede ejecutarla Edu/admin, de forma manual, selectiva, explícita y auditada.
9. Al superar la retención, la purga es selectiva por entidad; no se autoriza una purga automática global.
10. Los archivos huérfanos se conservan 30 días desde su detección/clasificación y después entran en revisión selectiva; no se borran por inferencia.

### 23.2 Reglas de archivos y R2

11. La purga conjunta elimina entidad, fila `files` y objeto R2 solo cuando el archivo pertenece exclusivamente a esa entidad.
12. Si un archivo está referenciado por más de una entidad, se purga la entidad seleccionada pero se conserva el archivo y se marca para revisión; nunca se duplica ni se borra automáticamente.
13. Antes de purgar se debe demostrar el alcance: entidad, IDs, referencias, tamaño, objeto R2 y ausencia de propietarios adicionales.
14. La confirmación administrativa debe mostrar un resumen de impacto y advertir que la purga es irreversible.
15. Un snapshot D1 y un manifiesto R2 verificables son obligatorios antes de cada purga normal.
16. Si el snapshot falla, solo se permite una purga individual de una entidad lógica y sus referencias directas, con confirmación administrativa adicional, motivo obligatorio y registro explícito del fallo del snapshot. Nunca se permite lote en esa excepción.
17. La excepción sin snapshot no puede utilizarse si fallan las comprobaciones de consistencia, autorización, propiedad exclusiva o idempotencia.

### 23.3 Consistencia distribuida D1/R2

18. Toda operación de purga tiene un `operation_id` único y es idempotente.
19. Si D1 se actualiza y R2 falla, se registra la inconsistencia y se crea una reparación durable para reintento; no se repite a ciegas la operación completa.
20. Si R2 se borra y D1 falla, se bloquea y escala la operación; no se continúa modificando datos automáticamente.
21. La cola de reparaciones será una tabla D1 dedicada, no memoria del isolate ni un `setTimeout`.
22. La cola tendrá estados mínimos `pending`, `retrying`, `needs_admin`, `completed` y `blocked`, además de `operation_id`, entidad, referencias, intentos, próximo reintento, último error, timestamps y resolución administrativa.
23. La cola tendrá protección contra concurrencia mediante lease/lock temporal y restricción única de `operation_id`.
24. Solo se reintentarán automáticamente fallos transitorios. Errores permanentes —autorización, objeto inexistente, datos inválidos o referencia ambigua— pasan directamente a `needs_admin` o `blocked`.
25. Las reparaciones reintentables tendrán **3 intentos**, backoff progresivo con jitter y una ventana máxima de **24 horas**. Después pasan a `needs_admin`.
26. La reactivación de una tarea `needs_admin` será una acción explícita de Edu/admin con motivo; nunca se reactivará automáticamente al detectar cambios externos.
27. Cada reparación se procesará en lotes pequeños y acotados, con métricas y visibilidad de tareas bloqueadas; no se permitirá que una tarea fallida bloquee toda la cola.

### 23.4 Auditoría y retención

28. Las operaciones administrativas registrarán, como mínimo: actor, entidad, `entity_id`, operación, fecha/hora, motivo, resultado, `operation_id` y referencia R2 sanitizada cuando aplique.
29. No se guardarán tokens, claves, contenido privado ni URLs firmadas en la auditoría.
30. La auditoría administrativa es append-only y se conservará durante **1 año**; la retención no autoriza borrado individual desde la UX.
31. La purga de registros de auditoría vencidos será una tarea administrativa separada, por lote controlado, y dejará constancia agregada de su ejecución.
32. El registro de auditoría de purga debe existir antes de iniciar la operación; si no puede escribirse, la operación se aborta.

### 23.5 Modelo de autorización y aceptación

33. Los endpoints de restauración, archivado administrativo, purga, cola y reactivación serán admin-only; el control se hará en Worker, no solo en la interfaz.
34. Toda operación destructiva requiere autorización, resumen de impacto, confirmación explícita, snapshot/manifiesto cuando corresponda y resultado verificable.
35. La implementación futura deberá añadir tests de autorización, expiración de retención, propiedad exclusiva de R2, archivos compartidos, idempotencia, concurrencia, fallos D1/R2, reintentos y auditoría.
36. Antes de la primera migración se prepararán SQL aditivo, snapshot remoto reciente, dry-run, rollback y plan de despliegue controlado. La tabla de reparaciones no se crea en producción por este documento.

### 23.6 Decisiones técnicas fijadas por recomendación

- La auditoría administrativa será una tabla separada `admin_audit_log`, para no mezclar métricas de producto con operaciones sensibles.
- La cola se ejecutará mediante el handler `scheduled` del Worker, sujeto a verificación de configuración y tests; actualmente `wrangler.toml` declara el directorio de migraciones, pero todavía no configura un trigger cron ni el handler `scheduled`.
- La primera superficie administrativa será un endpoint/procedimiento seguro y auditable. La UI admin se pospone hasta validar el contrato y la API.

**No-go:** este contrato no autoriza borrar el archivo huérfano conocido, purgar R2, añadir columnas, crear tablas, cambiar endpoints, desplegar Worker ni modificar datos vivos. Es la especificación que debe preceder a esas acciones.

## 24. Precisiones obligatorias antes de implementar G2

La revisión independiente identificó estas condiciones técnicas. Son parte del contrato y deben resolverse en la spec/SQL antes de cualquier migración:

### 24.1 Reloj, estados y origen de la retención

- Todos los timestamps de retención se almacenarán y compararán en UTC, en formato ISO-8601 o `datetime('now')` documentado de forma uniforme.
- La fecha de inicio será `deleted_at` para entries/tracks y `archived_at` para entidades archivables. No se calculará desde `updated_at`, `created_at` ni desde la fecha de detección salvo para huérfanos aún no clasificados.
- Para archivos huérfanos, el plazo empieza en `orphan_detected_at`, generado por una clasificación no destructiva y auditable.
- Las entidades ya eliminadas/archivadas antes de la migración no se reasignarán automáticamente a una fecha inventada. Requieren una decisión de backfill documentada; mientras tanto quedan fuera de cualquier purga automática y solo pueden revisarse manualmente.
- `archived` y `soft-delete` no son sinónimos: la spec debe definir por entidad el campo, estados permitidos, consultas de visibilidad, restauración y expiración.

### 24.2 Archivos compartidos y claves foráneas

- Antes de purgar una entry con archivos compartidos, la operación debe desvincular explícitamente `files.entry_id` dentro de una transacción D1 o equivalente seguro, porque la FK actual usa `ON DELETE CASCADE`.
- Para tracks, se respetará `ON DELETE SET NULL`, pero la operación debe conservar la fila `files` y marcarla para revisión.
- La fila `files` conservada tendrá que quedar identificada como huérfana/compartida mediante un campo aprobado en la migración o mediante una tabla de incidencias; no se confiará en una inferencia posterior.
- Si no puede demostrarse la desvinculación segura antes del borrado, se bloquea la purga de la entidad.

### 24.3 Auditoría frente a eventos de producto

- `events` seguirá siendo el registro de producto/estadística y conservará su semántica append-only actual.
- La auditoría administrativa se implementará preferentemente como tabla separada `admin_audit_log`, también append-only, con retención de un año. No se mezclará con métricas de reproducción, drops o entries.
- La auditoría debe escribirse de forma confirmada antes de iniciar una operación destructiva. El helper actual `emitEvent`, que es fire-and-forget, no sirve por sí solo para este requisito; se necesitará una operación transaccional o un estado durable que impida purgar sin registro previo.
- La purga de auditoría vencida será una operación administrativa separada y nunca se ejecutará desde la UX normal.

### 24.4 Fallos distribuidos D1/R2

- Si R2 confirma el borrado y D1 falla, el estado será `blocked_r2_deleted_d1_pending`; no se volverá a intentar borrar R2.
- La cola D1 guardará la evidencia del objeto R2 borrado, la sentencia/operación D1 pendiente y el último error. La reconciliación será administrativa: completar el estado D1, restaurar desde backup si existe o declarar formalmente el objeto no recuperable.
- Si D1 se actualiza y R2 falla, el estado será `retrying_r2_delete` durante los tres intentos/24 horas; después `needs_admin`.
- Ninguna transición podrá ocultar la inconsistencia ni tratar como éxito una operación parcialmente completada.

### 24.5 Excepción por snapshot fallido

- Una purga sin snapshot solo podrá afectar a un único padre lógico y sus referencias directas.
- Antes de borrar se congelará un manifiesto de alcance con IDs, claves R2, tamaños, referencias y hash del manifiesto.
- La operación llevará el motivo técnico `snapshot_failed_exception` y una confirmación administrativa adicional.
- Si no se puede generar o hashear el manifiesto, la excepción queda prohibida y la purga se aborta.

### 24.6 Cola durable y concurrencia

- La spec de la tabla de reparaciones debe definir transiciones válidas, lease temporal, expiración del lease, límites de lote, quién puede pasar `blocked`/`needs_admin` a `retrying`, y cómo se evita que una tarea bloqueada detenga las demás.
- `operation_id` tendrá restricción única. Un reintento debe devolver el estado existente o avanzar la misma operación, nunca crear una segunda purga.
- La ejecución programada deberá ser durable y observable; no se aceptan memoria del isolate, `setTimeout` ni promesas flotantes como mecanismo de cola.

Estas precisiones no añaden nuevas decisiones de producto: convierten las decisiones 1–26 en requisitos técnicos verificables.

## 25. Defaults técnicos adoptados para continuar sin nuevas microdecisiones

Edu ha indicado que se sigan las recomendaciones y buenas prácticas para las decisiones restantes. Se adoptan estos defaults, sujetos a revisión antes de migrar:

1. **Reactivación:** únicamente Edu/admin, mediante acción explícita con motivo. Reactivar una tarea reutiliza el mismo registro y `operation_id`; los intentos se conservan en una tabla histórica `repair_attempts`. Solo se creará una operación sucesora si cambia el alcance material, y quedará enlazada mediante `parent_operation_id`.
2. **Auditoría:** tabla separada `admin_audit_log`, append-only, retenida un año. Los eventos de producto permanecen separados y no se recortan por esta decisión.
3. **Cola:** ejecución mediante `scheduled` del Worker, en lotes pequeños y con límites de duración. No se usará memoria del isolate, `setTimeout` ni promesas flotantes.
4. **Estados de reparación:** `pending → retrying → completed`; `retrying → needs_admin` al alcanzar 3 intentos o 24 horas; cualquier ambigüedad de propiedad, autorización o referencia pasa a `blocked`; `needs_admin/blocked → retrying` solo por Edu/admin; cualquier estado terminal conserva el historial.
5. **Lease:** cada tarea en procesamiento tendrá `lease_owner` y `lease_until` en UTC. Un lease vencido puede ser reclamado por otro worker; la reclamación se audita y no duplica efectos gracias a `operation_id` y comprobación de estado.
6. **Tamaño de lote:** máximo 10 tareas por ejecución programada y máximo una operación de purga por tarea. Una tarea fallida no impide continuar con las demás.
7. **Auditoría previa:** la intención de purga se registra en `admin_audit_log` antes de tocar R2. Si ese registro confirmado falla, la operación aborta. El resultado final se registra como una segunda entrada vinculada al mismo `operation_id`.
8. **Máquina D1/R2:** la purga no se tratará como transacción atómica entre servicios. El estado persistirá en `repair_queue` con `kind='purge'` y una `purge_phase`: `planned → d1_prepared → r2_pending → r2_deleted → d1_finalized`. `d1_prepared` solo registra y congela el alcance en una transacción D1; no borra ni vuelve visible la entidad. Las entidades ya están ocultas por soft-delete/archivado. Los estados de error serán explícitos y tendrán reconciliación admin.
9. **Archivos compartidos:** se añadirá una relación explícita `file_references` para representar propietarios y referencias de D1/JSON (`file_id`, `owner_type`, `owner_id`, `source`, `source_path`). `files` seguirá siendo metadata del objeto, no el único modelo de ownership. La migración deberá eliminar la dependencia de `ON DELETE CASCADE` para el camino de archivos compartidos mediante reconstrucción SQLite revisada, backfill exacto y rollback; no se cambiará la FK sin SQL revisado.
10. **UI administrativa:** primero se implementará un endpoint/procedimiento admin seguro y auditable. La pantalla admin queda fuera del primer contenedor para no ampliar superficie antes de validar la política.
11. **Service Worker:** los stubs Background Sync/Push no se presentarán como capacidades activas. Se retirarán o marcarán explícitamente como fuera de alcance en un contenedor G7 separado; no se mezclan con G2.
12. **Drive legacy:** no se retira por inferencia. Se conservará como adapter marcado hasta completar conteos, consumidores, prueba R2 y plan de retirada; Google seguirá siendo solo autenticación.
13. **Snapshot verificable:** incluirá export SQL D1 completo o alcance D1 demostrable, manifiesto R2 con clave, tamaño, hash disponible y timestamp UTC, y un procedimiento de restauración probado localmente. Los artefactos tendrán SHA-256, identificador inmutable y almacenamiento fuera de la ruta que se va a purgar; los secretos y datos privados no se imprimirán ni se versionarán.

Estos defaults permiten seguir con la **spec técnica y el diseño de migración**, pero no autorizan todavía aplicar SQL remoto, purgar datos, retirar legacy, desplegar ni construir la UI administrativa.

## 26. Spec técnica G2 — diseño previo a SQL

Esta sección es diseño revisable. No es una migración ejecutable y no debe copiarse directamente contra D1 remoto.

### 26.1 Campos y estados por entidad

| Entidad | Campos/estado a añadir o normalizar | Visibilidad normal | Restauración | Inicio de retención |
|---|---|---|---|---|
| `entries` | Mantener `is_deleted`; añadir `deleted_at`, `deleted_by` | `is_deleted = 0` | Admin durante 30 días | `deleted_at` |
| `tracks` | Mantener `is_deleted`, `deleted_at`, `deleted_by` | `is_deleted = 0` | Admin durante 30 días | `deleted_at` |
| `playlists` | Añadir `archived_at`, `archived_by`, `archive_reason` | `archived_at IS NULL` | Admin durante 30 días | `archived_at` |
| `drops` | Añadir `archived_at`, `archived_by`, `archive_reason` | `archived_at IS NULL` | Admin durante 30 días | `archived_at` |
| `eras` | Añadir `archived_at`, `archived_by`, `archive_reason` | `archived_at IS NULL` | Admin durante 30 días | `archived_at` |
| `time_capsules` | Añadir `archived_at`, `archived_by`, `archive_reason` | `archived_at IS NULL` | Admin durante 30 días | `archived_at` |
| `files` | Añadir `orphan_detected_at`, `shared_review_required`, `review_status` solo mediante migración revisada | No se muestra como archivo activo sin padre válido | No aplica como entidad de producto | `orphan_detected_at` |

La tabla es una propuesta de diseño: antes de escribir SQL se debe comprobar compatibilidad con todas las consultas, FK y endpoints. Para entidades históricamente borradas/archivadas sin fecha fiable no se inventará una fecha; quedan en revisión manual.

### 26.2 Tabla `admin_audit_log`

La retención de un año descrita aquí aplica a `admin_audit_log`, no a los eventos de producto de `events`.

Diseño mínimo propuesto:

- `id` entero/autoincremental o UUID monotónico;
- `operation_id` único;
- `actor_user_id` FK a `users`;
- `action` (`archive`, `restore`, `purge_plan`, `purge_start`, `purge_result`, `repair_retry`, `repair_block`, `retention_sweep`);
- `entity_type`, `entity_id`;
- `reason` obligatorio para acciones administrativas;
- `result` (`planned`, `started`, `completed`, `failed`, `blocked`);
- `details_json` sanitizado, sin secretos, contenido privado ni URLs firmadas;
- `r2_manifest_hash` nullable;
- `created_at` UTC;
- índice por `operation_id`, actor y fecha.

La tabla será append-only desde la aplicación. La retención de un año aplica a esta tabla, no implica recortar `events` de producto. La eliminación de registros vencidos será una tarea admin separada y auditada.

### 26.3 Tabla `repair_queue`

`repair_queue` será la fuente persistente del estado tanto de reparaciones como de purgas parciales; no se creará una tabla de estado paralela para la máquina D1/R2. Para una purga, `kind='purge'` y `purge_phase` describen la fase distribuida, mientras `state` describe el ciclo de procesamiento (`pending`, `retrying`, `needs_admin`, `completed`, `blocked`).

Diseño mínimo propuesto:

- `id` entero/autoincremental;
- `operation_id` único;
- `parent_operation_id` nullable para reactivaciones sucesoras;
- `kind` (`r2_delete_retry`, `d1_finalize`, `reconcile_r2_deleted_d1_pending`);
- `entity_type`, `entity_id`;
- `r2_key` y `file_id` nullable, nunca secretos;
- `state` (`pending`, `retrying`, `needs_admin`, `completed`, `blocked`);
- `attempt_count` entero por defecto 0;
- `first_failed_at`, `next_attempt_at`, `last_attempt_at`, `lease_until` UTC;
- `lease_owner` nullable;
- `last_error_code`, `last_error_message` sanitizado;- `payload_json` limitado y validado;
- `purge_phase` nullable (`planned`, `d1_prepared`, `r2_pending`, `r2_deleted`, `d1_finalized` y fases de error);
- `resolution`, `resolved_by`, `resolved_at` nullable;
- `repair_attempts` separado y append-only para conservar cada intento automático y reactivación admin;

- `created_at`, `updated_at` UTC.

Transiciones válidas:

```text
pending -> retrying | blocked
retrying -> retrying | completed | needs_admin | blocked
needs_admin -> retrying | completed | blocked   (solo admin)
blocked -> retrying | completed                  (solo admin y con motivo)
completed -> [terminal]
```

Un lease vencido puede reclamarse mediante una actualización condicional equivalente a `UPDATE ... WHERE id=? AND (lease_until IS NULL OR lease_until < now) AND state IN (...)`; si afecta cero filas, otro worker ganó la carrera. La reclamación no tiene efectos R2. `operation_id` y estado se comprueban antes de cada efecto. Máximo 10 tareas por ejecución programada y una operación de purga por tarea.

### 26.4 Máquina de estados de purga

La operación de purga se modela separando D1 y R2. El estado canónico vive en la fila `repair_queue` de la propia operación:

```text
planned
  -> d1_prepared
  -> r2_pending
  -> r2_deleted
  -> d1_finalized
```

Durante todas las fases la entidad sigue oculta: una entry mantiene `is_deleted=1`, un track mantiene `is_deleted=1` y una entidad archivada mantiene `archived_at IS NOT NULL`. Si el proceso falla, no existe transición que la haga visible automáticamente. `d1_prepared` congela el manifiesto y registra el plan; `d1_finalized` aplica el borrado lógico/físico D1 final conforme al alcance aprobado.

Estados de fallo:

- `blocked_snapshot_failed`: el snapshot normal no pudo verificarse; solo la ruta excepcional puede continuar.
- `blocked_shared_reference`: existe una referencia compartida o ambigua.
- `retrying_r2_delete`: D1 quedó preparado y R2 falló transitoriamente.
- `needs_admin_r2_delete`: agotados 3 intentos o 24 horas.
- `blocked_r2_deleted_d1_pending`: R2 se borró y D1 no pudo finalizar; no se toca R2 otra vez.
- `completed`: D1 y R2 consistentes, o archivo retenido explícitamente por ser compartido.

`d1_prepared` no significa “borrado final”: significa que las filas y referencias han sido marcadas para la operación y que el manifiesto quedó vinculado. La implementación deberá elegir entre transacción D1 y compensación explícita según cada FK; no se afirmará atomicidad entre D1 y R2.

### 26.5 Archivos compartidos y huérfanos

`file_references` será la fuente de verdad de ownership/refencias para decidir si un objeto es exclusivo, compartido o huérfano. Las referencias JSON se backfillearán solo cuando la coincidencia sea exacta y única; las ambiguas pasan a `shared_review_required`.

Antes de purgar una entry se comprobarán:

1. filas `files` por `entry_id`;
2. filas `files` por `track_id`;
3. referencias `images[*].r2_key` en `entries.content`;
4. referencias `thumbnail`/`r2_key` en tracks;
5. cualquier otra referencia documentada en el esquema.

Si un archivo tiene más de un propietario lógico o una referencia ambigua, se marca `shared_review_required`/incidencia y no se borra R2. Como la FK actual `files.entry_id ON DELETE CASCADE` podría eliminar la fila, la implementación debe desvincularla antes o cambiar la relación mediante una migración revisada. Nunca se resolverá con un `DELETE` directo.

Los huérfanos históricos, incluidos los 528 files identificados en G1, no se someten a esta política hasta completar su clasificación no destructiva y fijar `orphan_detected_at` verificable.

### 26.6 Cron y autorización

El Worker deberá incorporar un handler `scheduled` solo después de probarlo localmente con `wrangler dev --test-scheduled` o equivalente validado. Actualmente `wrangler.toml` y `workers/worker.js` no lo configuran; esta capacidad será un contenedor posterior y no se considera activa. El cron no puede ejecutar operaciones admin destructivas por sí mismo: solo procesa reparaciones ya autorizadas y tareas de retención que tengan alcance y auditoría previa.

Los endpoints admin deberán comprobar en Worker que el actor autenticado corresponde a una sesión admin y que `users.role = 'admin'`; no basta con ocultar controles en frontend. El acceso por clave admin debe resolver al mismo actor/rol autorizado y quedar cubierto por tests. El procedimiento inicial recomendado es:

1. `POST` admin para planificar operación y devolver resumen;
2. `POST` admin para confirmar con `operation_id` y snapshot/manifiesto;
3. worker ejecuta/reintenta según la máquina de estados;
4. `GET` admin para inspeccionar resultado, incidencias y auditoría.

### 26.7 Snapshot y recuperación

El snapshot normal será un artefacto versionado fuera del repo y fuera del bucket/prefijo que se purga, con export SQL D1, manifiesto R2, SHA-256 de cada artefacto y un índice con `operation_id`, timestamp UTC y alcance. Antes de autorizar la primera purga se hará una restauración local de una copia sintética o de prueba; la restauración remota solo se ejecutará mediante procedimiento admin separado. La excepción `snapshot_failed_exception` nunca elimina el requisito de congelar y hashear el manifiesto de alcance.

### 26.8 Criterios de salida de la spec

No se prepara SQL hasta tener:

- matriz final de campos por entidad y compatibilidad de FK;
- transición de estados revisada;
- estrategia para archivos compartidos;
- modelo explícito `file_references` y tratamiento de la FK `files` sin cascada destructiva;
- tabla `admin_audit_log` separada, con retención diferenciada de `events`;
- snapshot verificable y procedimiento de rollback/restauración local;
- tests de autorización, idempotencia, leases, expiración, D1/R2 parcial y reintentos;
- dry-run local con datos sintéticos;
- confirmación de que ningún endpoint normal puede activar purga admin.

