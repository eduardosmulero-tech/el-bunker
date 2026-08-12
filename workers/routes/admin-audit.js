// ============================================================
//  EL BÚNKER — workers/routes/admin-audit.js
//  GET /api/admin/audit — consola de AUDITORÍA (B5)
//  Lectora de la tabla events (stats engine único, ADR-019:
//  prohibido agregador paralelo; este endpoint solo LEE events).
//  Filtros de auditoría por tipo, usuario y fecha, con paginación.
//  Solo lectura y solo admin: 401 sin identidad, 403 sin rol admin,
//  siempre antes de tocar D1.
// ============================================================

import { isAdmin } from "../utils/authorization.js";
import { json, err } from "../utils/response.js";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

// Filtros de auditoría opcionales → cláusula WHERE con binds numerados.
function buildWhereClause(filters) {
  const clauses = [];
  const binds = [];
  const push = (sql, value) => {
    if (value === undefined || value === null || value === "") return;
    clauses.push(sql.replace("?", `?${binds.length + 1}`));
    binds.push(value);
  };
  push("event_type = ?", filters.type);
  push("user_id = ?", filters.user);
  push("created_at >= ?", filters.since);
  push("created_at <= ?", filters.until);
  const where = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
  return { where, binds };
}

/** GET /api/admin/audit — admin-only, read-only lecturas de events (B5). */
export default async function handleAdminAudit(request, env, url, userId) {
  if (request.method !== "GET" || url.pathname !== "/api/admin/audit") {
    return err("Not found", 404);
  }
  if (!userId) return err("Unauthorized", 401);
  if (!isAdmin(userId)) return err("Forbidden — admin required", 403);

  const params = url.searchParams;
  const type = params.get("type");
  const user = params.get("user");
  const since = params.get("since");
  const until = params.get("until");
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(params.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );
  const offset = (page - 1) * pageSize;

  const { where, binds } = buildWhereClause({ type, user, since, until });

  // Total primero (misma cláusula WHERE, mismo orden de binds).
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
