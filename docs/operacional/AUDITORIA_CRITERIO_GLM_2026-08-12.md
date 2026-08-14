# AUDITORÍA DE CRITERIO — GLM 5.2 post-merge 12-ago

> **Tarjeta:** t_14658e6f (carril glm52). **Fecha:** 2026-08-13.
> **Árbol auditado:** `C:\proyectos\dev\el-bunker`, rama master, HEAD `b96ba31`
> (trabajo de t_22e3e727 en `.worktrees\t_22e3e727` sin commit, tenido en cuenta).
> **Método:** solo lectura. Sin mutaciones, sin credenciales, sin URLs de producción.
> **Formato:** `[SEVERIDAD] título | fichero:linea | canon o intención | código | por qué importa`.
> Al final: resumen de salud en 5 líneas.

---

## [ALTA] 1 — Encender el Modo Visita NO incrementa `token_epoch`: la cerradura de papel sigue abierta

| | |
|---|---|
| Canon | `DISENO_REVOCACION_JWT_2026-08-12.md` §5 y §7 (texto de ADR-031): *"Encender el Modo Visita incrementa el epoch y firma el token de visita con el valor nuevo, en esa orden."* Aceptación nº 7 del diseño: token A sin `visit` → encender visita → token B; `GET /api/entries` con **A** debe devolver **401**. |
| Código | `workers/routes/session.js:93-115` — la rama "Encender" solo hace `emitEvent(visit_mode_on)` + `issueToken(..., { visit: true })`. Ningún `UPDATE users SET token_epoch` en ese flujo. El único bump del contador vive en el endpoint de revocación admin (`workers/routes/admin-access.js:110`). |
| Importa | El token anterior (sin `visit`, mismo epoch) sigue válido hasta 24 h (`JWT_EXPIRY` en `workers/config.js`) y en cualquier otro dispositivo: quien conserve el JWT previo ve la app sin censura. Es exactamente el agujero "cerradura de papel" que el propio diseño documenta en su §1, y el efecto secundario que el §5 anunció (encender en el móvil cierra la sesión del portátil) no ocurre. La fase R2 del diseño (§8) queda sin implementar pese a que A3/A4/A5 ya están en master. |

## [ALTA] 2 — ADR-031 y ADR-030 no existen en CONTRATO.md: revocación por epoch en producción sin ADR firmado

| | |
|---|---|
| Canon | La propia tarjeta ordena leer "29 ADRs vigentes; atención a ADR-031". `DISENO_REVOCACION_JWT` §7 trae ADR-031 como "texto firmable" y enmienda explícita a ADR-028; `DISENO_ADMIN_EN_LA_APP` §6 trae ADR-030 y ya documentó que "ADR-030 nunca entró en CONTRATO.md". |
| Código | `docs/Nucleo/CONTRATO.md` termina en ADR-029 (resumen en líneas 216-218: ADR-001…ADR-029). La búsqueda de "ADR-030"/"ADR-031" en el fichero devuelve cero. Mientras, la revocación por epoch está implementada y en producción: `migrations/0004_token_epoch.sql`, `workers/utils/auth.js:66-75` (`checkEpochFreshness`), `workers/routes/admin-access.js` (revoke), `src/admin/screens/Accesos.jsx`. Y `CONTRATO.md:153` sigue afirmando *"Revocación = borrar o rotar el secret"*, que el diseño §2 demostró falso (rotar la clave no invalida sesiones vivas; la firma usa `JWT_SECRET`, no la clave). |
| Importa | Un mecanismo de seguridad de sesiones está desplegado sin contrato firmado, y el contrato vigente contiene la afirmación falsa que este mecanismo corrige, sin enmendarla. Cualquier auditoría futura que lea solo el CONTRATO sacará conclusiones equivocadas sobre cómo se revoca. |

## [MEDIA] 3 — /admin sigue fuera de `PlayerProvider`: sin reproductor, sin marco, sin tema — ADR-030 sin ejecutar

