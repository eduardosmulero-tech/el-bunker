# Plan de producto — El Búnker como hogar digital de una pareja

> Fecha: 23-ago-2026. Este documento convierte la intención original del proyecto en un plan de producto verificable. El plan técnico anterior sigue siendo un gate de calidad; este documento añade la barra de valor que faltaba.

## Norte

El Búnker debe ser el lugar privado donde Edu y David conservan, organizan, encuentran y vuelven a vivir lo que comparten: fotos y vídeos, cartas y notas, lugares, recetas y listas, música, cápsulas y rituales. No es una galería con texto añadido ni un reproductor con fotos: es un hogar digital de pareja.

La comparación no se resuelve contando funciones. Para cada dominio, El Búnker debe igualar la mejor capacidad práctica de la referencia premium y añadir una ventaja propia de pareja, sin aumentar la fricción.

## Barra de mercado

| Dominio | Referencia premium | Mínimo que ya ofrece el mercado | Ventaja exigida a El Búnker |
|---|---|---|---|
| Memoria visual | Google Photos / Apple Photos | backup, búsqueda, álbumes compartidos, edición, recuerdos | museo emocional con seis lecturas, contexto de pareja, eras, diálogo, narrativa, rendimiento Android |
| Diario y palabras | Day One / diarios compartidos | texto multimedia, fechas, ubicación, búsqueda, sincronización, cifrado E2E en diarios compartidos | cartas, diario dual, abrir cuando, respuestas, lectura cuidada, historial y privacidad de pareja |
| Recetas y listas | Paprika | importar recetas, ingredientes, categorías, plan semanal, lista de compra y sync | receta compartida con historia y versiones, plan y compra colaborativos, listas de vida con estado, responsable y contexto |
| Música | Spotify / Apple Music | búsqueda, cola, playlists colaborativas, sesiones compartidas, offline, controles sólidos | biblioteca propia, contexto emocional por vibe/era, drops, créditos de quién añadió, cápsulas y visualizador personalizado |
| Pareja | Between / Paired | espacio privado, mensajes, fotos, fechas, recuerdos | un único archivo vivo que conecta cada objeto con lugar, fecha, música, persona y ritual; sin anuncios ni red social |
| Búsqueda y recuperación | Google Photos / Notion / Day One | búsqueda rápida por texto, fecha, ubicación, etiquetas y filtros | búsqueda unificada sobre todo el hogar, resultados explicables y navegación cruzada sin duplicar datos |
| Seguridad | Day One E2E / bóvedas privadas | cifrado, control de acceso, backup, recuperación | threat model explícito, mínimo privilegio, D1/R2 protegidos, revocación, modo visita real, exportación/recuperación probada |
| Continuidad | Spotify/Photos/Day One | sync entre dispositivos y cierto offline | Android primero, escritorio de primera clase, offline honesto, resume tras kill/red, sin estados falsos |

## Estado actual honesto

La base técnica existe: tres tabs, D1/R2/Workers, auth Google y access key, PlayerProvider, eventos, galería con seis modos en distintos grados, MusicLab, CAPSULES, panel admin, PWA y auditoría reproducible. Eso no equivale a producto terminado.

La auditoría registrada en `docs/operacional/auditoria_producto_completa_2026-08-22.md` tiene 52 capturas, cero errores de consola/HTTP/overflow/clipping; el pase final hace alcanzable COLA móvil vacía y demuestra navegación admin desktop, reduciendo el clipping medido de 71 a 0. La aceptación real del producto sigue abierta, así como la revisión post-merge y los gates Android/offline. Además, el cruce de specs muestra gaps de producto: MAP/EXHIBITION/REEL/CINEMA no tienen el nivel premium completo, la escritura y recetas no tienen experiencia dedicada, la búsqueda unificada no existe como hogar, y offline/Android real no está aceptado.

## Grafo de producto

Raíz Kanban: `t_2df340f9`.

### Gates

- `t_0d621905` — contrato de superioridad y benchmark vivo por dominio.
- `t_07a0befc` — seguridad real, threat model y recuperación.
- `t_394fc825` — ledger de integración producto-técnico; reutiliza y reconcilia `t_919b9d99` y `t_ef7bf46c`.

### Capacidades

Las tarjetas de implementación están creadas como hijas de la raíz y se ordenan por dependencias:

1. Seguridad y confianza.
2. Hogar compartido y modelo de relación.
3. Memoria visual premium.
4. Palabras y diario dual.
5. Lugares, listas y recetas.
6. Music Lab premium.
7. Cápsulas y rituales.
8. Búsqueda unificada y enlaces cruzados.
9. Sync, offline y continuidad.
10. Sistema visual, accesibilidad y rendimiento.
11. Beta real de Edu y David y comparativa competitiva.
12. Release y prueba de durabilidad.

## Tarjetas creadas

