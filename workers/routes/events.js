// ============================================================
//  EL BÚNKER — workers/routes/events.js
//  GET/POST /api/events (auth required, ADR-019)
// ============================================================

import { json, err } from "../utils/response.js";
import { isValidEventType } from "../utils/validation.js";
import { isVisitMode, loadClassifiedIds } from "../utils/visit-filter.js";

const INTERNAL_EVENT_TYPES = new Set(["item_classified", "item_unclassified"]);

// A4 — En modo visita, los eventos que referencian una entidad clasificada se
// devuelven sin los campos que identifican contenido (título, nota, mensaje,
// destinatario...). El evento sigue en el feed — la app se ve llena, diseño §6 —
// solo se vacía lo que identificaría el contenido oculto.
const ENTITY_TO_ITEM_TYPE = {
  entry: "entry",
  track: "track",
  drop: "drop",
  playlist: "playlist",
  capsule: "capsule",
  time_capsule: "capsule", // el servidor escribe time_capsule; classified_items usa capsule
};
const STRIP_FIELDS = new Set(["title", "name", "content", "to_user"]);

async function stripClassifiedPayloads(events, env, request) {
  if (!isVisitMode(request)) return events;
  const byType = new Map();
  for (const ev of events) {
    const itemType = ENTITY_TO_ITEM_TYPE[ev.entity_type];
    if (!itemType || !ev.entity_id) continue;
    if (!byType.has(itemType)) byType.set(itemType, []);
    byType.get(itemType).push(ev.entity_id);
  }
  const classified = new Map();
  for (const [itemType, ids] of byType) {
    const found = await loadClassifiedIds(env, itemType, ids);
    for (const id of found) classified.set(`${itemType}:${id}`, true);
  }
  if (!classified.size) return events;
  return events.map((ev) => {
    const itemType = ENTITY_TO_ITEM_TYPE[ev.entity_type];
    if (!itemType || !classified.has(`${itemType}:${ev.entity_id}`)) return ev;
    if (typeof ev.payload !== "string") return ev;
    let payload;
    try { payload = JSON.parse(ev.payload); } catch { return ev; }
    if (!payload || typeof payload !== "object") return ev;
    let changed = false;
    const clean = {};
    for (const [k, v] of Object.entries(payload)) {
      if (STRIP_FIELDS.has(k)) { changed = true; continue; }
      clean[k] = v;
    }
    if (!changed) return ev;
    return { ...ev, payload: JSON.stringify(clean) };
  });
}

export default async function handleEvents(request, env, url, userId) {
  const method = request.method;

  if (!userId) return err("Unauthorized", 401);

  // POST /api/events
  if (method === "POST" && url.pathname === "/api/events") {
    const body = await request.json().catch(() => null);
    if (!body) return err("Invalid JSON body", 400);
    if (!isValidEventType(body.event_type)) return err("Invalid event_type: not a known app event", 400);
    if (INTERNAL_EVENT_TYPES.has(body.event_type)) {
      return err("Forbidden — internal event", 403);
    }
    const payload = JSON.stringify(body.payload || {});
    if (payload.length > 4096) return err("Payload too large (max 4KB)", 413);
    await env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,?3,?4,?5)"
    ).bind(body.event_type, userId, body.entity_type || null, body.entity_id || null, payload).run();
    return json({ ok: true, event_type: body.event_type }, 201);
  }

  // GET /api/events
  if (method === "GET" && url.pathname === "/api/events") {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
    const type = url.searchParams.get("type");
    const since = url.searchParams.get("since");
    const until = url.searchParams.get("until");
    let q = "SELECT * FROM events WHERE 1=1";
    const binds = [];
    if (type) {
      q += " AND event_type = ?1";
      binds.push(type);
    } else {
      // ADR-028: la auditoría de login no es feed. Solo sale si se pide por ?type=.
      q += " AND event_type NOT LIKE 'auth\\_%' ESCAPE '\\'";
    }
    if (since) { q += ` AND created_at >= ?${binds.length + 1}`; binds.push(since); }
    if (until) { q += ` AND created_at <= ?${binds.length + 1}`; binds.push(until); }
    q += ` ORDER BY created_at DESC LIMIT ?${binds.length + 1}`;
    binds.push(limit);
    const { results } = await env.DB.prepare(q).bind(...binds).all();
    // A4: en modo visita, vaciar lo clasificado del feed (diseño §6).
    return json(await stripClassifiedPayloads(results, env, request));
  }

  return err("Not found", 404);
}
