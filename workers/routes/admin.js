import { json, err } from "../utils/response.js";
import requireAdmin from "../utils/require-admin.js";

const RESOURCE_CONFIG = {
  entries: {
    key: "entry", table: "entries", alias: "e", id: "id",
    active: "e.is_deleted = 0",
    search: ["e.title", "e.type", "e.content"],
    filters: ["era_id", "type"],
    sort: ["title", "era_id", "type", "created_at", "updated_at"],
    fields: ["era_id", "type", "title", "content", "to_user"],
    createRequired: ["title"],
  },
  tracks: {
    key: "track", table: "tracks", alias: "t", id: "id",
    active: "t.is_deleted = 0",
    search: ["t.title", "t.artist", "t.note"],
    filters: ["era_id"],
    sort: ["title", "artist", "era_id", "duration", "created_at", "updated_at"],
    fields: ["era_id", "title", "artist", "tag_id", "format", "note", "duration", "thumbnail", "color"],
    createRequired: ["title"],
  },
  eras: {
    key: "era", table: "eras", alias: "r", id: "id",
    active: "1 = 1",
    search: ["r.name", "r.description"],
    filters: [],
    sort: ["name", "start_date", "end_date", "sort_order", "created_at", "updated_at"],
    fields: ["name", "description", "start_date", "end_date", "color", "cover_image", "sort_order"],
    createRequired: ["name"],
  },
  capsules: {
    key: "capsule", table: "time_capsules", alias: "c", id: "id",
    active: "1 = 1",
    search: ["c.title", "c.description"],
    filters: [],
    sort: ["title", "unlock_at", "is_unlocked", "created_at"],
    fields: ["title", "description", "unlock_at"],
    createRequired: ["title", "unlock_at"],
  },
  drops: {
    key: "drop", table: "drops", alias: "d", id: "id",
    active: "1 = 1",
    search: ["d.memory", "d.mood", "d.from_user", "d.to_user"],
    filters: ["mood", "from_user", "to_user", "era_id"],
    sort: ["drop_date", "created_at", "from_user", "to_user", "mood"],
    fields: ["era_id", "track_id", "to_user", "drop_date", "memory", "mood", "seen", "favorited"],
    createRequired: [],
  },
  playlists: {
    key: "playlist", table: "playlists", alias: "p", id: "id",
    active: "1 = 1",
    search: ["p.name", "p.description"],
    filters: [],
    sort: ["name", "description", "sort_order", "created_at", "updated_at"],
    fields: ["name", "description", "sort_order"],
    createRequired: ["name"],
  },
  files: {
    key: "file", table: "files", alias: "f", id: "id",
    active: "1 = 1",
    search: ["f.filename", "f.prefix", "f.mime_type", "f.r2_key"],
    filters: ["prefix", "mime_type"],
    sort: ["filename", "prefix", "mime_type", "size_bytes", "created_at"],
    fields: ["entry_id", "track_id", "r2_key", "r2_bucket", "prefix", "filename", "mime_type", "size_bytes", "blurhash"],
    createRequired: ["filename", "prefix"],
  },
};

const PAGE_SIZE_MAX = 100;
const MAX_QUERY_LENGTH = 120;

function resourceFor(url) {
  const match = url.pathname.match(/^\/api\/admin\/([^/]+)(?:\/([^/]+)(?:\/([^/]+))?)?$/);
  if (!match) return null;
  const [, name, id, action] = match;
  const config = RESOURCE_CONFIG[name];
  return config ? { name, id, action, config } : null;
}

function safeInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

function selectSql(config) {
  const a = config.alias;
  return `SELECT ${a}.*, CASE WHEN ci.item_id IS NULL THEN 0 ELSE 1 END AS classified
    FROM ${config.table} ${a}
    LEFT JOIN classified_items ci ON ci.item_type = '${config.key}' AND ci.item_id = ${a}.id`;
}

