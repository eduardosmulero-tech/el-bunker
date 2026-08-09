# REGLAS.md — el_bunker
> Workflow y conducta de Claude. Normativo — prevalencia absoluta.
> Última actualización: S154 (7-ago-2026) — reglas de specs, iconografía y personalización.
> Base: S49, refundación del producto.

## ROL
Edu es desarrollador novato — Claude es el responsable técnico.

## REGLAS DE ORO
Convenciones antes de arquitectura propia. Ver ADR-009 en CONTRATO.md.
Archivo antes de diagnóstico — pero **la lectura completa la hace DeepSeek, no Sonnet.**
Jerarquía de lectura (S145, prioridad = consumo de tokens): DeepSeek lee archivos completos e
investiga a fondo — es su trabajo. Sonnet lee archivo completo SOLO en casos extremadamente
necesarios; el resto del tiempo trabaja con lo que DeepSeek ya reportó y verifica con lecturas
puntuales (grep de una cita/línea concreta), nunca releyendo el archivo entero por sistema.
Fable recibe contexto exacto ya extraído (citas + archivo:línea) — nunca la instrucción de "lee
tal archivo"; si hace falta un fragmento para su decisión, Sonnet o DeepSeek lo extraen antes.
**Escalado ante bug reportado por Edu (corregido 3+ veces, S145):** Sonnet NO diagnostica ni
diseña la solución primero — escribe el problema tal como lo reportó Edu en `task_deepseek.md`
(sin pseudocódigo, sin implementación ya pensada) y deja que DeepSeek investigue y arregle. Solo
si el mismo bug sobrevive 3 rondas de intento de DeepSeek, Sonnet lee el código completo y
diagnostica él mismo. Si tampoco lo resuelve, se escala a Opus o a Fable.
Estado conocido antes de tareas nuevas.
Un bug = una causa.
tools/pliego_apply.py y el formato SEARCH/REPLACE en .txt son LEGACY (sistema previo a tener un
agente CLI). Metodología vigente desde S145: Sonnet escribe el encargo en task_deepseek.md con
contexto suficiente (archivo, problema, cambio deseado, restricciones, criterio de verificación) —
NUNCA un pliego .txt de SEARCH/REPLACE. DeepSeek se pone en contexto solo (lee el código real) y
edita el archivo directamente, como agente — nunca vía pliego_apply.py. Sonnet no ejecuta scripts
de aplicación él mismo tampoco. Nunca diffs.
Resolución de formato. SEARCH/REPLACE por defecto. Archivo completo solo si menos de 80 líneas o más del 40% afectado.
**NO MICRO-EDICIÓN:** Los bloques SEARCH deben contener el bloque lógico completo (ADR-015).
Un Pliego = un archivo.
Archivos críticos: modelo qwen3-14b-think + revisión cruzada.
Principio de modificación mínima.
Criterio de éxito antes del Pliego.
Scope lock.
Regresión = explicación antes de fix.
ADR y convenciones son vinculantes.
Cierre de sesión obligatorio.
Loop es triestado.
**🔑 SUDO = PEDIR:** Si un comando requiere sudo/contraseña, Claude debe pedir a Edu que lo ejecute manualmente. Nunca intentar sudo sin avisar.

## REGLAS NUEVAS (S49)
- **Motor de audio único:** Nunca instanciar playback fuera de PlayerProvider/MusicLab. El provider encapsula el `<audio>` principal y el preload silencioso gapless; VAULT/CAPSULES no reproducen audio (ADR-018, 🔒-3).
- **3 tabs definitivos:** VAULT · MUSIC LAB · CAPSULES. No crear nuevas tabs sin ADR (ADR-017, 🔒-4).
- **Stats engine único:** Todos los eventos emiten a tabla `events` en D1 (ADR-019, 🔒-5).
- **No duplicar uploaders:** Usar FileUploadService unificado a R2 (ADR-022).
- **Namespaces de tags:** `music_lab.tags[]` y `vault.tags[]` separados (ADR-023).
- **Galería 6 modos:** WALL, CINEMA, MAP, DIALOGUE, REEL, EXHIBITION (ADR-021).

