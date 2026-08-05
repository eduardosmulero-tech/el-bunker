# Plan de cierre verificable — Hermes/Fable — 2026-08-04

> Rama: `plan-cierre-hermes-2026-08-04`. Este documento separa evidencia histórica, código actual y validación pendiente. Un hallazgo de auditoría no se considera vigente sin revalidarlo contra el checkout actual.

## Norte

El Búnker debe permitir que Edu y David usen una app privada para escuchar su biblioteca, conservar recuerdos con fecha/lugar/contexto y revivirlos con música, Drops, galerías y cápsulas. No compite por catálogo global, publicidad, seguidores, recomendaciones masivas o podcasts.

**Cierre v1.0:** operaciones nucleares persistentes; MP3 reproducible; Range correcto; R2 sensible protegido; captura y lectura fiables en móvil; tres tabs (`VAULT`, `MUSIC LAB`, `CAPSULES`); reproductor/audio congelados salvo regresión crítica.

## Evidencia y estado actual

| Checkpoint | Resultado |
|---|---:|
| Tests al iniciar | 141 |
| Tests tras este contenedor | **178** |
| Lint | **PASS** |
| Build | **PASS** |
| Sintaxis Worker | **PASS** |
| `git diff --check` | **PASS** |
| Deploy/push/mutación D1-R2 en esta sesión | **No** |

Hermes dejó cinco capturas en `docs/operacional/auditoria_ui_2026-08-04/screenshots/`: `00_login_boot.png`, `00_login_panel_test_admin.png`, `01_vault_principal.png`, `01_vault_modo_reel.png` y `01_vault_lightbox.png`. `api/` y `logs/` están vacíos y no existe commit/hash de Hermes. Es evidencia parcial de UI/acceso, no una auditoría completa.

### Claims históricos ya corregidos en el código actual

- `POST /api/entries` ya está conectado desde `Vault.jsx`; F2-A cerró la escritura atómica y la respuesta canónica; la aceptación viva de recarga sigue pendiente.
- `useMusicActions.js` ya sube el archivo, conserva el vínculo `files.track_id` y actualiza `r2_key`; F2-B cerró ownership/MIME/Range en código y tests; falta prueba UI viva con MP3 real.
- `r2.js` ya implementa `206`, `Content-Range` y `416`; F2-B y el contenedor R2 cubren localmente Range/HMAC; fuera de `local/development`, la falta de secret falla cerrado; falta verificación desplegada con objeto real y secret configurado.
- `config.js` ya aplica whitelist y no expone presencia.
- Time Capsules ya persiste/lee `capsule_items`; el BUG-3 de REPETIDA_9 es histórico para este checkout.
- EntryLightbox, WALL, purge DEMO, R2 HMAC y silenciamiento de `track_updated` constan implementados/documentados.

## Contenedor ejecutado: Time Capsules — snapshot de playlist

La spec `docs/spec/capsulas_spec.md` exige `snapshot_track_ids` al sellar una playlist. `workers/routes/capsules.js` ahora:

- consulta D1 al sellar y captura `playlist_tracks` por `position`;
- persiste `{ playlist_id, snapshot_track_ids }` en `capsule_items.content`;
- ignora snapshots falsificados del navegador;
- devuelve `playlist_snapshots` en GET y POST;
- rechaza playlists inexistentes;
- rechaza fechas inválidas;
- impide desbloquear antes de `unlock_at` (`409`);
- mantiene idempotencia si ya está desbloqueada.

Cobertura: `workers/routes/__tests__/capsules.test.js`, once tests focales; suite global 152/152.

Contrato decidido: la visibilidad y el desbloqueo son compartidos entre Edu, David y admin; cualquier JWT autenticado puede consultar y desbloquear al llegar la fecha. La validación de `entry_ids`, ocultación locked, saneamiento de eventos nuevos, test de idempotencia y smoke D1 local real quedan cerrados en F1. El snapshot remoto previo registraba `time_capsules=0`, por lo que no hay eventos históricos de cápsulas que sanitizar.

## Matriz de cierre

### Integridad

