# BRIEF para Opus — diseño paso a paso de B1 (admin-core)

> Preparado por Sonnet (coordinador) el 5-ago-2026 para la tarjeta kanban `t_0a8cf470`, carril
> `claude`, board `el-bunker`. **No es el encargo de ejecución** — es la entrada para que Opus
> produzca el diseño paso a paso que luego ejecuta un worker premium (Luna/GPT-5.6 vía freebuff,
> o Command Code con `deepseek-v4-pro`).
> Reparto de roles vigente ([[cerebro/normas/loop-agentico/CANON_PARALELISMO_2026-08-04.md]] +
> corrección de Edu 5-ago): Sonnet coordina, Opus diseña lo fino, el worker premium ejecuta paso
> a paso, Sonnet verifica el resultado contra el código real antes de cerrar la tarjeta.

---

## 1. Qué hay que producir

Un diseño paso a paso (componente a componente, con la firma de props/hook de cada uno y el
orden de dependencia entre ellos) para que el worker premium lo ejecute sin tener que tomar
decisiones de arquitectura por su cuenta. No hace falta el JSX completo — sí la forma exacta de
cada pieza, sus props, su estado interno y cómo encajan.

## 2. El encargo original de la tarjeta (texto literal del kanban)

> Referencia: docs/planes/PLAN_CARRILES_ELBUNKER_2026-08-04.md (Ola 1, fila B1) +
> docs/disenos/DISENO_PANEL_ADMIN_2026-08-04.md (núcleo + descriptores, §2).
>
> ENCARGO: núcleo reutilizable del panel admin (viaja a vinos-carta-app tal cual): guardia de
> ruta, shell visual (barra lateral + cabecera + área de trabajo), ResourceTable
> (paginación/búsqueda/orden), ResourceForm (generado desde descriptor), ConfirmDialog
> destructivo, useAdminResource (carga/mutación/errores).
>
> ÁMBITO (P6): `src/admin/core/**`, `src/admin/__tests__/**`.
>
> DoD: monta con un descriptor de juguete; **CERO imports** de `src/vault`, `src/musiclab`,
> `src/capsules` (verificar con grep); build y lint en verde.

## 3. Por qué admin-core existe (contexto de negocio, no solo técnico)

De `docs/disenos/DISENO_PANEL_ADMIN_2026-08-04.md`: el panel se parte en **núcleo reutilizable**
(esto) + **descriptores** (propios de cada app — el-bunker tiene `entries`, `files`, `tracks`,
etc.; vinos tendrá `vinos`, `categorias`, `bodegas`). El motivo por el que manda la
reutilizabilidad sobre la comodidad de el-bunker: vinos-carta-app es un encargo real de cliente
pendiente de presupuesto, y este panel es la práctica para ese encargo. Si se escribe a mano
pantalla a pantalla para el-bunker, no transfiere nada.

Ejemplo de descriptor (forma exacta que `admin-core` debe poder consumir):

```js
// el-bunker/src/admin/resources/entries.js
export default {
  key: "entries",
  label: "ENTRADAS",
  endpoint: "/api/admin/entries",
  columns: [ {k:"date",  label:"FECHA", sort:true},
             {k:"title", label:"TÍTULO", search:true},
             {k:"era",   label:"ERA", filter:true},
             {k:"classified", label:"CLASIF.", render:"lock"} ],
  fields:  [ {k:"title", type:"text", required:true},
             {k:"note",  type:"textarea"},
             {k:"place", type:"text"} ],
  actions: ["classify", "unclassify", "delete"],
  destructive: { delete: { confirmTyping: "title", snapshot: true } },
};
```

## 4. Restricción dura de portabilidad (verificable con grep, es el DoD real)

`admin-core` viaja a vinos-carta-app **tal cual**. Por eso:

- **Prohibido** importar nada de `src/vault`, `src/musiclab`, `src/capsules` (ADR-017 🔒 intacto:
  esto no es un cuarto tab).
- **Permitido y esperado** importar `src/tokens.js` y `src/core/ui/{Button,Card,Input}.jsx` — el
  diseño oficial dice explícitamente que la estética viene de ahí (glassmorphism, tipografía
  mono). Vinos tendrá su propio `tokens.js`/`core/ui` con los mismos nombres de export; ese es un
  problema de otra tarjeta, no de esta.
