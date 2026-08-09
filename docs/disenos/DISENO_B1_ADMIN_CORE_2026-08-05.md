# DISEÑO PASO A PASO — B1 `admin-core`

> **Estado: 🟢 EJECUTABLE** (Opus, 5-ago-2026). Entregable del brief
> `docs/planes/BRIEF_OPUS_B1_ADMIN_CORE_2026-08-05.md`, tarjeta `t_0a8cf470`, carril `claude`.
> **Destinatario:** el worker premium que ejecuta. No tiene que tomar ninguna decisión de
> arquitectura: si algo no está aquí, se pregunta — no se improvisa.
> **Canon leído antes de diseñar:** `docs/Nucleo/CONTRATO.md`, `docs/Nucleo/REGLAS.md`,
> `docs/Nucleo/ESTADO.md`, `docs/disenos/DISENO_PANEL_ADMIN_2026-08-04.md`,
> y el código real de `src/core/ui/*`, `src/tokens.js`, `src/core/__tests__/*`.
> **Ámbito (P6):** `src/admin/core/**` y `src/admin/__tests__/**`. Nada fuera de ahí.

---

## 0. Tres correcciones al brief, verificadas contra el código

El brief se escribió sin abrir `src/core/ui/`. Al abrirlo aparecen tres cosas que cambian el
diseño. Se ejecuta lo de aquí, no lo del brief, en estos tres puntos:

1. **`src/core/ui/Dialog.jsx` ya existe** con focus trap, cierre con `Escape`, `role="dialog"`,
   `aria-modal`, devolución del foco al cerrar y backdrop. `ConfirmDialog` de `admin-core` **se
   construye encima de ese `Dialog`**, no se escribe un modal nuevo. Un segundo modal en el
   proyecto sería deuda inmediata y a11y peor.

2. **⚠️ COLISIÓN DE NOMBRE — leer dos veces.** `src/core/ui/Dialog.jsx` **ya exporta un
   `ConfirmDialog`** (sí/no simple, sin escritura de confirmación). El `ConfirmDialog` de
   `admin-core` es **otro componente distinto** (exige teclear el nombre del ítem + avisa del
   snapshot). Import correcto en `admin-core`:

   ```js
   import Dialog from "../../core/ui/Dialog";          // ✅ default export, el modal base
   // import { ConfirmDialog } from "../../core/ui/Dialog";   // ❌ NUNCA: es el otro, el simple
   ```

3. **Los iconos salen de `src/core/ui/Icon.jsx`, no de `lucide-react` directamente.** `Icon` es un
   registro cerrado de nombres sobre lucide-react, y es lo que hace cumplible la regla "cero
   emoji" de forma verificable. Todos los iconos que necesita `admin-core` ya están en el
   registro — **no hay que añadir ninguno**: `search`, `plus`, `edit`, `trash`, `refresh`,
   `arrowUp`, `arrowDown`, `chevronLeft`, `chevronRight`, `alert`, `shield`, `lock`, `unlock`,
   `check`, `close`, `archive`, `settings`, `user`, `document`, `analytics`.

Añado además una pieza a la lista de 6 del brief (§8): **`ResourceConsole.jsx`**, entre
`ResourceForm` y `AdminShell`. Motivo en §7. No amplía el ámbito — sigue entero en
`src/admin/core/`.

---

## 1. El contrato de portabilidad, escrito como lista cerrada

`admin-core` viaja a `vinos-carta-app` tal cual. Eso significa que **el conjunto de imports
permitidos es una lista cerrada**, y hay un test que la verifica fichero a fichero (§10.7). Un
import fuera de esta lista es un fallo de DoD, no un detalle de estilo.

| Permitido | Forma exacta |
|---|---|
| React | `react` |
| Animación | `framer-motion` |
| Tokens | `../../tokens` |
| Design system | `../../core/ui/Button`, `.../Card`, `.../Input`, `.../Dialog`, `.../Icon`, `.../Skeleton` |
| Interno | `./loQueSea` dentro de `src/admin/core/` |

**Prohibido:** `src/vault/*`, `src/musiclab/*`, `src/capsules/*`, `src/smoke/*`, `VaultContext`,
`PlayerContext`, `GoogleDriveService`, `WorkerDataService`, `FileUploadService`, y cualquier
`lucide-react` directo.

Vinos tendrá su propio `tokens.js` y su propio `core/ui/` con **los mismos nombres de export**;
eso es problema de otra tarjeta. Lo que B1 debe garantizar es que no haya nada más que portar.

**Dependencia de Tailwind:** `admin-core` usa clases de Tailwind **solo para layout responsive**
(`hidden md:flex`, `md:hidden`, `flex`, `gap-*`). Todo lo visual (color, tipografía, borde,
espaciado interno) va en `style={{...}}` con tokens. Si vinos no tuviera Tailwind, el panel se
degrada a un flujo apilado legible, no a algo roto. Esto se documenta en la cabecera de
`index.js` y no se resuelve aquí.

---

## 2. El descriptor — contrato normativo

Todo el núcleo consume esta forma. Es la del diseño canónico
(`DISENO_PANEL_ADMIN_2026-08-04.md` §2), aquí formalizada con los opcionales y sus defaults.
**El worker no inventa campos nuevos.**

```js
{
  key:      "entries",              // requerido · id único, React key y estado activo del shell
  label:    "ENTRADAS",             // requerido · rótulo en la barra lateral
  endpoint: "/api/admin/entries",   // requerido · ruta base REST
  icon:     "document",             // opcional · nombre del registro de Icon · default "document"
  idKey:    "id",                   // opcional · default "id"
  pageSize: 25,                     // opcional · default 25

  columns: [                        // requerido · orden de columnas de la tabla
    { k: "date", label: "FECHA", sort: true },
    { k: "title", label: "TÍTULO", search: true },
    { k: "era", label: "ERA", filter: true, options: ["2021", "2022"] },
    { k: "classified", label: "CLASIF.", render: "lock" },
  ],

  fields: [                         // requerido · campos del formulario alta/edición
    { k: "title", type: "text", required: true },
    { k: "note",  type: "textarea" },
    { k: "place", type: "text" },
  ],

  actions: ["classify", "unclassify", "delete"],          // opcional · default []
  destructive: {                                          // opcional · default {}
    delete: { confirmTyping: "title", snapshot: true },
  },
}
```