| ID | Tarea | Estado | Evidencia requerida |
|---|---|---|---|
| A1 | Crear entry, recargar y confirmar fila D1 | **F2-A código cerrado; aceptación viva pendiente** | POST atómico + contrato de respuesta + Network/D1 antes/después |
| A2 | Subir foto y vincular `files.entry_id` | Parcial | POST/PUT + D1 + R2 |
| A3 | Mantener fecha real del recuerdo separada de upload date | Pendiente | fixture/render cronológico |
| A4 | MP3 UI → upload → track/r2_key → reproducción | **F2-B código cerrado; aceptación viva pendiente** | POST/PUT R2 + reserva propia + r2_key + Network/D1 + reproducción real |
| A5 | Range 206/416 sobre MP3 real | **Código y tests cerrados; MP3 real pendiente** | tests de ruta `206` + headers; falta objeto R2 autorizado |
| A6 | Items de cápsula | Hecho | `capsule_items` + tests + smoke D1 local |
| A7 | Snapshot playlist | Hecho F1 | nueve tests + smoke D1 local |
| A8 | Validar entries existentes/no borradas | Hecho F1 | 400 y cero batch |
| A9 | Contrato de visibilidad locked/unlocked y acceso compartido autenticado | Hecho F1 | respuesta/test locked + contrato decidido |
| A10 | Drops D4: decidir si se prohíbe `to_user = from_user` | Pendiente | spec + test |

### Backend/seguridad

| ID | Tarea | Estado |
|---|---|---|
| B1 | Access key → JWT → carga real | Parcial; capturas Hermes |
| B2 | Config público sin presencia | Código hecho; falta verificación desplegada |
| B3 | R2 sensible con HMAC/JWT | **HMAC y fail-closed probados localmente; curl desplegado pendiente** |
| B4 | Confirmar `R2_SIGN_SECRET` sin imprimir secreto | **Pendiente operativo: confirmar presencia en Worker sin revelar valor** |
| B5 | Timeline sin nuevo ruido `track_updated` | Código/documentado |
| B6 | Backfill G2 | Hecho previamente: 1054 refs, 0 colgantes, baseline intacto |
| B7 | Cápsulas: autorización de consulta/desbloqueo entre Edu/David/admin | **Contrato decidido:** compartida Edu/David/admin; cualquier JWT autenticado puede consultar/desbloquear al llegar la fecha | test de contrato + validación final |

### UX/personalización

| ID | Tarea | Estado |
|---|---|---|
| C1 | Checklist Hermes completo con logs/API | Pendiente |
| C2 | Android físico 390×844: header, safe-area, overflow, controles | Pendiente |
| C3 | EntryLightbox: swipe, pinch, metadata en modos | Pendiente físico |
| C4 | WALL museo por eras | Código; aceptación visual pendiente |
| C5 | Preservar tokens, eras, tags, vibes, modos | Hecho base; no rediseñar |
| C6 | Eliminar debug visible, `prompt()`/`confirm()` | Pendiente |
| C7 | Presets visualizador por vibe/BPM | Diferido hasta core |

### Offline/playback

| ID | Tarea | Estado |
|---|---|---|
| D1 | Shell PWA/offline | Parcial; falta dispositivo |
| D2 | Descarga local real de tracks/playlists | Decidido; implementación pendiente |
| D3 | Reanudación y reconciliación de playlist | Pendiente |
| D4 | Sesión previa permite offline tras JWT caducado | Decidido; prueba Android pendiente |
| D5 | MediaSession, lockscreen, auriculares, kill/resume | Código base; Android pendiente |
| D6 | Cast bajo demanda | Código parcial; dispositivo pendiente |
| D7 | No tocar `PlayerContext`, `WinampPlayer`, `AudioVisualizer` salvo P0 | Regla activa |

## Orden y gates

### F0 — verdad documental (en curso)
Rama aislada, cambios R11 y artefactos Hermes preservados; claims antiguos marcados como históricos; no PASS sin evidencia. **Gate:** plan y baseline reproducibles.

