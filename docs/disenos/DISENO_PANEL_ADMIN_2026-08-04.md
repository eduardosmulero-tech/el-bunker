# DISEÑO — PANEL ADMIN (TERMINAL DE MANDO)

> **Estado: 🔴 BORRADOR** (n3/Opus, 4-ago-2026). Canónico solo con OK de Edu.
> **Origen:** decisión de Edu del 4-ago. Cita literal: *"Quiero un panel admin como el que tendrá
> la app de vinos así practicamos. Se podrá controlar todo lo que un admin debería, siguiendo la
> temática y estilo."*
> **Decisiones de Edu ya tomadas (entrevista 4-ago):** ruta aparte `/admin`, fuera de los 3 tabs ·
> alcance = contenido **+** usuarios y accesos **+** auditoría/estadísticas **+** salud del sistema.
> **Canon leído antes de diseñar:** `docs/Nucleo/CONTRATO.md` (28 ADRs), `docs/Nucleo/REGLAS.md`,
> `docs/Nucleo/ESTADO.md`.

---

## 1. Los dos objetivos, y cuál manda

1. **Operar el Búnker** sin volver a abrir una consola de D1 a mano.
2. **Practicar el panel de `vinos-carta-app`**, que es un encargo real de cliente pendiente de
   presupuesto.

Cuando choquen, manda el 2: si una decisión sirve igual de bien aquí pero **no** se puede
reutilizar en vinos, se elige la reutilizable. Ese es el motivo por el que Edu lo pidió.

## 2. La consecuencia arquitectónica: núcleo + descriptores

El panel se parte en dos capas que se pueden separar de verdad:

- **`admin-core` (reutilizable, viaja a vinos tal cual):** guardia de ruta, shell visual
  (barra lateral + cabecera + área de trabajo), `ResourceTable` (paginación, búsqueda, orden),
  `ResourceForm` (alta/edición generada desde el descriptor), `ConfirmDialog` destructivo,
  `useAdminResource` (carga, mutación, errores) y el envoltorio de auditoría.
- **Descriptores (propios de cada app):** un objeto declarativo por recurso.

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

Vinos hereda `admin-core` y escribe descriptores de `vinos`, `categorias`, `bodegas`. **Esa es la
práctica real**: si el panel de el-bunker se escribe a mano, pantalla a pantalla, no enseña nada
transferible.

## 3. Dónde vive y quién entra

- **Ruta `/admin`**, fuera de VAULT · MUSIC LAB · CAPSULES. **ADR-017 🔒 intacto**: no es un cuarto
  tab, no aparece en la navegación, no existe para el uso diario.
- **Guardia en el Worker, no en la UI.** ADR-028 ata cada clave a un usuario de la whitelist
  (`ADMIN_ACCESS_KEY`→`admin`), así que `requireAdmin` = el JWT resuelve a `user_id === "admin"`.
  Edu y David con su sesión normal reciben **403 del servidor**, no un enlace escondido.
  Ocultar el enlace no es seguridad; el 403 sí. [VERIFICAR en implementación: forma exacta del
  claim de usuario en el JWT emitido por `POST /api/auth/token`.]

## 4. Las cuatro consolas

### 4.1 CONTENIDO
CRUD sobre entries, files, tracks, playlists, capsules y drops, con buscador y filtros. Incluye
**marcado de clasificación en lote** (por era, por tag, por selección) — es lo que hace usable el
Modo Visita con 527 fotos (`DISENO_MODO_VISITA_2026-08-04.md` §7).
Todo borrado exige escribir el nombre del ítem y deja snapshot previo, como ya se hace a mano hoy.

### 4.2 USUARIOS Y ACCESOS
**No es un CRUD de usuarios: ADR-006 fija tres usuarios en whitelist y prohíbe el registro
público.** Lo que sí hace:
- ver los tres usuarios y su método de entrada (Google / clave, ADR-025 y ADR-028);
- **rotar las claves de acceso** — hoy eso es editar secrets del worker a mano;
- **revocar sesiones** [VERIFICAR: con JWT autofirmados de 24 h, revocar exige lista de
  revocación en D1 o rotación de `JWT_SECRET`. Decidir en implementación; no inventar aquí];