**Semántica de cada llave, sin margen de interpretación:**

- `columns[].sort: true` → la cabecera es un botón que cicla `asc → desc → sin orden`.
- `columns[].search: true` → **no** hace nada por columna. Marca que existe búsqueda libre; basta
  con que **una** columna lo lleve para que se pinte el buscador. El servidor decide sobre qué
  campos busca. (No se implementa búsqueda cliente: hay paginación de servidor, filtrar en
  cliente daría resultados falsos.)
- `columns[].filter: true` → pinta un control de filtro para esa columna. Si además hay
  `options: []`, es un `<select>`; si no, es un input de texto libre.
- `columns[].render` → clave del registro `CELL_RENDERERS` (§5.2) o una función
  `(value, row) => ReactNode`. Default: `"text"`.
- `fields[].type` ∈ `text | textarea | number | date | select | checkbox`. `select` exige
  `options: [{value,label}]` o `["a","b"]`.
- `fields[].label` → opcional; si falta se usa `k.toUpperCase()`.
- `actions[]` → nombres de acción que se ofrecen por fila. `"delete"` es especial: usa
  `client.remove`. Cualquier otro nombre usa `client.action(endpoint, id, name)`.
- `destructive[action]` → si existe, esa acción pasa por `ConfirmDialog` antes de ejecutarse.
  - `confirmTyping: "title"` es **una clave de campo**, no un literal: quien abre el diálogo
    resuelve `row["title"]` y le pasa el valor ya resuelto (§6).
  - `snapshot: true` → el diálogo **avisa** de que el servidor guardará snapshot previo. **No
    implementa snapshot ninguno.** El snapshot es trabajo del Worker (B2/B4). Si el worker
    premium se ve escribiendo lógica de snapshot en cliente, se ha salido del ámbito.

---

## 3. Contrato con el servidor (lo que `useAdminResource` espera y lo que tolera)

`client` es el objeto que devuelve `createApiClient` (§6 del brief — **ya existe, no se toca**):
`{ list, create, update, remove, action }`.

**Petición de listado:**

```js
client.list(endpoint, { page, pageSize, q, sort, dir, ...filters })
```

`toQuery` de `apiClient.js` ya elimina `undefined` y `""`, así que se pasan siempre todas las
llaves sin condicionales.

**Respuesta esperada:** `{ items: [...], total: 123 }`.

**Respuesta tolerada:** un array pelado `[...]` → se normaliza a
`{ items: respuesta, total: respuesta.length }`.

Esa tolerancia es deliberada y **no se quita**: B2 (`/api/admin/*`) aún no existe cuando se
ejecuta B1, y el backend de vinos será otro. Normalizar en un único punto (`normalizeList`,
función privada de `useAdminResource.js`) evita que la forma del servidor se filtre a los
componentes.

---

## 4. `useAdminResource.js` — paso 1

Único fichero con lógica de datos. Todo lo demás es presentación controlada.

### 4.1 Firma

```js
export default function useAdminResource(descriptor, {
  client,              // requerido — el de createApiClient()
  pageSize,            // opcional — default descriptor.pageSize ?? 25
  debounceMs = 300,    // opcional — 0 en tests
  onAudit,             // opcional — (evento) => void
}) { ... }
```

### 4.2 Qué devuelve — exacto

```js
{
  // datos
  rows, total, page, pageCount, pageSize,
  // controles de consulta
  query, sort, filters,          // sort: { k, dir: "asc"|"desc" } | null · filters: { [k]: string }
  setQuery, setSort, setFilter, setPage, refresh,
  // ciclo de vida de la carga
  status,                        // "loading" | "ready" | "error"
  error,                         // Error | null
  // mutaciones
  create, update, remove, runAction,
  mutation,                      // { pending: boolean, error: Error | null }
}
```

### 4.3 Estado interno

| Estado | Tipo | Inicial |
|---|---|---|
| `rows` | array | `[]` |
| `total` | number | `0` |
| `page` | number | `1` |
| `query` | string | `""` |
| `debouncedQuery` | string | `""` |
| `sort` | `{k,dir}` \| null | `null` |
| `filters` | object | `{}` |
| `status` | string | `"loading"` |
| `error` | Error \| null | `null` |
| `mutation` | `{pending,error}` | `{pending:false,error:null}` |
| `reloadToken` | number | `0` |

Refs: `requestIdRef` (contador monótono) y `mountedRef`.

`pageCount` es derivado, no estado: `Math.max(1, Math.ceil(total / pageSize))`.

### 4.4 Reglas de comportamiento

1. **Carrera de peticiones.** Cada carga incrementa `requestIdRef.current` y guarda su id local;
   al resolver, si `requestIdRef.current !== idLocal` **se descarta el resultado en silencio**.
   Sin esto, teclear rápido en el buscador deja la tabla mostrando una respuesta vieja. No se usa
   `AbortController`: `apiClient.js` no acepta `signal` y Edu lo congeló (brief §6).

2. **Debounce solo de la búsqueda.** `query` se actualiza en cada tecla (input responsivo);
   `debouncedQuery` se actualiza `debounceMs` después y **es el único que dispara carga**. Con
   `debounceMs: 0` el efecto sigue pasando por `setTimeout(…, 0)` — los tests hacen `await tick()`
   y ya está.

3. **Disparadores de carga** (dependencias del efecto de fetch): `page`, `debouncedQuery`, `sort`,
   `filters`, `reloadToken`, `descriptor.endpoint`. Nada más.

4. **Reset de página en los setters, nunca en un efecto.** `setQuery`, `setSort` y `setFilter`
   hacen `setPage(1)` dentro del propio setter. Hacerlo en un `useEffect` encadena renders y pelea
   con `react-hooks/exhaustive-deps` sin ganar nada.

5. **`setSort(k)` recibe la clave, no el objeto.** Ciclo: sin orden → `{k,dir:"asc"}` →
   `{k,dir:"desc"}` → `null`. Si llega una `k` distinta a la actual, arranca en `"asc"`.