### F1 — integridad de Capsules — **HECHO Y VALIDADO**
Validar `entry_ids`; ocultar referencias y snapshots locked; reducir `capsule_created` a título/recuentos; persistir automáticamente el desbloqueo al llegar la fecha; emitir un único evento mediante compare-and-set atómico; validar contra D1 local real con schema, FK y cascada. **Gate cerrado:** ninguna cápsula nueva con referencia inválida, ningún ID de contenido en el evento de creación, snapshot ordenado, `capsule_items` en cascada y desbloqueo trazable. El contrato compartido Edu/David/admin queda decidido.

### F2 — flujos core
**F2-A — creación de entries: HECHO en código y validado.** `Vault` envía el payload de `AddEntryForm`, el Worker persiste entry/tags/file links/evento en un único `DB.batch`, y devuelve el `type` saneado y timestamps canónicos. El formulario conserva el borrador y muestra error si falla la persistencia. Cobertura focal: 16 tests de validación + WorkerDataService; suite global posterior: 164/164. Falta la aceptación viva POST → recarga con Network/D1.

**F2-B — upload y reproducción MP3: HECHO en código y validado.** `FileUploadService` reserva/sube el binario con MIME real; `upload.js` valida prefijos, ownership de `track_id`, reserva propia para PUT y rollback; `tracks.js` exige `music/` y reserva `files.track_id` del mismo usuario/track, devuelve respuesta canónica y emite evento con título saneado; `r2.js` conserva Range `206/416`. Cobertura: `media.test.js`, `FileUploadService.test.js`, `MusicPayloadBuilder.test.js`, `r2.test.js`; evidencia viva Hermes: MP3 sintético → D1 `r2_key` → R2 200 → Range 206 → limpieza confirmada. Falta reproducción real no bloqueada por headless.

**R2 sensible — HECHO en código/tests; despliegue pendiente.** HMAC firma/verifica path+TTL; tokens alterados/expirados fallan; URLs sensibles de entries son verificables; rutas sensibles devuelven 404 antes de leer R2 si el token no es válido; fail-closed aplica a todo entorno salvo `local/development` explícito sin secret. Además, entries sanea y elimina `r2_key` sensibles cuando no puede firmarlas fuera de desarrollo. No se ha inspeccionado ni modificado ningún secret remoto. B3/B4 permanecen pendientes de curl y confirmación operativa segura.

Siguiente: confirmar `R2_SIGN_SECRET` en el Worker sin mostrar su valor y ejecutar un GET autorizado/no autorizado sobre una clave sensible sin guardar token; después cerrar F2 con la aceptación visual/móvil pendiente. **Gate:** capturar, subir, reproducir y buscar sin pérdida. La integración A1/B2 ya está realizada en `3ee54dc`; lo pendiente aquí es la aceptación operativa/visual, no el wiring local.

## Ola 1 Luna — A1 + B2 (5-ago-2026)

La reconciliación con Sonnet/Opus confirmó que el plan paralelo se respetó: A1 y B2 fueron reclamadas en worktrees independientes del carril `luna`, sin tocar `workers/worker.js` dentro de sus tarjetas, y ambas tarjetas quedaron `done` con commit propio. La integración posterior del router está documentada como excepción solicitada por Edu en la matriz de `docs/planes/ENTREGABLE_COORDINADOR_LUNA_2026-08-05.md`.

