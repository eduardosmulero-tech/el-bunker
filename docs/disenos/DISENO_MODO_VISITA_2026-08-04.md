# DISEÑO — MODO VISITA: clasificación de contenido y censura a la vista

> **Estado: 🔴 BORRADOR** (n3/Opus, 4-ago-2026). Canónico solo con OK de Edu.
> **Origen:** decisión de Edu del 4-ago — el-bunker pasa a prioridad global del workspace y hay
> que poder enseñarlo siendo una app personal.
> **Decisiones de Edu ya tomadas (entrevista 4-ago):** marcado por contenido **+** interruptor
> global que se apaga con clave · el contenido censurado se ve **desenfocado con la estética del
> búnker**, no desaparece.
> **Canon leído antes de diseñar:** `docs/Nucleo/CONTRATO.md` (28 ADRs), `docs/Nucleo/REGLAS.md`,
> `docs/Nucleo/ESTADO.md`.

---

## 1. Qué problema resuelve

El Búnker es lo más enseñable que tiene Edu, y es privado. Hoy no hay forma de abrirlo delante de
alguien sin exponer 527 fotos y recuerdos personales. Hace falta poder pasar el móvil, compartir
pantalla o enseñarlo en una entrevista sin que se vea nada íntimo **y sin que la app parezca
vacía**.

## 2. Un concepto nuevo, que NO es el que ya existe

El proyecto ya usa la palabra "sensible" con otro significado:
`SENSITIVE_R2_PREFIXES = ["vault/docs/", "vault/audio/"]` (`workers/utils/r2-sign.js:14`) — son los
prefijos de R2 que exigen URL firmada con HMAC. Eso es **seguridad de almacenamiento**: aplica
siempre, a todo el mundo, incluido Edu.

Lo que se diseña aquí es **clasificación**: qué contenido se oculta *a quien está mirando la
pantalla ahora mismo*. Una foto de la playa puede ser clasificada sin ser sensible; un documento en
`vault/docs/` es sensible aunque no esté clasificado. **Son ortogonales y no se mezclan.** Todo
identificador nuevo usa `classified`, nunca `sensitive`.

## 3. La decisión que sostiene todo: la censura se aplica en el servidor

Un desenfoque por CSS es mentira: la foto ha viajado al dispositivo y está a un F12 de distancia.

**Con el modo visita activo, el Worker nunca envía el contenido clasificado.** Devuelve el ítem —
para que la app se vea llena, que es lo que Edu pidió — pero vaciado: sin `r2_key`, sin URL
firmada, sin título, sin nota, sin lugar. Solo `{ classified: true, blurhash, fecha, era }`.

El desenfoque no se finge: se pinta a partir de un **blurhash** (~30 bytes, irreversible, manchas
de color) calculado en la subida. Se ve una foto borrosa de verdad, y del original no ha salido un
solo píxel del servidor.

## 4. Modelo de datos

**Tabla lateral nueva**, no columnas nuevas en seis tablas:

```sql
CREATE TABLE classified_items (
  item_type  TEXT NOT NULL,   -- entry | file | track | playlist | capsule | drop
  item_id    TEXT NOT NULL,
  marked_by  TEXT NOT NULL,   -- FK users (ADR-006)
  marked_at  INTEGER NOT NULL,
  PRIMARY KEY (item_type, item_id)
);
```

**Por qué lateral y no una columna `classified` en cada tabla:** una sola migración aditiva sobre
un schema de 17 tablas con v1.0 en producción; el rollback es `DROP TABLE`; y ninguna consulta
existente cambia de forma. Coste: un `IN` extra en las listas — irrelevante con 527 entries.
Bump de schema **MINOR** (ADR-012).

`blurhash` sí es columna nueva en `files` (`TEXT NULL`): es atributo del archivo, no del estado de
clasificación.

## 5. El interruptor

Vive **en el JWT**, como claim `visit: true`. No en localStorage, no en estado de React.

| Acción | Quién puede | Cómo |
|---|---|---|
| **Encender** modo visita | cualquier sesión autenticada | `POST /api/session/visit` → nuevo JWT con `visit:true`, misma caducidad |
| **Apagar** modo visita | solo quien tenga la clave de acceso | `POST /api/session/visit` con `access_key` → nuevo JWT sin el claim |