- **La guardia de ruta (`AdminGuard`) no debe importar `VaultContext` ni ningún estado global del
  Búnker.** Recibe la lógica de auth inyectada (un hook `useAuth` o un objeto `{isAdmin,
  isLoading}` como prop), para que el-bunker le pase un wrapper de `VaultContext` y vinos le pase
  el suyo, sin tocar `admin-core`.
- Zero emoji en la UI — iconografía SVG. El proyecto ya usa `lucide-react` como dependencia
  (`package.json`); es la fuente de iconos por defecto salvo que Opus decida otra cosa
  explícitamente.

## 5. Cómo se autoriza el acceso (para que `useAuth`/`AdminGuard` case bien con el backend real)

De `workers/routes/auth.js` (ya implementado, ADR-028): el JWT lleva `sub: user.id`. El diseño
oficial del panel (`DISENO_PANEL_ADMIN_2026-08-04.md` §3) fija que `requireAdmin` en el Worker
comprueba `user_id === "admin"` — el 403 lo da el servidor, nunca la UI ocultando un enlace.
Consecuencia para `AdminGuard`: su trabajo NO es decidir seguridad (eso ya lo hace el Worker en
la tarjeta B2, `requireAdmin`) — es una guardia de **experiencia**: evita el parpadeo de UI
admin antes de que llegue el 403, y muestra un estado de carga/denegado coherente. El shape que
`useAuth` debería exponer para que esto encaje sin fricción: `{ isAdmin: boolean, isLoading:
boolean, user: {id, ...} | null }`.

## 6. Pieza ya entregada (no rediseñar, solo consumir)

`src/admin/core/apiClient.js` ya existe en el worktree de la tarjeta
(`C:\proyectos\dev\el-bunker\.worktrees\t_0a8cf470\src\admin\core\apiClient.js`), commiteado.
Es un cliente REST mínimo e inyectable (`createApiClient({ baseUrl, getToken })` →
`{ list, create, update, remove, action }`). Edu decidió dejarlo tal cual (5-ago) porque es
mecánico, sin criterio de diseño. El diseño de `useAdminResource` debe construirse **sobre**
este cliente, no crear uno nuevo.

## 7. Convenciones del repo que el worker premium debe seguir al ejecutar

- **Componentes:** función con `export default function Nombre({ ...props })`, sin clases.
- **Estilo:** inline `style={{...}}` con tokens de `src/tokens.js` (ver `Card.jsx`/`Button.jsx`/
  `Input.jsx` en `src/core/ui/` como referencia exacta de patrón — `FONT_MONO`, paleta de
  `accentColor` parametrizable, `motion.div`/`motion.button` de `framer-motion`).
- **Tests:** Vitest + Testing Library, patrón de `src/core/__tests__/PlayerContext.test.jsx`
  (helper `render()` con un componente `Consumer`, `describe`/`it` numerados, sin mocks de red
  salvo `fetch` cuando haga falta).
- **Lint:** `eslint.config.js` usa `eslint-plugin-react-hooks` (flat recommended) — cuidado con
  las reglas nuevas de la v7 (`react-hooks/immutability`,
  `react-hooks/preserve-manual-memoization`); si hace falta desactivar alguna localmente, seguir
  el patrón ya usado en `VaultContext.jsx` (comentario explicando por qué, no silenciar sin más).
- **Sin comentarios explicativos de qué hace el código** — solo el porqué no obvio, si lo hay.

## 8. Entregable de este brief

Diseño paso a paso, componente por componente, en este orden de dependencia:

1. `useAdminResource.js` (hook — todo lo demás lo consume)
2. `ConfirmDialog.jsx` (standalone, sin dependencias del resto)
3. `ResourceTable.jsx`
4. `ResourceForm.jsx`
5. `AdminShell.jsx` (compone Table/Form dentro del layout)
6. `AdminGuard.jsx` (envuelve el Shell)
7. Plan de tests para cada pieza + el test de montaje con descriptor de juguete que pide el DoD

Para cada componente: props exactas (nombre, tipo, opcional/requerido), estado interno si lo
tiene, y qué le pasa a sus hijos. Sonnet verificará el resultado ejecutado contra este diseño y
contra el código real antes de marcar la tarjeta como cerrada.
