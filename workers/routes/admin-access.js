// ============================================================
//  EL BÚNKER — workers/routes/admin-access.js
//  Consola de ACCESOS (B6) — revocación de sesiones por epoch
//  de usuario (ADR-031, opción d del diseño DISENO_REVOCACION_JWT).
//  · GET  /api/admin/access               — los 3 usuarios whitelist (ADR-006):
//    métodos de entrada observados, último acceso (IP/UA truncados),
//    token_epoch actual y si tienen clave configurada. Nunca el valor
//    de una clave: el booleano sale del binding por usuario, no del secret.
//  · POST /api/admin/access/:userId/revoke — incrementa users.token_epoch.
//    Todas las sesiones de ese usuario mueren en el acto (el claim `epoch`
//    del JWT deja de coincidir). Emite auth_revoked {by, target, reason}.
//    Repetirlo vuelve a subir el contador: es seguro llamarlo dos veces.
//  · GET  /api/admin/access/logins       — lector de events filtrado a
//    auth_login / auth_revoked / visit_mode_on / visit_mode_off, con
//    filtros de usuario y fecha y paginación. Cliente del motor (ADR-019).
//  Solo admin: 401 sin identidad, 403 sin rol admin, antes de tocar D1.
//  NO rota secrets por API: eso es wrangler secret put, fuera de la app
//  (diseño §6.1). Rotar + revocar sí es revocación completa; rotar solo no.
// ============================================================

import { WHITELIST } from "../config.js";
import { json, err } from "../utils/response.js";
import requireAdmin from "../utils/require-admin.js";
import { emitEvent } from "../utils/events.js";
import { ACCESS_KEY_BINDINGS, MIN_KEY_LENGTH } from "../utils/access-keys.js";

const WHITELIST_IDS = Object.values(WHITELIST); // ['admin', 'edu', 'david'] (ADR-006)

// Tipos de la traza de ACCESOS: entradas, revocaciones y modo visita.
const ACCESS_EVENT_TYPES = ["auth_login", "auth_revoked", "visit_mode_on", "visit_mode_off"];

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const MAX_UA_LENGTH = 80;

/** ¿El usuario tiene clave de acceso configurada? Por binding (access-keys.js),
 *  nunca por el valor: devuelve booleano, no el secret (diseño §6.1). */
function hasKeyConfiguredFor(env, userId) {
  const binding = ACCESS_KEY_BINDINGS.find((entry) => entry.userId === userId);
  if (!binding) return false;
  const value = env?.[binding.secret];
  return typeof value === "string" && value.length >= MIN_KEY_LENGTH;
}

/** Métodos de entrada observados y último acceso (ip/ua/at) desde auth_login. */
async function loginProfile(db, userId) {
  const { results } = await db.prepare(
    `SELECT payload, created_at FROM events
      WHERE event_type = 'auth_login' AND user_id = ?1
      ORDER BY created_at DESC, id DESC
      LIMIT 100`
  ).bind(userId).all();
  const methods = [];
  let lastLogin = null;
  for (const row of results) {
    let parsed = {};
    try { parsed = JSON.parse(row.payload ?? "{}"); } catch { /* payload inválido: perfil vacío */ }
    if (parsed?.method && !methods.includes(parsed.method)) methods.push(parsed.method);
    if (!lastLogin) {
      lastLogin = {
        at: row.created_at,
        ip: typeof parsed?.ip === "string" ? parsed.ip : null,
        ua: typeof parsed?.ua === "string" ? parsed.ua.slice(0, MAX_UA_LENGTH) : null,
      };
    }
  }
  return { methods, lastLogin };
}

/** GET /api/admin/access — los usuarios de la whitelist con su perfil de acceso. */
async function handleListUsers(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, email, name, role, token_epoch FROM users"
  ).all();
  const users = [];
  for (const row of results) {
    if (!WHITELIST_IDS.includes(row.id)) continue; // solo whitelist (ADR-006)
    const { methods, lastLogin } = await loginProfile(env.DB, row.id);
    users.push({
      id: row.id,
      email: row.email,
      role: row.role,
      token_epoch: row.token_epoch,
      hasAccessKey: hasKeyConfiguredFor(env, row.id),
      methods,
      lastLogin,
    });
  }
  return json({ ok: true, readOnly: false, users });
}