**Por qué en el JWT:** sobrevive a la recarga (le pasas el móvil y no se cae solo), no se desactiva
desde las devtools, y reutiliza el emisor de tokens de **ADR-028** sin tocar `authenticate()` — que
sigue aceptando exclusivamente JWT firmados con `JWT_SECRET`. No se añade un segundo mecanismo de
auth: se añade un claim. Reutiliza también el rate limit existente (10/min).

## 6. Alcance: qué se oculta

| Módulo | Qué se vacía en modo visita |
|---|---|
| **VAULT** | entries clasificadas y sus files: imagen, título, nota, lugar, tags |
| **MUSIC LAB** | tracks/playlists clasificados: título, artista, portada. **El audio no suena**: sin `r2_key` no hay reproducción, sin tocar el motor único (🔒-3) |
| **CAPSULES** | cápsulas clasificadas y su contenido; las bloqueadas por fecha siguen su propia regla, que no se toca |
| **DROPS** | drops clasificados: mensaje y destinatario |
| **TIMELINE / RECAP** | ⚠️ **crítico** — se alimentan de `events` (ADR-019) y los eventos llevan títulos saneados. Si no se filtran, el Timeline canta lo que el VAULT oculta. El agregador debe respetar el claim `visit` |

Ese último punto es el fallo no obvio de esta feature: censurar el VAULT y olvidar el feed deja la
puerta abierta de par en par. Se prueba explícitamente en el DoD, no se confía en que se recuerde.

**Los recuentos no mienten a la baja:** en modo visita los contadores siguen incluyendo lo
clasificado. La app se ve llena — que era el motivo de elegir desenfoque sobre desaparición.

## 7. Cómo se marca

- **Uno a uno:** acción en el lightbox / ficha del ítem.
- **En lote:** desde el panel admin (`DISENO_PANEL_ADMIN_2026-08-04.md`) — por era, por tag o por
  selección múltiple. Con 527 fotos, marcar a mano no es una opción.
- **Por defecto:** nada nace clasificado. La app se comporta igual que hoy hasta que Edu marque
  algo.

## 8. Eventos (ADR-019 🔒, sin agregadores paralelos)

Cuatro tipos nuevos en `events`: `visit_mode_on`, `visit_mode_off`, `item_classified`,
`item_unclassified`. El de apagado importa: deja rastro de cuándo se destapó el búnker y quién.

## 9. ADR propuesto

**ADR-029 — Modo Visita y clasificación de contenido** (BORRADOR, pendiente OK de Edu):

> El contenido puede marcarse como *clasificado*, concepto ortogonal a los prefijos R2 sensibles.
> Una sesión entra en *modo visita* mediante un claim `visit` en el JWT emitido por el mecanismo de
> ADR-028; encenderlo es libre, apagarlo exige clave de acceso. **La censura se aplica en el
> Worker**: el contenido clasificado se devuelve vaciado, nunca viaja al cliente, y se representa
> mediante `blurhash`. El agregador de eventos (ADR-019) respeta el claim.

## 10. Riesgos y trampas

1. **Filtración por el feed** (§6) — el error más probable de toda la feature.
2. **Backfill de blurhash de 527 archivos:** mientras no exista, esos ítems se pintan con tesela
   esmerilada temática + fecha. Degradación aceptable, no bloqueante.
3. **URLs firmadas ya emitidas:** un token HMAC entregado antes de encender el modo sigue válido
   hasta expirar. Aceptable por su TTL corto, pero se documenta.
4. **Caché del Service Worker:** `/api/` nunca se cachea (G7 ✅ verificado), así que no sirve
   respuestas pre-visita. Falta verificar que no queden imágenes del VAULT cacheadas.
5. **No confundir con las cápsulas bloqueadas por fecha:** mecanismo distinto, intacto.

## 11. Propuesta opcional (decide Edu, no se implementa sin su OK)

**Clave de demostración.** Un tercer secret `DEMO_ACCESS_KEY` que emite siempre un JWT con
`visit:true` **y sin poder apagarlo**. Efecto: mandas la URL y esa clave a alguien —un reclutador—
y ve el Búnker entero funcionando, con todo lo íntimo desenfocado, sin tocar tu sesión.
Nota de contrato: ADR-006 fija tres usuarios en whitelist, así que esa clave tendría que atarse a
un usuario existente o exigir enmienda del ADR. **[DECISION-EDU]**
