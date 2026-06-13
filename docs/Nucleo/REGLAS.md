# REGLAS.md — el_bunker
> Workflow y conducta de Claude. Normativo — prevalencia absoluta.
> Última actualización: S49 — Refundación del producto.

## ROL
Edu es desarrollador novato — Claude es el responsable técnico.

## REGLAS DE ORO
Convenciones antes de arquitectura propia. Ver ADR-009 en CONTRATO.md.
Archivo antes de diagnóstico. 
Estado conocido antes de Pliegos nuevos.
Un bug = una causa.
Edu aplica pliegos con tools/pliego_apply.py. Claude genera el .txt; el script aplica. Nunca diffs.
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
- **Motor de audio único:** Nunca instanciar `<audio>` fuera de MusicLab (ADR-018, 🔒-3).
- **3 tabs definitivos:** VAULT · MUSIC LAB · CAPSULES. No crear nuevas tabs sin ADR (ADR-017, 🔒-4).
- **Stats engine único:** Todos los eventos emiten a tabla `events` en D1 (ADR-019, 🔒-5).
- **No duplicar uploaders:** Usar FileUploadService unificado a R2 (ADR-022).
- **Namespaces de tags:** `music_lab.tags[]` y `vault.tags[]` separados (ADR-023).
- **Galería 6 modos:** WALL, CINEMA, MAP, DIALOGUE, REEL, EXHIBITION (ADR-021).

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
| `src/musiclab/WinampPlayer.jsx` | Reproductor visual — ÚNICO `<audio>` de la app |
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
| `src/main.jsx` | Entry point Vite |

### Archivos futuros (no crear hasta que toque su pliego)
| Archivo | Rol |
|---------|-----|
| `src/vault/VaultGallery.jsx` | Galería 6 modos (ADR-021) |
| `src/capsules/Capsules.jsx` | Tab CAPSULES con 4 sub-tabs |
| `src/capsules/Timeline.jsx` | Feed cronológico unificado |
| `src/capsules/TimeCapsules.jsx` | Cápsulas del tiempo |
| `src/capsules/Recaps.jsx` | Resúmenes semanales/mensuales/anuales |
| `src/services/FileUploadService.js` | Subida unificada a R2 (ADR-022) |
| `src/services/StatsEngine.js` | Emisor/agregador de eventos (ADR-019) |

Formato compatible con pliego_apply.py (ver tools/README.md):
- SEARCH: y REPLACE: solos en su línea, sin backticks, sin texto adicional.
- El texto de SEARCH debe coincidir exactamente.
- **Obligatorio:** Copiar bloque completo sin re-indentar.
- **Prohibido entre bloques:** cualquier texto entre el contenido del REPLACE y el siguiente SEARCH: se inyecta literalmente en el archivo. Esto incluye cabeceras ── título ──, separadores --- y cualquier comentario. El REPLACE termina donde empieza el siguiente SEARCH:.
- **Multi-bloque:** línea en blanco **obligatoria** tras el último contenido de cada REPLACE cuando hay bloques siguientes — el parser interpreta cualquier texto pegado al REPLACE como contenido a inyectar. El número de bloque va solo en su línea (`SEARCH/REPLACE 1`, sin guión ni texto adicional). Sin títulos ni cabeceras intermedias.

## WORKFLOW HUMANO
Claude genera el pliego como .txt. Edu lo guarda y aplica.
Si SEARCH no coincide: extraer con `Get-Content` el bloque exacto.

## WORKFLOW B — Script (principal)
git status
Guardar pliego .txt en tools/
python pliego_apply.py pliego_0XX.txt
Verificar en navegador
git add src/Archivo.js
git commit -m "PLIEGO-0XX: descripción"

## WORKFLOW A — Asíncrono (fallback)
Prerequisito: ollama list + ollama run qwen3:14b.

## TABLA DE MODELOS
Modelo | Cuándo
deepseek/deepseek-chat    | Todo uso diario: pliegos, bugs, refactors
deepseek/deepseek-r1-0528 | Arquitectura o decisiones complejas

## CHECKLIST CIERRE DE PLIEGO
 Marcar stale en docs/Arquitectura/INDEX.md si el pliego toca archivos listados
 Actualizar docs/Nucleo/CONTRATO.md si hay ADR nuevo
 Actualizar docs/Nucleo/ESTADO.md (próximo pliego + bugs)
 pliego_apply.py actualiza ESTADO.md y BACKLOG.md automáticamente

## CHECKLIST CIERRE DE SESIÓN
 Actualizar docs/Nucleo/SESION.md con resumen de la sesión
 Actualizar docs de Arquitectura marcados stale en INDEX.md
 Bugs resueltos: pliego_apply.py los registra en BACKLOG.md automáticamente
 Pliegos aplicados: añadir fila a docs/legacy/PLIEGOS_HISTORIAL.md
 Escribir entrada en docs/legacy/SESIONES.md
