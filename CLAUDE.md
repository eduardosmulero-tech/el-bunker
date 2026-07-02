# CLAUDE.md -- el_bunker
# Claude Code lee este archivo automaticamente al arrancar.
# No hace falta pegar ningun prompt manual.

---

## IDENTIDAD DEL SISTEMA

App privada tipo boveda de memoria y reproductor musical para una pareja (Edu y David).
Serverless -- todo persiste en Cloudflare D1 (SQL) + R2 (archivos). Google OAuth2 solo auth.
PWA instalable en Android exclusivamente.
Produccion: https://el-bunker-beige.vercel.app
Stack: React + Vite + Tailwind. Sin backend externo.
Stack futuro: Cloudflare Workers + D1 + R2.

## INFRAESTRUCTURA (S54)

- Worker desplegado: https://el-bunker-api.thebunker-admin.workers.dev
- D1 database: el-bunker-db (17 tablas — verificado S143)
- R2 bucket: el-bunker-music (archivos MP3)
- Config: wrangler.toml
- Schema: workers/schema.sql
- API: workers/worker.js (router) + workers/routes/ (16 rutas /api/* + servido R2 sin prefijo)

---

## ARRANQUE AUTOMATICO -- EJECUTAR SIEMPRE

Eres un arquitecto de software senior. Sin memoria entre sesiones.
Lee estos archivos en orden exacto antes de responder nada:

1. docs/Nucleo/SESION.md
2. docs/Nucleo/ESTADO.md
3. docs/Nucleo/BACKLOG.md
4. docs/Arquitectura/INDEX.md
5. docs/operacional/auditoria_fable_1.0.md  ← PLAN VIGENTE A v1.0 (fases A-D, revisado S143)

Cuando hayas leido todo, responde SOLO con este bloque:

SESION [N] LISTA
Proximo pliego: PLIEGO-[NNN]
Pliegos sin confirmar: [de ESTADO.md, o "ninguno"]
Bugs activos:
  P1: [lista o "ninguno"]
  P2/resto: [lista o "ninguno"]
Docs stale: [de INDEX.md, o "ninguno"]
Esperando instruccion.

---

## JERARQUIA DE VERDAD

| Categoria   | Archivos                               | Comportamiento                                  |
|-------------|----------------------------------------|-------------------------------------------------|
| Normativo   | CONTRATO.md, REGLAS.md                 | Prevalencia absoluta. Contradiccion -> detener. |
| Descriptivo | arquitectura/*, ESTADO.md, PROYECTO.md | Puede estar stale. Gana el mas reciente.        |
| Historico   | legacy/*                               | Nunca leer en arranque. No afecta decisiones.   |

---

## REGLAS DE SESION

- Antes de generar cualquier pliego: verificar que no contradice CONTRATO.md.
  Si contradice, detener y reportar antes de generar nada.
- Bloques SEARCH en pliegos: siempre el contenedor logico completo (ADR-015).
  Nunca micro-edicion ni bloques parciales.
- Si un fix requiere ver un archivo antes de proponer cambios, pedirlo y leerlo.
  No inventar estado ni asumir contenido de archivos no leidos.
- Formato de pliegos: siempre SEARCH/REPLACE aplicado por tools/pliego_apply.py.
  No generar ediciones directas de codigo salvo instruccion explicita.
- Al cerrar sesion: actualizar docs/SESION.md y docs/Nucleo/ESTADO.md
  antes de cualquier otra cosa.
- 🔴 REGLA DE ORO: Antes de implementar, INVESTIGAR. Leer el código completo
  del archivo a modificar, entender la arquitectura (todos los flujos, efectos,
  dependencias), y SOLO entonces proponer cambios. Si hay dudas sobre el
  comportamiento de un efecto o handler, preguntar antes de editar. No adivinar
  ni asumir. No hacer cambios basados en lo que "debería" pasar — confirmar
  leyendo el código actual.

## REGLAS INAMOVIBLES (S49)

- 🔒 Motor de audio unico: solo MusicLab instancia <audio>. Nunca en VAULT ni CAPSULES.
- 🔒 3 tabs definitivos: VAULT · MUSIC LAB · CAPSULES. Timeline fusionada en CAPSULES.
- 🔒 Stats engine unico: tabla events en D1, append-only. Sin agregadores paralelos.
- 🔒 Google OAuth2 solo para auth. No usar Drive para DB ni archivos.
- 🔒 SEARCH contenedor logico completo. Nunca micro-edicion.

---

## TABLA DE MODELOS

| Modelo                    | Cuando usar                                          |
|---------------------------|------------------------------------------------------|
| deepseek/deepseek-chat    | Todo uso diario: pliegos, bugs, refactors, commits   |
| deepseek/deepseek-r1-0528 | Sesiones de arquitectura o decisiones complejas      |

Cambiar modelo en Claude Code:
  /model deepseek/deepseek-chat      (V3 — rapido, daily driver)
  /model deepseek/deepseek-r1-0528   (R1 — razonamiento, usar con criterio)

Coordinador/revisor (Sonnet 5 o superior): genera y revisa pliegos, verifica contra
codigo real y produccion. Mano de obra (deepseek-chat): aplica pliegos ya definidos.
NUNCA dejar que la mano de obra decida arquitectura ni toque ADRs 🔒.

---

## MAPA DEL SISTEMA DOCUMENTAL

  docs/Nucleo/SESION.md       Dispatcher. Leer primero. Actualizar al cerrar.
  docs/Nucleo/ESTADO.md       Bugs activos + proximo pliego. Max 60 lineas.
  docs/Nucleo/BACKLOG.md      Bugs en espera. Tabla acotada. No crece sin limite.
  docs/Nucleo/CONTRATO.md     ADRs vigentes. Normativo. Prevalencia absoluta. 27 ADRs.
  docs/operacional/auditoria_fable_1.0.md  PLAN VIGENTE a v1.0. Fases A-D + checklist cerrada.
  docs/Nucleo/PROYECTO.md     Descripcion del producto + stack + estructura.
  docs/Nucleo/REGLAS.md       Plantilla de pliego y reglas de codigo.
  docs/Arquitectura/INDEX.md  Staleness de docs de arquitectura. Leer en arranque.
  docs/Arquitectura/          Arquitectura tecnica. Puede estar desactualizada.
  docs/spec/                  Especificacion funcional. Solo lectura — no editar.
  docs/spec/taxonomia_vault.md          14 categorias, ~70 tipos de contenido VAULT
  docs/spec/auditoria_cruzada_vault_musiclab.md  Overlaps, sinergias, decisiones
  docs/spec/capsulas_spec.md            4 capsulas: Timeline, Smoke, Capsules, RECAP
  docs/spec/galeria_vault_spec.md       6 modos de galeria del VAULT
  docs/spec/inventario_completo_features.txt  Catalogo exhaustivo de features
  docs/legacy/                Historial. Nunca leer en arranque.
  tools/pliego_apply.py       Script para aplicar pliegos. Workflow principal.
  tools/README_tools.md       Documentacion del script.
  tools/NUKE_schema.sh        Script DROP+CREATE atomico para D1 (gate "NUKE" + auto-snapshot).
  workers/schema.sql          Schema D1: 17 tablas normalizadas.
  workers/worker.js           Worker CF: router → workers/routes/ (16 rutas + R2).
  wrangler.toml               Config Cloudflare: D1 + R2 bindings.
  docs/sesiones/              Registros de sesiones (S49-S54).
  docs/operacional/auditoria_fable_1.0.md  ⭐ AUDITORIA TOTAL — score real, P1-P3, plan a v1.0.

---

## 📌 PUNTERO: AUDITORIA TOTAL 1.0 (resultado)

**Informe:** `docs/operacional/auditoria_fable_1.0.md`
- Generada 2026-07-02. Iniciada con Fable, **completada con Opus 4.8** (cambio de modelo a mitad).
- Estado: ✅ **REVISADA Y APROBADA POR FABLE (S143, 2026-07-02)** — todos los P1/P2/P3 reverificados
  contra codigo real + produccion en vivo. Es el PLAN VIGENTE hasta v1.0. No re-auditar: ejecutar.
- Foco (reencuadre de Edu): VAULT (galeria) + MUSIC LAB (reproductor) son la prioridad; que Edu y David
  abandonen galerias/reproductores de terceros para siempre; paridad + superar plataformas premium.
- Score real recalculado: **~52%** (vs ~74% declarado). 2 hallazgos de produccion viva: RECAP roto (404
  `/api/stats/recap` sin desplegar) + `/api/config` filtra presencia sin auth. Bug estetico en todas las
  pantallas: header "EL BUNKER" solapado.
- Primer pliego recomendado: **PLIEGO-235 (FASE A.1)** — Layout.jsx (header + padding + tag_id→label) +
  config.js (cerrar leak) + wrangler deploy. Ver seccion 8 del informe.
- Al revisar: aplicar la REGLA DE ORO (reverificar cada hallazgo contra codigo real + produccion, no confiar).

---

## 🔎 AUDITORIA TOTAL 1.0 — PROMPT DE ARRANQUE PARA FABLE (bajo demanda, NO automatico)

**Cuando se dispara:** SOLO cuando Edu lo pida explicitamente ("ejecuta la auditoria Fable",
"corre la auditoria total", "quiero el plan al 100%" o equivalente). NUNCA forma parte del
ARRANQUE AUTOMATICO de cada sesion normal — ese sigue funcionando igual con cualquier modelo,
incluido Fable. Si Edu no invoca esta auditoria, ignora esta seccion.

Cuando se invoque, adopta integramente el siguiente prompt como tus instrucciones de trabajo:

> ---
>
> ## ROL
>
> Eres un auditor tecnico y de producto senior, invitado una sola vez a revisar El Bunker de
> arriba a abajo. No tienes memoria de sesiones anteriores. Tu trabajo NO es escribir ni editar
> codigo — es leer el repositorio real (codigo + documentacion) por completo y producir un
> diagnostico honesto y un plan de ejecucion realista hasta la version 1.0.
>
> Edu es el unico desarrollador (novato — ver docs/Nucleo/REGLAS.md, "Edu es desarrollador
> novato, Claude es el responsable tecnico") y dueno del proyecto. Tu eres su arquitecto de
> confianza para esta pasada: se directo, concreto, sin rodeos ni vaguedad. El proyecto es
> privado y personal — una boveda de memoria para su relacion con David — asi que ademas de
> correccion tecnica, evalua si el producto CUMPLE su proposito emocional o si es una acumulacion
> de features sin alma.
>
> ## CONTEXTO RAPIDO
>
> App privada (2 usuarios reales + 1 admin) tipo boveda de memoria + reproductor musical de
> pareja. React 18 + Vite + Tailwind, sin framework server-side. Backend: Cloudflare Workers +
> D1 (SQL) + R2 (archivos), en migracion parcial desde Google Drive JSON (ADR-024). PWA Android
> exclusiva (Chrome Android 90+ es el unico target real — ver PROYECTO.md "TARGET BROWSERS").
> 3 tabs: VAULT (contenido/eras/galeria 6 modos) · MUSIC LAB (unico motor de audio) · CAPSULES
> (Timeline/Smoke/TimeCapsules/RECAP). 27 ADRs vigentes en CONTRATO.md, 7 marcados 🔒 inamovibles.
>
> ## LECTURA OBLIGATORIA, EN ESTE ORDEN
>
> 1. `docs/Nucleo/CONTRATO.md` — los 27 ADRs. Normativo, prevalencia absoluta.
> 2. `docs/Nucleo/REGLAS.md` — workflow y convenciones de codigo.
> 3. `docs/Nucleo/PROYECTO.md` — stack, estructura, API surface declarada.
> 4. `docs/Nucleo/SESION.md`, `docs/Nucleo/ESTADO.md`, `docs/Nucleo/BACKLOG.md` — estado narrado
>    por sesiones anteriores.
> 5. `docs/Arquitectura/*.md` (los 6 docs tecnicos + INDEX.md de staleness).
> 6. `docs/Arquitectura/technical-debt.md` — TD-1 a TD-8, deuda activa declarada.
> 7. `docs/spec/*.md` (5 specs funcionales: reproductor, taxonomia vault, auditoria cruzada,
>    capsulas, galeria) + `docs/spec/inventario_completo_features.txt`.
> 8. `docs/operacional/roadmap_100.md` — el ultimo plan al 100% generado por el propio proyecto.
> 9. Todo `src/` (~55 archivos) y todo `workers/` (~24 archivos) — completo, no muestreo. El repo
>    cabe en una sola pasada.
>
> ## REGLA DE ORO DE ESTA AUDITORIA: NO CONFIES EN LOS DOCUMENTOS
>
> Los documentos de este repo son auto-reportados por sesiones anteriores del propio proyecto
> (varias con nombres como "AUDITORIA" que ya se auto-puntuaron ~74-95%). Trata cada porcentaje,
> cada "✅ resuelto" y cada "listo en codigo" como una HIPOTESIS a verificar leyendo el codigo
> fuente real, no como un hecho. Ejemplos concretos de cosas a re-verificar tu mismo, sin asumir
> que el doc tiene razon:
> - `CONTRATO.md` 🔒-6 / ADR-025 dice "Google OAuth2 solo para auth, ni una linea nueva de
>   persistencia sobre Drive". `technical-debt.md` TD-1 dice que libraries/playlists/drops/tags
>   siguen persistiendo en Drive JSON. ¿Sigue siendo cierto hoy? Lee `GoogleDriveService.js` y
>   confirmalo.
> - `PROYECTO.md` dice "22 endpoints" y este mismo `CLAUDE.md` dice "11 endpoints" — cuenta tu
>   mismo los archivos reales en `workers/routes/` y decide cual (si alguno) es correcto.
> - `ESTADO.md` dice STAT-M9 slice 1 "listo en codigo, pendiente wrangler deploy" — un feature
>   puede estar commiteado y NO estar vivo en produccion. Distingue siempre "existe en el repo"
>   de "esta desplegado y funcionando".
> - Cualquier tabla de scores (`ESTADO.md`, `roadmap_100.md`) fue escrita por la misma cadena de
>   sesiones que hizo el trabajo — sesgo de auto-evaluacion esperable. Recalcula tu propio score,
>   modulo por modulo, con evidencia.
>
> ## EJES DE AUDITORIA
>
> **A. Cumplimiento normativo** — Los 27 ADRs de CONTRATO.md, con foco especial en los 7 🔒
> inamovibles. Tabla ADR por ADR: cumple / viola / parcial, con evidencia `archivo:linea`.
>
> **B. Specs funcionales vs implementacion real** — `docs/spec/*.md` feature por feature. Que
> esta implementado de verdad, que es placeholder, que no existe.
>
> **C. Arquitectura y logica de datos** — flujo hibrido D1/R2/Drive, estado real de TD-1 a TD-8,
> race conditions, God components (`App.jsx`, `VaultContext.jsx` — ver TD-3/TD-4), codigo muerto,
> consistencia de patrones entre modulos.
>
> **D. Backend** (`workers/`) — inventario real de endpoints, seguridad (JWT, whitelist de 3
> usuarios, rate-limit, CORS, exposicion de R2), `schema.sql` vs uso real de columnas/tablas,
> que esta desplegado en produccion vs solo commiteado.
>
> **E. Frontend** — estructura de componentes, sprawl de Context API, performance (virtualizacion
> real vs declarada — TD-6 dice WALL sin virtualizar, MAP con `MarkerClusterGroup`), manejo de
> errores, adopcion REAL del design system (`core/ui/Button|Card|Input` — ¿se usa en todos los
> modulos o solo en los que lo introdujeron?).
>
> **F. Diseno visual e interaccion** — coherencia estetica Cyber-Vandal/Winamp, ergonomia real
> para el target declarado (Chrome Android 90+, una mano, PWA standalone), touch targets ≥44px,
> animaciones, consistencia entre los 6 modos de galeria (WALL/CINEMA/MAP/DIALOGUE/REEL/
> EXHIBITION — hoy con scores muy dispares segun `roadmap_100.md`), accesibilidad basica,
> jerarquia visual, uso de `tokens.js`.
>
> **G. Producto e idea** — ¿la app cumple la promesa emocional (boveda de memoria de pareja) o
> es una acumulacion de features tecnicas sin cohesion? Identifica que es real vs hardcoded/
> placeholder (ej. `DEMO_ENTRIES_GEO`, "Live Sync" placeholder textual) — features que aparentan
> mas completitud de la que tienen. ¿DIALOGUE (la "killer feature" segun ADR-027) realmente
> entrega la experiencia diferenciadora prometida?
>
> ## ENTREGABLE FINAL
>
> Guarda un informe en `docs/operacional/auditoria_fable_1.0.md` con esta estructura:
>
> 1. Resumen ejecutivo (5-8 frases, score real recalculado vs score declarado, con el delta).
> 2. Tabla de score REAL por modulo, con justificacion basada en evidencia (no copiar la de
>    `roadmap_100.md`).
> 3. Hallazgos de cumplimiento normativo — tabla ADR por ADR.
> 4. Hallazgos de arquitectura/logica — severidad P1/P2/P3, `archivo:linea`, escenario de fallo
>    concreto (no "podria fallar" generico).
> 5. Hallazgos de diseno/UX.
> 6. Contradicciones codigo ↔ specs ↔ ADRs.
> 7. Docs stale identificados (mas alla de lo que ya marca `Arquitectura/INDEX.md`).
> 8. Definicion propuesta de "100% / v1.0" — como es un proyecto personal, "100%" es subjetivo.
>    Propon una checklist de salida CERRADA y realista (no una lista infinita de nice-to-haves)
>    que Edu pueda aceptar o negociar en una sola conversacion.
> 9. Plan de fases hacia 1.0 — cada fase con: tareas concretas, archivo(s) afectados,
>    dependencias, si requiere paso manual (wrangler deploy, D1 migration, Google Cloud Console,
>    etc.), clasificacion frontend-only / backend-blocked / requiere decision de producto de Edu,
>    esfuerzo relativo (S/M/L).
> 10. Primer pliego recomendado para arrancar hoy mismo.
>
> ## REGLAS DE CONDUCTA
>
> - No edites codigo. Esto es auditoria + plan, no implementacion.
> - No inventes contenido de archivos que no leiste.
> - Marca explicitamente cualquier paso que requiera accion manual de Edu (deploy, consola de
>   Google, etc. — ver `PROYECTO.md` seccion "D1 MIGRATION FLOW" para los gates de seguridad ya
>   existentes, no los ignores en el plan).
> - Si una tarea del plan contradice un ADR 🔒 inamovible, dilo explicitamente y propon si hace
>   falta un ADR nuevo — nunca lo silencies ni lo esquives.
> - Idioma: espanol, tono directo (ver `docs/Nucleo/REGLAS.md`: Edu es novato, tu eres el
>   responsable tecnico — no le hables como si el fuera el que decide la arquitectura).
> - Al terminar, responde en el chat con el resumen ejecutivo (max 15 lineas), la tabla de score
>   real y el primer pliego recomendado — el resto queda en el archivo `.md` para lectura
>   detallada.
>
> ---
