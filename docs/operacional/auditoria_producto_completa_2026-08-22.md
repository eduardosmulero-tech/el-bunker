# Auditoría integral de producto — el-bunker

> Pase post-merge reproducible ejecutado el 23-ago-2026 con fixtures locales. Auditoría de producto, no aceptación final de despliegue.

## Cobertura

- 52 capturas: login, 16 estados de la app y 9 estados del panel admin.
- Dos viewports por estado: móvil `390x844` y escritorio `1440x900`.
- Navegación de las 3 tabs, 6 modos de galería, 4 cápsulas, formularios principales, cola, listas, drops y 6 recursos de CONTENIDO admin.
- Comprobaciones DOM de overflow horizontal, clipping de texto, errores de consola y respuestas HTTP `>=400`.
- Evidencia visual: `tools/audit-ui/report/full-audit/screenshots/`.
- Informe de máquina: `tools/audit-ui/report/full-audit/audit.json`.

## Estado de integración

Este pase se ejecutó desde `master` en `0556ea0`, publicado en `origin/master`. No se ejecutó sobre worktrees.

- `t_0ea27342` queda integrado: `a432654` es ancestro de `master` (`git merge-base --is-ancestor a432654 master` devuelve `0`). El formulario post-merge ya ofrece las cuatro secciones vigentes y las pastillas de tipos por sección; el P0 histórico queda resuelto en este árbol.
- `t_a8de002d` (reproductor grande en MUSIC LAB) y `t_7700824f` (profundidad visual del HUD) siguen en `triage` y bloqueadas por decisión/spec. No se consideran cambios aplicables a este pase hasta que Edu confirme la enmienda a ADR-029 y exista una entrega verificable.
- Las revisiones hijas `t_b617c6b3` y `t_e687ed00` siguen pendientes y no deben cerrarse usando capturas de un árbol que no contiene sus padres.

**Regla de repetición:** después de cualquier merge adicional que toque `src/vault/*`, `src/layout/*`, `src/musiclab/*`, `src/capsules/*` o `tools/audit-ui/*`, se debe ejecutar un nuevo pase sobre el `master` resultante y comparar capturas, clipping, navegación y batería técnica.

## Resultado ejecutivo

El marco desktop de ADR-029 no presenta overflow horizontal en este pase y las rutas de app llegan a sus tabs y modos principales. `COLA` ya es alcanzable en móvil incluso vacía y ADMIN se navega desde el viewport desktop real. El producto todavía no está listo para declararse premium ni para cerrar la revisión arquitectónica: el pase automatizado queda sin overflow ni clipping medido; siguen fuera de este pase la aceptación real, Android/PWA, offline/sync y la validación con API/credenciales reales.

El pase final de implementación registró `0` elementos con clipping detectado, `0` errores de consola, `0` respuestas HTTP erróneas y `0` casos de overflow horizontal del documento, frente a `71` clipping en la línea base post-merge. Los títulos de estrés, las filas de Timeline y el masonry móvil quedan contenidos en los dos viewports.

## Hallazgos priorizados

### P0 — RESUELTO POST-MERGE — El formulario de VAULT ya usa ADR-033

**Evidencia post-merge:** `vault-add-entry-mobile.png` y `vault-add-entry-desktop.png` muestran la navegación `MEMORIA`, `PALABRAS`, `LUGARES`, `LISTAS` y, dentro de MEMORIA, las cuatro opciones `FOTO`, `VIDEO`, `AUDIO`, `CAPTURA`. `CAJA FUERTE` no aparece como destino paseable ni como tipo del formulario.

**Resultado:** el P0 queda resuelto en `0556ea0`. El flujo de crear/editar usa `SECCION_TIPOS` y el mapeo de datos se mantiene al leer; no hay migración destructiva.

### P1 — RESUELTO — COLA alcanzable en móvil

**Evidencia del pase actual:** `music-queue-mobile.png` y `music-queue-desktop.png` registran `navigation.subReached: true`. COLA ya aparece como destino persistente aunque esté vacía; no depende del contador ni de que exista previamente un elemento en la cola.