6. **`setFilter(k, value)`** → `setFilters(prev => ({ ...prev, [k]: value }))`. Valor `""` se
   queda; `toQuery` ya lo descarta al serializar.

7. **`refresh()`** → `setReloadToken(n => n + 1)`. Es la única forma de recargar; las mutaciones
   la usan.

8. **Las mutaciones NO lanzan.** Todas devuelven `{ ok: true, data }` o `{ ok: false, error }`.
   Es lo que permite que el diálogo se quede abierto mostrando el error sin `try/catch` repartido
   por la UI ni promesas sin capturar.

   ```js
   create(data)                 // POST endpoint
   update(id, data)             // PATCH endpoint/id
   remove(id)                   // DELETE endpoint/id
   runAction(name, id, data)    // "delete" → remove(id) · resto → POST endpoint/id/name
   ```

   Envoltorio común (función privada `runMutation(fn, auditPayload)`):
   `mutation = {pending:true,error:null}` → `await fn()` → en éxito `refresh()` y
   `{ok:true,data}` → en fallo `mutation.error = err` y `{ok:false,error}` → siempre
   `pending:false` y llamada a `onAudit` si existe.

9. **Borrado de la última fila de la última página.** Tras un `remove` con éxito, si
   `rows.length === 1 && page > 1` → `setPage(page - 1)` (que ya recarga) en lugar de `refresh()`.
   Si no, `refresh()`. Sin esto el admin se queda mirando una página vacía.

10. **`onAudit` no es un motor de estadísticas.** Es un callback que reenvía
    `{ action, resource: descriptor.key, id, ok, error }` a quien monte el panel. **ADR-019 🔒-5:
    el evento real lo escribe el Worker en `events`.** Prohibido acumular, agregar o contar nada
    en cliente.

11. **Desmontaje.** `mountedRef` a `false` en el cleanup; ningún `setState` después.

### 4.5 Lint

Este hook es el punto donde `eslint-plugin-react-hooks` v7 va a protestar. Regla: **primero se
intenta que el código no necesite excepción** (setters estables con `useCallback`, funciones puras
fuera del componente). Si aun así hace falta silenciar, se hace **por línea y con el porqué**,
igual que `VaultContext.jsx:202`:

```js
// eslint-disable-next-line react-hooks/exhaustive-deps
```

Nunca un `eslint-disable` de fichero entero en ficheros nuevos.

---

## 5. `ConfirmDialog.jsx` — paso 2

Standalone. Solo depende de `Dialog`, `Button`, `Input`, `Icon` y tokens.

### 5.1 Props

| Prop | Tipo | Req. | Default | Qué hace |
|---|---|---|---|---|
| `open` | bool | ✅ | — | Visibilidad |
| `title` | string | ✅ | — | Cabecera del modal |
| `message` | string \| node | — | `null` | Texto explicativo |
| `confirmTyping` | string | — | `null` | **Valor literal ya resuelto** que hay que teclear |
| `typingLabel` | string | — | `"ESCRIBE EL NOMBRE PARA CONFIRMAR"` | Etiqueta del input |
| `snapshot` | bool | — | `false` | Pinta el aviso de snapshot previo |
| `confirmLabel` | string | — | `"CONFIRMAR"` | Texto del botón destructivo |
| `accentColor` | string | — | `ACID` | Acento del modal (el botón destructivo siempre `RED`) |
| `onConfirm` | fn | ✅ | — | `async () => result` — puede devolver `{ok,error}` de la §4.4.8 |
| `onClose` | fn | ✅ | — | Cierre |

### 5.2 Estado interno

`typed` (string), `busy` (bool), `localError` (Error \| null).

`useEffect` sobre `[open]`: al abrirse, resetea los tres. No se usa el truco de `key` de
`TextPromptDialog` porque aquí el reset debe ocurrir al abrir, no al cerrar.

### 5.3 Comportamiento

- Si `confirmTyping` es falsy → sin input, el botón confirma directamente.
- Si tiene valor → botón `disabled` hasta que `typed.trim() === confirmTyping.trim()`.
  **Comparación sensible a mayúsculas**: la fricción es el punto del control, no un obstáculo a
  suavizar.
- `Enter` en el input, con la comparación satisfecha, confirma.
- Al confirmar: `busy = true` → `await onConfirm()`. Si el resultado es `{ok:false,error}` **o**
  la promesa rechaza → `localError` y el diálogo **se queda abierto**. Si es correcto → `onClose()`.
- `snapshot: true` → línea con `<Icon name="archive" size={12} decorative />` y el texto
  `SE GUARDARÁ UN SNAPSHOT PREVIO`. Informativo. **Cero lógica de snapshot en cliente.**
- Botón destructivo: `<Button accentColor={RED} loading={busy}>`; cancelar:
  `<Button variant="secondary" disabled={busy}>`.
- Encabeza el cuerpo un `<Icon name="alert" size={14} />` en `RED`.

---

## 6. `ResourceTable.jsx` — paso 3

**Presentacional y totalmente controlado.** No llama al `client`, no tiene estado de datos, no
conoce `useAdminResource`. Se puede montar en un test con arrays a mano.

### 6.1 Props

| Prop | Tipo | Req. | Default |
|---|---|---|---|
| `columns` | array del descriptor | ✅ | — |
| `rows` | array | ✅ | — |
| `idKey` | string | — | `"id"` |
| `status` | `"loading"\|"ready"\|"error"` | — | `"ready"` |
| `error` | Error \| null | — | `null` |
| `query` | string | — | `""` |
| `onQueryChange` | `(string) => void` | — | `null` — si falta, no se pinta el buscador |
| `sort` | `{k,dir}` \| null | — | `null` |
| `onSortChange` | `(k) => void` | — | `null` — si falta, cabeceras no clicables |
| `filters` | object | — | `{}` |
| `onFilterChange` | `(k, value) => void` | — | `null` |
| `page` / `pageCount` / `total` | number | — | `1` / `1` / `0` |
| `onPageChange` | `(n) => void` | — | `null` — si falta, no se pinta el paginador |
| `actions` | `[{name,label,icon,tone}]` | — | `[]` |
| `onAction` | `(name, row) => void` | — | `null` |
| `onRowClick` | `(row) => void` | — | `null` |
| `selectedIds` | `string[]` | — | `null` |
| `onSelectionChange` | `(ids) => void` | — | `null` |
| `accentColor` | string | — | `ACID` |
| `emptyLabel` | string | — | `"SIN REGISTROS"` |

