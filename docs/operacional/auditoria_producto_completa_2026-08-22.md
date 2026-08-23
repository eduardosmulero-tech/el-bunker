# Auditoría integral de producto — el-bunker

> Pase reproducible ejecutado el 23-ago-2026 con fixtures locales. Auditoría de producto, no aceptación final de despliegue.

## Cobertura

- 52 capturas: login, 16 estados de la app y 9 estados del panel admin.
- Dos viewports por estado: móvil `390x844` y escritorio `1440x900`.
- Navegación de las 3 tabs, 6 modos de galería, 4 cápsulas, formularios principales, cola, listas, drops y 6 recursos de CONTENIDO admin.
- Comprobaciones DOM de overflow horizontal, clipping de texto, errores de consola y respuestas HTTP `>=400`.
- Evidencia visual: `tools/audit-ui/report/full-audit/screenshots/`.
- Informe de máquina: `tools/audit-ui/report/full-audit/audit.json`.

## Estado de integración

Este pase se ejecutó desde el árbol principal basado en `master` (`f6a0099`), con cambios locales sin commit presentes; no se ejecutó sobre worktrees ni se incorporaron cambios pendientes mediante cherry-pick.

- `t_0ea27342` entregó VAULT en cuatro secciones en `a432654`, pero `a432654` **no es ancestro de `master`** (`git merge-base --is-ancestor a432654 master` devuelve `1`). Por tanto, el P0 de este informe es válido para el árbol auditado: `AddEntryForm.jsx` seguía exponiendo el formulario histórico; el commit `a432654` no estaba presente en ese árbol. Tras integrar ese commit, hay que repetir la auditoría completa, porque cambia `src/vault/*`, `Layout.jsx`, varios tests y parte del harness.
- `t_a8de002d` (reproductor grande en MUSIC LAB) y `t_7700824f` (profundidad visual del HUD) siguen en `triage` y bloqueadas por decisión/spec. No se consideran merges pendientes ni cambios aplicables al pase hasta que Edu confirme la enmienda a ADR-029 y exista una entrega verificable.
- Las revisiones hijas `t_b617c6b3` y `t_e687ed00` siguen pendientes y no deben cerrarse usando capturas de un árbol que no contiene sus padres.

**Regla de repetición:** después de cualquier merge que toque `src/vault/*`, `src/layout/*`, `src/musiclab/*`, `src/capsules/*` o `tools/audit-ui/*`, se debe ejecutar un nuevo pase sobre el `master` resultante y comparar capturas, clipping, navegación y batería técnica. Este informe no es una aceptación post-merge.

## Resultado ejecutivo

El marco desktop de ADR-029 no presenta overflow horizontal en este pase y las rutas de app llegan a sus tabs y modos principales. El producto no está listo para declararse premium ni para cerrar la revisión arquitectónica: hay una contradicción canónica directa en el formulario de VAULT, una superficie de MUSIC LAB inalcanzable en móvil y problemas repetidos de texto que incumplen el contrato de no truncar ni desbordar contenido.

El pase definitivo registró `117` elementos con clipping detectado, `0` errores de consola, `0` respuestas HTTP erróneas y `0` casos de overflow horizontal del documento. El clipping incluye fixtures diseñados para estresar títulos sin espacios, CJK, RTL, nombres de archivo y textos largos; no debe tratarse como 117 bugs independientes, sino como evidencia de fallos de contención en los componentes que los renderizan.

## Hallazgos priorizados

### P0 — El formulario de VAULT sigue ofreciendo la taxonomía histórica

**Evidencia:** `vault-add-entry-mobile.png` y `vault-add-entry-desktop.png` muestran las 14 categorías y sus subtipos, incluyendo línea temporal, datos, integraciones, playlists con historia y caja fuerte como opciones del mismo formulario.

**Contrato incumplido:** ADR-033 sustituye la taxonomía por `MEMORIA`, `PALABRAS`, `LUGARES`, `LISTAS` y `CAJA FUERTE` aparte. Las funciones cuyo destino ya existe en CAPSULES, RECAP o MUSIC LAB no deben volver a aparecer en VAULT.