/** POST /api/admin/access/:userId/revoke — incrementa el epoch (ADR-031). */
async function handleRevoke(request, env, url, userId) {
  const match = url.pathname.match(/^\/api\/admin\/access\/([^/]+)\/revoke$/);
  if (!match) return err("Not found", 404);
  const target = match[1];
  if (!WHITELIST_IDS.includes(target)) {
    return err("User not found", 404); // whitelist antes de tocar D1 (ADR-006)
  }

  let body = {};
  const rawBody = await request.text();
  if (rawBody) {
    try { body = JSON.parse(rawBody); }
    catch { return err("Invalid JSON body", 400); }
  }
  const reason = typeof body?.reason === "string" ? body.reason.slice(0, 200) : null;

  const updated = await env.DB.prepare(
    "UPDATE users SET token_epoch = token_epoch + 1 WHERE id = ?1"
  ).bind(target).run();
  const changes = Number(updated?.meta?.changes ?? 0);
  if (changes === 0) return err("User not found in D1", 404);

  const row = await env.DB.prepare(
    "SELECT token_epoch FROM users WHERE id = ?1"
  ).bind(target).first();

  await emitEvent(env, "auth_revoked", userId, "user", target, {
    by: userId,
    target,
    reason,
  });

  return json({ ok: true, userId: target, token_epoch: Number(row?.token_epoch ?? 0) });
}

/** GET /api/admin/access/logins — lector de la traza de ACCESOS (ADR-019). */
async function handleLogins(request, env, url) {
  const params = url.searchParams;
  const user = params.get("user");
  const since = params.get("since");
  const until = params.get("until");
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(params.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );
  const offset = (page - 1) * pageSize;

  // Binds: los 4 tipos fijos + filtros opcionales, numerados en orden.
  const binds = [...ACCESS_EVENT_TYPES];
  const push = (sql, value) => {
    if (value === undefined || value === null || value === "") return;
    binds.push(value);
    return sql.replace("?", `?${binds.length}`);
  };
  const clauses = [
    `event_type IN (?1, ?2, ?3, ?4)`,
    push("user_id = ?", user),
    push("created_at >= ?", since),
    push("created_at <= ?", until),
  ].filter(Boolean);
  const where = ` WHERE ${clauses.join(" AND ")}`;

  const countRow = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM events${where}`
  ).bind(...binds).first();
  const total = Number(countRow?.count ?? 0);

  const { results } = await env.DB.prepare(
    `SELECT id, event_type, user_id, entity_type, entity_id, payload, created_at
       FROM events${where}
      ORDER BY created_at DESC, id DESC
      LIMIT ?${binds.length + 1} OFFSET ?${binds.length + 2}`
  ).bind(...binds, pageSize, offset).all();

  return json({
    ok: true,
    readOnly: true,
    items: results,
    total,
    page,
    pageSize,
    generatedAt: new Date().toISOString(),
  });
}

export default async function handleAdminAccess(request, env, url, userId) {
  if (!userId) return err("Unauthorized", 401);
  const denied = requireAdmin(userId);
  if (denied) return denied;

  if (url.pathname === "/api/admin/access") {
    if (request.method !== "GET") return err("Method not allowed", 405);
    return handleListUsers(env);
  }
  if (url.pathname === "/api/admin/access/logins") {
    if (request.method !== "GET") return err("Method not allowed", 405);
    return handleLogins(request, env, url);
  }
  if (url.pathname.endsWith("/revoke")) {
    if (request.method !== "POST") return err("Method not allowed", 405);
    return handleRevoke(request, env, url, userId);
  }
  return err("Not found", 404);
}