| | |
|---|---|
| Canon | `DISENO_ADMIN_EN_LA_APP_2026-08-12.md` §3.2: la rama `/admin` pasa **dentro** de `PlayerProvider` y su contenido es el lienzo del marco de ADR-029. §2.2: `admin-core` deja de importar `../../tokens` (F1: `grep -c "\.\./\.\./tokens" src/admin/core/*` = 0) y consume variables `--admin-*` atadas a `--vibe-accent`. §3.5: `VibeAccentBridge` montado una vez en `App.jsx`. |
| Código | `src/layout/App.jsx:160-165` devuelve `<ToastProvider><AdminPanel/></ToastProvider>` **antes** de `PlayerProvider` (`:167-171`). No existe `VibeAccentBridge` (grep: 0), ni `src/musiclab/MiniPlayer.jsx` (F3a), ni una sola variable `--admin-` en `src/` (grep: 0). `admin-core` sigue importando `../../tokens` en 6 ficheros: `AdminShell.jsx:4`, `ResourceTable.jsx:6`, `ConfirmDialog.jsx:6`, `ResourceForm.jsx:5`, `AdminGuard.jsx:7`, `ResourceConsole.jsx:5`. |
| Importa | La queja original de Edu ("no se ve el reproductor, no sigue la temática") permanece literal: en `/admin` no hay provider encima, el panel no se tiñe con el vibe y no hay entrada en el raíl (tarjeta t_0d0b936b abierta). El F1 (contrato de tema) está incumplido, con el agravante de que la frontera `admin-core` tampoco es portable a vinos-carta-app. |

## [MEDIA] 4 — Consolas SALUD / AUDITORÍA / ACCESOS inalcanzables en escritorio

| | |
|---|---|
| Canon | `DISENO_ADMIN_EN_LA_APP` §3.3: las cuatro consolas navegan como hijos de la entrada ADMIN en el raíl; en cualquier ancho deben ser alcanzables. |
| Código | La nav de secciones del panel es `className="flex md:hidden"` (`src/layout/App.jsx:113-127`): oculta desde 768px. Las otras tres consolas pasan `resources={[]}` a `AdminShell` (sin aside): `src/admin/screens/Salud.jsx:104`, `Auditoria.jsx:212`, `Accesos.jsx:222`; solo `Contenido.jsx:196` pasa recursos. |
| Importa | En desktop (≥1280) `/admin` queda fijado a CONTENIDO: SALUD, AUDITORÍA y ACCESOS solo existen en móvil. La consola de ACCESOS (B6, la más valiosa tras ADR-031) no es usable en el cliente de escritorio de primera clase. |

## [MEDIA] 5 — E-1 no aplicado: el menú de orden de MusicLab no se cierra con el scroll del lienzo

| | |
|---|---|
| Canon | `DISENO_HUD_DESKTOP` §6 P3 y edición literal E-1: *"los eventos scroll no burbujean pero sí se capturan; escuchar en `document` con `{ capture: true, passive: true }` recoge el scroll de cualquier contenedor"*. Verificación V-5: `rg "window.addEventListener("scroll"` → sin coincidencias. |
| Código | `src/musiclab/MusicLab.jsx:311` — `window.addEventListener("scroll", onScroll, { passive: true })` (y el remove en `:317`). El portal del menú de orden usa `position: fixed` con coordenadas calculadas al abrir (`MusicLab.jsx:291-322`). |
| Importa | En desktop el scroll vive en el lienzo (`index.css:170-175`, `.desktop-canvas { overflow-y: auto }`), no en la ventana: el evento `window` no se dispara nunca, el menú queda flotando descolgado al hacer scroll. Es exactamente la regresión que el diseño declaró obligatorio evitar. V-5 falla. |

## [MEDIA] 6 — V-1 no cerrado: iconos-carácter persistentes en Vault y un `→` nuevo en Accesos