**Criterio de cierre:** el flujo de crear y editar usa únicamente las cuatro secciones vigentes; CAJA FUERTE no aparece como categoría paseable; los datos existentes se resuelven al leer sin migración destructiva; las 14 categorías históricas quedan fuera del UI vigente.

### P1 — COLA no es alcanzable en móvil

**Evidencia:** `music-queue-mobile.png` tiene `navigation.subReached: false`; el mismo estado llega en escritorio. La auditoría intentó primero navegar por la subnavegación y después añadir un track a cola para revelar el destino.

**Impacto:** la cola es una superficie central de ADR-002/ADR-009 y no puede depender de que exista previamente un elemento visible o de una acción lateral no indicada al usuario.

**Criterio de cierre:** desde MUSIC LAB móvil se puede abrir COLA con estado vacío y con estado poblado; el estado vacío conserva una acción clara para añadir el primer track; la ruta no depende de un contador o de que la cola tenga elementos.

### P1 — Contención de títulos y textos largos incumple el contrato visual

**Evidencia:** clipping en WALL y en los modos de VAULT, nombres de archivo y pistas largas en MUSIC LAB, y textos de detalle en móvil. Los casos incluyen cadenas sin espacios, CJK, RTL, emoji ZWJ y nombres de archivo largos.

**Contrato incumplido:** las instrucciones de interfaz exigen que el texto quepa en su contenedor y que las cadenas largas se adapten sin ocultar contenido ni romper la composición.

**Criterio de cierre:** los componentes de tarjeta, track, historial, lightbox y detalle aplican una política consistente para `overflow-wrap:anywhere`/clamp accesible/tooltip o expansión; ningún caso de fixture queda visualmente cortado en los dos viewports; no se tapa contenido previo o posterior.

### P1 — La auditoría desktop no prueba navegación desktop propia de admin

**Evidencia:** el harness selecciona la sección y el recurso con viewport móvil, y después redimensiona a `1440x900` para capturar. Las capturas desktop demuestran el render del estado, pero no una interacción de navegación propia del escritorio.

**Clasificación:** hueco de evidencia del harness, no fallo funcional declarado sin una prueba de interacción independiente.

**Criterio de cierre:** capturar y medir cada consola admin iniciando la navegación en `1440x900`; verificar que el rail, las secciones y los recursos son operables con teclado y puntero en desktop.

### P2 — La captura de login estaba contaminada por el fixture GIS

**Evidencia:** el primer pase corregido mostraba `ERROR DE SISTEMA` porque el harness interceptaba el script GIS con `204`, sin crear `window.google.accounts`; no era un fallo de la aplicación.

**Corrección aplicada:** el harness instala un stub local mínimo de `window.google.accounts.oauth2` solo para los estados de login, y espera el texto estable `IDENTIFICACIÓN VÍA GOOGLE REQUERIDA` antes de capturar.

**Resultado:** las dos capturas de login contienen el logo, boot terminal, CTA Google y acceso test/admin, con `0` errores de consola. No se modifica el código de producción.

## Criterios de aceptación de la tarjeta

La tarjeta solo puede pasar a revisión humana cuando se cumpla todo lo siguiente:

1. El informe contiene 52 capturas válidas, sin capturas de boot clasificadas como pantalla estable.
2. Los 16 estados de app llegan a su tab y subvista/mode; `music-queue` llega en móvil y escritorio.
3. El formulario VAULT refleja ADR-033 y no expone la taxonomía histórica.
4. La medición registra `overflowX = false` en todos los estados.
5. No quedan casos de clipping de contenido real en las fixtures de estrés de texto.
6. Admin se navega y se captura de forma independiente en móvil y desktop.
7. No hay errores de consola ni HTTP en el pase.
8. Build, tests y lint quedan verdes, o cada excepción queda registrada con causa y tarjeta derivada.

## Límites

Este pase usa fixtures y no sustituye la aceptación en dispositivo Android/PWA instalada. Tampoco prueba credenciales reales, R2 real, reproducción de MP3 real, permisos, rendimiento de red ni accesibilidad completa con lector de pantalla. Esos gates permanecen separados de esta auditoría arquitectónica.