**Cambio aplicado:** la barra de MUSIC LAB siempre pinta COLA y conserva el estado elevado `secondLevel.music`, tanto en móvil como en escritorio.

**Criterio de cierre:** desde MUSIC LAB móvil se puede abrir COLA con estado vacío y con estado poblado; el estado vacío conserva una acción clara para añadir el primer track; la ruta no depende de un contador o de que la cola tenga elementos.

### P1 — RESUELTO EN PASE AUTOMATIZADO — Contención de títulos y textos largos

**Evidencia del pase final:** no queda ningún elemento medido con clipping. Los títulos largos, las filas de Timeline y el masonry móvil se envuelven o reducen sus mínimos flexibles sin ocultar contenido.

**Contrato incumplido:** las instrucciones de interfaz exigen que el texto quepa en su contenedor y que las cadenas largas se adapten sin ocultar contenido ni romper la composición.

**Criterio de cierre:** los componentes de tarjeta, track, historial, lightbox y detalle aplican una política consistente para `overflow-wrap:anywhere`/clamp accesible/tooltip o expansión; ningún caso de fixture queda visualmente cortado en los dos viewports; no se tapa contenido previo o posterior.

### P1 — RESUELTO — La auditoría desktop prueba navegación propia de admin

**Evidencia del pase actual:** el harness inicia cada estado admin en el viewport de captura. En `1440x900` ejerce la navegación de sección y recurso mediante la navegación desktop visible, y registra `viewportNavigation: "desktop"`.

**Resultado:** hueco de evidencia cerrado por el harness; la aceptación funcional de ADMIN sigue limitada a fixtures locales y no sustituye la prueba con API/credenciales reales.

**Criterio de cierre:** mantener esta prueba en cada cambio de `src/admin/*` y añadir aceptación con API/credenciales reales.

### P2 — La captura de login estaba contaminada por el fixture GIS

**Evidencia:** el primer pase corregido mostraba `ERROR DE SISTEMA` porque el harness interceptaba el script GIS con `204`, sin crear `window.google.accounts`; no era un fallo de la aplicación.

**Corrección aplicada:** el harness instala un stub local mínimo de `window.google.accounts.oauth2` solo para los estados de login, y espera el texto estable `IDENTIFICACIÓN VÍA GOOGLE REQUERIDA` antes de capturar.

**Resultado:** las dos capturas de login contienen el logo, boot terminal, CTA Google y acceso test/admin, con `0` errores de consola. No se modifica el código de producción.

## Criterios de aceptación de la tarjeta

La tarjeta solo puede pasar a revisión humana cuando se cumpla todo lo siguiente:

1. El informe contiene 52 capturas válidas, sin capturas de boot clasificadas como pantalla estable.
2. Los 16 estados de app llegan a su tab y subvista/mode; `music-queue` llega en móvil y escritorio. **Cumplido** (`subReached: true` en ambos viewports).
3. El formulario VAULT refleja ADR-033 y no expone la taxonomía histórica. **Cumplido post-merge**.
4. La medición registra `overflowX = false` en todos los estados. **Cumplido**.
5. Los títulos de estrés y las filas de Timeline se envuelven; el informe actual registra 0 clipping residual; la revisión/merge y la aceptación humana siguen siendo obligatorias.
6. Admin se navega y se captura de forma independiente en móvil y desktop. **Cumplido por el harness actualizado**.
7. No hay errores de consola ni HTTP en el pase.
8. Build, tests y lint quedan verdes, o cada excepción queda registrada con causa y tarjeta derivada.

## Límites

Este pase usa fixtures y no sustituye la aceptación en dispositivo Android/PWA instalada. Tampoco prueba credenciales reales, R2 real, reproducción de MP3 real, permisos, rendimiento de red ni accesibilidad completa con lector de pantalla. Esos gates permanecen separados de esta auditoría arquitectónica.