**Sobre `selectedIds`/`onSelectionChange`:** la columna de casillas **solo se renderiza si
`onSelectionChange` está definido**. B1 no la usa, pero B3 (marcado de clasificación en lote) es
la razón por la que existe el panel — el Modo Visita con 527 fotos no es usable sin ella
(`DISENO_PANEL_ADMIN_2026-08-04.md` §4.1). Dejar el hueco ahora cuesta ~15 líneas; añadirlo
después obliga a reescribir la tabla. Se implementa la mecánica (cabecera "seleccionar todo" de la
página + casilla por fila), no se consume.

### 6.2 Registro de renderizadores de celda

Constante de módulo, fuera del componente:

```js
const CELL_RENDERERS = {
  text:   (v) => (v ?? "") === "" ? "—" : String(v),
  number: (v) => (v == null ? "—" : Number(v).toLocaleString("es-ES")),
  date:   (v) => (v ? new Date(v).toLocaleDateString("es-ES") : "—"),
  lock:   (v) => <Icon name={v ? "lock" : "unlock"} size={13} label={v ? "SÍ" : "NO"} />,
  badge:  (v, _row, accentColor) => <span style={{...}}>{String(v ?? "—")}</span>,
};
```

Resolución: si `column.render` es función → se llama `(value, row)`. Si es string → se busca en el
registro. Si no está o falta → `text`. Nunca se rompe por un `render` desconocido.

### 6.3 Estructura y decisiones

- Envoltorio `Card` (`padding="sm"`) → barra de herramientas → contenedor con
  `style={{ overflowX: "auto" }}` → `<table style={{ minWidth: 560, width: "100%" }}>`.
  **El scroll horizontal vive dentro de la tabla; la página nunca desborda.** Es el modo de no
  reabrir el problema de overflow que la auditoría UI del 4-ago documentó (H-11/H-12/H-13).
- Barra de herramientas: buscador (`Input` con `<Icon name="search">` a la izquierda) + un control
  por cada columna `filter: true`.
- Cabecera: `<th scope="col">`. Las ordenables son `<button>` con
  `aria-sort={"ascending"|"descending"|"none"}` e `<Icon name={dir === "asc" ? "arrowUp" : "arrowDown"} />`
  visible solo en la columna activa.
- Fila: `<tr>` con `cursor: pointer` si hay `onRowClick`. La celda de acciones **detiene la
  propagación** (`e.stopPropagation()`) para que pulsar "borrar" no abra además la edición.
- Acciones por fila: `<Button size="sm" variant="ghost">` con `icon={<Icon name={a.icon} size={13} decorative />}`
  y `title={a.label}`. `tone: "danger"` → `accentColor={RED}`.
- `status === "loading"` → `Math.min(pageSize ?? 8, 8)` filas de `<Skeleton.Block height={12} />`
  dentro del `<tbody>`, conservando el número de columnas. No se desmonta la tabla: evita el salto
  de layout entre cargas.
- `status === "error"` → fila única con `<Icon name="alert">` + `error.message`.
- `rows.length === 0 && status === "ready"` → fila única con `emptyLabel`.
- Paginador: `<Icon name="chevronLeft">` / `<Icon name="chevronRight">`, texto
  `PÁGINA {page} / {pageCount} · {total} REGISTROS`. Botones deshabilitados en los extremos.
- Altura mínima de todo lo pulsable: 44px (`Button` ya lo garantiza; las casillas se envuelven en
  un `<label>` de 44px).

---

## 7. `ResourceForm.jsx` — paso 4

### 7.1 Props

| Prop | Tipo | Req. | Default |
|---|---|---|---|
| `fields` | array del descriptor | ✅ | — |
| `value` | object \| null | — | `null` (alta) |
| `mode` | `"create"\|"edit"` | — | `value ? "edit" : "create"` |
| `busy` | bool | — | `false` |
| `error` | Error \| null | — | `null` |
| `accentColor` | string | — | `ACID` |
| `onSubmit` | `(draft) => void \| Promise` | ✅ | — |
| `onCancel` | fn | — | `null` |
| `submitLabel` | string | — | `mode === "edit" ? "GUARDAR" : "CREAR"` |

### 7.2 Estado interno y la regla del `key`

`draft` (object), `touched` (`{}`), `errors` (`{}`).

**`draft` se inicializa una sola vez, con inicializador perezoso:**

```js
const [draft, setDraft] = useState(() => initialDraft(fields, value));
```

**No hay ningún `useEffect` que sincronice `value` → `draft`.** Quien monta el formulario le pasa
`key={value?.[idKey] ?? "new"}`; cambiar de fila remonta el componente y el estado nace limpio.
Es obligación de `ResourceConsole` (§8) y evita de golpe la familia entera de bugs de "el
formulario conserva lo que escribí en la fila anterior" y las peleas con
`react-hooks/immutability`.

### 7.3 Comportamiento

- `initialDraft(fields, value)` → recorre `fields` y toma `value?.[k]`, con default por tipo:
  `checkbox → false`, `number → ""`, resto `""`. **Solo llaves de `fields`.**
- `onSubmit` **recibe únicamente las llaves de `fields`**, jamás la fila entera. Así no se
  devuelven al servidor columnas calculadas (`created_at`, contadores, etc.).
- Validación al enviar: `required` → vacío tras `trim` es error `"REQUERIDO"`; `number` no
  numérico → `"DEBE SER UN NÚMERO"`. Errores en `errors[k]`, que `Input` ya sabe pintar por su
  prop `error`. Si hay algún error, no se llama a `onSubmit`.
  **La validación de cliente es UX, no seguridad** — la autoridad es el Worker, igual que en
  `AdminGuard`.
