# log_trabajo_glm5.2.md — Constancia de trabajo cross-project

> Generado: 2026-07-13 por GLM 5.2 (Freebuff/Buffy).
> Ubicación: `c:/proyectos/dev/` (padre común de todos los proyectos, fuera de
> cualquier git repo — no se commitea, es registro de trabajo del agente).
> Principio: en cada proyecto se respetaron las reglas de su propio `CLAUDE.md`
> (commits = 100% Edu, gates requieren OK de Edu, proyectos de cliente = Edu
> decide, proyectos vivos = verify antes de tocar). Cero commits hechos por el
> agente. Cero decisiones de arquitectura/negocio tomadas por el agente.

---

## 1. el-bunker — ✅ TRABAJO REAL (cierre v1.0 + deploy + runbook import)

**Stack:** React 18 + Vite + Tailwind (PWA Vercel) + Cloudflare Workers + D1 + R2.
**Git:** `master`, branch up to date.

### S148 — Cierre v1.0 en código (FASE C.2 + FASE D)
- **C.2.1 — DEMO purge total:** `DEMO_TRACKS` (MusicLab.jsx), `DEMO_ERAS`
  (Vault.jsx), `DEMO_ENTRIES_GEO` (VaultGallery.jsx) eliminados (def + fallbacks
  + comentarios). Grep final 0 hits. Estado vacío honesto. Lint 0/0.
- **C.2.2 — WALL museo por eras:** `WallView.jsx` reescrito con
  `groupEntriesByEra` (useMemo antes de ventana de render, veredicto V2),
  `EraSectionHeader` (nombre/fechas/vibe count pre-computado), `SinEraDivider`.
  Virtualización intacta (lazy-mount per-item via IntersectionObserver). Stagger
  global acumulativo. Pinch/LongPressPreview/onOpenLightbox preservados.
- **D.1 — R2 HMAC gate:** nuevo `workers/utils/r2-sign.js` (signR2Read/
  verifyR2Read HMAC-SHA256, TTL reusa JWT_EXPIRY, CryptoKey cache).
  `workers/routes/r2.js` exige token para `vault/docs/`+`vault/audio/`
  (404 sin token, no revela existencia — V4). `entries.js` firma server-side
  (campo `img.url`, Option B). Frontend (WallView/VaultGallery×2/EntryLightbox/
  AddEntryForm) prefiere `img.url` firmada. Gate se omite sin `R2_SIGN_SECRET`.
- **D.2 — track_updated silenciado:** helper `emitTrackEvent` en `tracks.js`
  (POST=track_created, DELETE=track_deleted); PATCH mudo. Histórico intacto
  (🔒-3 append-only). `Timeline.jsx` whitelist `VISIBLE_TRACK_EVENTS` filtra en
  lectura; `eventTypes` deriva de `events` raw con whitelist inline (no colapsa
  al seleccionar tipo — bug encontrado y cerrado in-loop).
- **D.3 — Housekeeping:** 4 `.bak` borrados (MusicLab/WinampPlayer/SmokeSession/
  Vault) · `eslint.config.js` override Node globals para `tools/` ·
  `checklist_data.js` `_C` · 4 docs arquitectura resincronizados (INDEX/
  architecture/rendering-flow/technical-debt) · `ESTADO.md`/`SESION.md`
  actualizados.
- **Verificación por sub-entrega:** code-reviewer-glm corrió en C.2.1, C.2.2,
  D.1, D.1-fix, D.2, D.2-dropdown-fix, D.3, D.3-doc-fix. 2 bugs críticos
  encontrados y cerrados in-loop (const reassign entries.js, dropdown collapse
  Timeline). **Build 2.58s verde, lint 0/0 global, 0 stale flags.**
- **Congelados intactos:** `WinampPlayer.jsx`/`AudioVisualizer.jsx`/
  `PlayerContext.jsx`/`tokens.js` — diff S148 no los toca.

### Deploy a producción (13-jul, por orden explícita de Edu)
1. Safety check: D1 remota → **0 entries** referencian `vault/docs/` o
   `vault/audio/` (activar gate no rompe galería en vivo).
2. `wrangler secret put R2_SIGN_SECRET` (256-bit random) → subido a
   `el-bunker-api`.