function buildWhere(config, url) {
  const clauses = [config.active];
  const binds = [];
  const q = (url.searchParams.get("q") || "").trim().slice(0, MAX_QUERY_LENGTH);
  if (q) {
    const like = `%${q.toLowerCase()}%`;
    clauses.push(`(${config.search.map((column) => `LOWER(COALESCE(${column}, '')) LIKE ?`).join(" OR ")})`);
    binds.push(...config.search.map(() => like));
  }
  for (const field of config.filters) {
    const value = url.searchParams.get(field);
    if (value) {
      clauses.push(`${config.alias}.${field} = ?`);
      binds.push(value.slice(0, 256));
    }
  }
  return { where: clauses.join(" AND "), binds };
}

function orderBy(config, url) {
  const requested = url.searchParams.get("sort");
  const sort = config.sort.includes(requested) ? requested : "created_at";
  const direction = url.searchParams.get("dir") === "asc" ? "ASC" : "DESC";
  return `${config.alias}.${sort} ${direction}`;
}

function readBody(request) {
  return request.json().catch(() => null);
}

function allowedFields(config, body) {
  return Object.entries(body || {})
    .filter(([key, value]) => config.fields.includes(key) && value !== undefined)
    .map(([key, value]) => [key, key === "content" && typeof value !== "string" ? JSON.stringify(value) : value]);
}

async function audit(env, userId, action, resource, id, snapshot = null) {
  const payload = JSON.stringify({
    resource,
    item_id: id,
    snapshot,
  });
  // Admin mutations are deliberately recorded in the canonical append-only
  // events table; the admin panel is a client of the existing event engine.
  await env.DB.prepare(
    "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,?3,?4,?5)"
  ).bind(`admin_${action}`, userId, resource, id, payload).run();
}

async function listResource(request, env, url, config) {
  const page = safeInteger(url.searchParams.get("page"), 1, 1, 10_000);
  const pageSize = safeInteger(url.searchParams.get("pageSize"), 25, 1, PAGE_SIZE_MAX);
  const { where, binds } = buildWhere(config, url);
  const count = await env.DB.prepare(
    `SELECT COUNT(*) AS total FROM ${config.table} ${config.alias} WHERE ${where}`
  ).bind(...binds).first();
  const offset = (page - 1) * pageSize;
  const rows = await env.DB.prepare(
    `${selectSql(config)} WHERE ${where} ORDER BY ${orderBy(config, url)} LIMIT ? OFFSET ?`
  ).bind(...binds, pageSize, offset).all();
  return json({
    items: rows.results || [],
    total: Number(count?.total ?? 0),
    page,
    pageSize,
  });
}

async function createResource(request, env, url, userId, resource) {
  const body = await readBody(request);
  if (!body || typeof body !== "object") return err("Invalid JSON body", 400);
  for (const field of resource.config.createRequired) {
    if (body[field] == null || String(body[field]).trim() === "") return err(`${field} is required`, 400);
  }
  const id = body.id || crypto.randomUUID();
  const now = body.created_at || new Date().toISOString();
  const fields = allowedFields(resource.config, body);
  const ownerFields = {
    entries: ["from_user", userId],
    tracks: ["added_by", userId],
    capsules: ["created_by", userId],
    playlists: ["created_by", userId],
    drops: ["from_user", userId],
    files: ["uploaded_by", userId],
    eras: null,
  };
  const owner = ownerFields[resource.name];
  if (owner) {
    const [ownerKey, ownerValue] = owner;
    if (!fields.some(([key]) => key === ownerKey)) fields.push([ownerKey, ownerValue]);
  }
  if (resource.name === "entries" && !fields.some(([key]) => key === "to_user")) fields.push(["to_user", "both"]);
  if (resource.name === "drops" && !fields.some(([key]) => key === "to_user")) return err("to_user is required", 400);
  if (resource.name === "entries" && !fields.some(([key]) => key === "type")) fields.push(["type", "note"]);
  if (resource.name === "entries" && !fields.some(([key]) => key === "content")) fields.push(["content", "{}"]) ;
  if (resource.name === "files" && !fields.some(([key]) => key === "r2_bucket")) fields.push(["r2_bucket", "el-bunker-music"]);
  if (!fields.some(([key]) => key === "created_at")) fields.push(["created_at", now]);
  if (["entries", "tracks", "capsules", "playlists", "eras"].includes(resource.name) && !fields.some(([key]) => key === "updated_at")) fields.push(["updated_at", now]);
  const columns = ["id", ...fields.map(([key]) => key)];
  const values = [id, ...fields.map(([, value]) => value)];
  const placeholders = columns.map((_, index) => `?${index + 1}`).join(",");
  await env.DB.prepare(
    `INSERT INTO ${resource.config.table} (${columns.join(",")}) VALUES (${placeholders})`
  ).bind(...values).run();
  await audit(env, userId, "created", resource.name, id, null);
  return json({ id, ...Object.fromEntries(fields) }, 201);
}

