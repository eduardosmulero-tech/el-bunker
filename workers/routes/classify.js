// Modo Visita A1 — clasificación admin de contenido.

import { json, err } from "../utils/response.js";
import { isAdmin } from "../utils/authorization.js";

const ITEM_TYPES = new Set(["entry", "file", "track", "playlist", "capsule", "drop"]);
// Each item produces one mutation and one audit statement; stay within D1 batch limits.
const MAX_ITEM_IDS = 50;
const MAX_ID_LENGTH = 256;

function validId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

function parseSelector(body, path) {
  const pathParts = path.split("/").filter(Boolean);
  const pathType = pathParts[2];
  const pathId = pathParts[3];
  const itemType = body?.item_type || pathType;
  const selectors = [];

  if (pathType !== undefined && body?.item_type !== undefined && body.item_type !== pathType) {
    return { itemType, selectors, error: "item_type does not match the path" };
  }
  if (pathId !== undefined) selectors.push({ kind: "item_ids", value: [pathId] });
  if (Array.isArray(body?.item_ids)) selectors.push({ kind: "item_ids", value: body.item_ids });
  if (body?.item_id !== undefined) selectors.push({ kind: "item_ids", value: [body.item_id] });
  if (body?.era_id !== undefined) selectors.push({ kind: "era_id", value: body.era_id });
  if (body?.tag_id !== undefined) selectors.push({ kind: "tag_id", value: body.tag_id });

  return { itemType, selectors, error: null };
}

function validateSelector(itemType, selector) {
  if (!ITEM_TYPES.has(itemType)) return "item_type must be entry, file, track, playlist, capsule, or drop";
  if (selector.kind === "item_ids") {
    if (!Array.isArray(selector.value) || selector.value.length > MAX_ITEM_IDS || selector.value.length === 0) {
      return `item_ids must contain 1-${MAX_ITEM_IDS} IDs`;
    }
    if (selector.value.some(id => !validId(id))) return "item_ids contains an invalid ID";
    return null;
  }
  if (!validId(selector.value)) return `${selector.kind} is required and invalid`;
  if (selector.kind === "era_id" && !["entry", "file", "track", "drop"].includes(itemType)) {
    return "era_id is not supported for this item_type";
  }
  if (selector.kind === "tag_id" && !["entry", "file", "track"].includes(itemType)) {
    return "tag_id is not supported for this item_type";
  }
  return null;
}

function selectionQuery(itemType, kind) {
  if (kind === "era_id") {
    if (itemType === "entry") return "SELECT id FROM entries WHERE era_id = ?1 AND is_deleted = 0";
    if (itemType === "track") return "SELECT id FROM tracks WHERE era_id = ?1 AND is_deleted = 0";
    if (itemType === "drop") return "SELECT id FROM drops WHERE era_id = ?1";
    return "SELECT f.id FROM files f LEFT JOIN entries e ON e.id = f.entry_id LEFT JOIN tracks t ON t.id = f.track_id WHERE (e.era_id = ?1 AND e.is_deleted = 0) OR (t.era_id = ?1 AND t.is_deleted = 0)";
  }
  if (itemType === "entry") return "SELECT DISTINCT et.entry_id AS id FROM entry_tags et JOIN entries e ON e.id = et.entry_id WHERE et.tag_id = ?1 AND e.is_deleted = 0";
  if (itemType === "track") return "SELECT DISTINCT tt.track_id AS id FROM track_tags tt JOIN tracks t ON t.id = tt.track_id WHERE tt.tag_id = ?1 AND t.is_deleted = 0";
  return "SELECT DISTINCT f.id FROM files f LEFT JOIN entries e ON e.id = f.entry_id LEFT JOIN entry_tags et ON et.entry_id = e.id LEFT JOIN tracks t ON t.id = f.track_id LEFT JOIN track_tags tt ON tt.track_id = t.id WHERE (et.tag_id = ?1 AND e.is_deleted = 0) OR (tt.tag_id = ?1 AND t.is_deleted = 0)";
}

async function resolveIds(env, itemType, selector) {
  if (selector.kind === "item_ids") return [...new Set(selector.value)];
  const { results = [] } = await env.DB.prepare(selectionQuery(itemType, selector.kind)).bind(selector.value).all();
  return [...new Set(results.map(row => row.id).filter(validId))].slice(0, MAX_ITEM_IDS);
}

function mutationStatements(env, action, itemType, itemIds, markedBy) {
  const now = Date.now();
  return itemIds.flatMap(itemId => {
    const mutation = action === "classify"
      ? env.DB.prepare(
        "INSERT OR IGNORE INTO classified_items (item_type, item_id, marked_by, marked_at) VALUES (?1,?2,?3,?4)"
      ).bind(itemType, itemId, markedBy, now)
      : env.DB.prepare("DELETE FROM classified_items WHERE item_type = ?1 AND item_id = ?2").bind(itemType, itemId);
    const event = env.DB.prepare(
      "INSERT INTO events (event_type, user_id, entity_type, entity_id, payload) VALUES (?1,?2,?3,?4,?5)"
    ).bind(
      action === "classify" ? "item_classified" : "item_unclassified",
      markedBy,
      itemType,
      itemId,
      JSON.stringify({ item_type: itemType, item_id: itemId }),
    );
    return [mutation, event];
  });
}

export default async function handleClassify(request, env, url, userId) {
  if (!userId) return err("Unauthorized", 401);
  if (!isAdmin(userId)) return err("Forbidden — only admin can classify items", 403);
  if (!["POST", "DELETE"].includes(request.method)) return err("Not found", 404);
  const isCollectionPath = url.pathname === "/api/classify" || url.pathname === "/api/classify/";
  const isItemPath = /^\/api\/classify\/[^/]+\/[^/]+$/.test(url.pathname);
  if (!isCollectionPath && !isItemPath) return err("Not found", 404);

  const rawBody = await request.text();
  let body = {};
  if (rawBody) {
    try { body = JSON.parse(rawBody); }
    catch { return err("Invalid JSON body", 400); }
  }
  const { itemType, selectors, error: selectorPathError } = parseSelector(body, url.pathname);
  if (selectorPathError) return err(selectorPathError, 400);
  if (selectors.length !== 1) return err("Provide exactly one selector: item_id, item_ids, era_id, or tag_id", 400);
  const selectorError = validateSelector(itemType, selectors[0]);
  if (selectorError) return err(selectorError, 400);

  const itemIds = await resolveIds(env, itemType, selectors[0]);
  if (!itemIds.length) return json({ ok: true, action: request.method === "POST" ? "classify" : "unclassify", item_type: itemType, item_ids: [], count: 0 });

  await env.DB.batch(mutationStatements(env, request.method === "POST" ? "classify" : "unclassify", itemType, itemIds, userId));
  return json({
    ok: true,
    action: request.method === "POST" ? "classify" : "unclassify",
    item_type: itemType,
    item_ids: itemIds,
    count: itemIds.length,
  });
}