| | |
|---|---|
| Canon | REGLAS (texto de F5, 12-ago): *"todo icono sale de `src/core/ui/Icon.jsx`; cero emoji y cero caracteres unicode como icono en `src/`"*. Línea base V-1 (7-ago): 147 coincidencias, resultado esperado al cerrar F5: **las 4 falsos positivos conocidos y ninguna más**. |
| Código | `src/vault/Vault.jsx:384` `icon: "📍"`, `:385` `icon: "⭐"`, `:386` `icon: "🔗"`, `:387` `icon: "€"` en `EXTRA_BADGE_FORMAT`, y `:1003` `"↓ BACKUP JSON"`. Además `src/admin/screens/Accesos.jsx:117` `→` en mensaje (coincidencia nueva). Los tres primeros ya estaban declarados "por-migrar" en la ampliación 12-ago de la Tabla A y siguen en el árbol principal. `€` no está en `LEGACY_ICON_NAMES` (`Icon.jsx:119-139`) y el grep canónico V-1 no cubre los rangos de `⭐`/`€`, así que el fallback `CircleHelp` (`Icon.jsx:143-147`) pinta un interrogante en los badges de importe. |
| Importa | La regla cero-emoji se incumple en producción y hay un icono que se renderiza como "no sé qué es esto" (la clase de bug PZ-1 que el diseño documentó en MUSIC LAB y que V1IMPL debía cerrar). Los badges de importe del detalle de entrada muestran un interrogante. |

## [MEDIA] 7 — F6/E-4 incompleto: fechas en inglés en desktop, drops y vault

| | |
|---|---|
| Canon | `DISENO_HUD` Tabla B (F6) y edición E-4: la app es entera en español; fecha y hora con `es-ES`. |
| Código | El StatusBar móvil ya es `es-ES` (`src/layout/Layout.jsx:90-100`), pero la topbar de escritorio sigue en inglés: `src/layout/Layout.jsx:457` `tick.toLocaleDateString("en-US", …) · toLocaleTimeString("en-US", …)`. También `src/musiclab/DropsManager.jsx:135` (`toLocaleTimeString("en-US")`, formato 12 h AM/PM) y `src/vault/Vault.jsx:354, :382, :491` (fechas de eras, badges y entradas en `en-US`). |
| Importa | El cliente de escritorio —el segundo cliente de primera clase que ADR-029 canonizó— muestra "AUG 12 · 14:25" en una UI en español; el fix E-4 se aplicó solo a la cabecera móvil. Incoherencia visual en 6 puntos. |

## [MEDIA] 8 — t_22e3e727: el fix de truncados aplica `line-clamp-2` también al móvil

| | |
|---|---|
| Canon | ADR-029: *"Por debajo de 1280 no cambia un solo pixel… lo que Edu ya considera bueno queda intacto y protegido por un test"*; V-8 exige capturas móviles idénticas a la línea base. El truncado corregido en escritorio era `xl:line-clamp-2` (C-6: cambio de clase solo para ≥1280). |
| Código | `.worktrees\t_22e3e727` (sin commit): `xl:line-clamp-2 xl:whitespace-normal` → `line-clamp-2 whitespace-normal` **sin prefijo xl** en `src/musiclab/TrackCard.jsx` (título, artista y nota), `src/capsules/Timeline.jsx:272`, `src/vault/Vault.jsx:458` y las filas del dock (`src/layout/Layout.jsx:566-570`). |
| Importa | En móvil los títulos/notas pasan de truncar a una línea a envolver en dos, cambiando la altura de filas y tarjetas por debajo del punto de corte. Es la regresión que ADR-029 prohíbe y que la verificación V-8 existe para cazar. |

## [MEDIA] 9 — HeartbeatWidget fabrica la fecha cuando no hay heartbeat

| | |
|---|---|
| Canon | REGLAS (texto F6): *"Nada inventado en pantalla: si el dato no está, se muestra estado vacío. Prohibidos los valores por defecto fabricados"*. Precedente E-2: se eliminó `DEFAULT_ADVENTURE_DATE` por fabricar un dato. |
| Código | `src/vault/Vault.jsx:747` — `lastHeartbeat={db?.heartbeat ?? new Date().toISOString()}`. Con `db.heartbeat` ausente, `monthsSince("ahora")` = 0 → el widget pinta "SEGURO" en verde con pulso lento (`Vault.jsx:95-163`). |
| Importa | Sin dato real, la app muestra una señal de seguridad positiva ("SEGURO") fabricada: exactamente la falsedad que E-2 eliminó para `adventures_start_date`, viva en la tarjeta hermana. El card t_4a376547 ("quitar círculo sin sentido") toca la estética; este hallazgo toca el dato. |

## [MEDIA] 10 — Atajos anunciados en la línea de estado que no existen

