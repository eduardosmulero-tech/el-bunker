# CONTRATO — Acceso de testing y admin sin Google OAuth (el-bunker)

> Estado: **APROBADO por Edu el 2-ago-2026** y archivado en el repo. Escrito por Hermes
> (Principal). Original en `C:\proyectos\.trabajo\`.
> Fase SPEC/PLAN cerrada por Opus el 2-ago-2026:
> · diseño → `docs/spec/SPEC_ACCESO_TEST_ADMIN_2026-08-02.md`
> · plan → `docs/planes/PLAN_ACCESO_TEST_ADMIN_2026-08-02.md`
> · decisión canónica → ADR-028 en `docs/Nucleo/CONTRATO.md`
> Pipeline: IDEA → **CONTRATO** → SPEC → PLAN → IMPLEMENTACIÓN → REVIEW-AGENTE → REVIEW-HUMANO.
> Este contrato define QUÉ y PORQUÉ. El diseño (SPEC) lo hace Opus bajo este contrato.

---

## 1. Contexto (quién y qué)

el-bunker es una app privada tipo bóveda de memoria + reproductor musical para una pareja
(Edu y David). Stack: React 19 + Vite + Tailwind (Vercel, PWA Android), Cloudflare Worker +
D1 + R2. Tres tabs: VAULT · MUSIC LAB · CAPSULES.

La app es una **PWA con service worker cache-first** (public/sw.js). El testing y la
depuración de la PWA forman parte del ciclo de vida del proyecto: se testea en el
dispositivo real y en navegadores embebidos de herramientas de desarrollo.

Actualmente el único mecanismo de autenticación es **Google OAuth2** (flujo popup) que
emite un JWT propio firmado por el worker con `JWT_SECRET`.

## 2. Problema (verificado, no hipotético)

El login por Google OAuth es un **muro de acceso total** que bloquea el testing y la
automatización:

1. **El JWT_SECRET vive solo en el worker de producción** (workers/utils/auth.js:61-73).
   No está en el repo y no es legible con wrangler (secrets de escritura única). Nadie
   puede firmar un JWT válido desde fuera del worker. Un JWT falso con el fallback
   `dev-secret-change-me` (workers/utils/auth.js:70) NO funciona en producción porque
   `JWT_SECRET` existe y `ENVIRONMENT=production` (wrangler.toml:26).

2. **El flujo de login usa popup de Google obligatoriamente**
   (src/core/GoogleDriveService.js:144-186: `initTokenClient` + `requestAccessToken`).
   El popup:
   - se bloquea en navegadores embebidos y paneles de preview (verificado en sesión:
     error "popup failed to open");
   - no funciona en navegadores headless/remotos de agentes (no hay sesión de Google
     iniciada ni forma de completar el consentimiento);
   - añade fricción al usuario final (el propio Edu reportó odiar los logins largos).

3. **El worker exige auth en toda la API** (workers/worker.js:70-77). Sin JWT no hay
   GET /api/eras, ni subida, ni nada. Verificado: GET /api/eras anónimo → 401.

4. **Consecuencia operativa**: ni el agente (Hermes) ni scripts de testing pueden llamar
   a la API de producción. La tarjeta "subir PRUEBA al vault" (t_c316b835) — contenido
   real de la selección `D:\bunker-import-review\PRUEBA` — está bloqueada por esto, no por
   el flujo de subida (que está verificado y sano en código).

El problema NO es un bug de la app: el login Google funciona para Edu y David (Gate 1
verificado el 1-ago-2026). Es una **limitación de diseño**: un único mecanismo de auth que
depende de un navegador con sesión de Google y de un popup.

## 3. Solución pedida (objetivo, no implementación)

Un **mecanismo de acceso alternativo a Google OAuth**, de carácter **test/admin**, que
permita entrar a la API y a la app **sin Google**, a:

- **el agente (Hermes)**: llamadas autenticadas desde terminal/scripts (curl, subida en
  lote, verificación por artefacto);
- **Edu**: entrar a la app cuando quiera, sin depender del flujo popup;
- **David**: sin cambios (sigue usando Google, no se toca su flujo).

Requisitos de la solución:

- **No es una solución momentánea**: debe integrarse en el diseño de auth del proyecto de
  forma mantenible y documentada (ADR si procede).
- **El flujo Google existente queda intacto** para los usuarios que lo usan.
- **Nada destructivo**: la solución convive con lo actual; no se migra ni se rompe nada.
- **El mecanismo test/admin no debe debilitar la seguridad de los datos de la pareja**
  (contenido privado en D1/R2): el acceso alternativo debe poder revocarse y auditarse.
- **Verificación por artefacto** (curl con el mecanismo → 200 + datos reales; D1 query;
  ls R2), nunca por informe.

## 4. Porqué (decisión de Edu, 2-ago-2026)

- "Una de las ventajas de que sea PWA es que puedas testearla y depurarla. Con el login
  actual no funciona."
- "Quiero una opción de login para test y admin que no sea por Google y así tanto tú como
  yo podremos entrar."
- "No quiero soluciones momentáneas."

El testing de la PWA (subida de contenido, galería, EntryLightbox, regresiones) y la
automatización por agente son necesidades permanentes del proyecto, no puntuales. El
acceso alternativo es infraestructura: se usa hoy para la PRUEBA de subida y se usará en
cada sesión futura de verificación.

## 5. Candidatos de diseño que Opus debe evaluar (trade-offs, no decisión)

1. **Token estático de admin** (secret `ADMIN_TOKEN` en el worker, comprobado en
   `authenticate()`): mínimo, revocable cambiando el secret, funciona desde curl y desde
   la UI con un campo de acceso test. Coste: es un backdoor deliberado, requiere gestión
   del secret y auditoría.
2. **Login con usuario/contraseña propio en D1** (hash + endpoint local + pantalla):
   solución "completa" sin Google, pero añade gestión de credenciales, hashing, sesiones
   y superficie de seguridad a mantener.
3. **OAuth de Google con redirect en vez de popup**: arregla el testing desde navegadores
   embebidos sin crear backdoor, pero sigue dependiendo de Google y de sesión iniciada.
4. **Combinaciones** de las anteriores (p. ej. token estático para API + redirect para
   UI, o token para API + contraseña para UI).

Opus decide el diseño (SPEC) con estos trade-offs. Criterio de Edu: la solución debe ser
**correcta de raíz y mantenible**, no un parche.

## 6. Restricciones normativas (vinculantes)

| Fuente | Restricción |
|---|---|
| CONTRATO.md ADR-006 | Solo 3 usuarios autorizados (whitelist: admin, edu, david). Sin registro público. |
| CONTRATO.md ADR-025 | Google OAuth2 SOLO para auth. Ni una línea nueva de persistencia sobre Drive. El ADR habla de persistencia, no de exclusividad de mecanismo de login — si la solución se interpreta como enmienda del ADR, Opus debe proponer la enmienda explícita. |
| REGLAS.md R17 | Cambios por contenedor lógico completo. Nunca micro-edición. |
| REGLAS.md R19 | Nada destructivo sin gate de Edu. |
| AGENTS.md | Commits = 100% Edu (presentar comandos, esperar OK). Sin coautoría IA (R4). |
| AGENTS.md | Verificación por artefacto, nunca por informe del worker. |
| Congelación ADDENDUM 8-jul | WinampPlayer.jsx, AudioVisualizer.jsx, motor de PlayerContext.jsx, tokens.js, estética: NO se tocan. |
| Kanban | Board `el-bunker` no existe en este perfil (se perdió con el kanban previo). El contrato se entrega como documento; la tarjeta kanban se recrea si Edu lo autoriza. |

NOTA para Opus: GoogleDriveService.js NO está congelado (se tocó el 1-ago para quitar el
scope drive.readonly). El frontend de login (LoginScreen.jsx) tampoco está congelado.

## 7. Criterios de aceptación (DoD mecánico)

1. Un agente/script obtiene un JWT válido de la API de producción **sin pasar por
   Google**, con un comando reproducible (curl documentado en el README del mecanismo).
2. Con ese JWT: GET /api/eras → 200 con datos reales; POST /api/upload + PUT binario →
   201 (probado con un archivo pequeño real de la selección PRUEBA); GET /api/entries →
   200.
3. Edu puede entrar a la app sin Google (si la solución incluye UI) o el mecanismo API
   funciona de forma demostrable (según diseño aprobado).
4. El flujo Google de David sigue funcionando (verificación de login, sin cambios
   visibles).
5. El secret/cuenta de test no está en el repo, no aparece en git, y su rotación está
   documentada (procedimiento de revocación).
6. `npm run build` limpio, `npm run lint` exit 0, `npm run test` 12/12.
7. Ningún archivo congelado tocado (verificar con `git diff --stat` contra el commit
   base).
8. Documentación: ADR nuevo o enmienda + sección en el manual del proyecto (dónde y cómo
   se usa el acceso test/admin).

## 8. Fuera de alcance (no confundir con este contrato)

- La subida masiva de la selección PRUEBA (t_c316b835): es la tarjeta que ESTE contrato
  desbloquea, pero se ejecuta como trabajo aparte tras el deploy del mecanismo.
- Purga de objetos R2 huérfanos (pliego destructivo aparte).
- Pliego P2 de auditoría (VAULT + galería, §6 de la auditoría reentrada).
- Limpieza de código muerto de Drive (requiere reabrir congelación).
- Cambios en el motor de audio, reproductor o estética.

## 9. Entregables de Opus

1. Veredicto de diseño: qué candidato (o combinación) y porqué, con los trade-offs
   evaluados (1 página, no más).
2. SPEC técnica (archivo en docs/spec/): flujo de auth completo, endpoints, tabla/secret,
   UI si aplica, y el comando curl de verificación.
3. PLAN de implementación por contenedor lógico (archivos exactos, orden, verificación
   por paso).
4. Propuesta de ADR (nuevo o enmienda) si el diseño toca CONTRATO.md.

La implementación la ejecuta el rol de implementación del pipeline (no Opus). Opus entrega
diseño + spec + plan, y su veredicto se reescribe si hay contradicción con el código real.

---

*Fin del contrato. Pendiente de OK de Edu para: (1) archivar este documento en el repo
(docs/operacional/) y (2) abrir la sesión manual con Claude/Opus.*