- Coerción antes de enviar: `number → Number(v)`, `checkbox → Boolean(v)`, resto string tal cual.
- `<form onSubmit={e => { e.preventDefault(); submit(); }}>` con `<Button type="submit">` →
  `Enter` envía.
- `error` (el del servidor) se pinta arriba del formulario con `<Icon name="alert">` en `RED`.

### 7.4 Registro de campos

Constante de módulo `FIELD_RENDERERS`, misma filosofía que `CELL_RENDERERS`:

| `type` | Render |
|---|---|
| `text`, `date`, `number` | `<Input type={type} label error accentColor />` |
| `textarea` | `<Input multiline />` |
| `select` | `<select>` nativo con `style` de tokens (`FONT_MONO`, borde `${accent}33`, `minHeight: 44`), opciones normalizadas de `["a"]` o `[{value,label}]` |
| `checkbox` | `<button role="switch" aria-checked={v}>` de 44px con `<Icon name={v ? "check" : "close"} />` — no `<input type=checkbox>`: no se puede estilar al resto ni cumple 44px sin envoltorio |

Tipo desconocido → se trata como `text`. Nunca se rompe.

---

## 8. `ResourceConsole.jsx` — paso 5 (la pieza que añado)

**Es la única pieza que junta hook + tabla + formulario + diálogo.** Va en fichero propio, no
dentro de `AdminShell`, por dos razones concretas:

1. **Los hooks no se pueden llamar condicionalmente.** El shell tiene N recursos y solo uno
   activo; no puede llamar `useAdminResource` por recurso. Se resuelve montando
   `<ResourceConsole descriptor={activo} key={activo.key} />` — un hook, y el cambio de recurso
   remonta y resetea página/orden/búsqueda, que es justo lo correcto.
2. **B3 la necesita suelta.** `src/admin/screens/Contenido.jsx` querrá una consola sin la barra
   lateral del shell. Si vive dentro de `AdminShell.jsx` habría que extraerla entonces.

### 8.1 Props

| Prop | Tipo | Req. | Default |
|---|---|---|---|
| `descriptor` | object | ✅ | — |
| `client` | objeto de `createApiClient` | ✅ | — |
| `accentColor` | string | — | `ACID` |
| `onAudit` | fn | — | `null` |
| `canCreate` | bool | — | `descriptor.fields?.length > 0` |

### 8.2 Estado interno

```js
formState    // null | { mode: "create"|"edit", row: object|null }
confirmState // null | { action, row, confirmTyping, snapshot }
```

Todo lo demás sale de `useAdminResource(descriptor, { client, onAudit })`.

### 8.3 Flujos, paso a paso

**Alta:** botón `NUEVO` (`<Icon name="plus">`) → `formState = {mode:"create", row:null}` → se abre
`Dialog` con `<ResourceForm key="new" …>` → `onSubmit` → `await create(draft)` → si `ok`, cerrar;
si no, `error` al formulario y el diálogo sigue abierto.

**Edición:** `onRowClick(row)` → `formState = {mode:"edit", row}` → `Dialog` con
`<ResourceForm key={row[idKey]} value={row} …>` → `onSubmit` → `await update(row[idKey], draft)`.

**Acciones de fila:** `actions` del descriptor se resuelven a la forma que espera la tabla con un
mapa de módulo:

```js
const ACTION_META = {
  delete:     { label: "BORRAR",       icon: "trash",  tone: "danger" },
  classify:   { label: "CLASIFICAR",   icon: "lock" },
  unclassify: { label: "DESCLASIFICAR",icon: "unlock" },
};
const metaFor = (name) => ACTION_META[name] ?? { label: name.toUpperCase(), icon: "settings" };
```

Una acción desconocida sigue funcionando con icono genérico. **No se hardcodea la lista de
acciones de el-bunker en ningún sitio más que este mapa de rótulos** — es cosmética, y vinos
puede ignorarlo.

**`onAction(name, row)`:**
- Si `descriptor.destructive?.[name]` existe →
  `confirmState = { action: name, row, confirmTyping: row[destructive[name].confirmTyping] ?? null, snapshot: !!destructive[name].snapshot }`.
  **Aquí es donde la clave de campo se convierte en valor literal** — el diálogo nunca ve el
  descriptor.
- Si no → `await runAction(name, row[idKey])` directamente.

**Confirmación:** `<ConfirmDialog open={!!confirmState} … onConfirm={() => runAction(action, id)} />`.
`runAction` devuelve `{ok}`; el diálogo cierra solo si `ok`.

**Cabecera de la consola:** `descriptor.label` + `total` de registros + botón `refresh`
(`<Icon name="refresh">`) + botón `NUEVO`.

---

## 9. `AdminShell.jsx` — paso 6

Layout puro. No toca datos.

### 9.1 Props

| Prop | Tipo | Req. | Default |
|---|---|---|---|
| `resources` | array de descriptores | ✅ | — |
| `client` | objeto de `createApiClient` | ✅ | — |
| `title` | string | — | `"TERMINAL DE MANDO"` |
| `activeKey` | string | — | `null` (modo no controlado) |
| `onActiveKeyChange` | `(key) => void` | — | `null` |
| `user` | `{id, ...}` \| null | — | `null` |
| `accentColor` | string | — | `ACID` |
| `onAudit` | fn | — | `null` |
| `footer` | node | — | `null` |

**Controlado / no controlado:** si llega `activeKey`, manda esa; si no, estado interno inicializado
a `resources[0]?.key`. Con `activeKey` presente y `onActiveKeyChange` ausente, la navegación no
hace nada — es responsabilidad de quien lo controla (así lo consumirá el router en otra tarjeta).

### 9.2 Estructura

```
<div style={{minHeight:"100dvh", background: BG, fontFamily: FONT_MONO}}>
  <header>  TERMINAL DE MANDO · [descriptor activo] · [user.id] </header>
  <nav className="flex md:hidden">   tiras horizontales scrollables (móvil)
  <div className="flex">
     <aside className="hidden md:flex">  botones de recurso (escritorio)
     <main>  <ResourceConsole key={activeKey} …>  </main>
  </div>
  {footer}
</div>
```