- leer los `auth_login` de `events`, que ya se emiten (ADR-028).

En vinos este mismo módulo es el personal del restaurante: mismo problema, mismo componente.

### 4.3 AUDITORÍA Y ESTADÍSTICAS
Lector de la tabla `events`: filtros por tipo, usuario y fecha, más las gráficas derivadas.
**ADR-019 🔒 manda**: `events` es append-only y está **prohibido crear un agregador paralelo**.
Esta consola es un *cliente* del agregador común, igual que RECAP o Timeline. Si necesita un
cálculo que no existe, se añade al agregador — no aquí.

Es la consola que más impresiona en una demo y la que menos código nuevo necesita: el motor ya
existe y emite 28 tipos de evento.

### 4.4 SALUD DEL SISTEMA
Convierte en botón lo que Edu lleva días haciendo a mano: recuentos D1 vs R2, huérfanos (files sin
objeto en R2 y al revés), referencias colgantes en `file_references`, estado del último backfill,
límites y cuotas. **Lectura por defecto**; cualquier acción correctiva exige confirmación y deja
snapshot con rollback, que es la regla que Edu ya aplica en cada intervención sobre D1.

## 5. Estilo

Temática de búnker: la consola se llama **TERMINAL DE MANDO**, tipografía y tokens de
`src/tokens.js`, glassmorphism de `src/core/ui/Card.jsx`, botones de `src/core/ui/Button.jsx`.
**Iconos SVG, cero emoji** — la iconografía emoji generada es rastro de código IA y Edu la ha
señalado ya como deuda.

## 6. Lo que este panel NO hace (límites duros)

| No hace | Por qué |
|---|---|
| Cuarto tab | ADR-017 🔒 |
| Tocar `PlayerContext` / `WinampPlayer` / `AudioVisualizer` | ADR-018 🔒-3 y regla D7 del plan de cierre: el player está congelado |
| Agregadores de stats propios | ADR-019 🔒-5 |
| Crear o borrar usuarios | ADR-006 |
| Uploader propio | ADR-022: `FileUploadService` es el único |
| Persistir fuera de D1/R2 | 🔒-2 |
| Micro-ediciones sueltas | ADR-015 🔒: contenedor lógico completo |

## 7. ADR propuesto

**ADR-030 — Panel de administración fuera de los 3 tabs** (BORRADOR, pendiente OK de Edu):

> La administración vive en la ruta `/admin`, fuera de VAULT · MUSIC LAB · CAPSULES, sin alterar
> ADR-017. El acceso lo autoriza el Worker (`user_id === "admin"`, ADR-028), nunca la ocultación
> en la UI. El panel se construye como `admin-core` reutilizable + descriptores declarativos por
> recurso, para que `vinos-carta-app` herede el núcleo. Es cliente del motor de eventos
> (ADR-019), no un agregador nuevo. Toda mutación administrativa emite un evento `admin_*`.

## 8. Riesgos

1. **Sobredimensionarlo.** Cuatro consolas es mucho para una semana. El orden de valor real es:
   CONTENIDO (desbloquea el Modo Visita en lote) → SALUD (ahorra las sesiones de fontanería que
   más le cuestan a Edu) → AUDITORÍA (la que luce) → ACCESOS (la más enredada por lo de revocar).
2. **Un panel admin es superficie de ataque nueva.** Todo endpoint `/api/admin/*` pasa por
   `requireAdmin` **antes** de tocar D1, y se prueba explícitamente con un JWT de `edu` esperando
   403.
3. **Reutilizar de verdad en vinos** exige que `admin-core` no importe nada del Búnker. Se
   verifica mecánicamente: ningún import de `src/vault`, `src/musiclab` ni `src/capsules` dentro
   de `src/admin/core/`.