| | |
|---|---|
| Canon | `DISENO_HUD` §7 C-4: tabla completa en el marco — Espacio (play/pausa), ←/→, `1`/`2`/`3`, `/` (foco búsqueda), `Escape`, `?` (lista de atajos); *"la línea de estado enseña el atajo relevante"*. |
| Código | `src/layout/Layout.jsx:504-506` solo maneja `1`/`2`/`3`. El pie (`Layout.jsx:698`) anuncia `SPACE PLAY/PAUSE · ? ATAJOS`. `?` y `/` no tienen ningún handler en `src/` (grep). Espacio/←/→ existen pero viven en `WinampPlayer.jsx:190-209`, no en el marco (solo activos si el reproductor está montado). |
| Importa | La interfaz promete atajos que no responden: pulsar `?` no abre nada y `/` no enfoca el buscador. Es una promesa sin cumplir en la propia línea de estado, que es el lugar que el diseño eligió para enseñar atajos reales. |

## [MEDIA] 11 — Migración 0004 sin evidencia de aplicación a la D1 remota

| | |
|---|---|
| Canon | Precedente V-A1 / V-A1-APPLY: las migraciones 0002/0003 se verificaron y aplicaron con tarjeta explícita (`t_e8175ccc`, `t_6e54a79d`). `DISENO_REVOCACION_JWT` R1 incluye la migración como parte de la fase. |
| Código | `migrations/0004_token_epoch.sql` existe, pero `workers/schema.sql` (esquema canónico para arrancar una D1 nueva) no contiene `token_epoch`, y no hay en el repo ni en el board tarjeta de verificación/aplicación de 0004 (grep de docs: solo aparece en el diseño). `wrangler.toml:17,33` tiene `migrations_dir`, pero nada registra que se ejecutara. |
| Importa | Si la columna no existe en remoto, `checkEpochFreshness` (`workers/utils/auth.js:70`) falla en **toda** petición autenticada; si existe pero no se documenta, un despliegue nuevo desde cero rompe igual. El orden código-vs-DB del despliegue de ADR-031 no está verificado ni registrado. |

## [MEDIA] 12 — Rail desktop: segundo nivel decorativo y con indicador de estado falso

| | |
|---|---|
| Canon | `DISENO_HUD` §6 P2: segundo nivel real (filas pulsables, estado por destino, fases no implementadas atenuadas y no pulsables); R-9: *"un raíl que ofrece seis destinos de los que cuatro no llevan a ningún sitio es peor que uno honesto"*. |
| Código | `src/layout/Layout.jsx:430-437` — los hijos son `<span>` sin `onClick` (no navegan); `index === 0` está hardcodeado como activo. Con `activeTab === "music"` el raíl marca **COLA** como activo mientras el contenido muestra TRACKS (la pestaña por defecto de `MusicLab.jsx:190`). Los 6 modos de galería se pintan idénticos (CINEMA/MAP/DIALOGUE son Fase B, EXHIBITION/REEL Fase C). |
| Importa | El segundo nivel del raíl no navega y su indicador de "activo" miente sobre el estado real; el raíl ofrece 6 puertas de galería de las que 5 no llevan a ninguna parte. Es exactamente lo que R-9 pidió no hacer (tarjetas t_28e582bd / t_a584ae4f). |

## [MEDIA] 13 — La línea de estado desktop se tiñe con el vibe (contra VB9)

| | |
|---|---|
| Canon | `DISENO_HUD` §6 P5 y §8: la línea de estado es *"indicador de sistema"*, va **en color base fijo, no en el color del vibe**; VB9 (dejado expresamente sin enmendar por ADR-029). |
| Código | `src/layout/Layout.jsx:698-700` — el footer pinta `color: ${accentColor}88` y sus hijos con el acento; `src/index.css:158-159` — `border-top: color-mix(in srgb, var(--vibe-accent, #bfff00) 14%, transparent)`. |
| Importa | La única franja que el diseño quiso quieta y legible como instrumento cambia de color con la canción; la frontera de VB9 (qué NO se tiñe) está cruzada en el propio marco. |

## [BAJA] 14 — `padStart(4)` persiste en el contador de aventura