- `t_d49dde41` — modelo de hogar compartido, identidad y ownership.
- `t_a67bb65a` — memoria visual superior y seis modos completos.
- `t_f3aa8789` — PALABRAS: diario dual, cartas y lectura íntima.
- `t_b97fe706` — LUGARES, LISTAS y RECETAS.
- `t_60381aad` — MUSIC LAB superior y escucha de pareja.
- `t_bf51a459` — CAPSULES y rituales de pareja.
- `t_1fab0f8a` — búsqueda unificada y enlaces cruzados.
- `t_20cb42d1` — sync, offline y continuidad.
- `t_79f4c945` — calidad premium, accesibilidad y rendimiento.
- `t_80793b68` — beta real Edu/David y comparación contra referencias.
- `t_324fc389` — release y prueba de durabilidad.

### Huecos añadidos por la revisión exhaustiva del historial

- `t_968bc652` — Caja Fuerte real, archivos sensibles y recuperación.
- `t_6810baf8` — Importación masiva de recuerdos con staging y dedupe.
- `t_1c587e9d` — Enlaces cruzados y promoción Drop a VAULT.

Estas tarjetas nacen del mapa `docs/operacional/MAPA_TRAZABILIDAD_PRODUCTO_2026-08-23.md`; no duplican las capacidades grandes. Cubren superficies que el plan anterior nombraba, pero no tenía con un criterio de salida independiente.

## Definition of Done de cada capacidad

Una capacidad solo pasa a `archived` si tiene contrato de UX y datos, implementación, tests, captura móvil y desktop, estados vacíos/error/offline, revisión independiente, commit integrado en `master`, auditoría post-merge y aceptación del flujo por Edu y David cuando sea una experiencia de pareja.

No se aceptan contadores hardcodeados, fixtures como sustituto de datos reales, placeholders con apariencia de producto, datos reescritos para que se vean limpios, seguridad declarada sin prueba, ni features que rompan las reglas inamovibles.

## Orden de cierre

```text
P0 canon + merges + threat model
        |
        v
hogar compartido --> memoria --> palabras --> lugares/listas/recetas
        |                |          |              |
        +------------ música y cápsulas ------------+
                              |
              búsqueda + enlaces cruzados
                              |
                    sync/offline/Android
                              |
             auditoría benchmark + beta real
                              |
                           release
```

La prioridad de producto es hacer que una pareja pueda usar el sistema entero para su vida compartida. Las capacidades experimentalmente atractivas no pueden desplazar seguridad, recuperación, búsqueda, edición y continuidad.

## Trabajo ejecutado sin gate humano — 23-ago-2026

Se ejecutó sobre `master` sin tocar worktrees ajenos, D1/R2, deploy ni decisiones ADR:

- COLA queda visible siempre en MUSIC LAB, también vacía; `subReached: true` en móvil y escritorio.
- ADMIN expone navegación de secciones en desktop y el harness la ejerce desde `1440x900`, no redimensionando desde móvil.
- Títulos largos, CJK, RTL, emoji ZWJ y nombres sin espacios se envuelven en tarjetas, playlists, cola, dock y superficies de detalle con `overflow-wrap:anywhere`.
- Auditoría final: `52` capturas (`390x844` y `1440x900`), `0` overflow, `0` clipping, `0` errores de consola, `0` HTTP erróneos.
- Verificación: `npm run build`, `npm test` (`64` archivos / `448` tests), ESLint dirigido y `git diff --check` verdes.

No se han cerrado tarjetas por estas pruebas. El trabajo queda preparado para revisión/merge y aceptación: permanecen los gates de integración, datos reales, Android/PWA, offline/sync, benchmark premium y beta Edu/David.

## Handoff para Hermes

1. Tomar `t_ef7bf46c` como gate técnico y `t_2df340f9` como norte de producto; no contar `done` como integrado: el canon exige merge y aceptación.
2. Revisar el diff de esta sesión en `src/musiclab/*`, `src/vault/*`, `src/layout/*`, `src/admin/core/*`, `tools/audit-ui/auditoria-completa.mjs` y este informe.
3. Repetir `node tools/audit-ui/auditoria-completa.mjs` después de cualquier merge que toque esas superficies y comparar `tools/audit-ui/report/full-audit/audit.json`.
4. Continuar con `t_3d2d1236`/`t_ddc104e6` para auditoría final y `t_394fc825` para integración; después ejecutar los frentes de producto por dependencia, empezando por seguridad/recuperación y modelo compartido.
5. No cerrar `t_b25cb12e` por el arreglo local: la evidencia debe incorporarse mediante revisión, merge y aceptación del flujo en la app resultante.

## Regla de salida

Si El Búnker no supera a la referencia premium en el flujo que promete, hay dos opciones válidas: implementarlo hasta superar la barra o retirar explícitamente esa promesa mediante una decisión de Edu y una actualización del canon. Ocultarlo bajo una etiqueta de fase o un porcentaje no es cierre.