async function findResource(env, resource, id) {
  return env.DB.prepare(`SELECT * FROM ${resource.config.table} WHERE id = ?1`).bind(id).first();
}

async function updateResource(request, env, userId, resource, id) {
  const current = await findResource(env, resource, id);
  if (!current) return err("Resource not found", 404);
  const fields = allowedFields(resource.config, await readBody(request));
  if (!fields.length) return err("No fields to update", 400);
  const sets = fields.map(([key], index) => `${key} = ?${index + 1}`);
  const values = fields.map(([, value]) => value);
  const updatedAt = ["entries", "tracks", "capsules", "playlists", "eras"].includes(resource.name);
  if (updatedAt) sets.push(`updated_at = datetime('now')`);
  values.push(id);
  await env.DB.prepare(
    `UPDATE ${resource.config.table} SET ${sets.join(", ")} WHERE id = ?${values.length}`
  ).bind(...values).run();
  await audit(env, userId, "updated", resource.name, id, current);
  return json({ id, ...Object.fromEntries(fields) });
}

async function deleteResource(env, userId, resource, id) {
  const current = await findResource(env, resource, id);
  if (!current) return err("Resource not found", 404);
  if (["entries", "tracks"].includes(resource.name)) {
    await env.DB.prepare(
      `UPDATE ${resource.config.table} SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?1`
    ).bind(id).run();
  } else {
    await env.DB.prepare(`DELETE FROM ${resource.config.table} WHERE id = ?1`).bind(id).run();
  }
  await audit(env, userId, "deleted", resource.name, id, current);
  return json({ ok: true, id });
}

async function classifyResource(env, userId, resource, id, action) {
  if (resource.name === "eras") return err("Classification is not supported for eras", 400);
  const current = await findResource(env, resource, id);
  if (!current) return err("Resource not found", 404);
  if (action === "classify") {
    await env.DB.prepare(
      "INSERT OR REPLACE INTO classified_items (item_type, item_id, marked_by, marked_at) VALUES (?1,?2,?3,?4)"
    ).bind(resource.config.key, id, userId, Date.now()).run();
  } else {
    await env.DB.prepare("DELETE FROM classified_items WHERE item_type = ?1 AND item_id = ?2")
      .bind(resource.config.key, id).run();
  }
  await audit(env, userId, action, resource.name, id, null);
  return json({ ok: true, id, action });
}

export default async function handleAdmin(request, env, url, userId) {
  const denied = requireAdmin(userId);
  if (denied) return denied;
  const resource = resourceFor(url);
  if (!resource || resource.name === "g2" || !url.pathname.startsWith("/api/admin/")) return err("Not found", 404);
  if (resource.action && !resource.id) return err("Not found", 404);

  if (request.method === "GET" && !resource.id) return listResource(request, env, url, resource.config);
  if (request.method === "POST" && !resource.id) return createResource(request, env, url, userId, resource);
  if (request.method === "PATCH" && resource.id && !resource.action) return updateResource(request, env, userId, resource, resource.id);
  if (request.method === "DELETE" && resource.id && !resource.action) return deleteResource(env, userId, resource, resource.id);
  if (request.method === "POST" && resource.id && ["classify", "unclassify"].includes(resource.action)) {
    return classifyResource(env, userId, resource, resource.id, resource.action);
  }
  return err("Not found", 404);
}
