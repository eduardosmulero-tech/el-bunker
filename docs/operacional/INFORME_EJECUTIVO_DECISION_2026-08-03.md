# Informe ejecutivo para decisión — El Búnker

**Fecha:** 3 de agosto de 2026  
**Destinatario:** Edu  
**Propósito:** tomar una decisión informada sobre la siguiente etapa.  
**Naturaleza:** informe ejecutivo; no es un ADR ni sustituye al Kanban.

## Decisión recomendada

**Cerrar primero la release funcional R1–R4 y limpiar la UX visible antes de iniciar nuevas features, especialmente Playback Premium.**

La API está implementada, desplegada y probada contra D1/R2 reales. La release de usuario aún no está cerrada: falta confirmar que Vercel sirve el frontend del commit nuevo y aceptar los flujos desde la UI real, idealmente en Android.

## Semáforo ejecutivo

| Área | Estado | Significado |
|---|---|---|
| Worker/API | 🟢 | Desplegado y probado en producción. |
| D1/R2 | 🟢 | Flujos R1–R4 comprobados; pruebas temporales limpiadas. |
| Código frontend | 🟢 | Cambios publicados en Git; build correcto. |
| Frontend público | 🟡 | Carga, pero el bundle exacto del commit nuevo no está confirmado. |
| Aceptación desde UI | 🟡 | Falta probar los recorridos reales desde navegador/móvil. |
| UX/producto | 🟡 | G5 sustituyó iconografía funcional en superficies revisadas; aceptación visual completa sigue pendiente. |
| Plan operativo | 🟢 | G0–G8 están secuenciados y documentados; quedan gates de aceptación humana. |

## Alternativas

### A — Seguir con features

Pros: avance visible y continuidad del roadmap. Contras: se amplía sobre una release aún no aceptada y aumenta la deuda. **No recomendada.**

### B — Cerrar release + UX

Confirmar Vercel, aceptar R1–R4 desde UI/móvil, limpiar UX y alinear documentación. Reduce riesgo y convierte el backend verificado en producto usable. **Recomendada.**

### C — Refactor amplio

Eliminar Drive legacy, reorganizar monolitos y rehacer base. Puede mejorar mantenibilidad, pero tiene coste incierto y retrasa la aceptación. **No como primer paso.**

## Plan por gates

- **G0:** Edu define qué significa “terminado”, prioridad UX/fiabilidad, iconografía, alcance Android, política de borrado y módulo siguiente.
- **G1:** confirmar bundle Vercel; aceptar entry, MP3, reproducción/seek y cápsula desde UI; repetir con recarga y Android/PWA.
- **G2:** quitar emojis funcionales y textos técnicos/no pedidos; unificar idioma; sustituir prompts; corregir accesibilidad visible.
- **G3:** actualizar ESTADO, SESION, manual, ADR-028, INDEX, technical debt y roadmap para que documentación y realidad coincidan.
- **G4:** elegir Playback Premium, VAULT, MUSIC LAB, CAPSULES o higiene técnica con un contrato y criterio de salida.

## Decisión solicitada a Edu

1. Prioridad: features nuevas / **cierre release + UX recomendado** / refactor amplio.
2. Iconografía: mantener emojis / **sustituir emojis funcionales recomendado**.
3. Alcance: **Android móvil/PWA recomendado** / añadir desktop / añadir iOS.
4. Borrado: soft-delete actual / política por entidad recomendada / hard-delete.
5. Siguiente módulo tras el cierre: VAULT / MUSIC LAB / CAPSULES / higiene técnica.

## No-go

No iniciar Playback Premium ni otra expansión grande mientras no se conozca el bundle frontend en producción, la UI pierda datos al recargar, el MP3 no se conserve/reproduzca, la cápsula pierda contenido o Edu no haya aprobado la dirección visual.

---

## Registro técnico de soporte

# Registro para Edu — R1–R4

**Fecha:** 3 de agosto de 2026. Este documento es un registro de usuario, no un ADR.

## Qué se hizo

- **R1 VAULT:** la creación de entries pasó a `POST /api/entries`; el estado local se actualiza después de persistir.
- **R2 MUSIC LAB:** se crea primero el track, se reserva y sube el MP3 a R2 y se enlaza `r2_key`; hay limpieza best-effort si falla una etapa.
- **R3 CAPSULES:** se insertan y devuelven `capsule_items` de tipo `entry_ref` y `playlist_ref`.
- **R4 R2:** se implementó byte-range real: rangos válidos `206`, inválidos `416`, con `Content-Range`, `Content-Length`, `Accept-Ranges` y `ETag`.

También se eliminó un evento local duplicado de entries y se documentó `playlist_ref` en el esquema.

## Pruebas realizadas

Local: tests **28/28**, build correcto, ESLint dirigido sin errores, sintaxis de Workers correcta y dry-run Wrangler con D1/R2 correctos.

Producción:

- Worker: `https://el-bunker-api.thebunker-admin.workers.dev`.
- Versión: `3bc51c36-2cf3-4a0d-8770-634993f67303`.
- Access key válida `200`; inválida `401`.
- Entries, tracks y cápsulas leídos con `200`.
- Entry temporal crear/borrar `201/200`.
- Track, reserva upload, PUT binario y enlace a R2 `201/201/200`.
- Cápsula con contenido creada `201` y leída con `capsule_items`.
- R2 completo `200`, rangos válidos `206`, rango inválido `416`.
- Datos temporales finales: entries activos `0`, tracks activos `0`, files/R2 `0`, cápsulas `0`.

Los eventos de prueba permanecen por el contrato append-only de `events`.

## Git y publicación

Commit: `75093b6 feat: complete R1-R4 persistence and range support`.

Push realizado a `origin/master`; rama sincronizada. El commit contiene solo R1–R4 y el test de Range. Los informes de auditoría y `ESTADO.md` quedaron fuera.

## Qué falta

La API está actualizada. El código frontend está en Git, pero no publiqué manualmente Vercel porque no había credenciales ni proyecto `.vercel` enlazado localmente. La web pública carga sin errores de consola, pero falta confirmar que sirve el bundle del commit `75093b6`.

También falta aceptar los flujos desde la interfaz pública, idealmente en Android:

1. Crear entry y recargar.
2. Subir y reproducir un MP3 real.
3. Crear una cápsula con entry y playlist, recargar y abrirla.
4. Hacer seek en un track real.
5. Confirmar que no aparecen duplicados ni textos técnicos.

Riesgos conocidos en el estado previo de R1–R4: el rollback de tracks conserva soft-delete; la creación de entries usa varias operaciones D1; existía deuda visual (emojis, inglés, textos técnicos y `prompt/confirm`); quedaba código Drive de transición y documentación antigua. G5/G8 han actualizado parte de esa superficie; la aceptación visual final sigue pendiente.

## ¿Tenemos un plan real? — estado histórico del informe

> Esta sección conserva la pregunta y propuesta originales anteriores a la ejecución G0–G8. La secuencia operativa actual está documentada en `PLAN_REFACTOR_HIGIENE_2026-08-03.md` y en el acta/registro de esta sesión.

El roadmap histórico y la auditoría dieron origen al plan; la secuencia G0–G8 ya está documentada, con G6 parcial por falta de artefacto visual y G7/G8 cerrados localmente. Se conserva la propuesta original siguiente como contexto de decisión:

### Gate 0 — Decidir qué significa “terminado”

Edu decide si prima fiabilidad/UX o nuevas features; si se eliminan emojis funcionales; si el alcance sigue siendo Android móvil; y si soft-delete es política aceptada.

### Gate 1 — Cerrar release R1–R4

Confirmar bundle Vercel, aceptar desde la UI con access key, repetir con recarga, probar MP3/cápsula/seek en móvil y verificar Service Worker.

### Gate 2 — Limpieza de producto

Eliminar emojis funcionales y textos técnicos/no pedidos, unificar idioma, sustituir prompts nativos y corregir accesibilidad visible.

### Gate 3 — Documentación veraz

Actualizar `ESTADO.md`, `SESION.md`, manual, ADR-028, `INDEX.md`, technical debt y roadmap para que código, producción y documentos coincidan.

### Gate 4 — Elegir inversión

Después decidir entre playback premium, VAULT/galería, CAPSULES o higiene técnica. Mi recomendación: no iniciar Playback Premium antes de cerrar aceptación y limpieza visual.

## Decisiones para debatir

1. ¿Cerramos primero la release funcional o la limpieza visual?
2. ¿Eliminamos completamente los emojis de color?
3. ¿Mantenemos alcance Android móvil y no priorizamos desktop?
4. ¿Soft-delete es definitivo o se define por entidad?
5. ¿Qué merece prioridad: VAULT, MUSIC LAB o CAPSULES?

**Estado honesto actualizado (3-ago):** R1–R4 siguen implementados y verificados en API. G0–G5 y G7 están cerrados localmente; G8 quedó documentado. G6 tiene layout/overflow comprobados, pero no existe una captura/artefacto final legible para declarar aceptación visual, consola limpia, PWA instalada o CAST probado. No se hizo deploy, commit/push ni mutación D1/R2 en esta reanudación.

## Cierre técnico de la reanudación

- Suite final: **114/114 tests**, 18 archivos; lint, build, sintaxis SW/Worker y diff-check **OK**.
- G7: manifest resoluble; SmokeSession usa `/icons/icon-192.png`; `/api/` no se cachea; no hay Push/Background Sync; `/music/` conserva caching explícito.
- Documentación vigente: D1/R2 es persistencia; Google solo autentica; hay tres tabs; offline es limitado y no sincroniza automáticamente cambios.
- Pendientes no ocultos: aceptación visual/browser reproducible; prueba runtime de instalación/offline/update; Cloudflare 7403 y clasificación del único huérfano G2; decisión posterior sobre retirar facade Drive.
- Validación final del árbol local: **114/114 tests**, lint/build/sintaxis SW-Worker/diff-check OK. El escaneo funcional deja únicamente excepciones persistidas permitidas en Vault; MusicLab/Drops no conserva emojis funcionales activos.
