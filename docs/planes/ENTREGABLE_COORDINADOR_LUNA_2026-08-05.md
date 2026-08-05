# Entregable para coordinador — Luna — 2026-08-05

## Solicitud de Edu

Edu pidió terminar lo pendiente de la entrega anterior y dejar explícito al coordinador si alguna acción quedaba fuera de contrato. Por esa petición se ejecutó, además del alcance original de A1 y B2, un contenedor separado de integración en `plan-cierre-hermes-2026-08-04`.

## Dentro de contrato Luna

- **A1**, tarjeta `t_6a19ff8b`, commit `e74e122`, board `done`: `classified_items`, `files.blurhash`, `classify.js`, rollback local y tests. Migración aplicada/revertida en D1 local; rama `191/191`, lint/build/sintaxis/diff-check verdes.
- **B2**, tarjeta `t_be0de816`, commit `8387460`, board `done`: `require-admin.js`, `admin.js` y tests. Admin atraviesa al placeholder; Edu/David reciben 403 antes de `DB.prepare()`; rama `182/182`, lint/build/sintaxis/diff-check verdes.

## Fuera de contrato original — ejecutado por petición expresa de Edu

Las tarjetas A1/B2 prohibían tocar `workers/worker.js`, la whitelist global y los metadatos de versión. Este bloque no se atribuye a A1/B2: se hizo ahora porque Edu pidió terminar la integración pendiente.

1. `workers/worker.js`: registro de `classify.js` y `admin.js`.
2. Precedencia conservada: `/api/admin/g2` antes de `/api/admin/`.
3. `workers/utils/validation.js`: eventos `item_classified` e `item_unclassified`.
4. `workers/schema.sql`: versión `1.1.0`.
5. `migrations/0003_schema_version_1_1_0.sql`: actualización de `app_config` en bases existentes.
6. `workers/__tests__/router-contract.test.js`: contrato de wiring, auth y whitelist.

Este bloque requiere revisión del coordinador como **integración fuera de contrato solicitada por Edu**. Quedó materializado en el commit separado `3ee54dc` (`feat: integrate Luna admin and classification routes`), distinto de los commits Luna, y no incluye la lógica de B1.

## B1 / Opus

B1 sigue `running`. Opus avanzó hasta `apiClient` (`2ab6951`) y un contrato ejecutable de tests (`4bc8ec7`), pero no hay entrega final de `admin-core`; no se integra ni se presenta como terminado.

## Validación y límites

- Suite principal: **202/202** tests.
- Lint, build y sintaxis de Worker: PASS.
- Migración local fresca: `schema_version=1.1.0`, `classified_items` y `files.blurhash` presentes.
- Contrato de wiring estático: handlers concretos y precedencia `/api/admin/g2` antes de `/api/admin/` verificadas.
- Diff staged: PASS con `core.whitespace=cr-at-eol` (el archivo histórico `worker.js` usa CRLF).
- No hubo deploy, push ni mutación remota D1/R2.

El test de wiring es deliberadamente estático: verifica la matriz de rutas y sus handlers, no una ejecución remota del dispatcher. El coordinador debe revisar el commit `3ee54dc` como integración fuera de contrato solicitada por Edu.