## REGLAS NUEVAS (7-ago-2026, decisión de Edu)
- **Las specs de `docs/spec/` no son historia.** Antes de escribir un diseño, un plan o un ADR, se
  lee `docs/spec/INDEX.md` (lo exige el `CANON.manifest`) y desde ahí **solo la spec del área que
  se toca**. No hace falta leerlas las cuatro; sí hace falta abrir la que corresponde.
- **Clasificación de auditoría:** `docs/spec/` es `U3_PATH_DOCS + LIVE_SPEC` y nunca puede recibir
  automáticamente el motivo "documentación histórica fuera del alcance funcional". `docs/legacy/`,
  `docs/sesiones/`, `docs/historico/`, `docs/planes/` y `docs/disenos/` son históricos o de trabajo
  salvo declaración explícita de vigencia. `docs/Nucleo/`, `docs/Arquitectura/` y `docs/operacional/`
  se clasifican por documento: contratos, reglas, estado, índices y políticas vigentes se leen;
  actas e informes fechados se conservan como histórico. Esta política corrige el consumidor futuro;
  no reescribe auditorías anteriores.
- **Iconografía:** todo icono sale de `src/core/ui/Icon.jsx`. Cero emoji y cero caracteres unicode
  como icono en `src/`, incluidos los objetos de configuración de `tokens.js`. El mapa
  `LEGACY_ICON_NAMES` es un puente cerrado para datos antiguos: ningún componente nuevo se apoya en
  él. Esta regla prevalece sobre la iconografía de caracteres dibujada en las specs (ADR-029).
- **Dato del usuario intocable:** la app nunca reescribe títulos, nombres ni etiquetas escritos por
  el usuario para que parezcan más limpios, por raros que sean sus adornos.
- **Nada inventado en pantalla:** si el dato no está, se muestra estado vacío. Prohibidos los
  valores por defecto fabricados para que un widget tenga algo que enseñar.
- **Ninguna animación nueva en bucle infinito** que no comunique un estado.
- **Personalización:** lo que el usuario puede personalizar se lee del dato (D1), nunca se escribe
  en el código. La ley del vibe es el mecanismo (la interfaz sigue a lo que suena), no el catálogo:
  qué vibes existen, su nombre, color e icono son del usuario.

## MAPA DE ARCHIVOS JSX (actual)

| Archivo | Rol |
|---------|-----|
| `src/layout/App.jsx` | Root — monta PlayerProvider, VaultContext, routing de tabs |
| `src/layout/Layout.jsx` | Shell visual — header, nav, grid, glows. Consume trackVibe |
| `src/layout/LoginScreen.jsx` | Pantalla de login |
| `src/core/PlayerContext.jsx` | Estado global de reproducción — ADR-004 |
| `src/core/VaultContext.jsx` | Estado global de BD y autenticación |
| `src/core/GoogleDriveService.js` | Auth OAuth2 + API Drive (transición a D1) |
| `src/musiclab/MusicLab.jsx` | Orquestación principal Music Lab |
| `src/musiclab/WinampPlayer.jsx` | Controles visuales del único motor de playback; los elementos `<audio>` viven en `PlayerContext` |
| `src/musiclab/TrackCard.jsx` | Card de track + VibeTagBar |
| `src/musiclab/TagManager.jsx` | Gestor de tags/vibes (reutilizable para vault.tags) |
| `src/musiclab/PlaylistManager.jsx` | Modales de playlist |
| `src/musiclab/AddTrackForm.jsx` | Formulario añadir/editar track |
| `src/musiclab/AudioVisualizer.jsx` | Visualizador de audio |
| `src/musiclab/DropsManager.jsx` | Sistema de drops |
| `src/musiclab/useMusicActions.js` | Custom hook: acciones de MusicLab |
| `src/vault/Vault.jsx` | Motor VAULT: Eras, widgets, entradas |
| `src/smoke/SmokeSession.jsx` | Temporizador con fade-out (migrará a src/capsules/) |
| `src/tokens.js` | Design tokens — colores, tipografía, paletas de vibe |
| `src/core/ui/Button.jsx` | Design system — botón reutilizable (3 variants, 3 sizes) |
| `src/core/ui/Card.jsx` | Design system — glassmorphism card con padding configurable |
| `src/core/ui/Input.jsx` | Design system — input/textArea con label, error, accent |
| `src/main.jsx` | Entry point Vite |