- Botón de recurso: `<Icon name={r.icon ?? "document"} size={14} decorative />` + `r.label`,
  `aria-current="page"` en el activo, borde izquierdo de acento en el activo.
- Sin `resources` o vacío → panel con `<Icon name="alert">` y `SIN RECURSOS CONFIGURADOS`. No
  reventar.
- Título con `letterSpacing: "0.3em"`, mayúsculas, acento — la estética de búnker ya establecida
  en `Dialog`/`Button`.
- `motion.div` con un `initial/animate` de opacidad al cambiar de recurso. Sutil, no una animación
  de entrada por elemento.

---

## 10. `AdminGuard.jsx` — paso 7

### 10.1 Props

| Prop | Tipo | Req. | Default |
|---|---|---|---|
| `auth` | `{isAdmin, isLoading, user}` | ✅ | — |
| `children` | node | ✅ | — |
| `accentColor` | string | — | `ACID` |
| `deniedMessage` | string | — | copy de §10.3 |
| `onRetry` | fn | — | `null` |

**Se acepta un objeto, no un hook.** El brief dejaba abiertas las dos vías; se elige el objeto
porque un hook pasado como prop no se puede invocar condicionalmente sin romper las reglas de
hooks, complica el lint y no aporta nada: el host hace `const auth = useLoQueSea()` y lo pasa.
En el-bunker ese wrapper leerá `VaultContext`; en vinos, lo suyo. **`AdminGuard` no importa
`VaultContext` ni ningún estado global — el test de fronteras lo verifica.**

### 10.2 Comportamiento

| Estado | Render |
|---|---|
| `auth.isLoading` | Panel `VERIFICANDO CREDENCIALES` + `<Skeleton.Text lines={2} />` |
| `!auth.isAdmin` | Panel de denegado (§10.3) |
| resto | `children` |

**`children` no se renderiza mientras `isLoading` es cierto.** Ese es el trabajo del componente:
evitar el parpadeo de UI de admin antes de que llegue el 403. Sin `auth` (undefined) se trata como
`isLoading: true` — nunca se abre por defecto.

### 10.3 Panel de denegado

`<Icon name="shield" size={20} />` en `RED`, título `ACCESO DENEGADO`, y copy:

> Esta terminal requiere sesión de administrador. El servidor es quien autoriza cada operación;
> ocultar la interfaz no concede ni retira permisos.

Botón `REINTENTAR` solo si hay `onRetry`.

**Comentario obligatorio en la cabecera del fichero** (es el único "porqué no obvio" que este
código necesita):

```js
// AdminGuard es una guardia de EXPERIENCIA, no de seguridad. La autorización real la
// da el Worker con requireAdmin (403 antes de tocar D1). Aquí solo se evita el
// parpadeo de UI admin y se explica el estado al usuario.
```

---

## 11. `index.js` — barril

```js
export { createApiClient } from "./apiClient";
export { default as useAdminResource } from "./useAdminResource";
export { default as ConfirmDialog } from "./ConfirmDialog";
export { default as ResourceTable } from "./ResourceTable";
export { default as ResourceForm } from "./ResourceForm";
export { default as ResourceConsole } from "./ResourceConsole";
export { default as AdminShell } from "./AdminShell";
export { default as AdminGuard } from "./AdminGuard";
```

Con una cabecera de comentario que declare el contrato de portabilidad de §1 (las cinco entradas
permitidas). Es la primera cosa que leerá quien porte esto a vinos.

Ojo con `react-refresh/only-export-components`: un fichero que solo reexporta no dispara la regla,
pero si saltara, se sigue el patrón ya usado en `Icon.jsx`
(`// eslint-disable-next-line react-refresh/only-export-components`).

---

## 12. Tests — **ya escritos, son el contrato ejecutable**

Todo en `src/admin/__tests__/`. Vitest + Testing Library, entorno jsdom global ya configurado
(`vite.config.js` → `setupFiles: './src/test-setup.js'`). Patrón de `PlayerContext.test.jsx`:
helper `render()` propio, `describe`/`it` **numerados**.

> **⚠️ Cambio respecto al brief.** Los cuatro ficheros de 12.0, 12.1, 12.7 y 12.8 **ya están
> escritos y commiteados en el worktree** (Opus, 5-ago). No se reescriben: se ejecutan.
> Están en rojo a propósito — es la especificación, y ponerlos en verde es el trabajo.
> Verificado al escribirlos: fallan por módulo inexistente, no por error de sintaxis, y el de
> fronteras (12.7) ya pasa en verde con `apiClient.js` solo.
>
> **Por qué así:** una descripción en prosa hay que interpretarla, y verificarla obliga a leer el
> código entero después. Un test decide solo. Convierte esta tarjeta en "iterar hasta verde", que
> puede hacer cualquier ejecutor barato, y su verificación cuesta un comando en vez de una
> revisión. Los de 12.2–12.6 sí los escribe el ejecutor, porque una vez fijada la forma de las
> props son mecánicos.

### 12.0 Fixtures compartidos — ✅ ESCRITOS

- `__tests__/fixtures/toyDescriptor.js` — descriptor de juguete `widgets`, deliberadamente **ajeno
  a el-bunker**: si hablase de `entries`, montar el panel con él no probaría portabilidad. Exporta
  también `TOY_ROWS`.
- `__tests__/fixtures/fakeClient.js` — `createFakeClient(seedRows, { idKey, listDelays, failures })`
  en memoria: implementa las cinco funciones con paginación, `q`, `sort`/`dir` y filtros reales, y
  expone `calls` / `callsOf(name)` para afirmar sobre lo que se envió. `listDelays` sirve para
  provocar la carrera de peticiones; `failures` para provocar errores de servidor.
  **Sin mocks de `fetch`**: el `client` es inyectable justamente para esto. `makeRows(n)` genera
  volumen para los tests de paginación.

### 12.1 `useAdminResource.test.jsx` — ✅ ESCRITO (14 casos)