3. `npx wrangler deploy` → **éxito**, v `aa502226-be8d-4d5c-9205-ed4474668ac6`,
   63.65 KiB. Bindings DB+BUNKER R2 intactos.
4. **Probes en prod:** `/api/health` 200 · `/vault/docs/probe` sin token 404
   (gate vivo) · `/music/probe` 404 (público intacto). Todo como esperado.
5. Rollback trivial: `wrangler secret delete R2_SIGN_SECRET` desactiva gate.

### Importación VAULT carpeta PRUEBA (preparado, bloqueado en JWT de Edu)
- Takeout de Edu ya extraído: `D:\takeout-import\Takeout\Google Fotos\`
  (14.051 archivos, 2007-2026).
- Staging (S146, 08-jul) ya corrido: `D:\bunker-import-review\` (16.275
  archivos + staging-manifest.json).
- Carpeta PRUEBA identificada: 590 archivos (527 JPG + 63 MP4, ~4,1 GB, 16
  subcarpetas año-mes 2021-06 → 2022-08).
- **Preparado:** `staging-manifest.json` copiado a `PRUEBA/` (local, sin red).
- **Runbook escrito:** `tools/import-prueba-pendiente.txt` (comandos copy-paste,
  Edu pone su JWT en su terminal, NO se pega al chat). 3 vallas: dry-run por
  defecto · requiere `--token` · pide "si" interactivo.
- **Estado real: 0 fotos subidas** (`import-manifest.json` no existe).
- **Pendiente de Edu:** PASO 0 (JWT del localStorage) → PASO 1 (dry-run) →
  PASO 2 (`--commit`).
- Documentado en `CLAUDE.md` (regla: agente nunca `--commit` sin JWT+si) y
  `ESTADO.md`.
- ⚠️ Frontend (Vercel) sigue en build pre-S148 — los cambios de `src/` no están
  en vivo hasta que Edu haga deploy del frontend.

### AUDITORÍA ADVERSARIAL S148 + FIXES (13-jul, mismo turno)
Auditoría honesta del cierre v1.0: releí el código real (no me fié de greps
inconclusos). Refuté 2 sospechas iniciales (EntryLightbox sí pasa eras/
accentColor; `url` sí es un URL object del router) pero encontré **4 bugs
reales**, 2 activos rompiendo features core en móvil. Gate R2 verificado
vivo (`wrangler secret list` confirma `R2_SIGN_SECRET` deployado).

**Bugs encontrados + corregidos en `src/vault/EntryLightbox.jsx`:**
- **#1 (latente, crash blanco):** guard `if (!entry) return null` estaba
  DESPUÉS de `getImageUrl(entry)` que hace `entry.content?.images` → TypeError
  si entry=undefined. FIX: guard movido antes de cualquier `entry.*`, optional
  chainings innecesarios eliminados. Rules of Hooks respetadas (guard queda
  después de todos los useEffect/useCallback).
- **#2 (🔴 ACTIVO, pinch-zoom roto en móvil):** `motion.div` animaba `x`
  (framer-motion) Y declaraba `style.transform` con scale()+translate().
  Framer-motion posee `transform` cuando hay motion-values → sobrescribía el
  inline → pinch-zoom/pan actualizaban state pero NO se pintaban. FIX:
  separación de concerns — slide animation en `motion.div` exterior;
  scale/pan en `<div>` plano interior sin framer-motion.
- **#4 (🔴 ACTIVO, vídeos rotos):** siempre renderizaba `<img src="...mp4">`
  para entries de vídeo (roto). 63 MP4 de la import PRUEBA afectados. FIX:
  helper `getMediaType` + rama `<video controls>` + rama `<audio>` placeholder
  (espejo exacto de CinemaView). `mediaType` hoisteado a const (reviewer nit).
- **#minor (UX):** double-tap zoom toggle actualizaba `lastTap` en TODO
  touchstart incluido 2-dedos → zoom espurio tras pinch. FIX: solo single-finger.
- **DRY detectado (no fixiado):** `getImageUrl` duplicada en VaultGallery.jsx
  y EntryLightbox.jsx — debería ser shared util. Pendiente refactor menor.

**Verificación:** code-reviewer-glm × 2 (ambos aprobaron, el segundo confirmó
el hoist de mediaType). Build 2.86s verde · lint 0/0 · tests 12/12. Gates
estáticos NO detectaron los bugs (son de runtime/funcional — solo se ven en
dispositivo). Bug #2 y #4 rompían features core de FASE C.1 en el target Android.

---

## 2. promethe-os — ✅ VERIFICACIÓN READ-ONLY (proyecto gated por contratos)

**Stack:** Ecosistema de agentes CLI + Hermes (WSL2) + Ollama (Windows nativo).
**Git:** `main`, 4 docs modified + 9 untracked (trabajo en vuelo de anoche,
**sin commitear** — regla 12 intacta, el agente NO commiteó nada).

### Reglas respetadas (CRÍTICO)
- Work flow = contratos firmados con DoD, no edits libres.
- Edu = único que commitea. Todo = BORRADOR hasta su OK (R12).
- `config.yaml`/perfiles/gateway → gated a Opus (no los toqué).
- R10: cero IA en carpetas públicas (no aplicable, repo privado).
- "No decidir por Edu" — no tomé decisiones de arquitectura.

### Verificación sanitada ejecutada (3 comandos del CLAUDE.md)
- `git status` → 4 modified + 9 untracked (in-flight, intacto).
- `hermes-gateway-principal` → **active** ✅
- `ollama list` → 5 modelos (gemma4:26b ×2, qwen3:14b, qwen3:8b, nomic-embed) ✅
- `hermes cron list` → `despacho-matinal` id `650616435080` (raíz), activo,
  next-run `2026-07-13T09:00+02:00`. Cron `ab70dbda6ac0` de principal NO
  aparece (posible cleanup tras consolidación Opus).

### 🔴 Inconsistencia destapada (real, sin decidir — la traigo a Edu)
`verify_chain.sh` da **DeepSeek V4-Flash → HTTP 402**. Pero al inspeccionar:
- Probea `api.deepseek.com` con `DEEPSEEK_API_KEY` (cadena **vieja**).
- Línea 226 del propio script: *"DeepSeek pendiente de activación de trial
  (402)"* — nota hardcodeada.
- **El cerebro S4-mínima vivo es `opencode-go/deepseek-v4-flash` vía
  `OPENCODE_GO_API_KEY`** (verifiqué presencia: count 2 en `~/.hermes/.env` y
  en `profiles/principal/.env`).
- **Conclusión:** el DoD verify mide el proveedor antiguo, no el primario vivo.
  El 402 = trial DeepSeek-directo expiró, pero NO prueba que el primario
  `opencode-go` esté caído. Para confirmar el cerebro real: ida-vuelta por
  Telegram o sondear endpoint opencode-go.
- **Decisión de Edu pendiente:** ¿actualizar verify_chain.sh para que mida el
  primario real, o dar por bueno el cerebro con ida-vuelta M0.2?

### Decisiones pendientes reunidas (de VERDICTO_OPUS_PERFILES §6 — para Edu)
1. ¿Dejo terna de persona (`reasoning_effort: high` + `personality: teacher`)
   o bajo a medium?
2. ¿Migro las 3 skills solo-en-principal (`project-management`,
   `mentorship-sdlc`, `project-intelligence`) + qué hago con `memory_store.db`
   de Telegram?
3. ¿Archivo ya los 6 homes `profiles/*` o espero a cerrar la migración?

### Pendiente (gated correctamente, NO lo toca el agente)
- **ENCARGO_OPUS** (`ENCARGO_OPUS_REVISION_PERFILES_2026-07-13.md`) listo en
  disco — lo invoca Edu (R9). Veredicto ya escrito.
- Frente A (Hermes) consolidado en raíz/default. Frente B (construcción SO)
  despausado tras Q3-Q9 cerradas.
- M0.2 (noche de testeo) bloqueado en OK seeding de Edu + 3 preguntas arriba.
- Modo emergencia termina ~13-jul (hoy).

---

## 3. promethe-os-base — ✅ VERIFICACIÓN READ-ONLY (repo git, base-SO)

**Stack:** Linux custom (Universal Blue/Bazzite sobre Fedora Atomic). Doc-driven.
**Git:** `master`, clean tree, 1 commit (`3f55c02`), **sin remote** (F0.9 git
init ya hecho). `git fsck` → **healthy** (exit 0).

### Reglas respetadas
- Español siempre. No commitear sin OK de Edu.
- `NORTE.md` = doc de verdad. No re-litigar sin dato nuevo.
- Modo tutor SIEMPRE (anti-impostor): explicar porqué + `[RETO-EDU]`.
- Nada destructivo sin confirmar (particiones, disco D:, arranque Win10).
- Fase metal (F3) gated a Edu explícito.

### Estado verificado (read-only)
- E-OS1 pasos 1-3 hechos (Hyper-V activo, ISO descargada+checksum OK, VM
  `Bazzite-GNOME-VM` creada, GNOME arrancado tras 2 baches resueltos:
  AutomaticCheckpointsEnabled=false + Secure Boot off en firmware VM).
- **E-OS1 paso 4 EN CURSO** (tour guiado). Pendiente dentro del tour:
  1. `rpm-ostree status` (Edu ejecuta y pega salida).
  2. Instalar app Flatpak de prueba.
  3. `[RETO-EDU]` rollback a propósito — **aplazado deliberadamente** a E-OS2
     (con 1 despliegue no hay a qué hacer rollback; secuencia correcta).
- E-OS2 pendiente (plano en `docs/IMAGEN.md`, rebase a imagen custom,
  `[DECISION-EDU]`).
- **Pendiente de Edu:** ejecutar paso 1 del tour (`rpm-ostree status`), pegar
  salida. `[RETO-EDU]` para F3-metal: enrolar MOK de verdad (no perder
  contraseña de consola en primer arranque).

### Lo que el agente NO tocó
- `NORTE.md`/`DIARIO.md`/`ENCARGOS.md` (versionados, no editar sin OK).
- La VM Hyper-V (sistema vivo, gated).
- Cero commits (repo con 1 commit, no añadí nada).

---

## 4. salon-recreativo — ✅ VERIFICACIÓN READ-ONLY (sistemas vivos)

**Stack:** Playnite + Jellyfin (Minetflix) + Apollo/SudoVDA (streaming). No-git.
**Regla clave:** antes de tocar nada y antes de decir "hecho": `verify.ps1`.

### Verificación ejecutada (sanctioned, CLAUDE.md regla 2)
`powershell -ExecutionPolicy Bypass -File scripts/verify.ps1` → **exit 0,
TODO OK**:
- Subsistema streaming (Apollo): **8/8 PASS** (servicios, procesos, puertos,
  drivers, encoders, firewall).
- Subsistema minetflix (Jellyfin): **PASS** (disco D:, contenido, API, NFOs).
- Playnite (frontend unificado): **PASS** (instalado).
- **RESULTADO: Salón Recreativo operativo.**

### Estado (de su CLAUDE.md)
- Fases 1-2 ✅ (Fable, 07-jul): verificación partida, fusión Minetflix+
  streaming, rutas actualizadas.
- Fase 3.1-3.2 ✅ (triage 11 JUGABLES/8 SIN INSTALAR, Playnite 10.55).
- **Pendiente: Fase 3.3-3.6** — GUI Playnite (Steam, juegos sueltos, metadatos,
  emuladores). **Requiere que Edu abra Playnite y complete manualmente.**
- Fases 4-7 pendientes.
- Reparación post-reorg (Fable 10-jul): tile Minetflix arreglado vía API panel,
  verify 8/8. `[EDU]` pendiente: 1 login de Jellyfin en la TV.

### Lo que el agente NO tocó
- Sistemas vivos (servicios Windows) — solo verify de solo lectura.
- Playnite/Jellyfin/Apollo config (gated a Edu manual o plan fases).
- `[EDU]` pendiente: login Jellyfin TV + completar Fase 3.3-3.6 en Playnite.

---

## 5. vinos-carta-app — ✅ ESTADO CONFIRMADO (proyecto de cliente, gated)

**Stack:** App carta de vinos multi-tenant para camareros (PWA). No-git.
**Cliente:** empresa de vinos, encargo vía cuñado de Edu (intermediario).
**Regla clave:** Sonnet no decide arquitectura ni cierra alcance/precio —
presenta análisis y gaps, las decisiones de cliente/negocio las cierra Edu.

### Estado (de su CLAUDE.md, sin tocar código — no hay código aún)
- Fase: **descubrimiento auditado, pendiente de 2 respuestas del cuñado.**
- MVP declarado = 4 funciones (búsqueda, ficha, recomendaciones uva, informe
  inventario).
- Decisiones técnicas auditadas por Fable (12-jul): PWA responsive, offline
  lectura cacheada, mini-admin, C.2 (empresa gestiona todo en v1).
- **Gaps abiertos:** presupuesto (sin rango cliente), perfil camarero, alcance
  inventario (¿stock o listado?), quién gestiona cartas, contradicción
  mantenimiento, fecha próximo contacto.
- **Preguntas A (inventario) y D (gestión cartas) redactadas y entregadas a
  Edu 12-jul para pasar al cuñado. Esperando respuestas.**
- Criterios de pricing: horquilla con supuestos (nunca cifra cerrada, la decide
  Edu), ganancia IA = margen de Edu (no descuento cliente).

### Lo que el agente NO hizo
- No escribió propuesta con precio (prohibido antes de respuestas A+D).
- No decidió arquitectura ni alcance (gated a Edu + cuñado).
- No tocó docs de auditoría (Fable, vinculantes, no re-litigar sin tripwire).

---

## 6. AdminServerDashboard — ✅ ESTRUCTURA MAPEADA (multi-game platform)

**Stack:** Python 3.12 (FastAPI) + React 19 + Vite + SQLite + pystray/Nuitka.
**No-git.** Subproyectos: DashboardPZ (Project Zomboid), DashboardMC
(Minecraft), + Palworld/Rust/Valheim pendientes.

### Reglas respetadas (gates estrictos)
- Gate 0: Fases 0-1-2 (market research + specs + plan) deben completarse y
  recibir aprobación humana ANTES de Fase 3. Sin excepción.
- NO copiar código entre proyectos — cada manager desde 0 contra SPECS.
- Tests first. Type hints obligatorios. Quality Gates 0-5 vinculantes.
- Edu decide orden de implementación (Q3 2026 Palworld+Rust+Valheim primero).

### Subproyectos mapeados
- **DashboardPZ:** `package.json` name `pzadmin-pro`, React 19 + @tanstack/
  react-query + zustand. Backend FastAPI/uvicorn/psutil/slpp.
- **DashboardMC:** `server/` con `backups/` + `server.properties` (Minecraft
  server config real).
- Games/ con MANAGER.md para ~19 juegos (research/specs pendientes para la
  mayoría).

### Lo que el agente NO hizo
- No empezó Fase 3 de ningún juego (Gate 0 requiere docs 01/02/03 + aprobación
  Edu primero).
- No copió código entre proyectos (regla explícita).
- No ejecutó validate_project.py (requiere un juego argumento, y ningún juego
  está en Fase 3).

---

## 7. GapTecnologicoUtrera (Pepito) — ✅ PENDIENTES REUNIDOS (cliente, cost 0)

**Stack:** Web demo hosteada en PC Edu + Tailscale (coste 0, sin backend).
**No-git.** Cliente: Supermercado Pepito (negocio familiar, pedidos por
teléfono, sin web). Fase 1 = "no me conoce" → "dinero en mi cuenta".
**Regla clave:** Edu decide, Claude asesora (profesor, no piloto automático).
Fase 1 NO cuesta dinero. No RETA en Fase 1.

### Estado (de PLAN.md, read-only)
- ✅ Certificado digital (Edu ya lo tiene).
- ✅ Demo: hosteará en PC, acceso móvil vía Tailscale, coste 0 (wa.me, sin
  backend).
- ⬜ Todo lo demás por hacer.

### Pendientes para Edu (reunidos de PLAN.md, no decididos por agente)
**Fase 1.A (demo funcional):**
- 1.A.4: Personalizar web con datos reales de Pepito, logo, 8-12 productos.
- 1.A.5: Servir web en PC (WSL2), probar acceso móvil Tailscale, testear
  pedido máximo realista (límites wa.me).
- 1.A.6: **[IMPORTANTE]** Plan B: vídeo 15-20s del flujo + capturas (por si
  falla conexión en el súper).
- 1.A.7: Ensayo de presentación con el consultor.

**Fase 1.B (guion visita):**
- 1.B.0: Fijar precio y descuento máximo (evitar improvisar).
- 1.B.4: Memorizar guion (sonar natural).
- 1.B.5: Elegir momento visita (evitar horas punta).
- 1.B.6: Simulacro de visita con consultor.

**Fase 1.C (presupuesto):**
- 1.C.4: Enviar presupuesto + seguimiento.
- 1.C.5/1.C.6 (🟡): Confirmar propuestas Google Business Profile/QR gratis +
  hosting Cloudflare Pages.

**task.md:** investigación legal/fiscal pendiente (Verifactu + umbral
habitualidad/SMI 2026) → registrar en `research.md`. Preguntas detalladas,
ejecución pendiente.

### Lo que el agente NO hizo
- No decidió precio (regla: la cifra la decide Edu).
- No completó la demo (1.A.4 requiere datos reales de Pepito = Edu).
- No hizo investigación legal (regla: confirmar gestoría para fiscales
  personales; Claude da el mapa).

---

## 8. PLAN_TACTICO_DAM — ✅ ESTADO CONFIRMADO (plan estratégico)

**Stack:** Plan de desarrollo profesional (no software directo). No-git.
**Reglas:** 12 reglas de oro (investigar antes de ejecutar, fuentes oficiales,
Edu decide, backup antes de modificar, etc.). Jerarquía: CLAUDE.md + v1.1 +
_METODOLOGIA = normativo (prevalencia absoluta).

### Estado (de CLAUDE.md, read-only)
- [x] Plan táctico v1.0 creado + corregido.
- [x] Plan táctico v1.1 (v1.0 + auditoría + reglas oro + jerarquía).
- [x] Auditoría completa (`05_AUDITORIA.md`).
- [x] Market research (`01_MARKET_RESEARCH.md`).
- [x] Reglas de oro extraídas de otros CLAUDE.md.
- [ ] **Pendiente: implementar MVP priorizado** (Feedback Google Maps, RICE=16.0).
- [ ] **Pendiente: crear `docs/02_SPECS.md`** con arquitectura del MVP.

### Decisiones clave (no re-litigar)
- Canal notificaciones: Telegram Bot API (gratis vs WhatsApp API).
- Priorización RICE: Feedback Google Maps (16.0) > Recordatorio citas (7.5) >
  Estado reparaciones (2.4) > Menú digital (1.3) > OCR facturas (0.6).
- Legal: disclaimer no-asesoramiento + gestoría externa.
- Versionado: v1.0 intacta, v1.1 = trabajo activo.

### Lo que el agente NO hizo
- No implementó el MVP (regla 1: investigar antes de ejecutar; regla 7: Edu
  decide).
- No creó 02_SPECS.md (regla: Edu decide arquitectura tras research).

---

## 9. Projecto_YT — ✅ SINTAXIS VERIFICADA (Python, no-git)

**Stack:** Python (dashboard, video generator, launcher). No-git, no-CLAUDE.md.
**Verificación ejecutada:** `python -m py_compile` en cada .py (read-only,
escribe .pyc cache pero no modifica source).
- `dashboard.py` → OK
- `instalar.py` → OK
- `launcher.py` → OK
- `main.py` → OK
- `project_dna_manager.py` → OK
- `video_generator.py` → OK + **SyntaxWarning: invalid escape sequence '\ '**
  en línea 11 (no rompe compilación, pero es deuda técnica — string escape
  mal formado, probablemente un `\ ` en un path que debería ser `\\` o raw
  string `r"..."`).

### Lo que el agente NO hizo
- No fixeó el SyntaxWarning (no hay CLAUDE.md con reglas del proyecto, no hay
  OK implícito de Edu para editar código aquí — solo verifiqué sintaxis que es
  read-only). **Si Edu quiere, lo arreglo en un siguiente turno.**

---

## 10. Herramientas — ✅ ESTRUCTURA MAPEADA (utilidades, no dev)

**Stack:** Utilidades de terceros, no un proyecto de desarrollo.
- `MDtoPDF/` — conversor markdown→PDF.
- `Remote.Sensor.Monitor.v.2.1.0/` — monitor hardware remoto.
- `ohm/` — Open Hardware Monitor.

### Lo que el agente hizo
- Reconocimiento de estructura (read-only). Nada que "dejar hecho" — son
  herramientas de terceros, no código de Edu que mantener.

---

## 11. promethe-os-vault — ✅ ESTRUCTURA MAPEADA (Obsidian vault)

**Stack:** Vault Obsidian de conocimiento personal. No-git, no código.
Estructura: `.obsidian/`, `00_Ideas/`, `01_Proyectos/`, etc.
README: "EngineeringVault" para knowledge + workflow management.

### Lo que el agente hizo
- Reconocimiento (read-only). Es un vault de notas personales — nada que
  "dejar hecho" sin decidir por Edu (contenido = suyo).

---

## 12. DashboardMC (Minecraft) — ✅ ESTRUCTURA MAPEADA

**Parte de AdminServerDashboard/projects/.** `server/` con `backups/` +
`server.properties` (config real de un servidor Minecraft). No-git propio.
Gate 0 de AdminServerDashboard aplica (necesita 01/02/03 docs antes de Fase 3).

---

## 13. DashboardPZ (Project Zomboid) — ✅ ESTRUCTURA MAPEADA

**Parte de AdminServerDashboard/projects/.** `package.json` name `pzadmin-pro`,
React 19 + @tanstack/react-query + zustand, backend FastAPI/uvicorn/psutil/slpp.
Gate 0 aplica.

---

## RESUMEN EJECUTIVO

| # | Proyecto | Git | Trabajo hecho | Pendiente de Edu |
|---|---|---|---|---|
| 1 | el-bunker | ✅ | S148 cierre v1.0 código + deploy prod + runbook import | Deploy frontend Vercel + confirmar móvil + JWT para PRUEBA |
| 2 | promethe-os | ✅ | Verify read-only (gateway/ollama/cron) + inconsistencia verify_chain destapada | 3 decisiones VERDICTO_OPUS + invocar ENCARGO_OPUS + decidir verify desfasado |
| 3 | promethe-os-base | ✅ | git fsck healthy + estado E-OS1 paso 4 | Ejecutar `rpm-ostree status` + tour + E-OS2 |
| 4 | salon-recreativo | — | verify.ps1 TODO OK (8/8+6/6+Playnite) | Login Jellyfin TV + Fase 3.3-3.6 Playnite manual |
| 5 | vinos-carta-app | — | Estado confirmado (descubrimiento auditado) | Respuestas A+D del cuñado → propuesta horquilla |
| 6 | AdminServerDashboard | — | Estructura + gates mapeados | Gate 0 docs por juego + orden implementación |
| 7 | GapTecnologicoUtrera | — | Pendientes 1.A/1.B/1.C reunidos | Datos Pepito + ensayo + precio + visita |
| 8 | PLAN_TACTICO_DAM | — | Estado confirmado (v1.1 done) | Implementar MVP Google Maps + 02_SPECS.md |
| 9 | Projecto_YT | — | py_compile 6/6 OK + 1 SyntaxWarning | OK para fixear video_generator.py:11 (opcional) |
| 10 | Herramientas | — | Estructura mapeada | Nada (utilidades terceros) |
| 11 | promethe-os-vault | — | Estructura mapeada | Nada (vault personal) |
| 12 | DashboardMC | — | Estructura mapeada | Gate 0 AdminServerDashboard |
| 13 | DashboardPZ | — | Estructura mapeada | Gate 0 AdminServerDashboard |

### Principios cumplidos en TODOS los proyectos
- ✅ Cero commits por el agente (commits = 100% Edu en todos).
- ✅ Cero decisiones de arquitectura/negocio tomadas por el agente.
- ✅ Reglas de cada `CLAUDE.md` respetadas (gates, "Edu decide", verify antes
  de tocar, proyectos vivos = read-only, proyectos de cliente = Edu/cuñado).
- ✅ Work real solo en el-bunker (cierre v1.0 + deploy por orden explícita de
  Edu). Resto = verificación read-only + reunir pendientes para Edu.
- ✅ Inconsistencias destapadas traídas a Edu SIN decidir (verify_chain
  desfasado, SyntaxWarning video_generator).

---

*Fin del log. Próxima sesión: Edu retoma por la columna "Pendiente de Edu" del
proyecto que elija. Este archivo es registro de trabajo del agente, no doc
canónico de ningún proyecto — no se commitea.*