- **A1 — `classified_items` + `files.blurhash`: HECHO en su rama Luna.** Commit `e74e122`. Incluye `migrations/0002_classified_items.sql`, rollback explícito `migrations/0002_classified_items.rollback.sql.txt`, `workers/routes/classify.js` y 13 tests focales. La migración se aplicó sobre schema base en D1 local, se verificó la tabla/columna y se ejecutó rollback con ambas ausentes después. Worktree limpia; suite de la rama: **191/191**, lint/build/sintaxis/diff-check verdes.
- **B2 — `requireAdmin` + esqueleto `/api/admin/*`: HECHO en su rama Luna.** Commit `8387460`. Incluye `workers/utils/require-admin.js`, `workers/routes/admin.js` y 6 tests focales. `admin` atraviesa la guardia al placeholder 404; identidad ausente y `edu` reciben 403 antes de `DB.prepare()`. Worktree limpia; suite de la rama: **182/182**, lint/build/sintaxis/diff-check verdes.
- **Integración fuera de contrato — hecha por petición expresa de Edu:** en un commit separado del trabajo Luna se registraron `classify.js` y `admin.js` en `workers/worker.js`, se preservó `/api/admin/g2` antes de `/api/admin/`, se añadieron `item_classified`/`item_unclassified` a `EVENT_TYPES`, se bloquearon esos eventos en `POST /api/events` para que solo los emita `classify.js` y se actualizó schema a `1.1.0` mediante `migrations/0003_schema_version_1_1_0.sql`. La justificación cambio/razón/riesgo/aprobación está en `docs/planes/ENTREGABLE_COORDINADOR_LUNA_2026-08-05.md`; evidencia de integración en `workers/__tests__/router-contract.test.js` y commit `3ee54dc`. El coordinador debe revisar explícitamente este bloque porque no pertenecía al ámbito A1/B2. Validado localmente no equivale a autorizado para merge/deploy/migración remota.
- **B1 Opus:** la tarjeta sigue `running`; el worktree contiene `apiClient` (`2ab6951`) y un contrato de tests posterior (`4bc8ec7`), pero no la entrega final de `admin-core`. No se presentó como terminado ni se mezcló aquí.

El checkout principal conserva el contenedor R2 anterior y la integración local sin mutaciones remotas. La validación final de este bloque se registra en el entregable y en el commit de integración; no hubo deploy, push ni mutación D1/R2 remota en esta continuación.

### F3 — aceptación visual
Hermes debe entregar checklist de tres tabs, logs de consola/red, viewport y capturas por modo. Repetir en Android físico; revisar Lightbox, WALL, safe-area, modales y overflow. **Gate:** capturar y revivir sin sensación de app rota.

### F4 — offline/dispositivo
Diseñar almacenamiento de audio separado del shell SW; estados de descarga; resume tras kill/red; playlist cambiante; reproducción sin red con JWT caducado; lockscreen/batería. **Gate:** descargas reproducibles offline en Android.

### F5 — cierre
Housekeeping visible, docs sincronizados, suite/lint/build/sintaxis/diff-check, revisión independiente. Deploy solo con autorización explícita de Edu.

## Fuera de alcance ahora

Catálogo externo, recomendaciones globales, social público, publicidad/pagos/licencias, podcasts/letras, self-hosting, passkeys, cifrado cliente completo y formatos HEIC/RAW no bloqueantes.

## Riesgos

- Hermes incompleto: no elevar capturas a PASS global.
- Histórico stale: revalidar símbolo/endpoint.
- D1/R2: solo lectura salvo autorización, snapshot y rollback.
- Android real: headless no sustituye dispositivo.
- Player congelado: revisar diff para no tocarlo.
- Evidencias: no guardar JWT, secretos, URLs firmadas ni contenido privado innecesario.

## Checkpoint de esta sesión

Rama creada; plan materializado; C-01 + F1 + F2-A + F2-B + R2 sensible implementados y validados localmente. Incluye guardas de fecha/desbloqueo, validación de entries, ocultación locked, evento sin referencias, desbloqueo automático atómico, idempotencia, creación atómica de entries, contrato endurecido de upload/track/R2 (ownership, MIME, reserva `files.track_id`, respuesta canónica y Range) y HMAC fail-closed para contenido sensible. La integración A1/B2 fuera de contrato quedó cerrada en `3ee54dc` y documentada/justificada en `3996625` y su actualización posterior; su validación local está verde. Pendiente: aceptación operativa R2, aceptación visual/móvil y revisión del coordinador de la excepción solicitada por Edu. Contrato decidido: cápsulas compartidas entre Edu/David/admin. Hermes tiene checklist, informe, logs y siete capturas; su evidencia viva cubre MP3/Range, no R2 sensible. Secret remoto no inspeccionado ni modificado. Sin `PlayerContext`, sin deploy ni mutación remota adicional.