Cubre, en este orden: carga inicial · `setPage` · debounce de búsqueda (y que **no** haya una
segunda petición después) · reset de página al buscar · ciclo asc/desc/null de `setSort` ·
`setFilter` · **carrera de peticiones** (la respuesta lenta antigua no pisa a la nueva) ·
normalización del array pelado · `create` correcto · mutación fallida sin lanzar ·
`remove` de la última fila de la página 2 · `runAction` vs `delete → client.remove` · `onAudit` en
éxito y en fallo · `status: "error"` en fallo de carga.

### 12.2 `ConfirmDialog.test.jsx`
1. sin `confirmTyping` el botón está activo desde el principio
2. con `confirmTyping` el botón está deshabilitado hasta escribir el valor exacto
3. un valor con distinta capitalización **no** habilita
4. `snapshot` pinta el aviso; sin él, no aparece
5. `onConfirm` que devuelve `{ok:false}` deja el diálogo abierto y muestra el error
6. `onConfirm` correcto llama a `onClose`
7. reabrir limpia lo tecleado

### 12.3 `ResourceTable.test.jsx`
1. pinta cabeceras y filas del descriptor de juguete
2. `render:"lock"` pinta icono, no texto ni emoji
3. clic en cabecera ordenable llama `onSortChange` con la clave
4. cabecera no ordenable no es un botón
5. `status:"loading"` pinta esqueletos sin desmontar la tabla
6. `rows: []` pinta `emptyLabel`
7. `status:"error"` pinta el mensaje
8. clic en acción llama `onAction` y **no** dispara `onRowClick`
9. paginador deshabilitado en los extremos
10. sin `onSelectionChange` no hay columna de casillas; con él, sí y "seleccionar todo" marca la página

### 12.4 `ResourceForm.test.jsx`
1. pinta un control por campo, con el tipo correcto
2. `required` vacío bloquea el envío y marca el error
3. envío correcto entrega **solo** las llaves de `fields` (una fila con `created_at` no lo cuela)
4. `number` se envía como número
5. `checkbox` alterna y viaja como booleano
6. `select` con `options` de strings y de objetos
7. `error` de servidor se pinta
8. remontar con `key` distinta nace con el valor nuevo (la regla de §7.2)

### 12.5 `AdminShell.test.jsx`
1. pinta un botón por recurso y activa el primero
2. cambiar de recurso monta la otra consola
3. modo controlado: `activeKey` manda y `onActiveKeyChange` se llama al pulsar
4. `resources: []` no revienta y avisa

### 12.6 `AdminGuard.test.jsx`
1. `isLoading` → no renderiza `children`
2. `isAdmin: false` → panel de denegado, sin `children`
3. `isAdmin: true` → `children`
4. `auth` undefined se trata como cargando
5. `onRetry` presente pinta el botón y lo llama

### 12.7 `admin-core-boundaries.test.js` — **el DoD, automatizado** — ✅ ESCRITO Y EN VERDE

`// @vitest-environment node`, mismo patrón que `src/core/__tests__/service-boundaries.test.js`
(lectura de ficheros con `readdirSync` recursivo sobre `new URL(...)`).

1. **Lista blanca de imports.** Para cada `.js`/`.jsx` de `src/admin/core/`, extraer todos los
   especificadores (`from "…"`, `import("…")`, `require("…")`) y afirmar que cada uno casa con:
   `^(react|framer-motion|\.\.\/\.\.\/tokens|\.\.\/\.\.\/core\/ui\/(Button|Card|Input|Dialog|Icon|Skeleton)|\.\/[\w.-]+)$`
2. **Lista negra explícita** (redundante a propósito, porque es la que se lee en el informe de
   cierre): ningún fichero casa con `/vault|musiclab|capsules|smoke|VaultContext|PlayerContext|lucide-react/`.
3. **Cero emoji:** ningún fichero de `src/admin/core/` contiene caracteres del rango emoji
   (`/\p{Extended_Pictographic}/u`).
4. **No se importa el `ConfirmDialog` equivocado:** ningún fichero contiene
   `import { ConfirmDialog }` desde `core/ui/Dialog`.

### 12.8 `toy-mount.test.jsx` — el montaje que pide el DoD — ✅ ESCRITO (9 casos)

Monta `<AdminGuard auth={…}><AdminShell resources={[toyDescriptor]} client={fakeClient} /></AdminGuard>`
y recorre el camino completo: guardia cargando (sin filtrar UI) · guardia denegando · shell con
filas · alta · requerido que bloquea el alta · edición con los valores de la fila · **borrado con
escritura del nombre exacto** (rechaza la capitalización distinta) · una acción de fila que no
dispara además la edición · cero emoji en todo el DOM renderizado.

Este fichero, junto con 12.7, **es el DoD de la tarjeta**. Fija además los textos exactos del
ANEXO A: implementar con otros rótulos deja el test en rojo.

---

## 13. Orden de ejecución y verificación por paso

El worker ejecuta en este orden y **no avanza al siguiente sin que el anterior esté en verde**:

| # | Fichero | Verificación antes de seguir |
|---|---|---|
| 1 | `useAdminResource.js` + su test | `npx vitest run src/admin` |
| 2 | `ConfirmDialog.jsx` + su test | idem |
| 3 | `ResourceTable.jsx` + su test | idem |
| 4 | `ResourceForm.jsx` + su test | idem |
| 5 | `ResourceConsole.jsx` | `npx vitest run src/admin` (aún sin test propio; lo cubre 12.8) |
| 6 | `AdminShell.jsx` + su test | idem |
| 7 | `AdminGuard.jsx` + su test | idem |
| 8 | `index.js` + `admin-core-boundaries.test.js` + `toy-mount.test.jsx` | los dos últimos en verde |

**Cierre (los cuatro, con la salida pegada en el informe):**

```
npx vitest run                 # suite completa, no solo src/admin — 141/141 era la línea base
npm run build
npx eslint src/ workers/
grep -rnE "vault|musiclab|capsules" src/admin/core/     # debe salir vacío
```

Commit en el worktree tras cada paso en verde (`.worktrees/t_0a8cf470`), mensaje
`feat(admin-core): <pieza>`. Sin coautoría.

---

## 14. Lo que esta tarjeta NO hace

