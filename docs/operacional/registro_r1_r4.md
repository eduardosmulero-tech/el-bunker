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

Riesgos conocidos: el rollback de tracks conserva soft-delete; la creación de entries usa varias operaciones D1; persiste deuda visual (emojis, inglés, textos técnicos y `prompt/confirm`); queda código Drive de transición y documentación antigua.

## ¿Tenemos un plan real?

Tenemos un roadmap histórico y una auditoría, pero todavía no una secuencia operativa aprobada. Propongo estos gates:

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

**Estado honesto:** R1–R4 están implementados, publicados en API, verificados técnicamente y enviados a GitHub. Falta confirmar frontend y aceptación visual/móvil.

---

# Anexo — Cierre técnico G5 (3 de agosto de 2026)

**Plan:** `PLAN_REFACTOR_HIGIENE_2026-08-03.md`  
**Estado:** código G5 verificado localmente; aceptación visual final pendiente de capturas.

## Qué se cerró

- Iconos funcionales revisados centralizados en `src/core/ui/Icon.jsx` en los módulos tratados.
- Los dos glyphs funcionales `⌕` de búsqueda de `src/musiclab/MusicLab.jsx` fueron sustituidos por `Icon(search)` y sus botones tienen `aria-label` explícito.
- Se añadió `shuffle` al adaptador de iconos y se corrigió el control Shuffle de Winamp.
- `Icon` acepta `fill`, conserva `fill="none"` por defecto y usa un único fallback `CircleHelp`.
- El corazón de escucha compartida diferencia contorno inactivo y estado activo mediante `fill`.
- Los valores de iconos persistidos/configurables de tags y categorías se conservaron; no hubo migración destructiva de datos.
- No se tocó el motor único de audio ni se creó otro `<audio>`.

## Revisión y pruebas

Luna aprobó el contenedor final: JSX/imports, accesibilidad de búsqueda, semántica de Shuffle, estado visual del corazón, fallback de Icon y ausencia de regresión aparente en audio.

| Comprobación | Resultado |
|---|---|
| `npm test` | ✅ 33 tests en 6 suites |
| `npm run lint` | ✅ sin errores |
| `npm run build` | ✅ correcto; manifiesto SW generado |
| `node --check public/sw.js` | ✅ correcto |
| Búsqueda de `⌕` funcional en MusicLab | ✅ cero residuos; queda el mapeo legacy en `Icon.jsx` |

`git diff --check` sigue mostrando trailing whitespace en varios archivos heredados/modificados. No se hizo limpieza global porque queda fuera de G5 y mezclaría deuda no relacionada.

## Límites honestos

Este anexo no declara aceptación visual de producto. El plan exige capturas comparables en 375, 768, 1024 y 1440 px, además de Android/PWA. Esa evidencia aún no está incorporada.

En este cierre tampoco se hizo commit, push, despliegue, migración de datos, borrado D1/R2, retirada de Drive, limpieza global del SW ni decisión de política G2.

**Estado de gates:** G5 código ✅ · G5 visual ⏳ · G6 responsive ⏳ · G2/G3 siguen bloqueados según `ACTA_G0_G1_REFACTOR_2026-08-03.md`.

La siguiente acción segura es capturar la UI en los cuatro anchos, revisar overflow/accesibilidad y registrar el veredicto de Edu antes de declarar el gate global terminado.