| | |
|---|---|
| Canon | E-3 (Tabla B): el relleno a 4 dígitos es *"precisión falsa"*; `0054 DÍAS` sin relleno es `54 DÍAS`. |
| Código | `src/vault/Vault.jsx:38` — `String(time.totalDays).padStart(4, "0")`. Con `startDate` nulo (iteración 2 aceptada) muestra `0000 días`. |
| Importa | El contador mantiene la precisión falsa que E-3 ordenó quitar; con dato ausente además fabrica visualmente "0000". |

## [BAJA] 15 — Rejilla de widgets de VAULT declara 4 columnas para 2 hijos (D-4 sin resolver)

| | |
|---|---|
| Canon | D-4 y F2: *"La rejilla declara `lg:grid-cols-4` pero solo hay dos hijos. Media fila en negro"*; F2 lo incluye en su ámbito. |
| Código | `src/vault/Vault.jsx:741` — `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"` con dos hijos (`AdventureCounter`, `HeartbeatWidget`). |
| Importa | En desktop la fila de widgets sigue dejando media fila vacía; el fix declarado en F2 no se aplicó. |

## [BAJA] 16 — Topbar desktop muestra solo el tab, no la ruta de tres niveles

| | |
|---|---|
| Canon | §6 P1: la ruta activa es `VAULT / 2021 / WALL` (pestaña, era, modo), el último tramo a plena opacidad. |
| Código | `src/layout/Layout.jsx:367` — `EL BÚNKER / {activeTab.toUpperCase()}`. |
| Importa | El único elemento nuevo de la topbar (la ruta) se quedó en un solo nivel: en desktop no se ve ni la era ni el modo sin deducirlos del contenido. |

## [BAJA] 17 — La API sigue sembrando el carácter `◈` como icono por defecto

| | |
|---|---|
| Canon | Regla cero-caracteres (F5) y `LEGACY_ICON_NAMES` como "puente cerrado": nada nuevo puede apoyarse en él. |
| Código | `workers/routes/tags.js:41` — `body.icon || "◈"` en el INSERT de un tag nuevo. |
| Importa | Todo tag creado sin icono nace con un carácter que solo funciona por el mapa legacy; el puente que se declaró cerrado se sigue usando como generador de datos. |

## [BAJA] 18 — AudioVisualizer: crash resuelto por caché, pero sin limpieza del grafo

| | |
|---|---|
| Canon | `DISENO_HUD` §6 P4: *"La limpieza que falta (`disconnect()` + `close()` en el desmontaje, y no tragarse el error) hay que escribirla igual"*. |
| Código | `src/musiclab/AudioGraph.js:9-11` cachea el grafo en un `WeakMap` (el `createMediaElementSource` por elemento ya no se repite → el `InvalidStateError` desaparece) y el error ya no se traga (`AudioVisualizer.jsx:149` → `console.warn`). Pero no hay `disconnect()`/`close()` en ningún desmontaje: cada sesión deja el `AudioContext` abierto. |
| Importa | El bug funcional (visualizador muerto al volver a la pestaña) está resuelto por otra vía, pero la deuda de higiene que el diseño declaró obligatoria sigue sin escribir. |

---

## Resumen de salud (5 líneas)

1. La app está en buen estado general post-merge: motor de audio único (V-4 limpio: `<audio>` solo en `PlayerContext.jsx:1730,1758`), censura server-side de Modo Visita coherente en entries/tracks/capsules/drops, consolas admin consistentes en patrón y permisos (móvil), y el fix de fecha falsa de adventures aplicado con tests.
2. La promesa de seguridad está a medias: la revocación por epoch está en producción **sin ADR en el CONTRATO** y el bump de epoch al encender Modo Visita no existe — el token previo sin censura sigue valiendo 24 h (cerradura de papel del diseño §1).
3. El encargo ADR-030 (admin dentro de la app) no se ha ejecutado: `/admin` sigue fuera de `PlayerProvider`, sin reproductor, sin marco, sin tema `--admin-*`, y sus consolas B4-B6 son inalcanzables en escritorio.
4. El escritorio arrastra deuda de pulido: atajos anunciados sin implementar, fechas en inglés, 4+ iconos-carácter residuales, línea de estado teñida con el vibe y rail decorativo con indicador falso.
5. La iteración en curso (t_22e3e727, truncados) arregla el desktop pero cambia el móvil al desprefijar `line-clamp-2`, cruzando la inmutabilidad que ADR-029 garantizó bajo 1280px.