### Archivos futuros (no crear hasta que toque su pliego)
| Archivo | Rol |
|---------|-----|
| `src/capsules/Capsules.jsx` | Tab CAPSULES con 4 sub-tabs |
| `src/capsules/Timeline.jsx` | Feed cronológico unificado |
| `src/capsules/TimeCapsules.jsx` | Cápsulas del tiempo |
| `src/capsules/Recaps.jsx` | Resúmenes semanales/mensuales/anuales |
| `src/services/FileUploadService.js` | Subida unificada a R2 (ADR-022) |
| `src/services/StatsEngine.js` | Emisor/agregador de eventos (ADR-019) |

> **⚠ LEGACY (desde S145):** todo lo de `pliego_apply.py`, formato SEARCH/REPLACE en .txt y los
> workflows de abajo (HUMANO / B / A) es el sistema previo a tener agentes CLI. Ya no se usa.
> Se conserva el texto solo como referencia histórica de `tools/PLIEGO-*.txt` anteriores a S145.

## METODOLOGÍA VIGENTE (desde S145) — task_deepseek.md

1. Sonnet escribe el encargo en `task_deepseek.md` (raíz del proyecto): Estado + Contrato +
   Contexto mínimo + Tarea + Restricciones + Entregable + criterio de verificación. Nunca un
   pliego .txt de SEARCH/REPLACE — DeepSeek no ejecuta scripts para aplicar cambios.
2. DeepSeek lee el prompt, se pone en contexto solo (lee el código real que necesite) y edita
   el/los archivo(s) directamente, como agente.
3. DeepSeek reporta hecho/bloqueado. Edu avisa a Sonnet.
4. Sonnet verifica el resultado contra el código real (Regla de Oro) antes de darlo por bueno —
   "hecho" no se cree sin verificar.
5. Build/lint para confirmar (`npm run build`), commit sin coautoría, push si Edu lo pide.

Sonnet no edita código de `src/`/`workers/` directamente salvo instrucción explícita de Edu —
su rol es coordinar, redactar el encargo y verificar, no ejecutar. Docs (`docs/`, `CLAUDE.md`,
`REGLAS.md`) sí los edita Sonnet directamente, son trabajo de coordinación.

## TABLA DE MODELOS
Modelo | Cuándo
deepseek/deepseek-chat    | Ejecutor: implementa directamente lo encargado en task_deepseek.md
deepseek/deepseek-r1-0528 | Arquitectura o decisiones complejas

## CHECKLIST CIERRE DE TAREA
 Marcar stale en docs/Arquitectura/INDEX.md si la tarea toca archivos listados
 Actualizar docs/Nucleo/CONTRATO.md si hay ADR nuevo
 Actualizar docs/Nucleo/ESTADO.md (próximo pliego + bugs) — manual
 Actualizar docs/Nucleo/BACKLOG.md (fila en RESUELTOS) — manual
 Archivar el bloque cerrado de task_deepseek.md y dejar el archivo MAGRO — lo hace DeepSeek en
 el cierre de su propio turno (tras aprobación de Sonnet en el chat), no Sonnet (S145)

## CHECKLIST CIERRE DE SESIÓN
 Actualizar docs/Nucleo/SESION.md con resumen de la sesión
 Actualizar docs de Arquitectura marcados stale en INDEX.md
 Escribir entrada en docs/legacy/SESIONES.md