| No hace | Quién lo hace |
|---|---|
| Ruta `/admin` y montaje en la app | Otra tarjeta (no hay router en `package.json`) |
| Descriptores reales (`entries`, `files`, `tracks`…) | B3 |
| `requireAdmin` y `/api/admin/*` | B2 |
| Snapshots, rollback, recuentos de salud | B2 / B4 |
| Escribir en `events` | El Worker (ADR-019 🔒-5) |
| Tocar `PlayerContext`, `WinampPlayer`, `AudioVisualizer` | Nadie: congelados (ADR-018 🔒-3) |
| Añadir iconos al registro de `Icon` | Innecesario: los 20 que hacen falta ya están |

---

## ANEXO A — Contrato de nombres accesibles (los tests lo exigen literal)

Los tests de 12.7 y 12.8 consultan el DOM por rol y por nombre accesible. **Estos rótulos no son
sugerencias de copy: cambiarlos deja el DoD en rojo.** Van ya en mayúsculas en el código fuente —
el `textTransform: uppercase` de `Button` es CSS y no cambia el texto del DOM.

### A.1 Trampa de `Button` — leer antes de escribir el primer botón

`src/core/ui/Button.jsx` **desestructura sus props y no hace spread de `...rest`**. Un
`aria-label` pasado a `Button` **se pierde**. Los botones solo-icono se quedarían sin nombre
accesible y sin poder consultarse desde los tests.

**Regla:** el nombre accesible de un botón solo-icono se da con **`title`**, que `Button` sí
reenvía a `motion.button`. El icono va siempre `decorative`.

```jsx
<Button size="sm" variant="ghost" title="BORRAR" icon={<Icon name="trash" size={13} decorative />} />
```

`Input` **sí** hace spread de `...rest` sobre el control, así que ahí se usa `aria-label` normal.
Esta asimetría es del design system existente; **no se arregla desde B1** (`src/core/ui/` está
fuera del ámbito P6).

### A.2 Tabla de rótulos exactos

| Dónde | Texto / nombre accesible |
|---|---|
| Título del shell | `TERMINAL DE MANDO` |
| Botón de recurso en la navegación | `descriptor.label` |
| Botón de alta | `NUEVO` |
| Botón de recarga | `title="RECARGAR"` |
| Buscador | `aria-label="BUSCAR"` y `placeholder="BUSCAR"` |
| Filtro de columna | `aria-label={"FILTRO " + column.label}` |
| Cabecera de columna | `column.label` |
| Celda `render:"lock"` | `<Icon label={v ? "SÍ" : "NO"} />` |
| Tabla vacía | `SIN REGISTROS` |
| Paginador | `PÁGINA {page} / {pageCount} · {total} REGISTROS` |
| Acción de fila | `title={meta.label}` — `BORRAR`, `CLASIFICAR`, `DESCLASIFICAR`, o `name.toUpperCase()` |
| Título del diálogo de formulario | `NUEVO · {descriptor.label}` / `EDITAR · {descriptor.label}` |
| Control de campo | `aria-label={field.label ?? field.k.toUpperCase()}` |
| Botón de envío | `CREAR` (alta) / `GUARDAR` (edición) |
| Botón de cancelar | `CANCELAR` |
| Error de campo requerido | `REQUERIDO` |
| Título del diálogo destructivo | `{meta.label} · {descriptor.label}` |
| Input de confirmación | `aria-label="CONFIRMACIÓN"` |
| Aviso de snapshot | `SE GUARDARÁ UN SNAPSHOT PREVIO` |
| Botón de confirmar destructivo | `{meta.label}` como texto (p. ej. `BORRAR`) |
| Guardia verificando | `VERIFICANDO CREDENCIALES` |
| Guardia denegando | `ACCESO DENEGADO` |

---

## ANEXO B — Cómo se replica en vinos-carta-app sin gastar un token

Esto es el objetivo 2 del diseño canónico (§1 de `DISENO_PANEL_ADMIN_2026-08-04.md`), y B1 está
hecho para que el porte sea una operación mecánica, no una sesión de IA.

### B.1 El procedimiento entero

```
1. copiar  src/admin/core/**  y  src/admin/__tests__/**  al repo de vinos
2. npx vitest run src/admin
3. cada fallo del test de fronteras dice exactamente qué falta en vinos
4. escribir los descriptores de vinos (vinos, categorias, bodegas)
5. montar <AdminGuard auth={authDeVinos}><AdminShell resources={[...]} client={...} /></AdminGuard>
```

El paso 3 es la clave: la lista blanca de imports y la lista de tokens **son la documentación de
portabilidad, y está ejecutándose**. No hay que leer este documento para portar; hay que leer la
salida del test.

### B.2 Lo único que vinos tiene que aportar

| Qué | Detalle |
|---|---|
| `src/tokens.js` | exactamente 4 exports: `ACID`, `RED`, `BG`, `FONT_MONO` (verificado por el test 7 de 12.7) |
| `src/core/ui/` | `Button`, `Card`, `Input`, `Dialog`, `Icon`, `Skeleton` con los mismos exports |
| Dependencias | `react`, `framer-motion`, `lucide-react` (solo dentro de `Icon`), Tailwind para layout |
| `auth` | un objeto `{isAdmin, isLoading, user}` — de donde sea |
| `client` | `createApiClient({ baseUrl, getToken })`, que viaja en el propio `admin-core` |
| Descriptores | un objeto por recurso, forma de §2 |

Nada más. Si aparece un séptimo requisito, es un fallo de B1, no de vinos.

### B.3 La técnica, generalizada

Lo que hace barata esta tarjeta no es el diseño: es que **el DoD se escribió como test antes que
el código**. Un DoD en prosa ("cero imports de vault, verificar con grep") se comprueba el día que
alguien acuerda ejecutar el grep, y a los dos meses ya no se comprueba. El mismo DoD como test se
comprueba en cada suite, para siempre, y sin que nadie lo recuerde.

Merece la pena repetirlo en las tarjetas que vienen: **si el DoD se puede escribir como test, se
escribe como test y se entrega en rojo.** Ejecutar deja de necesitar criterio y la verificación
pasa de "leer el código entregado" a "mirar si está verde".
